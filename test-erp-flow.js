const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://udvtogofulclohhvdnzc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTests() {
  console.log("=== STARTING BACKEND TESTS ===");
  
  // Test A - Empty state check (just showing we can connect)
  console.log("\\n[Test A] Verifying connectivity...");
  const { data: users, error: errA } = await supabase.from('users').select('id').limit(1);
  if (errA) console.error("Connection Error:", errA);
  else console.log("Connection successful!");

  // Test B - Simulate Sales Rep creating a customer
  console.log("\\n[Test B] Creating customer as Sales Rep...");
  const salesRepId = 'USR-003';
  const newCustomer = {
    business_number: `CUS-TEST-${Date.now()}`,
    name: "Test Customer B",
    type: "cafe",
    status: "pending",
    sales_rep_id: salesRepId,
    sales_rep_name: "Sales Representative",
    active: true
  };
  const { data: custB, error: errB } = await supabase.from('customers').insert([newCustomer]).select().single();
  if (errB) {
    console.error("Failed to create customer:", errB);
    return;
  }
  console.log(`Customer Created successfully: ID=${custB.id}, Status=${custB.status}`);

  // Also simulate writeNotification
  console.log("Simulating writeNotification for manager badge...");
  const managerId = 'USR-001';
  await supabase.from('notifications').insert([{
    recipient_user_id: managerId,
    title: "New Customer",
    message: "Test Customer B needs approval",
    type: "approval",
    related_entity_type: "customers",
    related_entity_id: custB.id,
    is_read: false
  }]);
  
  const { data: notifs } = await supabase.from('notifications').select('id').eq('recipient_user_id', managerId).eq('is_read', false);
  console.log(`Manager Unread Notifications count: ${notifs.length}`);

  // Test C - Manager Approves
  console.log("\\n[Test C] Manager approves customer...");
  const { data: custC, error: errC } = await supabase.from('customers')
    .update({ status: 'active', approved_by: managerId, approved_at: new Date().toISOString() })
    .eq('id', custB.id)
    .select().single();
  if (errC) console.error("Failed to approve:", errC);
  else console.log(`Customer Approved: Status=${custC.status}`);

  // Test D - Manager Rejects (Creating another customer first)
  console.log("\\n[Test D] Manager rejects a customer...");
  const rejectCustomer = {
    business_number: `CUS-REJ-${Date.now()}`,
    name: "Test Customer D",
    type: "restaurant",
    status: "pending",
    sales_rep_id: salesRepId
  };
  const { data: custD, error: errD1 } = await supabase.from('customers').insert([rejectCustomer]).select().single();
  if (!errD1) {
    const { data: rejData, error: errD2 } = await supabase.from('customers')
      .update({ status: 'rejected', rejected_by: managerId, rejection_reason: "Test rejection" })
      .eq('id', custD.id)
      .select().single();
    if (errD2) console.error("Failed to reject:", errD2);
    else console.log(`Customer Rejected: Status=${rejData.status}, Reason=${rejData.rejection_reason}`);
  }

  console.log("\\n=== TESTS COMPLETE ===");
}

runTests();
