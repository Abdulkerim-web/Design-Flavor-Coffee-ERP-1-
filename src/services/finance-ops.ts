import { apiRequest, safeRequest } from "./api"

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  note?: string
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────

export interface FinanceAlert {
  id: string
  severity: "critical" | "warning" | "info"
  message: string
  link?: string
  linkLabel?: string
}

export interface FinanceDashboardSummary {
  totalCustomerPayments: string
  outstandingBalances: string
  overdueCount: number
  thisMonthExpenses: string
  pendingExpenseApprovals: string
  pendingExpenseCount: number
  currentPayrollTotal: string
  payrollPeriod: string
  payrollStatus: string
  totalBankBalance: string
  alerts: FinanceAlert[]
}

export interface FinanceActivityRecord {
  id: string
  date: string
  type: string
  ref: string
  description: string
  amount: string
  account: string
  status: string
  recordedBy: string
}

export async function getFinanceDashboard() {
  return safeRequest(async () =>
    apiRequest<FinanceDashboardSummary>("/finance/dashboard", "GET"),
  )
}

export async function listFinanceActivity(filters?: Record<string, string>) {
  return safeRequest(async () => {
    const query = new URLSearchParams(filters as any).toString()
    return apiRequest<FinanceActivityRecord[]>(
      `/finance/activity?${query}`,
      "GET",
    )
  })
}

// ─── Banking ──────────────────────────────────────────────────────────────────

export type ReconciliationStatus = "reconciled" | "pending" | "discrepancy"

export interface BankAccountRecord {
  id: string
  bankName: string
  accountName: string
  maskedAccountNumber: string
  rawAccountRef: string
  calculatedBalance: string
  lastTransactionDate: string
  lastTransactionDesc: string
  reconciliationStatus: ReconciliationStatus
  reconciliationPeriod: string
  openingBalance: string
  transactionCount: number
}

export interface BankTransaction {
  id: string
  ref: string
  date: string
  description: string
  type: string
  debit: string | null
  credit: string | null
  runningBalance: string
  status: "posted" | "pending" | "reconciled" | "queried"
  recordedBy: string
  relatedRef?: string
  relatedType?: string
  relatedLabel?: string
}

export interface ReconciliationRecord {
  accountId: string
  period: string
  erpBalance: string
  statementBalance: string | null
  difference: string | null
  status: ReconciliationStatus
  outstandingItemCount: number
  lastReconciledAt: string | null
  reconciledBy: string | null
}

export interface BankingSummary {
  totalBalance: string
  incomingThisMonth: string
  outgoingThisMonth: string
  needsReconciliationCount: number
}

export async function getBankingSummary() {
  return safeRequest(async () =>
    apiRequest<BankingSummary>("/finance/banking/summary", "GET"),
  )
}

export interface ReconciliationListItem {
  accountId: string
  account: string
  period: string
  systemBalance: string
  statementBalance: string | null
  difference: string | null
  status: ReconciliationStatus
  lastReconciledAt: string | null
}

export async function listAllReconciliations() {
  return safeRequest(async () =>
    apiRequest<ReconciliationListItem[]>("/finance/reconciliations", "GET"),
  )
}

export interface ReconTxn {
  id: string
  date: string
  ref: string
  description: string
  amount: string
  direction: "incoming" | "outgoing"
  matchedTo?: string
  status: "matched" | "unmatched" | "under-review"
}

export interface ReconciliationDetail {
  accountId: string
  account: string
  period: string
  systemBalance: string
  statementBalance: string | null
  difference: string | null
  status: ReconciliationStatus
  matchedTransactions: ReconTxn[]
  unmatchedTransactions: ReconTxn[]
  outstandingItemCount: number
  completedBy?: string
  completedAt?: string
  lastReconciledAt: string | null
  reconciledBy: string | null
  timeline: AuditEvent[]
}

export async function getReconciliationDetail(accountId: string) {
  return safeRequest(async () =>
    apiRequest<ReconciliationDetail>(
      `/finance/reconciliation/${accountId}/detail`,
      "GET",
    ),
  )
}

export async function recordBankTransaction(payload: {
  accountId: string
  type: string
  direction: "incoming" | "outgoing"
  amount: string
  date: string
  ref?: string
  description: string
  notes?: string
}) {
  return safeRequest(async () =>
    apiRequest<BankTransaction>("/finance/transactions", "POST", payload),
  )
}

