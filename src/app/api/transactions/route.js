import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    const { searchParams } = new URL(request.url);
    let from = searchParams.get('from');
    let to = searchParams.get('to');
    const type = searchParams.get('type');
    const item = searchParams.get('item');
    const statusType = searchParams.get('statusType'); // 'pending' or 'damaged'

    // Role-based filtering logic
    const { roleId, userId, roleName } = user;
    
    // Determine specific roles
    const isGatekeeper = roleName === 'Gatekeeper';
    const isWeighbridge = roleName === 'Weighbridge';
    const isYard = roleName?.toUpperCase().includes('YARD'); 
    const isRestricted = isWeighbridge || isYard || isGatekeeper;

    let sql = `SELECT t.transaction_id, t.transaction_type, t.invoice_number, t.invoice_date, t.invoice_quantity,
      t.po_do_number, t.lr_number, t.mobile_number, t.remark1, t.remark2, t.rate, t.first_weight, t.second_weight, t.net_weight,
      t.parking_confirmed_at, t.current_status, t.gate_in_at, t.first_weigh_at, t.second_weigh_at, t.campus_in_at, t.campus_out_at,
      t.gate_pass_finalized_at, t.gate_out_at, t.gate_pass_no, t.closed_at, t.created_at,
      t.is_damaged, t.damaged_at, t.damaged_by, t.damaged_reason,
      tr.truck_no, p.party_name, i.item_name, trs.name AS transporter_name,
      u_park.username AS parking_confirmed_by_name,
      u_gate_in.username AS gate_in_confirmed_by_name,
      u_gate_out.username AS gate_out_confirmed_by_name,
      u_weigh1.username AS first_weigh_confirmed_by_name,
      u_weigh2.username AS second_weigh_confirmed_by_name,
      u_campus_in.username AS campus_in_confirmed_by_name,
      u_campus_out.username AS campus_out_confirmed_by_name,
      u_gate_pass.username AS gate_pass_confirmed_by_name,
      u_damage.username AS damaged_by_name
      FROM transactions t
      JOIN trucks tr ON t.truck_id = tr.truck_id
      JOIN parties p ON t.party_id = p.party_id
      JOIN items i ON t.item_id = i.item_id
      JOIN transporters trs ON t.transporter_id = trs.transporter_id
      LEFT JOIN users u_park ON t.parking_confirmed_by = u_park.user_id
      LEFT JOIN users u_gate_in ON t.gate_in_confirmed_by = u_gate_in.user_id
      LEFT JOIN users u_gate_out ON t.gate_out_confirmed_by = u_gate_out.user_id
      LEFT JOIN users u_weigh1 ON t.first_weigh_confirmed_by = u_weigh1.user_id
      LEFT JOIN users u_weigh2 ON t.second_weigh_confirmed_by = u_weigh2.user_id
      LEFT JOIN users u_campus_in ON t.campus_in_confirmed_by = u_campus_in.user_id
      LEFT JOIN users u_campus_out ON t.campus_out_confirmed_by = u_campus_out.user_id
      LEFT JOIN users u_gate_pass ON t.gate_pass_confirmed_by = u_gate_pass.user_id
      LEFT JOIN users u_damage ON t.damaged_by = u_damage.user_id
      WHERE 1=1`;
    const params = [];

    if (isYard) {
      // YARD ROLES: Item-Based Access Walls
      sql += ` AND t.is_damaged = 0 AND t.closed_at IS NULL`;
      sql += ` AND (
        t.item_id IN (SELECT item_id FROM user_items WHERE user_id = ?)
        OR t.item_id IN (SELECT item_id FROM role_items WHERE role_id = ?)
      )`;
      params.push(userId, roleId);
      
    } else if (!isGatekeeper && !isWeighbridge) {
      // Normal filtering for Admin/View Only Admin
      if (statusType !== 'pending' && statusType !== 'damaged') {
         if (from) { sql += ' AND DATE(t.created_at) >= ?'; params.push(from); }
         if (to) { sql += ' AND DATE(t.created_at) <= ?'; params.push(to); }
      }
    }

    // Common filters
    if (type && type !== 'all') { sql += ' AND t.transaction_type = ?'; params.push(type); }
    if (item) { sql += ' AND i.item_name = ?'; params.push(item); }

    // Status type filters & Role Specific Pending Scopes
    if (statusType === 'damaged') {
      sql += ' AND t.is_damaged = 1';
    } else if (statusType === 'pending' || statusType === 'all' || !statusType) {
      // If we are Gatekeeper, always strictly filter to their pending stages
      if (isGatekeeper) {
        // Gatekeeper exact stages: Parking, Gate In, Gate Out
        sql += ` AND t.is_damaged = 0 AND t.closed_at IS NULL`;
        sql += ` AND (
          (t.parking_confirmed_at IS NULL) OR 
          (t.parking_confirmed_at IS NOT NULL AND t.gate_in_at IS NULL) OR
          (t.gate_pass_finalized_at IS NOT NULL AND t.gate_out_at IS NULL)
        )`;
      } else if (isWeighbridge) {
        // Weighbridge stages: Gate In, First WeighBridge, Second WeighBridge, Gate Pass
        sql += ` AND t.is_damaged = 0 AND t.closed_at IS NULL`;
        sql += ` AND (
          (t.gate_in_at IS NULL) OR
          (t.gate_in_at IS NOT NULL AND t.first_weigh_at IS NULL) OR
          (t.campus_out_at IS NOT NULL AND t.second_weigh_at IS NULL) OR
          (t.second_weigh_at IS NOT NULL AND t.gate_pass_finalized_at IS NULL)
        )`;
      } else if (isYard) {
        // Yard explicit pending stages: After First Weighbridge, before Campus Out
        sql += ` AND t.first_weigh_at IS NOT NULL AND t.campus_out_at IS NULL`;
      } else if (statusType === 'pending') {
        // Default pending for admin
        sql += ' AND t.gate_out_at IS NULL AND t.is_damaged = 0 AND t.closed_at IS NULL';
      }
    }

    const orderParam = searchParams.get('order');
    const sortDir = orderParam === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY t.transaction_id ${sortDir}`;

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Transactions fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch transactions', details: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUser(request);
    if (!user || !user.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId, roleId } = user;

    /* ======================
       PERMISSION CHECK
    ====================== */
    const db = await getDb();
    
    // Fetch user permissions
    const [permRows] = await db.execute(
      `SELECT p.code FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?
       UNION
       SELECT p.code FROM permissions p
       JOIN user_permissions up ON p.permission_id = up.permission_id
       WHERE up.user_id = ? AND up.granted = 1`,
      [roleId, userId]
    );
    const userPermissions = permRows.map(r => r.code);
    
    if (!userPermissions.includes('create_transactions') && !userPermissions.includes('*')) {
      return NextResponse.json({ error: 'Insufficient permissions create transactions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      transaction_type,
      truck_no,
      party_id,
      item_id,
      transporter_id,
      po_do_number,
      invoice_number,
      invoice_date,
      invoice_quantity,
      lr_number,
      mobile_number,
      remark1,
      remark2,
      rate,
    } = body;

    if (!transaction_type || !truck_no || !party_id || !item_id || !transporter_id || !invoice_number || !invoice_date || !invoice_quantity || !mobile_number) {
      return NextResponse.json({ error: 'Missing required fields: truck_no, party_id, item_id, transporter_id, invoice_number, invoice_date, invoice_quantity, mobile_number' }, { status: 400 });
    }

    const remarks = [remark1, remark2].filter(Boolean).join(' | ') || null;
    // db already initialized

    let truckId;
    const [truckRows] = await db.execute('SELECT truck_id FROM trucks WHERE truck_no = ?', [truck_no.trim()]);
    if (truckRows.length > 0) {
      truckId = truckRows[0].truck_id;
    } else {
      const [ins] = await db.execute(
        'INSERT INTO trucks (truck_no, transporter_id) VALUES (?, ?)',
        [truck_no.trim(), transporter_id]
      );
      truckId = ins.insertId;
    }

    const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await db.execute(
      `INSERT INTO transactions (
        transaction_type, truck_id, party_id, item_id, transporter_id,
        po_do_number, invoice_number, invoice_date, invoice_quantity,
        lr_number, mobile_number, remark1, remark2, rate, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction_type === 'Unloading' ? 'Unloading' : 'Loading',
        truckId,
        party_id,
        item_id,
        transporter_id,
        po_do_number || null,
        invoice_number,
        invoice_date,
        parseFloat(invoice_quantity) || 0,
        lr_number || null,
        mobile_number,
        remark1 || null,
        remark2 || null,
        rate ? parseFloat(rate) : null,
        userId
      ]
    );

    // Generate gate_pass_no after getting transaction_id
    const transactionId = result.insertId;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    const gatePassNo = `GP-${transactionId}-${dateStr}`;
    
    await db.execute(
      'UPDATE transactions SET gate_pass_no = ? WHERE transaction_id = ?',
      [gatePassNo, transactionId]
    );

    return NextResponse.json({ success: true, transaction_id: transactionId, gate_pass_no: gatePassNo });
  } catch (err) {
    console.error('Transaction create error:', err);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
