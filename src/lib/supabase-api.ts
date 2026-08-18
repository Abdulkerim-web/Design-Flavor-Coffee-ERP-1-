import { supabaseAdmin } from "./supabase"

export async function handleSupabaseApiRequest(
  endpoint: string,
  method: string,
  body: any,
  role: string
) {
  const path = endpoint.split("?")[0]
  const parts = path.split("/").filter(Boolean)

  // ── Dashboard endpoints ──
  if (path === "/dashboard/manager" && method === "GET") {
    return await getManagerDashboard()
  }

  // ── Generic CRUD Fallbacks ──
  const table = parts[0]
  if (parts.length === 1 && method === "GET") {
    let query = supabaseAdmin.from(table).select("*")
    if (table === "orders") {
      query = supabaseAdmin.from(table).select("*, customer:customers(*)")
    }
    const { data, error } = await query
    if (error) throw error
    return camelizeKeys(data)
  }
  if (parts.length === 1 && method === "POST") {
    const { data, error } = await supabaseAdmin.from(table).insert([body]).select()
    if (error) throw error
    return camelizeKeys(data[0])
  }
  if (parts.length === 2 && method === "GET") {
    const { data, error } = await supabaseAdmin.from(table).select("*").eq("id", parts[1]).single()
    if (error) throw error
    return camelizeKeys(data)
  }
  if (parts.length === 2 && method === "PUT") {
    const { data, error } = await supabaseAdmin.from(table).update(body).eq("id", parts[1]).select()
    if (error) throw error
    return camelizeKeys(data[0])
  }

  // Fallback for everything else
  console.warn(`[Supabase API] Endpoint ${method} ${endpoint} falling back to generic return`)
  return []
}

async function getManagerDashboard() {
  const [
    { data: orders },
    { data: roastingBatches },
    { data: customers }
  ] = await Promise.all([
    supabaseAdmin.from("orders").select("*, customers(*)"),
    supabaseAdmin.from("roasting_batches").select("*").eq("status", "ROASTING"),
    supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false })
  ])

  const activeOrders = (orders || []).filter(
    (o) => !["CANCELLED", "DELIVERED", "COMPLETED"].includes(o.status)
  )

  const kpiCards = [
    {
      label: "Orders in Progress",
      value: activeOrders.length.toString(),
      sub: `${(orders || []).filter((o) => o.status === "PENDING_MANAGER_CONFIRMATION").length} awaiting confirmation`,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      label: "Total Active Customers",
      value: `${(customers || []).length} clients`,
      sub: `Active customers in database`,
      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    },
    {
      label: "Active Roasting",
      value: `${(roastingBatches || []).length} batches`,
      sub: "In progress",
      icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    },
  ]

  const statusCounts = (orders || []).reduce((acc: any, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
    label: status.replace(/_/g, " "),
    count,
    color: status.includes("PENDING") ? "#F59E0B" : status.includes("CANCEL") ? "#EF4444" : "#10B981",
  }))

  const attentionCards = []
  const recentCustomers = (customers || []).slice(0, 3)
  for (const c of recentCustomers) {
    attentionCards.push({
      id: `cus-${c.id}`,
      severity: "info",
      category: "New Customer",
      title: `Customer ${c.name} registered`,
      description: `Ref: ${c.business_number} | Type: ${c.type}`,
      primaryAction: "View Customer",
      module: "customers",
      age: "Recent",
    })
  }

  const urgentOrders = (orders || []).filter(
    (o) => o.isUrgent && o.status === "PENDING_MANAGER_CONFIRMATION"
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
