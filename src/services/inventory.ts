import { apiRequest, safeRequest } from "./api"

export type StockStatus = "healthy" | "low" | "critical" | "depleted" | "under-review" | "partially-reserved"
export type InventoryCategory = "green" | "roasted" | "packaging"
export type MovementType = "receipt" | "reservation" | "release" | "issue" | "transfer" | "adjustment" | "roasting-consumption" | "roasting-output" | "packing-consumption" | "return" | "correction"
export type MovementDirection = "inbound" | "outbound" | "internal"

export interface InventoryDashboardStats {
  green: {
    onHand: string
    reserved: string
    available: string
    status: StockStatus
    lotCount: number
  }
  roasted: {
    onHand: string
    reserved: string
    available: string
    status: StockStatus
    lotCount: number
  }
  packaging: {
    onHand: string
    reserved: string
    available: string
    status: StockStatus
    skuCount: number
  }
  attentionCount: number
}

export interface AttentionItem {
  id: string
  severity: "critical" | "warning" | "info"
  type: "low-stock" | "insufficient-stock" | "discrepancy" | "pending-adjustment" | "pending-transfer"
  title: string
  description: string
  lotId?: string
  category: InventoryCategory
}

export interface InventoryLot {
  id: string
  lotNumber: string
  category: InventoryCategory
  name: string
  origin?: string
  supplier?: string
  location: string
  receivedDate: string
  initialQty?: string
  onHand: string
  reserved: string
  available: string
  unit: string
  status: StockStatus
  threshold?: string
  orderConnections?: { orderId: string orderRef: string reservedQty: string }[]
  productionConnections?: {
    jobId: string
    jobRef: string
    type: "roasting" | "packing"
    qty: string
  }[]
}

export interface InventoryMovement {
  id: string
  lotId: string
  type: MovementType
  direction: MovementDirection
  qty: string
  unit: string
  reference?: string
  referenceType?: "order" | "roasting" | "receipt" | "adjustment" | "transfer" | "packing"
  timestamp: string
  actor: string
  notes?: string
}

export interface InventoryDiscrepancy {
  id: string
  lotId: string
  lotNumber: string
  expected: string
  recorded: string
  difference: string
  reason?: string
  reference?: string
  detectedAt: string
  detectedBy: string
  reviewStatus: "pending" | "accepted" | "adjusted" | "investigating"
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

export const WAREHOUSE_LOCATIONS = [
  "Main Warehouse — Aisle A, Bay 1",
  "Roasting Store — Shelf R1",
  "Packaging Store — Rack P1",
]

export async function getInventoryDashboardStats() {
  return safeRequest(async () =>
    apiRequest<InventoryDashboardStats>("/inventory/stats", "GET"),
  )
}

export async function getAttentionItems() {
  return safeRequest(async () =>
    apiRequest<AttentionItem[]>("/inventory/attention", "GET"),
  )
}

export async function listLots(params?: {
  category?: InventoryCategory
  status?: StockStatus
  search?: string
  page?: number
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams(params as any).toString()
    return apiRequest<{
      lots: InventoryLot[]
      total: number
      page: number
      pageSize: number
    }>(`/inventory/lots?${query}`, "GET")
  })
}

export async function getGreenLots(params?: {
  status?: StockStatus
  search?: string
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams({
      category: "green",
      ...params,
    }).toString()
    return apiRequest<{
      lots: InventoryLot[]
      total: number
      page: number
      pageSize: number
    }>(`/inventory/lots?${query}`, "GET")
  })
}

export async function getRoastedLots(params?: {
  status?: StockStatus
  search?: string
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams({
      category: "roasted",
      ...params,
    }).toString()
    return apiRequest<{
      lots: InventoryLot[]
      total: number
      page: number
      pageSize: number
    }>(`/inventory/lots?${query}`, "GET")
  })
}

export async function getPackagingLots(params?: {
  status?: StockStatus
  search?: string
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams({
      category: "packaging",
      ...params,
    }).toString()
    return apiRequest<{
      lots: InventoryLot[]
      total: number
      page: number
      pageSize: number
    }>(`/inventory/lots?${query}`, "GET")
  })
}

export async function getLot(lotId: string) {
  return safeRequest(async () =>
    apiRequest<InventoryLot>(`/inventory/lots/${lotId}`, "GET"),
  )
}

export async function getLotMovements(lotId: string) {
  return safeRequest(async () =>
    apiRequest<InventoryMovement[]>(
      `/inventory/lots/${lotId}/movements`,
      "GET",
    ),
  )
}

export async function getLotDiscrepancy(lotId: string) {
  return safeRequest(async () =>
    apiRequest<InventoryDiscrepancy | null>(
      `/inventory/lots/${lotId}/discrepancy`,
      "GET",
    ),
  )
}

export async function recordInventoryAdjustment(
  lotId: string,
  payload: {
    direction: "add" | "remove"
    quantity: string
    reason: string
    reference?: string
  },
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean movementId: string }>(
      `/inventory/lots/${lotId}/adjust`,
      "POST",
      payload,
    ),
  )
}

export async function recordInventoryTransfer(payload: {
  lotId: string
  fromLocation: string
  toLocation: string
  quantity: string
  reason: string
}) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean transferId: string }>(
      `/inventory/transfer`,
      "POST",
      payload,
    ),
  )
}

export async function reviewDiscrepancy(
  discrepancyId: string,
  decision: "accept" | "adjust" | "investigate",
  payload: { adjustedQty?: string notes: string },
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean }>(
      `/inventory/discrepancy/${discrepancyId}/review`,
      "POST",
      { decision, ...payload },
    ),
  )
}
