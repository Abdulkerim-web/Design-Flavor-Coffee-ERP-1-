// Backend proxy helper — route client-side logical requests to server endpoints
async function backendCall(method: string, endpoint: string, body?: any) {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  const res = await fetch(`/api/v1${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend call failed ${method} ${endpoint}: ${res.status} ${text}`)
  }
  return await res.json()
}

// ── IN-MEMORY MOCKS (Phase 3) ──
let mockExpenses: any[] = [
  { id: "exp-1", ref: "EXP-1001", category: "Supplies", description: "Office supplies", amount: "ETB 2,500", date: new Date().toISOString(), requestedBy: "Admin", status: "approved", hasDocument: false, timeline: [] }
]
let mockPayments: any[] = []
let mockPayroll: any = { id: "pr-1", period: "August 2026", status: "draft", employeeCount: 0, totalAmount: "ETB 0", pendingReviewCount: 0, changesCount: 0, employees: [], timeline: [] }
let mockBanking: any[] = []
let mockExpenseCategories: any[] = [
  { id: "cat-1", name: "Utility", code: "UTL", color: "#6366F1", active: true },
  { id: "cat-2", name: "Supplies", code: "SUP", color: "#10B981", active: true },
]
let mockBankAccounts: any[] = [
  { id: "acc-1", name: "Main Operating", type: "checking", number: "****1234", currency: "ETB", status: "active", balance: "150000" }
]
export async function handleSupabaseApiRequest(
  endpoint: string,
  method: string,
  body: any,
  role: string
) {
  const path = endpoint.split("?")[0]
  const parts = path.split("/").filter(Boolean)

  // ── Auth ──
  if (path === "/auth/login" && method === "POST") {
    // Return dummy data since AuthContext falls back anyway
    return { user: { role: "general-manager", email: body?.username || "" }, token: "mock" }
  }
  if (path === "/auth/logout" && method === "POST") {
    return { success: true }
  }

  // ── IN-MEMORY INTERCEPTORS FOR FINANCE ──
  if (path.startsWith("/finance/expenses")) {
    if (method === "GET") {
      if (path === "/finance/expenses") return mockExpenses
      if (path === "/finance/expenses/summary") return { pendingApproval: mockExpenses.filter(e => e.status === "pending-approval").length, toPay: mockExpenses.filter(e => e.status === "approved").length, recentTotal: "ETB 2,500" }
      if (path.includes("/approve")) {
        const idx = mockExpenses.findIndex(e => e.id === parts[2])
        if (idx !== -1) mockExpenses[idx].status = "approved"
        return mockExpenses[idx]
      }
      if (path.includes("/reject")) {
        const idx = mockExpenses.findIndex(e => e.id === parts[2])
        if (idx !== -1) mockExpenses[idx].status = "rejected"
        return mockExpenses[idx]
      }
      if (path.includes("/pay")) {
        const idx = mockExpenses.findIndex(e => e.id === parts[2])
        if (idx !== -1) mockExpenses[idx].status = "paid"
        return mockExpenses[idx]
      }
      if (parts.length === 3) return mockExpenses.find(e => e.id === parts[2])
    }
    if (method === "POST" && path === "/finance/expenses") {
      const newExp = {
        id: "exp-" + Math.floor(Math.random() * 10000),
        ref: "EXP-" + Math.floor(Math.random() * 10000),
        category: body.category || "Unknown",
        description: body.description || "",
        amount: "ETB " + (body.amount || "0"),
        date: new Date().toISOString(),
        requestedBy: "Admin",
        status: "pending-approval",
        hasDocument: false,
        timeline: []
      }
      mockExpenses = [newExp, ...mockExpenses]
      return newExp
    }
  }

  if (path.startsWith("/finance/expense-categories")) {
    if (method === "GET") return mockExpenseCategories
    if (method === "POST") {
      const newCat = { id: "cat-" + Math.floor(Math.random() * 10000), ...body, active: true }
      mockExpenseCategories.push(newCat)
      return newCat
    }
  }

  // ── IN-MEMORY INTERCEPTORS FOR PAYMENTS, BANKING, PAYROLL ──
  if (path === "/payments/record" && method === "POST") {
    // Proxy to backend finance payments endpoint
    const paymentId = "PAY-" + Math.floor(Math.random() * 10000)
    await backendCall("POST", "/finance/payments", {
      paymentId: body.paymentId,
      amount: body.amount,
      transferRef: body.transferRef,
    })
    return { success: true, ref: paymentId }
  }

  if (path.startsWith("/finance/payroll")) {
    const base = path.split("?")[0]
    if (method === "GET") {
      if (base === "/finance/payroll") return mockPayroll
      return null
    }
    if (method === "POST") {
      return { success: true }
    }
  }

  if (path === "/finance/transactions" && method === "POST") {
    const newTx = {
      id: "tx-" + Math.floor(Math.random() * 10000),
      ref: "TXN-" + Math.floor(Math.random() * 10000),
      date: body.date,
      description: body.description,
      amount: "ETB " + body.amount,
      type: body.type,
      direction: body.direction,
      status: "cleared"
    }
    mockBanking.unshift(newTx)
    return newTx
  }

  if (path.startsWith("/finance/expenses/") && method === "POST") {
    const parts = path.split("/")
    const id = parts[3]
    const action = parts[4]
    const expense = mockExpenses.find(e => e.id === id)
    if (expense) {
      if (action === "approve") expense.status = "approved"
      if (action === "reject") expense.status = "rejected"
      return expense
    }
  }
  
  if (path === "/finance/accounts" && method === "GET") return mockBankAccounts

  // ── Dashboards & Fallbacks ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") return { kpiCards: [], attentionCards: [], orderStatuses: [] }
  
  if ((path === "/dashboard/finance" || path === "/finance/dashboard") && method === "GET") {
    const expensesTotal = mockExpenses.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[^0-9.]/g, '') || '0'), 0)
    const txTotal = mockBanking.reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.]/g, '') || '0'), 0)
    return { 
      totalCustomerPayments: "ETB " + txTotal.toLocaleString(), 
      outstandingBalances: "ETB 0", 
      overdueCount: 0, 
      thisMonthExpenses: "ETB " + expensesTotal.toLocaleString(), 
      pendingExpenseApprovals: "ETB 0", 
      pendingExpenseCount: mockExpenses.filter(e => e.status === "pending-approval").length, 
      currentPayrollTotal: "ETB 0", 
      payrollPeriod: "Current", 
      payrollStatus: "draft", 
      totalBankBalance: "ETB 150000", 
      alerts: [] 
    }
  }

  if (path === "/dashboard/inventory" && method === "GET") return { kpiCards: [], attentionCards: [] }
  if (path === "/inventory/stats" && method === "GET") return { green: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 }, roasted: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 }, packaging: { onHand: "0", reserved: "0", available: "0", status: "healthy", skuCount: 0 }, attentionCount: 0 }
  if (path === "/inventory/attention" && method === "GET") return []
  if (path === "/finance/banking/summary" && method === "GET") return { totalBalance: "ETB 150000", unassignedDeposits: "ETB 0", pendingReconciliations: 0, alerts: [] }
  if (path === "/finance/expenses/summary" && method === "GET") return { pendingApproval: mockExpenses.filter(e => e.status === "pending-approval").length, toPay: mockExpenses.filter(e => e.status === "approved").length, recentTotal: "ETB " + mockExpenses.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[^0-9.]/g, '') || '0'), 0).toLocaleString() }
  if (path === "/delivery/summary" && method === "GET") return { pending: 0, inTransit: 0, completedToday: 0 }
  if (path === "/payments/summary" && method === "GET") return { receivedToday: "ETB " + mockBanking.reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.]/g, '') || '0'), 0).toLocaleString(), pendingVerification: 0 }

  // ── Custom Actions ──
  if (path === "/receiving" && method === "POST") {
    await backendCall("POST", "/receiving", body)
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/confirm") && method === "POST") {
    await backendCall("POST", `${path}`)
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/reject") && method === "POST") {
    await backendCall("POST", `${path}`)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/start") && method === "POST") {
    await backendCall("POST", `${path}`)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/complete") && method === "POST") {
    await backendCall("POST", `${path}`, body)
    return { success: true }
  }

  // ── Generic CRUD Table Mapping ──
  let table = parts[0]
  
  // Specific mappings for nested or differently named routes
  if (path.startsWith("/inventory/lots")) table = "lots"
  if (path.startsWith("/production/batches")) table = "roasting_batches"
  if (path.startsWith("/roasting")) table = "roasting_batches"
  if (path.startsWith("/customers")) table = "customers"
  if (path.startsWith("/orders")) table = "orders"

  const idPos = path.startsWith("/inventory/") || path.startsWith("/production/") ? 2 : 1
  const id = parts[idPos]

  if (method === "GET" && !id) {
    // Proxy read list to backend
    const data = await backendCall("GET", path)
    return data
  }

  if (method === "POST" && !id) {
    // Map customer payload to DB schema
    let dbBody = { ...body }
    if (table === "customers") {
      dbBody = {
        name: body.name,
        type: body.type || "cafe",
        contact_person: body.contactName,
        phone: body.contactPhone,
        email: body.contactEmail,
        notes: body.notes,
        business_number: `CUS-${Math.floor(Math.random() * 10000)}`,
        active: true,
        status: "active",
        sales_rep_id: body.salesRepId || "USR-003" // Default to seed sales rep if none provided to satisfy NOT NULL constraint
      }
    } else if (table === "orders") {
      const preVatAmount = body.items?.reduce((sum: number, item: any) => sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0
      const vatRate = 15.00
      const vatAmount = preVatAmount * (vatRate / 100)
      const totalAmount = preVatAmount + vatAmount
      dbBody = {
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        status: "pending-confirmation",
        customer_id: body.customerId,
        branch_id: "BRN-001",
        sales_rep_id: "USR-003",
        is_urgent: body.urgent || false,
        pre_vat_amount: preVatAmount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
      }
    }
    const created = await backendCall("POST", path, dbBody)
    return created
  }

  if (method === "GET" && id) {
    const data = await backendCall("GET", path)
    return data
  }

  if ((method === "PUT" || method === "PATCH") && id) {
    const data = await backendCall(method, path, body)
    return data
  }

  console.warn(`[Supabase API] Endpoint ${method} ${endpoint} falling back to default mock array/object`)
  if (method === "GET" && !id) return []
  return {}
}

