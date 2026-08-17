import { Test, TestingModule } from '@nestjs/testing';
import { FulfillmentService } from './fulfillment.service';
import { DataSource } from 'typeorm';
import { OrderItem } from '../entities/order_item.entity';

describe('FulfillmentService (Partial Allocation)', () => {
  let service: FulfillmentService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
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
        FulfillmentService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FulfillmentService>(FulfillmentService);
  });

  it('should split an order item into two when partially fulfilled', async () => {
    const mockOrderItem = {
      id: 'ITEM-1',
      orderId: 'ORD-1',
      coffeeProductId: 'PROD-1',
      quantity: 50,
      unitPrice: 200,
      status: 'pending-confirmation',
      order: { customerId: 'CUST-1' }
    };

    const mockRoastedStock = {
      itemId: 'PROD-1',
      itemType: 'ROASTED',
      onHand: 30,
      reserved: 0,
      available: 30,
    };

    mockManager.findOne
      .mockResolvedValueOnce(mockOrderItem)
      .mockResolvedValueOnce(mockRoastedStock);

    await service.allocatePartialFulfillment('ITEM-1', 20, 'USER-1');

    // Original item is updated to 20
    expect(mockOrderItem.quantity).toBe(20);
    expect(mockOrderItem.status).toBe('ready-for-packing');
    expect(mockManager.save).toHaveBeenCalledWith(mockOrderItem);

    // New item is created for the remaining 30
    expect(mockManager.create).toHaveBeenCalledWith(
      OrderItem,
      expect.objectContaining({
        orderId: 'ORD-1',
        quantity: 30,
        status: 'pending-confirmation'
      })
    );

    // Reserved roasted stock increases
    expect(mockRoastedStock.reserved).toBe(20);
    expect(mockRoastedStock.available).toBe(10);
    expect(mockManager.save).toHaveBeenCalledWith(mockRoastedStock);
  });
});
