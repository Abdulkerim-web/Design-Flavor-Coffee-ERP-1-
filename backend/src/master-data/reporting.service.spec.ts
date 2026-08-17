import { Test, TestingModule } from "@nestjs/testing"
import { ReportingService } from "./reporting.service"
import { DataSource } from "typeorm"
import { ForbiddenException } from "@nestjs/common"

describe("ReportingService", () => {
  let service: ReportingService
  let mockManager: any

  beforeEach(async () => {
    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
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
        ReportingService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile()

    service = module.get<ReportingService>(ReportingService)
  })

  it("should block STOREKEEPER from seeing sales pipeline", async () => {
    await expect(
      service.getSalesPipelineReport(
        "USER-1",
        "STOREKEEPER",
        "2026-08-01",
        "2026-08-31",
      ),
    ).rejects.toThrow(ForbiddenException)
  })

  it("should allow GM to see sales pipeline", async () => {
    const report = await service.getSalesPipelineReport(
      "USER-1",
      "GM",
      "2026-08-01",
      "2026-08-31",
    )
    expect(report).toBeDefined()
  })
})
