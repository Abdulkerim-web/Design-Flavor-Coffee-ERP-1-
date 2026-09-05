const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  "https://udvtogofulclohhvdnzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0"
);

async function checkSchema() {
  const { data: orderData, error: orderErr } = await supabase.from('orders').select('*').limit(1);
  if (orderErr) console.error('Orders error:', orderErr);
  else console.log('Orders columns:', orderData.length > 0 ? Object.keys(orderData[0]) : 'no rows');
  
  const { data: custData } = await supabase.from('customers').select('*').limit(1);
  console.log('Customers columns:', custData.length > 0 ? Object.keys(custData[0]) : 'no rows');

  const { data: userData } = await supabase.from('users').select('*').limit(1);
  console.log('Users columns:', userData.length > 0 ? Object.keys(userData[0]) : 'no rows');
}

checkSchema();
