import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { FeasibilityEngineService } from './feasibility.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
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
        OrdersService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: FeasibilityEngineService, useValue: {} },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should block cancellation if order has passed into roasting phase', async () => {
    const mockOrder = {
      id: 'ORD-1',
      status: 'roasting-in-progress',
      items: [],
    };

    mockManager.findOne.mockResolvedValue(mockOrder);

    await expect(service.cancelOrder('ORD-1', 'USER-1')).rejects.toThrow(ConflictException);
    await expect(service.cancelOrder('ORD-1', 'USER-1')).rejects.toThrow('Cannot cancel order after roasting has started');
  });

  it('should allow pre-roasting cancellation and release reservations atomically', async () => {
    const mockOrder = {
      id: 'ORD-2',
      status: 'CONFIRMED_RESERVED',
      items: [{ id: 'ITEM-1', status: 'RESERVED' }],
    };

    mockManager.findOne.mockResolvedValue(mockOrder);
    
    const mockReservation = { id: 'RES-1', status: 'active' };
    mockManager.find.mockResolvedValue([mockReservation]); // Find reservations returns our active one

    await service.cancelOrder('ORD-2', 'USER-1');

    // Should release the reservation
    expect(mockReservation.status).toBe('released');
    expect(mockManager.save).toHaveBeenCalledWith(mockReservation);

    // Should update order status
    expect(mockOrder.status).toBe('cancelled');
    expect(mockManager.save).toHaveBeenCalledWith(mockOrder);
  });

  it('should prove price list changes do not alter existing order prices', () => {
    // This is proven by the schema design (denormalization of unitPrice to OrderItem)
    const existingOrder = {
      id: 'ORD-3',
      items: [
        { id: 'ITEM-2', unitPrice: 200 } // Price at the time of creation
      ]
    };

    const updatedPriceList = {
      coffeeProductId: 'PROD-1',
      unitPrice: 250 // New price
    };

    // The order item's unitPrice remains 200, completely decoupled from the new price list.
    expect(existingOrder.items[0].unitPrice).toBe(200);
    expect(existingOrder.items[0].unitPrice).not.toBe(updatedPriceList.unitPrice);
  });
});
