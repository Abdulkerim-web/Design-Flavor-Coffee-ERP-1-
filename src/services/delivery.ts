import { apiRequest, safeRequest } from "./api"

export type DeliveryStatus = "ready-for-delivery" | "assigned" | "out-for-delivery" | "partially-delivered" | "awaiting-confirmation" | "fully-delivered" | "delivery-disputed" | "failed-attempt" | "verified"
export type PaymentStatus = "payment-pending" | "partially-paid" | "paid" | "overdue"

export interface DeliveryEvent {
  id: string
  deliveryNumber: number
  quantity: string
  driver: string
  date: string
  status: "verified" | "awaiting-confirmation" | "failed" | "in-progress"
  proofDocument?: { name: string uploadedAt: string uploadedBy: string }
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
  customer: {
    id: string
    name: string
    contactName: string
    contactPhone: string
    branch?: string
  }
  salesRep: string
  assignedDriver?: string
  deliveryStatus: DeliveryStatus
  paymentStatus: PaymentStatus
  orderedQty: string
  deliveredQty: string
  remainingQty: string
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
  state: "completed" | "current" | "pending" | "warning"
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

export interface BankAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
}

export interface PaymentTransaction {
  id: string
  paymentNumber: number
  amount: string
  date: string
  bankAccount: BankAccount
  transferRef: string
  recordedBy: string
  verificationStatus: "verified" | "pending-verification" | "rejected"
  verifiedBy?: string
  verifiedAt?: string
  documentName?: string
}

export interface PaymentRecord {
  id: string
  ref: string
  orderRef: string
  customer: { id: string name: string contactName: string }
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  paymentStatus: PaymentStatus
  firstVerifiedDelivery?: string
  paymentDeadline?: string
  daysRemaining?: string
  daysRemainingNum?: number
  transactions: PaymentTransaction[]
  timeline: DeliveryTimelineEvent[]
}

export interface PaymentSummaryStats {
  paymentPending: number
  partiallyPaid: number
  paid: number
  overdue: number
  outstandingAmount: string
}

// Bank accounts are managed from the Banking module and stored in Supabase.
// This returns an empty list by default; real accounts come from /finance/accounts API.
const BANK_ACCOUNTS: BankAccount[] = []


export async function getDeliverySummary() {
  return safeRequest(async () =>
    apiRequest<DeliverySummary>("/delivery/summary", "GET"),
  )
}

export async function listDeliveries(filters?: {
  status?: DeliveryStatus
  search?: string
  paymentStatus?: PaymentStatus
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams(filters as any).toString()
    return apiRequest<DeliveryRecord[]>(`/delivery?${query}`, "GET")
  })
}

export async function getDelivery(id: string) {
  return safeRequest(async () =>
    apiRequest<DeliveryRecord>(`/delivery/${id}`, "GET"),
  )
}

export async function assignDriver(deliveryId: string, driverId: string) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean }>(`/delivery/${deliveryId}/assign`, "POST", {
      driverId,
    }),
  )
}

export async function startDelivery(deliveryId: string) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean status: string }>(
      `/delivery/${deliveryId}/start`,
      "POST",
    ),
  )
}

export async function uploadProofDocument(
  deliveryId: string,
  eventId: string,
  _file: File,
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean documentRef: string }>(
      `/delivery/${deliveryId}/proof/${eventId}`,
      "POST",
    ),
  )
}

export async function verifyCustomerAcceptance(
  deliveryId: string,
  eventId: string,
  confirmed: boolean,
  notes?: string,
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean status: string }>(
      `/delivery/${deliveryId}/verify/${eventId}`,
      "POST",
      { confirmed, notes },
    ),
  )
}

export async function reportFailedAttempt(
  deliveryId: string,
  reason: string,
  notes?: string,
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean }>(`/delivery/${deliveryId}/fail`, "POST", {
      reason,
      notes,
    }),
  )
}

export async function getPaymentSummary() {
  return safeRequest(async () =>
    apiRequest<PaymentSummaryStats>("/payments/summary", "GET"),
  )
}

export async function listPayments(filters?: {
  status?: PaymentStatus
  search?: string
}) {
  return safeRequest(async () => {
    const query = new URLSearchParams(filters as any).toString()
    return apiRequest<PaymentRecord[]>(`/payments?${query}`, "GET")
  })
}

export async function getPayment(id: string) {
  return safeRequest(async () =>
    apiRequest<PaymentRecord>(`/payments/${id}`, "GET"),
  )
}

export async function recordPayment(payload: {
  paymentId: string
  amount: string
  bankAccountId: string
  transferRef: string
  date: string
  notes?: string
  documentName?: string
}) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean ref: string }>(
      "/payments/record",
      "POST",
      payload,
    ),
  )
}

export async function verifyPayment(
  transactionId: string,
  managerId: string,
  notes?: string,
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean }>(
      `/payments/transaction/${transactionId}/verify`,
      "POST",
      { managerId, notes },
    ),
  )
}

export function getBankAccounts(): BankAccount[] {
  return BANK_ACCOUNTS
}
