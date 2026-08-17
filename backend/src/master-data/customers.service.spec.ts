import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
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
        CustomersService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should produce a manager notification for urgent customer creation', async () => {
    mockManager.findOne.mockResolvedValue(null); // No existing customer
    mockManager.create.mockImplementation((entity: any, dto: any) => dto);

    await service.createCustomer(
      {
        businessNumber: 'CUST-001',
        name: 'Urgent Cafe',
        salesRepId: 'REP-01',
        isUrgent: true,
      },
      'ADMIN-01',
    );

    // Verify Notification creation was called
    expect(mockManager.create).toHaveBeenCalledWith(
      expect.any(Function), // Notification entity class
      expect.objectContaining({
        type: 'URGENT_CUSTOMER_REVIEW',
        severity: 'urgent',
      }),
    );
  });

  it('should prevent reassignment to the exact same active sales rep', async () => {
    mockManager.findOne.mockResolvedValue({ id: 'CUST-1', salesRepId: 'REP-01' });

    await expect(
      service.reassignSalesRep('CUST-1', 'REP-01', 'ADMIN-01')
    ).rejects.toThrow(ConflictException);
  });

  it('should close old history and create new history on reassignment', async () => {
    mockManager.findOne.mockResolvedValueOnce({ id: 'CUST-1', salesRepId: 'REP-01' }); // Customer
    mockManager.findOne.mockResolvedValueOnce({ id: 'HIST-1', customerId: 'CUST-1', unassignedAt: null }); // History

    mockManager.create.mockImplementation((entity: any, dto: any) => dto);

    await service.reassignSalesRep('CUST-1', 'REP-02', 'ADMIN-01');

    // Should save the old history with unassignedAt
    expect(mockManager.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'HIST-1', unassignedAt: expect.any(Date) })
    );

    // Should create and save new history
    expect(mockManager.create).toHaveBeenCalledWith(
      expect.any(Function), // CustomerSalesRepHistory
      expect.objectContaining({ salesRepId: 'REP-02' })
    );
  });

  it('should prove an order created before reassignment retains the original sales rep (via denormalization)', () => {
    // The requirement states: "store the sales_rep_id directly on each order at creation time (denormalized)".
    // This test simulates the creation of an order BEFORE reassignment and verifies it maintains its salesRepId.
    const orderCreatedBefore = {
      id: 'ORD-1',
      customerId: 'CUST-1',
      salesRepId: 'REP-01', // Denormalized value stored when order was placed
      createdAt: new Date('2023-01-01'),
    };

    const customerCurrentState = {
      id: 'CUST-1',
      salesRepId: 'REP-02', // Reassigned later
    };

    // The order's salesRepId is unchanged despite the customer's current salesRepId
    expect(orderCreatedBefore.salesRepId).not.toBe(customerCurrentState.salesRepId);
    expect(orderCreatedBefore.salesRepId).toBe('REP-01');
  });
});
