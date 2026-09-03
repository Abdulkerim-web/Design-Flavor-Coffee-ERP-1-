/* ─────────────────────────────────────────────────────────────
   EMPLOYEE MANAGEMENT PAGE
   Full CRUD: create, view, edit, deactivate, change-password
   Connected to Supabase via /employees API endpoints
───────────────────────────────────────────────────────────── */
import { useState, useEffect, useCallback, type FC } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { apiRequest } from "../services/api"

/* ── Types ─────────────────────────────────────────────────── */
interface Employee {
  id: string
  fullName: string
  role: string
  email: string
  phone: string
  username: string
  department: string
  status: "active" | "inactive"
  createdAt: string
  createdBy?: string
  lastLogin?: string
}

interface EmployeeForm {
  fullName: string
  role: string
  email: string
  phone: string
  username: string
  department: string
  password: string
  confirmPassword: string
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

/* ── Available roles ────────────────────────────────────────── */
const AVAILABLE_ROLES = [
  { id: "general-manager",   label: "General Manager",         dept: "Executive"   },
  { id: "vice-manager",      label: "Vice Manager",            dept: "Executive"   },
  { id: "sales-rep",         label: "Sales Representative",    dept: "Sales"       },
  { id: "inventory-manager", label: "Inventory Manager",       dept: "Operations"  },
  { id: "head-roaster",      label: "Head Roaster",            dept: "Production"  },
  { id: "accountant",        label: "Accountant",              dept: "Finance"     },
  { id: "qc-inspector",      label: "QC Inspector",            dept: "Quality"     },
  { id: "delivery-staff",    label: "Driver / Delivery Staff", dept: "Logistics"   },
  { id: "packaging-staff",   label: "Packaging Staff",         dept: "Operations"  },
  { id: "warehouse-staff",   label: "Warehouse Staff",         dept: "Operations"  },
]

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "general-manager":   { bg: "#EFF6FF", color: "#1D4ED8" },
  "vice-manager":      { bg: "#F5F3FF", color: "#7C3AED" },
  "sales-rep":         { bg: "#ECFEFF", color: "#0E7490" },
  "inventory-manager": { bg: "#FFFBEB", color: "#B45309" },
  "head-roaster":      { bg: "#FFF7ED", color: "#C2410C" },
  "accountant":        { bg: "#FDF2F8", color: "#BE185D" },
  "qc-inspector":      { bg: "#F0FDF4", color: "#15803D" },
  "delivery-staff":    { bg: "#ECFDF5", color: "#065F46" },
  "packaging-staff":   { bg: "#FEF3C7", color: "#92400E" },
  "warehouse-staff":   { bg: "#F1F5F9", color: "#475569" },
}

/* ── Password strength ───────────────────────────────────────── */
function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8)          score++
  if (pw.length >= 12)         score++
  if (/[A-Z]/.test(pw))       score++
  if (/[0-9]/.test(pw))       score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: "Weak",   color: "#DC2626" }
  if (score <= 2) return { score, label: "Fair",   color: "#F59E0B" }
  if (score <= 3) return { score, label: "Good",   color: "#2563EB" }
  return              { score, label: "Strong", color: "#16A34A" }
}

