const fs = require('fs');
const file = 'src/lib/supabase-api.ts';
let code = fs.readFileSync(file, 'utf8');

const mocks = `
// ── IN-MEMORY MOCKS (Phase 3) ──
let mockExpenses = [
  { id: "exp-1", ref: "EXP-1001", category: "Supplies", description: "Office supplies", amount: "ETB 2,500", date: new Date().toISOString(), requestedBy: "Admin", status: "approved", hasDocument: false, timeline: [] }
];
let mockPayments = [];
let mockPayroll = [];
let mockBanking = [];
let mockExpenseCategories = [
  { id: "cat-1", name: "Utility", code: "UTL", color: "#6366F1", active: true },
  { id: "cat-2", name: "Supplies", code: "SUP", color: "#10B981", active: true },
];
let mockBankAccounts = [
  { id: "acc-1", name: "Main Operating", type: "checking", number: "****1234", currency: "ETB", status: "active", balance: "150000" }
];

`;

if (!code.includes('// ── IN-MEMORY MOCKS (Phase 3) ──')) {
  code = mocks + code;
}

const financeInterceptors = `
  // ── IN-MEMORY INTERCEPTORS FOR FINANCE ──
  if (path.startsWith("/finance/expenses")) {
    if (method === "GET") {
      if (path === "/finance/expenses") return mockExpenses;
      if (path === "/finance/expenses/summary") return { pendingApproval: mockExpenses.filter(e => e.status === "pending-approval").length, toPay: mockExpenses.filter(e => e.status === "approved").length, recentTotal: "ETB 0" };
      if (path.includes("/approve")) {
        const id = parts[2];
        const idx = mockExpenses.findIndex(e => e.id === id);
        if (idx !== -1) mockExpenses[idx].status = "approved";
        return mockExpenses[idx];
      }
      if (path.includes("/reject")) {
        const id = parts[2];
        const idx = mockExpenses.findIndex(e => e.id === id);
        if (idx !== -1) mockExpenses[idx].status = "rejected";
        return mockExpenses[idx];
      }
      if (path.includes("/pay")) {
        const id = parts[2];
        const idx = mockExpenses.findIndex(e => e.id === id);
        if (idx !== -1) mockExpenses[idx].status = "paid";
        return mockExpenses[idx];
      }
      // Single expense
      if (parts.length === 3) return mockExpenses.find(e => e.id === parts[2]);
    }
    if (method === "POST" && path === "/finance/expenses") {
      const newExp = {
        id: "exp-" + Math.floor(Math.random() * 10000),
        ref: "EXP-" + Math.floor(Math.random() * 10000),
        category: body.category || "Unknown",
        description: body.description || "",
        amount: body.amount || "0",
        date: new Date().toISOString(),
        requestedBy: "Admin",
        status: "pending-approval",
        hasDocument: false,
        timeline: []
      };
      mockExpenses = [newExp, ...mockExpenses];
      return newExp;
    }
  }
  
  if (path.startsWith("/finance/expense-categories")) {
    if (method === "GET") return mockExpenseCategories;
    if (method === "POST") {
      const newCat = { id: "cat-" + Math.floor(Math.random() * 10000), ...body, active: true };
      mockExpenseCategories.push(newCat);
      return newCat;
    }
  }
`;

if (!code.includes('// ── IN-MEMORY INTERCEPTORS FOR FINANCE ──')) {
  code = code.replace('// ── Dashboards & Fallbacks ──', financeInterceptors + '\n  // ── Dashboards & Fallbacks ──');
}

fs.writeFileSync(file, code);
