import { Test, TestingModule } from "@nestjs/testing"
import { ReceivingService } from "./receiving.service"
import { DataSource } from "typeorm"
import { ReceivingRecord } from "../entities/receiving_record.entity"
import { Lot } from "../entities/lot.entity"
import { InventoryTransaction } from "../entities/inventory_transaction.entity"

describe("ReceivingService", () => {
  let service: ReceivingService
  let mockManager: any

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity, dto) => dto),
      save: jest.fn(),
    }

    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    }

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceivingService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<ReceivingService>(ReceivingService)
  })

  it("should prove 0 KG acceptance produces no inventory but keeps a queryable record", async () => {
    const mockRecord = {
      id: "REC-1",
      status: "pending-manager-approval",
      acceptedQuantity: 0,
      rejectedQuantity: 500,
      receivedQuantity: 500,
      coffeeProductId: "PROD-1",
      coffeeProduct: { origin: "Yirgacheffe" },
    }

    mockManager.findOne.mockResolvedValue(mockRecord)

    await service.approveShipment("REC-1", "MGR-1", 10, true)

    // Record should be updated to APPROVED
    expect(mockRecord.status).toBe("approved")
    expect(mockManager.save).toHaveBeenCalledWith(mockRecord)

    // Should NOT create Lot or InventoryTransaction because accepted = 0
    expect(mockManager.create).not.toHaveBeenCalledWith(Lot, expect.anything())
    expect(mockManager.create).not.toHaveBeenCalledWith(
      InventoryTransaction,
      expect.anything(),
    )
  })

  it("should prove approval and inventory creation happen atomically (all inside transaction)", async () => {
    const mockRecord = {
      id: "REC-2",
      status: "pending-manager-approval",
      acceptedQuantity: 500,
      rejectedQuantity: 0,
      receivedQuantity: 500,
      coffeeProductId: "PROD-1",
      coffeeProduct: { origin: "Sidama" },
    }

    mockManager.findOne.mockResolvedValue(mockRecord)
    // Simulate failure during stock save
    mockManager.save.mockImplementation((entity: any) => {
      if (entity.available) {
        throw new Error("Database disconnected during stock update!")
      }
      return Promise.resolve(entity)
    })

    try {
      await service.approveShipment("REC-2", "MGR-1", 10, true)
    } catch (e) {
      // Expected to throw
    }

    const runner = (service as any).dataSource.createQueryRunner()
    expect(runner.rollbackTransaction).toHaveBeenCalled() // Transaction was rolled back
  })
})
