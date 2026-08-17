CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "app_notifications" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "user_id" VARCHAR(255) NOT NULL, "type" VARCHAR(100) NOT NULL, "reference_entity_id" VARCHAR(255) NOT NULL, "message" TEXT NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT ('UNREAD'), "triggerCount" INTEGER NOT NULL DEFAULT (1), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "roles" ("id" VARCHAR(50) PRIMARY KEY NOT NULL, "tier" INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS "users" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "business_number" VARCHAR(50) NOT NULL, "name" VARCHAR(255) NOT NULL, "email" VARCHAR(255) NOT NULL, "role_id" VARCHAR(50) NOT NULL, "status" VARCHAR(20) NOT NULL DEFAULT ('active'), "last_active" TIMESTAMP, "avatar" VARCHAR(255), "avatar_color" VARCHAR(20), "department" VARCHAR(255), "deactivated_at" TIMESTAMP, "deactivated_by" VARCHAR(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "audit_logs" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "user_id" VARCHAR(255) NOT NULL, "action" VARCHAR(50) NOT NULL, "entity_type" VARCHAR(100) NOT NULL, "entity_id" VARCHAR(100) NOT NULL, "changes" json NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "company_bank_accounts" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "bank_name" VARCHAR(100) NOT NULL, "account_number" VARCHAR(100) NOT NULL, "opening_balance" decimal(14,2) NOT NULL DEFAULT (0), "opening_balance_date" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "bank_transactions" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "bank_account_id" VARCHAR(255) NOT NULL, "amount" decimal(14,2) NOT NULL, "sourceType" VARCHAR(50) NOT NULL, "source_id" VARCHAR(255) NOT NULL, "reference_note" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "coffee_products" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "business_number" VARCHAR(50) NOT NULL, "origin_id" VARCHAR(100) NOT NULL, "roast_level" VARCHAR(50) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT TRUE);

CREATE TABLE IF NOT EXISTS "coffee_product_price_lists" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "coffee_product_id" VARCHAR(255) NOT NULL, "unit_price" decimal(14,2) NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT TRUE, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "customer_branches" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "customer_id" VARCHAR(255) NOT NULL, "name" VARCHAR(255) NOT NULL, "address" TEXT NOT NULL, "contact_info" VARCHAR(255) NOT NULL, "is_default" BOOLEAN NOT NULL DEFAULT FALSE);

CREATE TABLE IF NOT EXISTS "customer_sales_rep_history" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "customer_id" VARCHAR(255) NOT NULL, "sales_rep_id" VARCHAR(255) NOT NULL, "assigned_at" TIMESTAMP NOT NULL DEFAULT NOW(), "unassigned_at" TIMESTAMP);

CREATE TABLE IF NOT EXISTS "customers" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "business_number" VARCHAR(50) NOT NULL, "name" VARCHAR(255) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT TRUE, "sales_rep_id" VARCHAR(255) NOT NULL);

CREATE TABLE IF NOT EXISTS "order_items" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_id" VARCHAR(255) NOT NULL, "coffee_product_id" VARCHAR(255) NOT NULL, "quantity" decimal(10,3) NOT NULL, "unit_price" decimal(14,2) NOT NULL, "status" VARCHAR(100) NOT NULL DEFAULT ('pending-confirmation'));

CREATE TABLE IF NOT EXISTS "orders" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "orderNumber" VARCHAR(50) NOT NULL, "customer_id" VARCHAR(255) NOT NULL, "branch_id" VARCHAR(255) NOT NULL, "sales_rep_id" VARCHAR(255) NOT NULL, "status" VARCHAR(100) NOT NULL DEFAULT ('draft'), "feasibility_override_reason" TEXT, "is_urgent" BOOLEAN NOT NULL DEFAULT FALSE, "urgent_deadline_at" TIMESTAMP, "payment_deadline_at" TIMESTAMP, "pre_vat_amount" decimal(14,2) NOT NULL DEFAULT (0), "vat_rate" decimal(5,2) NOT NULL DEFAULT (0), "vat_amount" decimal(14,2) NOT NULL DEFAULT (0), "total_amount" decimal(14,2) NOT NULL DEFAULT (0), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "delivery_records" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_id" VARCHAR(255) NOT NULL, "customer_id" VARCHAR(255) NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('READY_FOR_ASSIGNMENT'), "driver_user_id" VARCHAR(255), "proof_document_path" VARCHAR(255), "verified_by_manager_id" VARCHAR(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "discrepancies" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "entity_type" VARCHAR(50) NOT NULL, "entity_id" VARCHAR(255) NOT NULL, "expectedQuantity" decimal(10,3) NOT NULL, "actualQuantity" decimal(10,3) NOT NULL, "difference" decimal(10,3) NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('pending-review'), "resolved_by_user_id" VARCHAR(255), "resolution_note" TEXT, "final_adjudicated_quantity" decimal(10,3), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "expenses" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "amount" decimal(14,2) NOT NULL, "category" VARCHAR(100) NOT NULL, "description" TEXT NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('requested'), "payment_method" VARCHAR(50), "requested_by_user_id" VARCHAR(255) NOT NULL, "approved_by_manager_id" VARCHAR(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "inventory_transactions" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "type" VARCHAR(50) NOT NULL, "direction" VARCHAR(255) CHECK( "direction" IN ('in','out','reserve','release') ) NOT NULL, "quantity" decimal(10,3) NOT NULL, "coffee_product_id" VARCHAR(255) NOT NULL, "resulting_balance" decimal(10,3), "reference_entity_type" VARCHAR(50) NOT NULL, "reference_entity_id" VARCHAR(50) NOT NULL, "performed_by_user_id" VARCHAR(255) NOT NULL, "approved_by_user_id" VARCHAR(255), "notes" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "suppliers" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "business_number" VARCHAR(50) NOT NULL, "name" VARCHAR(255) NOT NULL, "contact_info" VARCHAR(255) NOT NULL, "address" TEXT NOT NULL, "is_active" BOOLEAN NOT NULL DEFAULT TRUE);

