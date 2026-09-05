import {
  apiRequest,
  safeRequest,
  type ListEnvelope,
  type PaginationParams,
} from "./api"

export type CustomerStatus = "pending" | "approved" | "active" | "rejected" | "inactive"
export type CustomerType = "hotel" | "restaurant" | "cafe" | "airline" | "corporate" | "other"

export interface Customer {
  id: string
  ref: string
  name: string
  type: CustomerType
  status: CustomerStatus
  contactName: string
  contactPhone: string
  contactEmail: string
  address: string
  city: string
  region?: string
  creditLimit: string
  outstandingBalance: string
  salesRep: { id: string; name: string; employeeId?: string } | null
  notes?: string
  submittedAt?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  urgentFlag?: boolean
  createdAt: string
}

export interface CustomerListFilters {
  search?: string
  status?: CustomerStatus | ""
  type?: CustomerType | ""
  salesRepId?: string
}

export interface CreateCustomerPayload {
  name: string
  type: CustomerType
  contactName: string
  contactPhone: string
  contactEmail: string
  address: string
  city: string
  region?: string
  creditLimit: string
  notes?: string
  salesRepId?: string
  salesRepName?: string
  salesRepEmployeeId?: string
}

// Removed localStorage fallbacks

// Build sales rep info from the API response fields — no hardcoded names
function buildSalesRepInfo(c: any) {
  const name = c.salesRepName || c.sales_rep_name || ""
  const employeeId = c.salesRepEmployeeId || c.sales_rep_employee_id || ""
  const id = c.salesRepId || c.sales_rep_id || ""
  return { name, employeeId, id }
}

export async function listCustomers(
  filters: CustomerListFilters = {},
  pagination: PaginationParams = { page: 1, perPage: 20 },
) {
  return safeRequest<ListEnvelope<Customer>>(async () => {
    let all: any[] = []

    // Build API endpoint with server-side salesRepId filter so the DB scopes the result
    let apiEndpoint = "/customers"
    if (filters.salesRepId) {
      apiEndpoint += `?salesRepId=${encodeURIComponent(filters.salesRepId)}`
    }

    try {
      const res = await apiRequest<any[]>(apiEndpoint, "GET")
      if (Array.isArray(res)) {
        all = res
      }
    } catch {
      /* fallback to local cache below */
    }

    // Map backend entities to Customer interface
    const mappedBackend = all.map((c) => {
      const repInfo = buildSalesRepInfo(c)
      return {
        id: c.id,
        ref: c.businessNumber || c.business_number || c.ref || "CUS-UNKNOWN",
        name: c.name,
        type: c.type || "cafe",
        status: c.status || "active",
        contactPerson: c.contactPerson || c.contact_person || c.contactName || "N/A",
        contactName: c.contactPerson || c.contact_person || c.contactName || "N/A",
        phone: c.phone || c.contactPhone || "N/A",
        contactPhone: c.phone || c.contactPhone || "N/A",
        email: c.email || c.contactEmail || undefined,
        contactEmail: c.email || c.contactEmail || "N/A",
        address: c.address || "",
        location: c.location || c.city || "",
        city: c.city || c.location || "",
        creditLimit: c.creditLimit || "ETB 0.00",
        outstandingBalance: c.outstandingBalance || "ETB 0.00",
        salesRep: c.salesRep || {
          id: repInfo.id || c.sales_rep_id || "",
          name: repInfo.name || c.sales_rep_name || "",
          employeeId: repInfo.employeeId || c.sales_rep_employee_id || "",
        },
        submittedAt: c.submittedAt || c.submitted_at || c.createdAt || c.created_at || new Date().toISOString(),
        approvedBy: c.approvedBy || c.approved_by,
        approvedAt: c.approvedAt || c.approved_at,
        rejectedBy: c.rejectedBy || c.rejected_by,
        rejectedAt: c.rejectedAt || c.rejected_at,
        rejectionReason: c.rejectionReason || c.rejection_reason,
        createdAt: (c.createdAt || c.created_at) ? new Date(c.createdAt || c.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      }
    })

    // Use backend data as the authoritative source
    const mapped = [...mappedBackend]

    const filtered = mapped.filter((c) => {
      const q = (filters.search ?? "").toLowerCase()
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !(c.ref || "").toLowerCase().includes(q)
      )
        return false
      // Treat "approved" as equivalent to "active" for filtering purposes
      const normalizeStatus = (s: string) => (s === "approved" ? "active" : s)
      if (filters.status && normalizeStatus(c.status) !== normalizeStatus(filters.status)) return false
      // salesRepId filter already applied at the API level; double-check for local records
      if (filters.salesRepId && c.salesRep?.id !== filters.salesRepId) return false
      return true
    })

    const start = (pagination.page - 1) * pagination.perPage
    return {
      items: filtered.slice(start, start + pagination.perPage),
      total: filtered.length,
      page: pagination.page,
      perPage: pagination.perPage,
    }
  })
}

