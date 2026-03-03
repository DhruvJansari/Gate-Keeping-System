import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';


// GET /api/contracts/[id] - Get single contract
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT 
        c.*, 
        p.party_name, 
        i.item_name, 
        b.broker_name 
      FROM contracts c
      LEFT JOIN parties p ON c.party_id = p.party_id
      LEFT JOIN items i ON c.item_id = i.item_id
      LEFT JOIN brokers b ON c.broker_id = b.broker_id
      WHERE c.contract_id = ?
    `, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Contract fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

// PUT /api/contracts/[id] - Update full contract
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      contract_date,
      party_id,
      item_id,
      broker_id,
      contract_rate,
      contract_quantity,
      rec_qty,
      settal_qty,
      pending_qty,
      contract_status,
      ex_paint,
      for_field,
      payment_terms,
      contract_due_date: _contract_due_date,
      to_date,
      from_date,
      party_contract_number,
      remark1
    } = body;

    // Support both legacy contract_due_date and new to_date / from_date fields
    const contract_due_date = _contract_due_date ?? to_date; // unchanged if omitted
    const contract_from_date = from_date; // unchanged if omitted

    const db = await getDb();
    
    // Validation: Check if exists
    const [check] = await db.execute('SELECT * FROM contracts WHERE contract_id = ?', [id]);
    if (check.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    const existing = check[0];

    // Auto-Calculate Pending & Validate
    const cQty = parseFloat(contract_quantity) || 0;
    const rQty = parseFloat(rec_qty) || 0;
    const sQty = parseFloat(settal_qty) || 0;

    if (rQty + sQty > cQty) {
        return NextResponse.json({ error: 'Received + Settled Quantity cannot exceed Contract Quantity' }, { status: 400 });
    }

    const newPendingQty = Math.max(0, cQty - rQty - sQty);

    // Avoid new Date() timezone shift for YYYY-MM-DD strings
    const cleanDate = (d) => {
      if (!d) return null;
      if (typeof d === 'string') return d.split('T')[0];
      try { return d.toISOString().split('T')[0]; } catch(e) { return null; }
    };

    await db.execute(`
      UPDATE contracts SET
        contract_date = ?,
        party_id = ?,
        item_id = ?,
        broker_id = ?,
        contract_rate = ?,
        contract_quantity = ?,
        rec_qty = ?,
        settal_qty = ?,
        pending_qty = ?,
        contract_status = ?,
        ex_paint = ?,
        for_field = ?,
        payment_terms = ?,
        contract_due_date = ?,
        contract_from_date = ?,
        party_contract_number = ?,
        remark1 = ?,
        updated_at = NOW()
      WHERE contract_id = ?
    `, [
      contract_date !== undefined ? cleanDate(contract_date) : existing.contract_date,
      party_id,
      item_id,
      broker_id || null,
      contract_rate,
      contract_quantity,
      rec_qty || 0,
      settal_qty || 0,
      newPendingQty,
      contract_status || 'Pending',
      ex_paint || null,
      for_field || null,
      payment_terms || null,
      contract_due_date !== undefined ? cleanDate(contract_due_date) : existing.contract_due_date,
      contract_from_date !== undefined ? cleanDate(contract_from_date) : existing.contract_from_date,
      party_contract_number || null,
      remark1 || null,
      id
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contract update error:', err);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

// PATCH /api/contracts/[id] - Update partial fields (Inline Edit)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    // Allowed fields for inline update
    const allowedFields = ['rec_qty', 'settal_qty', 'pending_qty', 'contract_status', 'remark1', 'payment_terms'];
    const updates = [];
    const values = [];

    // Fetch current state for calculation if needed
    let currentContract = null;
    if (body.rec_qty !== undefined || body.settal_qty !== undefined) {
        const [current] = await db.execute('SELECT contract_quantity, rec_qty, settal_qty FROM contracts WHERE contract_id = ?', [id]);
        if (current.length === 0) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
        currentContract = current[0];
    }

    // Logic for Quantity Update
    if (currentContract) {
        const cQty = parseFloat(currentContract.contract_quantity) || 0;
        const rQty = body.rec_qty !== undefined ? parseFloat(body.rec_qty) : parseFloat(currentContract.rec_qty);
        const sQty = body.settal_qty !== undefined ? parseFloat(body.settal_qty) : parseFloat(currentContract.settal_qty);
        
        if (rQty + sQty > cQty) {
            return NextResponse.json({ error: 'Received + Settled Quantity cannot exceed Contract Quantity' }, { status: 400 });
        }
        
        const pQty = Math.max(0, cQty - rQty - sQty);
        
        // Add pending_qty to update list manually
        updates.push(`pending_qty = ?`);
        values.push(pQty);
    }

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        // Skip pending_qty if we calculated it, or allow if logic permits (but we enforce recalc)
        if (key === 'pending_qty' && currentContract) continue; 
        
        updates.push(`${key} = ?`);
        // Ensure undefined becomes null for SQL
        values.push(value === undefined ? null : value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);

    await db.execute(`UPDATE contracts SET ${updates.join(', ')}, updated_at = NOW() WHERE contract_id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contract patch error:', err);
    return NextResponse.json({ error: body.contract_status ? 'Failed to update Status' : 'Failed to update Quantity' }, { status: 500 });
  }
}

// DELETE /api/contracts/[id] - Delete contract
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const db = await getDb();
    
    await db.execute('DELETE FROM contracts WHERE contract_id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contract delete error:', err);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
