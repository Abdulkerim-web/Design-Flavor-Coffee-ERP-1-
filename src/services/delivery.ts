/**
 * DELIVERY & PAYMENTS SERVICE
 * UI → Service → mock data (future: PHP API)
 *
 * ALL quantities, amounts, deadlines, remaining values, and statuses
 * are opaque strings from the backend. The frontend never calculates them.
 */
import { mockRequest, safeRequest } from './api'

/* ─── Delivery Types ────────────────────────────────────────── */

export type DeliveryStatus =
  | 'ready-for-delivery'
  | 'assigned'
  | 'out-for-delivery'
  | 'partially-delivered'
  | 'awaiting-confirmation'
  | 'fully-delivered'
  | 'delivery-disputed'
  | 'failed-attempt'
  | 'verified'

export type PaymentStatus =
  | 'payment-pending'
  | 'partially-paid'
  | 'paid'
  | 'overdue'

export interface DeliveryEvent {
  id: string
  deliveryNumber: number
  quantity: string         // "40.0 KG" — from backend
  driver: string
  date: string
  status: 'verified' | 'awaiting-confirmation' | 'failed' | 'in-progress'
  proofDocument?: { name: string; uploadedAt: string; uploadedBy: string }
  customerVerified?: boolean
  verifiedBy?: string
  verifiedAt?: string
  notes?: string
  failureReason?: string
}

export interface DeliveryRecord {
  id: string
  ref: string
  orderRef: string
  customer: { id: string; name: string; contactName: string; contactPhone: string; branch?: string }
  salesRep: string
  assignedDriver?: string
  deliveryStatus: DeliveryStatus
  paymentStatus: PaymentStatus
  orderedQty: string       // "100.0 KG" — from backend
  deliveredQty: string     // "70.0 KG"  — from backend
  remainingQty: string     // "30.0 KG"  — from backend
  deliveryAddress: string
  scheduledDate?: string
  urgent: boolean
  events: DeliveryEvent[]
  timeline: DeliveryTimelineEvent[]
  availableDrivers?: DriverOption[]
}

export interface DeliveryTimelineEvent {
  id: number
  event: string
  actor?: string
  timestamp: string
  quantity?: string
  notes?: string
  state: 'completed' | 'current' | 'pending' | 'warning'
}

export interface DriverOption {
  id: string
  name: string
  currentAssignments: number
  available: boolean
}

export interface DeliverySummary {
  readyForDelivery: number
  outForDelivery: number
  awaitingConfirmation: number
  partiallyDelivered: number
  deliveryDisputes: number
  fullyDelivered: number
}

/* ─── Payment Types ──────────────────────────────────────────── */

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string   // masked: "****4821"
}

export interface PaymentTransaction {
  id: string
  paymentNumber: number
  amount: string          // "ETB 40,000.00" — from backend
  date: string
  bankAccount: BankAccount
  transferRef: string
  recordedBy: string
  verificationStatus: 'verified' | 'pending-verification' | 'rejected'
  verifiedBy?: string
  verifiedAt?: string
  documentName?: string
}

export interface PaymentRecord {
  id: string
  ref: string
  orderRef: string
  customer: { id: string; name: string; contactName: string }
  totalAmount: string         // "ETB 179,400.00" — from backend
  paidAmount: string          // "ETB 96,600.00"  — from backend
  remainingAmount: string     // "ETB 82,800.00"  — from backend
  paymentStatus: PaymentStatus
  firstVerifiedDelivery?: string
  paymentDeadline?: string    // "August 16, 2026" — from backend
  daysRemaining?: string      // "4 days" or "2 days overdue" — from backend
  daysRemainingNum?: number   // raw number for styling only
  transactions: PaymentTransaction[]
  timeline: DeliveryTimelineEvent[]
}

export interface PaymentSummaryStats {
  paymentPending: number
  partiallyPaid: number
  paid: number
  overdue: number
  outstandingAmount: string   // "ETB 487,235.00" — from backend
}

