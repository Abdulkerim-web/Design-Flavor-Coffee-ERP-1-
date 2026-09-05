import fs from 'fs'

const file = 'src/lib/supabase-api.ts'
let content = fs.readFileSync(file, 'utf-8')

const financeBlock = `
  // ── FINANCE DASHBOARD & BANKING ──
  if (path === "/finance/dashboard" && method === "GET") {
    // Basic dashboard
    return {
      totalRevenue: "ETB 0",
      totalExpenses: "ETB 0",
      netProfit: "ETB 0",
      cashBalance: "ETB 0",
      pendingReceivables: "ETB 0",
      pendingPayables: "ETB 0"
    }
  }

  if (path.startsWith("/finance/accounts")) {
    if (method === "GET" && !id) {
      const { data } = await supabaseAdmin.from("company_bank_accounts").select("*")
      return camelizeKeys(data || [])
    }
  }

  if (path === "/finance/banking/summary" && method === "GET") {
    const { data: accounts } = await supabaseAdmin.from("company_bank_accounts").select("*")
    const total = (accounts || []).reduce((s, a) => s + parseFloat(a.opening_balance || 0), 0)
    return {
      totalBalance: \`ETB \${total.toLocaleString()}\`,
      accounts: camelizeKeys(accounts || [])
    }
  }

  if (path === "/finance/payments") {
    if (method === "GET") {
      const { data } = await supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false })
      return camelizeKeys(data || [])
    }
    if (method === "POST") {
      const { data } = await supabaseAdmin.from("payments").insert([{
        order_id: body.orderId || body.referenceId || "N/A",
        amount: parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")),
        payment_method: body.method || "bank_transfer",
        bank_reference_number: body.reference || "",
        idempotency_key: \`PAY-\${Date.now()}\`,
        registered_by_user_id: "System"
      }]).select()
      return camelizeKeys(data?.[0] || {})
    }
  }

  if (path.startsWith("/finance/transactions")) {
    if (method === "POST") {
      const { data } = await supabaseAdmin.from("bank_transactions").insert([{
        bank_account_id: body.accountId || "unknown",
        amount: parseFloat(String(body.amount || 0).replace(/[^0-9.]/g, "")),
        sourceType: body.type || "OTHER",
        source_id: "Manual",
        reference_note: body.description || ""
      }]).select()
      return camelizeKeys(data?.[0] || {})
    }
  }
`

if (!content.includes("/finance/banking/summary")) {
  content = content.replace('  // ── FINANCE EXPENSES ──', financeBlock + '\n  // ── FINANCE EXPENSES ──')
  fs.writeFileSync(file, content)
  console.log("Finance block inserted")
} else {
  console.log("Already inserted")
}
