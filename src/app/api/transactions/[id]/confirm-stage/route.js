import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

/* ======================
   AUTH
====================== */
function getUser(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') return null;
  try {
    const decoded = jwt.verify(token, secret || 'dev-only-fallback-secret');
    return decoded; // Returns { userId, roleId ... }
  } catch {
    return null;
  }
}

// const STAGE_COLUMNS = {
//   parking: { col: "parking_confirmed_at", statusText: "Parking Confirmed" },
//   gate_in: { col: "gate_in_at", statusText: "Gate In Completed" },
//   first_weighbridge: {
//     col: "first_weigh_at",
//     statusText: "First Weighbridge Completed",
//   },
//   campus_in: { col: "campus_in_at", statusText: "Campus In Completed" },
//   campus_out: { col: "campus_out_at", statusText: "Campus Out Completed" },
//   second_weighbridge: {
//     col: "second_weigh_at",
//     statusText: "Second Weighbridge Completed",
//   },
//   gate_pass: {
//     col: "gate_pass_finalized_at",
//     statusText: "Gate Pass Finalized",
//   },
//   gate_out: {
//     col: "gate_out_at",
//     statusText: "Transaction Closed",
//     alsoSet: "closed_at",
//   },
// };


const STAGE_COLUMNS = {
  parking: {
    col: "parking_confirmed_at",
    confirmedBy: "parking_confirmed_by",
    stepStatus: "step1_status",
    statusText: "Parking Confirmed",
  },
  gate_in: {
    col: "gate_in_at",
    confirmedBy: "gate_in_confirmed_by",
    stepStatus: "step1_status",
    statusText: "Gate In Completed",
  },
  first_weighbridge: {
    col: "first_weigh_at",
    confirmedBy: "first_weigh_confirmed_by",
    stepStatus: "step2_status",
    statusText: "First Weighbridge Completed",
  },
  campus_in: {
    col: "campus_in_at",
    confirmedBy: "campus_in_confirmed_by",
    stepStatus: "step3_status",
    statusText: "Campus In Completed",
  },
  campus_out: {
    col: "campus_out_at",
    confirmedBy: "campus_out_confirmed_by",
    stepStatus: "step3_status",
    statusText: "Campus Out Completed",
  },
  second_weighbridge: {
    col: "second_weigh_at",
    confirmedBy: "second_weigh_confirmed_by",
    stepStatus: "step2_status",
    statusText: "Second Weighbridge Completed",
  },
  gate_pass: {
    col: "gate_pass_finalized_at",
    confirmedBy: "gate_pass_confirmed_by",
    stepStatus: "step2_status",
    statusText: "Gate Pass Finalized",
  },
  gate_out: {
    col: "gate_out_at",
    confirmedBy: "gate_out_confirmed_by",
    stepStatus: "step1_status",
    alsoSet: "closed_at",
    statusText: "Transaction Closed",
  },
};

