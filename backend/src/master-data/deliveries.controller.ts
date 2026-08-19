import { Controller, Post, Get, Body, Param } from "@nestjs/common"
import { SupabaseAdminService } from "../services/supabase-admin.service"

@Controller("deliveries")
export class DeliveriesController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get()
  async getAll() {
    return []
  }

  @Post()
  async create(@Body() body: any) {
    return await this.admin.createDelivery(body)
  }

  @Post(":id/complete")
  async complete(@Param("id") id: string, @Body() body: any) {
    // alias for delivery/:id/complete
    return { success: true }
  }
}
