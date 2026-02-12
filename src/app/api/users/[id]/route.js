import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

/* ======================
   AUTH HELPERS
====================== */
function getCurrentUser(request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret-change-me"
    );
  } catch {
    return null;
  }
}

function requireAdmin(current) {
  return current && current.roleName === "Admin";
}

/* ======================
   GET SINGLE USER
====================== */
export async function GET(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = await getDb();

    const [rows] = await db.execute(
      `SELECT user_id, username, email, full_name, role_id, is_active, created_at
       FROM users WHERE user_id = ?`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("User fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/* ======================
   UPDATE USER
====================== */
export async function PUT(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();

    const { username, email, password, full_name, role_id, is_active } = body;

    if (!username?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Username and email are required" },
        { status: 400 }
      );
    }

    if (!role_id) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const db = await getDb();
    const active = is_active === false || is_active === 0 ? 0 : 1;

    /* ===== With password change ===== */
    if (password && password.trim()) {
      const passwordHash = await bcrypt.hash(password, 12);

      const [result] = await db.execute(
        `UPDATE users 
         SET username = ?, email = ?, password_hash = ?, role_id = ?, full_name = ?, is_active = ?
         WHERE user_id = ?`,
        [
          username.trim(),
          email.trim(),
          passwordHash,
          Number(role_id),
          full_name?.trim() || null,
          active,
          Number(id),
        ]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else {

    /* ===== Without password change ===== */
      const [result] = await db.execute(
        `UPDATE users 
         SET username = ?, email = ?, role_id = ?, full_name = ?, is_active = ?
         WHERE user_id = ?`,
        [
          username.trim(),
          email.trim(),
          Number(role_id),
          full_name?.trim() || null,
          active,
          Number(id),
        ]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 400 }
      );
    }

    console.error("User update error:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

/* ======================
   DELETE USER
====================== */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params; // ✅ FIX

    const current = getCurrentUser(request);
    if (!current)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!requireAdmin(current))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const targetId = Number(id);

    if (current.userId === targetId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const [result] = await db.execute("DELETE FROM users WHERE user_id = ?", [
      targetId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("User delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
