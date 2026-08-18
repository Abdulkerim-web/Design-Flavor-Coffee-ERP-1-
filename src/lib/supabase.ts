import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://udvtogofulclohhvdnzc.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MjIyMzQsImV4cCI6MjEwMjQ5ODIzNH0.tEVigUQp9LVaY3sRZxo9smqoHPqbVBDc939d4CEEg0U"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"

// Standard client for most operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client using service_role to bypass RLS policies if needed
// WARNING: Service Role key should NOT normally be exposed to the browser.
// The user explicitly requested to use this to ensure everything works properly.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
