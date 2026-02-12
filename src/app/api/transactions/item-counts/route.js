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
    if (from) { where += ' AND DATE(t.created_at) >= ?'; params.push(from); }
    if (to) { where += ' AND DATE(t.created_at) <= ?'; params.push(to); }

    // Get item-wise counts for loading transactions
    const [loadingItems] = await db.execute(
      `SELECT i.item_name, COUNT(*) as count 
       FROM transactions t 
       JOIN items i ON t.item_id = i.item_id 
       ${where} AND t.transaction_type = 'Loading' 
       GROUP BY i.item_name 
       ORDER BY i.item_name`,
      params
    );

    // Get item-wise counts for unloading transactions
    const [unloadingItems] = await db.execute(
      `SELECT i.item_name, COUNT(*) as count 
       FROM transactions t 
       JOIN items i ON t.item_id = i.item_id 
       ${where} AND t.transaction_type = 'Unloading' 
       GROUP BY i.item_name 
       ORDER BY i.item_name`,
      params
    );

    return NextResponse.json({
      loading: loadingItems.map(row => ({ item_name: row.item_name, count: row.count })),
      unloading: unloadingItems.map(row => ({ item_name: row.item_name, count: row.count })),
    });
  } catch (err) {
    console.error('Item counts error:', err);
    return NextResponse.json({ error: 'Failed to fetch item counts' }, { status: 500 });
  }
}
