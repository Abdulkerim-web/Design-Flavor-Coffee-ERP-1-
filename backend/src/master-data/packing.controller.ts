import { Controller, Post, Get, Body, Param } from "@nestjs/common"

@Controller("packing")
export class PackingController {
  @Get()
  async getAllPacking() {
    return []
  }

  @Post()
  async logPacking(@Body() body: any) {
    return { success: true }
  }

  @Post(":id/confirm")
  async confirmPacking(@Param("id") id: string) {
    return { success: true }
  }
}
