import { handleSupabaseApiRequest } from "./src/lib/supabase-api.ts"

async function run() {
  try {
    const data = await handleSupabaseApiRequest("/customers", "GET", null, "sales-rep")
    console.log("Returned data length:", data.length)
    console.log("First item:", data[0])
  } catch(e) {
    console.error(e)
  }
}
run()
