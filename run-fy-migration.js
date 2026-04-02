const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'dhruv123',
    database: process.env.DB_NAME || 'gatekeeping_system',
    multipleStatements: true
  });

  try {
    console.log('Reading migration file...');
    const sqlPath = path.join(__dirname, 'database', 'migrations', '023_add_fy_transaction_numbering.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration...');
    await connection.query(sql);
    
    console.log('FY Mapping Migration completed successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
       console.log('Columns already exist. Re-running format update only...');
       await connection.query(`
         UPDATE transactions
         SET gate_pass_no = CONCAT('GP-', LPAD(fy_serial, 2, '0'), '-', DATE_FORMAT(created_at + INTERVAL 5 HOUR + INTERVAL 30 MINUTE, '%Y%m%d'))
         WHERE fy_serial IS NOT NULL;
       `);
       console.log('FY Format Update completed successfully!');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    await connection.end();
  }
}

runMigration();
