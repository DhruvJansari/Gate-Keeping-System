const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Connection Config (Defaulting to what is seen in other files)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Based on other files, default is empty
  database: process.env.DB_NAME || 'gatekeeping_db',
  multipleStatements: true // Important for running migration files
};

async function migrate() {
  let conn;
  try {
    console.log('Connecting to database...');
    conn = await mysql.createConnection(dbConfig);
    console.log('Connected.');

    const migrationPath = path.join(__dirname, '../database/migrations/013_create_logistic_entries_mysql.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 013_create_logistic_entries_mysql.sql');
    await conn.query(sql);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

migrate();
