import { Controller, Post, Get, Body, Req, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from '../entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
  ) {}

  @Get()
  async getAllCustomers() {
    return this.customerRepo.find();
  }

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    return this.customerRepo.findOne({ where: { id } });
  }

  @Post()
  async createCustomer(@Body() body: any) {
    const { businessNumber, name, salesRepId, branchDetails, isUrgent } = body;
    
    // We mock createdByUserId for now since we haven't wired full JWT guards
    const createdByUserId = 'mock-user-id'; 

    return this.customersService.createCustomer(
      { businessNumber, name, salesRepId, branchDetails, isUrgent },
      createdByUserId
    );
  }
}
