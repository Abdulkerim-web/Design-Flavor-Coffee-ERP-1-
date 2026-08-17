const fs = require("fs")

let sql = fs.readFileSync("full_schema_postgres.sql", "utf8")

// Fix VARCHAR(255)(100) -> VARCHAR(100)
sql = sql.replace(/VARCHAR\(255\)\((\d+)\)/g, "VARCHAR($1)")

// Fix DEFAULT (TIMESTAMP('now')) -> DEFAULT NOW()
sql = sql.replace(/DEFAULT \(TIMESTAMP\('now'\)\)/g, "DEFAULT NOW()")

// Fix DEFAULT (1) for booleans (or in general) -> we can't easily distinguish boolean from int
// Let's just fix the known boolean defaults manually for safety, but Postgres actually accepts DEFAULT 1 for boolean if casted, wait no it doesn't.
// Let's replace BOOLEAN NOT NULL DEFAULT (1) -> BOOLEAN NOT NULL DEFAULT TRUE
sql = sql.replace(
  /BOOLEAN NOT NULL DEFAULT \(1\)/g,
  "BOOLEAN NOT NULL DEFAULT TRUE",
)
sql = sql.replace(
  /BOOLEAN NOT NULL DEFAULT \(0\)/g,
  "BOOLEAN NOT NULL DEFAULT FALSE",
)

// Fix any leftover VARCHAR(255) that didn't have length to just VARCHAR(255)
// Actually we already have VARCHAR(255)

// The original script replaced 'datetime' with 'TIMESTAMP'.
fs.writeFileSync("full_schema_postgres_fixed.sql", sql)
console.log("Fixed SQL syntax errors")
