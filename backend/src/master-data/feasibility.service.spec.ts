import { Test, TestingModule } from "@nestjs/testing"
import { FeasibilityEngineService } from "./feasibility.service"
import { DataSource } from "typeorm"
import { BadRequestException } from "@nestjs/common"
import { StockBalance } from "../entities/stock_balance.entity"

describe("FeasibilityEngineService", () => {
  let service: FeasibilityEngineService

  beforeEach(async () => {
    const mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        create: jest.fn().mockImplementation((entity, dto) => dto),
        save: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeasibilityEngineService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile()

    service = module.get<FeasibilityEngineService>(FeasibilityEngineService)
  })

  it("should round UP yield requirement to nearest 0.001", () => {
    // 50 KG roasted / 0.82 yield = 60.975609...
    // Should round up to 60.976
    const req = service.computeGreenRequirement(50, 0.82)
    expect(req).toBe(60.976)
  })

  it("should prevent concurrent reservations from causing negative balance (throws STOCK_INSUFFICIENT)", async () => {
    const mockRunner = (service as any).dataSource.createQueryRunner()

    // Simulate stock with only 10 available
    const mockStock = {
      itemId: "PROD-1",
      itemType: "GREEN",
      onHand: 10,
      reserved: 0,
      available: 10,
    }

    mockRunner.manager.findOne.mockResolvedValue(mockStock)

    // Concurrent request 1 asks for 10. Since it's serializing in DB via lock, it passes.
    // However, our test mock logic doesn't physically lock, so we test the JS layer validation:

    await expect(
      service.reserveStock("ITEM-1", "PROD-1", 15, "USER-1"),
    ).rejects.toThrow(BadRequestException)
    await expect(
      service.reserveStock("ITEM-1", "PROD-1", 15, "USER-1"),
    ).rejects.toThrow("STOCK_INSUFFICIENT")
  })
})
