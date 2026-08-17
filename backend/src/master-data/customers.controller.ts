import { Controller, Post, Get, Patch, Body, Req, Param } from "@nestjs/common"
import { CustomersService } from "./customers.service"
import { Customer } from "../entities/customer.entity"
import { User } from "../entities/user.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

@Controller("customers")
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  async getAllCustomers() {
    return this.customerRepo.find()
  }

  @Get(":id")
  async getCustomerById(@Param("id") id: string) {
    return this.customerRepo.findOne({ where: { id } })
  }

  @Post()
  async createCustomer(@Body() body: any, @Req() req: any) {
    const role = req.headers["x-user-role"] || "sales"
    const {
      businessNumber,
      name,
      salesRepId,
      branchDetails,
      isUrgent,
      type,
      contactPerson,
      phone,
      email,
      notes,
    } = body

    // Find a valid sales rep to assign this to, or fall back to any user in the DB
    let salesRep = await this.userRepo.findOne({ where: { email: "meron.b@flavorcoffee.et" } })
    if (!salesRep) {
      const users = await this.userRepo.find({ take: 1 })
      salesRep = users[0] || null
    }
    const validSalesRepId = salesRep ? salesRep.id : undefined

    // We mock createdByUserId for now since we haven't wired full JWT guards
    const createdByUserId = "mock-user-id"

    return this.customersService.createCustomer(
      {
        businessNumber,
        name,
        salesRepId: validSalesRepId,
        branchDetails,
        isUrgent,
        type,
        contactPerson,
        phone,
        email,
        notes,
      },
      createdByUserId,
      role
    )
  }

  @Patch(":id")
  async updateCustomer(
    @Param("id") id: string,
    @Body() body: Partial<Customer>,
  ) {
    return this.customersService.updateCustomer(id, body)
  }

  @Patch(":id/approve")
  async approveCustomer(@Param("id") id: string) {
    return this.customersService.approveCustomer(id)
  }

  @Patch(":id/reject")
  async rejectCustomer(
    @Param("id") id: string,
    @Body() body: { reason: string },
  ) {
    return this.customersService.rejectCustomer(id, body.reason)
  }

  @Patch(":id/deactivate")
  async deactivateCustomer(@Param("id") id: string) {
    return this.customersService.deactivateCustomer(id)
  }
}
