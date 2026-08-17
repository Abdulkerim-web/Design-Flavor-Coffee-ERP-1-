import { Controller, Post, Get, Body, Param } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { ReceivingRecord } from "../entities/receiving_record.entity"

@Controller("receiving")
export class ReceivingController {
  constructor(
    @InjectRepository(ReceivingRecord)
    private readonly receivingRepo: Repository<ReceivingRecord>,
  ) {}

  @Get()
  async getAllReceiving() {
    return this.receivingRepo.find({ relations: ["lot"] })
  }

  @Post()
  async logReceipt(@Body() body: any) {
    return { success: true }
  }

  @Post(":id/qc")
  async performQC(@Param("id") id: string, @Body() body: any) {
    return { success: true }
  }

  @Post(":id/approve")
  async managerApprove(@Param("id") id: string) {
    return { success: true }
  }
}
