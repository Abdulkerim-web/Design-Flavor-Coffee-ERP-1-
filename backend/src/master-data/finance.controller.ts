import { Controller, Post, Get, Body, Param } from '@nestjs/common';

@Controller('finance')
export class FinanceController {
  @Get('payments')
  async getPayments() { return []; }

  @Post('payments')
  async receivePayment(@Body() body: any) { return { success: true }; }

  @Get('ledger')
  async getLedger() { return []; }

  @Get('payroll')
  async getPayroll() { return []; }

  @Post('payroll')
  async runPayroll(@Body() body: any) { return { success: true }; }
}
