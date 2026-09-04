import { useState, useEffect, type FormEvent, type FC } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useToast } from "../contexts/ToastContext"
import { useAuth } from "../contexts/AuthContext"
import {
  createCustomer,
  type CreateCustomerPayload,
  type CustomerType,
} from "../services/customers"
import { apiRequest } from "../services/api"

const TYPE_LABELS: Record<CustomerType, string> = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  cafe: "Cafe",
  airline: "Airline",
  corporate: "Corporate",
  other: "Other",
}

const BLANK_FORM = {
  name: "",
  type: "cafe" as CustomerType,
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  city: "Addis Ababa",
  salesRepId: "",
  notes: "",
  creditLimit: "0",
}

export const CustomerFormModal: FC<{
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}> = ({ open, onClose, onSuccess }) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const { currentUser } = useAuth()
  const [salesReps, setSalesReps] = useState<{ id: string; name: string }[]>([])
  const [repsLoading, setRepsLoading] = useState(false)

  // Load sales reps whenever modal opens
  useEffect(() => {
    if (!open) return
    setRepsLoading(true)
    apiRequest<any[]>("/profiles/sales-reps", "GET")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSalesReps(
            data.map((u: any) => ({
              id: u.id || u.userId,
              name: u.name || u.displayName || u.full_name || "Sales Rep",
            }))
          )
        }
      })
      .catch(() => setSalesReps([]))
      .finally(() => setRepsLoading(false))
  }, [open])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<typeof BLANK_FORM>(BLANK_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form each time the modal opens
  useEffect(() => {
    if (open) {
      setData(BLANK_FORM)
      setErrors({})
    }
  }, [open])

  if (!open) return null

  const setField = (k: keyof typeof data) => (v: string) => {
    setData((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: "" }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!data.name.trim()) e.name = "Required"
    if (!data.contactName?.trim()) e.contactName = "Required"
    if (!data.contactPhone?.trim()) e.contactPhone = "Required"
    if (!data.city?.trim()) e.city = "Required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      // Attach sales rep name & ID — auto-bind to current user if sales-rep or rep not selected
      const selectedRep = salesReps.find((r) => r.id === data.salesRepId)
      const effectiveRepId = data.salesRepId || currentUser?.id || ""
      const effectiveRepName = selectedRep?.name || currentUser?.name || "Sales Representative"

      const payload: CreateCustomerPayload = {
        ...data,
        salesRepId: effectiveRepId,
        salesRepName: effectiveRepName,
      }
      const res = await createCustomer(payload)
      if (res.state === "error") {
        toast.error("Failed to create", { description: res.error })
      } else {
        toast.success("Customer created", {
          description: `${data.name} has been submitted and is pending approval.`,
        })
        onSuccess?.()
        onClose()
      }
    } catch (err: any) {
      toast.error("Failed to create", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--border-neutral)",
    background: "var(--surface-01)",
    color: "var(--text-primary)",
    fontSize: 13,
    boxSizing: "border-box" as const,
  }
  const labelStyle = {
    display: "block",
    fontSize: 12,
    marginBottom: 4,
    color: "var(--text-secondary)",
    fontWeight: 500,
  } as const

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--surface-01)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          style={{
            margin: "0 0 18px",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Add New Customer
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Row 1: Business Name + Type */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Business Name *</label>
              <input
                value={data.name}
                onChange={(e) => setField("name")(e.target.value)}
                placeholder="e.g. Horizon Hotel"
                style={{
                  ...inputStyle,
                  borderColor: errors.name ? "#ef4444" : undefined,
                }}
              />
              {errors.name && (
                <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={data.type}
                onChange={(e) => setField("type")(e.target.value)}
                style={inputStyle}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Contact Person + Phone */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Contact Person *</label>
              <input
                value={data.contactName}
                onChange={(e) => setField("contactName")(e.target.value)}
                placeholder="Full name"
                style={{
                  ...inputStyle,
                  borderColor: errors.contactName ? "#ef4444" : undefined,
                }}
              />
              {errors.contactName && (
                <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>
                  {errors.contactName}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input
                value={data.contactPhone}
                onChange={(e) => setField("contactPhone")(e.target.value)}
                placeholder="+251 9XX XXX XXX"
                style={{
                  ...inputStyle,
                  borderColor: errors.contactPhone ? "#ef4444" : undefined,
                }}
              />
              {errors.contactPhone && (
                <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>
                  {errors.contactPhone}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Email + City */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={data.contactEmail}
                onChange={(e) => setField("contactEmail")(e.target.value)}
                placeholder="contact@business.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>City *</label>
              <input
                value={data.city}
                onChange={(e) => setField("city")(e.target.value)}
                placeholder="Addis Ababa"
                style={{
                  ...inputStyle,
                  borderColor: errors.city ? "#ef4444" : undefined,
                }}
              />
              {errors.city && (
                <div style={{ color: "#ef4444", fontSize: 11, marginTop: 3 }}>
                  {errors.city}
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Address + Sales Rep */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <div>
              <label style={labelStyle}>Address</label>
              <input
                value={data.address}
                onChange={(e) => setField("address")(e.target.value)}
                placeholder="Street / Area"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Assign Sales Rep
                {repsLoading && (
                  <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                    (loading…)
                  </span>
                )}
              </label>
              <select
                value={data.salesRepId}
                onChange={(e) => setField("salesRepId")(e.target.value)}
                style={inputStyle}
                disabled={repsLoading}
              >
                <option value="">-- Assign later --</option>
                {salesReps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={data.notes}
              onChange={(e) => setField("notes")(e.target.value)}
              placeholder="Any additional information…"
              rows={2}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                border: "1px solid var(--border-neutral)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "none",
                background: "#2B4D3A",
                color: "white",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: 13,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Saving…" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
