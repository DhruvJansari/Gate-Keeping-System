import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUser(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-me');
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const user = getUser(request);
    // Optional: if strict auth required, check user. But for dashboard counts maybe it's open or token is passed? 
    // The previous implementation did not check auth. I will check auth to identify role.
    
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let where = 'WHERE 1=1';
    const params = [];
    
    // Role-based logic for Gatekeeper
    if (user) {
       const isGatekeeper = user.roleName === 'Gatekeeper' || user.role_name === 'Gatekeeper';
       if (isGatekeeper) {
          // Gatekeeper sees ONLY items that have at least one ACTIVE transaction
          where += ' AND t.closed_at IS NULL';
       }
    }

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
    // Need to reset params if we were reusing them, but here we can just spread them
    // Actually, params are same for both queries since filters are same.
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
    return NextResponse.json({ error: 'Failed to fetch item counts', details: err.message }, { status: 500 });
  }
}
