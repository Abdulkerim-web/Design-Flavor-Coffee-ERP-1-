import { supabaseAdmin } from "./supabase"

// ── IN-MEMORY MOCKS (Phase 3) ──
let mockExpenses: any[] = [
  { id: "exp-1", ref: "EXP-1001", category: "Supplies", description: "Office supplies", amount: "ETB 2,500", date: new Date().toISOString(), requestedBy: "Admin", status: "approved", hasDocument: false, timeline: [] }
]
let mockPayments: any[] = []
let mockPayroll: any[] = []
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

  // ── Dashboards & Fallbacks ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") return { kpiCards: [], attentionCards: [], orderStatuses: [] }
  if (path === "/dashboard/finance" && method === "GET") return { totalCustomerPayments: "ETB 0", outstandingBalances: "ETB 0", overdueCount: 0, thisMonthExpenses: "ETB 0", pendingExpenseApprovals: "ETB 0", pendingExpenseCount: 0, currentPayrollTotal: "ETB 0", payrollPeriod: "Current", payrollStatus: "draft", totalBankBalance: "ETB 0", alerts: [] }
  if (path === "/finance/dashboard" && method === "GET") return { totalCustomerPayments: "ETB 0", outstandingBalances: "ETB 0", overdueCount: 0, thisMonthExpenses: "ETB 0", pendingExpenseApprovals: "ETB 0", pendingExpenseCount: 0, currentPayrollTotal: "ETB 0", payrollPeriod: "Current", payrollStatus: "draft", totalBankBalance: "ETB 0", alerts: [] }
  if (path === "/dashboard/inventory" && method === "GET") return { kpiCards: [], attentionCards: [] }
  if (path === "/inventory/stats" && method === "GET") return { green: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 }, roasted: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 }, packaging: { onHand: "0", reserved: "0", available: "0", status: "healthy", skuCount: 0 }, attentionCount: 0 }
  if (path === "/inventory/attention" && method === "GET") return []
  if (path === "/finance/banking/summary" && method === "GET") return { totalBalance: "ETB 0", unassignedDeposits: "ETB 0", pendingReconciliations: 0, alerts: [] }
  if (path === "/finance/expenses/summary" && method === "GET") return { pendingApproval: 0, toPay: 0, recentTotal: "ETB 0" }
  if (path === "/delivery/summary" && method === "GET") return { pending: 0, inTransit: 0, completedToday: 0 }
  if (path === "/payments/summary" && method === "GET") return { receivedToday: "ETB 0", pendingVerification: 0 }

  // ── Custom Actions ──
  if (path === "/receiving" && method === "POST") {
    await supabaseAdmin.from("lots").insert([{
      lot_number: body.lotId || `LOT-${Math.floor(Math.random() * 10000)}`,
      coffee_type: "Raw Coffee",
      origin: "Local",
      quantity: body.confirmedQty || 0,
      qc_status: "pending"
    }])
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/confirm") && method === "POST") {
    await supabaseAdmin.from("orders").update({ status: "PROCESSING" }).eq("id", parts[1])
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/reject") && method === "POST") {
    await supabaseAdmin.from("orders").update({ status: "CANCELLED" }).eq("id", parts[1])
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/start") && method === "POST") {
    await supabaseAdmin.from("roasting_batches").update({ status: "ROASTING" }).eq("id", parts[1])
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/complete") && method === "POST") {
    await supabaseAdmin.from("roasting_batches").update({ status: "COMPLETED", actual_roasted_quantity: body.actualYield }).eq("id", parts[1])
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
    let query = supabaseAdmin.from(table).select("*")
    if (table !== "customers" && table !== "users") {
      query = query.order("created_at", { ascending: false })
    }
    if (table === "orders") {
      query = supabaseAdmin.from(table).select("*, customer:customers(*)").order("created_at", { ascending: false })
    }
    const { data, error } = await query
    if (error) {
      console.error(`[Supabase API] Error fetching ${table}:`, error)
      return path.startsWith("/inventory/lots") || path.startsWith("/inventory/green") || path.startsWith("/inventory/roasted") || path.startsWith("/inventory/packaging")
        ? { lots: [], total: 0, page: 1, pageSize: 10 }
        : []
    }
    
    if (table === "orders" && data && data.length > 0) {
      const orderIds = data.map((d: any) => d.id)
      const { data: itemsData } = await supabaseAdmin.from("order_items").select("*").in("order_id", orderIds)
      if (itemsData) {
        data.forEach((order: any) => {
          order.items = itemsData.filter((i: any) => i.order_id === order.id)
        })
      }
    }

    const mapped = camelizeKeys(data) || []
    if (path.startsWith("/inventory/lots") || path.startsWith("/inventory/green") || path.startsWith("/inventory/roasted") || path.startsWith("/inventory/packaging")) {
       return { lots: mapped, total: mapped.length, page: 1, pageSize: mapped.length || 10 }
    }
    return mapped
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
        status: "PENDING_MANAGER_CONFIRMATION",
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
    const { data, error } = await supabaseAdmin.from(table).insert([dbBody]).select()
    if (error) throw error
    
    if (table === "orders" && body.items && body.items.length > 0) {
      const orderId = data[0].id
      const orderItems = body.items.map((item: any) => ({
        order_id: orderId,
        coffee_product_id: item.coffeeProductId || item.coffeeType || "Unknown",
        quantity: item.quantity || 0,
        unit_price: item.unitPrice || 0,
        status: "pending-confirmation"
      }))
      await supabaseAdmin.from("order_items").insert(orderItems)
    }

    return camelizeKeys(data[0])
  }

  if (method === "GET" && id) {
    const { data, error } = await supabaseAdmin.from(table).select("*").eq("id", id).single()
    if (error) throw error
    return camelizeKeys(data)
  }

  if (method === "PUT" && id) {
    const { data, error } = await supabaseAdmin.from(table).update(body).eq("id", id).select()
    if (error) throw error
    return camelizeKeys(data[0])
  }

  console.warn(`[Supabase API] Endpoint ${method} ${endpoint} falling back to default mock array/object`)
  if (method === "GET" && !id) return []
  return {}
}

async function getManagerDashboard() {
  const [
    { data: ordersData },
    { data: roastingBatches },
    { data: customersData }
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*, customers(*)").order("created_at", { ascending: false }),
    supabaseAdmin.from("roasting_batches").select("*").eq("status", "ROASTING").order("created_at", { ascending: false }),
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false })
  ])

  const orders = ordersData || []
  const customers = customersData || []
  const batches = roastingBatches || []

  const activeOrders = orders.filter(
    (o: any) => !["CANCELLED", "DELIVERED", "COMPLETED"].includes(o.status)
  )

  const kpiCards = [
    {
      label: "Orders in Progress",
      value: activeOrders.length.toString(),
      sub: `${orders.filter((o: any) => o.status === "PENDING_MANAGER_CONFIRMATION").length} awaiting confirmation`,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      label: "Total Active Customers",
      value: `${customers.length} clients`,
      sub: `Active customers in database`,
      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    },
    {
      label: "Active Roasting",
      value: `${batches.length} batches`,
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
