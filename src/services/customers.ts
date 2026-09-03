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

/* Helper to load and save customer records in localStorage for full persistence */
export function getSavedCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem("erp_customers_records")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomerLocally(cust: Customer) {
  try {
    const existing = getSavedCustomers()
    const updated = [cust, ...existing.filter((c) => c.id !== cust.id)]
    localStorage.setItem("erp_customers_records", JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}

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
    try {
      const res = await apiRequest<any[]>("/customers", "GET")
      if (Array.isArray(res)) {
        all = res
      }
    } catch {
      /* fallback */
    }

    const savedLocal = getSavedCustomers()

    // Map backend entities to Customer interface
    const mappedBackend = all.map((c) => {
      const repInfo = buildSalesRepInfo(c)
      return {
        id: c.id,
        ref: c.businessNumber || c.ref || "CUS-UNKNOWN",
        name: c.name,
        type: c.type || "cafe",
        status: c.status || "active",
        contactPerson: c.contactPerson || c.contactName || "N/A",
        contactName: c.contactPerson || c.contactName || "N/A",
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
          id: repInfo.id,
          name: repInfo.name,
          employeeId: repInfo.employeeId,
        },
        submittedAt: c.submittedAt || c.createdAt || new Date().toISOString(),
        approvedBy: c.approvedBy,
        approvedAt: c.approvedAt,
        rejectedBy: c.rejectedBy,
        rejectedAt: c.rejectedAt,
        rejectionReason: c.rejectionReason,
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      }
    })

    // Use backend data directly from Supabase
    const mapped = mappedBackend

    const filtered = mapped.filter((c) => {
      const q = (filters.search ?? "").toLowerCase()
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.ref.toLowerCase().includes(q)
      )
        return false
      // Treat "approved" as equivalent to "active" for filtering purposes
      const normalizeStatus = (s: string) => (s === "approved" ? "active" : s)
      if (filters.status && normalizeStatus(c.status) !== normalizeStatus(filters.status)) return false
      if (filters.salesRepId && c.salesRep?.id !== filters.salesRepId)
        return false
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
  return safeRequest<{ ref: string }>(async () => {
    let res: any = null
    const repId = _payload.salesRepId || ""
    const repName = _payload.salesRepName || ""
    const repEmployeeId = _payload.salesRepEmployeeId || ""

    try {
      res = await apiRequest<any>("/customers", "POST", {
        businessNumber: "CUS-" + Math.floor(1000 + Math.random() * 9000),
        name: _payload.name,
        type: _payload.type || "cafe",
        contactPerson: _payload.contactName,
        phone: _payload.contactPhone,
        email: _payload.contactEmail,
        salesRepId: repId,
        salesRepName: repName,
        salesRepEmployeeId: repEmployeeId,
        branchDetails: {
          name: "Main Branch",
          address: (_payload.address || "") + ", " + (_payload.city || ""),
          contactInfo: (_payload.contactName || "") + " " + (_payload.contactPhone || ""),
        },
      })
    } catch {
      // Backend offline fallback
    }

    const newRef = res?.businessNumber || "CUS-" + Math.floor(1000 + Math.random() * 9000)
    const submittedTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
    const newCust: Customer = {
      id: res?.id || "c-" + Date.now(),
      ref: newRef,
      name: _payload.name,
      type: _payload.type || "cafe",
      status: "pending",
      contactPerson: _payload.contactName,
      contactName: _payload.contactName,
      phone: _payload.contactPhone,
      contactPhone: _payload.contactPhone,
      email: _payload.contactEmail,
      contactEmail: _payload.contactEmail || "N/A",
      address: _payload.address || "Addis Ababa",
      city: _payload.city || "Addis Ababa",
      creditLimit: _payload.creditLimit || "ETB 0.00",
      outstandingBalance: "ETB 0.00",
      salesRep: {
        id: repId,
        name: repInfo.name,
        employeeId: repInfo.employeeId,
      },
      submittedAt: submittedTime,
      createdAt: new Date().toLocaleDateString(),
    }
    saveCustomerLocally(newCust)
    return { ref: newRef }
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
    const saved = getSavedCustomers()
    let target = saved.find((c) => c.id === id)
    const approvedTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    if (target) {
      target.status = "active"  // normalise to "active" — the canonical approved state
      target.approvedBy = managerId || "General Manager"
      target.approvedAt = approvedTime
      saveCustomerLocally(target)
    } else {
      // Customer came from Supabase, not in localStorage yet — create a localStorage override
      const overrideCust: Customer = {
        id,
        ref: "CUS-" + id.slice(0, 6).toUpperCase(),
        name: "Customer",
        type: "cafe",
        status: "active",  // normalise to canonical active state
        contactName: "N/A",
        contactPhone: "N/A",
        contactEmail: "N/A",
        address: "N/A",
        city: "",
        creditLimit: "ETB 0.00",
        outstandingBalance: "ETB 0.00",
        salesRep: { id: "", name: "", employeeId: "" },
        approvedBy: managerId || "General Manager",
        approvedAt: approvedTime,
        createdAt: new Date().toLocaleDateString(),
      }
      // Try to enrich from API
      try {
        const full = await apiRequest<any>(`/customers/${id}`, "GET")
        if (full) {
          overrideCust.name = full.name || overrideCust.name
          overrideCust.ref = full.businessNumber || full.business_number || overrideCust.ref
          overrideCust.type = full.type || overrideCust.type
          overrideCust.contactName = full.contactPerson || full.contact_person || overrideCust.contactName
          overrideCust.contactPhone = full.phone || overrideCust.contactPhone
          overrideCust.contactEmail = full.email || overrideCust.contactEmail
          // Restore sales rep from API data
          if (full.salesRepId) {
            overrideCust.salesRep = {
              id: full.salesRepId,
              name: full.salesRepName || overrideCust.salesRep?.name || "Sales Rep",
              employeeId: full.salesRepEmployeeId || overrideCust.salesRep?.employeeId,
            }
          }
        }
      } catch { /* ignore */ }
      saveCustomerLocally(overrideCust)
    }

    // Persist an approval notification so sales reps see it in Notifications
    try {
      const savedCustomers = getSavedCustomers()
      const approvedCust = savedCustomers.find((c) => c.id === id)
      const salesRepId = approvedCust?.salesRep?.id
      const customerName = approvedCust?.name || "Customer"
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

    try {
      await apiRequest<{ success: boolean }>(`/customers/${id}/approve`, "POST", { managerId })
    } catch {
      /* ignore */
    }
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
    const saved = getSavedCustomers()
    let target = saved.find((c) => c.id === id)
    const rejectedTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    if (target) {
      target.status = "rejected"
      target.rejectedBy = managerId || "General Manager"
      target.rejectedAt = rejectedTime
      target.rejectionReason = reason.trim()
      saveCustomerLocally(target)
    } else {
      // Customer came from Supabase, not in localStorage yet — create a localStorage override
      const overrideCust: Customer = {
        id,
        ref: "CUS-" + id.slice(0, 6).toUpperCase(),
        name: "Customer",
        type: "cafe",
        status: "rejected",
        contactName: "N/A",
        contactPhone: "N/A",
        contactEmail: "N/A",
        address: "N/A",
        city: "",
        creditLimit: "ETB 0.00",
        outstandingBalance: "ETB 0.00",
        salesRep: { id: "", name: "", employeeId: "" },
        rejectedBy: managerId || "General Manager",
        rejectedAt: rejectedTime,
        rejectionReason: reason.trim(),
        createdAt: new Date().toLocaleDateString(),
      }
      // Try to enrich from API
      try {
        const full = await apiRequest<any>(`/customers/${id}`, "GET")
        if (full) {
          overrideCust.name = full.name || overrideCust.name
          overrideCust.ref = full.businessNumber || full.business_number || overrideCust.ref
          overrideCust.type = full.type || overrideCust.type
          overrideCust.contactName = full.contactPerson || full.contact_person || overrideCust.contactName
          overrideCust.contactPhone = full.phone || overrideCust.contactPhone
          overrideCust.contactEmail = full.email || overrideCust.contactEmail
          // Restore sales rep from API data
          if (full.salesRepId) {
            overrideCust.salesRep = {
              id: full.salesRepId,
              name: full.salesRepName || overrideCust.salesRep?.name || "Sales Rep",
              employeeId: full.salesRepEmployeeId || overrideCust.salesRep?.employeeId,
            }
          }
        }
      } catch { /* ignore */ }
      saveCustomerLocally(overrideCust)
    }

    // Persist a rejection notification so sales reps see the reason in Notifications
    try {
      const savedCustomers = getSavedCustomers()
      const rejectedCust = savedCustomers.find((c) => c.id === id)
      const salesRepId = rejectedCust?.salesRep?.id
      const customerName = rejectedCust?.name || "Customer"
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

    try {
      await apiRequest<{ success: boolean }>(`/customers/${id}/reject`, "POST", {
        reason: reason.trim(),
        managerId,
      })
    } catch {
      /* ignore */
    }
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