/* ======================
   CONFIRM STAGE
====================== */
export async function POST(request, { params }) {
  try {
    const { id } = await params; // ✅ unwrap params
    const txnId = Number(id);

    const user = getUser(request);
    if (!user || user.userId === undefined) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    const body = await request.json();
    const { stage, first_weight, second_weight, remark2 } = body;

    // Define required permissions for each stage
    // Step 1: Gate
    const GATE_PERMS = ['create_transactions', 'confirm_stages'];
    // Step 2: Weighbridge
    const WEIGH_PERMS = ['weighbridge_access', 'add_weight_entries'];
    // Step 3: Yard
    const YARD_PERMS = ['confirm_stages'];

    const STAGE_EXPECTED_PERMS = {
      parking: GATE_PERMS,
      gate_in: GATE_PERMS,
      gate_out: GATE_PERMS,
      first_weighbridge: WEIGH_PERMS,
      second_weighbridge: WEIGH_PERMS,
      gate_pass: WEIGH_PERMS,
      campus_in: YARD_PERMS,
      campus_out: YARD_PERMS,
    };

    const requiredPerms = STAGE_EXPECTED_PERMS[stage] || [];
    const hasPermission = userPermissions.includes('*') || requiredPerms.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions to confirm this stage" },
        { status: 403 }
      );
    }

    if (!stage || !STAGE_COLUMNS[stage]) {
      return NextResponse.json(
        { error: "Invalid or missing stage" },
        { status: 400 }
      );
    }

    // db is already initialized above

    const [rows] = await db.execute(
      `SELECT transaction_id, transaction_type, first_weight, second_weight,
              parking_confirmed_at, gate_in_at, gate_out_at,
              first_weigh_at, second_weigh_at, gate_pass_finalized_at,
              campus_in_at, campus_out_at, is_damaged
       FROM transactions
       WHERE transaction_id = ?`,
      [txnId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const txn = rows[0];

    if (txn.is_damaged) {
      return NextResponse.json(
        { error: "This transaction is marked as Damaged and cannot proceed." },
        { status: 400 }
      );
    }
    const def = STAGE_COLUMNS[stage];
    const colVal = new Date().toISOString().slice(0, 19).replace("T", " ");
    const statusText = def.statusText;

    // Prevent reconfirmation of already confirmed stages
    const stageTimestampColumn = def.col;
    if (txn[stageTimestampColumn] !== null) {
      return NextResponse.json(
        { error: "Stage already confirmed" },
        { status: 400 }
      );
    }

    /* ===== First weigh ===== */
    if (stage === "first_weighbridge") {
      const fw =
        first_weight !== undefined && first_weight !== ""
          ? Number(first_weight)
          : null;

      await db.execute(
        `UPDATE transactions
         SET first_weight = COALESCE(?, first_weight),
             first_weigh_at = ?, first_weigh_confirmed_by = ?, current_status = ?, step2_status = ?
         WHERE transaction_id = ?`,
        [fw, colVal, userId, statusText, statusText, txnId]
      );
    } else if (stage === "second_weighbridge") {

    /* ===== Second weigh ===== */
      const sw =
        second_weight !== undefined && second_weight !== ""
          ? Number(second_weight)
          : null;

      const fw = txn.first_weight !== null ? Number(txn.first_weight) : null;

      if (sw !== null && fw !== null) {
        if (txn.transaction_type === "Loading" && fw >= sw) {
          return NextResponse.json(
            { error: "For Loading transaction, First Weighbridge weight must be LESS THAN Second Weighbridge weight." },
            { status: 400 }
          );
        }
        if (txn.transaction_type === "Unloading" && sw >= fw) {
           return NextResponse.json(
            { error: "For Unloading transaction, Second Weighbridge weight must be LESS THAN First Weighbridge weight." },
            { status: 400 }
          );
        }
      }

      const net = fw !== null && sw !== null ? Math.abs(sw - fw) : null;

      await db.execute(
        `UPDATE transactions
         SET second_weight = COALESCE(?, second_weight),
             net_weight = COALESCE(?, net_weight),
             second_weigh_at = ?, second_weigh_confirmed_by = ?, current_status = ?, step2_status = ?
         WHERE transaction_id = ?`,
        [sw, net, colVal, userId, statusText, statusText, txnId]
      );
    } else if (stage === "campus_out") {

    /* ===== Campus Out with remark2 ===== */
      await db.execute(
        `UPDATE transactions
         SET campus_out_at = ?, campus_out_confirmed_by = ?, current_status = ?, step3_status = ?, remark2 = COALESCE(?, remark2)
         WHERE transaction_id = ?`,
        [colVal, userId, statusText, statusText, remark2 || null, txnId]
      );
    } else if (def.alsoSet === "closed_at") {

    /* ===== Final close ===== */
      await db.execute(
        `UPDATE transactions
         SET gate_out_at = ?, gate_out_confirmed_by = ?, closed_at = ?, current_status = ?, step1_status = ?
         WHERE transaction_id = ?`,
        [colVal, userId, colVal, statusText, statusText, txnId]
      );
    } else {

    /* ===== Normal stages ===== */
      await db.execute(
  `UPDATE transactions
   SET ${def.col} = ?, ${def.confirmedBy} = ?, current_status = ?, ${def.stepStatus} = ?
   WHERE transaction_id = ?`,
  [colVal, userId, statusText, statusText, txnId]
);
    }

    /* ===== Return updated transaction ===== */
    const [updated] = await db.execute(
      `SELECT t.transaction_id, t.transaction_type, t.invoice_number, t.invoice_date, t.invoice_quantity,
              t.po_do_number, t.lr_number, t.mobile_number, t.remark1,t.remark2,
              t.first_weight, t.second_weight, t.net_weight,
              t.parking_confirmed_at, t.current_status, t.gate_in_at,
              t.first_weigh_at, t.second_weigh_at,
              t.campus_in_at, t.campus_out_at,
              t.gate_pass_finalized_at, t.gate_out_at,
              t.gate_pass_no, t.closed_at, t.created_at,
              tr.truck_no, p.party_name, i.item_name,
              trs.name AS transporter_name
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
    console.error("Confirm stage error:", err);
    return NextResponse.json(
      { error: "Failed to confirm stage" },
      { status: 500 }
    );
  }
}
