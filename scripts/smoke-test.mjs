const base = 'http://localhost:3000/api/v1'
const headers = { 'Content-Type': 'application/json' }

async function post(path, body) {
  const res = await fetch(base + path, { method: 'POST', headers, body: JSON.stringify(body) })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } } catch(e) { return { status: res.status, text } }
}

;(async ()=>{
  console.log('1) Create customer')
  const cust = await post('/customers', { businessNumber: `BUS-${Date.now()}`, name: 'Smoke Customer' })
  console.log(cust)

  const customerId = cust?.data?.data?.id || cust?.data?.id || null

  console.log('2) Place order')
  const order = await post('/orders', { customerId, branchId: null, items: [] })
  console.log(order)

  const orderId = order?.data?.data?.id || order?.data?.id || null

  console.log('3) Create delivery')
  const delivery = await post('/delivery', { orderId: orderId || 'manual-order', customerId })
  console.log(delivery)

  console.log('4) Record payment')
  const payment = await post('/finance/payments', { orderId: orderId || null, amount: 1000, paymentId: `PAY-${Date.now()}` })
  console.log(payment)

  console.log('\nSmoke run complete')
})().catch(err=>{ console.error('Smoke script error', err) })