async function getManagerDashboard() {
  const [orders, batches, customers] = await Promise.all([
    backendCall("GET", "/orders"),
    backendCall("GET", "/roasting?status=ROASTING"),
    backendCall("GET", "/customers"),
  ])

  const ordersArr = orders || []
  const customersArr = customers || []
  const batchesArr = batches || []

  const activeOrders = ordersArr.filter(
    (o: any) => !["CANCELLED", "DELIVERED", "COMPLETED"].includes(o.status)
  )

  const kpiCards = [
    {
      label: "Orders in Progress",
      value: activeOrders.length.toString(),
      sub: `${ordersArr.filter((o: any) => o.status === "PENDING_MANAGER_CONFIRMATION").length} awaiting confirmation`,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      label: "Total Active Customers",
      value: `${customersArr.length} clients`,
      sub: `Active customers in database`,
      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    },
    {
      label: "Active Roasting",
      value: `${batchesArr.length} batches`,
      sub: "In progress",
      icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    },
  ]

  const statusCounts = orders.reduce((acc: any, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
    label: String(status).replace(/_/g, " "),
    count,
    color: String(status).includes("PENDING") ? "#F59E0B" : String(status).includes("CANCEL") ? "#EF4444" : "#10B981",
  }))

  const attentionCards = []
  const recentCustomers = customers.slice(0, 3)
  for (const c of recentCustomers) {
    attentionCards.push({
      id: `cus-${c.id}`,
      severity: "info",
      category: "New Customer",
      title: `Customer ${c.name} registered`,
      description: `Ref: ${c.business_number} | Type: ${c.type || "unknown"}`,
      primaryAction: "View Customer",
      module: "customers",
      age: "Recent",
    })
  }

  const urgentOrders = orders.filter(
    (o: any) => o.is_urgent && o.status === "PENDING_MANAGER_CONFIRMATION"
  )
  for (const o of urgentOrders) {
    attentionCards.push({
      id: `ord-${o.id}`,
      severity: "urgent",
      category: "Urgent Order",
      title: `Order ${o.order_number} requires approval`,
      description: `Customer: ${o.customers?.name || "Unknown"}`,
      primaryAction: "Review Order",
      module: "orders",
      age: "Recent",
    })
  }

  return {
    kpiCards,
    attentionCards,
    orderStatuses,
    financeRows: [],
    activityFeed: [],
  }
}

function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      result[camelKey] = camelizeKeys(obj[key])
      return result
    }, {} as any)
  }
  return obj
}
