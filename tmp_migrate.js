require('dotenv').config({ path: '.env.local' });
const { getDb } = require('./src/lib/db');
(async () => {
  try {
    const db = await getDb();
    const queries = [
      "ALTER TABLE logistic_entries ADD COLUMN transporter_name VARCHAR(255) DEFAULT NULL",
      "ALTER TABLE logistic_entries ADD COLUMN company_notes TEXT DEFAULT NULL",
      "ALTER TABLE logistic_entries ADD COLUMN final_notes TEXT DEFAULT NULL",
      "ALTER TABLE logistic_entries ADD COLUMN loss_gain DECIMAL(10,2) DEFAULT NULL",
      "ALTER TABLE logistic_entries ADD COLUMN total_km DECIMAL(10,2) DEFAULT NULL"
    ];
    for(let q of queries) {
      try { 
        await db.execute(q); 
        console.log("Success:", q); 
      } catch(e) { 
        console.log("Ignored (probably exists):", e.message); 
      }
    }
  } catch(err) {
    console.error("DB conn error", err);
  }
  process.exit(0);
})();
