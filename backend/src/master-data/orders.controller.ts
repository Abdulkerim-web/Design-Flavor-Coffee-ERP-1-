import { Controller, Post, Get, Body, Req, Param } from "@nestjs/common"
import { OrdersService } from "./orders.service"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Order } from "../entities/order.entity"

@Controller("orders")
export class OrdersController {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async getAllOrders() {
    return this.orderRepo.find({ relations: ["items", "customer"] })
  }

  @Get(":id")
  async getOrderById(@Param("id") id: string) {
    return this.orderRepo.findOne({ where: { id }, relations: ["items", "customer"] })
  }

  @Post()
  async placeOrder(@Body() body: any, @Req() req: any) {
    const role = req.headers["x-user-role"] || "sales"
    const order = await this.ordersService.createOrder({
      customerId: body.customerId,
      salesRepId: body.salesRepId || "mock-sales-rep",
      branchId: body.branchId,
      items: body.items,
      urgent: body.urgent || false,
    }, role)
    
    return {
      success: true,
      orderNumber: order.orderNumber,
      id: order.id,
    }
  }

  @Post(":id/confirm")
  async confirmOrder(@Param("id") id: string) {
    return { success: true }
  }
}
