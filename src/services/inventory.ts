/**
 * INVENTORY SERVICE — F3-08
 * All stock quantities, values, and availability are opaque strings from the backend.
 * Frontend renders. Backend calculates.
 */
import { mockRequest, safeRequest } from './api'

/* ─── Stock status types ──────────────────────────────────────── */

export type StockStatus = 'healthy' | 'low' | 'critical' | 'depleted' | 'under-review' | 'partially-reserved'

export type InventoryCategory = 'green' | 'roasted' | 'packaging'

export type MovementType =
  | 'receipt'
  | 'reservation'
  | 'release'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'roasting-consumption'
  | 'roasting-output'
  | 'packing-consumption'
  | 'return'
  | 'correction'

export type MovementDirection = 'inbound' | 'outbound' | 'internal'

/* ─── Dashboard stats ─────────────────────────────────────────── */

export interface InventoryDashboardStats {
  green: {
    onHand: string; reserved: string; available: string; status: StockStatus; lotCount: number
  }
  roasted: {
    onHand: string; reserved: string; available: string; status: StockStatus; lotCount: number
  }
  packaging: {
    onHand: string; reserved: string; available: string; status: StockStatus; skuCount: number
  }
  attentionCount: number
}

export interface AttentionItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: 'low-stock' | 'insufficient-stock' | 'discrepancy' | 'pending-adjustment' | 'pending-transfer'
  title: string
  description: string
  lotId?: string
  category: InventoryCategory
}

/* ─── Lot ─────────────────────────────────────────────────────── */

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
  orderConnections?: { orderId: string; orderRef: string; reservedQty: string }[]
  productionConnections?: { jobId: string; jobRef: string; type: 'roasting' | 'packing'; qty: string }[]
}

/* ─── Movement ────────────────────────────────────────────────── */

export interface InventoryMovement {
  id: string
  lotId: string
  type: MovementType
  direction: MovementDirection
  qty: string
  unit: string
  reference?: string
  referenceType?: 'order' | 'roasting' | 'receipt' | 'adjustment' | 'transfer' | 'packing'
  timestamp: string
  actor: string
  notes?: string
}

/* ─── Discrepancy ─────────────────────────────────────────────── */

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
  reviewStatus: 'pending' | 'accepted' | 'adjusted' | 'investigating'
  reviewedBy?: string
  reviewedAt?: string
  reviewNotes?: string
}

/* ─── Mock data ───────────────────────────────────────────────── */

const MOCK_DASHBOARD_STATS: InventoryDashboardStats = {
  green:    { onHand: '1,855.0 KG', reserved: '370.0 KG', available: '1,485.0 KG', status: 'healthy', lotCount: 8 },
  roasted:  { onHand: '380.0 KG',   reserved: '135.0 KG', available: '245.0 KG',   status: 'low',     lotCount: 4 },
  packaging:{ onHand: '14,650 units', reserved: '2,400 units', available: '12,250 units', status: 'healthy', skuCount: 6 },
  attentionCount: 3,
}

const MOCK_ATTENTION: AttentionItem[] = [
  {
    id: 'att-1', severity: 'critical', type: 'low-stock', category: 'green',
    title: 'Sidama Green Coffee — Critical Stock',
    description: 'Available: 95.0 KG · Threshold: 100 KG',
    lotId: 'lot-g4',
  },
  {
    id: 'att-2', severity: 'warning', type: 'low-stock', category: 'roasted',
    title: 'Harrar Dark Roast — Low Stock',
    description: 'Available: 42.0 KG · Threshold: 80 KG',
    lotId: 'lot-r3',
  },
  {
    id: 'att-3', severity: 'warning', type: 'discrepancy', category: 'green',
    title: 'Discrepancy — Lot GC-2026-014',
    description: 'Expected 500 KG · Recorded 488 KG',
    lotId: 'lot-g1',
  },
]

