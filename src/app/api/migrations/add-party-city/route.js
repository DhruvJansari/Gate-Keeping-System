import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    // Check if column already exists
    const [cols] = await db.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parties' AND COLUMN_NAME = 'city'
    `);

    if (cols.length > 0) {
      return NextResponse.json({ message: 'Column city already exists — no change needed.' });
    }

    await db.execute(`ALTER TABLE parties ADD COLUMN city VARCHAR(150) NULL AFTER address`);
    return NextResponse.json({ success: true, message: 'Column city added to parties table.' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
