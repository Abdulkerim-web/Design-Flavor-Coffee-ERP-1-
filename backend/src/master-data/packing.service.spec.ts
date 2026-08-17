import { Test, TestingModule } from "@nestjs/testing"
import { PackingService } from "./packing.service"
import { DataSource } from "typeorm"

describe("PackingService", () => {
  let service: PackingService
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
        PackingService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<PackingService>(PackingService)
  })

  it("should deduct packaging inventory accurately on match", async () => {
    const mockOrderItem = {
      id: "ITEM-1",
      status: "ready-for-packing",
      quantity: 50, // Expecting 50 packages
    }

    const mockPackagingStock = {
      itemId: "FOIL-MAT-1",
      itemType: "PACKAGING",
      onHand: 100,
      available: 100,
    }

    mockManager.findOne
      .mockResolvedValueOnce(mockOrderItem)
      .mockResolvedValueOnce(mockPackagingStock)

    const result = await service.confirmPacking(
      "ITEM-1",
      "PACKER-1",
      "FOIL-MAT-1",
      "SIZE-1KG",
      50,
    )

    expect(result.success).toBe(true)
    expect(mockPackagingStock.onHand).toBe(50) // 100 - 50 = 50
    expect(mockPackagingStock.available).toBe(50)
    expect(mockManager.save).toHaveBeenCalledWith(mockPackagingStock)
  })
})
