import { Controller, Post, Get, Body, Param } from "@nestjs/common"
import { SupabaseAdminService } from "../services/supabase-admin.service"

@Controller("delivery")
export class DeliveryController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  async getAllDeliveries() {
    return []
  }

  @Post()
  async assignDelivery(@Body() body: any) {
    return await this.admin.createDelivery(body)
  }

  @Post(":id/complete")
  async recordProofOfDelivery(@Param("id") id: string, @Body() body: any) {
    // This would normally record POD and update delivery status
    return { success: true }
  }

  @Post(":id/verify")
  async verifyDelivery(@Param("id") id: string) {
    return { success: true }
  }
}
