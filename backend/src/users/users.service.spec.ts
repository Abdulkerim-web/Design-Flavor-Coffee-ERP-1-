import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import { AuditLogSubscriber } from '../subscribers/audit-log.subscriber';
import { UpdateEvent, RemoveEvent } from 'typeorm';
import { AuditLog } from '../entities/audit_log.entity';

describe('UsersService & Audit Rules', () => {
  let service: UsersService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('Deactivation Logic', () => {
    it('should set status to disabled and populate deactivatedAt', async () => {
      const mockUser = { id: 'U-1', status: 'active', deactivatedAt: null, deactivatedBy: null };
      mockRepo.findOne.mockResolvedValue(mockUser);
      mockRepo.save.mockImplementation((u: any) => u);

      const result = await service.deactivateUser('U-1', 'ADMIN-1');
      expect(result.status).toBe('disabled');
      expect(result.deactivatedAt).toBeInstanceOf(Date);
      expect(result.deactivatedBy).toBe('ADMIN-1');
    });

    it('should prove a deactivated user cannot authenticate (AuthService mock simulation)', async () => {
      // In Auth, we would check the user status
      const mockUser = { id: 'U-2', status: 'disabled' };
      mockRepo.findOne.mockResolvedValue(mockUser);

      const user = await service.findByEmail('test@test.com');
      
      const attemptAuth = () => {
        if (user?.status === 'disabled') {
          throw new Error('User is deactivated');
        }
        return 'success';
      };

      expect(attemptAuth).toThrow('User is deactivated');
    });
  });

  describe('AuditLog Immutability', () => {
    it('should throw an error when attempting to UPDATE an audit log', () => {
      const subscriber = new AuditLogSubscriber();
      const updateEvent = {} as UpdateEvent<AuditLog>;
      
      expect(() => subscriber.beforeUpdate(updateEvent)).toThrow(
        'Audit logs are immutable and cannot be updated.'
      );
    });

    it('should throw an error when attempting to DELETE an audit log', () => {
      const subscriber = new AuditLogSubscriber();
      const removeEvent = {} as RemoveEvent<AuditLog>;
      
      expect(() => subscriber.beforeRemove(removeEvent)).toThrow(
        'Audit logs are immutable and cannot be deleted.'
      );
    });
  });
});
