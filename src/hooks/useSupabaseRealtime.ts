import { useEffect } from "react"
import { supabase } from "../lib/supabase"

export type RealtimePayload = {
  eventType: string
  schema: string
  table: string
  record: any
  old_record?: any
}

export default function useSupabaseRealtime(
  table: string,
  onChange: (payload: RealtimePayload) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          try {
            onChange(payload as RealtimePayload)
          } catch (e) {
            // swallow handler errors
            console.error("realtime handler error", e)
          }
        },
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        // ignore
      }
    }
  }, [table, onChange, enabled])
}
