import { Controller, Post, Get, Body } from '@nestjs/common';

@Controller('feasibility')
export class FeasibilityController {
  @Post('check')
  async checkFeasibility(@Body() body: any) { return { feasible: true }; }
}
