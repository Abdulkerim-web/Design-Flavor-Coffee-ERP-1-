import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

describe('Security & IDOR Matrix', () => {
  let reportingService: ReportingService;
  let deliveryService: DeliveryService;

  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
      findOne: jest.fn().mockResolvedValue({ id: 'DEL-1' }),
      save: jest.fn().mockResolvedValue({}),
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
        ReportingService,
        DeliveryService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    reportingService = module.get<ReportingService>(ReportingService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  describe('IDOR / RBAC Matrix', () => {
    it('should block non-managers from verifying delivery even if they guess the ID', async () => {
      // Even if a driver knows the UUID of a delivery, they cannot call the verify endpoint
      await expect(deliveryService.verifyDelivery('KNOWN-DELIVERY-UUID', 'DRIVER-ID', 'DRIVER'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should block unauthorized roles from querying sales pipeline', async () => {
      // Storekeepers cannot read sales pipelines, even if they guess endpoint params
      await expect(reportingService.getSalesPipelineReport('STOREKEEPER-ID', 'STOREKEEPER', '2026-08-01', '2026-08-31'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
