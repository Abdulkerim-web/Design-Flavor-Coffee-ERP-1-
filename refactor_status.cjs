const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'backend', 'src');

const replacements = {
  // Customers
  'PENDING_APPROVAL': 'pending-approval',
  'ACTIVE': 'active',
  'INACTIVE': 'inactive',
  
  // Receiving / QC
  'RECEIVED': 'received',
  'QC_PENDING': 'qc-pending',
  'QC_COMPLETED': 'qc-completed',
  'PENDING_MANAGER_APPROVAL': 'pending-manager-approval',
  'APPROVED': 'approved',
  'REJECTED': 'rejected',
  
  // Reservations
  'CONSUMED': 'consumed',
  'RELEASED': 'released',

  // Roasting
  'PLANNED': 'planned',
  'IN_PROGRESS': 'in-progress',
  'COMPLETED': 'completed',
  'FAILED': 'failed',

  // Discrepancy
  'NONE': 'none',
  'PENDING_REVIEW': 'pending-review',
  'PENDING_RESOLUTION': 'pending-review', // Map my old one
  'RESOLVED': 'resolved',

  // Packing
  'SUBMITTED': 'submitted',
  'DISCREPANCY_REVIEW': 'discrepancy-review',
  'CONFIRMED': 'confirmed',

  // Delivery
  'ASSIGNED': 'assigned',
  'OUT_FOR_DELIVERY': 'out-for-delivery',
  'DELIVERED_PROOF_SUBMITTED': 'delivered-proof-submitted',
  'PENDING_CUSTOMER_CONFIRMATION': 'pending-customer-confirmation',
  'VERIFIED': 'verified',
  'DISPUTED': 'disputed',
  'NEEDS_MANUAL_ASSESSMENT': 'needs-manual-assessment',
  'FAILED_ATTEMPT': 'failed-attempt',

  // Payments
  'UNPAID': 'unpaid',
  'PARTIALLY_PAID': 'partially-paid',
  'PAID': 'paid',
  'OVERDUE': 'overdue',

  // Expenses & Payroll
  'REQUESTED': 'requested',
  'DRAFT': 'draft',
  'PENDING_MANAGER_REVIEW': 'pending-manager-review',
  'AUTHORIZED_FOR_PAYMENT': 'authorized-for-payment',

  // Bank Match
  'UNMATCHED': 'unmatched',
  'AUTO_MATCHED': 'auto-matched',
  'MANUALLY_MATCHED': 'manually-matched',
  'EXCEPTION': 'exception',

  // Old Order statuses to new
  'FEASIBILITY_CHECK_PENDING': 'pending-confirmation',
  'RESERVATION_PENDING': 'confirmed-reserved',
  'READY_FOR_ROASTING': 'issued-to-roasting',
  'ROASTING_IN_PROGRESS': 'roasting-in-progress',
  'READY_FOR_PACKING': 'ready-for-packing',
  'READY_FOR_DELIVERY': 'ready-for-delivery',
  'DELIVERED': 'delivered-pending-verification', // Roughly
  'CANCELLED': 'cancelled',
  'PENDING': 'pending-confirmation'
};

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const [key, value] of Object.entries(replacements)) {
        // Replace exact quoted strings like 'PENDING_APPROVAL' or "PENDING_APPROVAL"
        const regex1 = new RegExp(`'${key}'`, 'g');
        const regex2 = new RegExp(`"${key}"`, 'g');
        
        content = content.replace(regex1, `'${value}'`);
        content = content.replace(regex2, `'${value}'`);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Replacement complete.');
