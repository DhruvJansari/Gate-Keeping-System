const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dhruv123',
    database: 'gatekeeping_system',
  });

  const newRoles = ['MSEED YARD', 'MCAKE YARD', 'TANK POINT YARD', 'DOC YARD', 'OTHER YARD'];

  try {
    console.log('Inserting new Yard roles...');
    for (const r of newRoles) {
      await connection.execute('INSERT IGNORE INTO roles (name, description) VALUES (?, ?)', [r, 'Item-specific Yard Role']);
    }

    // Checking if old Yard exists
    const [oldYard] = await connection.execute('SELECT role_id FROM roles WHERE name = "Yard" OR name = "DEPRECATED YARD" LIMIT 1');
    
    if (oldYard.length > 0) {
      const oldRoleId = oldYard[0].role_id;
      console.log('Found Old Yard Role ID:', oldRoleId);
      
      // Update name to DEPRECATED YARD
      await connection.execute('UPDATE roles SET name = "DEPRECATED YARD", description = "Old generic Yard role" WHERE role_id = ?', [oldRoleId]);

      const [perms] = await connection.execute('SELECT permission_id FROM role_permissions WHERE role_id = ?', [oldRoleId]);
      
      if (perms.length > 0) {
        console.log(`Found ${perms.length} permissions for old Yard Role. Copying...`);
        for (const r of newRoles) {
          const [newRole] = await connection.execute('SELECT role_id FROM roles WHERE name = ?', [r]);
          if (newRole.length > 0) {
            const newRoleId = newRole[0].role_id;
            for (const p of perms) {
              await connection.execute('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [newRoleId, p.permission_id]);
            }
          }
        }
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
