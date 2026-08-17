import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { DataSource } from 'typeorm';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity, dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should create new notification if none exists', async () => {
    mockManager.findOne.mockResolvedValueOnce(null);

    await service.triggerNotification('USER-1', 'ALERT', 'REF-1', 'Message 1');

    expect(mockManager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ message: 'Message 1', referenceEntityId: 'REF-1' })
    );
  });

  it('should prevent spam by incrementing count if UNREAD exists', async () => {
    const existing = { id: 'NOTIF-1', triggerCount: 1, message: 'Old msg' };
    mockManager.findOne.mockResolvedValueOnce(existing);

    await service.triggerNotification('USER-1', 'ALERT', 'REF-1', 'New msg');

    expect(mockManager.create).not.toHaveBeenCalled();
    expect(existing.triggerCount).toBe(2);
    expect(existing.message).toBe('New msg');
    expect(mockManager.save).toHaveBeenCalledWith(existing);
  });
});
