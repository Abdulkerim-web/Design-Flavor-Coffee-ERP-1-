import { Controller, Post, Get, Body, Param } from "@nestjs/common"
import { SupabaseAdminService } from "../services/supabase-admin.service"

@Controller("finance")
export class FinanceController {
  constructor(private readonly admin: SupabaseAdminService) {}

  @Get("payments")
  async getPayments() {
    return []
  }

  @Post("payments")
  async receivePayment(@Body() body: any) {
    return await this.admin.recordPayment(body)
  }

  @Get("ledger")
  async getLedger() {
    return []
  }

  @Get("payroll")
  async getPayroll() {
    return []
  }

  @Post("payroll")
  async runPayroll(@Body() body: any) {
    return { success: true }
  }
}
