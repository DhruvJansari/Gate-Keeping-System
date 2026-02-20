import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM vehicles WHERE status = "Active"');
    return NextResponse.json({ count: rows[0].count });
  } catch (err) {
    console.error('Vehicle count error:', err);
    return NextResponse.json({ count: 0 });
  }
}