const MOCK_GREEN_LOTS: InventoryLot[] = [
  {
    id: 'lot-g1', lotNumber: 'GC-2026-014', category: 'green',
    name: 'Sidamo Natural', origin: 'Sidama', supplier: 'Sidama Coffee Farmers Union',
    location: 'Main Warehouse — Aisle A, Bay 2', receivedDate: 'Aug 04, 2026',
    initialQty: '500.0 KG', onHand: '488.0 KG', reserved: '120.0 KG', available: '368.0 KG',
    unit: 'KG', status: 'under-review', threshold: '100 KG',
    orderConnections: [{ orderId: 'ord-482', orderRef: 'ORD-10482', reservedQty: '60.0 KG' }, { orderId: 'ord-491', orderRef: 'ORD-10491', reservedQty: '60.0 KG' }],
    productionConnections: [{ jobId: 'rj-002', jobRef: 'ROAST-022', type: 'roasting', qty: '66.0 KG' }],
  },
  {
    id: 'lot-g2', lotNumber: 'GC-2026-011', category: 'green',
    name: 'Ethiopian Yirgacheffe', origin: 'Yirgacheffe', supplier: 'Worka Washing Station',
    location: 'Main Warehouse — Aisle A, Bay 1', receivedDate: 'Aug 01, 2026',
    initialQty: '850.0 KG', onHand: '850.0 KG', reserved: '220.0 KG', available: '630.0 KG',
    unit: 'KG', status: 'healthy', threshold: '200 KG',
    orderConnections: [{ orderId: 'ord-480', orderRef: 'ORD-10480', reservedQty: '120.0 KG' }],
  },
  {
    id: 'lot-g3', lotNumber: 'GC-2026-009', category: 'green',
    name: 'Ethiopian Guji', origin: 'Guji', supplier: 'Kayon Mountain Farm',
    location: 'Main Warehouse — Aisle B, Bay 1', receivedDate: 'Jul 28, 2026',
    initialQty: '420.0 KG', onHand: '420.0 KG', reserved: '90.0 KG', available: '330.0 KG',
    unit: 'KG', status: 'healthy', threshold: '150 KG',
  },
  {
    id: 'lot-g4', lotNumber: 'GC-2026-007', category: 'green',
    name: 'Sidama Grade 1', origin: 'Sidama', supplier: 'Bekele Agro Export',
    location: 'Main Warehouse — Aisle C, Bay 3', receivedDate: 'Jul 20, 2026',
    initialQty: '300.0 KG', onHand: '95.0 KG', reserved: '0 KG', available: '95.0 KG',
    unit: 'KG', status: 'critical', threshold: '100 KG',
  },
  {
    id: 'lot-g5', lotNumber: 'GC-2026-006', category: 'green',
    name: 'Ethiopian Limu', origin: 'Limu', supplier: 'Jimma Farmers Cooperative',
    location: 'Main Warehouse — Aisle B, Bay 3', receivedDate: 'Jul 28, 2026',
    initialQty: '180.0 KG', onHand: '180.0 KG', reserved: '50.0 KG', available: '130.0 KG',
    unit: 'KG', status: 'low', threshold: '150 KG',
  },
  {
    id: 'lot-g6', lotNumber: 'GC-2026-004', category: 'green',
    name: 'Ethiopian Harrar', origin: 'Harrar', supplier: 'Harar Coffee Traders Union',
    location: 'Main Warehouse — Aisle C, Bay 1', receivedDate: 'Aug 03, 2026',
    initialQty: '310.0 KG', onHand: '310.0 KG', reserved: '60.0 KG', available: '250.0 KG',
    unit: 'KG', status: 'healthy', threshold: '100 KG',
  },
]

const MOCK_ROASTED_LOTS: InventoryLot[] = [
  {
    id: 'lot-r1', lotNumber: 'RC-2026-021', category: 'roasted',
    name: 'Ethiopian Yirgacheffe — Light Roast', location: 'Roasting Store — Shelf R1',
    receivedDate: 'Aug 07, 2026', onHand: '60.0 KG', reserved: '60.0 KG', available: '0 KG',
    unit: 'KG', status: 'partially-reserved', threshold: '20 KG',
    orderConnections: [{ orderId: 'ord-480', orderRef: 'ORD-10480', reservedQty: '60.0 KG' }],
  },
  {
    id: 'lot-r2', lotNumber: 'RC-2026-019', category: 'roasted',
    name: 'Ethiopian Guji — Medium Roast', location: 'Roasting Store — Shelf R2',
    receivedDate: 'Aug 08, 2026', onHand: '40.0 KG', reserved: '0 KG', available: '40.0 KG',
    unit: 'KG', status: 'healthy', threshold: '20 KG',
  },
  {
    id: 'lot-r3', lotNumber: 'RC-2026-015', category: 'roasted',
    name: 'Ethiopian Harrar — Dark Roast', location: 'Roasting Store — Shelf R3',
    receivedDate: 'Aug 02, 2026', onHand: '50.0 KG', reserved: '8.0 KG', available: '42.0 KG',
    unit: 'KG', status: 'low', threshold: '80 KG',
    orderConnections: [{ orderId: 'ord-491', orderRef: 'ORD-10491', reservedQty: '8.0 KG' }],
  },
  {
    id: 'lot-r4', lotNumber: 'RC-2026-013', category: 'roasted',
    name: 'Sidama — Medium Roast', location: 'Roasting Store — Shelf R2',
    receivedDate: 'Aug 04, 2026', onHand: '230.0 KG', reserved: '67.0 KG', available: '163.0 KG',
    unit: 'KG', status: 'healthy', threshold: '50 KG',
  },
]

