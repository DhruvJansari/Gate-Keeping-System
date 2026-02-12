import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    let sql = 'SELECT item_id, item_name, description, status, created_at FROM items WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (item_name LIKE ? OR description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term);
    }
    if (status === 'Active' || status === 'Inactive') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY item_name';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Items fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item_name, description, status } = body;

    if (!item_name?.trim()) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }

    const db = await getDb();
    const s = status === 'Inactive' ? 'Inactive' : 'Active';

    const [result] = await db.execute(
      'INSERT INTO items (item_name, description, status) VALUES (?, ?, ?)',
      [item_name.trim(), description?.trim() || null, s]
    );

    return NextResponse.json({ success: true, item_id: result.insertId });
  } catch (err) {
    console.error('Item create error:', err);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
