/**
 * ORDERS SERVICE
 * UI → OrdersService → mock data (future: PHP API)
 *
 * All values that would normally be calculated by the backend (VAT, feasibility,
 * shortfall, totals) are represented as opaque strings from the "server".
 * The frontend never recalculates them.
 */
import {
  apiRequest,
  safeRequest,
  type ListEnvelope,
  type PaginationParams,
  type SortParams,
} from "./api"
import type {
  OrderStatusKey,
  FeasibilityKey,
  PaymentStatusKey,
} from "../lib/orderStatus"

/* ─── Shape mirrors PHP API response ─────────────────────────── */
export interface OrderLineItem {
  id: string
  coffeeType: string
  origin: string
  roastLevel: string
  quantity: number
  unit: "KG"
  unitPrice: string // backend string: "ETB 1,680.00"
  lineTotal: string // backend string: "ETB 84,000.00"
}

export interface FeasibilityData {
  state: FeasibilityKey
  required: string // "60.6 KG" — from backend
  available: string // "50.0 KG" — from backend
  reserved: string // "0 KG"    — from backend
  shortfall?: string // "10.6 KG" — from backend, if applicable
  note?: string
}

export interface DeliveryProgress {
  completed: number
  total: number
  label: string // "0 / 1 deliveries completed" — from backend
}

export interface PaymentData {
  status: PaymentStatusKey
  total: string // "ETB 96,600.00" — from backend
  paid: string // "ETB 0.00"      — from backend
  remaining: string // "ETB 96,600.00" — from backend
  deadline?: string
  note?: string
}

export interface TimelineEvent {
  id: number
  event: string
  actor?: string
  timestamp: string
  note?: string
  quantity?: string
  state: "completed" | "current" | "warning" | "future"
}

export interface Order {
  id: string
  ref: string
  status: OrderStatusKey
  urgent: boolean
  customer: { id: string name: string ref: string status: string }
  salesRep: { id: string name: string } | null
  items: OrderLineItem[]
  totalQty: string // "80 KG" — from backend
  coffeeLabel: string
  subtotal: string // "ETB 156,000.00" — from backend
  vat: string // "ETB 23,400.00"  — from backend
  total: string // "ETB 179,400.00" — from backend
  feasibility?: FeasibilityData
  delivery: DeliveryProgress
  payment: PaymentData
  deliveryDate?: string
  deliveryAddress?: string
  branch?: string
  createdAt: string
  cancellationReason?: string
}

export interface OrderListFilters {
  search?: string
  status?: OrderStatusKey | ""
  urgency?: "urgent" | "normal" | ""
  customerId?: string
}

export interface CreateOrderPayload {
  customerId: string
  urgent: boolean
  notes: string
  lines: Array<{
    coffeeType: string
    origin: string
    roastLevel: string
    quantity: number
    unit: "KG"
  }>
  deliveryDate: string
  deliveryAddress: string
  deliveryContact: string
  deliveryNotes: string
}

export interface PricingEstimate {
  subtotal: string
  vat: string
  total: string
  note: string
}

/* ─── Service functions ───────────────────────────────────────── */

/** List orders with optional filtering and pagination. */
export async function listOrders(
  filters: OrderListFilters = {},
  pagination: PaginationParams = { page: 1, perPage: 20 },
  _sort?: SortParams,
) {
  return safeRequest<ListEnvelope<Order>>(async () => {
    // Fetch directly from our NestJS backend
    const all = await apiRequest<any[]>("/orders", "GET")

    const mapped: Order[] = all.map((o) => ({
      id: o.id,
      ref: o.orderNumber || "ORD-UNKNOWN",
      status: o.status || "PENDING_MANAGER_APPROVAL",
      urgent: o.isUrgent || false,
      customer: {
        id: o.customerId,
        name: "Customer Name",
        ref: "CUS-REF",
        status: "active",
      },
      salesRep: o.salesRepId ? { id: o.salesRepId, name: "Sales Rep" } : null,
      items:
        o.items?.map((item: any) => ({
          id: item.id,
          coffeeType: item.coffeeType,
          origin: item.origin || "Unknown",
          roastLevel: item.roastLevel || "Unknown",
          quantity: parseFloat(item.quantity),
          unit: "KG",
          unitPrice: `ETB ${item.unitPrice}`,
          lineTotal: `ETB ${item.lineTotal}`,
        })) || [],
      totalQty: "0 KG", // Calculate later
      coffeeLabel: "Mixed",
      subtotal: o.subtotalAmount ? `ETB ${o.subtotalAmount}` : "ETB 0.00",
      vat: o.vatAmount ? `ETB ${o.vatAmount}` : "ETB 0.00",
      total: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
      delivery: { completed: 0, total: 1, label: "0 / 1 deliveries completed" },
      payment: {
        status: "unpaid",
        total: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
        paid: "ETB 0.00",
        remaining: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
      },
      createdAt: o.createdAt,
    }))

    const filtered = mapped.filter((o) => {
      const q = (filters.search ?? "").toLowerCase()
      if (
        q &&
        !o.ref.toLowerCase().includes(q) &&
        !o.customer.name.toLowerCase().includes(q) &&
        !o.customer.ref.toLowerCase().includes(q)
      )
        return false
      if (filters.status && o.status !== filters.status) return false
      if (filters.urgency === "urgent" && !o.urgent) return false
      if (filters.urgency === "normal" && o.urgent) return false
      if (filters.customerId && o.customer.id !== filters.customerId)
        return false
      return true
    })

    const start = (pagination.page - 1) * pagination.perPage
    return {
      items: filtered.slice(start, start + pagination.perPage),
      total: filtered.length,
      page: pagination.page,
      perPage: pagination.perPage,
    }
  })
}

