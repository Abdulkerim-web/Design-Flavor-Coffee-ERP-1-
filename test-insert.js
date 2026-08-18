const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://udvtogofulclohhvdnzc.supabase.co"
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

async function run() {
  const dbBody = {
    name: "Test Customer",
    type: "cafe",
    contact_person: "Test Contact",
    phone: "123456",
    email: "test@test.com",
    notes: "test",
    business_number: `CUS-${Math.floor(Math.random() * 10000)}`,
    active: true,
    status: "active"
  }
  const { data, error } = await supabaseAdmin.from("customers").insert([dbBody]).select()
  console.log("Error:", error)
  console.log("Data:", data)
}
run()