/* ── Shared field wrapper ────────────────────────────────────── */
const Field: FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({
  label, required, error, children,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
      {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {error && <span style={{ fontSize: 11.5, color: "#DC2626", marginTop: 1 }}>{error}</span>}
  </div>
)

const Inp: FC<{
  value: string; onChange: (v: string) => void; type?: string
  placeholder?: string; error?: boolean; disabled?: boolean; autoComplete?: string
}> = ({ value, onChange, type = "text", placeholder, error, disabled, autoComplete }) => (
  <input
    type={type} value={value} onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder} disabled={disabled} autoComplete={autoComplete}
    style={{
      height: 38, padding: "0 12px", borderRadius: 8,
      border: `1.5px solid ${error ? "#FCA5A5" : "var(--border-neutral)"}`,
      background: disabled ? "var(--surface-02)" : "var(--surface-01)",
      color: "var(--text-primary)", fontSize: 13.5, fontFamily: "Inter",
      outline: "none", opacity: disabled ? 0.65 : 1, width: "100%", boxSizing: "border-box",
    }}
  />
)

const Sel: FC<{
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
  error?: boolean; disabled?: boolean
}> = ({ value, onChange, options, placeholder, error, disabled }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
    style={{
      height: 38, padding: "0 12px", borderRadius: 8,
      border: `1.5px solid ${error ? "#FCA5A5" : "var(--border-neutral)"}`,
      background: disabled ? "var(--surface-02)" : "var(--surface-01)",
      color: value ? "var(--text-primary)" : "var(--text-secondary)",
      fontSize: 13.5, fontFamily: "Inter", cursor: disabled ? "not-allowed" : "pointer", width: "100%",
    }}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

/* ── Avatar ───────────────────────────────────────────────── */
const EmpAvatar: FC<{ name: string; role: string; size?: number }> = ({ name, role, size = 38 }) => {
  const c = ROLE_COLORS[role] || { bg: "#F1F5F9", color: "#475569" }
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: c.bg, color: c.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 800, flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  )
}

const RoleBadge: FC<{ role: string }> = ({ role }) => {
  const def = AVAILABLE_ROLES.find((r) => r.id === role)
  const c = ROLE_COLORS[role] || { bg: "#F1F5F9", color: "#475569" }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.color, fontSize: 11.5, fontWeight: 600 }}>
      {def?.label || role}
    </span>
  )
}

const StatusBadge: FC<{ status: string }> = ({ status }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20,
    background: status === "active" ? "#F0FDF4" : "#F9FAFB",
    color: status === "active" ? "#15803D" : "#6B7280", fontSize: 11.5, fontWeight: 600,
  }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: status === "active" ? "#16A34A" : "#9CA3AF" }} />
    {status === "active" ? "Active" : "Inactive"}
  </span>
)

