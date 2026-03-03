import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

// Reusing same minimal auth from other routes
function getUser(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    return jwt.verify(token, secret || 'dev-only-fallback-secret');
  } catch {
    return null;
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const txnId = Number(id);

    const user = getUser(request);
    if (!user || user.userId === undefined) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: "A reason is required to mark as damaged" }, { status: 400 });
    }

    const db = await getDb();

    // Verify transaction exists and is active
    const [rows] = await db.execute(
      `SELECT transaction_id, closed_at, is_damaged FROM transactions WHERE transaction_id = ?`,
      [txnId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (rows[0].is_damaged) {
      return NextResponse.json({ error: "Transaction is already marked as damaged" }, { status: 400 });
    }
    
    if (rows[0].closed_at) {
      return NextResponse.json({ error: "Cannot mark a closed transaction as damaged" }, { status: 400 });
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // Update to damaged flow
    // Set is_damaged = 1, explicitly set current_status to 'Damaged' and closed_at = NOW() 
    await db.execute(
      `UPDATE transactions
       SET is_damaged = 1,
           damaged_by = ?,
           damaged_at = ?,
           damaged_reason = ?,
           current_status = 'Damaged',
           closed_at = ?
       WHERE transaction_id = ?`,
      [user.userId, now, reason.trim(), now, txnId]
    );

    // Fetch and return the updated transaction
    const [updated] = await db.execute(
      `SELECT t.*, tr.truck_no, p.party_name, i.item_name, trs.name AS transporter_name
       FROM transactions t
       JOIN trucks tr ON t.truck_id = tr.truck_id
       JOIN parties p ON t.party_id = p.party_id
       JOIN items i ON t.item_id = i.item_id
       JOIN transporters trs ON t.transporter_id = trs.transporter_id
       WHERE t.transaction_id = ?`,
      [txnId]
    );

    return NextResponse.json({
      success: true,
      transaction: updated[0],
    });

  } catch (err) {
    console.error("Mark Damaged error:", err);
    return NextResponse.json(
      { error: "Failed to mark transaction as damaged" },
      { status: 500 }
    );
  }
}
