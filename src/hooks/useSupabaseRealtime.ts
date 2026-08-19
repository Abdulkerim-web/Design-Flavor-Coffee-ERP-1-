import { useEffect } from "react"

export type RealtimePayload = {
  eventType: string
  table: string
  record: any
}

export default function useSupabaseRealtime(
  table: string,
  onChange: (payload: RealtimePayload) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    // Prefer server-sent events from backend realtime stream
    const url = `/api/v1/realtime/stream?channel=${encodeURIComponent(table)}`
    let es: EventSource | null = null
    try {
      es = new EventSource(url)
    } catch (e) {
      console.warn("EventSource not available", e)
      es = null
    }

    if (!es) return

    const onMessage = (ev: MessageEvent) => {
      try {
        const parsed = JSON.parse(ev.data)
        // If backend sends normalized payload use it directly, otherwise wrap
        if (parsed && parsed.eventType && parsed.table && parsed.record) {
          onChange(parsed)
        } else {
          onChange({ eventType: "update", table, record: parsed })
        }
      } catch (err) {
        console.error("realtime parse error", err)
      }
    }

    es.addEventListener("message", onMessage)

    es.addEventListener("error", () => {
      // server closed or error — close locally
      try { es?.close() } catch (e) {}
    })

    return () => {
      try { es?.removeEventListener("message", onMessage); es?.close() } catch (e) {}
    }
  }, [table, onChange, enabled])
}
