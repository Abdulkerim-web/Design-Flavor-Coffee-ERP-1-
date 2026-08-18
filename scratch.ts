import { listCustomers } from "./src/services/customers";
async function run() {
  const res = await listCustomers();
  console.log("State:", res.state);
  if (res.state === "ok") {
    console.log("Total:", res.data.total);
    console.log("First item:", res.data.items[0]);
  }
}
run();
