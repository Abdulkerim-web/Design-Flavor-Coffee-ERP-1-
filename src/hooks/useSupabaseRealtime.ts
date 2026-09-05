import { useEffect, useRef } from "react"

/**
 * useSupabaseRealtime — subscribes to Postgres table changes via Supabase realtime.
 * Falls back to polling every 5s if the Supabase client is unavailable.
 *
 * @param table    Supabase table name to watch (e.g. "customers", "orders")
 * @param onChange Callback fired whenever a row INSERT/UPDATE/DELETE occurs
 * @param enabled  Set false to disable the subscription (default: true)
 */
export default function useSupabaseRealtime(
  table: string,
  onChange: () => void,
  enabled = true,
) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (!enabled) return

    let channel: any = null
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let active = true

    async function subscribe() {
      try {
        const supabaseUrl =
          (import.meta.env.VITE_SUPABASE_URL as string) ||
          "https://udvtogofulclohhvdnzc.supabase.co"
        const supabaseKey =
          (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string) ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"

        const mod = await import("@supabase/supabase-js")
        const client = mod.createClient(supabaseUrl, supabaseKey)

        channel = client
          .channel(`realtime:${table}:${Math.random()}`)
          .on(
            "postgres_changes" as any,
            { event: "*", schema: "public", table },
            () => {
              if (active) onChangeRef.current()
            },
          )
          .subscribe((status: string) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              // Realtime failed — fall back to polling
              if (!pollInterval && active) {
                pollInterval = setInterval(() => {
                  if (active) onChangeRef.current()
                }, 5000)
              }
            }
          })
      } catch (e) {
        // Supabase not available — fall back to polling
        if (!pollInterval && active) {
          pollInterval = setInterval(() => {
            if (active) onChangeRef.current()
          }, 5000)
        }
      }
    }

    subscribe()

    const handleLocalMutation = () => {
      // Small delay to allow state changes or DB triggers to settle
      setTimeout(() => {
        if (active) onChangeRef.current()
      }, 100)
    }

    // Listen for local mutations (e.g. from api.ts) to provide instant feedback
    window.addEventListener("erp-api-mutation", handleLocalMutation)

    return () => {
      active = false
      if (pollInterval) clearInterval(pollInterval)
      if (channel) {
        try {
          channel.unsubscribe()
        } catch (_) {}
      }
      window.removeEventListener("erp-api-mutation", handleLocalMutation)
    }
  }, [table, enabled])
}