const MOCK_PACKAGING_LOTS: InventoryLot[] = [
  {
    id: 'lot-p1', lotNumber: 'PKG-2026-041', category: 'packaging',
    name: '250g Kraft Valve Bag', location: 'Packaging Store — Rack P1',
    receivedDate: 'Aug 01, 2026', onHand: '4,500 units', reserved: '1,200 units', available: '3,300 units',
    unit: 'units', status: 'healthy', threshold: '1,000 units',
  },
  {
    id: 'lot-p2', lotNumber: 'PKG-2026-039', category: 'packaging',
    name: '500g Kraft Valve Bag', location: 'Packaging Store — Rack P2',
    receivedDate: 'Jul 30, 2026', onHand: '2,800 units', reserved: '600 units', available: '2,200 units',
    unit: 'units', status: 'healthy', threshold: '1,000 units',
  },
  {
    id: 'lot-p3', lotNumber: 'PKG-2026-035', category: 'packaging',
    name: '1 KG Kraft Valve Bag', location: 'Packaging Store — Rack P1',
    receivedDate: 'Jul 25, 2026', onHand: '1,200 units', reserved: '400 units', available: '800 units',
    unit: 'units', status: 'healthy', threshold: '500 units',
  },
  {
    id: 'lot-p4', lotNumber: 'PKG-2026-030', category: 'packaging',
    name: 'Cardboard Shipping Box (10 KG)', location: 'Packaging Store — Bay S2',
    receivedDate: 'Jul 20, 2026', onHand: '380 units', reserved: '180 units', available: '200 units',
    unit: 'units', status: 'low', threshold: '500 units',
  },
  {
    id: 'lot-p5', lotNumber: 'PKG-2026-028', category: 'packaging',
    name: 'Cardboard Shipping Box (5 KG)', location: 'Packaging Store — Bay S1',
    receivedDate: 'Jul 20, 2026', onHand: '1,600 units', reserved: '220 units', available: '1,380 units',
    unit: 'units', status: 'healthy', threshold: '600 units',
  },
  {
    id: 'lot-p6', lotNumber: 'PKG-2026-022', category: 'packaging',
    name: 'One-Way Degassing Valve', location: 'Packaging Store — Rack P3',
    receivedDate: 'Jul 15, 2026', onHand: '6,170 units', reserved: '0 units', available: '6,170 units',
    unit: 'units', status: 'healthy', threshold: '2,000 units',
  },
]

