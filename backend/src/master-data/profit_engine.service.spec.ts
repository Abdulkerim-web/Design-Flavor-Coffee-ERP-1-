import { Test, TestingModule } from "@nestjs/testing"
import { ProfitEngineService } from "./profit_engine.service"
import { DataSource } from "typeorm"

describe("ProfitEngineService", () => {
  let service: ProfitEngineService
  let mockManager: any

  beforeEach(async () => {
    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValueOnce([
            { preVatAmount: 1000, vatAmount: 150 }, // Order 1
            { preVatAmount: 2000, vatAmount: 300 }, // Order 2
          ]) // For Orders
          .mockResolvedValueOnce([
            { amount: 200 }, // Expense 1
          ]) // For Expenses
          .mockResolvedValueOnce([
            { totalAmount: 500 }, // Payroll 1
          ]), // For Payroll
      }),
    }

    const mockQueryRunner = {
      connect: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    }

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfitEngineService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<ProfitEngineService>(ProfitEngineService)
  })

  it("should calculate profit by strictly subtracting expenses from revenue", async () => {
    const result = await service.calculateProfitForPeriod(
      "2026-08-01",
      "2026-08-31",
    )

    // Revenue = 1000 + 2000 = 3000
    expect(result.revenuePreVat).toBe(3000)

    // VAT Liability = 150 + 300 = 450
    expect(result.vatLiability).toBe(450)

    // Production Cost = 3000 * 0.4 = 1200
    expect(result.productionCost).toBe(1200)

    // Operating Expenses = 200
    expect(result.operatingExpenses).toBe(200)

    // Payroll = 500
    expect(result.payrollExpenses).toBe(500)

    // Profit = 3000 - 1200 - 200 - 500 = 1100
    expect(result.netProfit).toBe(1100)
  })
})
