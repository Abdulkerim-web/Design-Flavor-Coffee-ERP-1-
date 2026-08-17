/**
 * FINANCE-OPS SERVICE — Banking, Expenses, Payroll
 * All monetary values are backend-authoritative opaque strings.
 * The frontend never calculates balances, totals, or differences.
 */
import { mockRequest, safeRequest } from './api'

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
  severity: 'critical' | 'warning' | 'info'
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

const MOCK_DASHBOARD: FinanceDashboardSummary = {
  totalCustomerPayments: 'ETB 381,500.00',
  outstandingBalances: 'ETB 258,350.00',
  overdueCount: 2,
  thisMonthExpenses: 'ETB 42,800.00',
  pendingExpenseApprovals: 'ETB 8,700.00',
  pendingExpenseCount: 3,
  currentPayrollTotal: 'ETB 124,500.00',
  payrollPeriod: 'August 2026',
  payrollStatus: 'draft',
  totalBankBalance: 'ETB 1,246,800.00',
  alerts: [
    { id: 'a1', severity: 'critical', message: '2 customer payments are overdue.', link: '#payments', linkLabel: 'View Payments' },
    { id: 'a2', severity: 'warning',  message: '3 expense requests are awaiting Manager approval.', link: '#expenses', linkLabel: 'Review Expenses' },
    { id: 'a3', severity: 'info',     message: 'August 2026 payroll run is in Draft status.', link: '#payroll', linkLabel: 'Open Payroll' },
  ],
}

const MOCK_ACTIVITY: FinanceActivityRecord[] = [
  { id: 'fa1', date: 'Aug 10, 2026', type: 'Customer Payment',  ref: 'PAY-0112', description: 'Partial payment — Addis Coffee Traders',  amount: 'ETB 94,185.00', account: 'CBE — 1000045823',   status: 'Verified', recordedBy: 'Tigist Alemu' },
  { id: 'fa2', date: 'Aug 9, 2026',  type: 'Expense Payment',   ref: 'EXP-0041', description: 'Vehicle maintenance — delivery truck',    amount: 'ETB 8,500.00',  account: 'Awash — 0132900441',status: 'Paid',     recordedBy: 'Abebe Girma' },
  { id: 'fa3', date: 'Aug 8, 2026',  type: 'Customer Payment',  ref: 'PAY-0111', description: 'Full payment — Harar Roasters',            amount: 'ETB 56,400.00', account: 'CBE — 1000045823',   status: 'Verified', recordedBy: 'Tigist Alemu' },
  { id: 'fa4', date: 'Aug 5, 2026',  type: 'Expense Payment',   ref: 'EXP-0040', description: 'Monthly electricity — roasting facility', amount: 'ETB 12,400.00', account: 'CBE — 1000045823',   status: 'Paid',     recordedBy: 'Abebe Girma' },
  { id: 'fa5', date: 'Aug 1, 2026',  type: 'Opening Balance',   ref: 'TXN-AUG-OB','description': 'Opening balance — August 2026',       amount: 'ETB 892,500.00','account': 'CBE — 1000045823',  status: 'Reconciled', recordedBy: 'System' },
]

export async function getFinanceDashboard() {
  return safeRequest(async () => mockRequest(MOCK_DASHBOARD, 500))
}

export async function listFinanceActivity(_filters?: Record<string, string>) {
  return safeRequest(async () => mockRequest(MOCK_ACTIVITY, 550))
}

// ─── Banking ──────────────────────────────────────────────────────────────────

export type ReconciliationStatus = 'reconciled' | 'pending' | 'discrepancy'

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
  status: 'posted' | 'pending' | 'reconciled' | 'queried'
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