const MOCK_LOT_MOVEMENTS: Record<string, InventoryMovement[]> = {
  'lot-g1': [
    { id: 'mv-001', lotId: 'lot-g1', type: 'receipt', direction: 'inbound', qty: '+500.0 KG', unit: 'KG', reference: 'GRN-2026-041', referenceType: 'receipt', timestamp: 'Aug 04, 2026 · 09:32 AM', actor: 'Solomon Bekele', notes: 'Initial receipt from Sidama Coffee Farmers Union' },
    { id: 'mv-002', lotId: 'lot-g1', type: 'reservation', direction: 'internal', qty: '−60.0 KG', unit: 'KG', reference: 'ORD-10482', referenceType: 'order', timestamp: 'Aug 05, 2026 · 11:15 AM', actor: 'System', notes: 'Reserved for confirmed order' },
    { id: 'mv-003', lotId: 'lot-g1', type: 'reservation', direction: 'internal', qty: '−60.0 KG', unit: 'KG', reference: 'ORD-10491', referenceType: 'order', timestamp: 'Aug 06, 2026 · 02:40 PM', actor: 'System' },
    { id: 'mv-004', lotId: 'lot-g1', type: 'adjustment', direction: 'outbound', qty: '−12.0 KG', unit: 'KG', reference: 'ADJ-2026-008', referenceType: 'adjustment', timestamp: 'Aug 07, 2026 · 08:50 AM', actor: 'Abebe Girma', notes: 'Weight discrepancy correction — physical recount' },
  ],
  'lot-g2': [
    { id: 'mv-010', lotId: 'lot-g2', type: 'receipt', direction: 'inbound', qty: '+850.0 KG', unit: 'KG', reference: 'GRN-2026-038', referenceType: 'receipt', timestamp: 'Aug 01, 2026 · 10:05 AM', actor: 'Solomon Bekele' },
    { id: 'mv-011', lotId: 'lot-g2', type: 'reservation', direction: 'internal', qty: '−120.0 KG', unit: 'KG', reference: 'ORD-10480', referenceType: 'order', timestamp: 'Aug 02, 2026 · 09:22 AM', actor: 'System' },
    { id: 'mv-012', lotId: 'lot-g2', type: 'reservation', direction: 'internal', qty: '−100.0 KG', unit: 'KG', reference: 'ROAST-021', referenceType: 'roasting', timestamp: 'Aug 05, 2026 · 07:30 AM', actor: 'System', notes: 'Reserved for roasting job' },
  ],
  'lot-r3': [
    { id: 'mv-020', lotId: 'lot-r3', type: 'roasting-output', direction: 'inbound', qty: '+65.0 KG', unit: 'KG', reference: 'ROAST-018', referenceType: 'roasting', timestamp: 'Aug 02, 2026 · 14:20 PM', actor: 'Dawit Haile' },
    { id: 'mv-021', lotId: 'lot-r3', type: 'packing-consumption', direction: 'outbound', qty: '−15.0 KG', unit: 'KG', reference: 'PACK-016', referenceType: 'packing', timestamp: 'Aug 03, 2026 · 09:00 AM', actor: 'Meseret Girma' },
    { id: 'mv-022', lotId: 'lot-r3', type: 'reservation', direction: 'internal', qty: '−8.0 KG', unit: 'KG', reference: 'ORD-10491', referenceType: 'order', timestamp: 'Aug 06, 2026 · 03:15 PM', actor: 'System' },
  ],
}

const MOCK_DISCREPANCY: InventoryDiscrepancy = {
  id: 'disc-001',
  lotId: 'lot-g1',
  lotNumber: 'GC-2026-014',
  expected: '500.0 KG',
  recorded: '488.0 KG',
  difference: '−12.0 KG',
  reason: 'Physical recount identified weight loss during storage.',
  reference: 'ADJ-2026-008',
  detectedAt: 'Aug 07, 2026 · 08:45 AM',
  detectedBy: 'Solomon Bekele',
  reviewStatus: 'pending',
}

/* ─── Locations for transfer form ────────────────────────────── */

export const WAREHOUSE_LOCATIONS = [
  'Main Warehouse — Aisle A, Bay 1',
  'Main Warehouse — Aisle A, Bay 2',
  'Main Warehouse — Aisle B, Bay 1',
  'Main Warehouse — Aisle B, Bay 3',
  'Main Warehouse — Aisle C, Bay 1',
  'Main Warehouse — Aisle C, Bay 3',
  'Roasting Store — Shelf R1',
  'Roasting Store — Shelf R2',
  'Roasting Store — Shelf R3',
  'Packaging Store — Rack P1',
  'Packaging Store — Rack P2',
  'Packaging Store — Rack P3',
  'Packaging Store — Bay S1',
  'Packaging Store — Bay S2',
  'Quarantine Area — Q-1',
]

/* ─── Service functions ───────────────────────────────────────── */

export async function getInventoryDashboardStats() {
  return safeRequest(async () => mockRequest(MOCK_DASHBOARD_STATS, 400))
}

export async function getAttentionItems() {
  return safeRequest(async () => mockRequest(MOCK_ATTENTION, 300))
}

export async function listLots(params?: { category?: InventoryCategory; status?: StockStatus; search?: string; page?: number }) {
  const all = [...MOCK_GREEN_LOTS, ...MOCK_ROASTED_LOTS, ...MOCK_PACKAGING_LOTS]
  let filtered = all
  if (params?.category) filtered = filtered.filter(l => l.category === params.category)
  if (params?.status) filtered = filtered.filter(l => l.status === params.status)
  if (params?.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.lotNumber.toLowerCase().includes(q) ||
      (l.origin ?? '').toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q),
    )
  }
  return safeRequest(async () => mockRequest({ lots: filtered, total: filtered.length, page: params?.page ?? 1, pageSize: 20 }, 500))
}