CREATE TABLE IF NOT EXISTS "receiving_records" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "status" VARCHAR(50) NOT NULL DEFAULT ('received'), "supplier_id" VARCHAR(255) NOT NULL, "coffee_product_id" VARCHAR(255) NOT NULL, "storekeeper_user_id" VARCHAR(255) NOT NULL, "inspector_user_id" VARCHAR(255), "manager_user_id" VARCHAR(255), "received_quantity" decimal(10,3) NOT NULL, "accepted_quantity" decimal(10,3), "rejected_quantity" decimal(10,3), "qc_notes" TEXT, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "lots" ("id" VARCHAR(50) PRIMARY KEY NOT NULL, "coffee_product_id" VARCHAR(255) NOT NULL, "receiving_record_id" VARCHAR(255) NOT NULL, "initial_quantity" decimal(10,3) NOT NULL, "unit_cost_etb" decimal(14,2) NOT NULL, "total_cost_etb" decimal(14,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "notifications" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "type" VARCHAR(50) NOT NULL, "severity" VARCHAR(20) NOT NULL, "recipient_user_id" VARCHAR(255) NOT NULL, "related_entity_type" VARCHAR(100), "related_entity_id" VARCHAR(100), "message" TEXT NOT NULL, "is_read" BOOLEAN NOT NULL DEFAULT FALSE, "created_at" TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP));

CREATE TABLE IF NOT EXISTS "packaging_materials" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "name" VARCHAR(100) NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT TRUE);

CREATE TABLE IF NOT EXISTS "payments" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_id" VARCHAR(255) NOT NULL, "amount" decimal(14,2) NOT NULL, "payment_method" VARCHAR(50) NOT NULL, "bank_reference_number" VARCHAR(100), "idempotency_key" VARCHAR(100) NOT NULL, "registered_by_user_id" VARCHAR(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "payroll_run_lines" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "payroll_run_id" VARCHAR(255) NOT NULL, "employee_user_id" VARCHAR(255) NOT NULL, "base_salary_amount" decimal(14,2) NOT NULL, "advance_deduction_amount" decimal(14,2) NOT NULL DEFAULT (0), "net_amount" decimal(14,2) NOT NULL, "notes" TEXT);

CREATE TABLE IF NOT EXISTS "payroll_runs" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "period_start" date NOT NULL, "period_end" date NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('draft'), "total_amount" decimal(14,2) NOT NULL DEFAULT (0), "prepared_by_user_id" VARCHAR(255) NOT NULL, "approved_by_manager_id" VARCHAR(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "permissions" ("id" VARCHAR(100) PRIMARY KEY NOT NULL, "description" VARCHAR(255) NOT NULL);

CREATE TABLE IF NOT EXISTS "reservations" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_item_id" VARCHAR(255) NOT NULL, "coffee_product_id" VARCHAR(255) NOT NULL, "quantity" decimal(10,3) NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('active'), "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "roasting_batches" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_id" VARCHAR(255) NOT NULL, "order_item_id" VARCHAR(255) NOT NULL, "status" VARCHAR(50) NOT NULL DEFAULT ('planned'), "green_input_quantity" decimal(10,3) NOT NULL, "expected_roasted_quantity" decimal(10,3) NOT NULL, "actual_roasted_quantity" decimal(10,3), "applied_yield_percentage" decimal(5,2) NOT NULL, "acceptable_range_percentage" decimal(5,2) NOT NULL, "roaster_user_id" VARCHAR(255), "storekeeper_user_id" VARCHAR(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "salary_histories" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "employee_user_id" VARCHAR(255) NOT NULL, "amount" decimal(14,2) NOT NULL, "effective_from_date" date NOT NULL, "changed_by_user_id" VARCHAR(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

CREATE TABLE IF NOT EXISTS "sessions" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "user_id" VARCHAR(255) NOT NULL, "token_hash" VARCHAR(255) NOT NULL, "ip_address" VARCHAR(45), "device" VARCHAR(255), "issued_at" TIMESTAMP NOT NULL DEFAULT NOW(), "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP);

CREATE TABLE IF NOT EXISTS "stock_balances" ("item_id" VARCHAR(255) PRIMARY KEY NOT NULL, "itemType" VARCHAR(255) CHECK( "itemType" IN ('GREEN','ROASTED','PACKAGING') ) NOT NULL, "on_hand" decimal(10,3) NOT NULL DEFAULT (0), "reserved" decimal(10,3) NOT NULL DEFAULT (0), "available" decimal(10,3) NOT NULL DEFAULT (0), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "CHK_c0194c1cb5dd4f6d24909e4bce" CHECK ("available" >= 0));

CREATE TABLE IF NOT EXISTS "vat_adjustments" ("id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(), "order_id" VARCHAR(255) NOT NULL, "delta_amount" decimal(14,2) NOT NULL, "reason" TEXT NOT NULL, "approved_by_user_id" VARCHAR(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT NOW());

