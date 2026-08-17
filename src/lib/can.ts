/**
 * ACTION-BASED PERMISSION HELPER
 *
 * Usage:
 *   can(role, 'orders.confirm')   → true/false
 *   can(role, 'customers.approve')
 *   can(role, 'finance.view')
 *
 * This is the UI-layer permission check — it is NOT a security boundary.
 * The PHP backend must enforce all real authorization on every API endpoint.
 * Never use this to protect data; only use it to hide/show UI elements.
 *
 * Action strings follow the pattern:  <domain>.<verb>
 *
 * When the PHP API returns permission data for the authenticated user,
 * replace the static ACTION_MAP lookup with a runtime check against
 * that API response. The call signature `can(role, action)` stays the same.
 */

import type { RoleId } from "./rbac"
import { INITIAL_MATRIX } from "./rbac"

/** All defined UI actions. Extend as new modules are added. */
export type UIAction = // Orders
"orders.view" | "orders.create" | "orders.confirm" | "orders.reject" | "orders.override-shortage" | // Customers
"customers.view" | "customers.create" | "customers.edit" | "customers.approve" | "customers.reject" | "customers.deactivate" | "customers.assign-rep" | // Inventory
"inventory.view" | "inventory.receive" | "inventory.adjust" | "inventory.lot.view" | "inventory.qc.confirm" | "inventory.approve" | "inventory.transfer" | "inventory.review" | // Production / Roasting
"roasting.view" | "roasting.schedule" | "roasting.start" | "roasting.batch.record" | "roasting.complete" | "roasting.review-discrepancy" | // Packing
"packing.view" | "packing.record" | "packing.complete" | "packing.review-discrepancy" | // Delivery
"delivery.view" | "delivery.assign-driver" | "delivery.start" | "delivery.upload-proof" | "delivery.verify" | "delivery.customer-verify" | "delivery.dispute" | // Payments
"payments.view" | "payments.record" | "payments.verify" | "payments.manage" | // Finance
"finance.view" | "finance.record-payment" | "finance.approve-expense" | "finance.view-payroll" | "finance.edit-payroll" | // Banking
"banking.view" | "banking.create" | "banking.reconcile" | // Expenses (granular)
"expenses.view" | "expenses.create" | "expenses.edit" | "expenses.cancel" | "expenses.approve" | "expenses.pay" | "expenses.category.view" | "expenses.category.manage" | "expenses.export" | // Payroll (granular)
"payroll.view" | "payroll.edit" | "payroll.approve" | "payroll.finalize" | // Reports
"reports.view" | "reports.export" | // Settings
"settings.yield.view" | "settings.yield.edit" | "settings.vat.view" | "settings.vat.edit" | "settings.pricing.view" | "settings.pricing.edit" | "settings.packaging.view" | "settings.packaging.edit" | "settings.expense-categories.view" | "settings.expense-categories.edit" | // Administration
"users.view" | "users.manage" | "approvals.view" | "notifications.view"

/**
 * Maps UI actions to the permission matrix entry they require.
 * Format: [moduleKey, scope]
 */