const MOCK_BANK_ACCOUNTS: BankAccountRecord[] = [
  {
    id: 'ba-cbe',
    bankName: 'Commercial Bank of Ethiopia',
    accountName: 'Yirgacheffe Premium Coffee PLC',
    maskedAccountNumber: '1000 •••• •••• 5823',
    rawAccountRef: 'CBE — 1000045823',
    calculatedBalance: 'ETB 1,024,300.00',
    lastTransactionDate: 'Aug 10, 2026',
    lastTransactionDesc: 'Customer payment — PAY-0112',
    reconciliationStatus: 'pending',
    reconciliationPeriod: 'July 2026',
    openingBalance: 'ETB 892,500.00',
    transactionCount: 24,
  },
  {
    id: 'ba-awash',
    bankName: 'Awash Bank',
    accountName: 'Yirgacheffe Premium Coffee PLC',
    maskedAccountNumber: '0132 •••• •••• 0441',
    rawAccountRef: 'Awash — 0132900441',
    calculatedBalance: 'ETB 222,500.00',
    lastTransactionDate: 'Aug 9, 2026',
    lastTransactionDesc: 'Expense payment — EXP-0041',
    reconciliationStatus: 'reconciled',
    reconciliationPeriod: 'July 2026',
    openingBalance: 'ETB 300,000.00',
    transactionCount: 11,
  },
]

const MOCK_TRANSACTIONS: Record<string, BankTransaction[]> = {
  'ba-cbe': [
    { id: 'bt1', ref: 'TXN-0088', date: 'Aug 10, 2026', description: 'Customer payment — Addis Coffee Traders', type: 'Credit', debit: null,           credit: 'ETB 94,185.00',  runningBalance: 'ETB 1,024,300.00', status: 'posted',      recordedBy: 'Tigist Alemu', relatedRef: 'PAY-0112', relatedType: 'Payment', relatedLabel: 'Payment PAY-0112' },
    { id: 'bt2', ref: 'TXN-0087', date: 'Aug 8, 2026',  description: 'Customer payment — Harar Roasters',     type: 'Credit', debit: null,           credit: 'ETB 56,400.00',  runningBalance: 'ETB 930,115.00',  status: 'reconciled',  recordedBy: 'Tigist Alemu', relatedRef: 'PAY-0111', relatedType: 'Payment', relatedLabel: 'Payment PAY-0111' },
    { id: 'bt3', ref: 'TXN-0086', date: 'Aug 5, 2026',  description: 'Monthly electricity payment',            type: 'Debit',  debit: 'ETB 12,400.00', credit: null,             runningBalance: 'ETB 873,715.00',  status: 'reconciled',  recordedBy: 'Abebe Girma',  relatedRef: 'EXP-0040', relatedType: 'Expense', relatedLabel: 'Expense EXP-0040' },
    { id: 'bt4', ref: 'TXN-OB',   date: 'Aug 1, 2026',  description: 'Opening balance — August 2026',          type: 'Credit', debit: null,           credit: 'ETB 892,500.00', runningBalance: 'ETB 892,500.00',  status: 'reconciled',  recordedBy: 'System' },
  ],
  'ba-awash': [
    { id: 'bt5', ref: 'TXN-0085', date: 'Aug 9, 2026',  description: 'Vehicle maintenance — delivery truck',   type: 'Debit',  debit: 'ETB 8,500.00',  credit: null,             runningBalance: 'ETB 222,500.00',  status: 'reconciled',  recordedBy: 'Abebe Girma',  relatedRef: 'EXP-0041', relatedType: 'Expense', relatedLabel: 'Expense EXP-0041' },
    { id: 'bt6', ref: 'TXN-0084', date: 'Aug 3, 2026',  description: 'Packaging materials top-up',             type: 'Debit',  debit: 'ETB 3,200.00',  credit: null,             runningBalance: 'ETB 231,000.00',  status: 'reconciled',  recordedBy: 'Abebe Girma',  relatedRef: 'EXP-0039', relatedType: 'Expense', relatedLabel: 'Expense EXP-0039' },
    { id: 'bt7', ref: 'TXN-OB-A', date: 'Aug 1, 2026',  description: 'Opening balance — August 2026',          type: 'Credit', debit: null,           credit: 'ETB 300,000.00', runningBalance: 'ETB 300,000.00',  status: 'reconciled',  recordedBy: 'System' },
  ],
}