export async function transferFunds(payload: {
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  ref?: string
  notes?: string
}) {
  return safeRequest(async () =>
    apiRequest<{ status: string ref: string }>(
      "/finance/transfer",
      "POST",
      payload,
    ),
  )
}

export async function matchTransactionRecon(
  accountId: string,
  transactionId: string,
) {
  return safeRequest(async () =>
    apiRequest<{ success: boolean }>(
      `/finance/reconciliation/${accountId}/match/${transactionId}`,
      "POST",
    ),
  )
}

export async function recordAdjustment(payload: {
  accountId: string
  amount: string
  reason: string
  notes?: string
}) {
  return safeRequest(async () =>
    apiRequest<{ ref: string status: string }>(
      "/finance/adjustment",
      "POST",
      payload,
    ),
  )
}

export async function completeReconciliation(accountId: string) {
  return safeRequest(async () =>
    apiRequest<ReconciliationDetail>(
      `/finance/reconciliation/${accountId}/complete`,
      "POST",
    ),
  )
}

export async function listBankAccounts() {
  return safeRequest(async () =>
    apiRequest<BankAccountRecord[]>("/finance/accounts", "GET"),
  )
}

export async function getBankAccount(id: string) {
  return safeRequest(async () =>
    apiRequest<BankAccountRecord>(`/finance/accounts/${id}`, "GET"),
  )
}

export async function listBankTransactions(
  accountId: string,
  filters?: Record<string, string>,
) {
  return safeRequest(async () => {
    const query = new URLSearchParams(filters as any).toString()
    return apiRequest<BankTransaction[]>(
      `/finance/accounts/${accountId}/transactions?${query}`,
      "GET",
    )
  })
}

export async function getReconciliation(accountId: string) {
  return safeRequest(async () =>
    apiRequest<ReconciliationRecord>(
      `/finance/reconciliation/${accountId}`,
      "GET",
    ),
  )
}

export async function submitStatementBalance(
  accountId: string,
  statementBalance: string,
  period: string,
) {
  return safeRequest(async () =>
    apiRequest<ReconciliationRecord>(
      `/finance/reconciliation/${accountId}/statement`,
      "POST",
      { statementBalance, period },
    ),
  )
}

export async function markReconciled(accountId: string) {
  return safeRequest(async () =>
    apiRequest<ReconciliationRecord>(
      `/finance/reconciliation/${accountId}/mark-reconciled`,
      "POST",
    ),
  )
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseStatus = "pending-approval" | "approved" | "rejected" | "paid" | "cancelled"

export interface FullExpense {
  id: string
  ref: string
  category: string
  description: string
  amount: string
  date: string
  requestedBy: string
  status: ExpenseStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  paidBy?: string
  paidAt?: string
  paymentAccount?: string
  paymentRef?: string
  notes?: string
  hasDocument: boolean
  timeline: AuditEvent[]
}

export interface ExpenseSummaryData {
  thisMonth: string
  pendingApproval: string
  pendingCount: number
  approved: string
  paid: string
  rejected: string
  total: string
  categories: string[]
}

export async function getExpenseSummary() {
  return safeRequest(async () =>
    apiRequest<ExpenseSummaryData>("/finance/expenses/summary", "GET"),
  )
}

export async function listExpensesFull(filters?: Record<string, string>) {
  return safeRequest(async () => {
    const query = new URLSearchParams(filters as any).toString()
    return apiRequest<FullExpense[]>(`/finance/expenses?${query}`, "GET")
  })
}

export async function getExpense(id: string) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}`, "GET"),
  )
}

export async function createExpense(payload: {
  category: string
  description: string
  amount: string
  date: string
  notes?: string
}) {
  return safeRequest(async () =>
    apiRequest<FullExpense>("/finance/expenses", "POST", payload),
  )
}

export async function approveExpense(id: string, managerId: string) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}/approve`, "POST", {
      managerId,
    }),
  )
}

export async function rejectExpense(id: string, reason: string) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}/reject`, "POST", {
      reason,
    }),
  )
}

export async function payExpense(
  id: string,
  paymentAccount: string,
  paymentRef: string,
) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}/pay`, "POST", {
      paymentAccount,
      paymentRef,
    }),
  )
}

