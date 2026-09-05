const fetch = require('node-fetch'); // we'll use dynamic import for node-fetch or native fetch in node 20
async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/v1/customers");
    console.log("Customers:", await res.json());
  } catch(e) {
    console.error(e);
  }
}
test();