/* ─────────────────────────────────────────────────────────────
   CREATE / EDIT MODAL
───────────────────────────────────────────────────────────── */
const EmployeeModal: FC<{
  mode: "create" | "edit"; employee?: Employee
  onClose: () => void; onSaved: (emp: Employee) => void
  currentUser: { id?: string; name?: string } | null
}> = ({ mode, employee, onClose, onSaved, currentUser }) => {
  const toast = useToast()
  const [form, setForm] = useState<EmployeeForm>({
    fullName: employee?.fullName || "", role: employee?.role || "",
    email: employee?.email || "",      phone: employee?.phone || "",
    username: employee?.username || "", department: employee?.department || "",
    password: "", confirmPassword: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof EmployeeForm, string>>>({})
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const pwStrength = form.password ? passwordStrength(form.password) : null

  const setField = (k: keyof EmployeeForm, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === "role") {
        const def = AVAILABLE_ROLES.find((r) => r.id === v)
        if (def) next.department = def.dept
      }
      return next
    })
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validate = () => {
    const e: Partial<Record<keyof EmployeeForm, string>> = {}
    if (!form.fullName.trim())   e.fullName = "Full name is required."
    if (!form.role)               e.role = "Please select a role."
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email is required."
    if (!form.phone.trim())      e.phone = "Phone number is required."
    if (!form.username.trim() || form.username.length < 3) e.username = "Username must be at least 3 characters."
    if (mode === "create") {
      if (!form.password)                       e.password = "Password is required."
      else if (form.password.length < 8)        e.password = "Password must be at least 8 characters."
      else if (!/[A-Z]/.test(form.password))    e.password = "Must include at least one uppercase letter."
      else if (!/[0-9]/.test(form.password))    e.password = "Must include at least one number."
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirmedSave = async () => {
    setLoading(true); setShowConfirm(false)
    try {
      const payload = {
        fullName: form.fullName.trim(), role: form.role,
        email: form.email.trim(),       phone: form.phone.trim(),
        username: form.username.trim(), department: form.department,
        ...(mode === "create" && { password: form.password }),
        managerId: currentUser?.id || "", managerName: currentUser?.name || "Manager",
      }
      const res = mode === "create"
        ? await apiRequest<any>("/employees", "POST", payload)
        : await apiRequest<any>(`/employees/${employee!.id}`, "PUT", payload)

      onSaved({
        id: res?.id || employee?.id || `emp-${Date.now()}`,
        fullName: form.fullName.trim(), role: form.role,
        email: form.email.trim(),       phone: form.phone.trim(),
        username: form.username.trim(), department: form.department,
        status: employee?.status || "active",
        createdAt: employee?.createdAt || new Date().toISOString().slice(0, 10),
        createdBy: currentUser?.name || "Manager",
      })
      toast.success(mode === "create" ? "Employee created" : "Employee updated", {
        description: mode === "create"
          ? `${form.fullName} can now log in with their credentials.`
          : `${form.fullName}'s profile has been updated.`,
      })
      onClose()
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Please try again." })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "var(--surface-01)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "92vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", position: "relative" }}>

        {/* Confirm overlay */}
        {showConfirm && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.45)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ background: "var(--surface-01)", borderRadius: 14, padding: 28, maxWidth: 360, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {mode === "create" ? "Confirm Employee Creation" : "Save Changes?"}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                {mode === "create"
                  ? `Create account for ${form.fullName} as ${AVAILABLE_ROLES.find(r => r.id === form.role)?.label}? They will be able to log in immediately.`
                  : `Update ${form.fullName}'s profile?`}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setShowConfirm(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-02)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                <button onClick={handleConfirmedSave} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: "var(--color-accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  {mode === "create" ? "Create Employee" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal header */}
        <div style={{ padding: "22px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{mode === "create" ? "Create Employee" : "Edit Employee"}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
              {mode === "create" ? "Add a new employee and configure their access." : "Update profile and role details."}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text-secondary)", borderRadius: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>Personal Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Full Name" required error={errors.fullName}><Inp value={form.fullName} onChange={(v) => setField("fullName", v)} placeholder="First Last" error={!!errors.fullName} /></Field>
            <Field label="Phone" required error={errors.phone}><Inp value={form.phone} onChange={(v) => setField("phone", v)} placeholder="+251 9XX XXX XXX" error={!!errors.phone} /></Field>
          </div>
          <Field label="Email" required error={errors.email}><Inp value={form.email} onChange={(v) => setField("email", v)} type="email" placeholder="employee@company.et" error={!!errors.email} autoComplete="off" /></Field>

          <div style={{ borderTop: "1px solid var(--border-neutral)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 12 }}>Role & Access</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Role" required error={errors.role}>
                <Sel value={form.role} onChange={(v) => setField("role", v)} placeholder="Select role…" options={AVAILABLE_ROLES.map((r) => ({ value: r.id, label: r.label }))} error={!!errors.role} />
              </Field>
              <Field label="Department"><Inp value={form.department} onChange={(v) => setField("department", v)} placeholder="Auto-filled" disabled={!!form.role} /></Field>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-neutral)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 12 }}>Login Credentials</div>
            <Field label="Username" required error={errors.username}><Inp value={form.username} onChange={(v) => setField("username", v)} placeholder="unique_username" error={!!errors.username} autoComplete="off" /></Field>
            {mode === "create" && (
              <>
                <div style={{ height: 12 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Password" required error={errors.password}>
                    <div style={{ position: "relative" }}>
                      <Inp value={form.password} onChange={(v) => setField("password", v)} type={showPw ? "text" : "password"} placeholder="Min 8 chars, A-Z, 0-9" error={!!errors.password} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPw ? <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" /> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                        </svg>
                      </button>
                    </div>
                    {form.password && pwStrength && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
                          {[1,2,3,4].map((i) => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= pwStrength.score ? pwStrength.color : "var(--border-neutral)", transition: "background 0.2s" }} />)}
                        </div>
                        <span style={{ fontSize: 11, color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                      </div>
                    )}
                  </Field>
                  <Field label="Confirm Password" required error={errors.confirmPassword}>
                    <Inp value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)} type={showPw ? "text" : "password"} error={!!errors.confirmPassword} autoComplete="new-password" />
                  </Field>
                </div>
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                  <strong>Security Policy:</strong> Passwords must be ≥8 characters and include an uppercase letter and a number. Share credentials securely — not via chat.
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} disabled={loading} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-02)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>Cancel</button>
            <button onClick={() => { if (validate()) setShowConfirm(true) }} disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : "var(--color-accent)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              {loading && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 11-18 0" /></svg>}
              {mode === "create" ? "Create Employee" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PASSWORD CHANGE MODAL
───────────────────────────────────────────────────────────── */
const PasswordModal: FC<{
  employee: Employee; onClose: () => void
  currentUser: { id?: string } | null
}> = ({ employee, onClose, currentUser }) => {
  const toast = useToast()
  const [form, setForm] = useState<PasswordForm>({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [errors, setErrors] = useState<Partial<PasswordForm>>({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const isAdmin = !currentUser?.id || currentUser.id !== employee.id
  const pwStrength = form.newPassword ? passwordStrength(form.newPassword) : null

  const setField = (k: keyof PasswordForm, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }))
  }

  const validate = () => {
    const e: Partial<PasswordForm> = {}
    if (!isAdmin && !form.currentPassword) e.currentPassword = "Current password is required."
    if (!form.newPassword)                  e.newPassword = "New password is required."
    else if (form.newPassword.length < 8)   e.newPassword = "Must be at least 8 characters."
    else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = "Must include an uppercase letter."
    else if (!/[0-9]/.test(form.newPassword)) e.newPassword = "Must include a number."
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await apiRequest(`/employees/${employee.id}/password`, "POST", {
        ...(isAdmin ? { adminReset: true, managerId: currentUser?.id } : { currentPassword: form.currentPassword }),
        newPassword: form.newPassword,
      })
      toast.success("Password updated", { description: `${employee.fullName}'s password has been changed.` })
      onClose()
    } catch (err: any) {
      toast.error("Update failed", { description: err?.message || "Please try again." })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: "var(--surface-01)", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
        <div style={{ padding: "22px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Change Password</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
              {isAdmin ? `Admin reset for ${employee.fullName}` : "Update your password"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text-secondary)", borderRadius: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          {isAdmin && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#EFF6FF", border: "1px solid #BFDBFE", fontSize: 12.5, color: "#1D4ED8" }}>
              <strong>Admin Override:</strong> Current password verification is not required for manager resets.
            </div>
          )}
          {!isAdmin && (
            <Field label="Current Password" required error={errors.currentPassword}>
              <Inp value={form.currentPassword} onChange={(v) => setField("currentPassword", v)} type={showPw ? "text" : "password"} error={!!errors.currentPassword} autoComplete="current-password" />
            </Field>
          )}
          <Field label="New Password" required error={errors.newPassword}>
            <div style={{ position: "relative" }}>
              <Inp value={form.newPassword} onChange={(v) => setField("newPassword", v)} type={showPw ? "text" : "password"} placeholder="Min 8 chars, uppercase, number" error={!!errors.newPassword} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPw ? <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M1 1l22 22" /> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                </svg>
              </button>
            </div>
            {form.newPassword && pwStrength && (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
                  {[1,2,3,4].map((i) => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= pwStrength.score ? pwStrength.color : "var(--border-neutral)", transition: "background 0.2s" }} />)}
                </div>
                <span style={{ fontSize: 11, color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
              </div>
            )}
          </Field>
          <Field label="Confirm New Password" required error={errors.confirmPassword}>
            <Inp value={form.confirmPassword} onChange={(v) => setField("confirmPassword", v)} type={showPw ? "text" : "password"} error={!!errors.confirmPassword} autoComplete="new-password" />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-02)", cursor: "pointer", fontSize: 13.5, fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: loading ? "#9CA3AF" : "#DC2626", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 700 }}>
              {loading ? "Saving…" : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
export default function EmployeeManagement() {
  const { isMobile, isTablet, isLaptop, isDesktop } = useBreakpoint()
  const { currentUser } = useAuth()
  const toast = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)
  const [pwTarget, setPwTarget] = useState<Employee | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null)
  const [deactivateLoading, setDeactivateLoading] = useState(false)

  const pagePadding = isMobile ? "12px" : isTablet ? "18px 20px" : isLaptop ? "24px 28px" : "28px 32px"
  const maxW = isDesktop ? { maxWidth: 1400, margin: "0 auto" } : {}

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiRequest<any[]>("/employees", "GET")
      if (Array.isArray(data)) {
        setEmployees(data.map((e: any) => ({
          id: e.id,
          fullName: e.full_name || e.fullName || "",
          role: e.role || "",
          email: e.email || "",
          phone: e.phone || "",
          username: e.username || "",
          department: e.department || "",
          status: e.status || "active",
          createdAt: e.created_at ? e.created_at.slice(0, 10) : "",
          createdBy: e.created_by_name || e.createdBy || "",
          lastLogin: e.last_login || e.lastLogin || "",
        })))
      }
    } catch { setEmployees([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase()
    if (q && !`${e.fullName} ${e.email} ${e.username} ${e.role}`.toLowerCase().includes(q)) return false
    if (roleFilter && e.role !== roleFilter) return false
    if (statusFilter && e.status !== statusFilter) return false
    return true
  })

  const handleSaved = (emp: Employee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = emp; return n }
      return [emp, ...prev]
    })
  }

  const handleToggleStatus = async () => {
    if (!deactivateTarget) return
    setDeactivateLoading(true)
    try {
      const newStatus = deactivateTarget.status === "active" ? "inactive" : "active"
      await apiRequest(`/employees/${deactivateTarget.id}`, "PUT", { status: newStatus })
      setEmployees((prev) => prev.map((e) => e.id === deactivateTarget.id ? { ...e, status: newStatus } : e))
      toast.success(`Employee ${newStatus === "active" ? "reactivated" : "deactivated"}`, {
        description: `${deactivateTarget.fullName} is now ${newStatus}.`,
      })
      setDeactivateTarget(null)
    } catch (err: any) {
      toast.error("Action failed", { description: err?.message || "Please try again." })
    } finally { setDeactivateLoading(false) }
  }

  const activeCount   = employees.filter((e) => e.status === "active").length
  const inactiveCount = employees.filter((e) => e.status !== "active").length
  const roleCount     = new Set(employees.map((e) => e.role)).size

  return (
    <div style={{ padding: pagePadding, ...maxW }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Administration</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: 0 }}>Employee Management</h1>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>Create and manage employee accounts, roles, and credentials.</p>
          </div>
          <button id="emp-create-btn" onClick={() => setCreateOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--color-accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            Create Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Employees", value: employees.length, color: "#3B82F6", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" },
          { label: "Active",          value: activeCount,       color: "#16A34A", icon: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3" },
          { label: "Inactive",        value: inactiveCount,     color: "#9CA3AF", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Roles Used",      value: roleCount,         color: "#8B5CF6", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px 20px", borderRadius: 12, border: "1px solid var(--border-neutral)", background: "var(--surface-01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round"><path d={s.icon} /></svg>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, username…"
            style={{ width: "100%", height: 38, padding: "0 12px 0 34px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-01)", fontSize: 13.5, fontFamily: "Inter", color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          style={{ height: 38, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-01)", fontSize: 13.5, fontFamily: "Inter", cursor: "pointer" }}>
          <option value="">All Roles</option>
          {AVAILABLE_ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ height: 38, padding: "0 12px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-01)", fontSize: 13.5, fontFamily: "Inter", cursor: "pointer" }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={load} title="Refresh" style={{ width: 38, height: 38, borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-01)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border-neutral)", borderRadius: 12, overflow: "hidden", background: "var(--surface-01)" }}>
        {loading ? (
          <div style={{ padding: "52px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }}><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Loading employees…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{employees.length === 0 ? "No employees yet" : "No results"}</div>
            <div style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: 20 }}>
              {employees.length === 0 ? "Create the first employee account to get started." : "Try adjusting your search or filters."}
            </div>
            {employees.length === 0 && (
              <button onClick={() => setCreateOpen(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--color-accent)", color: "#fff", cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>Create First Employee</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid var(--border-neutral)", background: "var(--surface-02)" }}>
                  {["Employee", "Role", "Contact", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => (
                  <tr key={emp.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-neutral)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <EmpAvatar name={emp.fullName} role={emp.role} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{emp.fullName || "—"}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 1 }}>@{emp.username || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <RoleBadge role={emp.role} />
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>{emp.department}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13 }}>{emp.email || "—"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>{emp.phone || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={emp.status} />
                      {emp.lastLogin && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>Last: {emp.lastLogin}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13 }}>{emp.createdAt || "—"}</div>
                      {emp.createdBy && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>by {emp.createdBy}</div>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button id={`emp-edit-${emp.id}`} onClick={() => setEditTarget(emp)} title="Edit" style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border-neutral)", background: "var(--surface-02)", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          Edit
                        </button>
                        <button id={`emp-pw-${emp.id}`} onClick={() => setPwTarget(emp)} title="Change Password" style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", cursor: "pointer" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                        </button>
                        <button id={`emp-toggle-${emp.id}`} onClick={() => setDeactivateTarget(emp)} title={emp.status === "active" ? "Deactivate" : "Reactivate"}
                          style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${emp.status === "active" ? "#FCA5A5" : "#86EFAC"}`, background: emp.status === "active" ? "#FEF2F2" : "#F0FDF4", color: emp.status === "active" ? "#DC2626" : "#16A34A", cursor: "pointer" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            {emp.status === "active" ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></> : <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--text-secondary)" }}>
          Showing {filtered.length} of {employees.length} employees
        </div>
      )}

      {/* Deactivate confirm */}
      {deactivateTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--surface-01)", borderRadius: 14, padding: 30, maxWidth: 380, textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{deactivateTarget.status === "active" ? "⛔" : "✅"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{deactivateTarget.status === "active" ? "Deactivate Employee?" : "Reactivate Employee?"}</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
              {deactivateTarget.status === "active"
                ? `${deactivateTarget.fullName} will lose all system access immediately. Their data is preserved.`
                : `${deactivateTarget.fullName} will regain full access to their assigned modules.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeactivateTarget(null)} disabled={deactivateLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "1.5px solid var(--border-neutral)", background: "var(--surface-02)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleToggleStatus} disabled={deactivateLoading} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: deactivateTarget.status === "active" ? "#DC2626" : "#16A34A", color: "#fff", cursor: deactivateLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
                {deactivateLoading ? "Processing…" : deactivateTarget.status === "active" ? "Deactivate" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {createOpen  && <EmployeeModal mode="create" onClose={() => setCreateOpen(false)} onSaved={handleSaved} currentUser={currentUser} />}
      {editTarget  && <EmployeeModal mode="edit" employee={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} currentUser={currentUser} />}
      {pwTarget    && <PasswordModal employee={pwTarget} onClose={() => setPwTarget(null)} currentUser={currentUser} />}
    </div>
  )
}