export async function getCustomer(id: string) {
  return safeRequest<any>(async () => {
    const c = await apiRequest<any>(`/customers/${id}`, "GET")
    if (!c) throw new Error(`Customer ${id} not found.`)
    return {
      id: c.id,
      ref: c.businessNumber || "CUS-UNKNOWN",
      name: c.name,
      type: c.type || "cafe",
      status: c.status || "active",
      contactPerson: c.contactPerson || "N/A",
      contactName: c.contactPerson || "N/A",
      phone: c.phone || "N/A",
      contactPhone: c.phone || "N/A",
      email: c.email || undefined,
      contactEmail: c.email || "N/A",
      address: c.address || "Main Branch",
      location: c.location || c.city || "",
      city: c.city || c.location || "",
      creditLimit: "ETB 0.00",
      outstandingBalance: "ETB 0.00",
      salesRep: c.salesRepId ? { id: c.salesRepId, name: "Sales Rep" } : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    }
  })
}

export async function createCustomer(_payload: CreateCustomerPayload) {
  return safeRequest<{ ref: string; id: string }>(async () => {
    const repId = _payload.salesRepId || ""
    const repName = _payload.salesRepName || ""
    const repEmployeeId = _payload.salesRepEmployeeId || ""

    // Generate a collision-resistant business number
    const businessNumber = `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // This call MUST succeed — do NOT catch the error here.
    // If the Supabase insert fails (uniqueness, permissions, network), the error
    // propagates to safeRequest which sets state="error" so the UI shows the real message.
    const res = await apiRequest<any>("/customers", "POST", {
      businessNumber,
      name: _payload.name,
      type: _payload.type || "cafe",
      contactPerson: _payload.contactName,
      phone: _payload.contactPhone,
      email: _payload.contactEmail,
      salesRepId: repId,
      status: "pending",
      branchDetails: {
        name: "Main Branch",
        address: (_payload.address || "") + ", " + (_payload.city || ""),
        contactInfo: (_payload.contactName || "") + " " + (_payload.contactPhone || ""),
      },
    })

    if (!res || !res.id) {
      throw new Error("Customer creation failed — no record was returned from the database.")
    }

    const newRef = res.businessNumber || res.business_number || businessNumber

    return { ref: newRef, id: res.id }
  })
}

export async function updateCustomer(
  id: string,
  _payload: Partial<CreateCustomerPayload>,
) {
  return safeRequest<{ success: boolean }>(async () => {
    return apiRequest<{ success: boolean }>(
      `/customers/${id}`,
      "PATCH",
      _payload,
    )
  })
}

export async function approveCustomer(id: string, managerId: string) {
  return safeRequest<{ success: boolean }>(async () => {
    // 1. Perform the DB update first. If this fails, it throws and safeRequest catches it.
    await apiRequest<{ success: boolean }>(`/customers/${id}/approve`, "POST", { managerId })

    await apiRequest<{ success: boolean }>(`/customers/${id}/approve`, "POST", { managerId })

    // Persist an approval notification so sales reps see it in Notifications
    try {
      // Minimal info for the local notification fallback since the server also creates one.
      const customerName = "Customer"
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "info",
        title: "Customer Registration Approved",
        what: `Customer "${customerName}" has been approved by management and is now active.`,
        why: "Customer request approved by General Manager.",
        module: "customers",
        moduleId: id,
        salesRepId: salesRepId || null,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch { /* ignore */ }

    return { success: true }
  })
}

export async function rejectCustomer(
  id: string,
  reason: string,
  managerId: string,
) {
  return safeRequest<{ success: boolean }>(async () => {
    if (!reason || !reason.trim()) {
      throw new Error("Rejection reason is required.")
    }
    
    // 1. DB Update First
    await apiRequest<{ success: boolean }>(`/customers/${id}/reject`, "POST", {
      reason: reason.trim(),
      managerId,
    })

    // Persist a rejection notification so sales reps see the reason in Notifications
    try {
      // Minimal info for the local notification fallback since the server also creates one.
      const customerName = "Customer"
      const raw = localStorage.getItem("erp_notifications_list")
      const list = raw ? JSON.parse(raw) : []
      const notif = {
        id: Date.now(),
        category: "warning",
        title: "Customer Registration Rejected",
        what: `Customer "${customerName}" registration has been rejected by management.`,
        why: `Reason: ${reason.trim()}`,
        module: "customers",
        moduleId: id,
        salesRepId: salesRepId || null,
        time: "Just now",
        timeRaw: Date.now(),
        read: false,
      }
      localStorage.setItem("erp_notifications_list", JSON.stringify([notif, ...list]))
    } catch { /* ignore */ }

    return { success: true }
  })
}

export async function deactivateCustomer(id: string, _managerId: string) {
  return safeRequest<{ success: boolean }>(async () => {
    return apiRequest<{ success: boolean }>(
      `/customers/${id}/deactivate`,
      "POST",
    )
  })
}
