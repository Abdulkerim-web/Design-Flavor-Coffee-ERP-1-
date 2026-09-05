/**
 * SERVICE LAYER — base types and utilities
 *
 * Architecture: UI → Service → Data Source
 *
 * Current data source: mock (setTimeout simulation).
 * Future data source: PHP REST API — swap mockRequest() calls for fetch() calls.
 * The UI does NOT need to change when the data source changes.
 *
 * IMPORTANT: Services must NEVER calculate business values (stock, yield, VAT,
 * feasibility, payment deadlines, profit). They only transport data from the
 * source to the UI. The PHP backend is authoritative.
 */

/** Canonical load-state type used across all modules. */
export type LoadState = "idle" | "loading" | "ok" | "error"

/** Wrapped result returned by every service function. */
export interface ServiceResult<T> {
  data: T | null
  error: string | null
  state: LoadState
}

/** Pagination params sent to the data source. */
export interface PaginationParams {
  page: number
  perPage: number
}

/** Sort params sent to the data source. */
export interface SortParams {
  field: string
  dir: "asc" | "desc"
}

/** Standard list response envelope (mirrors PHP API shape). */
export interface ListEnvelope<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

/** Simulates an async request to a PHP backend endpoint.
 *  Replace the body of this function with a real fetch() call when the API is ready.
 *  @param data     The mock data to return (ignored in production).
 *  @param delayMs  Simulated network latency in milliseconds.
 */
export function mockRequest<T>(data: T, delayMs = 600): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // To simulate an error for testing, uncomment:
      // if (Math.random() < 0.1) { reject(new Error('Network error (simulated)')); return }
      resolve(data)
    }, delayMs)
  })
}

/** Wraps a service call in try/catch and returns a ServiceResult. */
export async function safeRequest<T>(
  fn: () => Promise<T>,
): Promise<ServiceResult<T>> {
  try {
    const data = await fn()
    return { data, error: null, state: "ok" }
  } catch (err: any) {
    let errorMsg = "An unexpected error occurred."
    if (err instanceof Error) {
      errorMsg = err.message
    } else if (err && err.message) {
      errorMsg = `${err.message} ${err.details ? '(' + err.details + ')' : ''}`
    } else if (typeof err === "string") {
      errorMsg = err
    }
    console.error("[safeRequest Error]", err)
    return { data: null, error: errorMsg, state: "error" }
  }
}

/** A no-op service result — useful for initial/idle state. */
export function idleResult<T>(): ServiceResult<T> {
  return { data: null, error: null, state: "idle" }
}

/** A loading service result — set this before the async call. */
export function loadingResult<T>(): ServiceResult<T> {
  return { data: null, error: null, state: "loading" }
}

let currentUserRole = "sales"

export function setGlobalUserRole(role: string) {
  currentUserRole = role
}

export async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  body?: any,
): Promise<T> {
  try {
    const { handleSupabaseApiRequest } = await import("../lib/supabase-api")
    const result = (await handleSupabaseApiRequest(endpoint, method, body, currentUserRole)) as T
    
    if (method !== "GET") {
      // Dispatch event to tell the UI to refetch data immediately
      window.dispatchEvent(new CustomEvent("erp-api-mutation"))
    }
    
    return result
  } catch (err) {
    console.error(`[Supabase API Error] ${method} ${endpoint}`, err)
    throw err
  }
}
