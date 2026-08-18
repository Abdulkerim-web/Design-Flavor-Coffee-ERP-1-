import React from "react"
import { useAuth } from "../contexts/AuthContext"
import ManagerDashboard from "./ManagerDashboard"
import FinanceDashboard from "./FinanceDashboard"
import SalesDashboard from "./SalesDashboard"
import OperationsDashboard from "./OperationsDashboard"

export default function Dashboard({
  onNavigate,
}: {
  onNavigate?: (id: string, params?: any) => void
}) {
  const { currentUser } = useAuth()
  const role = currentUser?.role ?? "general-manager"

  if (role === "general-manager" || role === "vice-manager") {
    return <ManagerDashboard onNavigate={onNavigate} />
  }

  if (role === "accountant" || role === "finance-ledger") {
    return <FinanceDashboard onNavigate={onNavigate} />
  }

  if (role === "sales-rep") {
    return <SalesDashboard onNavigate={onNavigate} />
  }

  // Fallback for inventory-manager, head-roaster, delivery-staff
  return <OperationsDashboard onNavigate={onNavigate} />
}
