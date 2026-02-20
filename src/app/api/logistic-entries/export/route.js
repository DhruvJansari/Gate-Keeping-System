import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const db = await getDb();

    // Reconstruct the same query logic as the list API
    let query = "SELECT * FROM logistic_entries WHERE 1=1";
    const params = [];

    const consignor = searchParams.get("consignor");
    if (consignor) {
        query += " AND consignor_name = ?";
        params.push(consignor);
    }

    const consignee = searchParams.get("consignee");
    if (consignee) {
        query += " AND consignee_name = ?";
        params.push(consignee);
    }

    const truck_no = searchParams.get("truck_no");
    if (truck_no) {
        query += " AND truck_no = ?";
        params.push(truck_no);
    }

    const product = searchParams.get("product");
    if (product) {
        query += " AND product = ?";
        params.push(product);
    }

    const search = searchParams.get("search");
    if (search) {
        query += " AND (consignor_name LIKE ? OR consignee_name LIKE ? OR truck_no LIKE ? OR product LIKE ? OR consignor_address LIKE ? OR consignee_address LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Date Filtering for Export
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (from && to) {
        query += " AND DATE(entry_date) BETWEEN ? AND ?";
        params.push(from, to);
    } else if (from) {
        query += " AND DATE(entry_date) >= ?";
        params.push(from);
    } else if (to) {
        query += " AND DATE(entry_date) <= ?";
        params.push(to);
    } else {
        // Default to TODAY if no date filter is applied
        query += " AND DATE(entry_date) = CURDATE()";
    }

    query += " ORDER BY created_at DESC";

    const [entries] = await db.execute(query, params);

    // Convert to CSV
    const headers = [
        "Logistic ID", "Date", "Consignor", "Consignee", "Truck No", "Product", 
        "Gross Wt", "Tare Wt", "Net Wt", "Rate", "Amount", "Status",
        "Loading Site", "Loading In", "Loading Out", 
        "Unloading Site", "Unloading In", "Unloading Out",
        "Deduction", "Net Amount", "Rec Amount", "Rec Date", 
        "Pay via Bank", "Bank Note", "Pay via Cash", "Cash Note",
        "Expense", "Advance", "Diesel Ltr", "Diesel Rate", "Unloading Wt", "Deduction 2", "Holtage", "Start KM", "End KM"
    ];

    const csvRows = [headers.join(",")];

    for (const row of entries) {
        const values = [
            row.logistic_id,
           `"${new Date(row.entry_date).toLocaleDateString()}"`,
            `"${row.consignor_name || ''}"`,
            `"${row.consignee_name || ''}"`,
            `"${row.truck_no || ''}"`,
            `"${row.product || ''}"`,
            row.gross_weight || 0,
            row.tare_weight || 0,
            row.net_weight || 0,
            row.rate || 0,
            row.amounts || 0,
            `"${row.status || ''}"`,
            row.loading_site_at ? `"${new Date(row.loading_site_at).toLocaleString()}"` : "",
            row.loading_point_in_at ? `"${new Date(row.loading_point_in_at).toLocaleString()}"` : "",
            row.loading_point_out_at ? `"${new Date(row.loading_point_out_at).toLocaleString()}"` : "",
            row.unloading_site_at ? `"${new Date(row.unloading_site_at).toLocaleString()}"` : "",
            row.unloading_point_in_at ? `"${new Date(row.unloading_point_in_at).toLocaleString()}"` : "",
            row.unloading_point_out_at ? `"${new Date(row.unloading_point_out_at).toLocaleString()}"` : "",
            // Financials & Ops
            row.deduction || 0,
            row.net_amount || 0,
            row.rec_amount || 0,
            row.rec_date ? `"${new Date(row.rec_date).toLocaleDateString()}"` : "",
            row.payment_rec_ac ? "Yes" : "No",
            `"${row.payment_rec_ac_note || ''}"`,
            row.payment_cash ? "Yes" : "No",
            `"${row.payment_cash_note || ''}"`,
            row.expense || 0,
            row.advance || 0,
            row.diesel_ltr || 0,
            row.diesel_rate || 0,
            row.unloading_wt || 0,
            row.deduction_2 || 0,
            row.holtage || 0,
            row.start_km || 0,
            row.end_km || 0
        ];
        csvRows.push(values.join(","));
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="logistic-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
