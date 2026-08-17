import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Order } from '../entities/order.entity';
import { Lot } from '../entities/lot.entity';
import { RoastingBatch } from '../entities/roasting_batch.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Lot) private readonly lotRepo: Repository<Lot>,
    @InjectRepository(RoastingBatch) private readonly roastingRepo: Repository<RoastingBatch>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  async onApplicationBootstrap() {
    try {
      const count = await this.userRepo.count();
      if (count > 0) return;

      console.log('Seeding Supabase with demo records and users...');

      const roles = ['general-manager', 'sales-rep', 'head-roaster', 'accountant', 'inventory-manager', 'delivery-staff'];
      for (const r of roles) {
        await this.roleRepo.save(this.roleRepo.create({ id: r, name: r, description: r } as any));
      }

      const users = [
        { id: 'USR-001', name: 'Abebe Girma',       email: 'abebe.g@flavorcoffee.et', roleId: 'general-manager',   status: 'active' },
        { id: 'USR-003', name: 'Meron Bekele',      email: 'meron.b@flavorcoffee.et', roleId: 'sales-rep',         status: 'active' },
        { id: 'USR-005', name: 'Dawit Haile',       email: 'dawit.h@flavorcoffee.et', roleId: 'head-roaster',      status: 'active' },
        { id: 'USR-006', name: 'Tigist Alemu',      email: 'tigist.a@flavorcoffee.et',roleId: 'accountant',        status: 'active' },
        { id: 'USR-007', name: 'Selamawit Bekele',  email: 'selamawit.b@flavorcoffee.et', roleId: 'inventory-manager', status: 'active' },
        { id: 'USR-008', name: 'Yohannes Mesfin',   email: 'yohannes.m@flavorcoffee.et',  roleId: 'delivery-staff',    status: 'active' }
      ];

      for (const u of users) {
         await this.userRepo.save(this.userRepo.create(u as any));
      }

      const customer = this.customerRepo.create({
        name: 'Blue Nile Trading Co.',
        businessNumber: 'CUS-1001',
        active: true,
      } as any) as any;
      await this.customerRepo.save(customer);

      const order = this.orderRepo.create({
        orderNumber: 'ORD-2001',
        customerId: customer.id,
        status: 'PENDING_MANAGER_CONFIRMATION',
        totalAmount: 179400,
      } as any) as any;
      await this.orderRepo.save(order);

      const lot = this.lotRepo.create({
        lotNumber: 'LOT-9001',
        coffeeType: 'Yirgacheffe Grade 1',
        origin: 'Ethiopia',
        quantity: 5000,
      } as any) as any;
      await this.lotRepo.save(lot);

      const batch = this.roastingRepo.create({
        batchNumber: 'RST-5001',
        targetQuantity: 200,
        status: 'COMPLETED',
        actualRoastedQuantity: 168,
      } as any) as any;
      await this.roastingRepo.save(batch);

      console.log('Seeding complete.');
    } catch (e) {
      console.log('Seeding skipped/failed:', e.message);
    }
  }
}
