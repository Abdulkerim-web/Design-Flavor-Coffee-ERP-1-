import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://udvtogofulclohhvdnzc.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function test() {
  const { data: cData, error: cErr } = await supabaseAdmin.from("customers").select("*").order("created_at", { ascending: false })
  console.log("Customers error:", cErr)
  
  const { data: oData, error: oErr } = await supabaseAdmin.from("orders").select("*, customers(*)")
  console.log("Orders error:", oErr)
}

test()
