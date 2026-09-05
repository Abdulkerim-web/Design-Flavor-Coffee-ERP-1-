import { createClient } from "@supabase/supabase-js"
const supabase = createClient(
  "https://udvtogofulclohhvdnzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"
)
async function test() {
  const { data: o } = await supabase.from('orders').select('*').limit(1)
  console.log('orders:', o ? Object.keys(o[0]) : o)
  const { data: oi } = await supabase.from('order_items').select('*').limit(1)
  console.log('order_items:', oi ? Object.keys(oi[0]) : oi)
  const { data: u } = await supabase.from('users').select('*').limit(1)
  console.log('users:', u ? Object.keys(u[0]) : u)
}
test()
