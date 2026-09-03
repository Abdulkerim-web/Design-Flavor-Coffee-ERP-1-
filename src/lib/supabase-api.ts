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
  if (path === "/auth/login" && method === "POST") {
    return { user: { role: "general-manager", email: body?.username || "" }, token: "mock" }
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
          action_code: body.actionCode,
          action_type: body.actionType,
          module: body.module,
          record_id: body.recordId,
          user_name: body.user,
          user_role: body.role,
          ip_address: body.ip,
          device: body.device,
          diff: body.diff || [],
          created_at: new Date().toISOString(),
        }])
      } catch { /* ignore if table doesn't exist */ }
      return { success: true }
    }
  }

  // ── IN-MEMORY INTERCEPTORS FOR FINANCE & EXPENSES ──
  if (path.startsWith("/finance/expenses")) {
    if (method === "GET") {
      if (path === "/finance/expenses") {
        const { data, error } = await supabaseAdmin.from("expenses").select("*").order("created_at", { ascending: false })
        if (error || !data) return []
        return data.map((e: any) => ({
          id: e.id,
          ref: `EXP-${String(e.id).slice(0, 6).toUpperCase()}`,
          category: e.category,
          description: e.description,
          amount: `ETB ${parseFloat(e.amount || 0).toLocaleString()}`,
          date: e.created_at ? new Date(e.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          requestedBy: e.requested_by_user_id || "Admin",
          status: e.status || "pending-approval",
          hasDocument: false,
          timeline: [],
        }))
      }
      if (path === "/finance/expenses/summary") {
        const { data } = await supabaseAdmin.from("expenses").select("*")
        const list = data || []
        const pendingCount = list.filter((e: any) => e.status === "pending-approval" || e.status === "requested").length
        const approvedCount = list.filter((e: any) => e.status === "approved").length
        const total = list.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)
        return {
          pendingApproval: pendingCount,
          toPay: approvedCount,
          recentTotal: `ETB ${total.toLocaleString()}`,
        }
      }
      if (path.includes("/approve")) {
        const id = parts[2]
        await supabaseAdmin.from("expenses").update({ status: "approved" }).eq("id", id)
        return { success: true }
      }
      if (path.includes("/reject")) {
        const id = parts[2]
        await supabaseAdmin.from("expenses").update({ status: "rejected" }).eq("id", id)
        return { success: true }
      }
      if (path.includes("/pay")) {
        const id = parts[2]
        await supabaseAdmin.from("expenses").update({ status: "paid" }).eq("id", id)
        return { success: true }
      }
      if (parts.length === 3) {
        const { data } = await supabaseAdmin.from("expenses").select("*").eq("id", parts[2]).single()
        if (!data) return null
        return {
          id: data.id,
          ref: `EXP-${String(data.id).slice(0, 6).toUpperCase()}`,
          category: data.category,
          description: data.description,
          amount: `ETB ${parseFloat(data.amount || 0).toLocaleString()}`,
          date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
          requestedBy: data.requested_by_user_id || "Admin",
          status: data.status || "pending-approval",
          hasDocument: false,
          timeline: [],
        }
      }
    }
    if (method === "POST" && path === "/finance/expenses") {
      const numAmount = parseFloat(String(body.amount || "0").replace(/[^0-9.]/g, "")) || 0
      const { data, error } = await supabaseAdmin
        .from("expenses")
        .insert([
          {
            category: body.category || "General",
            description: body.description || "",
            amount: numAmount,
            status: "pending-approval",
            requested_by_user_id: "USR-001",
          },
        ])
        .select()
      if (error || !data?.[0]) throw error || new Error("Failed to create expense")
      const e = data[0]
      return {
        id: e.id,
        ref: `EXP-${String(e.id).slice(0, 6).toUpperCase()}`,
        category: e.category,
        description: e.description,
        amount: `ETB ${numAmount.toLocaleString()}`,
        date: e.created_at ? new Date(e.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        requestedBy: "Admin",
        status: e.status || "pending-approval",
        hasDocument: false,
        timeline: [],
      }
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
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name, role")
        .in("role", ["sales-rep", "sales_rep", "SALES_REP"])
        .order("full_name")
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Sales Rep",
        }))
      }
    } catch { /* fall through */ }
    // Fallback: return all non-admin users if role column not available
    try {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, first_name, last_name, display_name")
        .order("full_name")
        .limit(50)
      if (data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.display_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "User",
        }))
      }
    } catch { /* ignore */ }
    return []
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
            // Fetch employees for this run
            const { data: employees } = await supabaseAdmin
              .from("payroll_employees")
              .select("*")
              .eq("run_id", run.id)
            return {
              id: run.id,
              period: run.period || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
              status: run.status || "draft",
              employeeCount: run.employee_count || 0,
              totalAmount: run.total_amount || "ETB 0",
              pendingReviewCount: run.pending_review_count || 0,
              changesCount: run.changes_count || 0,
              employees: (employees || []).map((e: any) => ({
                id: e.id,
                name: e.name,
                role: e.role || e.position,
                baseSalary: e.base_salary || "ETB 0",
                allowances: e.allowances || "ETB 0",
                deductions: e.deductions || "ETB 0",
                netPay: e.net_pay || "ETB 0",
                bankAccount: e.bank_account || "—",
                reviewStatus: e.review_status || "ok",
              })),
              timeline: run.timeline || [],
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
      } catch {
        /* ignore fallback */
      }
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
      } catch {
        /* ignore fallback */
      }
      return { success: true }
    }
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
    // Fetch real bank accounts from Supabase
    try {
      const { data } = await supabaseAdmin.from("bank_accounts").select("*").order("created_at")
      if (data && data.length > 0) {
        return data.map((acc: any) => ({
          id: acc.id,
          bankName: acc.bank_name || acc.name || "Bank",
          accountName: acc.account_name || acc.name || "Account",
          maskedAccountNumber: acc.masked_account_number || acc.account_number || "****0000",
          rawAccountRef: acc.account_number || acc.id,
          calculatedBalance: acc.balance ? `ETB ${parseFloat(acc.balance).toLocaleString()}` : "ETB 0",
          lastTransactionDate: acc.updated_at ? new Date(acc.updated_at).toLocaleDateString() : "—",
          lastTransactionDesc: "—",
          reconciliationStatus: "pending",
          reconciliationPeriod: "—",
          openingBalance: acc.opening_balance ? `ETB ${parseFloat(acc.opening_balance).toLocaleString()}` : "ETB 0",
          transactionCount: 0,
          // For PayModal dropdown compatibility
          name: acc.account_name || acc.bank_name || "Account",
          label: `${acc.bank_name || "Bank"} — ${acc.masked_account_number || acc.account_number || "****0000"}`,
        }))
      }
    } catch { /* fall through to empty */ }
    return []
  }

  // ── Dashboards & Summaries ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") return { kpiCards: [], attentionCards: [], orderStatuses: [] }

  if ((path === "/dashboard/finance" || path === "/finance/dashboard") && method === "GET") {
    const [{ data: expData }, { data: payData }] = await Promise.all([
      supabaseAdmin.from("expenses").select("*"),
      supabaseAdmin.from("payments").select("*")
    ])
    const expList = expData || []
    const payList = payData || []

    const expensesTotal = expList.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0)
    const paymentsTotal = payList.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
    const pendingCount = expList.filter((e: any) => e.status === "pending-approval" || e.status === "requested").length

    return {
      totalCustomerPayments: "ETB " + paymentsTotal.toLocaleString(),
      outstandingBalances: "ETB 0",
      overdueCount: 0,
      thisMonthExpenses: "ETB " + expensesTotal.toLocaleString(),
      pendingExpenseApprovals: "ETB 0",
      pendingExpenseCount: pendingCount,
      currentPayrollTotal: "ETB 0",
      payrollPeriod: "Current",
      payrollStatus: "draft",
      totalBankBalance: "ETB " + paymentsTotal.toLocaleString(),
      alerts: [],
    }
  }

  if (path === "/dashboard/inventory" && method === "GET") return { kpiCards: [], attentionCards: [] }
  if (path === "/inventory/stats" && method === "GET")
    return {
      green: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 },
      roasted: { onHand: "0 kg", reserved: "0 kg", available: "0 kg", status: "healthy", lotCount: 0 },
      packaging: { onHand: "0", reserved: "0", available: "0", status: "healthy", skuCount: 0 },
      attentionCount: 0,
    }
  if (path === "/inventory/attention" && method === "GET") return []
  if (path === "/finance/banking/summary" && method === "GET")
    return { totalBalance: "ETB 150000", unassignedDeposits: "ETB 0", pendingReconciliations: 0, alerts: [] }
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
      pending: dl.filter((d: any) => d.status === "READY_FOR_ASSIGNMENT").length,
      inTransit: dl.filter((d: any) => d.status === "OUT_FOR_DELIVERY").length,
      completedToday: dl.filter((d: any) => d.status === "FULLY_DELIVERED").length,
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
    const id = parts[1]
    await supabaseAdmin.from("orders").update({ status: "roasting" }).eq("id", id)
    return { success: true }
  }
  if (path.startsWith("/orders/") && path.endsWith("/reject") && method === "POST") {
    const id = parts[1]
    await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", id)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/start") && method === "POST") {
    const id = parts[1]
    await supabaseAdmin.from("roasting_batches").update({ status: "ROASTING" }).eq("id", id)
    return { success: true }
  }
  if (path.startsWith("/roasting/") && path.endsWith("/complete") && method === "POST") {
    const id = parts[1]
    await supabaseAdmin
      .from("roasting_batches")
      .update({ status: "COMPLETED", actual_roasted_quantity: body.actualYield })
      .eq("id", id)
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
        .select("id, batch_number, green_input_kg, roasted_output_kg, created_at, roast_profile, coffee_type, status")
        .in("status", ["VERIFIED", "COMPLETED", "completed", "ROASTED"])
        .order("created_at", { ascending: false })
        .limit(30)
      if (data && data.length > 0) {
        return data.map((b: any) => ({
          ...b,
          yield_pct: b.green_input_kg > 0
            ? +((b.roasted_output_kg / b.green_input_kg) * 100).toFixed(1)
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
        if (!b.coffee) b.coffee = "Guji Grade 1 Natural"
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
        contact_person: body.contactName || body.contactPerson,
        phone: body.contactPhone || body.phone,
        email: body.contactEmail || body.email,
        notes: body.notes,
        business_number: `CUS-${Math.floor(Math.random() * 10000)}`,
        active: true,
        status: body.status || "pending",
        sales_rep_id: body.salesRepId || "",
        sales_rep_name: body.salesRepName || "",
        sales_rep_employee_id: body.salesRepEmployeeId || "",
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

    if (table === "roasting_batches" && data?.[0]?.id) {
      roastingBatchMetaMap.set(data[0].id, {
        coffee: body.coffee || body.coffeeType || "Guji Grade 1 Natural",
        notes: body.notes || "",
      })
    }

    if (table === "orders" && body.items && body.items.length > 0 && data?.[0]) {
      const orderId = data[0].id
      const orderItems = body.items.map((item: any) => ({
        order_id: orderId,
        coffee_product_id: item.coffeeProductId || item.coffeeType || "Unknown",
        quantity: item.quantity || 0,
        unit_price: item.unitPrice || 0,
        status: "pending-confirmation",
      }))
      await supabaseAdmin.from("order_items").insert(orderItems)
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
  // Check payroll runs pending approval from Supabase
  try {
    const { data: payrollData } = await supabaseAdmin
      .from("payroll_runs")
      .select("id, period, status, total_amount, employee_count")
      .eq("status", "pending-approval")
      .order("created_at", { ascending: false })
      .limit(1)
    if (payrollData && payrollData.length > 0) {
      const pay = payrollData[0]
      attentionCards.push({
        id: `payroll-${pay.id}`,
        severity: "warning",
        category: "Payroll Approval",
        title: `Monthly Payroll Run (${pay.period || "Current"}) Pending Approval`,
        description: `Total Net Pay: ${pay.total_amount || "ETB 0"} | ${pay.employee_count || 0} Employees`,
        primaryAction: "Review Payroll",
        module: "payroll",
        age: "Needs Action",
      })
    }
  } catch { /* ignore if table doesn't exist */ }

  // Pending customers from DB only (no localStorage on server)
  const pendingCustomers = customersArr.filter((c: any) =>
    !c.status || c.status === "pending" || c.status === "pending_approval" || c.status === "pending-approval"
  )
  for (const c of pendingCustomers) {
    attentionCards.push({
      id: `cus-${c.id}`,
      severity: "info",
      category: "Pending Customer Review",
      title: `Customer Registration Request: ${c.name}`,
      description: `Ref: ${c.business_number || "CUS"} | Type: ${c.type || "cafe"} | Sales Rep: ${c.sales_rep_name || ""}`,
      primaryAction: "View Customer",
      module: "customers",
      age: "Pending Review",
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