export async function getGreenLots(params?: { status?: StockStatus; search?: string }) {
  let filtered = [...MOCK_GREEN_LOTS]
  if (params?.status) filtered = filtered.filter(l => l.status === params.status)
  if (params?.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.lotNumber.toLowerCase().includes(q) || (l.origin ?? '').toLowerCase().includes(q))
  }
  return safeRequest(async () => mockRequest({ lots: filtered, total: filtered.length, page: 1, pageSize: 20 }, 500))
}

export async function getRoastedLots(params?: { status?: StockStatus; search?: string }) {
  let filtered = [...MOCK_ROASTED_LOTS]
  if (params?.status) filtered = filtered.filter(l => l.status === params.status)
  if (params?.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.lotNumber.toLowerCase().includes(q))
  }
  return safeRequest(async () => mockRequest({ lots: filtered, total: filtered.length, page: 1, pageSize: 20 }, 450))
}

export async function getPackagingLots(params?: { status?: StockStatus; search?: string }) {
  let filtered = [...MOCK_PACKAGING_LOTS]
  if (params?.status) filtered = filtered.filter(l => l.status === params.status)
  if (params?.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(l => l.name.toLowerCase().includes(q) || l.lotNumber.toLowerCase().includes(q))
  }
  return safeRequest(async () => mockRequest({ lots: filtered, total: filtered.length, page: 1, pageSize: 20 }, 450))
}

export async function getLot(lotId: string) {
  const all = [...MOCK_GREEN_LOTS, ...MOCK_ROASTED_LOTS, ...MOCK_PACKAGING_LOTS]
  const found = all.find(l => l.id === lotId) ?? null
  return safeRequest(async () => mockRequest(found, 400))
}

export async function getLotMovements(lotId: string) {
  const movements = MOCK_LOT_MOVEMENTS[lotId] ?? []
  return safeRequest(async () => mockRequest(movements, 400))
}

export async function getLotDiscrepancy(lotId: string) {
  const disc = lotId === 'lot-g1' ? MOCK_DISCREPANCY : null
  return safeRequest(async () => mockRequest(disc, 300))
}

export async function recordInventoryAdjustment(lotId: string, payload: {
  direction: 'add' | 'remove'
  quantity: string
  reason: string
  reference?: string
}) {
  void lotId; void payload
  return safeRequest(async () => mockRequest({ success: true, movementId: `mv-${Date.now()}` }, 900))
}

export async function recordInventoryTransfer(payload: {
  lotId: string
  fromLocation: string
  toLocation: string
  quantity: string
  reason: string
}) {
  void payload
  return safeRequest(async () => mockRequest({ success: true, transferId: `TRF-${Date.now()}` }, 900))
}

export async function reviewDiscrepancy(discrepancyId: string, decision: 'accept' | 'adjust' | 'investigate', payload: {
  adjustedQty?: string
  notes: string
}) {
  void discrepancyId; void decision; void payload
  return safeRequest(async () => mockRequest({ success: true }, 800))
}

/* ─── Legacy exports (kept for backward compat) ──────────────── */

export interface GreenCoffeeStock {
  id: string; origin: string; variety: string; grade: string
  onHand: string; reserved: string; available: string
  reorderPoint: string; unitCost: string; lastReceived: string
  supplier: string; status: 'adequate' | 'low' | 'critical'
}

export interface RoastedCoffeeStock {
  id: string; coffeeType: string; roastLevel: string; batchRef: string
  onHand: string; reserved: string; available: string; roastedAt: string
}

export interface PackagingStock {
  id: string; item: string; unit: string
  onHand: string; reserved: string; available: string
  reorderPoint: string; status: 'adequate' | 'low' | 'critical'
}

export async function listGreenStock() {
  return safeRequest(async () => mockRequest([] as GreenCoffeeStock[], 500))
}

export async function listRoastedStock() {
  return safeRequest(async () => mockRequest([] as RoastedCoffeeStock[], 450))
}

export async function listPackagingStock() {
  return safeRequest(async () => mockRequest([] as PackagingStock[], 450))
}