/* ─── Mock Data ─────────────────────────────────────────────── */

const MOCK_DRIVERS: DriverOption[] = [
  { id: 'drv-1', name: 'Tesfaye Alemu',   currentAssignments: 1, available: true },
  { id: 'drv-2', name: 'Mulugeta Worku',  currentAssignments: 2, available: true },
  { id: 'drv-3', name: 'Henok Berhane',   currentAssignments: 0, available: true },
  { id: 'drv-4', name: 'Dawit Assefa',    currentAssignments: 3, available: false },
]

const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'ba-1', bankName: 'Commercial Bank of Ethiopia', accountName: 'Addis Coffee Trading PLC', accountNumber: '****4821' },
  { id: 'ba-2', bankName: 'Awash Bank',                  accountName: 'Addis Coffee Trading PLC', accountNumber: '****9034' },
]

const MOCK_DELIVERIES: DeliveryRecord[] = [
  {
    id: 'dlv-001',
    ref: 'DEL-0841',
    orderRef: 'ORD-1038',
    customer: { id: 'c1', name: 'Addis Hilton Hotel', contactName: 'Yonas Bekele', contactPhone: '+251 91 234 5678', branch: 'Main Kitchen' },
    salesRep: 'Hiwot Tadesse',
    assignedDriver: undefined,
    deliveryStatus: 'ready-for-delivery',
    paymentStatus: 'payment-pending',
    orderedQty: '120.0 KG',
    deliveredQty: '0.0 KG',
    remainingQty: '120.0 KG',
    deliveryAddress: 'Menelik II Ave, Addis Ababa — Loading Bay 2',
    scheduledDate: 'Aug 11, 2026',
    urgent: true,
    events: [],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Order Confirmed', actor: 'Abebe Girma', timestamp: 'Aug 6, 2026 09:00 AM', state: 'completed' },
      { id: 2, event: 'Packing Confirmed', actor: 'Solomon Bekele', timestamp: 'Aug 10, 2026 03:00 PM', state: 'completed' },
      { id: 3, event: 'Ready for Delivery', timestamp: 'Aug 10, 2026 05:00 PM', state: 'completed' },
      { id: 4, event: 'Awaiting Driver Assignment', timestamp: 'Pending', state: 'current' },
    ],
  },
  {
    id: 'dlv-002',
    ref: 'DEL-0840',
    orderRef: 'ORD-1037',
    customer: { id: 'c2', name: 'Ethiopian Airlines Catering', contactName: 'Mekdes Haile', contactPhone: '+251 91 876 5432', branch: 'Bole Catering Unit' },
    salesRep: 'Hiwot Tadesse',
    assignedDriver: 'Tesfaye Alemu',
    deliveryStatus: 'out-for-delivery',
    paymentStatus: 'payment-pending',
    orderedQty: '80.0 KG',
    deliveredQty: '0.0 KG',
    remainingQty: '80.0 KG',
    deliveryAddress: 'Bole International Airport, Catering Entrance — Gate C',
    scheduledDate: 'Aug 10, 2026',
    urgent: false,
    events: [],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Order Confirmed', actor: 'Abebe Girma', timestamp: 'Aug 4, 2026', state: 'completed' },
      { id: 2, event: 'Ready for Delivery', timestamp: 'Aug 7, 2026 05:30 PM', state: 'completed' },
      { id: 3, event: 'Driver Assigned', actor: 'Abebe Girma', timestamp: 'Aug 10, 2026 07:00 AM', state: 'completed' },
      { id: 4, event: 'Out for Delivery', actor: 'Tesfaye Alemu', timestamp: 'Aug 10, 2026 08:15 AM', quantity: '80.0 KG', state: 'completed' },
      { id: 5, event: 'Awaiting Customer Receipt', timestamp: 'In progress', state: 'current' },
    ],
  },
  {
    id: 'dlv-003',
    ref: 'DEL-0839',
    orderRef: 'ORD-1035',
    customer: { id: 'c3', name: 'Sheraton Addis', contactName: 'Abeba Tesfaye', contactPhone: '+251 91 555 1234', branch: 'F&B Department' },
    salesRep: 'Mulugeta Worku',
    assignedDriver: 'Mulugeta Worku',
    deliveryStatus: 'partially-delivered',
    paymentStatus: 'partially-paid',
    orderedQty: '150.0 KG',
    deliveredQty: '90.0 KG',
    remainingQty: '60.0 KG',
    deliveryAddress: 'Taitu St, Addis Ababa — Sheraton Loading Dock',
    scheduledDate: 'Aug 12, 2026',
    urgent: false,
    events: [
      {
        id: 'evt-1', deliveryNumber: 1,
        quantity: '90.0 KG', driver: 'Mulugeta Worku',
        date: 'Aug 8, 2026', status: 'verified',
        proofDocument: { name: 'Sheraton-Acceptance-DEL0839-1.pdf', uploadedAt: 'Aug 8, 2026 02:00 PM', uploadedBy: 'Mulugeta Worku' },
        customerVerified: true, verifiedBy: 'Abebe Girma', verifiedAt: 'Aug 8, 2026 04:30 PM',
      },
    ],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Order Confirmed', actor: 'Abebe Girma', timestamp: 'Aug 3, 2026', state: 'completed' },
      { id: 2, event: 'Ready for Delivery', timestamp: 'Aug 7, 2026', state: 'completed' },
      { id: 3, event: 'Delivery 1 — Out for Delivery', actor: 'Mulugeta Worku', timestamp: 'Aug 8, 2026 08:00 AM', quantity: '90.0 KG', state: 'completed' },
      { id: 4, event: 'Delivery 1 — Document Uploaded', actor: 'Mulugeta Worku', timestamp: 'Aug 8, 2026 01:45 PM', state: 'completed' },
      { id: 5, event: 'Delivery 1 — Customer Verified', actor: 'Abebe Girma', timestamp: 'Aug 8, 2026 04:30 PM', state: 'completed' },
      { id: 6, event: 'Partially Delivered', timestamp: '90/150 KG delivered', state: 'completed' },
      { id: 7, event: 'Remaining 60.0 KG — Awaiting Next Delivery', timestamp: 'Pending schedule', state: 'current' },
    ],
  },
  {
    id: 'dlv-004',
    ref: 'DEL-0838',
    orderRef: 'ORD-1034',
    customer: { id: 'c4', name: 'Monarch Hotel Group', contactName: 'Tigist Alemu', contactPhone: '+251 91 321 9876', branch: 'Head Office' },
    salesRep: 'Hiwot Tadesse',
    assignedDriver: 'Henok Berhane',
    deliveryStatus: 'awaiting-confirmation',
    paymentStatus: 'payment-pending',
    orderedQty: '50.0 KG',
    deliveredQty: '50.0 KG',
    remainingQty: '0.0 KG',
    deliveryAddress: 'Bole Road, Addis Ababa — Monarch Tower Loading Bay',
    scheduledDate: 'Aug 9, 2026',
    urgent: false,
    events: [
      {
        id: 'evt-2', deliveryNumber: 1,
        quantity: '50.0 KG', driver: 'Henok Berhane',
        date: 'Aug 9, 2026', status: 'awaiting-confirmation',
        proofDocument: { name: 'Monarch-Signed-DEL0838.jpg', uploadedAt: 'Aug 9, 2026 03:00 PM', uploadedBy: 'Henok Berhane' },
        customerVerified: false,
      },
    ],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Order Confirmed', timestamp: 'Aug 5, 2026', state: 'completed' },
      { id: 2, event: 'Ready for Delivery', timestamp: 'Aug 7, 2026', state: 'completed' },
      { id: 3, event: 'Driver Assigned', actor: 'Abebe Girma', timestamp: 'Aug 9, 2026 07:00 AM', state: 'completed' },
      { id: 4, event: 'Out for Delivery', actor: 'Henok Berhane', timestamp: 'Aug 9, 2026 08:00 AM', quantity: '50.0 KG', state: 'completed' },
      { id: 5, event: 'Customer Document Uploaded', actor: 'Henok Berhane', timestamp: 'Aug 9, 2026 03:00 PM', state: 'completed' },
      { id: 6, event: 'Awaiting Customer Confirmation', timestamp: 'Manager must call and confirm', state: 'current' },
    ],
  },
  {
    id: 'dlv-005',
    ref: 'DEL-0837',
    orderRef: 'ORD-1036',
    customer: { id: 'c5', name: "Kaldi's Coffee Franchise", contactName: 'Ermias Hailu', contactPhone: '+251 91 444 7890', branch: 'Bole Branch' },
    salesRep: 'Mulugeta Worku',
    assignedDriver: 'Dawit Assefa',
    deliveryStatus: 'delivery-disputed',
    paymentStatus: 'payment-pending',
    orderedQty: '38.0 KG',
    deliveredQty: '38.0 KG',
    remainingQty: '0.0 KG',
    deliveryAddress: "Bole Medhanialem Area, Kaldi's Franchise #7",
    scheduledDate: 'Aug 8, 2026',
    urgent: false,
    events: [
      {
        id: 'evt-3', deliveryNumber: 1,
        quantity: '38.0 KG', driver: 'Dawit Assefa',
        date: 'Aug 8, 2026', status: 'awaiting-confirmation',
        proofDocument: { name: 'Kaldis-Signed-DEL0837.pdf', uploadedAt: 'Aug 8, 2026 01:00 PM', uploadedBy: 'Dawit Assefa' },
        customerVerified: false,
        notes: 'Customer states they received only 30 KG, not 38 KG as recorded.',
      },
    ],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Ready for Delivery', timestamp: 'Aug 7, 2026', state: 'completed' },
      { id: 2, event: 'Driver Assigned', actor: 'Abebe Girma', timestamp: 'Aug 8, 2026 07:00 AM', state: 'completed' },
      { id: 3, event: 'Out for Delivery', actor: 'Dawit Assefa', timestamp: 'Aug 8, 2026 08:00 AM', state: 'completed' },
      { id: 4, event: 'Document Uploaded', actor: 'Dawit Assefa', timestamp: 'Aug 8, 2026 01:00 PM', state: 'completed' },
      { id: 5, event: 'Customer Did Not Confirm', actor: 'Abebe Girma', timestamp: 'Aug 8, 2026 05:00 PM', notes: 'Customer claims quantity discrepancy.', state: 'warning' },
      { id: 6, event: 'Delivery Disputed', timestamp: 'Under investigation', state: 'current' },
    ],
  },
  {
    id: 'dlv-006',
    ref: 'DEL-0836',
    orderRef: 'ORD-1033',
    customer: { id: 'c6', name: 'Blue Nile Trading Co.', contactName: 'Selamawit Fikru', contactPhone: '+251 91 789 4321', branch: 'Warehouse' },
    salesRep: 'Hiwot Tadesse',
    assignedDriver: 'Tesfaye Alemu',
    deliveryStatus: 'fully-delivered',
    paymentStatus: 'paid',
    orderedQty: '50.0 KG',
    deliveredQty: '50.0 KG',
    remainingQty: '0.0 KG',
    deliveryAddress: 'Gofa Industrial Zone, Addis Ababa — Warehouse Gate 3',
    scheduledDate: 'Aug 7, 2026',
    urgent: false,
    events: [
      {
        id: 'evt-4', deliveryNumber: 1,
        quantity: '50.0 KG', driver: 'Tesfaye Alemu',
        date: 'Aug 7, 2026', status: 'verified',
        proofDocument: { name: 'BlueNile-Acceptance-DEL0836.pdf', uploadedAt: 'Aug 7, 2026 02:30 PM', uploadedBy: 'Tesfaye Alemu' },
        customerVerified: true, verifiedBy: 'Abebe Girma', verifiedAt: 'Aug 7, 2026 05:00 PM',
      },
    ],
    availableDrivers: MOCK_DRIVERS,
    timeline: [
      { id: 1, event: 'Ready for Delivery', timestamp: 'Aug 6, 2026', state: 'completed' },
      { id: 2, event: 'Driver Assigned', actor: 'Abebe Girma', timestamp: 'Aug 7, 2026 07:00 AM', state: 'completed' },
      { id: 3, event: 'Out for Delivery', actor: 'Tesfaye Alemu', timestamp: 'Aug 7, 2026 08:00 AM', quantity: '50.0 KG', state: 'completed' },
      { id: 4, event: 'Document Uploaded', actor: 'Tesfaye Alemu', timestamp: 'Aug 7, 2026 02:30 PM', state: 'completed' },
      { id: 5, event: 'Customer Confirmed', actor: 'Abebe Girma', timestamp: 'Aug 7, 2026 05:00 PM', state: 'completed' },
      { id: 6, event: 'Delivery Verified', timestamp: 'Aug 7, 2026 05:00 PM', state: 'completed' },
      { id: 7, event: 'Payment Completed', timestamp: 'Aug 9, 2026', state: 'completed' },
    ],
  },
]

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    ref: 'PAY-0421',
    orderRef: 'ORD-1035',
    customer: { id: 'c3', name: 'Sheraton Addis', contactName: 'Abeba Tesfaye' },
    totalAmount: 'ETB 258,750.00',
    paidAmount: 'ETB 100,000.00',
    remainingAmount: 'ETB 158,750.00',
    paymentStatus: 'partially-paid',
    firstVerifiedDelivery: 'Aug 8, 2026',
    paymentDeadline: 'Aug 15, 2026',
    daysRemaining: '5 days remaining',
    daysRemainingNum: 5,
    transactions: [
      { id: 'txn-1', paymentNumber: 1, amount: 'ETB 100,000.00', date: 'Aug 10, 2026', bankAccount: BANK_ACCOUNTS[0], transferRef: 'CBE-TXN-8821044', recordedBy: 'Liya Mekonnen', verificationStatus: 'verified', verifiedBy: 'Abebe Girma', verifiedAt: 'Aug 10, 2026 03:00 PM' },
    ],
    timeline: [
      { id: 1, event: 'First Verified Delivery', timestamp: 'Aug 8, 2026', state: 'completed' },
      { id: 2, event: 'Payment Window Started', timestamp: 'Aug 8, 2026 — Deadline: Aug 15, 2026', state: 'completed' },
      { id: 3, event: 'Payment 1 Recorded', actor: 'Liya Mekonnen', timestamp: 'Aug 10, 2026', quantity: 'ETB 100,000.00', state: 'completed' },
      { id: 4, event: 'Payment 1 Verified', actor: 'Abebe Girma', timestamp: 'Aug 10, 2026 03:00 PM', state: 'completed' },
      { id: 5, event: 'Remaining Balance: ETB 158,750.00', timestamp: 'Deadline: Aug 15, 2026', state: 'current' },
    ],
  },
  {
    id: 'pay-002',
    ref: 'PAY-0420',
    orderRef: 'ORD-1033',
    customer: { id: 'c6', name: 'Blue Nile Trading Co.', contactName: 'Selamawit Fikru' },
    totalAmount: 'ETB 86,250.00',
    paidAmount: 'ETB 86,250.00',
    remainingAmount: 'ETB 0.00',
    paymentStatus: 'paid',
    firstVerifiedDelivery: 'Aug 7, 2026',
    paymentDeadline: 'Aug 14, 2026',
    daysRemaining: 'Paid in full',
    daysRemainingNum: 99,
    transactions: [
      { id: 'txn-2', paymentNumber: 1, amount: 'ETB 50,000.00', date: 'Aug 8, 2026', bankAccount: BANK_ACCOUNTS[1], transferRef: 'AWB-TXN-441890', recordedBy: 'Liya Mekonnen', verificationStatus: 'verified', verifiedBy: 'Abebe Girma', verifiedAt: 'Aug 8, 2026 04:00 PM' },
      { id: 'txn-3', paymentNumber: 2, amount: 'ETB 36,250.00', date: 'Aug 9, 2026', bankAccount: BANK_ACCOUNTS[1], transferRef: 'AWB-TXN-441945', recordedBy: 'Liya Mekonnen', verificationStatus: 'verified', verifiedBy: 'Abebe Girma', verifiedAt: 'Aug 9, 2026 02:00 PM' },
    ],
    timeline: [
      { id: 1, event: 'First Verified Delivery', timestamp: 'Aug 7, 2026', state: 'completed' },
      { id: 2, event: 'Payment Window Started', timestamp: 'Aug 7, 2026', state: 'completed' },
      { id: 3, event: 'Payment 1 Recorded', actor: 'Liya Mekonnen', timestamp: 'Aug 8, 2026', quantity: 'ETB 50,000.00', state: 'completed' },
      { id: 4, event: 'Payment 2 Recorded', actor: 'Liya Mekonnen', timestamp: 'Aug 9, 2026', quantity: 'ETB 36,250.00', state: 'completed' },
      { id: 5, event: 'Payment Completed', timestamp: 'Aug 9, 2026 02:00 PM', state: 'completed' },
    ],
  },
  {
    id: 'pay-003',
    ref: 'PAY-0419',
    orderRef: 'ORD-1031',
    customer: { id: 'c7', name: 'Addis Tej Restaurant', contactName: 'Bekele Mamo' },
    totalAmount: 'ETB 112,125.00',
    paidAmount: 'ETB 0.00',
    remainingAmount: 'ETB 112,125.00',
    paymentStatus: 'overdue',
    firstVerifiedDelivery: 'Aug 1, 2026',
    paymentDeadline: 'Aug 8, 2026',
    daysRemaining: '2 days overdue',
    daysRemainingNum: -2,
    transactions: [],
    timeline: [
      { id: 1, event: 'First Verified Delivery', timestamp: 'Aug 1, 2026', state: 'completed' },
      { id: 2, event: 'Payment Window Started', timestamp: 'Aug 1, 2026 — Deadline: Aug 8, 2026', state: 'completed' },
      { id: 3, event: 'Payment Deadline Passed', timestamp: 'Aug 8, 2026', state: 'warning' },
      { id: 4, event: 'Payment Overdue', timestamp: 'Aug 10, 2026 — Outstanding: ETB 112,125.00', state: 'current' },
    ],
  },
  {
    id: 'pay-004',
    ref: 'PAY-0418',
    orderRef: 'ORD-1034',
    customer: { id: 'c4', name: 'Monarch Hotel Group', contactName: 'Tigist Alemu' },
    totalAmount: 'ETB 86,250.00',
    paidAmount: 'ETB 0.00',
    remainingAmount: 'ETB 86,250.00',
    paymentStatus: 'payment-pending',
    firstVerifiedDelivery: undefined,
    paymentDeadline: 'Pending first verified delivery',
    daysRemaining: 'Awaiting delivery verification',
    daysRemainingNum: undefined,
    transactions: [],
    timeline: [
      { id: 1, event: 'Order Confirmed', timestamp: 'Aug 5, 2026', state: 'completed' },
      { id: 2, event: 'Delivery Awaiting Customer Confirmation', timestamp: 'Aug 9, 2026', state: 'current' },
      { id: 3, event: 'Payment Window — Not Yet Started', timestamp: 'Pending first verified delivery', state: 'pending' },
    ],
  },
]

