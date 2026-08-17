import { Controller, Post, Get, Body, Req, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(@InjectRepository(Order) private readonly orderRepo: Repository<Order>) {}

  @Get()
  async getAllOrders() { return this.orderRepo.find({ relations: ['items'] }); }

  @Get(':id')
  async getOrderById(@Param('id') id: string) { return this.orderRepo.findOne({ where: { id }, relations: ['items'] }); }

  @Post()
  async placeOrder(@Body() body: any) {
    return { success: true, orderNumber: 'ORD-' + Math.floor(Math.random() * 10000) };
  }

  @Post(':id/confirm')
  async confirmOrder(@Param('id') id: string) { return { success: true }; }
}