const MOCK_RECONCILIATION: Record<string, ReconciliationRecord> = {
  'ba-cbe': {
    accountId: 'ba-cbe', period: 'July 2026',
    erpBalance: 'ETB 1,024,300.00', statementBalance: null, difference: null,
    status: 'pending', outstandingItemCount: 3,
    lastReconciledAt: 'Jun 30, 2026', reconciledBy: 'Tigist Alemu',
  },
  'ba-awash': {
    accountId: 'ba-awash', period: 'July 2026',
    erpBalance: 'ETB 222,500.00', statementBalance: 'ETB 222,500.00', difference: 'ETB 0.00',
    status: 'reconciled', outstandingItemCount: 0,
    lastReconciledAt: 'Aug 2, 2026', reconciledBy: 'Tigist Alemu',
  },
}

// ─── Banking Summary ─────────────────────────────────────────────────────────

export interface BankingSummary {
  totalBalance: string
  incomingThisMonth: string
  outgoingThisMonth: string
  needsReconciliationCount: number
}

const MOCK_BANKING_SUMMARY: BankingSummary = {
  totalBalance: 'ETB 1,246,800.00',
  incomingThisMonth: 'ETB 150,585.00',
  outgoingThisMonth: 'ETB 24,100.00',
  needsReconciliationCount: 1,
}

export async function getBankingSummary() {
  return safeRequest(async () => mockRequest(MOCK_BANKING_SUMMARY, 300))
}

// ─── Reconciliation List ──────────────────────────────────────────────────────

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

const MOCK_RECON_LIST: ReconciliationListItem[] = [
  { accountId: 'ba-cbe', account: 'Commercial Bank of Ethiopia', period: 'August 2026', systemBalance: 'ETB 1,024,300.00', statementBalance: null, difference: null, status: 'pending', lastReconciledAt: 'Jun 30, 2026' },
  { accountId: 'ba-awash', account: 'Awash Bank', period: 'August 2026', systemBalance: 'ETB 222,500.00', statementBalance: 'ETB 222,500.00', difference: 'ETB 0.00', status: 'reconciled', lastReconciledAt: 'Aug 2, 2026' },
]

export async function listAllReconciliations() {
  return safeRequest(async () => mockRequest(MOCK_RECON_LIST, 400))
}

// ─── Reconciliation Detail ────────────────────────────────────────────────────

