import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();

    // Check if column already exists
    const [cols] = await db.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'logistic_entries' AND COLUMN_NAME = 'lr_no'
    `);

    if (cols.length > 0) {
      return NextResponse.json({ message: 'Column lr_no already exists — no change needed.' });
    }

    await db.execute(`ALTER TABLE logistic_entries ADD COLUMN lr_no VARCHAR(20) NULL AFTER logistic_id`);
    return NextResponse.json({ success: true, message: 'Column lr_no added to logistic_entries table.' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
