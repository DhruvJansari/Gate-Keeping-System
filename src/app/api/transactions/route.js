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
    const page = parseInt(searchParams.get('page'));
    const limit = parseInt(searchParams.get('limit'));
    const search = searchParams.get('search');

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
    
    // Global Search
    if (search) {
      sql += ' AND (t.transaction_id LIKE ? OR tr.truck_no LIKE ? OR t.gate_pass_no LIKE ? OR p.party_name LIKE ? OR i.item_name LIKE ?)';
      const likeSearch = `%${search}%`;
      params.push(likeSearch, likeSearch, likeSearch, likeSearch, likeSearch);
    }

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

    if (page && limit) {
      // First, count total matching rows avoiding regex collision through safe sub-queries
      const countSql = `SELECT COUNT(*) as total FROM (${sql}) AS subquery`;
      const [countRows] = await db.execute(countSql, params);
      const total = countRows[0].total;

      // Inject explicitly validated integers avoiding mysql2 execution driver crashes 
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

      const [rows] = await db.execute(sql, params);
      return NextResponse.json({
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

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

    if (!transaction_type || !truck_no || !party_id || !item_id || !mobile_number) {
      return NextResponse.json({ error: 'Missing required fields: truck_no, party_id, item_id, mobile_number' }, { status: 400 });
    }

    // Duplicate Active Truck Validation (Ignore case and spaces)
    const normalizedInputTruckNo = truck_no.replace(/\s+/g, '').toLowerCase();
    const [activeTxnRows] = await db.execute(
      `SELECT t.transaction_id 
       FROM transactions t 
       JOIN trucks tr ON t.truck_id = tr.truck_id 
       WHERE LOWER(REPLACE(tr.truck_no, ' ', '')) = ? 
       AND t.closed_at IS NULL AND t.is_damaged = 0`,
      [normalizedInputTruckNo]
    );

    if (activeTxnRows.length > 0) {
      return NextResponse.json({ error: 'This vehicle is already assigned to an active transaction.' }, { status: 400 });
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
    
    // FY Boundary Mapping via UTC + 5:30 IST 
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const fy_start_year = istDate.getUTCMonth() >= 3 ? istDate.getUTCFullYear() : istDate.getUTCFullYear() - 1;

    let transactionId = null;
    let gatePassNo = null;
    
    // Allocate single strict connection guaranteeing atomic transaction locks against parallel inserts natively
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Lock Row Sequentially 
      const [rows] = await conn.execute('SELECT current_serial FROM transaction_counters WHERE fy_start_year = ? FOR UPDATE', [fy_start_year]);
      
      let nextSerial = 1;
      if (rows.length > 0) {
        nextSerial = rows[0].current_serial + 1;
        await conn.execute('UPDATE transaction_counters SET current_serial = ? WHERE fy_start_year = ?', [nextSerial, fy_start_year]);
      } else {
        await conn.execute('INSERT INTO transaction_counters (fy_start_year, current_serial) VALUES (?, 1)', [fy_start_year]);
      }
      
      // 2. Base Transaction Core
      const [result] = await conn.execute(
        `INSERT INTO transactions (
          transaction_type, truck_id, party_id, item_id, transporter_id,
          po_do_number, invoice_number, invoice_date, invoice_quantity,
          lr_number, mobile_number, remark1, remark2, rate, created_by,
          parking_confirmed_at, parking_confirmed_by,
          fy_start_year, fy_serial
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction_type === 'Unloading' ? 'Unloading' : 'Loading',
          truckId,
          party_id,
          item_id,
          transporter_id,
          po_do_number || null,
          invoice_number || null,
          invoice_date || null,
          invoice_quantity ? parseFloat(invoice_quantity) : null,
          lr_number || null,
          mobile_number,
          remark1 || null,
          remark2 || null,
          rate ? parseFloat(rate) : null,
          userId,
          currentTimestamp,
          userId,
          fy_start_year,
          nextSerial
        ]
      );

      transactionId = result.insertId;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      gatePassNo = `GP-${String(nextSerial).padStart(2, '0')}-${dateStr}`;
      
      await conn.execute(
        'UPDATE transactions SET gate_pass_no = ? WHERE transaction_id = ?',
        [gatePassNo, transactionId]
      );

      await conn.commit();
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    return NextResponse.json({ success: true, transaction_id: transactionId, gate_pass_no: gatePassNo });
  } catch (err) {
    console.error('Transaction create error:', err);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