export interface ReconTxn {
  id: string
  date: string
  ref: string
  description: string
  amount: string
  direction: 'incoming' | 'outgoing'
  matchedTo?: string
  status: 'matched' | 'unmatched' | 'under-review'
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

const MOCK_RECON_DETAIL: Record<string, ReconciliationDetail> = {
  'ba-cbe': {
    accountId: 'ba-cbe', account: 'Commercial Bank of Ethiopia', period: 'August 2026',
    systemBalance: 'ETB 1,024,300.00', statementBalance: null, difference: null,
    status: 'pending', outstandingItemCount: 3,
    lastReconciledAt: 'Jun 30, 2026', reconciledBy: 'Tigist Alemu',
    matchedTransactions: [
      { id: 'rm1', date: 'Aug 8, 2026', ref: 'TXN-0087', description: 'Customer payment — Harar Roasters', amount: 'ETB 56,400.00', direction: 'incoming', matchedTo: 'PAY-0111', status: 'matched' },
      { id: 'rm2', date: 'Aug 5, 2026', ref: 'TXN-0086', description: 'Monthly electricity payment', amount: 'ETB 12,400.00', direction: 'outgoing', matchedTo: 'EXP-0040', status: 'matched' },
      { id: 'rm3', date: 'Aug 1, 2026', ref: 'TXN-OB', description: 'Opening balance — August 2026', amount: 'ETB 892,500.00', direction: 'incoming', matchedTo: 'OB-AUG', status: 'matched' },
    ],
    unmatchedTransactions: [
      { id: 'ru1', date: 'Aug 10, 2026', ref: 'TXN-0088', description: 'Customer payment — Addis Coffee Traders', amount: 'ETB 94,185.00', direction: 'incoming', status: 'unmatched' },
      { id: 'ru2', date: 'Aug 7, 2026', ref: 'TXN-0090', description: 'Bank charges — August 2026', amount: 'ETB 350.00', direction: 'outgoing', status: 'under-review' },
      { id: 'ru3', date: 'Aug 3, 2026', ref: 'TXN-0089', description: 'Miscellaneous income', amount: 'ETB 2,650.00', direction: 'incoming', status: 'unmatched' },
    ],
    timeline: [
      { id: 'rt1', timestamp: 'Aug 1, 2026 00:01', actor: 'System', action: 'Reconciliation period opened for August 2026' },
      { id: 'rt2', timestamp: 'Aug 8, 2026 09:00', actor: 'Tigist Alemu', action: 'TXN-0087 matched to PAY-0111' },
      { id: 'rt3', timestamp: 'Aug 8, 2026 09:02', actor: 'Tigist Alemu', action: 'TXN-0086 matched to EXP-0040' },
      { id: 'rt4', timestamp: 'Aug 10, 2026 11:00', actor: 'Tigist Alemu', action: 'TXN-0090 flagged for review — bank charges unrecognized' },
    ],
  },
  'ba-awash': {
    accountId: 'ba-awash', account: 'Awash Bank', period: 'August 2026',
    systemBalance: 'ETB 222,500.00', statementBalance: 'ETB 222,500.00', difference: 'ETB 0.00',
    status: 'reconciled', outstandingItemCount: 0,
    completedBy: 'Tigist Alemu', completedAt: 'Aug 2, 2026 14:30',
    lastReconciledAt: 'Aug 2, 2026', reconciledBy: 'Tigist Alemu',
    matchedTransactions: [
      { id: 'am1', date: 'Aug 9, 2026', ref: 'TXN-0085', description: 'Vehicle maintenance', amount: 'ETB 8,500.00', direction: 'outgoing', matchedTo: 'EXP-0041', status: 'matched' },
      { id: 'am2', date: 'Aug 3, 2026', ref: 'TXN-0084', description: 'Packaging materials', amount: 'ETB 3,200.00', direction: 'outgoing', matchedTo: 'EXP-0039', status: 'matched' },
      { id: 'am3', date: 'Aug 1, 2026', ref: 'TXN-OB-A', description: 'Opening balance — August 2026', amount: 'ETB 300,000.00', direction: 'incoming', matchedTo: 'OB-AUG-A', status: 'matched' },
    ],
    unmatchedTransactions: [],
    timeline: [
      { id: 'at1', timestamp: 'Aug 1, 2026 00:01', actor: 'System', action: 'Reconciliation period opened' },
      { id: 'at2', timestamp: 'Aug 2, 2026 14:00', actor: 'Tigist Alemu', action: 'All transactions matched' },
      { id: 'at3', timestamp: 'Aug 2, 2026 14:30', actor: 'Tigist Alemu', action: 'Reconciliation completed — no discrepancies found' },
    ],
  },
}

export async function getReconciliationDetail(accountId: string) {
  const detail = MOCK_RECON_DETAIL[accountId] ?? MOCK_RECON_DETAIL['ba-cbe']
  return safeRequest(async () => mockRequest(detail, 500))
}

export async function recordBankTransaction(_payload: {
  accountId: string; type: string; direction: 'incoming' | 'outgoing'
  amount: string; date: string; ref?: string; description: string; notes?: string
}) {
  const newTxn: BankTransaction = {
    id: `bt-new-${Date.now()}`, ref: `TXN-${Date.now().toString().slice(-4)}`,
    date: _payload.date, description: _payload.description, type: _payload.type,
    debit: _payload.direction === 'outgoing' ? _payload.amount : null,
    credit: _payload.direction === 'incoming' ? _payload.amount : null,
    runningBalance: '(recalculated by server)', status: 'posted', recordedBy: 'Current User',
  }
  return safeRequest(async () => mockRequest(newTxn, 900))
}

export async function transferFunds(_payload: {
  fromAccountId: string; toAccountId: string
  amount: string; date: string; ref?: string; notes?: string
}) {
  return safeRequest(async () => mockRequest({ status: 'completed', ref: `TRF-${Date.now().toString().slice(-4)}` }, 1000))
}

export async function matchTransactionRecon(_accountId: string, _transactionId: string) {
  return safeRequest(async () => mockRequest({ success: true }, 700))
}

export async function recordAdjustment(_payload: {
  accountId: string; amount: string; reason: string; notes?: string
}) {
  return safeRequest(async () => mockRequest({ ref: `ADJ-${Date.now().toString().slice(-4)}`, status: 'recorded' }, 900))
}

export async function completeReconciliation(accountId: string) {
  const base = MOCK_RECON_DETAIL[accountId] ?? MOCK_RECON_DETAIL['ba-cbe']
  const result: ReconciliationDetail = { ...base, status: 'reconciled', completedBy: 'Current User', completedAt: new Date().toLocaleString() }
  return safeRequest(async () => mockRequest(result, 1000))
}

export async function listBankAccounts() {
  return safeRequest(async () => mockRequest(MOCK_BANK_ACCOUNTS, 400))
}

export async function getBankAccount(id: string) {
  const account = MOCK_BANK_ACCOUNTS.find(a => a.id === id) ?? MOCK_BANK_ACCOUNTS[0]
  return safeRequest(async () => mockRequest(account, 400))
}

export async function listBankTransactions(accountId: string, _filters?: Record<string, string>) {
  const txns = MOCK_TRANSACTIONS[accountId] ?? []
  return safeRequest(async () => mockRequest(txns, 500))
}

export async function getReconciliation(accountId: string) {
  const rec = MOCK_RECONCILIATION[accountId] ?? MOCK_RECONCILIATION['ba-cbe']
  return safeRequest(async () => mockRequest(rec, 450))
}

export async function submitStatementBalance(accountId: string, statementBalance: string, _period: string) {
  const rec = { ...MOCK_RECONCILIATION[accountId], statementBalance, difference: 'ETB 0.00', status: 'reconciled' as ReconciliationStatus }
  return safeRequest(async () => mockRequest(rec, 800))
}

export async function markReconciled(accountId: string) {
  const rec = { ...MOCK_RECONCILIATION[accountId], status: 'reconciled' as ReconciliationStatus, lastReconciledAt: 'Aug 10, 2026', reconciledBy: 'Current User' }
  return safeRequest(async () => mockRequest(rec, 800))
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export type ExpenseStatus = 'pending-approval' | 'approved' | 'rejected' | 'paid' | 'cancelled'

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

const EXPENSE_CATEGORIES = ['Transport', 'Utilities', 'Supplies', 'Maintenance', 'Office', 'Other']

const MOCK_EXPENSES: FullExpense[] = [
  {
    id: 'e1', ref: 'EXP-0041', category: 'Maintenance', description: 'Vehicle maintenance — delivery truck', amount: 'ETB 8,500.00', date: 'Aug 8, 2026',
    requestedBy: 'Tigist Alemu', status: 'paid', approvedBy: 'Abebe Girma', approvedAt: 'Aug 8, 2026 09:15',
    paidBy: 'Abebe Girma', paidAt: 'Aug 9, 2026 11:00', paymentAccount: 'Awash — 0132900441', paymentRef: 'TXN-0085',
    hasDocument: true,
    timeline: [
      { id: 't1', timestamp: 'Aug 8, 2026 08:00', actor: 'Tigist Alemu', action: 'Expense requested', note: 'Routine maintenance required before next delivery run' },
      { id: 't2', timestamp: 'Aug 8, 2026 09:15', actor: 'Abebe Girma',  action: 'Approved', note: 'Approved — routine maintenance authorized' },
      { id: 't3', timestamp: 'Aug 9, 2026 11:00', actor: 'Abebe Girma',  action: 'Paid', note: 'Paid via Awash Bank — TXN-0085' },
    ],
  },
  {
    id: 'e2', ref: 'EXP-0040', category: 'Utilities', description: 'Monthly electricity — roasting facility', amount: 'ETB 12,400.00', date: 'Aug 5, 2026',
    requestedBy: 'Tigist Alemu', status: 'paid', approvedBy: 'Abebe Girma', approvedAt: 'Aug 5, 2026 10:00',
    paidBy: 'Abebe Girma', paidAt: 'Aug 5, 2026 14:30', paymentAccount: 'CBE — 1000045823', paymentRef: 'TXN-0086',
    hasDocument: true,
    timeline: [
      { id: 't4', timestamp: 'Aug 5, 2026 08:30', actor: 'Tigist Alemu', action: 'Expense requested' },
      { id: 't5', timestamp: 'Aug 5, 2026 10:00', actor: 'Abebe Girma',  action: 'Approved' },
      { id: 't6', timestamp: 'Aug 5, 2026 14:30', actor: 'Abebe Girma',  action: 'Paid', note: 'Paid via CBE — TXN-0086' },
    ],
  },
  {
    id: 'e3', ref: 'EXP-0039', category: 'Supplies', description: 'Packaging materials top-up', amount: 'ETB 3,200.00', date: 'Aug 3, 2026',
    requestedBy: 'Dawit Bekele', status: 'pending-approval', hasDocument: false,
    timeline: [
      { id: 't7', timestamp: 'Aug 3, 2026 09:00', actor: 'Dawit Bekele', action: 'Expense requested' },
    ],
  },
  {
    id: 'e4', ref: 'EXP-0038', category: 'Transport', description: 'Fuel reimbursement — long-haul delivery', amount: 'ETB 2,800.00', date: 'Aug 2, 2026',
    requestedBy: 'Yonas Tesfaye', status: 'pending-approval', hasDocument: true,
    timeline: [
      { id: 't8', timestamp: 'Aug 2, 2026 16:00', actor: 'Yonas Tesfaye', action: 'Expense requested' },
    ],
  },
  {
    id: 'e5', ref: 'EXP-0037', category: 'Office', description: 'Printer cartridges and office supplies', amount: 'ETB 2,700.00', date: 'Aug 1, 2026',
    requestedBy: 'Tigist Alemu', status: 'pending-approval', hasDocument: false,
    timeline: [
      { id: 't9', timestamp: 'Aug 1, 2026 10:00', actor: 'Tigist Alemu', action: 'Expense requested' },
    ],
  },
  {
    id: 'e6', ref: 'EXP-0036', category: 'Maintenance', description: 'Roaster drum cleaning service', amount: 'ETB 4,500.00', date: 'Jul 28, 2026',
    requestedBy: 'Dawit Bekele', status: 'rejected', approvedBy: 'Abebe Girma', approvedAt: 'Jul 29, 2026 09:00',
    rejectionReason: 'Duplicate submission — already covered under scheduled maintenance contract.',
    hasDocument: false,
    timeline: [
      { id: 't10', timestamp: 'Jul 28, 2026 11:00', actor: 'Dawit Bekele', action: 'Expense requested' },
      { id: 't11', timestamp: 'Jul 29, 2026 09:00', actor: 'Abebe Girma',  action: 'Rejected', note: 'Duplicate submission — covered under contract' },
    ],
  },
]

const MOCK_EXPENSE_SUMMARY: ExpenseSummaryData = {
  thisMonth: 'ETB 34,100.00',
  pendingApproval: 'ETB 8,700.00',
  pendingCount: 3,
  approved: 'ETB 0.00',
  paid: 'ETB 20,900.00',
  rejected: 'ETB 4,500.00',
  total: 'ETB 34,100.00',
  categories: EXPENSE_CATEGORIES,
}

export async function getExpenseSummary() {
  return safeRequest(async () => mockRequest(MOCK_EXPENSE_SUMMARY, 400))
}

export async function listExpensesFull(_filters?: Record<string, string>) {
  return safeRequest(async () => mockRequest(MOCK_EXPENSES, 500))
}

export async function getExpense(id: string) {
  const exp = MOCK_EXPENSES.find(e => e.id === id) ?? MOCK_EXPENSES[0]
  return safeRequest(async () => mockRequest(exp, 400))
}

export async function createExpense(_payload: { category: string; description: string; amount: string; date: string; notes?: string }) {
  const newExp: FullExpense = { id: `e-new-${Date.now()}`, ref: 'EXP-0042', category: _payload.category, description: _payload.description, amount: _payload.amount, date: _payload.date, requestedBy: 'Current User', status: 'pending-approval', hasDocument: false, timeline: [{ id: 'tn1', timestamp: new Date().toLocaleString(), actor: 'Current User', action: 'Expense requested' }] }
  return safeRequest(async () => mockRequest(newExp, 800))
}

export async function approveExpense(id: string, _managerId: string) {
  const exp = MOCK_EXPENSES.find(e => e.id === id)!
  return safeRequest(async () => mockRequest({ ...exp, status: 'approved' as ExpenseStatus, approvedBy: 'Current Manager', approvedAt: new Date().toLocaleString() }, 800))
}

export async function rejectExpense(id: string, reason: string) {
  const exp = MOCK_EXPENSES.find(e => e.id === id)!
  return safeRequest(async () => mockRequest({ ...exp, status: 'rejected' as ExpenseStatus, rejectionReason: reason }, 800))
}

export async function payExpense(id: string, _paymentAccount: string, _paymentRef: string) {
  const exp = MOCK_EXPENSES.find(e => e.id === id)!
  return safeRequest(async () => mockRequest({ ...exp, status: 'paid' as ExpenseStatus, paidBy: 'Current Manager', paidAt: new Date().toLocaleString() }, 800))
}

export { EXPENSE_CATEGORIES }

export async function cancelExpense(id: string) {
  const exp = MOCK_EXPENSES.find(e => e.id === id)!
  const updated: FullExpense = {
    ...exp, status: 'cancelled' as ExpenseStatus,
    timeline: [...exp.timeline, { id: `ev-cancel-${id}`, timestamp: new Date().toLocaleString(), actor: 'Current User', action: 'Expense cancelled' }],
  }
  return safeRequest(async () => mockRequest(updated, 700))
}

export async function editExpense(id: string, payload: { category?: string; description?: string; amount?: string; date?: string; notes?: string }) {
  const exp = MOCK_EXPENSES.find(e => e.id === id)!
  const updated: FullExpense = {
    ...exp, ...payload,
    timeline: [...exp.timeline, { id: `ev-edit-${id}`, timestamp: new Date().toLocaleString(), actor: 'Current User', action: 'Expense edited' }],
  }
  return safeRequest(async () => mockRequest(updated, 700))
}

export async function exportExpenses(_params: { format: 'csv' | 'pdf'; dateRange: string }) {
  return safeRequest(async () => mockRequest({ exportRef: `EXPORT-${Date.now()}`, format: _params.format, message: 'Export request received. The backend will generate and deliver the file.' }, 1200))
}

export interface ExpenseCategory {
  id: string; name: string; description: string
  status: 'active' | 'inactive'; usageCount: number
}

const MOCK_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-1', name: 'Transport',       description: 'Vehicle hire, fuel, and transport costs', status: 'active', usageCount: 14 },
  { id: 'cat-2', name: 'Utilities',       description: 'Electricity, water, internet', status: 'active', usageCount: 8 },
  { id: 'cat-3', name: 'Supplies',        description: 'Office and operational supplies', status: 'active', usageCount: 11 },
  { id: 'cat-4', name: 'Maintenance',     description: 'Equipment and facility maintenance', status: 'active', usageCount: 5 },
  { id: 'cat-5', name: 'Office',          description: 'Office running costs', status: 'active', usageCount: 7 },
  { id: 'cat-6', name: 'Packaging',       description: 'Packaging materials top-up', status: 'active', usageCount: 3 },
  { id: 'cat-7', name: 'Equipment',       description: 'Equipment purchases and repairs', status: 'active', usageCount: 2 },
  { id: 'cat-8', name: 'Rent',            description: 'Facility rent and lease payments', status: 'active', usageCount: 6 },
  { id: 'cat-9', name: 'Legacy Category', description: 'Legacy, no longer in use', status: 'inactive', usageCount: 1 },
  { id: 'cat-10', name: 'Other',          description: 'Miscellaneous expenses', status: 'active', usageCount: 4 },
]

export async function listExpenseCategories() {
  return safeRequest(async () => mockRequest(MOCK_CATEGORIES, 400))
}

export async function createExpenseCategory(payload: { name: string; description: string }) {
  const newCat: ExpenseCategory = { id: `cat-${Date.now()}`, ...payload, status: 'active', usageCount: 0 }
  return safeRequest(async () => mockRequest(newCat, 700))
}

export async function updateExpenseCategory(id: string, payload: { name?: string; description?: string }) {
  const cat = MOCK_CATEGORIES.find(c => c.id === id)!
  return safeRequest(async () => mockRequest({ ...cat, ...payload }, 700))
}

export async function deactivateExpenseCategory(id: string) {
  const cat = MOCK_CATEGORIES.find(c => c.id === id)!
  return safeRequest(async () => mockRequest({ ...cat, status: 'inactive' as const }, 700))
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export type PayrollRunStatus = 'draft' | 'pending-approval' | 'approved' | 'paid' | 'closed'
export type PayrollReviewStatus = 'ok' | 'needs-review'
export type PayrollPaymentStatus = 'pending' | 'paid'

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
  changeHistory?: { previousAmount: string; newAmount: string; reason: string; changedBy: string; changedAt: string }[]
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

const MOCK_PAYROLL_RUN: PayrollRun = {
  id: 'pr-aug-2026',
  period: 'August 2026',
  status: 'draft',
  employeeCount: 8,
  totalAmount: 'ETB 124,500.00',
  pendingReviewCount: 1,
  changesCount: 1,
  employees: [
    { id: 'emp1', name: 'Abebe Girma',   role: 'Manager',          baseAmount: 'ETB 28,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 28,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp2', name: 'Tigist Alemu',  role: 'Accountant',       baseAmount: 'ETB 18,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 18,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp3', name: 'Dawit Bekele',  role: 'Storekeeper',      baseAmount: 'ETB 14,000.00', adjustments: 'ETB 500.00', finalAmount: 'ETB 14,500.00', reviewStatus: 'needs-review', paymentStatus: 'pending', reviewReason: 'Adjustment applied — overtime for Aug 1–3 inventory count', changeHistory: [{ previousAmount: 'ETB 14,000.00', newAmount: 'ETB 14,500.00', reason: 'Overtime — inventory count Aug 1–3', changedBy: 'Abebe Girma', changedAt: 'Aug 8, 2026 14:00' }] },
    { id: 'emp4', name: 'Yonas Tesfaye', role: 'Sales Rep',        baseAmount: 'ETB 16,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 16,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp5', name: 'Hanna Mulatu',  role: 'Roaster',          baseAmount: 'ETB 12,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 12,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp6', name: 'Lemma Kebede',  role: 'Roaster',          baseAmount: 'ETB 12,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 12,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp7', name: 'Sara Tesfaye',  role: 'Delivery Staff',   baseAmount: 'ETB 12,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 12,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
    { id: 'emp8', name: 'Biruk Haile',   role: 'Delivery Staff',   baseAmount: 'ETB 12,000.00', adjustments: 'ETB 0.00', finalAmount: 'ETB 12,000.00', reviewStatus: 'ok',           paymentStatus: 'pending' },
  ],
  timeline: [
    { id: 'pt1', timestamp: 'Aug 1, 2026 00:01', actor: 'System',       action: 'Payroll run created for August 2026' },
    { id: 'pt2', timestamp: 'Aug 8, 2026 14:00', actor: 'Abebe Girma',  action: 'Amount edited — Dawit Bekele', note: 'Overtime adjustment applied: ETB 14,000 → ETB 14,500' },
  ],
}

export async function getPayrollRun(_period?: string) {
  return safeRequest(async () => mockRequest(MOCK_PAYROLL_RUN, 450))
}

export async function updatePayrollAmount(runId: string, employeeId: string, newAmount: string, reason: string) {
  const run = { ...MOCK_PAYROLL_RUN, status: MOCK_PAYROLL_RUN.status }
  void runId; void employeeId; void newAmount; void reason
  return safeRequest(async () => mockRequest(run, 800))
}

export async function submitPayrollForApproval(runId: string) {
  void runId
  return safeRequest(async () => mockRequest({ ...MOCK_PAYROLL_RUN, status: 'pending-approval' as PayrollRunStatus }, 800))
}

export async function approvePayrollRun(runId: string, managerId: string) {
  void runId; void managerId
  return safeRequest(async () => mockRequest({ ...MOCK_PAYROLL_RUN, status: 'approved' as PayrollRunStatus, approvedBy: 'Current Manager', approvedAt: new Date().toLocaleString() }, 900))
}

export async function finalizePayrollRun(runId: string) {
  void runId
  return safeRequest(async () => mockRequest({ ...MOCK_PAYROLL_RUN, status: 'closed' as PayrollRunStatus, finalizedBy: 'Current Manager', finalizedAt: new Date().toLocaleString() }, 900))
}
