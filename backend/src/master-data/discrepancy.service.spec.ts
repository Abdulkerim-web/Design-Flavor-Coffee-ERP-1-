import { Test, TestingModule } from '@nestjs/testing';
import { DiscrepancyService } from './discrepancy.service';
import { DataSource } from 'typeorm';
import { InventoryTransaction } from '../entities/inventory_transaction.entity';
import { Discrepancy } from '../entities/discrepancy.entity';

describe('DiscrepancyService (Idempotency Rule)', () => {
  let service: DiscrepancyService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity, dto) => dto),
      save: jest.fn(),
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
        DiscrepancyService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DiscrepancyService>(DiscrepancyService);
  });

  it('should prevent double-submits from duplicating inventory (Idempotency)', async () => {
    // Simulate first call finding NO existing transaction
    mockManager.findOne
      .mockResolvedValueOnce(null) // No existing Tx
      .mockResolvedValueOnce({
        id: 'BATCH-1',
        status: 'completed',
        expectedRoastedQuantity: 50,
        orderItem: { coffeeProductId: 'PROD-1' }
      }) // Batch
      .mockResolvedValueOnce(null); // No existing stock

    const result1 = await service.confirmRoastedYield('BATCH-1', 'USER-1', 50, 'IDEMP-123');
    expect(result1.success).toBe(true);
    expect(mockManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ROASTING_YIELD' })
    );

    // Simulate second call (double click) finding the EXISTING transaction
    mockManager.findOne.mockReset();
    mockManager.save.mockClear();
    mockManager.findOne.mockResolvedValueOnce({ id: 'TX-1', type: 'ROASTING_YIELD' });

    const result2 = await service.confirmRoastedYield('BATCH-1', 'USER-1', 50, 'IDEMP-123');
    
    // It returns success but doesn't duplicate saves
    expect(result2.success).toBe(true);
    expect(result2.message).toBe('Already confirmed');
    
    // Ensure save was not called during the second run (only rollback)
    expect(mockManager.save).not.toHaveBeenCalled();
  });

  it('should flag a discrepancy if actual != expected', async () => {
    mockManager.findOne
      .mockResolvedValueOnce(null) // No existing Tx
      .mockResolvedValueOnce({
        id: 'BATCH-1',
        status: 'completed',
        expectedRoastedQuantity: 50,
        orderItem: { coffeeProductId: 'PROD-1' }
      }); // Batch

    const result = await service.confirmRoastedYield('BATCH-1', 'USER-1', 49.5, 'IDEMP-456');
    
    expect(result.success).toBe(false);
    expect(mockManager.create).toHaveBeenCalledWith(
      Discrepancy,
      expect.objectContaining({ actualQuantity: 49.5, expectedQuantity: 50 })
    );
  });
});
