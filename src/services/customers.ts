import {
  apiRequest,
  safeRequest,
  type ListEnvelope,
  type PaginationParams,
} from "./api"

export type CustomerStatus = "pending" | "active" | "rejected" | "inactive"
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
  salesRep: { id: string name: string } | null
  notes?: string
  rejectionReason?: string
  urgentFlag?: boolean
  createdAt: string
  approvedAt?: string
  approvedBy?: string
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
}

// In-memory fallback for Vercel preview environments where the backend is unreachable
let mockCustomers: Customer[] = []
let usingMock = false

export async function listCustomers(
  filters: CustomerListFilters = {},
  pagination: PaginationParams = { page: 1, perPage: 20 },
) {
  return safeRequest<ListEnvelope<Customer>>(async () => {
    // Fetch directly from our NestJS backend
    let all: any[] = []
    try {
      const res = await apiRequest<any[]>("/customers", "GET")
      if (Array.isArray(res)) {
        all = res
        usingMock = false
      } else {
        usingMock = true
      }
    } catch (e) {
      console.warn("Backend unavailable, using mock customers list")
      usingMock = true
    }

    if (usingMock) {
      all = mockCustomers
    }

    // Map the backend entity format to the frontend interface format
    const mapped: Customer[] = usingMock ? all : all.map((c) => ({
      id: c.id,
      ref: c.businessNumber || "CUS-UNKNOWN",
      name: c.name,
      type: c.type || "cafe",
      status: c.status || "active",
      contactName: c.contactPerson || "N/A",
      contactPhone: c.phone || "N/A",
      contactEmail: c.email || "N/A",
      address: "Main Branch",
      city: "Addis Ababa",
      creditLimit: "ETB 0.00",
      outstandingBalance: "ETB 0.00",
      salesRep: c.salesRepId ? { id: c.salesRepId, name: "Sales Rep" } : null,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    }))

    const filtered = mapped.filter((c) => {
      const q = (filters.search ?? "").toLowerCase()
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !c.ref.toLowerCase().includes(q)
      )
        return false
      if (filters.status && c.status !== filters.status) return false
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
  return safeRequest<Customer>(async () => {
    const c = await apiRequest<any>(`/customers/${id}`, "GET")
    if (!c) throw new Error(`Customer ${id} not found.`)
    return {
      id: c.id,
      ref: c.businessNumber || "CUS-UNKNOWN",
      name: c.name,
      type: "other",
      status: c.status || "pending",
      contactName: "TBD",
      contactPhone: "TBD",
      contactEmail: "TBD",
      address: "TBD",
      city: "TBD",
      creditLimit: "ETB 0.00",
      outstandingBalance: "ETB 0.00",
      salesRep: c.salesRepId ? { id: c.salesRepId, name: "Sales Rep" } : null,
      createdAt: c.createdAt,
    }
  })
}

export async function createCustomer(_payload: CreateCustomerPayload) {
  return safeRequest<{ ref: string }>(async () => {
    const res = await apiRequest<any>("/customers", "POST", {
      businessNumber: "CUS-" + Math.floor(Math.random() * 10000), // Auto-generate
      name: _payload.name,
      type: _payload.type || "cafe",
      contactPerson: _payload.contactName,
      phone: _payload.contactPhone,
      email: _payload.contactEmail,
      salesRepId: _payload.salesRepId,
      branchDetails: {
        name: "Main Branch",
        address: (_payload.address || "") + ", " + (_payload.city || ""),
        contactInfo: (_payload.contactName || "") + " " + (_payload.contactPhone || ""),
      },
    })
    return { ref: res.businessNumber }
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

export async function approveCustomer(id: string, _managerId: string) {
  return safeRequest<{ success: boolean }>(async () => {
    return apiRequest<{ success: boolean }>(`/customers/${id}/approve`, "POST")
  })
}

export async function rejectCustomer(
  id: string,
  reason: string,
  _managerId: string,
) {
  return safeRequest<{ success: boolean }>(async () => {
    return apiRequest<{ success: boolean }>(`/customers/${id}/reject`, "POST", {
      reason,
    })
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
