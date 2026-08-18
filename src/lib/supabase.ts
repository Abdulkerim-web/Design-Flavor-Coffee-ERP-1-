import { createClient } from "@supabase/supabase-js"

// Use Vite environment variables for the frontend client.
// Do NOT expose service_role keys in the browser. The admin/service role
// operations should live on the server. If you need admin actions, move
// them to backend endpoints and call those from the frontend.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
	console.warn("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Realtime and API calls may fail.")
}

// Standard client for most operations (anon/public key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// WARNING: The service role / admin client has been removed from the
// frontend for security. Use server-side functions for privileged operations.