/** Fetch a single order by ID, including timeline. */
export async function getOrder(id: string) {
  return safeRequest<Order>(async () => {
    const o = await apiRequest<any>(`/orders/${id}`, "GET")
    if (!o) throw new Error(`Order ${id} not found.`)
    return {
      id: o.id,
      ref: o.orderNumber || "ORD-UNKNOWN",
      status: o.status || "PENDING_MANAGER_APPROVAL",
      urgent: o.isUrgent || false,
      customer: {
        id: o.customerId,
        name: "Customer Name",
        ref: "CUS-REF",
        status: "active",
      },
      salesRep: o.salesRepId ? { id: o.salesRepId, name: "Sales Rep" } : null,
      items:
        o.items?.map((item: any) => ({
          id: item.id,
          coffeeType: item.coffeeType,
          origin: item.origin || "Unknown",
          roastLevel: item.roastLevel || "Unknown",
          quantity: parseFloat(item.quantity),
          unit: "KG",
          unitPrice: `ETB ${item.unitPrice}`,
          lineTotal: `ETB ${item.lineTotal}`,
        })) || [],
      totalQty: "0 KG", // Calculate later
      coffeeLabel: "Mixed",
      subtotal: o.subtotalAmount ? `ETB ${o.subtotalAmount}` : "ETB 0.00",
      vat: o.vatAmount ? `ETB ${o.vatAmount}` : "ETB 0.00",
      total: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
      delivery: { completed: 0, total: 1, label: "0 / 1 deliveries completed" },
      payment: {
        status: "unpaid",
        total: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
        paid: "ETB 0.00",
        remaining: o.totalAmount ? `ETB ${o.totalAmount}` : "ETB 0.00",
      },
      createdAt: o.createdAt,
    }
  })
}

/** Fetch timeline for an order (separate call — can be lazy). */
export async function getOrderTimeline(
  orderId: string,
): Promise<TimelineEvent[]> {
  try {
    return await apiRequest<TimelineEvent[]>(
      `/orders/${orderId}/timeline`,
      "GET",
    )
  } catch (err) {
    return []
  }
}

/** Get a server-calculated pricing estimate for a new order. */
export async function getPricingEstimate(payload: Partial<CreateOrderPayload>) {
  return safeRequest<PricingEstimate>(async () =>
    apiRequest<PricingEstimate>("/orders/estimate", "POST", payload),
  )
}

/** Submit a new order to the server. */
export async function createOrder(_payload: CreateOrderPayload) {
  return safeRequest<{ ref: string }>(async () => {
    const res = await apiRequest<any>("/orders", "POST", {
      customerId: _payload.customerId,
      items: _payload.lines.map((line) => ({
        coffeeProductId: line.coffeeType, // Map coffeeType to ID conceptually
        quantity: line.quantity,
        unitPrice: 1000, // Temporary mock price until product catalog is wired
      })),
    })
    return { ref: res.orderNumber }
  })
}

/** Confirm an order (manager action). */
export async function confirmOrder(orderId: string, _managerId: string) {
  return safeRequest<{ success: boolean }>(async () => {
    await apiRequest(`/orders/${orderId}/confirm`, "POST")
    return { success: true }
  })
}

/** Reject an order (manager action). */
export async function rejectOrder(
  orderId: string,
  reason: string,
  _managerId: string,
) {
  return safeRequest<{ success: boolean }>(async () => {
    await apiRequest(`/orders/${orderId}/reject`, "POST", { reason })
    return { success: true }
  })
}
