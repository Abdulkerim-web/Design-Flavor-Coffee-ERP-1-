import { Test, TestingModule } from '@nestjs/testing';
import { RoastingService } from './roasting.service';
import { DataSource } from 'typeorm';
import { StockBalance } from '../entities/stock_balance.entity';
import { InventoryTransaction } from '../entities/inventory_transaction.entity';

describe('RoastingService', () => {
  let service: RoastingService;
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
        RoastingService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RoastingService>(RoastingService);
  });

  it('should prove failed batches consume green input but do not produce output', async () => {
    const mockBatch = {
      id: 'BATCH-1',
      status: 'in-progress',
      greenInputQuantity: 30,
      orderItem: { coffeeProductId: 'PROD-1' },
    };

    const mockStock = {
      itemId: 'PROD-1',
      itemType: 'GREEN',
      onHand: 100,
      reserved: 0,
      available: 100,
    };

    mockManager.findOne.mockResolvedValueOnce(mockBatch);
    mockManager.findOne.mockResolvedValueOnce(mockStock); // Find green stock

    // Complete the batch as FAILED
    const result = await service.completeBatch('BATCH-1', 'ROASTER-1', 0, true);

    expect(result.status).toBe('failed');
    expect(result.actualRoastedQuantity).toBe(0); // Zero output

    // Proves green input was still consumed (Inventory decremented)
    expect(mockStock.onHand).toBe(70); 
    expect(mockStock.available).toBe(70);

    // Proves transaction was written
    expect(mockManager.create).toHaveBeenCalledWith(
      InventoryTransaction,
      expect.objectContaining({ type: 'CONSUMPTION', quantity: 30 })
    );
  });
});
