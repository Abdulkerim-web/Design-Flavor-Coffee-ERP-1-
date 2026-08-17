import { Controller, Post, Get, Body, Req, Param } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { RoastingBatch } from "../entities/roasting_batch.entity"

@Controller("roasting")
export class RoastingController {
  constructor(
    @InjectRepository(RoastingBatch)
    private readonly roastingRepo: Repository<RoastingBatch>,
  ) {}

  @Get()
  async getAllBatches() {
    return this.roastingRepo.find({ relations: ["discrepancy"] })
  }

  @Post()
  async planBatch(@Body() body: any) {
    return { success: true }
  }

  @Post(":id/start")
  async startBatch(@Param("id") id: string) {
    return { success: true }
  }

  @Post(":id/complete")
  async completeBatch(@Param("id") id: string, @Body() body: any) {
    return { success: true }
  }
}