const ACTION_MAP: Record<UIAction, [string, string]> = {
  // Orders
  "orders.view": ["orders", "read"],
  "orders.create": ["orders", "create"],
  "orders.confirm": ["orders", "approve"],
  "orders.reject": ["orders", "approve"],
  "orders.override-shortage": ["orders", "approve"],
  // Customers
  "customers.view": ["customers", "read"],
  "customers.create": ["customers", "create"],
  "customers.edit": ["customers", "update"],
  "customers.approve": ["customers", "approve"],
  "customers.reject": ["customers", "approve"],
  "customers.deactivate": ["customers", "delete"],
  "customers.assign-rep": ["customers", "update"],
  // Inventory
  "inventory.view": ["green-inventory", "read"],
  "inventory.receive": ["green-inventory", "create"],
  "inventory.adjust": ["green-inventory", "update"],
  "inventory.lot.view": ["green-inventory", "read"],
  "inventory.qc.confirm": ["green-inventory", "update"],
  "inventory.approve": ["green-inventory", "approve"],
  "inventory.transfer": ["green-inventory", "update"],
  "inventory.review": ["green-inventory", "approve"],
  // Production
  "roasting.view": ["roasting", "read"],
  "roasting.schedule": ["roasting", "create"],
  "roasting.start": ["roasting", "update"],
  "roasting.batch.record": ["roasting", "update"],
  "roasting.complete": ["roasting", "update"],
  "roasting.review-discrepancy": ["roasting", "approve"],
  // Packing
  "packing.view": ["packing", "read"],
  "packing.record": ["packing", "update"],
  "packing.complete": ["packing", "update"],
  "packing.review-discrepancy": ["packing", "approve"],
  // Delivery
  "delivery.view": ["delivery", "read"],
  "delivery.assign-driver": ["delivery", "update"],
  "delivery.start": ["delivery", "update"],
  "delivery.upload-proof": ["delivery", "update"],
  "delivery.verify": ["delivery", "update"],
  "delivery.customer-verify": ["delivery", "approve"],
  "delivery.dispute": ["delivery", "approve"],
  // Payments
  "payments.view": ["payments", "read"],
  "payments.record": ["payments", "create"],
  "payments.verify": ["payments", "approve"],
  "payments.manage": ["payments", "update"],
  // Finance
  "finance.view": ["finance", "read"],
  "finance.record-payment": ["payments", "create"],
  "finance.approve-expense": ["expenses", "approve"],
  "finance.view-payroll": ["payroll", "read"],
  "finance.edit-payroll": ["payroll", "update"],
  // Banking
  "banking.view": ["banking", "read"],
  "banking.create": ["banking", "create"],
  "banking.reconcile": ["banking", "approve"],
  // Expenses
  "expenses.view": ["expenses", "read"],
  "expenses.create": ["expenses", "create"],
  "expenses.edit": ["expenses", "update"],
  "expenses.cancel": ["expenses", "update"],
  "expenses.approve": ["expenses", "approve"],
  "expenses.pay": ["expenses", "approve"],
  "expenses.category.view": ["expenses", "read"],
  "expenses.category.manage": ["expenses", "approve"],
  "expenses.export": ["expenses", "read"],
  // Payroll
  "payroll.view": ["payroll", "read"],
  "payroll.edit": ["payroll", "update"],
  "payroll.approve": ["payroll", "approve"],
  "payroll.finalize": ["payroll", "approve"],
  // Reports
  "reports.view": ["reports", "read"],
  "reports.export": ["reports", "create"],
  // Settings
  "settings.yield.view": ["user-admin", "read"],
  "settings.yield.edit": ["user-admin", "approve"],
  "settings.vat.view": ["user-admin", "read"],
  "settings.vat.edit": ["user-admin", "approve"],
  "settings.pricing.view": ["user-admin", "read"],
  "settings.pricing.edit": ["user-admin", "update"],
  "settings.packaging.view": ["user-admin", "read"],
  "settings.packaging.edit": ["user-admin", "update"],
  "settings.expense-categories.view": ["user-admin", "read"],
  "settings.expense-categories.edit": ["user-admin", "update"],
  // Administration
  "users.view": ["user-admin", "read"],
  "users.manage": ["user-admin", "update"],
  "approvals.view": ["approvals", "read"],
  "notifications.view": ["notifications", "read"],
}

/** Check whether a role can perform a UI action.
 *  Returns false for unknown actions or unknown roles (fail-safe). */
export function can(role: RoleId, action: UIAction): boolean {
  const entry = ACTION_MAP[action]
  if (!entry) return false
  const [moduleKey, scope] = entry
  const matrix = INITIAL_MATRIX[role]
  if (!matrix) return false
  return !!(matrix as Record<string, Record<string, boolean>>)[moduleKey]?.[
    scope
  ]
}

/** Returns all actions a role can perform (useful for debug / testing). */
export function allowedActions(role: RoleId): UIAction[] {
  return (Object.keys(ACTION_MAP) as UIAction[]).filter((a) => can(role, a))
}
