import { createClient } from "@supabase/supabase-js"

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  "https://udvtogofulclohhvdnzc.supabase.co"
const supabaseServiceRoleKey =
  (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)


export async function handleSupabaseApiRequest(
  endpoint: string,
  method: string,
  body: any,
  role: string
) {
  const path = endpoint.split("?")[0]
  const parts = path.split("/").filter(Boolean)

  // ── Auth ──
  // Demo user registry: maps email → { id, role, name }
  // IDs MUST match INITIAL_USERS in src/lib/rbac.ts so that all badge/notification queries work.
  const DEMO_USERS_BY_EMAIL: Record<string, { id: string; role: string; name: string }> = {
    "manager@company.et":     { id: "USR-001", role: "general-manager",   name: "General Manager" },
    "vicemanager@company.et": { id: "USR-002", role: "vice-manager",       name: "Vice Manager" },
    "salesrep@company.et":    { id: "USR-003", role: "sales-rep",          name: "Sales Representative" },
    "inventory@company.et":   { id: "USR-004", role: "inventory-manager",  name: "Inventory Manager" },
    "roaster@company.et":     { id: "USR-005", role: "head-roaster",       name: "Head Roaster" },
    "accountant@company.et":  { id: "USR-006", role: "accountant",         name: "Accountant" },
    "qc@company.et":          { id: "USR-007", role: "inventory-manager",  name: "QC Inspector" },
    "driver1@company.et":     { id: "USR-008", role: "delivery-staff",     name: "Driver 1" },
    "driver2@company.et":     { id: "USR-009", role: "delivery-staff",     name: "Driver 2" },
  }
  if (path === "/auth/login" && method === "POST") {
    const emailKey = (body?.username || "").toLowerCase().trim()
    const match = DEMO_USERS_BY_EMAIL[emailKey]
    return {
      user: {
        id:    match?.id   || "USR-000",
        role:  match?.role || "general-manager",
        email: body?.username || "",
        name:  match?.name || "User",
      },
      token: "mock",
    }
  }
  if (path === "/auth/logout" && method === "POST") {
    return { success: true }
  }

  // ── EMPLOYEE MANAGEMENT ──────────────────────────────────────────────────

  // GET /employees — list all employees
  if (path === "/employees" && method === "GET") {
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, role, email, phone, username, department, status, created_at, created_by_name, last_login")
        .order("created_at", { ascending: false })
      return data || []
    } catch { return [] }
  }

  // POST /employees — create new employee (also creates Supabase Auth user)
  if (path === "/employees" && method === "POST") {
    const { fullName, role, email, phone, username, department, password, managerId, managerName } = body || {}
    if (!email || !password || !fullName || !role) {
      throw new Error("fullName, role, email, and password are required.")
    }
    // Validate password strength
    if (password.length < 8)           throw new Error("Password must be at least 8 characters.")
    if (!/[A-Z]/.test(password))       throw new Error("Password must include an uppercase letter.")
    if (!/[0-9]/.test(password))       throw new Error("Password must include a number.")

    // Check email uniqueness
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle()
    if (existing) throw new Error("An employee with this email already exists.")

    // Check username uniqueness
    if (username) {
      const { data: existingUser } = await supabaseAdmin.from("profiles").select("id").eq("username", username).maybeSingle()
      if (existingUser) throw new Error("This username is already taken.")
    }

    // Create Supabase Auth user
    let authUserId: string | null = null
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      })
      if (authError) throw new Error(authError.message)
      authUserId = authData.user?.id || null
    } catch (authErr: any) {
      // If Supabase Auth fails, still create profile record
      console.warn("Auth user creation failed:", authErr.message)
    }

    // Insert profile record
    const profileId = authUserId || `emp-${Date.now()}`
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .insert([{
        id: profileId,
        full_name: fullName,
        role,
        email,
        phone: phone || "",
        username: username || "",
        department: department || "",
        status: "active",
        created_by_name: managerName || "Manager",
        manager_id: managerId || null,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()
    if (profileErr) throw new Error(profileErr.message)
    return profile
  }

  // PUT /employees/:id — update employee profile
  if (path.startsWith("/employees/") && !path.includes("/password") && method === "PUT") {
    const empId = parts[1]
    const { fullName, role, email, phone, username, department, status } = body || {}
    const updates: any = {}
    if (fullName)    updates.full_name  = fullName
    if (role)        updates.role       = role
    if (email)       updates.email      = email
    if (phone)       updates.phone      = phone
    if (username)    updates.username   = username
    if (department)  updates.department = department
    if (status)      updates.status     = status
    const { data, error } = await supabaseAdmin.from("profiles").update(updates).eq("id", empId).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  // POST /employees/:id/password — change password (admin or self)
  if (path.startsWith("/employees/") && path.endsWith("/password") && method === "POST") {
    const empId = parts[1]
    const { newPassword, adminReset, currentPassword } = body || {}
    if (!newPassword)             throw new Error("New password is required.")
    if (newPassword.length < 8)   throw new Error("Password must be at least 8 characters.")
    if (!/[A-Z]/.test(newPassword)) throw new Error("Password must include an uppercase letter.")
    if (!/[0-9]/.test(newPassword)) throw new Error("Password must include a number.")
    try {
      await supabaseAdmin.auth.admin.updateUserById(empId, { password: newPassword })
    } catch (e: any) {
      throw new Error(e.message || "Failed to update password in auth system.")
    }
    return { success: true }
  }

  // ── AUDIT LOGS ──
  if (path === "/audit/logs") {
    if (method === "GET") {
      try {
        const { data } = await supabaseAdmin
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500)
        return data || []
      } catch {
        return [] // Return empty if table doesn't exist yet
      }
    }
    if (method === "POST") {
      try {
        await supabaseAdmin.from("audit_logs").insert([{
          user_id: body.userId || body.user || "system",
          action: body.action || body.actionCode || body.actionType || "update",
          entity_type: body.entityType || body.module || body.entity_type || "unknown",
          entity_id: body.entityId || body.recordId || body.record_id || "",
          changes: body.changes || body.diff || {},
          created_at: new Date().toISOString(),
        }])
      } catch { /* ignore if table doesn't exist */ }
      return { success: true }
    }
  }

  // ── FINANCE EXPENSES ──
  if (path.startsWith("/finance/expenses")) {
    // ── GET: list, summary, single ──
    if (method === "GET") {
      if (path === "/finance/expenses/summary") {
        const { data } = await supabaseAdmin.from("expenses").select("*")
        const list = data || []
        const pendingCount = list.filter((e: any) => e.status === "pending-approval" || e.status === "requested").length
        const approvedCount = list.filter((e: any) => e.status === "approved").length
        const pendingTotal = list.filter((e: any) => e.status === "pending-approval" || e.status === "requested").reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        const total = list.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)
        const thisMonth = new Date().getMonth()
        const thisMonthTotal = list.filter((e: any) => e.created_at && new Date(e.created_at).getMonth() === thisMonth).reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
        return {
          pendingApproval: pendingCount,
          pendingTotal: `ETB ${pendingTotal.toLocaleString()}`,
          toPay: approvedCount,
          thisMonth: `ETB ${thisMonthTotal.toLocaleString()}`,
          recentTotal: `ETB ${total.toLocaleString()}`,
          categories: [...new Set(list.map((e: any) => e.category).filter(Boolean))],
        }
      }
      if (path === "/finance/expenses") {
        const queryParams = new URLSearchParams(endpoint.split("?")[1] || "")
        const statusFilter = queryParams.get("status")
        let query = supabaseAdmin.from("expenses").select("*").order("created_at", { ascending: false })
        if (statusFilter) query = query.eq("status", statusFilter)
        const { data, error } = await query
        if (error || !data) return []
        return data.map((e: any) => ({
          id: e.id,
          ref: e.ref || `EXP-${String(e.id).slice(0, 6).toUpperCase()}`,
          category: e.category,
          description: e.description,
          amount: `ETB ${parseFloat(e.amount || 0).toLocaleString()}`,
          date: e.created_at ? new Date(e.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          requestedBy: e.requested_by_user_id || "System",
          status: e.status || "pending-approval",
          hasDocument: false,
          timeline: [],
        }))
      }
      // Single expense GET
      if (parts.length >= 3 && parts[2] && !parts[2].includes("summary")) {
        const { data } = await supabaseAdmin.from("expenses").select("*").eq("id", parts[2]).single()
        if (!data) return null
        return {
          id: data.id,
          ref: data.ref || `EXP-${String(data.id).slice(0, 6).toUpperCase()}`,
          category: data.category,
          description: data.description,
          amount: `ETB ${parseFloat(data.amount || 0).toLocaleString()}`,
          date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          requestedBy: data.requested_by_user_id || "System",
          status: data.status || "pending-approval",
          notes: data.notes || "",
          hasDocument: false,
          timeline: [],
        }
      }
    }
    // ── POST: create, approve, reject, pay, cancel ──
    if (method === "POST") {
      if (path === "/finance/expenses") {
        const numAmount = parseFloat(String(body.amount || "0").replace(/[^0-9.]/g, "")) || 0
        const ref = `EXP-${Date.now().toString(36).toUpperCase()}`
        const { data, error } = await supabaseAdmin
          .from("expenses")
          .insert([{
            ref,
            category: body.category || "General",
            description: body.description || "",
            amount: numAmount,
            notes: body.notes || "",
            status: "pending-approval",
            requested_by_user_id: body.requestedByUserId || body.userId || role || "system",
          }])
          .select()
        if (error || !data?.[0]) throw error || new Error("Failed to create expense")
        const e = data[0]
        await writeNotification(
          "general-manager",
          "New Expense Request",
          `${body.category || "Expense"} — ETB ${numAmount.toLocaleString()} submitted for approval`,
          "approval",
          "expenses",
          e.id
        )
        return {
          id: e.id, ref: e.ref || ref, category: e.category,
          description: e.description, amount: `ETB ${numAmount.toLocaleString()}`,
          date: new Date().toLocaleDateString(), requestedBy: e.requested_by_user_id || "System",
          status: e.status || "pending-approval", hasDocument: false, timeline: [],
        }
      }
      // Expense actions: /finance/expenses/:id/approve|reject|pay|cancel
      const expId = parts[2]
      if (path.endsWith("/approve") && expId) {
        await supabaseAdmin.from("expenses").update({
          status: "approved",
          approved_by_manager_id: body.managerId || role || "manager",
          updated_at: new Date().toISOString(),
        }).eq("id", expId)
        const { data: exp } = await supabaseAdmin.from("expenses").select("requested_by_user_id, description, amount").eq("id", expId).single()
        if (exp?.requested_by_user_id) {
          await writeNotification(exp.requested_by_user_id, "Expense Approved",
            `Your expense request (${exp.description || ""}) of ETB ${parseFloat(exp.amount || 0).toLocaleString()} has been approved.`,
            "info", "expenses", expId)
        }
        return { success: true }
      }
      if (path.endsWith("/reject") && expId) {
        await supabaseAdmin.from("expenses").update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        }).eq("id", expId)
        const { data: exp } = await supabaseAdmin.from("expenses").select("requested_by_user_id, description").eq("id", expId).single()
        if (exp?.requested_by_user_id) {
          await writeNotification(exp.requested_by_user_id, "Expense Rejected",
            `Your expense request (${exp.description || ""}) was rejected. Reason: ${body.reason || "No reason given"}.`,
            "warning", "expenses", expId)
        }
        return { success: true }
      }
      if (path.endsWith("/pay") && expId) {
        await supabaseAdmin.from("expenses").update({
          status: "paid",
          payment_method: body.paymentAccount || "bank_transfer",
          updated_at: new Date().toISOString(),
        }).eq("id", expId)
        return { success: true }
      }
      if (path.endsWith("/cancel") && expId) {
        await supabaseAdmin.from("expenses").update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        }).eq("id", expId)
        return { success: true }
      }
    }
    // ── PUT: edit expense ──
    if (method === "PUT" && parts[2]) {
      const numAmount = body.amount ? parseFloat(String(body.amount).replace(/[^0-9.]/g, "")) : undefined
      const updates: any = {}
      if (body.category) updates.category = body.category
      if (body.description) updates.description = body.description
      if (numAmount !== undefined) updates.amount = numAmount
      if (body.notes !== undefined) updates.notes = body.notes
      updates.updated_at = new Date().toISOString()
      const { data } = await supabaseAdmin.from("expenses").update(updates).eq("id", parts[2]).select().single()
      return data ? {
        id: data.id, ref: data.ref || `EXP-${String(data.id).slice(0, 6).toUpperCase()}`,
        category: data.category, description: data.description,
        amount: `ETB ${parseFloat(data.amount || 0).toLocaleString()}`,
        date: data.created_at ? new Date(data.created_at).toLocaleDateString() : "—",
        requestedBy: data.requested_by_user_id || "System",
        status: data.status, hasDocument: false, timeline: [],
      } : null
    }
  }

  if (path.startsWith("/finance/expense-categories")) {
    if (method === "GET") {
      // Fetch categories from Supabase if table exists, otherwise return empty
      try {
        const { data } = await supabaseAdmin.from("expense_categories").select("*").order("name")
        return data && data.length > 0 ? data : []
      } catch {
        return []
      }
    }
    if (method === "POST") {
      try {
        const { data } = await supabaseAdmin.from("expense_categories").insert([{ ...body, active: true }]).select()
        return data?.[0] || { id: "cat-" + Date.now(), ...body, active: true }
      } catch {
        return { id: "cat-" + Date.now(), ...body, active: true }
      }
    }
  }

  // ── PROFILES / SALES REPS ──
  if (path === "/profiles/sales-reps" && method === "GET") {
    try {
      // Try all common role name variants used across the system
      const salesRoleVariants = [
        "sales-rep", "sales_rep", "SALES_REP", "sales",
        "Sales Representative", "salesperson", "SalesRep",
      ]
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name, role, status")
        .in("role", salesRoleVariants)
        .neq("status", "inactive")
        .order("full_name")
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Sales Rep",
        }))
      }
    } catch { /* fall through */ }
    // Fallback: return ALL active profiles so the dropdown is always populated
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name, role, status")
        .neq("status", "inactive")
        .order("full_name")
        .limit(100)
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Employee",
          role: u.role || "",
        }))
      }
    } catch { /* ignore */ }
    return []
  }

  // ── NOTIFICATIONS ──
  if (path === "/notifications" && method === "GET") {
    try {
      const urlParams = new URLSearchParams(endpoint.split("?")[1] || "")
      const recipientId = urlParams.get("userId") || ""
      let query = supabaseAdmin
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
      if (recipientId && role) {
        query = query.or(`recipient_user_id.eq.${recipientId},recipient_user_id.eq.${role}`)
      } else if (recipientId) {
        query = query.eq("recipient_user_id", recipientId)
      } else if (role) {
        query = query.eq("recipient_user_id", role)
      }
      const { data } = await query
      return (data || []).map((n: any) => ({
        id: n.id,
        category: n.type === "urgent" ? "urgent" : n.type === "approval" ? "approval" : n.severity === "warning" ? "warning" : "info",
        title: n.title,
        what: n.message || "",
        why: n.reason || "",
        module: n.related_entity_type || "",
        moduleId: n.related_entity_id || "",
        time: n.created_at ? new Date(n.created_at).toLocaleString() : "Just now",
        timeRaw: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
        read: !!n.is_read,
      }))
    } catch { return [] }
  }
  if (path === "/notifications" && method === "POST") {
    // Mark notification as read or create one
    if (body.action === "mark-read" && body.id) {
      try {
        await supabaseAdmin.from("notifications").update({ is_read: true, status: "read" }).eq("id", body.id)
      } catch { /* ignore */ }
      return { success: true }
    }
    if (body.action === "mark-all-read" && body.userId) {
      try {
        await supabaseAdmin.from("notifications").update({ is_read: true, status: "read" }).eq("recipient_user_id", body.userId)
      } catch { /* ignore */ }
      return { success: true }
    }
    return { success: true }
  }

  // ── PROFILES / DRIVERS ──
  if (path === "/profiles/drivers" && method === "GET") {
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name, vehicle, vehicle_plate, role")
        .in("role", ["delivery-staff", "driver", "DRIVER", "delivery_staff"])
        .order("full_name")
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Driver",
          vehicle: u.vehicle || u.vehicle_plate || "",
        }))
      }
    } catch { /* fall through */ }
    // Fallback: all profiles
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name")
        .order("full_name")
        .limit(50)
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Staff",
          vehicle: "",
        }))
      }
    } catch { /* ignore */ }
    return []
  }

  // ── PAYMENTS RECORD ──
  if (path === "/payments/record" && method === "POST") {
    const numericAmount = parseFloat(String(body.amount || "0").replace(/[^0-9.]/g, "")) || 0
    // paymentId here is the PaymentRecord.id which maps to a payment UUID or we need the order_id
    // Try to find the order_id: first check if paymentId is a payment row UUID
    let resolvedOrderId: string | null = body.orderId || body.order_id || null
    if (!resolvedOrderId && body.paymentId) {
      // paymentId could be a payments row id — look up its order_id
      const { data: existingPay } = await supabaseAdmin
        .from("payments")
        .select("order_id")
        .eq("id", body.paymentId)
        .single()
      resolvedOrderId = existingPay?.order_id || null
    }
    if (!resolvedOrderId) {
      // Fall back to most recent order
      const { data: firstOrder } = await supabaseAdmin
        .from("orders")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      resolvedOrderId = firstOrder?.id || null
    }
    const idempotencyKey = `PAY-${Date.now()}-${Math.floor(Math.random() * 100000)}`
    const { data: inserted, error: payErr } = await supabaseAdmin.from("payments").insert([
      {
        order_id: resolvedOrderId,
        amount: numericAmount,
        payment_method: "bank_transfer",
        bank_reference_number: body.transferRef || body.bankRef || "",
        idempotency_key: idempotencyKey,
        registered_by_user_id: body.registeredByUserId || "USR-001",
      },
    ]).select()
    if (payErr) {
      console.error("[Supabase API] Error recording payment:", payErr)
      throw payErr
    }
    const ref = inserted?.[0]?.id ? `PAY-${String(inserted[0].id).slice(0, 6).toUpperCase()}` : idempotencyKey
    return { success: true, ref }
  }

  // ── PAYROLL ──
  if (path.startsWith("/finance/payroll")) {
    const base = path.split("?")[0]
    if (method === "GET") {
      if (base === "/finance/payroll") {
        // Fetch current payroll run from DB
        try {
          const { data } = await supabaseAdmin
            .from("payroll_runs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
          if (data && data.length > 0) {
            const run = data[0]
            // Fetch employee lines for this run — correct table: payroll_run_lines
            const { data: lines } = await supabaseAdmin
              .from("payroll_run_lines")
              .select("*, profile:profiles(full_name, role, department)")
              .eq("payroll_run_id", run.id)
            // Also fetch total employee count from profiles
            const { count: totalEmployees } = await supabaseAdmin
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .neq("status", "inactive")
            const runLines = lines || []
            const totalNet = runLines.reduce((s: number, l: any) => s + (parseFloat(l.net_amount) || 0), 0)
            return {
              id: run.id,
              period: run.period_start
                ? `${new Date(run.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
              status: run.status || "draft",
              employeeCount: runLines.length || totalEmployees || 0,
              totalAmount: `ETB ${totalNet.toLocaleString()}`,
              pendingReviewCount: 0,
              changesCount: 0,
              employees: runLines.map((l: any) => ({
                id: l.id,
                name: l.profile?.full_name || "Employee",
                role: l.profile?.role || l.profile?.department || "Staff",
                baseAmount: `ETB ${parseFloat(l.base_salary_amount || 0).toLocaleString()}`,
                adjustments: `ETB ${parseFloat(l.advance_deduction_amount || 0).toLocaleString()}`,
                finalAmount: `ETB ${parseFloat(l.net_amount || 0).toLocaleString()}`,
                reviewStatus: "ok",
                paymentStatus: run.status === "paid" ? "paid" : "pending",
                notes: l.notes || "",
              })),
              timeline: [],
            }
          }
        } catch { /* fall through */ }
        // No payroll runs yet — return clean empty draft
        return {
          id: "pr-new",
          period: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          status: "draft",
          employeeCount: 0,
          totalAmount: "ETB 0",
          pendingReviewCount: 0,
          changesCount: 0,
          employees: [],
          timeline: [],
        }
      }
      return null
    }
    if (method === "POST") {
      const runId = parts[2]
      if (path.endsWith("/submit")) {
        try {
          await supabaseAdmin.from("payroll_runs").update({ status: "pending-approval" }).eq("id", runId)
        } catch { /* ignore if table missing */ }
        return { success: true, status: "pending-approval" }
      }
      if (path.endsWith("/approve")) {
        try {
          await supabaseAdmin.from("payroll_runs").update({
            status: "approved",
            approved_by: body.userId || "Manager",
            approved_at: new Date().toISOString(),
          }).eq("id", runId)
        } catch { /* ignore if table missing */ }
        return { success: true, status: "approved" }
      }
      if (path.endsWith("/finalize")) {
        try {
          await supabaseAdmin.from("payroll_runs").update({
            status: "paid",
            finalized_at: new Date().toISOString(),
          }).eq("id", runId)
        } catch { /* ignore if table missing */ }
        return { success: true, status: "paid" }
      }
      return { success: true }
    }
  }
  // ── CUSTOMER APPROVAL / REJECTION ──
  if (path.startsWith("/customers/") && method === "POST") {
    if (path.endsWith("/approve")) {
      const custId = path.split("/")[2]
      try {
        await supabaseAdmin.from("customers").update({
          status: "approved",
          approved_by: body.managerId || "General Manager",
          approved_at: new Date().toISOString(),
        }).eq("id", custId)
        // Notify the sales rep who submitted this customer
        const { data: cust } = await supabaseAdmin.from("customers").select("name, sales_rep_id, sales_rep_name").eq("id", custId).single()
        if (cust?.sales_rep_id) {
          await writeNotification(cust.sales_rep_id, "Customer Approved ✔️",
            `Your customer registration for "${cust.name || "Customer"}" has been approved by management. They are now active.`,
            "info", "customers", custId)
        }
      } catch { /* ignore fallback */ }
      return { success: true }
    }
    if (path.endsWith("/reject")) {
      if (!body.reason || !body.reason.trim()) {
        throw new Error("Rejection reason is required.")
      }
      const custId = path.split("/")[2]
      try {
        await supabaseAdmin.from("customers").update({
          status: "rejected",
          rejected_by: body.managerId || "General Manager",
          rejected_at: new Date().toISOString(),
          rejection_reason: body.reason.trim(),
        }).eq("id", custId)
        // Notify the sales rep
        const { data: cust } = await supabaseAdmin.from("customers").select("name, sales_rep_id").eq("id", custId).single()
        if (cust?.sales_rep_id) {
          await writeNotification(cust.sales_rep_id, "Customer Registration Rejected",
            `The registration for "${cust.name || "Customer"}" was rejected. Reason: ${body.reason.trim()}`,
            "warning", "customers", custId)
        }
      } catch { /* ignore fallback */ }
      return { success: true }
    }
    // GET /customers/:id/orders — orders for a specific customer
    if (path.endsWith("/orders") && method === "GET") {
      // handled below as GET
    }
  }
  // GET /customers/:id/orders
  if (path.startsWith("/customers/") && path.endsWith("/orders") && method === "GET") {
    const custId = parts[1]
    try {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("customer_id", custId)
        .order("created_at", { ascending: false })
      return (orders || []).map((ord: any) => ({
        id: ord.id,
        ref: ord.orderNumber || `ORD-${String(ord.id).slice(0, 6).toUpperCase()}`,
        status: ord.status || "pending-confirmation",
        totalAmount: `ETB ${parseFloat(ord.total_amount || 0).toLocaleString()}`,
        createdAt: ord.created_at ? new Date(ord.created_at).toLocaleDateString() : "—",
        isUrgent: !!ord.is_urgent,
        items: (ord.order_items || []).map((i: any) => ({
          id: i.id,
          coffeeProductId: i.coffee_product_id,
          quantity: i.quantity,
          unitPrice: `ETB ${parseFloat(i.unit_price || 0).toLocaleString()}`,
          status: i.status,
        })),
      }))
    } catch { return [] }
  }
  // ── ORDER CANCELLATION / REJECTION ──
  if (path.startsWith("/orders/") && method === "POST") {
    if (path.endsWith("/cancel")) {
      if (!body.reason || !body.reason.trim()) {
        throw new Error("Cancellation reason is required.")
      }
      const orderId = path.split("/")[2]
      try {
        await supabaseAdmin.from("orders").update({
          status: "cancelled",
          cancelled_by: body.managerId || "General Manager",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: body.reason.trim(),
        }).eq("id", orderId)
      } catch {
        /* ignore */
      }
      return { success: true }
    }
    if (path.endsWith("/reject")) {
      if (!body.reason || !body.reason.trim()) {
        throw new Error("Rejection reason is required.")
      }
      const orderId = path.split("/")[2]
      try {
        await supabaseAdmin.from("orders").update({
          status: "cancelled",
          rejected_by: body.managerId || "General Manager",
          rejected_at: new Date().toISOString(),
          rejection_reason: body.reason.trim(),
        }).eq("id", orderId)
      } catch {
        /* ignore */
      }
      return { success: true }
    }
  }

  // ── TRANSACTIONS — save to payments table ──
  if (path === "/finance/transactions" && method === "POST") {
    const numericAmount = parseFloat(String(body.amount || "0").replace(/[^0-9.]/g, "")) || 0
    // Get a real order_id to attach this transaction to
    const { data: firstOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    const idempotencyKey = `TXN-${Date.now()}-${Math.floor(Math.random() * 100000)}`
    const { data: inserted, error: txErr } = await supabaseAdmin.from("payments").insert([{
      order_id: body.orderId || firstOrder?.id || null,
      amount: numericAmount,
      payment_method: body.method || "bank_transfer",
      bank_reference_number: body.ref || body.reference || "",
      idempotency_key: idempotencyKey,
      registered_by_user_id: "USR-001",
    }]).select()
    if (txErr) console.error("[Supabase API] Transaction error:", txErr)
    const txId = inserted?.[0]?.id || idempotencyKey
    return {
      id: txId,
      ref: `TXN-${String(txId).slice(0, 6).toUpperCase()}`,
      date: body.date || new Date().toISOString(),
      description: body.description || "",
      amount: `ETB ${numericAmount.toLocaleString()}`,
      type: body.type || "deposit",
      direction: body.direction || "inbound",
      status: "cleared",
    }
  }

  if (path === "/finance/accounts" && method === "GET") {
    try {
      // Correct table name: company_bank_accounts (not bank_accounts)
      const { data } = await supabaseAdmin.from("company_bank_accounts").select("*").order("created_at")
      if (data && data.length > 0) {
        // Fetch total payments to compute running balance
        const { data: pays } = await supabaseAdmin.from("payments").select("amount")
        const totalPaid = (pays || []).reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
        return data.map((acc: any, i: number) => {
          const openingBal = parseFloat(acc.opening_balance || 0)
          // Distribute payments across accounts (simple split for now)
          const allocatedPays = i === 0 ? totalPaid : 0
          const liveBalance = openingBal + allocatedPays
          return {
            id: acc.id,
            bankName: acc.bank_name || "Bank",
            accountName: acc.bank_name || "Account",
            maskedAccountNumber: acc.account_number ? `****${String(acc.account_number).slice(-4)}` : "****0000",
            rawAccountRef: acc.account_number || acc.id,
            calculatedBalance: `ETB ${liveBalance.toLocaleString()}`,
            lastTransactionDate: acc.updated_at ? new Date(acc.updated_at).toLocaleDateString() : "\u2014",
            lastTransactionDesc: "\u2014",
            reconciliationStatus: "pending",
            reconciliationPeriod: "\u2014",
            openingBalance: `ETB ${openingBal.toLocaleString()}`,
            transactionCount: 0,
            name: acc.bank_name || "Account",
            label: `${acc.bank_name || "Bank"} \u2014 ****${String(acc.account_number || "0000").slice(-4)}`,
          }
        })
      }
    } catch { /* fall through to empty */ }
    return []
  }

  // ── Dashboards & Summaries ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") {
    try {
      const queryParams = new URLSearchParams(endpoint.split("?")[1] || "")
      const salesRepId = queryParams.get("salesRepId") || ""

      // Active orders for this sales rep (not cancelled/delivered/completed)
      let ordersQuery = supabaseAdmin
        .from("orders")
        .select("id, status", { count: "exact", head: true })
        .not("status", "in", '("cancelled","delivered","completed","CANCELLED","DELIVERED","COMPLETED")')
      if (salesRepId) ordersQuery = ordersQuery.eq("sales_rep_id", salesRepId)
      const { count: activeOrdersCount } = await ordersQuery

      // Pending customers for this sales rep (awaiting manager approval)
      let custQuery = supabaseAdmin
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
      if (salesRepId) custQuery = custQuery.eq("sales_rep_id", salesRepId)
      const { count: pendingCustomersCount } = await custQuery

      // Total customers for this sales rep
      let totalCustQuery = supabaseAdmin
        .from("customers")
        .select("id", { count: "exact", head: true })
      if (salesRepId) totalCustQuery = totalCustQuery.eq("sales_rep_id", salesRepId)
      const { count: totalCustomersCount } = await totalCustQuery

      return {
        activeOrders: activeOrdersCount ?? 0,
        pendingCustomers: pendingCustomersCount ?? 0,
        totalCustomers: totalCustomersCount ?? 0,
      }
    } catch (err) {
      console.error("[dashboard/sales] error:", err)
      return { activeOrders: 0, pendingCustomers: 0, totalCustomers: 0 }
    }
  }

  if ((path === "/dashboard/finance" || path === "/finance/dashboard") && method === "GET") {
    try {
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [{ data: expData }, { data: payData }, { data: ordersData }, { data: bankData }, { data: payrollData }] = await Promise.all([
        supabaseAdmin.from("expenses").select("amount, status, created_at"),
        supabaseAdmin.from("payments").select("amount, order_id, created_at"),
        supabaseAdmin.from("orders").select("id, total_amount, payment_deadline_at, status"),
        supabaseAdmin.from("company_bank_accounts").select("opening_balance, bank_name"),
        supabaseAdmin.from("payroll_runs").select("status, total_amount, period_start").order("created_at", { ascending: false }).limit(1),
      ])

      const expList = expData || []
      const payList = payData || []
      const ordersList = ordersData || []

      // Total customer payments received
      const paymentsTotal = payList.reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)

      // Outstanding balances = sum of (order total - payments received) for unpaid orders
      const payByOrder: Record<string, number> = {}
      for (const p of payList) { payByOrder[p.order_id] = (payByOrder[p.order_id] || 0) + (parseFloat(p.amount) || 0) }
      let outstanding = 0
      let overdueCount = 0
      for (const ord of ordersList) {
        const total = parseFloat(ord.total_amount || 0)
        const paid = payByOrder[ord.id] || 0
        const remaining = Math.max(0, total - paid)
        if (remaining > 0) {
          outstanding += remaining
          if (ord.payment_deadline_at && new Date(ord.payment_deadline_at) < now) overdueCount++
        }
      }

      // This month expenses
      const thisMonthExp = expList
        .filter((e: any) => e.created_at && e.created_at >= thisMonthStart)
        .reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)

      // Pending expense approvals
      const pendingExps = expList.filter((e: any) => e.status === "pending-approval" || e.status === "requested")
      const pendingExpTotal = pendingExps.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)

      // Bank balance from company_bank_accounts (sum of opening balances as baseline)
      const bankBalance = (bankData || []).reduce((s: number, b: any) => s + (parseFloat(b.opening_balance) || 0), 0)
      const totalBankBalance = bankBalance > 0 ? bankBalance + paymentsTotal : paymentsTotal

      // Payroll
      const latestPayroll = payrollData?.[0]
      const payrollTotal = latestPayroll ? parseFloat(String(latestPayroll.total_amount).replace(/[^0-9.]/g, "")) || 0 : 0
      const payrollPeriod = latestPayroll?.period_start
        ? new Date(latestPayroll.period_start).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "Current"

      // Smart alerts
      const alerts: any[] = []
      if (overdueCount > 0) alerts.push({ id: "overdue", severity: "critical", message: `${overdueCount} customer payment${overdueCount > 1 ? "s are" : " is"} overdue. Immediate follow-up required.` })
      if (pendingExps.length > 0) alerts.push({ id: "pending-exp", severity: "warning", message: `${pendingExps.length} expense request${pendingExps.length > 1 ? "s" : ""} (ETB ${pendingExpTotal.toLocaleString()}) awaiting approval.` })
      if (latestPayroll?.status === "pending-approval") alerts.push({ id: "payroll", severity: "info", message: `Payroll run for ${payrollPeriod} is pending manager approval.` })

      return {
        totalCustomerPayments: `ETB ${paymentsTotal.toLocaleString()}`,
        outstandingBalances: `ETB ${outstanding.toLocaleString()}`,
        overdueCount,
        thisMonthExpenses: `ETB ${thisMonthExp.toLocaleString()}`,
        pendingExpenseApprovals: `ETB ${pendingExpTotal.toLocaleString()}`,
        pendingExpenseCount: pendingExps.length,
        currentPayrollTotal: `ETB ${payrollTotal.toLocaleString()}`,
        payrollPeriod,
        payrollStatus: latestPayroll?.status || "draft",
        totalBankBalance: `ETB ${totalBankBalance.toLocaleString()}`,
        alerts,
      }
    } catch (err) {
      console.error("[Finance Dashboard] Error:", err)
      return {
        totalCustomerPayments: "ETB 0", outstandingBalances: "ETB 0", overdueCount: 0,
        thisMonthExpenses: "ETB 0", pendingExpenseApprovals: "ETB 0", pendingExpenseCount: 0,
        currentPayrollTotal: "ETB 0", payrollPeriod: "Current", payrollStatus: "draft",
        totalBankBalance: "ETB 0", alerts: [],
      }
    }
  }

  // GET /finance/activity — unified activity feed (payments + expenses)
  if (path === "/finance/activity" && method === "GET") {
    try {
      const [{ data: payData }, { data: expData }] = await Promise.all([
        supabaseAdmin
          .from("payments")
          .select("id, amount, payment_method, bank_reference_number, created_at, registered_by_user_id, order_id")
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin
          .from("expenses")
          .select("id, amount, category, description, status, created_at, requested_by, ref")
          .order("created_at", { ascending: false })
          .limit(50),
      ])

      const payRows: any[] = (payData || []).map((p: any) => ({
        id: `pay-${p.id}`,
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
        type: "Customer Payment",
        ref: p.bank_reference_number
          ? `TXN-${String(p.bank_reference_number).slice(0, 8).toUpperCase()}`
          : `PAY-${String(p.id).slice(0, 6).toUpperCase()}`,
        description: `Payment received${p.order_id ? ` for order ${String(p.order_id).slice(0, 6).toUpperCase()}` : ""}`,
        amount: `ETB ${parseFloat(p.amount || 0).toLocaleString()}`,
        account: p.payment_method ? p.payment_method.replace(/_/g, " ") : "Bank Transfer",
        status: "verified",
        recordedBy: p.registered_by_user_id || "System",
        _ts: p.created_at || "",
      }))

      const expRows: any[] = (expData || []).map((e: any) => ({
        id: `exp-${e.id}`,
        date: e.created_at ? new Date(e.created_at).toLocaleDateString() : "—",
        type: "Expense",
        ref: e.ref || `EXP-${String(e.id).slice(0, 6).toUpperCase()}`,
        description: e.description || e.category || "Expense",
        amount: `ETB ${parseFloat(e.amount || 0).toLocaleString()}`,
        account: e.category || "Operations",
        status: e.status || "pending",
        recordedBy: e.requested_by || "System",
        _ts: e.created_at || "",
      }))

      const combined = [...payRows, ...expRows]
        .sort((a, b) => (b._ts > a._ts ? 1 : -1))
        .slice(0, 80)
        .map(({ _ts, ...rest }) => rest)

      return combined
    } catch (err) {
      console.error("[Supabase API] /finance/activity error:", err)
      return []
    }
  }

  if (path === "/dashboard/inventory" && method === "GET") {
    // Real inventory KPIs from stock_balances
    try {
      const { data: stocks } = await supabaseAdmin.from("stock_balances").select("*")
      const green = (stocks || []).find((s: any) => s.itemType === "GREEN") || { on_hand: 0, reserved: 0, available: 0 }
      const roasted = (stocks || []).find((s: any) => s.itemType === "ROASTED") || { on_hand: 0, reserved: 0, available: 0 }
      const low = (stocks || []).filter((s: any) => (parseFloat(s.available) || 0) < 50)
      return {
        kpiCards: [
          { label: "Green Coffee", value: `${parseFloat(green.on_hand || 0).toFixed(1)} kg`, sub: `Available: ${parseFloat(green.available || 0).toFixed(1)} kg` },
          { label: "Roasted Coffee", value: `${parseFloat(roasted.on_hand || 0).toFixed(1)} kg`, sub: `Available: ${parseFloat(roasted.available || 0).toFixed(1)} kg` },
          { label: "Low Stock Alerts", value: low.length.toString(), sub: low.length > 0 ? "Items need restock" : "All levels healthy" },
        ],
        attentionCards: low.map((s: any) => ({
          id: s.item_id,
          severity: "warning",
          title: `Low ${s.itemType} stock: ${parseFloat(s.available || 0).toFixed(1)} kg available`,
          module: "inventory",
        })),
      }
    } catch {
      return { kpiCards: [], attentionCards: [] }
    }
  }
  if (path === "/inventory/stats" && method === "GET") {
    try {
      const { data: stocks } = await supabaseAdmin.from("stock_balances").select("*")
      const green = (stocks || []).find((s: any) => s.itemType === "GREEN") || { on_hand: 0, reserved: 0, available: 0 }
      const roasted = (stocks || []).find((s: any) => s.itemType === "ROASTED") || { on_hand: 0, reserved: 0, available: 0 }
      const pkg = (stocks || []).find((s: any) => s.itemType === "PACKAGING") || { on_hand: 0, reserved: 0, available: 0 }
      const fmt = (n: any) => `${parseFloat(String(n || 0)).toLocaleString()} kg`
      const fmtUnits = (n: any) => `${parseFloat(String(n || 0)).toLocaleString()}`
      const lowThreshold = 100
      return {
        green: {
          onHand: fmt(green.on_hand),
          reserved: fmt(green.reserved),
          available: fmt(green.available),
          status: (green.available || 0) < lowThreshold ? "low" : "healthy",
          lotCount: 0,
        },
        roasted: {
          onHand: fmt(roasted.on_hand),
          reserved: fmt(roasted.reserved),
          available: fmt(roasted.available),
          status: (roasted.available || 0) < 50 ? "low" : "healthy",
          lotCount: 0,
        },
        packaging: {
          onHand: fmtUnits(pkg.on_hand),
          reserved: fmtUnits(pkg.reserved),
          available: fmtUnits(pkg.available),
          status: (pkg.available || 0) < 100 ? "low" : "healthy",
          skuCount: 0,
        },
        attentionCount: (stocks || []).filter((s: any) => (parseFloat(s.available) || 0) < 50).length,
      }
    } catch {
      return {
        green: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 },
        roasted: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 },
        packaging: { onHand: "0", reserved: "0", available: "0", status: "healthy", skuCount: 0 },
        attentionCount: 0,
      }
    }
  }
  if (path === "/inventory/attention" && method === "GET") {
    try {
      const { data: stocks } = await supabaseAdmin.from("stock_balances").select("*")
      return (stocks || []).filter((s: any) => (parseFloat(s.available) || 0) < 50).map((s: any) => ({
        id: s.item_id,
        type: s.itemType,
        available: parseFloat(s.available || 0).toFixed(1),
        severity: (parseFloat(s.available) || 0) <= 0 ? "critical" : "warning",
        message: `${s.itemType} stock critically low: ${parseFloat(s.available || 0).toFixed(1)} units available`,
      }))
    } catch { return [] }
  }
  if (path === "/finance/banking/summary" && method === "GET") {
    try {
      const { data: accounts } = await supabaseAdmin.from("company_bank_accounts").select("opening_balance")
      const { data: pays } = await supabaseAdmin.from("payments").select("amount")
      const openingTotal = (accounts || []).reduce((s: number, a: any) => s + (parseFloat(a.opening_balance) || 0), 0)
      const paymentsTotal = (pays || []).reduce((s: number, p: any) => s + (parseFloat(p.amount) || 0), 0)
      const total = openingTotal + paymentsTotal
      return {
        totalBalance: `ETB ${total.toLocaleString()}`,
        unassignedDeposits: "ETB 0",
        pendingReconciliations: 0,
        alerts: [],
      }
    } catch {
      return { totalBalance: "ETB 0", unassignedDeposits: "ETB 0", pendingReconciliations: 0, alerts: [] }
    }
  }
  if (path === "/finance/expenses/summary" && method === "GET") {
    const { data: expList } = await supabaseAdmin.from("expenses").select("*")
    const list = expList || []
    return {
      pendingApproval: list.filter((e: any) => e.status === "pending-approval" || e.status === "requested").length,
      toPay: list.filter((e: any) => e.status === "approved").length,
      recentTotal: "ETB " + list.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0).toLocaleString(),
    }
  }
  if (path === "/delivery/summary" && method === "GET") {
    const { data: deliveries } = await supabaseAdmin.from("delivery_records").select("status")
    const dl = deliveries || []
    return {
      pending: dl.filter((d: any) => d.status === "READY_FOR_ASSIGNMENT" || d.status === "ready-for-delivery").length,
      inTransit: dl.filter((d: any) => d.status === "OUT_FOR_DELIVERY" || d.status === "out-for-delivery" || d.status === "ASSIGNED").length,
      completedToday: dl.filter((d: any) => d.status === "FULLY_DELIVERED" || d.status === "fully-delivered" || d.status === "VERIFIED").length,
    }
  }

  // \u2500\u2500 DELIVERY ACTIONS (assign, start, verify, fail) \u2500\u2500
  if (path.startsWith("/delivery/") && method === "POST") {
    const delivId = parts[1]
    // Assign driver
    if (path.endsWith("/assign") && delivId) {
      const driverId = body.driverId || body.driver_id
      await supabaseAdmin.from("delivery_records").update({
        status: "ASSIGNED",
        driver_user_id: driverId,
        updated_at: new Date().toISOString(),
      }).eq("id", delivId)
      return { success: true }
    }
    // Start delivery
    if (path.endsWith("/start") && delivId) {
      await supabaseAdmin.from("delivery_records").update({
        status: "OUT_FOR_DELIVERY",
        updated_at: new Date().toISOString(),
      }).eq("id", delivId)
      return { success: true }
    }
    // Verify customer acceptance (delivery confirmed by customer)
    if (path.includes("/verify") && delivId) {
      const confirmed = body.confirmed !== false
      const status = confirmed ? "FULLY_DELIVERED" : "DELIVERY_DISPUTED"
      await supabaseAdmin.from("delivery_records").update({
        status,
        verified_by_manager_id: body.managerId || "system",
        updated_at: new Date().toISOString(),
      }).eq("id", delivId)
      if (confirmed) {
        // Mark linked order as delivered
        try {
          const { data: deliv } = await supabaseAdmin.from("delivery_records").select("order_id, customer_id").eq("id", delivId).single()
          if (deliv?.order_id) {
            await supabaseAdmin.from("orders").update({ status: "delivered", updated_at: new Date().toISOString() }).eq("id", deliv.order_id)
            // Notify finance to expect payment
            await writeNotification("accountant", "Delivery Confirmed \u2014 Payment Due",
              `Order has been delivered and accepted by the customer. Payment collection should begin.`,
              "approval", "delivery_records", delivId)
          }
        } catch { /* ignore */ }
      }
      return { success: true }
    }
    // Report failed delivery attempt
    if (path.endsWith("/fail") && delivId) {
      await supabaseAdmin.from("delivery_records").update({
        status: "FAILED_ATTEMPT",
        updated_at: new Date().toISOString(),
      }).eq("id", delivId)
      return { success: true }
    }
    // Upload proof document (store path)
    if (path.includes("/proof") && delivId) {
      await supabaseAdmin.from("delivery_records").update({
        proof_document_path: body.filePath || body.path || "uploaded",
        status: "AWAITING_CONFIRMATION",
        updated_at: new Date().toISOString(),
      }).eq("id", delivId)
      return { success: true }
    }
  }

  if (path === "/payments/summary" && method === "GET") {
    const { data: payList } = await supabaseAdmin.from("payments").select("*")
    const total = (payList || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
    return {
      receivedToday: "ETB " + total.toLocaleString(),
      pendingVerification: 0,
    }
  }

  // /payments GET — list all payments joined with orders and customers
  if (path.startsWith("/payments") && method === "GET" && !path.includes("/record") && !path.includes("/transaction") && !path.includes("/summary")) {
    const paymentId = parts[1]
    if (paymentId) {
      // Single payment
      const { data: pay } = await supabaseAdmin.from("payments").select("*").eq("id", paymentId).single()
      if (!pay) return null
      const { data: ord } = await supabaseAdmin.from("orders").select("*, customer:customers(*)").eq("id", pay.order_id).single()
      const amt = parseFloat(pay.amount || 0)
      return {
        id: pay.id,
        ref: `PAY-${String(pay.id).slice(0, 6).toUpperCase()}`,
        orderRef: ord?.orderNumber || "—",
        customer: ord?.customer || { id: "—", name: "—" },
        totalAmount: `ETB ${amt.toLocaleString()}`,
        paidAmount: `ETB ${amt.toLocaleString()}`,
        remainingAmount: "ETB 0",
        paymentStatus: "partially-paid",
        paymentDeadline: null,
        daysRemaining: "—",
        daysRemainingNum: 0,
        transactions: [],
      }
    }
    // List payments = all orders + their payment totals
    const [{ data: allOrders }, { data: pays }] = await Promise.all([
      supabaseAdmin.from("orders").select("*, customer:customers(*)").order("created_at", { ascending: false }),
      supabaseAdmin.from("payments").select("*"),
    ])
    const payList = pays || []
    const orderList = allOrders || []

    // Group payments by order_id
    const payByOrder: Record<string, { totalPaid: number; transactions: any[]; latestId: string }> = {}
    for (const p of payList) {
      const oid = p.order_id || ""
      if (!payByOrder[oid]) payByOrder[oid] = { totalPaid: 0, transactions: [], latestId: p.id }
      payByOrder[oid].totalPaid += parseFloat(p.amount || 0)
      payByOrder[oid].transactions.push(p)
    }

    return orderList.map((ord: any) => {
      const g = payByOrder[ord.id] || { totalPaid: 0, transactions: [], latestId: ord.id }
      const totalAmt = parseFloat(ord.total_amount || 0) || 0
      const paidAmt = g.totalPaid
      const remaining = Math.max(0, totalAmt - paidAmt)
      const isPaid = paidAmt > 0 && remaining <= 0
      return {
        id: g.latestId,
        orderId: ord.id,
        ref: `PAY-${String(ord.id).slice(0, 6).toUpperCase()}`,
        orderRef: ord.orderNumber || "—",
        customer: ord.customer || { id: "—", name: "—" },
        totalAmount: `ETB ${totalAmt.toLocaleString()}`,
        paidAmount: `ETB ${paidAmt.toLocaleString()}`,
        remainingAmount: `ETB ${remaining.toLocaleString()}`,
        paymentStatus: isPaid ? "paid" : paidAmt > 0 ? "partially-paid" : "payment-pending",
        paymentDeadline: ord.payment_deadline_at ? new Date(ord.payment_deadline_at).toLocaleDateString() : null,
        daysRemaining: "—",
        daysRemainingNum: 0,
        transactions: g.transactions.map((t: any) => ({
          id: t.id,
          ref: `TXN-${String(t.id).slice(0, 6).toUpperCase()}`,
          amount: `ETB ${parseFloat(t.amount || 0).toLocaleString()}`,
          bankRef: t.bank_reference_number || "—",
          method: "bank_transfer",
          recordedAt: t.created_at ? new Date(t.created_at).toLocaleDateString() : "—",
          verificationStatus: "pending-verification",
        })),
      }
    })
  }


  // ── Custom Actions ──
  if (path === "/receiving" && method === "POST") {
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/confirm") && method === "POST") {
    const orderId = parts[1]
    // Update order to roasting status
    await supabaseAdmin.from("orders").update({ status: "roasting", updated_at: new Date().toISOString() }).eq("id", orderId)
    // Auto-create a roasting batch for this order
    try {
      const { data: ord } = await supabaseAdmin.from("orders").select("total_amount, quantity_kg, customer_id, sales_rep_id").eq("id", orderId).single()
      const { data: item } = await supabaseAdmin.from("order_items").select("id, quantity").eq("order_id", orderId).limit(1).single()
      const qty = parseFloat(item?.quantity || ord?.quantity_kg || "60") || 60
      const { data: batch } = await supabaseAdmin.from("roasting_batches").insert([{
        order_id: orderId,
        order_item_id: item?.id || "00000000-0000-0000-0000-000000000000",
        status: "SCHEDULED",
        green_input_quantity: qty,
        expected_roasted_quantity: qty * 0.85,
        applied_yield_percentage: 85.0,
        acceptable_range_percentage: 5.0,
      }]).select().single()
      // Notify production team
      await writeNotification("roaster", "New Roasting Batch Scheduled",
        `Order confirmed. Batch of ${qty} kg green coffee ready for roasting.`,
        "info", "orders", orderId)
    } catch (batchErr) {
      console.warn("[Order Confirm] Batch creation failed:", batchErr)
    }
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/reject") && method === "POST") {
    const id = parts[1]
    await supabaseAdmin.from("orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/start") && method === "POST") {
    const id = parts[1]
    await supabaseAdmin.from("roasting_batches").update({ status: "ROASTING", updated_at: new Date().toISOString() }).eq("id", id)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/complete") && method === "POST") {
    const id = parts[1]
    const actualYield = parseFloat(String(body.actualYield || body.actual_roasted_quantity || 0))
    await supabaseAdmin.from("roasting_batches").update({
      status: "COMPLETED",
      actual_roasted_quantity: actualYield,
      updated_at: new Date().toISOString(),
    }).eq("id", id)
    // Update the linked order status to packaging
    try {
      const { data: batch } = await supabaseAdmin.from("roasting_batches").select("order_id").eq("id", id).single()
      if (batch?.order_id) {
        await supabaseAdmin.from("orders").update({ status: "packaging", updated_at: new Date().toISOString() }).eq("id", batch.order_id)
        await writeNotification("packaging-staff", "Ready for Packaging",
          `Roasting complete. ${actualYield} kg of roasted coffee is ready for packaging.`,
          "info", "roasting_batches", id)
      }
    } catch { /* ignore */ }
    return { success: true }
  }

  // ── ROASTING: Pending verification ──
  if (path === "/roasting/pending-verification" && method === "GET") {
    try {
      const { data } = await supabaseAdmin
        .from("roasting_batches")
        .select("*, orders(orderNumber, customer_id)")
        .in("status", ["ROASTED", "PENDING_VERIFY", "completed"])
        .order("created_at", { ascending: false })
        .limit(20)
      return data || []
    } catch { return [] }
  }

  // ── ROASTING: Yield history ──
  if (path === "/roasting/yield-history" && method === "GET") {
    try {
      const { data } = await supabaseAdmin
        .from("roasting_batches")
        // Correct column names from schema: green_input_quantity, actual_roasted_quantity
        .select("id, green_input_quantity, actual_roasted_quantity, created_at, status")
        .in("status", ["VERIFIED", "COMPLETED", "completed", "ROASTED"])
        .order("created_at", { ascending: false })
        .limit(30)
      if (data && data.length > 0) {
        return data.map((b: any) => ({
          ...b,
          batch_number: b.batch_number || `BATCH-${String(b.id).slice(0, 6).toUpperCase()}`,
          green_input_kg: b.green_input_quantity || 0,
          roasted_output_kg: b.actual_roasted_quantity || 0,
          yield_pct: (b.green_input_quantity || 0) > 0
            ? +((b.actual_roasted_quantity / b.green_input_quantity) * 100).toFixed(1)
            : 0,
          date: b.created_at ? b.created_at.slice(0, 10) : "",
        }))
      }
      return []
    } catch { return [] }
  }

  // ── Generic CRUD Table Mapping ──
  let table = parts[0]
  if (path.startsWith("/inventory/lots")) table = "lots"
  if (path.startsWith("/production/batches")) table = "roasting_batches"
  if (path.startsWith("/roasting")) table = "roasting_batches"
  if (path.startsWith("/packing") || path.startsWith("/packaging")) table = "roasting_batches"
  if (path.startsWith("/deliveries") || path.startsWith("/delivery")) table = "delivery_records"
  if (path.startsWith("/customers")) table = "customers"
  if (path.startsWith("/orders")) table = "orders"

  const idPos = path.startsWith("/inventory/") || path.startsWith("/production/") ? 2 : 1
  const id = parts[idPos]

  // GET List
  if (method === "GET" && !id) {
    let query = supabaseAdmin.from(table).select("*")
    if (table !== "customers" && table !== "users") {
      query = query.order("created_at", { ascending: false })
    }
    // Support salesRepId filter for customers (scopes list to a specific rep)
    if (table === "customers") {
      const queryParams = new URLSearchParams(endpoint.split("?")[1] || "")
      const salesRepIdFilter = queryParams.get("salesRepId")
      if (salesRepIdFilter) {
        query = query.eq("sales_rep_id", salesRepIdFilter) as any
      }
      query = query.order("created_at", { ascending: false }) as any
    }
    const { data, error } = await query
    if (error) {
      console.error(`[Supabase API] Error fetching ${table}:`, error)
      return path.startsWith("/inventory/lots") ||
        path.startsWith("/inventory/green") ||
        path.startsWith("/inventory/roasted") ||
        path.startsWith("/inventory/packaging")
        ? { lots: [], total: 0, page: 1, pageSize: 10 }
        : []
    }

    if (table === "orders" && data && data.length > 0) {
      const orderIds = data.map((d: any) => d.id)
      const customerIds = [...new Set(data.map((d: any) => d.customer_id).filter(Boolean))]

      const [itemsRes, customersRes] = await Promise.all([
        supabaseAdmin.from("order_items").select("*").in("order_id", orderIds),
        supabaseAdmin.from("customers").select("*").in("id", customerIds),
      ])

      const itemsData = itemsRes.data || []
      const customersData = customersRes.data || []

      data.forEach((order: any) => {
        order.items = itemsData.filter((i: any) => i.order_id === order.id)
        order.customer = customersData.find((c: any) => c.id === order.customer_id) || {
          id: order.customer_id || "CUS-REF",
          name: "Customer",
          business_number: "CUS-REF",
          status: "active",
        }
      })
    }

    if ((table === "roasting_batches" || table === "delivery_records") && data && data.length > 0) {
      const orderIds = [...new Set(data.map((d: any) => d.order_id).filter(Boolean))]
      if (orderIds.length > 0) {
        const { data: ordersData } = await supabaseAdmin.from("orders").select("*, customer:customers(*)").in("id", orderIds)
        const ordersMap = new Map((ordersData || []).map((o: any) => [o.id, o]))
        data.forEach((item: any) => {
          const ord = ordersMap.get(item.order_id)
          item.order = ord
          item.customer = ord?.customer || { id: "CUS-001", name: "Customer", business_number: "CUS-001" }
        })
      }
    }

// In-memory metadata map for roasting batches (preserves coffee profile name & notes)
const roastingBatchMetaMap = new Map<string, { coffee?: string; notes?: string }>()

async function ensureDefaultOrderAndItem() {
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id, customer_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingOrder?.id) {
    const { data: existingItem } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("order_id", existingOrder.id)
      .limit(1)
      .maybeSingle()
    return {
      orderId: existingOrder.id,
      orderItemId: existingItem?.id || null,
      customerId: existingOrder.customer_id || null,
    }
  }
  return { orderId: null, orderItemId: null, customerId: null }
}

    const mapped = camelizeKeys(data) || []

    if (table === "roasting_batches") {
      mapped.forEach((b: any) => {
        const meta = roastingBatchMetaMap.get(b.id)
        if (meta) {
          if (meta.coffee) b.coffee = meta.coffee
          if (meta.notes) b.notes = meta.notes
        }
        if (!b.coffee) b.coffee = ""
      })
      return mapped
    }

    // Normalize delivery_records statuses to UI expected values
    if (table === "delivery_records") {
      const statusMap: Record<string, string> = {
        READY_FOR_ASSIGNMENT: "ready-for-delivery",
        ASSIGNED: "assigned",
        OUT_FOR_DELIVERY: "out-for-delivery",
        PARTIALLY_DELIVERED: "partially-delivered",
        AWAITING_CONFIRMATION: "awaiting-confirmation",
        FULLY_DELIVERED: "fully-delivered",
        DELIVERY_DISPUTED: "delivery-disputed",
        FAILED_ATTEMPT: "failed-attempt",
        VERIFIED: "verified",
      }
      mapped.forEach((d: any) => {
        if (d.status && statusMap[d.status]) d.deliveryStatus = statusMap[d.status]
        else d.deliveryStatus = d.deliveryStatus || d.status || "ready-for-delivery"
        if (!d.deliveryRef) d.deliveryRef = `DEL-${String(d.id || "").slice(0, 6).toUpperCase()}`
        if (!d.orderRef) d.orderRef = d.order?.orderNumber || "—"
        if (!d.customer) d.customer = d.order?.customer || { id: "—", name: "—", businessNumber: "—" }
        if (!d.deliveredQty) d.deliveredQty = "—"
        if (!d.scheduledDate) d.scheduledDate = d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"
        if (!d.driver) d.driver = null
        if (!d.timeline) d.timeline = []
        if (!d.paymentStatus) d.paymentStatus = "payment-pending"
        if (!d.totalAmount) d.totalAmount = "—"
      })
      return mapped
    }

    if (
      path.startsWith("/inventory/lots") ||
      path.startsWith("/inventory/green") ||
      path.startsWith("/inventory/roasted") ||
      path.startsWith("/inventory/packaging")
    ) {
      return { lots: mapped, total: mapped.length, page: 1, pageSize: 10 }
    }
    return mapped
  }

  // POST Create
  if (method === "POST" && !id) {
    let dbBody = { ...body }
    if (table === "customers") {
      dbBody = {
        name: body.name,
        type: body.type || "cafe",
        // Omitted contact_person, phone, email, notes because they do not exist in the DB schema
        business_number: `CUS-${Math.floor(Math.random() * 10000)}`,
        active: true,
        status: body.status || "pending",
        sales_rep_id: body.salesRepId || "",
        sales_rep_name: body.salesRepName || "",
        submitted_at: new Date().toISOString(),
      }
    } else if (table === "orders") {
      // BACKEND MANDATORY VALIDATION: Minimum order quantity must be >= 10 KG
      const totalQuantity = (body.items || []).reduce(
        (sum: number, item: any) => sum + (parseFloat(item.quantity || 0) || 0),
        0
      )
      if (totalQuantity < 10) {
        throw new Error("Minimum order quantity is 10 KG.")
      }

      const preVatAmount =
        body.items?.reduce(
          (sum: number, item: any) => sum + (item.quantity || 0) * (item.unitPrice || 0),
          0
        ) || 0
      const vatRate = 15.0
      const vatAmount = preVatAmount * (vatRate / 100)
      const totalAmount = preVatAmount + vatAmount
      let customerId = body.customerId
      if (!customerId || customerId.trim() === "" || !customerId.includes("-")) {
        const custName = body.customerName || body.customerId || "New Customer"
        const { data: newCust } = await supabaseAdmin.from("customers").insert([{
          name: custName,
          business_number: `CUS-${Math.floor(Math.random() * 10000)}`,
          status: "pending"
        }]).select()
        if (newCust?.[0]?.id) customerId = newCust[0].id
      }
      dbBody = {
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        status: "pending-confirmation",
        customer_id: customerId,
        branch_id: "BRN-001",
        sales_rep_id: body.creatorId || "",
        created_by_user_id: body.creatorId || "",
        created_by_name: body.creatorName || "",
        created_by_role: body.creatorRole || "Sales Representative",
        is_urgent: body.urgent || false,
        pre_vat_amount: preVatAmount,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
      }
    } else if (table === "roasting_batches") {
      const qty = parseFloat(body.quantity || body.greenInputQty || "60") || 60
      let resolvedOrderId: string | null = body.orderId || body.order_id || null
      let resolvedOrderItemId = "00000000-0000-0000-0000-000000000000"
      if (!resolvedOrderId || resolvedOrderId.startsWith("temp-")) {
        const defaults = await ensureDefaultOrderAndItem()
        resolvedOrderId = defaults.orderId
        resolvedOrderItemId = defaults.orderItemId
      }
      dbBody = {
        order_id: resolvedOrderId,
        order_item_id: resolvedOrderItemId,
        status: "SCHEDULED",
        green_input_quantity: qty,
        expected_roasted_quantity: qty * 0.85,
        applied_yield_percentage: 85.0,
        acceptable_range_percentage: 5.0,
      }
    } else if (table === "delivery_records") {
      let resolvedDeliveryOrderId: string | null = body.orderId || body.order_id || null
      let resolvedCustomerId: string | null = body.customerId || body.customer_id || null
      if (!resolvedDeliveryOrderId || !resolvedCustomerId || resolvedDeliveryOrderId.startsWith("temp-")) {
        const defaults = await ensureDefaultOrderAndItem()
        resolvedDeliveryOrderId = defaults.orderId
        resolvedCustomerId = defaults.customerId
      }
      dbBody = {
        order_id: resolvedDeliveryOrderId,
        customer_id: resolvedCustomerId,
        status: "READY_FOR_ASSIGNMENT",
      }
    }

    const { data, error } = await supabaseAdmin.from(table).insert([dbBody]).select()
    if (error) throw error

    if (table === "customers" && data?.[0]) {
      const newCust = data[0]
      const salesRepName = newCust.sales_rep_name || body.salesRepName || "Sales Rep"
      await writeNotification(
        "general-manager",
        "New Customer Pending Approval",
        `Customer "${newCust.name}" registered by ${salesRepName}. Manager approval required.`,
        "approval",
        "customers",
        newCust.id
      )
      await writeNotification(
        "vice-manager",
        "New Customer Pending Approval",
        `Customer "${newCust.name}" registered by ${salesRepName}. Manager approval required.`,
        "approval",
        "customers",
        newCust.id
      )
    }

    if (table === "roasting_batches" && data?.[0]?.id) {
      roastingBatchMetaMap.set(data[0].id, {
        coffee: body.coffee || body.coffeeType || "Guji Grade 1 Natural",
        notes: body.notes || "",
      })
    }

    if (table === "orders" && data?.[0]) {
      const newOrd = data[0]
      if (body.items && body.items.length > 0) {
        const orderItems = body.items.map((item: any) => ({
          order_id: newOrd.id,
          coffee_product_id: item.coffeeProductId || item.coffeeType || "Unknown",
          quantity: item.quantity || 0,
          unit_price: item.unitPrice || 0,
          status: "pending-confirmation",
        }))
        await supabaseAdmin.from("order_items").insert(orderItems)
      }
      await writeNotification(
        "general-manager",
        "New Order Pending Confirmation",
        `Order ${newOrd.order_number || newOrd.orderNumber || 'ORD'} (${newOrd.is_urgent ? 'URGENT' : 'Normal'}) submitted for confirmation.`,
        newOrd.is_urgent ? "urgent" : "approval",
        "orders",
        newOrd.id
      )
      await writeNotification(
        "vice-manager",
        "New Order Pending Confirmation",
        `Order ${newOrd.order_number || newOrd.orderNumber || 'ORD'} (${newOrd.is_urgent ? 'URGENT' : 'Normal'}) submitted for confirmation.`,
        newOrd.is_urgent ? "urgent" : "approval",
        "orders",
        newOrd.id
      )
    }

    return camelizeKeys(data[0])
  }

  // GET Single
  if (method === "GET" && id) {
    const { data, error } = await supabaseAdmin.from(table).select("*").eq("id", id).single()
    if (error) return null
    return camelizeKeys(data)
  }

  // PUT / PATCH
  if ((method === "PUT" || method === "PATCH") && id) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
    if (error) throw error
    return camelizeKeys(data[0])
  }

  // DELETE
  if (method === "DELETE" && id) {
    const { error } = await supabaseAdmin.from(table).delete().eq("id", id)
    if (error) throw error
    return { success: true }
  }

  console.warn(`[Supabase API] Endpoint ${method} ${endpoint} falling back to default mock`)
  if (method === "GET" && !id) return []
  return {}
}

async function getManagerDashboard() {
  const [{ data: ordersData }, { data: batchesData }, { data: customersData }] = await Promise.all([
    supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("roasting_batches").select("*").eq("status", "ROASTING"),
    supabaseAdmin.from("customers").select("*"),
  ])

  const ordersArr = ordersData || []
  const customersArr = customersData || []
  const batchesArr = batchesData || []

  const activeOrders = ordersArr.filter(
    (o: any) => !["CANCELLED", "DELIVERED", "COMPLETED"].includes(o.status)
  )

  const kpiCards = [
    {
      label: "Orders in Progress",
      value: activeOrders.length.toString(),
      sub: `${
        ordersArr.filter(
          (o: any) =>
            o.status === "PENDING_MANAGER_CONFIRMATION" || o.status === "pending-confirmation"
        ).length
      } awaiting confirmation`,
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      label: "Total Active Customers",
      value: `${customersArr.length} clients`,
      sub: `Active customers in database`,
      icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 010 7.75",
    },
    {
      label: "Active Roasting",
      value: `${batchesArr.length} batches`,
      sub: "In progress",
      icon: "M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0",
    },
  ]

  const statusCounts = ordersArr.reduce((acc: any, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  const orderStatuses = Object.entries(statusCounts).map(([status, count]) => ({
    label: String(status).replace(/_/g, " "),
    count,
    color:
      String(status).includes("PENDING") || String(status).includes("pending")
        ? "#F59E0B"
        : String(status).includes("CANCEL")
        ? "#EF4444"
        : "#10B981",
  }))

  const attentionCards = []

  // Pending customers requiring approval
  const pendingCustomers = customersArr.filter((c: any) =>
    !c.status || c.status === "pending" || c.status === "pending_approval" || c.status === "pending-approval"
  )
  for (const c of pendingCustomers) {
    attentionCards.push({
      id: `cus-${c.id}`,
      severity: "info",
      category: "Pending Customer Review",
      title: `Customer Registration: ${c.name}`,
      description: `Ref: ${c.business_number || "CUS"} | Type: ${c.type || "cafe"} | Sales Rep: ${c.sales_rep_name || "Unassigned"}`,
      primaryAction: "Review",
      module: "customers",
      age: "Pending Review",
    })
  }

  // Payroll runs pending approval
  try {
    const { data: payrollData } = await supabaseAdmin
      .from("payroll_runs")
      .select("id, period_start, status, total_amount")
      .eq("status", "pending-approval")
      .order("created_at", { ascending: false })
      .limit(1)
    if (payrollData && payrollData.length > 0) {
      const pay = payrollData[0]
      const period = pay.period_start ? new Date(pay.period_start).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Current"
      attentionCards.push({
        id: `payroll-${pay.id}`,
        severity: "warning",
        category: "Payroll Approval",
        title: `Monthly Payroll (${period}) Pending Approval`,
        description: `Total: ETB ${parseFloat(String(pay.total_amount || 0)).toLocaleString()}`,
        primaryAction: "Review Payroll",
        module: "payroll",
        age: "Needs Action",
      })
    }
  } catch { /* ignore */ }

  // Pending expense approvals
  try {
    const { data: expPending } = await supabaseAdmin
      .from("expenses")
      .select("id, description, amount, category, created_at")
      .in("status", ["pending-approval", "requested"])
      .order("created_at", { ascending: false })
      .limit(5)
    const pending = expPending || []
    if (pending.length > 0) {
      const total = pending.reduce((s: number, e: any) => s + (parseFloat(e.amount) || 0), 0)
      attentionCards.push({
        id: "expense-approvals",
        severity: "warning",
        category: "Expense Approvals",
        title: `${pending.length} Expense Request${pending.length > 1 ? "s" : ""} Awaiting Approval`,
        description: `Total: ETB ${total.toLocaleString()} | Latest: ${pending[0].description || pending[0].category || "Expense"}`,
        primaryAction: "Review Expenses",
        module: "expenses",
        age: "Pending",
      })
    }
  } catch { /* ignore */ }

  // Overdue payments
  try {
    const now = new Date().toISOString()
    const { data: allOrders } = await supabaseAdmin.from("orders").select("id, total_amount, payment_deadline_at").lt("payment_deadline_at", now)
    const { data: allPays } = await supabaseAdmin.from("payments").select("order_id, amount")
    if (allOrders && allOrders.length > 0) {
      const payMap: Record<string, number> = {}
      for (const p of (allPays || [])) { payMap[p.order_id] = (payMap[p.order_id] || 0) + (parseFloat(p.amount) || 0) }
      const overdue = allOrders.filter((o: any) => (parseFloat(o.total_amount || 0) - (payMap[o.id] || 0)) > 0)
      if (overdue.length > 0) {
        const total = overdue.reduce((s: number, o: any) => s + Math.max(0, parseFloat(o.total_amount || 0) - (payMap[o.id] || 0)), 0)
        attentionCards.push({
          id: "overdue-payments",
          severity: "critical",
          category: "Overdue Payments",
          title: `${overdue.length} Payment${overdue.length > 1 ? "s" : ""} Overdue`,
          description: `Total outstanding: ETB ${total.toLocaleString()}. Immediate follow-up required.`,
          primaryAction: "View Payments",
          module: "payments",
          age: "Overdue",
        })
      }
    }
  } catch { /* ignore */ }

  // Recent activity feed (last 10 actions)
  let activityFeed: any[] = []
  try {
    const [{ data: recentOrders }, { data: recentPays }, { data: recentExps }] = await Promise.all([
      supabaseAdmin.from("orders").select("id, orderNumber, status, created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("payments").select("id, amount, created_at, order_id").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("expenses").select("id, description, amount, status, created_at").order("created_at", { ascending: false }).limit(5),
    ])
    const feedItems = [
      ...(recentOrders || []).map((o: any) => ({ type: "order", label: `Order ${o.orderNumber || o.id.slice(0, 6).toUpperCase()} — ${o.status}`, time: o.created_at, amount: null })),
      ...(recentPays || []).map((p: any) => ({ type: "payment", label: `Payment received — ETB ${parseFloat(p.amount || 0).toLocaleString()}`, time: p.created_at, amount: p.amount })),
      ...(recentExps || []).map((e: any) => ({ type: "expense", label: `Expense: ${e.description || ""} — ${e.status}`, time: e.created_at, amount: e.amount })),
    ].sort((a, b) => (b.time > a.time ? 1 : -1)).slice(0, 10)
    activityFeed = feedItems
  } catch { /* ignore */ }

  return {
    kpiCards,
    attentionCards,
    orderStatuses,
    financeRows: [],
    activityFeed,
  }
}

function camelizeKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v))
  } else if (typeof obj === "object" && obj && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      result[camelKey] = camelizeKeys(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

/**
 * Write a notification to the Supabase notifications table.
 * All cross-module events (approvals, rejections, order state changes) should use this.
 *
 * IMPORTANT: `recipientUserId` may be either:
 *   - A role string (e.g. "general-manager") — will be resolved to the demo user ID automatically
 *   - A real user ID (e.g. "USR-003" or a Supabase UUID)
 * This ensures sidebar badge queries (which filter by user ID) always find matching records.
 */
// Maps role strings → known demo user IDs (matches INITIAL_USERS in src/lib/rbac.ts)
const ROLE_TO_USER_ID: Record<string, string> = {
  "general-manager":  "USR-001",
  "vice-manager":     "USR-002",
  "sales-rep":        "USR-003",
  "inventory-manager": "USR-004",
  "head-roaster":     "USR-005",
  "roaster":          "USR-005",
  "accountant":       "USR-006",
  "packaging-staff":  "USR-004",
  "delivery-staff":   "USR-008",
}

async function writeNotification(
  recipientUserId: string,
  title: string,
  message: string,
  type: "urgent" | "approval" | "warning" | "info" = "info",
  entityType: string = "",
  entityId: string = "",
): Promise<void> {
  // Resolve role string to a concrete user ID so badge queries (which filter by user ID) always match.
  // If recipientUserId is already a user ID (not a known role string), use it as-is.
  const resolvedId = ROLE_TO_USER_ID[recipientUserId] ?? recipientUserId

  // Build the set of recipients: always include the resolved ID.
  // If different from the original (i.e. a role was passed), ALSO write with the role string
  // so the Notifications page (.or() query) can still find it for users whose real UUID differs.
  const recipients: string[] = resolvedId !== recipientUserId
    ? [resolvedId, recipientUserId]
    : [resolvedId]

  for (const recipient of recipients) {
    try {
      await supabaseAdmin.from("notifications").insert([{
        recipient_user_id: recipient,
        title,
        message,
        reason: "",
        type,
        severity: type === "urgent" ? "critical" : type === "warning" ? "warning" : "info",
        related_entity_type: entityType,
        related_entity_id: entityId,
        is_read: false,
        status: "unread",
        created_at: new Date().toISOString(),
      }])
    } catch (err) {
      // Notifications are best-effort; never crash the main action
      console.warn("[writeNotification] failed for recipient", recipient, ":", err)
    }
  }
}
