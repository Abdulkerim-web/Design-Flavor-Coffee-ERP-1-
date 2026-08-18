import { supabaseAdmin } from "./supabase"

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

  // ── Dashboards ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") return {} // Mock for now
  if (path === "/dashboard/finance" && method === "GET") return {} // Mock for now
  if (path === "/dashboard/inventory" && method === "GET") return {} // Mock for now

  // ── Generic CRUD Table Mapping ──
  let table = parts[0]
  
  // Specific mappings for nested or differently named routes
  if (path.startsWith("/inventory/lots")) table = "lots"
  if (path.startsWith("/production/batches")) table = "roasting_batches"
  if (path.startsWith("/customers")) table = "customers"
  if (path.startsWith("/orders")) table = "orders"

  const idPos = path.startsWith("/inventory/") || path.startsWith("/production/") ? 2 : 1
  const id = parts[idPos]

  if (method === "GET" && !id) {
    let query = supabaseAdmin.from(table).select("*")
    if (table === "orders") {
      query = supabaseAdmin.from(table).select("*, customer:customers(*)")
    }
    const { data, error } = await query
    if (error) {
      console.error(`[Supabase API] Error fetching ${table}:`, error)
      return { items: [], total: 0, page: 1, perPage: 10 }
    }
    const mapped = camelizeKeys(data) || []
    return { items: mapped, total: mapped.length, page: 1, perPage: mapped.length || 10 }
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
        status: "active"
      }
    }
    const { data, error } = await supabaseAdmin.from(table).insert([dbBody]).select()
    if (error) throw error
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

  console.warn(`[Supabase API] Endpoint ${method} ${endpoint} falling back to {}`)
  return {}
}

async function getManagerDashboard() {
  const [
    { data: ordersData },
    { data: roastingBatches },
    { data: customersData }
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*, customers(*)"),
    supabaseAdmin.from("roasting_batches").select("*").eq("status", "ROASTING"),
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
