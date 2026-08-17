import { Test, TestingModule } from "@nestjs/testing"
import { DeliveryService } from "./delivery.service"
import { DataSource } from "typeorm"
import { ForbiddenException } from "@nestjs/common"

describe("DeliveryService", () => {
  let service: DeliveryService
  let mockManager: any

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
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
        DeliveryService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<DeliveryService>(DeliveryService)
  })

  it("should block non-managers from verifying delivery", async () => {
    await expect(
      service.verifyDelivery("DEL-1", "DRIVER-1", "DRIVER"),
    ).rejects.toThrow(ForbiddenException)
    await expect(
      service.verifyDelivery("DEL-1", "DRIVER-1", "DRIVER"),
    ).rejects.toThrow("Only a manager can verify")
  })

  it("should allow manager to verify and start 7-day payment clock if missing", async () => {
    const mockOrder = { id: "ORD-1", paymentDeadlineAt: null }
    const mockDelivery = {
      id: "DEL-1",
      status: "delivered-proof-submitted",
      order: mockOrder,
    }

    mockManager.findOne.mockResolvedValueOnce(mockDelivery)

    await service.verifyDelivery("DEL-1", "MGR-1", "MANAGER")

    expect(mockDelivery.status).toBe("verified")
    expect(mockDelivery.order.paymentDeadlineAt).not.toBeNull()
    // Verify it added roughly 7 days
    const diffDays =
      (mockDelivery.order.paymentDeadlineAt.getTime() - new Date().getTime()) /
      (1000 * 3600 * 24)
    expect(diffDays).toBeCloseTo(7, 0)

    expect(mockManager.save).toHaveBeenCalledWith(mockDelivery)
    expect(mockManager.save).toHaveBeenCalledWith(mockOrder)
  })
})
