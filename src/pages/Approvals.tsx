import { useState, useEffect } from "react"
import { listOrders, confirmOrder, rejectOrder } from "../services/orders"
import { listExpensesFull, approveExpense, rejectExpense, getPayrollRun, approvePayrollRun } from "../services/finance-ops"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import useSupabaseRealtime from "../hooks/useSupabaseRealtime"

type ApprovalItem = {
  id: string
  ref: string
  type: string
  desc: string
  originalData: any
}

export default function Approvals() {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const fetchAll = async () => {
      const newItems: ApprovalItem[] = []

      try {
        const [ordersRes, expensesRes] = await Promise.all([
          listOrders({ status: "pending-confirmation" }),
          listExpensesFull({ status: "pending-approval" }),
        ])

        if (ordersRes.state === "ok" && ordersRes.data) {
          ordersRes.data.items.forEach((o: any) => {
            newItems.push({
              id: o.id,
              ref: o.ref,
              type: "Order Approval",
              desc: `${o.customer?.name ?? "Customer"} — ${o.total}`,
              originalData: o,
            })
          })
        }

        if (expensesRes.state === "ok" && expensesRes.data) {
          expensesRes.data.forEach((e: any) => {
            newItems.push({
              id: e.id,
              ref: e.ref,
              type: "Expense Approval",
              desc: `${e.description} — ${e.amount}`,
              originalData: e,
            })
          })
        }
      } catch {}

      // Also check payroll runs pending approval
      try {
        const payrollRes = await getPayrollRun()
        const pay = payrollRes.data
        if (pay && pay.status === "pending-approval") {
          newItems.push({
            id: pay.id,
            ref: `PAYROLL-${pay.period || "Current"}`,
            type: "Payroll Approval",
            desc: `Monthly Payroll Run (${pay.period || "Current"}) — ${pay.totalAmount || "ETB 0"} (${pay.employeeCount || 0} Employees)`,
            originalData: pay,
          })
        }
      } catch {}

      if (mounted) {
        setItems(newItems)
        setLoading(false)
      }
    }

    fetchAll()
    return () => { mounted = false }
  }, [refreshCount])

  // Realtime updates: refetch when relevant DB tables change
  useSupabaseRealtime("orders",   () => setRefreshCount((c) => c + 1))
  useSupabaseRealtime("expenses", () => setRefreshCount((c) => c + 1))

  const handleApprove = async (item: ApprovalItem) => {
    setProcessing(item.id)
    try {
      if (item.type === "Order Approval") {
        await confirmOrder(item.id, currentUser?.id || "MANAGER-1")
        toast.success("Order approved", { description: `${item.ref} has been confirmed.` })
      } else if (item.type === "Payroll Approval") {
        await approvePayrollRun(item.id, currentUser?.id || "MANAGER-1")
        toast.success("Payroll approved", { description: `${item.ref} has been approved.` })
      } else {
        await approveExpense(item.id, currentUser?.id || "MANAGER-1")
        toast.success("Expense approved", { description: `${item.ref} has been approved.` })
      }
    } catch (err: any) {
      toast.error("Approval failed", { description: err?.message || "Please try again." })
    }
    setProcessing(null)
    setRefreshCount((c) => c + 1)
  }

  const handleReject = async (item: ApprovalItem) => {
    setProcessing(item.id)
    try {
      if (item.type === "Order Approval") {
        await rejectOrder(item.id, "Rejected by manager", currentUser?.id || "MANAGER-1")
        toast.error("Order rejected", { description: `${item.ref} was rejected.` })
      } else {
        await rejectExpense(item.id, "Rejected by manager")
        toast.error("Expense rejected", { description: `${item.ref} was rejected.` })
      }
    } catch (err: any) {
      toast.error("Rejection failed", { description: err?.message || "Please try again." })
    }
    setProcessing(null)
    setRefreshCount((c) => c + 1)
  }

  return (
    <div style={{ padding: 32, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontFamily: "DM Mono", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
            Management
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
            Approvals
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
            Review and action pending approvals — orders, expenses, and operational requests.
          </p>
        </div>

        {/* Pending badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, marginBottom: 20, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, fontFamily: "DM Mono", color: "#B45309" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
          {items.length} items awaiting your approval
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading pending approvals…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", background: "var(--surface-01)", borderRadius: 9, border: "1px dashed var(--border-neutral)", color: "var(--text-muted)", fontSize: 13.5 }}>
            No pending approvals.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{ background: "var(--surface-01)", border: "1px solid var(--border-neutral)", borderRadius: 9, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, opacity: processing === item.id ? 0.5 : 1, pointerEvents: processing === item.id ? "none" : "auto" }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, fontFamily: "DM Mono", color: "#B45309", background: "#FFFBEB", border: "1px solid #FDE68A", padding: "1px 7px", borderRadius: 999 }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: 11.5, fontFamily: "DM Mono", color: "var(--text-muted)" }}>
                      {item.ref}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--text-primary)", fontWeight: 500 }}>
                    {item.desc}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    id={`approve-reject-${item.id}`}
                    onClick={() => handleReject(item)}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-neutral)", background: "var(--bg-primary)", color: "var(--text-secondary)", fontSize: 12.5, fontFamily: "Inter", cursor: "pointer" }}
                  >
                    Reject
                  </button>
                  <button
                    id={`approve-confirm-${item.id}`}
                    onClick={() => handleApprove(item)}
                    style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#2B4D3A", color: "#FFFFFF", fontSize: 12.5, fontWeight: 600, fontFamily: "Inter", cursor: "pointer" }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
