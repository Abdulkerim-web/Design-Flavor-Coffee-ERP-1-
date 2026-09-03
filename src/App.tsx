import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import TopBar from "./components/TopBar"
import BottomNav from "./components/BottomNav"
import AlertsDrawer from "./components/AlertsDrawer"
import { useBreakpoint } from "./hooks/useBreakpoint"
import { ThemeProvider } from "./contexts/ThemeContext"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import { ConfirmProvider } from "./contexts/ConfirmContext"
import ToastContainer from "./components/Toast"
import CommandPalette from "./components/CommandPalette"
import Login from "./pages/Login"
import Welcome from "./pages/Welcome"
import Team from "./pages/Team"
import EmptyState from "./components/EmptyState"
import { canRead } from "./lib/rbac"
import Dashboard from "./pages/Dashboard"
import Inventory from "./pages/Inventory"
import Suppliers from "./pages/Suppliers"
import Quality from "./pages/Quality"
import Production from "./pages/Production"
import Verification from "./pages/Verification"
import Packaging from "./pages/Packaging"
import Orders from "./pages/Orders"
import Delivery from "./pages/Delivery"
import Finance from "./pages/Finance"
import Reports from "./pages/Reports"
import Users from "./pages/Users"
import EmployeeManagement from "./pages/EmployeeManagement"
import Audit from "./pages/Audit"
import Settings from "./pages/Settings"
import CustomerPortal from "./pages/CustomerPortal"
import Customers from "./pages/Customers"
import Payments from "./pages/Payments"
import Banking from "./pages/Banking"
import Expenses from "./pages/Expenses"
import Payroll from "./pages/Payroll"
import Approvals from "./pages/Approvals"
import Notifications from "./pages/Notifications"
import DesignSystem from "./pages/DesignSystem"
import QuickActionsPanel from "./components/QuickActionsPanel"

type ModuleId = "dashboard" | "inventory" | "suppliers" | "quality" | "production" | "verification" | "packaging" | "orders" | "delivery" | "finance" | "reports" | "users" | "employees" | "audit" | "settings" | "portal" | "customers" | "payments" | "banking" | "expenses" | "payroll" | "approvals" | "notifications" | "design-system"

const MODULES: Record<ModuleId, React.FC> = {
  dashboard: Dashboard,
  inventory: Inventory,
  suppliers: Suppliers,
  quality: Quality,
  production: Production,
  verification: Verification,
  packaging: Packaging,
  orders: Orders,
  delivery: Delivery,
  finance: Finance,
  reports: Reports,
  users: Users,
  employees: EmployeeManagement,
  audit: Audit,
  settings: Settings,
  portal: CustomerPortal,
  customers: Customers,
  payments: Payments,
  banking: Banking,
  expenses: Expenses,
  payroll: Payroll,
  approvals: Approvals,
  notifications: Notifications,
  "design-system": DesignSystem,
}

const QUICK_CREATE_OPTIONS = [
  { id: "order", label: "New Customer Order", icon: "", kbd: "N O" },
  {
    id: "receive",
    label: "Record Green Bean Receiving",
    icon: "",
    kbd: "N R",
  },
  { id: "qc", label: "Create QC Inspection Entry", icon: "🧪", kbd: "N Q" },
  { id: "batch", label: "Schedule Roasting Batch", icon: "", kbd: "N B" },
]

type UnauthPage = "welcome" | "login" | "team"

