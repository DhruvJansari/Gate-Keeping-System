const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const migrationFile = 'database/migrations/010_refine_role_permissions.sql';
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log(`Running migration: ${migrationFile}`);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log('Migration executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
