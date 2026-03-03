const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dhruv123',
    database: 'gatekeeping_system',
  });

  const sql1 = `CREATE TABLE IF NOT EXISTS role_items (
    role_id INT NOT NULL,
    item_id INT NOT NULL,
    PRIMARY KEY (role_id, item_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
  )`;

  const sql2 = `CREATE TABLE IF NOT EXISTS user_items (
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
  )`;

  try {
    console.log('Executing SQL 1...');
    await connection.query(sql1);
    console.log('Executing SQL 2...');
    await connection.query(sql2);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
