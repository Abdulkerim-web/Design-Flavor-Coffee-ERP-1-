import { Test, TestingModule } from '@nestjs/testing';
import { BankLedgerService } from './bank_ledger.service';
import { DataSource } from 'typeorm';

describe('BankLedgerService', () => {
  let service: BankLedgerService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '150.50' }),
      }),
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
        BankLedgerService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BankLedgerService>(BankLedgerService);
  });

  it('should calculate bank balance dynamically from transactions', async () => {
    mockManager.findOne.mockResolvedValueOnce({ openingBalance: 1000 });
    // createQueryBuilder is mocked to return sum = 150.50

    const balance = await service.getCalculatedBalance('BANK-1');
    
    // 1000 + 150.50 = 1150.50
    expect(balance).toBe(1150.5);
  });
});