const MOCK_SUMMARY: DeliverySummary = {
  readyForDelivery: 1,
  outForDelivery: 1,
  awaitingConfirmation: 1,
  partiallyDelivered: 1,
  deliveryDisputes: 1,
  fullyDelivered: 1,
}

const MOCK_PAYMENT_SUMMARY: PaymentSummaryStats = {
  paymentPending: 1,
  partiallyPaid: 1,
  paid: 1,
  overdue: 1,
  outstandingAmount: 'ETB 357,125.00',
}

/* ─── Service Functions ──────────────────────────────────────── */

export async function getDeliverySummary() {
  return safeRequest(async () => mockRequest(MOCK_SUMMARY, 450))
}

export async function listDeliveries(filters?: { status?: DeliveryStatus; search?: string; paymentStatus?: PaymentStatus }) {
  return safeRequest(async () => {
    const all = await mockRequest(MOCK_DELIVERIES, 550)
    if (!filters) return all
    return all.filter(d => {
      if (filters.status && d.deliveryStatus !== filters.status) return false
      if (filters.paymentStatus && d.paymentStatus !== filters.paymentStatus) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!d.ref.toLowerCase().includes(q) && !d.orderRef.toLowerCase().includes(q) && !d.customer.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  })
}

export async function getDelivery(id: string) {
  return safeRequest(async () => {
    const all = await mockRequest(MOCK_DELIVERIES, 400)
    const d = all.find(x => x.id === id)
    if (!d) throw new Error(`Delivery ${id} not found.`)
    return d
  })
}

export async function assignDriver(deliveryId: string, driverId: string) {
  return safeRequest(async () => {
    void deliveryId; void driverId
    return mockRequest({ success: true }, 1200)
  })
}

export async function startDelivery(deliveryId: string) {
  return safeRequest(async () => {
    void deliveryId
    return mockRequest({ success: true, status: 'out-for-delivery' }, 1200)
  })
}

export async function uploadProofDocument(deliveryId: string, eventId: string, _file: File) {
  return safeRequest(async () => {
    void deliveryId; void eventId
    return mockRequest({ success: true, documentRef: 'DOC-0291' }, 2000)
  })
}

export async function verifyCustomerAcceptance(deliveryId: string, eventId: string, confirmed: boolean, notes?: string) {
  return safeRequest(async () => {
    void deliveryId; void eventId; void confirmed; void notes
    return mockRequest({ success: true, status: confirmed ? 'verified' : 'delivery-disputed' }, 1400)
  })
}

export async function reportFailedAttempt(deliveryId: string, reason: string, notes?: string) {
  return safeRequest(async () => {
    void deliveryId; void reason; void notes
    return mockRequest({ success: true }, 1200)
  })
}

export async function getPaymentSummary() {
  return safeRequest(async () => mockRequest(MOCK_PAYMENT_SUMMARY, 450))
}

export async function listPayments(filters?: { status?: PaymentStatus; search?: string }) {
  return safeRequest(async () => {
    const all = await mockRequest(MOCK_PAYMENTS, 550)
    if (!filters) return all
    return all.filter(p => {
      if (filters.status && p.paymentStatus !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!p.ref.toLowerCase().includes(q) && !p.orderRef.toLowerCase().includes(q) && !p.customer.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  })
}

export async function getPayment(id: string) {
  return safeRequest(async () => {
    const all = await mockRequest(MOCK_PAYMENTS, 400)
    const p = all.find(x => x.id === id)
    if (!p) throw new Error(`Payment ${id} not found.`)
    return p
  })
}

export async function recordPayment(payload: {
  paymentId: string; amount: string; bankAccountId: string
  transferRef: string; date: string; notes?: string; documentName?: string
}) {
  return safeRequest(async () => {
    void payload
    return mockRequest({ success: true, ref: 'PAY-0422' }, 1600)
  })
}

export async function verifyPayment(transactionId: string, managerId: string, notes?: string) {
  return safeRequest(async () => {
    void transactionId; void managerId; void notes
    return mockRequest({ success: true }, 1200)
  })
}

export function getBankAccounts(): BankAccount[] {
  return BANK_ACCOUNTS
}
