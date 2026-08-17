import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { DataSource } from 'typeorm';

describe('PayrollService', () => {
  let service: PayrollService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity, dto) => ({ id: 'MOCK-ID', ...dto })),
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
        PayrollService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
  });

  it('should sum payroll correctly with advance deductions', async () => {
    const lines = [
      { employeeUserId: 'EMP-1', baseSalaryAmount: 5000, advanceDeductionAmount: 1000 },
      { employeeUserId: 'EMP-2', baseSalaryAmount: 4000, advanceDeductionAmount: 0 },
    ];

    const result = await service.preparePayrollRun('2026-08-01', '2026-08-31', lines, 'HR-1');

    // Total should be (5000 - 1000) + (4000) = 8000
    expect(result.totalAmount).toBe(8000);
  });

  it('should withdraw from bank correctly when paid', async () => {
    mockManager.findOne
      .mockResolvedValueOnce({ id: 'RUN-1', status: 'pending-manager-approval', totalAmount: 8000 })
      .mockResolvedValueOnce({ id: 'BANK-1' });

    await service.payPayrollRun('RUN-1', 'MGR-1', 'BANK-1');

    expect(mockManager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        bankAccountId: 'BANK-1',
        amount: -8000, // Negative amount for withdrawal
        sourceType: 'PAYROLL'
      })
    );
  });
});