export async function cancelExpense(id: string) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}/cancel`, "POST"),
  )
}

export async function editExpense(
  id: string,
  payload: {
    category?: string
    description?: string
    amount?: string
    date?: string
    notes?: string
  },
) {
  return safeRequest(async () =>
    apiRequest<FullExpense>(`/finance/expenses/${id}`, "PUT", payload),
  )
}

export async function exportExpenses(params: {
  format: "csv" | "pdf"
  dateRange: string
}) {
  return safeRequest(async () =>
    apiRequest<{ exportRef: string format: string message: string }>(
      "/finance/expenses/export",
      "POST",
      params,
    ),
  )
}

export interface ExpenseCategory {
  id: string
  name: string
  description: string
  status: "active" | "inactive"
  usageCount: number
}

export async function listExpenseCategories() {
  return safeRequest(async () =>
    apiRequest<ExpenseCategory[]>("/finance/expense-categories", "GET"),
  )
}

export async function createExpenseCategory(payload: {
  name: string
  description: string
}) {
  return safeRequest(async () =>
    apiRequest<ExpenseCategory>("/finance/expense-categories", "POST", payload),
  )
}

export async function updateExpenseCategory(
  id: string,
  payload: { name?: string description?: string },
) {
  return safeRequest(async () =>
    apiRequest<ExpenseCategory>(
      `/finance/expense-categories/${id}`,
      "PUT",
      payload,
    ),
  )
}

export async function deactivateExpenseCategory(id: string) {
  return safeRequest(async () =>
    apiRequest<ExpenseCategory>(
      `/finance/expense-categories/${id}/deactivate`,
      "POST",
    ),
  )
}

export const EXPENSE_CATEGORIES = [
  "Transport",
  "Utilities",
  "Supplies",
  "Maintenance",
  "Office",
  "Other",
]

// ─── Payroll ──────────────────────────────────────────────────────────────────

export type PayrollRunStatus = "draft" | "pending-approval" | "approved" | "paid" | "closed"
export type PayrollReviewStatus = "ok" | "needs-review"
export type PayrollPaymentStatus = "pending" | "paid"

export interface PayrollEmployee {
  id: string
  name: string
  role: string
  baseAmount: string
  adjustments: string
  finalAmount: string
  reviewStatus: PayrollReviewStatus
  paymentStatus: PayrollPaymentStatus
  reviewReason?: string
  changeHistory?: {
    previousAmount: string
    newAmount: string
    reason: string
    changedBy: string
    changedAt: string
  }[]
}

export interface PayrollRun {
  id: string
  period: string
  status: PayrollRunStatus
  employeeCount: number
  totalAmount: string
  pendingReviewCount: number
  changesCount: number
  approvedBy?: string
  approvedAt?: string
  finalizedBy?: string
  finalizedAt?: string
  employees: PayrollEmployee[]
  timeline: AuditEvent[]
}

export async function getPayrollRun(period?: string) {
  const query = period ? `?period=${encodeURIComponent(period)}` : ""
  return safeRequest(async () =>
    apiRequest<PayrollRun>(`/finance/payroll${query}`, "GET"),
  )
}

export async function updatePayrollAmount(
  runId: string,
  employeeId: string,
  newAmount: string,
  reason: string,
) {
  return safeRequest(async () =>
    apiRequest<PayrollRun>(
      `/finance/payroll/${runId}/employee/${employeeId}`,
      "PUT",
      { newAmount, reason },
    ),
  )
}

export async function submitPayrollForApproval(runId: string) {
  return safeRequest(async () =>
    apiRequest<PayrollRun>(`/finance/payroll/${runId}/submit`, "POST"),
  )
}

export async function approvePayrollRun(runId: string, managerId: string) {
  return safeRequest(async () =>
    apiRequest<PayrollRun>(`/finance/payroll/${runId}/approve`, "POST", {
      managerId,
    }),
  )
}

export async function finalizePayrollRun(runId: string) {
  return safeRequest(async () =>
    apiRequest<PayrollRun>(`/finance/payroll/${runId}/finalize`, "POST"),
  )
}
