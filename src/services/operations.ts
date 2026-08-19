import { apiRequest } from "./api"

export type LotQCStatus = "pending" | "approved" | "rejected"
export type RoastingJobStatus = "waiting" | "active" | "completed" | "needs-review" | "archived"
export type PackingJobStatus = "ready-for-packing" | "active" | "completed" | "ready-for-delivery"

export interface RoastingDashboardStats {
  waiting: number
  active: number
  completedToday: number
  needsReview: number
}

/* ─── Service Functions ──────────────────────────────────────── */

export async function listInventoryLots(filters?: {
  qcStatus?: LotQCStatus
  search?: string
}) {
  const all = await apiRequest<any[]>("/receiving", "GET").catch(() => [])
  return all.map((l) => ({
    id: l.id,
    lotNumber: l.lot?.lotNumber || "LOT-UNK",
    coffee: l.lot?.coffeeType || "Coffee",
    origin: l.lot?.origin || "Unknown",
    quantity: l.lot?.quantity ? l.lot.quantity + " KG" : "0 KG",
    qcStatus: l.lot?.qcStatus || "pending",
    supplier: "Supplier",
    receivedAt: l.createdAt,
    lastMovement: l.updatedAt,
  }))
}

export async function getInventoryLot(id: string) {
  const lots = await listInventoryLots()
  return lots.find((l) => l.id === id)
}

export async function getLotMovements(lotId: string) {
  return []
}

export async function confirmGreenCoffeeWeight(
  lotId: string,
  confirmedQty: string,
  notes: string,
) {
  return apiRequest("/receiving", "POST", { lotId, confirmedQty, notes })
}

export async function approveGreenCoffeeReceipt(
  lotId: string,
  managerId: string,
  notes: string,
) {
  return apiRequest(`/receiving/${lotId}/approve`, "POST", { managerId, notes })
}

export async function listRoastingJobs(filters?: {
  status?: RoastingJobStatus
  search?: string
}) {
  try {
    const raw = await apiRequest<any[]>("/roasting", "GET").catch(() => [])
    const items = Array.isArray(raw) ? raw : []
    return {
      data: items.map((r: any) => ({
        id: r.id,
        ref: r.batchNumber || `RST-${String(r.id).slice(0, 6).toUpperCase()}`,
        orderRef: r.order?.orderNumber || r.orderId || "—",
        customer: r.customer?.name ?? r.order?.customer?.name ?? "—",
        coffee: r.coffee || r.coffeeType || "Guji Grade 1 Natural",
        roastLevel: "Medium",
        targetQty: (r.targetQuantity || r.greenInputQuantity || r.green_input_quantity || 60) + " KG",
        roastedQty: r.actualRoastedQuantity ? r.actualRoastedQuantity + " KG" : "-",
        yield: r.appliedYieldPercentage ? r.appliedYieldPercentage + "%" : "-",
        status:
          r.status === "COMPLETED"
            ? "completed"
            : r.status === "ROASTING"
            ? "active"
            : r.status === "SCHEDULED"
            ? "waiting"
            : "waiting",
        urgent: false,
        roaster: "Head Roaster",
        startedAt: r.createdAt || r.created_at ? new Date(r.createdAt || r.created_at).toLocaleDateString() : "-",
        completedAt: r.updatedAt || r.updated_at ? new Date(r.updatedAt || r.updated_at).toLocaleDateString() : "-",
        machine: "Roaster 1",
        notes: r.notes || "",
        timeline: [],
      })),
      error: null,
    }
  } catch (err: any) {
    return { data: [], error: err?.message || "Failed to load roasting jobs" }
  }
}

export async function getRoastingJob(id: string) {
  const { data: jobs } = await listRoastingJobs()
  return (jobs ?? []).find((j) => j.id === id) ?? null
}

export async function startRoasting(jobId: string) {
  return apiRequest(`/roasting/${jobId}/start`, "POST")
}

export async function completeBatch(
  jobId: string,
  payload: { greenInputQty: string outputQty: string notes?: string },
) {
  return apiRequest(`/roasting/${jobId}/complete`, "POST", payload)
}

export async function getRoastingDashboardStats() {
  const { data: jobs = [] } = await listRoastingJobs()
  const waiting = (jobs ?? []).filter((j) => j.status === "waiting").length
  const active = (jobs ?? []).filter((j) => j.status === "active").length
  const completed = (jobs ?? []).filter((j) => j.status === "completed").length
  const needsReview = (jobs ?? []).filter((j) => j.status === "needs-review" || j.status === "discrepancy").length
  return {
    data: { waiting, active, completedToday: completed, needsReview },
    error: null,
  }
}

export async function reportRoastingComplete(
  jobId: string,
  totalOutput: string,
  notes?: string,
) {
  return completeBatch(jobId, {
    greenInputQty: "0",
    outputQty: totalOutput,
    notes,
  })
}

export async function confirmRoastedReceipt(
  jobId: string,
  confirmedQty: string,
  storekeeperNotes?: string,
) {
  return { success: true }
}

export async function reviewRoastingDiscrepancy(
  jobId: string,
  decision: "approve" | "adjust",
  adjustedQty?: string,
  reason?: string,
) {
  return { success: true }
}

export async function listPackingJobs(filters?: {
  status?: PackingJobStatus
  search?: string
}) {
  return apiRequest<any[]>("/packing", "GET").catch(() => [])
}

export async function getPackingJob(id: string) {
  const jobs = await listPackingJobs()
  return jobs.find((j) => j.id === id)
}

export async function submitPackingConfirmation(
  jobId: string,
  packedQty: string,
  materials: Array<{ materialId: string usedQty: string }>,
  notes?: string,
) {
  return apiRequest("/packing", "POST", { jobId, packedQty, materials, notes })
}

export async function managerConfirmPacking(
  jobId: string,
  managerId: string,
  notes?: string,
) {
  return apiRequest(`/packing/${jobId}/confirm`, "POST", { managerId, notes })
}

export async function reviewPackingDiscrepancy(
  jobId: string,
  decision: "approve" | "reject",
  reason?: string,
) {
  return { success: true }
}
