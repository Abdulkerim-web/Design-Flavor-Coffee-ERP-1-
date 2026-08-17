const fs = require('fs');

const sql = fs.readFileSync('full_schema_postgres_clean.sql', 'utf8');

// We want to extract only the actual CREATE TABLE statements, ignoring temporary tables
const lines = sql.split('\n');
let finalSql = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

let inCreate = false;
let currentTable = '';

for (const line of lines) {
  if (line.startsWith('CREATE TABLE IF NOT EXISTS')) {
    if (line.includes('temporary_')) {
      inCreate = false;
      continue; // Skip temporary tables
    }
    finalSql += line + '\n';
    inCreate = true;
  } else if (inCreate) {
    if (line.trim() === '') {
      inCreate = false;
      finalSql += '\n';
    } else {
      finalSql += line + '\n';
    }
  } else if (line.startsWith('CREATE UNIQUE INDEX') || line.startsWith('CREATE INDEX')) {
    finalSql += line + '\n\n';
  }
}

fs.writeFileSync('../supabase_schema_complete.sql', finalSql);
console.log('Fixed schema to exclude SQLite table renames.');
