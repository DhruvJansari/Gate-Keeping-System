import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let where = 'WHERE 1=1';
    const params = [];
    if (from) { where += ' AND DATE(created_at) >= ?'; params.push(from); }
    if (to) { where += ' AND DATE(created_at) <= ?'; params.push(to); }

    const [loading] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM transactions ${where} AND transaction_type = 'Loading'`,
      params
    );
    const [unloading] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM transactions ${where} AND transaction_type = 'Unloading'`,
      params
    );

    const [items] = await db.execute('SELECT COUNT(*) AS cnt FROM items');
    const [parties] = await db.execute('SELECT COUNT(*) AS cnt FROM parties');
    const [transporters] = await db.execute('SELECT COUNT(*) AS cnt FROM transporters');
    const [users] = await db.execute('SELECT COUNT(*) AS cnt FROM users');

    return NextResponse.json({
      loading: loading[0]?.cnt ?? 0,
      unloading: unloading[0]?.cnt ?? 0,
      items: items[0]?.cnt ?? 0,
      parties: parties[0]?.cnt ?? 0,
      transporters: transporters[0]?.cnt ?? 0,
      users: users[0]?.cnt ?? 0,
    });
  } catch (err) {
    console.error('Counts error:', err);
    return NextResponse.json({ error: 'Failed to fetch counts' }, { status: 500 });
  }
}
