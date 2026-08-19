import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"

// Controllers
import { FinanceController } from "./master-data/finance.controller"
import { FeasibilityController } from "./master-data/feasibility.controller"

import { RoastingController } from "./master-data/roasting.controller"
import { PackingController } from "./master-data/packing.controller"
import { DeliveryController } from "./master-data/delivery.controller"
import { DeliveriesController } from "./master-data/deliveries.controller"
import { ReceivingController } from "./master-data/receiving.controller"

import { CustomersController } from "./master-data/customers.controller"
import { OrdersController } from "./master-data/orders.controller"
import { DashboardController } from "./master-data/dashboard.controller"
import { RealtimeController } from "./master-data/realtime.controller"

import { AppController } from "./app.controller"
import { AuthController } from "./auth/auth.controller"

import { SeederService } from "./database/seeder.service"
// Services
import { AppService } from "./app.service"
import { OrdersService } from "./master-data/orders.service"
import { CustomersService } from "./master-data/customers.service"
import { DashboardService } from "./master-data/dashboard.service"
import { FeasibilityEngineService } from "./master-data/feasibility.service"
import { RoastingService } from "./master-data/roasting.service"
import { PackingService } from "./master-data/packing.service"
import { DeliveryService } from "./master-data/delivery.service"
import { PaymentService } from "./master-data/payment.service"
import { SupabaseAdminService } from "./services/supabase-admin.service"
import { BankLedgerService } from "./master-data/bank_ledger.service"
import { PayrollService } from "./master-data/payroll.service"
import { ProfitEngineService } from "./master-data/profit_engine.service"
import { ReportingService } from "./master-data/reporting.service"
import { NotificationService } from "./master-data/notification.service"
import { RealtimeService } from "./services/realtime.service"
import { UsersService } from "./users/users.service"

import { AllEntities } from "./entities" // Auto-syncs schema in dev

@Module({
  imports: [
    TypeOrmModule.forFeature(AllEntities),
    ConfigModule.forRoot({ isGlobal: true }),
    // Allow selecting sqlite in CI by setting TYPEORM_ENGINE=sqlite
    TypeOrmModule.forRoot(
      process.env.TYPEORM_ENGINE === "sqlite"
        ? {
            type: "sqlite",
            database: ":memory:",
            entities: AllEntities,
            synchronize: true,
          }
        : {
            type: "postgres",
            url:
              process.env.DATABASE_URL ||
              "postgresql://postgres.udvtogofulclohhvdnzc:Lx3MLqIBcFeL4uh7@aws-0-eu-central-1.pooler.supabase.com:6543/postgres",
            extra: { ssl: { rejectUnauthorized: false } },
            entities: AllEntities,
            // Disable automatic schema synchronization by default to avoid
            // runtime migration/index-creation errors. Enable in development
            // only by setting TYPEORM_SYNCHRONIZE=true in the environment.
            synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
          },
    ),
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
    DashboardController,
    AppController,
    AuthController,
    RealtimeController,
    DeliveriesController,
  ],
  providers: [
    RealtimeService,
    SupabaseAdminService,
    SeederService,
    AppService,
    OrdersService,
    CustomersService,
    DashboardService,
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
    UsersService,
  ],
})
export class AppModule {}
