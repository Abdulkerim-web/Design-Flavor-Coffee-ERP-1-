import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { FinanceController } from './master-data/finance.controller';
import { FeasibilityController } from './master-data/feasibility.controller';

import { RoastingController } from './master-data/roasting.controller';
import { PackingController } from './master-data/packing.controller';
import { DeliveryController } from './master-data/delivery.controller';
import { ReceivingController } from './master-data/receiving.controller';

import { CustomersController } from './master-data/customers.controller';
import { OrdersController } from './master-data/orders.controller';

import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';

import { SeederService } from './database/seeder.service';
// Services
import { AppService } from './app.service';
import { OrdersService } from './master-data/orders.service';
import { CustomersService } from './master-data/customers.service';
import { FeasibilityEngineService } from './master-data/feasibility.service';
import { RoastingService } from './master-data/roasting.service';
import { PackingService } from './master-data/packing.service';
import { DeliveryService } from './master-data/delivery.service';
import { PaymentService } from './master-data/payment.service';
import { BankLedgerService } from './master-data/bank_ledger.service';
import { PayrollService } from './master-data/payroll.service';
import { ProfitEngineService } from './master-data/profit_engine.service';
import { ReportingService } from './master-data/reporting.service';
import { NotificationService } from './master-data/notification.service';
import { UsersService } from './users/users.service';

import { AllEntities } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(AllEntities),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flavor_coffee_erp',
      extra: { ssl: { rejectUnauthorized: false } },
      entities: AllEntities,
      synchronize: true, // Auto-syncs schema in dev
    }),
    
  ],
  controllers: [
    CustomersController,
    OrdersController,
    RoastingController,
    PackingController,
    DeliveryController,
    ReceivingController,
    FinanceController,
    FeasibilityController,
    AppController,
    AuthController
  ],
  providers: [
    SeederService,
    AppService,
    OrdersService,
    CustomersService,
    FeasibilityEngineService,
    RoastingService,
    PackingService,
    DeliveryService,
    PaymentService,
    BankLedgerService,
    PayrollService,
    ProfitEngineService,
    ReportingService,
    NotificationService,
    UsersService
  ],
})
export class AppModule {}
