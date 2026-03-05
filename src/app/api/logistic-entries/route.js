import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET: List all logistic entries
// GET: List all logistic entries with filters and search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    const db = await getDb();

    // If type is 'filters', return unique values for dropdowns
    if (type === 'filters') {
        const [consignors] = await db.execute("SELECT DISTINCT consignor_name FROM logistic_entries WHERE consignor_name IS NOT NULL ORDER BY consignor_name");
        const [consignees] = await db.execute("SELECT DISTINCT consignee_name FROM logistic_entries WHERE consignee_name IS NOT NULL ORDER BY consignee_name");
        const [trucks] = await db.execute("SELECT DISTINCT truck_no FROM logistic_entries WHERE truck_no IS NOT NULL ORDER BY truck_no");
        const [products] = await db.execute("SELECT DISTINCT product FROM logistic_entries WHERE product IS NOT NULL ORDER BY product");
        const [drivers] = await db.execute(`
            SELECT DISTINCT d.driver_id, d.driver_name
            FROM logistic_entries le
            JOIN drivers d ON le.driver_id = d.driver_id
            WHERE le.driver_id IS NOT NULL
            ORDER BY d.driver_name
        `);
        
        return NextResponse.json({
            consignors: consignors.map(c => c.consignor_name),
            consignees: consignees.map(c => c.consignee_name),
            trucks: trucks.map(t => t.truck_no),
            products: products.map(p => p.product),
            drivers: drivers.map(d => ({ driver_id: d.driver_id, driver_name: d.driver_name }))
        });
    }

    // List logic with filters
    let query = `
      SELECT
        le.*,
        d.driver_id   AS driver_id,
        d.driver_name AS driver_name,
        d.mobile      AS driver_mobile,
        d.adhar_number AS adhar_number,
        d.licence     AS licence,
        d.licence_expiry AS licence_expiry
      FROM logistic_entries le
      LEFT JOIN drivers d ON le.driver_id = d.driver_id
      WHERE 1=1
    `;
    const params = [];

    const consignor = searchParams.get("consignor");
    if (consignor) {
        query += " AND le.consignor_name = ?";
        params.push(consignor);
    }

    const consignee = searchParams.get("consignee");
    if (consignee) {
        query += " AND le.consignee_name = ?";
        params.push(consignee);
    }

    const truck_no = searchParams.get("truck_no");
    if (truck_no) {
        query += " AND le.truck_no = ?";
        params.push(truck_no);
    }

    const product = searchParams.get("product");
    if (product) {
        query += " AND le.product = ?";
        params.push(product);
    }

    const driver_id_filter = searchParams.get("driver_id");
    if (driver_id_filter) {
        query += " AND le.driver_id = ?";
        params.push(driver_id_filter);
    }

    const search = searchParams.get("search");
    if (search) {
        query += " AND (le.consignor_name LIKE ? OR le.consignee_name LIKE ? OR le.truck_no LIKE ? OR le.product LIKE ? OR le.consignor_address LIKE ? OR le.consignee_address LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Date Filtering
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
        query += " AND DATE(le.created_at) BETWEEN ? AND ?";
        params.push(from, to);
    } else if (from) {
        query += " AND DATE(le.created_at) >= ?";
        params.push(from);
    } else if (to) {
        query += " AND DATE(le.created_at) <= ?";
        params.push(to);
    }

    const status_filter = searchParams.get("status_filter");
    if (status_filter === "Pending") {
        query += ` AND (
            le.loading_site_at IS NULL OR 
            le.loading_point_in_at IS NULL OR 
            le.loading_point_out_at IS NULL OR 
            le.unloading_site_at IS NULL OR 
            le.unloading_point_in_at IS NULL OR 
            le.unloading_point_out_at IS NULL
        )`;
    } else if (status_filter === "Completed") {
        query += ` AND (
            le.loading_site_at IS NOT NULL AND 
            le.loading_point_in_at IS NOT NULL AND 
            le.loading_point_out_at IS NOT NULL AND 
            le.unloading_site_at IS NOT NULL AND 
            le.unloading_point_in_at IS NOT NULL AND 
            le.unloading_point_out_at IS NOT NULL
        )`;
    }

    const orderParam = searchParams.get("order");
    const sortDir = orderParam === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY le.logistic_id ${sortDir}`;

    const [entries] = await db.execute(query, params);
    return NextResponse.json(entries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new logistic entry (Step 1)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.truck_no || !body.product) {
      return NextResponse.json({ error: "Truck No and Product are required" }, { status: 400 });
    }

    const db = await getDb();

    // Generate next LR No (VL0001 format)
    let lr_no = 'VL0001';
    try {
      const [lrRows] = await db.execute(
        `SELECT lr_no FROM logistic_entries WHERE lr_no LIKE 'VL%' ORDER BY CAST(SUBSTRING(lr_no, 3) AS UNSIGNED) DESC LIMIT 1`
      );
      if (lrRows.length > 0 && lrRows[0].lr_no) {
        const lastNum = parseInt(lrRows[0].lr_no.replace(/^VL/, ''), 10);
        if (!isNaN(lastNum)) lr_no = 'VL' + String(lastNum + 1).padStart(4, '0');
      }
    } catch { /* column may not exist yet — fall back to VL0001 */ }

    // 1. Insert Logistic Entry
    const [result] = await db.execute(`
      INSERT INTO logistic_entries (
        lr_no,
        consignor_name, consignor_address, consignor_place, consignor_gst,
        consignee_name, consignee_address, consignee_place, consignee_gst,
        truck_no, driver_id, product,
        gross_weight, tare_weight, net_weight, rate, amounts,
        entry_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      lr_no,
      body.consignor_name || null,
      body.consignor_address || null,
      body.consignor_place || null,
      body.consignor_gst || null,
      body.consignee_name || null,
      body.consignee_address || null,
      body.consignee_place || null,
      body.consignee_gst || null,
      body.truck_no,
      body.driver_id || null,
      body.product,
      body.gross_weight || 0,
      body.tare_weight || 0,
      body.net_weight || 0,
      body.rate || 0,
      body.amounts || 0,
      body.entry_date || new Date().toISOString().slice(0, 19).replace('T', ' '),
      body.created_by || null
    ]);

    // 2. Auto-create Driver User if not exists
    try {
        const truckNo = body.truck_no.trim().toUpperCase();
        // Check if user exists
        const [existingUsers] = await db.execute("SELECT user_id FROM users WHERE username = ?", [truckNo]);
        
        if (existingUsers.length === 0) {
            // Get Driver Role ID
            const [roles] = await db.execute("SELECT role_id FROM roles WHERE name = 'Driver'");
            if (roles.length > 0) {
                const driverRoleId = roles[0].role_id;
                // Hash password (same as truck number)
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(truckNo, 10);
                
                await db.execute(`
                    INSERT INTO users (username, password_hash, email, full_name, role_id, is_active)
                    VALUES (?, ?, ?, ?, ?, 1)
                `, [
                    truckNo, 
                    hashedPassword, 
                    `driver_${truckNo.replace(/\s+/g, '')}@system.local`, // Dummy email
                    `Driver (${truckNo})`,
                    driverRoleId
                ]);
            }
        }
    } catch (userError) {
        console.error("Failed to auto-create driver user:", userError);
        // Don't fail the main request, just log it
    }

    return NextResponse.json({ 
      message: "Entry created successfully", 
      id: result.insertId 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
