const url = "https://udvtogofulclohhvdnzc.supabase.co/rest/v1/customers?select=*";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdnRvZ29mdWxjbG9oaHZkbnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkyMjIzNCwiZXhwIjoyMTAyNDk4MjM0fQ.LWTXMgNfSwIukBQuIR5v71CuhlNkCd6OpszP3UTcwT0";

fetch(url, {
  headers: {
    "apikey": key,
    "Authorization": "Bearer " + key
  }
}).then(res => res.text()).then(text => console.log(text)).catch(console.error);
