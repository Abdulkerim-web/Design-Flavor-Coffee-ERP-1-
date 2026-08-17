/**
 * Formatting utilities for Flavor Coffee Roasters ERP.
 * All financial values use ETB. All quantities use KG.
 * Use these throughout the app — never format inline.
 */

/** Format a monetary value as ETB 50,000.00 */
export function formatETB(amount: number): string {
  return `ETB ${amount.toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** Format a weight in KG — rounds to given decimals (default 1 for operational, 2 for precision) */
export function formatKG(amount: number, decimals = 1): string {
  if (decimals === 0) {
    return `${Math.round(amount).toLocaleString("en-ET")} KG`
  }
  return `${amount.toLocaleString("en-ET", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} KG`
}

/** Format a date as "09 Aug 2026" */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/** Format a datetime as "09 Aug 2026, 10:42" */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return (
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  )
}

/** Format a number with thousands separator, no decimals — for counts */
export function formatCount(n: number): string {
  return n.toLocaleString("en-ET")
}

/** Format a percentage — "84.2%" */
export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`
}