function AppInner() {
  const { currentUser, logout } = useAuth()
  const [unauthPage, setUnauthPage] = useState<UnauthPage>("welcome")
  const [active, setActive] = useState<ModuleId>("dashboard")
  const [routeParams, setRouteParams] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [qcOpen, setQcOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const { isMobile } = useBreakpoint()

  // Wipe legacy browser-cached demo data on startup to ensure a 100% clean zero data state
  useEffect(() => {
    try {
      const keys = [
        "erp_orders_records",
        "erp_customers_records",
        "erp_delivery_records",
        "erp_roasting_jobs",
        "erp_packing_jobs",
        "erp_payment_records",
        "erp_notifications_list",
        "erp_custom_reports",
        "erp_expenses_records",
      ]
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }, [])

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Close QC dropdown on outside click via Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQcOpen(false)
    }
    if (qcOpen) window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [qcOpen])

  // Auto-close sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Gate: unauthenticated users see Welcome → Login or Team — must come AFTER all hooks
  if (!currentUser) {
    if (unauthPage === "team")
      return <Team onBack={() => setUnauthPage("welcome")} />
    if (unauthPage === "login") return <Login />
    return (
      <Welcome
        onSignIn={() => setUnauthPage("login")}
        onTeam={() => setUnauthPage("team")}
      />
    )
  }

  const handleNavigate = (id: string, params?: any) => {
    setActive(id as ModuleId)
    setRouteParams(params || null)
    if (isMobile) setSidebarOpen(false)
  }

  const Module = MODULES[active]

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <Sidebar
        active={active}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentRole={currentUser.role}
        currentUser={currentUser}
        onLogout={() => setLogoutOpen(true)}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <TopBar
          activeModule={active}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenQuickCreate={() => setQcOpen((v) => !v)}
          onOpenSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onLogout={() => setLogoutOpen(true)}
        />

        {/* Quick Create dropdown (portal-style, absolute from top) */}
        {qcOpen && (
          <div
            onClick={() => setQcOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 300 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "fixed",
                top: 72,
                right: 120,
                width: 300,
                background: "var(--surface-01)",
                border: "1px solid var(--border-neutral)",
                borderRadius: 12,
                boxShadow:
                  "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)",
                overflow: "hidden",
                zIndex: 301,
                animation: "slideDown 0.18s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border-neutral)",
                  fontSize: 11,
                  fontFamily: "DM Mono",
                  color: "var(--text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Quick Create
              </div>
              {QUICK_CREATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setQcOpen(false)
                    if (opt.id === "order") setActive("orders")
                    if (opt.id === "receive") setActive("inventory")
                    if (opt.id === "qc") setActive("quality")
                    if (opt.id === "batch") setActive("production")
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "11px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                    borderBottom: "1px solid var(--surface-02)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <span style={{ fontSize: 16 }}>{opt.icon}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: "var(--text-primary)",
                      fontFamily: "Inter",
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.kbd && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: "DM Mono",
                        color: "var(--text-muted)",
                        background: "var(--surface-02)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: "1px solid var(--border-neutral)",
                      }}
                    >
                      {opt.kbd}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <ConnectionBanner />

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--bg-primary)",
            paddingBottom: isMobile ? 64 : 0,
          }}
        >
          <QuickActionsPanel onNavigate={handleNavigate} onOpenQuickCreate={() => setQcOpen(true)} />
          {/* Route guard: show access-denied state if role lacks read permission */}
          {canRead(currentUser.role, active) ? (
            <Module
              key={active}
              onNavigate={handleNavigate}
              routeParams={routeParams}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: 32,
              }}
            >
              <EmptyState
                icon="lock"
                title="Access restricted"
                description={`Your role (${currentUser.role.replace(/-/g, " ")}) does not have read access to this module. Contact your General Manager to request access.`}
              />
            </div>
          )}
        </main>
      </div>

      {isMobile && (
        <BottomNav
          active={active}
          onNavigate={handleNavigate}
          onOpenAlerts={() => setAlertsOpen(true)}
          alertCount={5}
        />
      )}

      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />

      {/* ── Logout confirmation modal ─────────────────── */}
      {logoutOpen && (
        <div
          onClick={() => setLogoutOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 600,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "logoutFadeIn 0.18s ease",
          }}
        >
          <style>{`
            @keyframes logoutFadeIn { from { opacity:0 } to { opacity:1 } }
            @keyframes logoutSlideUp { from { opacity:0; transform:translateY(12px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface-01)",
              border: "1px solid var(--border-neutral)",
              borderRadius: 14,
              boxShadow:
                "0 24px 48px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.1)",
              padding: "28px 28px 24px",
              maxWidth: 360,
              width: "100%",
              animation: "logoutSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                marginBottom: 18,
                background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #FECACA",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </div>

            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                marginBottom: 6,
              }}
            >
              Sign out?
            </div>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                margin: "0 0 22px",
              }}
            >
              Are you sure you want to sign out of Coffee ERP?
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setLogoutOpen(false)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "1.5px solid var(--border-neutral)",
                  background: "none",
                  fontSize: 13.5,
                  fontWeight: 500,
                  fontFamily: "Inter",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "#2B4D3A"
                  el.style.color = "#2B4D3A"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = "var(--border-neutral)"
                  el.style.color = "var(--text-secondary)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setLogoutOpen(false)
                  logout()
                  setUnauthPage("welcome")
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--sem-danger)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "Inter",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(220,38,38,0.25)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = "#B91C1C"
                  el.style.boxShadow = "0 4px 14px rgba(220,38,38,0.35)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = "var(--sem-danger)"
                  el.style.boxShadow = "0 3px 10px rgba(220,38,38,0.25)"
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(id) => {
          setActive(id as ModuleId)
          setSearchOpen(false)
        }}
      />
    </div>
  )
}

/* ── Connection lost banner ───────────────────────────────── */
function ConnectionBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const up = () => {
      setOnline(true)
      setDismissed(false)
    }
    const down = () => {
      setOnline(false)
      setDismissed(false)
    }
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  if (online || dismissed) return null

  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        zIndex: 500,
        background: "#FFF7ED",
        borderBottom: "1px solid #FED7AA",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        animation: "bannerSlide 0.25s ease",
      }}
    >
      <style>{`@keyframes bannerSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ flexShrink: 0 }}
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
      </svg>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: "#92400E",
          fontFamily: "Inter",
          lineHeight: 1.4,
        }}
      >
        <strong>Connection lost.</strong> Some information may be unavailable
        until your connection is restored.
      </span>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#B45309",
          fontSize: 18,
          lineHeight: 1,
          padding: "0 4px",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AppInner />
            <ToastContainer />
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
