import { apiRequest } from "./api"

export type PaymentStatus = "pending" | "completed" | "failed"
export type PaymentMethod = "bank_transfer" | "cash" | "check"

export interface FinancialStats {
  revenue: number
  outstanding: number
  overdue: number
  cashflow: number
}

export async function listPayments(filters?: {
  status?: PaymentStatus
  search?: string
}) {
  return apiRequest<any[]>("/finance/payments", "GET").catch(() => [])
}

export async function getPayment(id: string) {
  const payments = await listPayments()
  return payments.find((p) => p.id === id)
}

export async function processPayment(
  orderId: string,
  amount: number,
  method: PaymentMethod,
  ref: string,
) {
  return apiRequest("/finance/payments", "POST", {
    orderId,
    amount,
    method,
    ref,
  })
}

export async function getFinancialStats(): Promise<FinancialStats> {
  const payments = await listPayments()
  return {
    revenue: payments.reduce((acc, p) => acc + (p.amount || 0), 0),
    outstanding: 0,
    overdue: 0,
    cashflow: 0,
  }
}
