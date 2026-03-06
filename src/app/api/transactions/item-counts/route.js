import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import jwt from 'jsonwebtoken';

function getUser(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    const decoded = jwt.verify(token, secret || 'dev-only-fallback-secret');
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

    const statusType = searchParams.get('statusType'); // 'pending', 'damaged' or null

    let where = 'WHERE 1=1';
    const params = [];
    
    // Role-based logic
    let isGatekeeper = false;
    let isWeighbridge = false;
    let isYard = false;

    if (user) {
       isGatekeeper = user.roleName === 'Gatekeeper' || user.role_name === 'Gatekeeper';
       isWeighbridge = user.roleName === 'Weighbridge' || user.role_name === 'Weighbridge';
       isYard = user.roleName?.toUpperCase().includes('YARD') || user.role_name?.toUpperCase().includes('YARD');

       if (isYard) {
         where += ' AND t.is_damaged = 0 AND t.closed_at IS NULL';
         where += ` AND (
           t.item_id IN (SELECT item_id FROM user_items WHERE user_id = ?)
           OR t.item_id IN (SELECT item_id FROM role_items WHERE role_id = ?)
         )`;
         params.push(user.userId || user.user_id, user.roleId || user.role_id);
       } else if (!isGatekeeper && !isWeighbridge) {
         if (statusType !== 'pending' && statusType !== 'damaged') {
           if (from) { where += ' AND DATE(t.created_at) >= ?'; params.push(from); }
           if (to) { where += ' AND DATE(t.created_at) <= ?'; params.push(to); }
         }
       }
    } else {
       if (statusType !== 'pending' && statusType !== 'damaged') {
         if (from) { where += ' AND DATE(t.created_at) >= ?'; params.push(from); }
         if (to) { where += ' AND DATE(t.created_at) <= ?'; params.push(to); }
       }
    }

    // Status type filters & Role Specific Pending Scopes
    if (statusType === 'damaged') {
      where += ' AND t.is_damaged = 1';
    } else if (statusType === 'pending' || statusType === 'all' || !statusType) {
      if (isGatekeeper) {
        where += ` AND t.is_damaged = 0 AND t.closed_at IS NULL`;
        where += ` AND (
          (t.parking_confirmed_at IS NULL) OR 
          (t.parking_confirmed_at IS NOT NULL AND t.gate_in_at IS NULL) OR
          (t.gate_pass_finalized_at IS NOT NULL AND t.gate_out_at IS NULL)
        )`;
      } else if (isWeighbridge) {
        where += ` AND t.is_damaged = 0 AND t.closed_at IS NULL`;
        where += ` AND (
          (t.gate_in_at IS NULL) OR
          (t.gate_in_at IS NOT NULL AND t.first_weigh_at IS NULL) OR
          (t.campus_out_at IS NOT NULL AND t.second_weigh_at IS NULL) OR
          (t.second_weigh_at IS NOT NULL AND t.gate_pass_finalized_at IS NULL)
        )`;
      } else if (isYard) {
        where += ` AND t.first_weigh_at IS NOT NULL AND t.campus_out_at IS NULL`;
      } else if (statusType === 'pending') {
        where += ' AND t.gate_out_at IS NULL AND t.is_damaged = 0 AND t.closed_at IS NULL';
      }
    }

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
