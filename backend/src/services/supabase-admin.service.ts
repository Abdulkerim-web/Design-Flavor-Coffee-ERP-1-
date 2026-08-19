import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { DeliveryRecord } from "../entities/delivery_record.entity"
import { Payment } from "../entities/payment.entity"
import { Customer } from "../entities/customer.entity"
import { Order } from "../entities/order.entity"
import { User } from "../entities/user.entity"
import { RealtimeService } from "./realtime.service"

@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name)

  constructor(
    @InjectRepository(DeliveryRecord)
    private readonly deliveryRepo: Repository<DeliveryRecord>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly realtime: RealtimeService,
  ) {}

  async createDelivery(payload: any) {
    this.logger.log("createDelivery called")
    try {
      const record = this.deliveryRepo.create({
        orderId: payload.orderId,
        customerId: payload.customerId || payload.customerId || null,
        status: payload.status || "READY_FOR_ASSIGNMENT",
        driverUserId: payload.driverUserId || null,
      })
      const saved = await this.deliveryRepo.save(record)
      // publish realtime event for subscribers with normalized payload
      this.realtime.publish('deliveries', { eventType: 'insert', table: 'deliveries', record: saved })
      return { success: true, data: saved }
    } catch (err) {
      this.logger.error("createDelivery failed", err as any)
      return { success: false, error: String(err) }
    }
  }

  async recordPayment(payload: any) {
    this.logger.log("recordPayment called")
    try {
      let registeredBy = payload.registeredByUserId || payload.registeredBy || null
      if (!registeredBy) {
        const user = await this.userRepo.findOne({ where: {} })
        registeredBy = user ? user.id : null
      }
      const payment = this.paymentRepo.create({
        orderId: payload.orderId || null,
        amount: payload.amount || 0,
        paymentMethod: payload.paymentMethod || "BANK_TRANSFER",
        bankReferenceNumber: payload.bankReferenceNumber || payload.transferRef || null,
        idempotencyKey: payload.idempotencyKey || payload.paymentId || String(Date.now()),
        registeredByUserId: registeredBy,
      })
      const saved = await this.paymentRepo.save(payment)
      this.realtime.publish('payments', { eventType: 'insert', table: 'payments', record: saved })
      return { success: true, data: saved }
    } catch (err) {
      this.logger.error("recordPayment failed", err as any)
      return { success: false, error: String(err) }
    }
  }

  async createCustomer(payload: any) {
    this.logger.log("createCustomer called")
    try {
      const customer = this.customerRepo.create({
        businessNumber: payload.businessNumber || `BUS-${Date.now()}`,
        name: payload.name || "Unnamed",
        status: payload.status || "active",
        type: payload.type || "cafe",
        contactPerson: payload.contactPerson || null,
        phone: payload.phone || null,
        email: payload.email || null,
        notes: payload.notes || null,
        salesRepId: payload.salesRepId || payload.salesRep || null,
      })
      const saved = await this.customerRepo.save(customer)
      return { success: true, data: saved }
    } catch (err) {
      this.logger.error("createCustomer failed", err as any)
      return { success: false, error: String(err) }
    }
  }

  async createOrder(payload: any) {
    this.logger.log("createOrder called")
    try {
      const order = this.orderRepo.create({
        orderNumber: payload.orderNumber || `ORD-${Date.now()}`,
        customerId: payload.customerId,
        branchId: payload.branchId || payload.branchId || null,
        salesRepId: payload.salesRepId || payload.salesRep || null,
        status: payload.status || "draft",
        items: payload.items || [],
        preVatAmount: payload.preVatAmount || 0,
        vatRate: payload.vatRate || 0,
        vatAmount: payload.vatAmount || 0,
        totalAmount: payload.totalAmount || 0,
      })
      const saved = await this.orderRepo.save(order)
      return { success: true, data: saved }
    } catch (err) {
      this.logger.error("createOrder failed", err as any)
      return { success: false, error: String(err) }
    }
  }
}

