/**
 * SERVICE LAYER — barrel export
 *
 * Import from here in UI components:
 *   import { listOrders, getOrder } from '../services'
 *
 * When the PHP backend is ready, replace the mock implementations inside
 * each service file with real fetch() calls. The UI imports do not change.
 */
export * from "./api"
export * from "./orders"
export * from "./customers"
export * from "./finance"
export * from "./operations"
export * from "./delivery"
export * from "./finance-ops"
