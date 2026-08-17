import { apiRequest } from './api';

export type LotQCStatus = 'pending' | 'approved' | 'rejected'
export type RoastingJobStatus = 'waiting' | 'active' | 'completed' | 'needs-review' | 'archived'
export type PackingJobStatus = 'ready-for-packing' | 'active' | 'completed' | 'ready-for-delivery'

export interface RoastingDashboardStats {
  waiting: number
  active: number
  completedToday: number
  needsReview: number
}

/* ─── Service Functions ──────────────────────────────────────── */

export async function listInventoryLots(filters?: { qcStatus?: LotQCStatus; search?: string }) {
  const all = await apiRequest<any[]>('/receiving', 'GET').catch(() => []);
  return all.map(l => ({
    id: l.id,
    lotNumber: l.lot?.lotNumber || 'LOT-UNK',
    coffee: l.lot?.coffeeType || 'Coffee',
    origin: l.lot?.origin || 'Unknown',
    quantity: l.lot?.quantity ? l.lot.quantity + ' KG' : '0 KG',
    qcStatus: l.lot?.qcStatus || 'pending',
    supplier: 'Supplier',
    receivedAt: l.createdAt,
    lastMovement: l.updatedAt
  }));
}

export async function getInventoryLot(id: string) {
  const lots = await listInventoryLots();
  return lots.find(l => l.id === id);
}

export async function getLotMovements(lotId: string) {
  return [];
}

export async function confirmGreenCoffeeWeight(lotId: string, confirmedQty: string, notes: string) {
  return apiRequest('/receiving', 'POST', { lotId, confirmedQty, notes });
}

export async function approveGreenCoffeeReceipt(lotId: string, managerId: string, notes: string) {
  return apiRequest(`/receiving/${lotId}/approve`, 'POST', { managerId, notes });
}

export async function listRoastingJobs(filters?: { status?: RoastingJobStatus; search?: string }) {
  const raw = await apiRequest<any[]>('/roasting', 'GET').catch(() => []);
  return raw.map(r => ({
    id: r.id,
    ref: r.batchNumber || 'RST-000',
    orderRef: 'ORD-UNKNOWN',
    customer: 'Customer',
    coffee: 'Coffee Product',
    roastLevel: 'Medium',
    targetQty: r.targetQuantity + ' KG',
    roastedQty: r.actualRoastedQuantity ? r.actualRoastedQuantity + ' KG' : '-',
    yield: r.yieldPercentage ? r.yieldPercentage + '%' : '-',
    status: r.status === 'COMPLETED' ? 'completed' : 'waiting',
    roaster: 'Head Roaster',
    startedAt: r.startedAt || '-',
    completedAt: r.completedAt || '-',
    machine: 'Roaster 1',
    timeline: []
  }));
}

export async function getRoastingJob(id: string) {
  const jobs = await listRoastingJobs();
  return jobs.find(j => j.id === id);
}

export async function startRoasting(jobId: string) {
  return apiRequest(`/roasting/${jobId}/start`, 'POST');
}

export async function completeBatch(jobId: string, payload: { greenInputQty: string; outputQty: string; notes?: string }) {
  return apiRequest(`/roasting/${jobId}/complete`, 'POST', payload);
}

export async function getRoastingDashboardStats() {
  const jobs = await listRoastingJobs();
  return { waiting: jobs.length, active: 0, completedToday: jobs.length, needsReview: 0 };
}

export async function reportRoastingComplete(jobId: string, totalOutput: string, notes?: string) {
  return completeBatch(jobId, { greenInputQty: '0', outputQty: totalOutput, notes });
}

export async function confirmRoastedReceipt(jobId: string, confirmedQty: string, storekeeperNotes?: string) {
  return { success: true };
}

export async function reviewRoastingDiscrepancy(jobId: string, decision: 'approve' | 'adjust', adjustedQty?: string, reason?: string) {
  return { success: true };
}

export async function listPackingJobs(filters?: { status?: PackingJobStatus; search?: string }) {
  return apiRequest<any[]>('/packing', 'GET').catch(() => []);
}

export async function getPackingJob(id: string) {
  const jobs = await listPackingJobs();
  return jobs.find(j => j.id === id);
}

export async function submitPackingConfirmation(jobId: string, packedQty: string, materials: Array<{ materialId: string; usedQty: string }>, notes?: string) {
  return apiRequest('/packing', 'POST', { jobId, packedQty, materials, notes });
}

export async function managerConfirmPacking(jobId: string, managerId: string, notes?: string) {
  return apiRequest(`/packing/${jobId}/confirm`, 'POST', { managerId, notes });
}

export async function reviewPackingDiscrepancy(jobId: string, decision: 'approve' | 'reject', reason?: string) {
  return { success: true };
}
