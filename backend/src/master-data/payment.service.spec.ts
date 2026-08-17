import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BankTransaction } from '../entities/bank_transaction.entity';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn().mockImplementation((entity, dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  it('should block overpayment strictly', async () => {
    mockManager.findOne.mockResolvedValueOnce(null); // idempotency check
    mockManager.findOne.mockResolvedValueOnce({ id: 'ORD-1', totalAmount: 100 }); // order check
    mockManager.find.mockResolvedValueOnce([{ amount: 50 }]); // existing payments check

    mockManager.findOne.mockResolvedValueOnce(null); // idempotency check 2
    mockManager.findOne.mockResolvedValueOnce({ id: 'ORD-1', totalAmount: 100 }); // order check 2
    mockManager.find.mockResolvedValueOnce([{ amount: 50 }]); // existing payments check 2

    // Outstanding = 100 - 50 = 50. Trying to pay 60 should throw.
    await expect(service.registerPayment('ORD-1', 60, 'CASH', null, null, 'ID-1', 'USER-1'))
      .rejects.toThrow(BadRequestException);
    await expect(service.registerPayment('ORD-1', 60, 'CASH', null, null, 'ID-1', 'USER-1'))
      .rejects.toThrow(/Overpayment rejected/);
  });

  it('should post to bank ledger automatically for BANK_TRANSFER', async () => {
    mockManager.findOne.mockResolvedValueOnce(null); // idempotency check
    mockManager.findOne.mockResolvedValueOnce({ id: 'ORD-1', totalAmount: 100 }); // order check
    mockManager.find.mockResolvedValueOnce([]); // existing payments check
    mockManager.findOne.mockResolvedValueOnce({ id: 'BANK-1' }); // bank account check

    const result = await service.registerPayment('ORD-1', 100, 'BANK_TRANSFER', 'REF-123', 'BANK-1', 'ID-2', 'USER-1');
    
    expect(result.success).toBe(true);
    expect(mockManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ bankAccountId: 'BANK-1', amount: 100, sourceType: 'CUSTOMER_PAYMENT', referenceNote: 'REF-123' })
    );
  });
});
