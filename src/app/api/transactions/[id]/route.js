import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

function getUser(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    return jwt.verify(token, secret || 'dev-only-fallback-secret');
  } catch {
    return null;
  }
}

function getUserId(request) {
  const user = getUser(request);
  return user ? user.userId : null;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params
    const db = await getDb();

    const [rows] = await db.execute(
      `SELECT 
         t.transaction_id,
         t.transaction_type,
         t.invoice_number,
         t.invoice_date,
         t.invoice_quantity,
         t.po_do_number,
         t.lr_number,
         t.mobile_number,
         t.remark1,
         t.remark2,
         t.rate,
         t.first_weight,
         t.second_weight,
         t.net_weight,
         t.parking_confirmed_at,
         t.parking_confirmed_by,
         t.current_status,
         t.gate_in_at,
         t.gate_in_confirmed_by,
         t.first_weigh_at,
         t.first_weigh_confirmed_by,
         t.second_weigh_at,
         t.second_weigh_confirmed_by,
         t.campus_in_at,
         t.campus_in_confirmed_by,
         t.campus_out_at,
         t.campus_out_confirmed_by,
         t.gate_pass_finalized_at,
         t.gate_pass_confirmed_by,
         t.gate_out_at,
         t.gate_out_confirmed_by,
         t.gate_pass_no,
         t.closed_at,
         t.created_at,
         t.is_damaged,
         t.damaged_at,
         t.damaged_by,
         t.damaged_reason,
         tr.truck_no,
         p.party_name,
         i.item_name,
         trs.name AS transporter_name,
         u_parking.full_name AS parking_confirmed_by_name,
         u_gate_in.full_name AS gate_in_confirmed_by_name,
         u_first_weigh.full_name AS first_weigh_confirmed_by_name,
         u_second_weigh.full_name AS second_weigh_confirmed_by_name,
         u_campus_in.full_name AS campus_in_confirmed_by_name,
         u_campus_out.full_name AS campus_out_confirmed_by_name,
         u_gate_pass.full_name AS gate_pass_confirmed_by_name,
         u_gate_out.full_name AS gate_out_confirmed_by_name,
         u_damage.full_name AS damaged_by_name
       FROM transactions t
       JOIN trucks tr ON t.truck_id = tr.truck_id
       JOIN parties p ON t.party_id = p.party_id
       JOIN items i ON t.item_id = i.item_id
       JOIN transporters trs ON t.transporter_id = trs.transporter_id
       LEFT JOIN users u_parking ON t.parking_confirmed_by = u_parking.user_id
       LEFT JOIN users u_gate_in ON t.gate_in_confirmed_by = u_gate_in.user_id
       LEFT JOIN users u_first_weigh ON t.first_weigh_confirmed_by = u_first_weigh.user_id
       LEFT JOIN users u_second_weigh ON t.second_weigh_confirmed_by = u_second_weigh.user_id
       LEFT JOIN users u_campus_in ON t.campus_in_confirmed_by = u_campus_in.user_id
       LEFT JOIN users u_campus_out ON t.campus_out_confirmed_by = u_campus_out.user_id
       LEFT JOIN users u_gate_pass ON t.gate_pass_confirmed_by = u_gate_pass.user_id
       LEFT JOIN users u_gate_out ON t.gate_out_confirmed_by = u_gate_out.user_id
       LEFT JOIN users u_damage ON t.damaged_by = u_damage.user_id
       WHERE t.transaction_id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = rows[0];

    // Add stage-wise approval details for UI
    transaction.stages = {
      parking: {
        confirmed: transaction.parking_confirmed_at !== null,
        confirmed_at: transaction.parking_confirmed_at,
        confirmed_by: transaction.parking_confirmed_by,
        confirmed_by_name: transaction.parking_confirmed_by_name,
      },
      gate_in: {
        confirmed: transaction.gate_in_at !== null,
        confirmed_at: transaction.gate_in_at,
        confirmed_by: transaction.gate_in_confirmed_by,
        confirmed_by_name: transaction.gate_in_confirmed_by_name,
      },
      first_weighbridge: {
        confirmed: transaction.first_weigh_at !== null,
        confirmed_at: transaction.first_weigh_at,
        confirmed_by: transaction.first_weigh_confirmed_by,
        confirmed_by_name: transaction.first_weigh_confirmed_by_name,
      },
      second_weighbridge: {
        confirmed: transaction.second_weigh_at !== null,
        confirmed_at: transaction.second_weigh_at,
        confirmed_by: transaction.second_weigh_confirmed_by,
        confirmed_by_name: transaction.second_weigh_confirmed_by_name,
      },
      gate_pass: {
        confirmed: transaction.gate_pass_finalized_at !== null,
        confirmed_at: transaction.gate_pass_finalized_at,
        confirmed_by: transaction.gate_pass_confirmed_by,
        confirmed_by_name: transaction.gate_pass_confirmed_by_name,
      },
      campus_in: {
        confirmed: transaction.campus_in_at !== null,
        confirmed_at: transaction.campus_in_at,
        confirmed_by: transaction.campus_in_confirmed_by,
        confirmed_by_name: transaction.campus_in_confirmed_by_name,
      },
      campus_out: {
        confirmed: transaction.campus_out_at !== null,
        confirmed_at: transaction.campus_out_at,
        confirmed_by: transaction.campus_out_confirmed_by,
        confirmed_by_name: transaction.campus_out_confirmed_by_name,
      },
      gate_out: {
        confirmed: transaction.gate_out_at !== null,
        confirmed_at: transaction.gate_out_at,
        confirmed_by: transaction.gate_out_confirmed_by,
        confirmed_by_name: transaction.gate_out_confirmed_by_name,
      },
    };

    return NextResponse.json(transaction);
  } catch (err) {
    console.error("Transaction fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    const {
      transaction_type,
      truck_no,
      party_id,
      item_id,
      transporter_id,
      invoice_number,
      invoice_date,
      invoice_quantity,
      po_do_number,
      lr_number,
      mobile_number,
      remark1,
      remark2,
      rate,
    } = body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    // Handle truck_no -> truck_id conversion if truck_no is provided
    if (truck_no !== undefined) {
      let truckId;
      const [truckRows] = await db.execute('SELECT truck_id FROM trucks WHERE truck_no = ?', [truck_no.trim()]);
      if (truckRows.length > 0) {
        truckId = truckRows[0].truck_id;
      } else {
        // Create new truck if it doesn't exist
        const transporterId = transporter_id || null;
        const [ins] = await db.execute(
          'INSERT INTO trucks (truck_no, transporter_id) VALUES (?, ?)',
          [truck_no.trim(), transporterId]
        );
        truckId = ins.insertId;
      }
      updates.push('truck_id = ?');
      values.push(truckId);
    }

    if (transaction_type !== undefined) {
      updates.push('transaction_type = ?');
      values.push(transaction_type === 'Unloading' ? 'Unloading' : 'Loading');
    }
    if (party_id !== undefined) {
      updates.push('party_id = ?');
      values.push(Number(party_id));
    }
    if (item_id !== undefined) {
      updates.push('item_id = ?');
      values.push(Number(item_id));
    }
    if (transporter_id !== undefined) {
      updates.push('transporter_id = ?');
      values.push(Number(transporter_id));
    }
    if (invoice_number !== undefined) {
      updates.push('invoice_number = ?');
      values.push(invoice_number);
    }
    if (invoice_date !== undefined) {
      updates.push('invoice_date = ?');
      values.push(invoice_date);
    }
    if (invoice_quantity !== undefined) {
      updates.push('invoice_quantity = ?');
      values.push(parseFloat(invoice_quantity) || 0);
    }
    if (po_do_number !== undefined) {
      updates.push('po_do_number = ?');
      values.push(po_do_number || null);
    }
    if (lr_number !== undefined) {
      updates.push('lr_number = ?');
      values.push(lr_number || null);
    }
    if (mobile_number !== undefined) {
      updates.push('mobile_number = ?');
      values.push(mobile_number);
    }
    if (remark1 !== undefined) {
      updates.push('remark1 = ?');
      values.push(remark1 || null);
    }
    if (remark2 !== undefined) {
      updates.push('remark2 = ?');
      values.push(remark2 || null);
    }
    if (rate !== undefined) {
      updates.push('rate = ?');
      values.push(parseFloat(rate) || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(Number(id));

    await db.execute(
      `UPDATE transactions SET ${updates.join(', ')} WHERE transaction_id = ?`,
      values
    );

    return NextResponse.json({ success: true, message: 'Transaction updated successfully' });
  } catch (err) {
    console.error('Transaction update error:', err);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (['Manager', 'Logistics Manager', 'Contract Manager', 'View Only Admin', 'Viewer'].includes(user.roleName)) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to delete" }, { status: 403 });
    }

    const userId = user.userId;

    const { id } = await params;
    const db = await getDb();

    // Check if transaction exists
    const [rows] = await db.execute(
      'SELECT transaction_id FROM transactions WHERE transaction_id = ?',
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete transaction
    await db.execute('DELETE FROM transactions WHERE transaction_id = ?', [Number(id)]);

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Transaction delete error:', err);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
