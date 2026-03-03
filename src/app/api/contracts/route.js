import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/contracts - List contracts with filters
export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || ''; // 'Purchase Order' or 'Sales Order'
    const itemId = searchParams.get('item_id') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    let sql = `
      SELECT 
        c.*, 
        p.party_name, 
        i.item_name, 
        b.broker_name 
      FROM contracts c
      LEFT JOIN parties p ON c.party_id = p.party_id
      LEFT JOIN items i ON c.item_id = i.item_id
      LEFT JOIN brokers b ON c.broker_id = b.broker_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND c.contract_type = ?';
      params.push(type);
    }
    
    if (itemId) {
      sql += ' AND c.item_id = ?';
      params.push(itemId);
    }
    
    if (startDate) {
      sql += ' AND DATE(c.created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND DATE(c.created_at) <= ?';
      params.push(endDate);
    }

    // Default active/inactive handling if needed, but admin usually sees all
    // sql += ' AND c.status = "Active"'; 
    
    sql += ' ORDER BY c.contract_date DESC, c.contract_no DESC';

    const [rows] = await db.execute(sql, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Contracts fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

// POST /api/contracts - Create new contract with auto-sequence
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      contract_date: _contract_date,
      contract_type,
      party_contract_number,
      party_id,
      item_id,
      broker_id,
      contract_rate,
      contract_quantity,
      ex_paint,
      for_field,
      contract_due_date: _contract_due_date,
      to_date,
      from_date,
      payment_terms,
      remark1,
      remark2
    } = body;

    // Support both legacy contract_due_date and new to_date field
    const contract_due_date = _contract_due_date ?? to_date ?? null;
    const contract_from_date = from_date ?? null;

    // Validation
    if (!contract_type) return NextResponse.json({ error: 'Contract Type is required' }, { status: 400 });
    if (!party_id) return NextResponse.json({ error: 'Party is required' }, { status: 400 });
    if (!item_id) return NextResponse.json({ error: 'Item is required' }, { status: 400 });
    // contract_rate, contract_quantity should be numbers
    
    const db = await getDb();

    // Generate Contract No (PO0001 or SO0001)
    // 1. Get max sequence for type
    const prefix = contract_type === 'Purchase Order' ? 'PO' : 'SO';
    const [maxRows] = await db.execute(
      'SELECT contract_no FROM contracts WHERE contract_type = ? ORDER BY contract_id DESC LIMIT 1', 
      [contract_type]
    );

    let nextNum = 1;
    if (maxRows.length > 0) {
      const lastNo = maxRows[0].contract_no; // e.g. PO0005
      const numPart = parseInt(lastNo.replace(prefix, ''), 10);
      if (!isNaN(numPart)) {
        nextNum = numPart + 1;
      }
    }
    
    const contract_no = `${prefix}${String(nextNum).padStart(4, '0')}`;
    
    // Avoid new Date() timezone shift for YYYY-MM-DD strings
    const cleanDate = (d) => {
      if (!d) return null;
      if (typeof d === 'string') return d.split('T')[0];
      try { return d.toISOString().split('T')[0]; } catch(e) { return null; }
    };

    const d = new Date();
    const contract_date = _contract_date ? cleanDate(_contract_date) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Server-side Calculation & Validation for Quantity
    const cQty = parseFloat(contract_quantity || 0);
    const rQty = parseFloat(body.rec_qty || 0); // Should be 0 on create usually, but safer
    const sQty = parseFloat(body.settal_qty || 0); // Should be 0 on create usually

    if (rQty + sQty > cQty) {
        return NextResponse.json({ error: 'Received + Settled Quantity cannot exceed Contract Quantity' }, { status: 400 });
    }

    const pending_qty = Math.max(0, cQty - rQty - sQty);
    
    // Ensure Ex_Plant / For Mutual Exclusion (though UI handles it, nice to have)
    // If both sent, we could error or prioritize. Let's trust the input but ensure they are saved.

    // Ensure Ex_Plant / For Mutual Exclusion (though UI handles it, nice to have)
    // If both sent, we could error or prioritize. Let's trust the input but ensure they are saved.

    const [result] = await db.execute(
      `INSERT INTO contracts (
        contract_type, contract_no, contract_date, party_contract_number, 
        party_id, item_id, broker_id, contract_rate, contract_quantity, 
        rec_qty, settal_qty, pending_qty, contract_status, 
        ex_paint, for_field, contract_due_date, contract_from_date, payment_terms, remark1, remark2, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        contract_type,
        contract_no,
        contract_date,
        party_contract_number || null,
        party_id,
        item_id,
        broker_id || null, // Optional broker
        contract_rate,
        contract_quantity,
        rQty,
        sQty,
        pending_qty,
        ex_paint || null,
        for_field || null,
        cleanDate(contract_due_date),
        cleanDate(contract_from_date),
        payment_terms || null,
        remark1 || null,
        remark2 || null
      ]
    );

    return NextResponse.json({ success: true, contract_id: result.insertId, contract_no });
  } catch (err) {
    console.error('Contract create error:', err);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
