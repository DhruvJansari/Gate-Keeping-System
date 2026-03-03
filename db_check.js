require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gatekeeping_db'
  });

  const [schema] = await conn.query("DESCRIBE contracts");
  console.log("SCHEMA:", schema.filter(col => col.Field === 'contract_date' || col.Field === 'created_at'));

  const [rows] = await conn.query("SELECT contract_no, contract_date, created_at, updated_at FROM contracts ORDER BY contract_id DESC LIMIT 5");
  console.log("ROWS:");
  console.table(rows);
  conn.release();
}

check().catch(console.error);
