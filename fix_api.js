const fs = require("fs")
let code = fs.readFileSync("src/lib/supabase-api.ts", "utf-8")

const newLogic = `
  // ── IN-MEMORY INTERCEPTORS FOR PAYMENTS, BANKING, PAYROLL ──
  if (path === "/payments/record" && method === "POST") {
    // Save to payments table
    await supabaseAdmin.from("payments").insert([{
      order_id: body.paymentId || "ORD-0",
      amount: parseFloat(body.amount) || 0,
      payment_method: "bank_transfer",
      bank_reference_number: body.transferRef,
      idempotency_key: "PAY-" + Math.floor(Math.random() * 100000),
      registered_by_user_id: "USR-001"
    }])
    return { success: true, ref: "PAY-" + Math.floor(Math.random() * 10000) }
  }

  if (path.startsWith("/finance/payroll")) {
    if (method === "GET") {
      if (path === "/finance/payroll") return mockPayroll
      return null
    }
    if (method === "POST") {
      // Mock payroll run creation or action
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
  
  if (path === "/finance/accounts" && method === "GET") return mockBankAccounts

  // ── Dashboards & Fallbacks ──
  if (path === "/dashboard/manager" && method === "GET") return await getManagerDashboard()
  if (path === "/dashboard/sales" && method === "GET") return { kpiCards: [], attentionCards: [], orderStatuses: [] }
  
  if ((path === "/dashboard/finance" || path === "/finance/dashboard") && method === "GET") {
    const expensesTotal = mockExpenses.reduce((sum, e) => sum + parseFloat(e.amount.replace(/[^0-9.]/g, '')), 0)
    const txTotal = mockBanking.reduce((sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.]/g, '')), 0)
    return { 
      totalCustomerPayments: "ETB " + txTotal, 
      outstandingBalances: "ETB 0", 
      overdueCount: 0, 
      thisMonthExpenses: "ETB " + expensesTotal, 
      pendingExpenseApprovals: "ETB 0", 
      pendingExpenseCount: mockExpenses.filter(e => e.status === "pending-approval").length, 
      currentPayrollTotal: "ETB 0", 
      payrollPeriod: "Current", 
      payrollStatus: "draft", 
      totalBankBalance: "ETB 150000", 
      alerts: [] 
    }
  }
`

code = code.replace(/\/\/ ── Dashboards & Fallbacks ──[\s\S]*?(?=\/\/ ── Custom Actions ──)/, newLogic)
fs.writeFileSync("src/lib/supabase-api.ts", code)
