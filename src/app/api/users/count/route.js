import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const sql = activeOnly
      ? 'SELECT COUNT(*) AS cnt FROM users WHERE is_active = 1'
      : 'SELECT COUNT(*) AS cnt FROM users';
    const [rows] = await db.execute(sql);
    return NextResponse.json({ count: rows[0]?.cnt ?? 0 });
  } catch (err) {
    console.error('Users count error:', err);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
