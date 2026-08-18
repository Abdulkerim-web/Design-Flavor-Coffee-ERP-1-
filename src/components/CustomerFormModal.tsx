import { useState, type FormEvent, type FC } from "react"
import { useBreakpoint } from "../hooks/useBreakpoint"
import { useToast } from "../contexts/ToastContext"
import {
  createCustomer,
  type CreateCustomerPayload,
  type CustomerType,
} from "../services/customers"

const TYPE_LABELS: Record<CustomerType, string> = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  cafe: "Cafe",
  airline: "Airline",
  corporate: "Corporate",
  other: "Other",
}

const SALES_REPS = [
  { id: "sr1", name: "Hiwot Tadesse" },
  { id: "sr2", name: "Bereket Assefa" },
  { id: "sr3", name: "Fikremariam Alemu" },
]

export const CustomerFormModal: FC<{
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}> = ({ open, onClose, onSuccess }) => {
  const { isMobile } = useBreakpoint()
  const toast = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<CreateCustomerPayload>({
    name: "",
    type: "cafe",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    city: "Addis Ababa",
    branchDetails: "",
    salesRepId: "",
    notes: "",
    creditLimit: "0",
  } as any) // Using any to slightly bend the payload to match the original form fields

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      await createCustomer(data)
      toast.success("Customer created", {
        description: `${data.name} is now active and saved to database.`,
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      toast.error("Failed to create", { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

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
          maxWidth: 500,
          background: "var(--surface-01)",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
      >
        <h2
          style={{
            margin: "0 0 16px",
            fontSize: 18,
            color: "var(--text-primary)",
          }}
        >
          Add New Customer
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Business Name *
              </label>
              <input
                value={data.name}
                onChange={(e) => setField("name")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              />
              {errors.name && (
                <div style={{ color: "red", fontSize: 11, marginTop: 4 }}>
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Type
              </label>
              <select
                value={data.type}
                onChange={(e) => setField("type")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Contact Person *
              </label>
              <input
                value={data.contactName}
                onChange={(e) => setField("contactName")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              />
              {errors.contactName && (
                <div style={{ color: "red", fontSize: 11, marginTop: 4 }}>
                  {errors.contactName}
                </div>
              )}
            </div>
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Phone *
              </label>
              <input
                value={data.contactPhone}
                onChange={(e) => setField("contactPhone")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              />
              {errors.contactPhone && (
                <div style={{ color: "red", fontSize: 11, marginTop: 4 }}>
                  {errors.contactPhone}
                </div>
              )}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                City *
              </label>
              <input
                value={data.city}
                onChange={(e) => setField("city")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              />
              {errors.city && (
                <div style={{ color: "red", fontSize: 11, marginTop: 4 }}>
                  {errors.city}
                </div>
              )}
            </div>
            <div>
              <label
                style={{ display: "block", fontSize: 12, marginBottom: 4 }}
              >
                Sales Rep
              </label>
              <select
                value={data.salesRepId}
                onChange={(e) => setField("salesRepId")(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "1px solid var(--border-neutral)",
                }}
              >
                <option value="">-- Assign later --</option>
                {SALES_REPS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid var(--border-neutral)",
                background: "transparent",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: "#2B4D3A",
                color: "white",
              }}
            >
              {isSubmitting ? "Saving..." : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
