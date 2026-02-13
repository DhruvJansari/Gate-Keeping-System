import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type');

    let sql = `SELECT 
      t.transaction_id, t.gate_pass_no, t.transaction_type, t.invoice_number, t.invoice_date,
      t.invoice_quantity, t.po_do_number, t.lr_number, t.mobile_number, t.remark1, t.remark2,
      t.current_status, t.first_weight, t.second_weight, t.net_weight,
      t.gate_in_at, t.gate_out_at, t.first_weigh_at, t.second_weigh_at,
      t.campus_in_at, t.campus_out_at, t.gate_pass_finalized_at, t.created_at,
      tr.truck_no, p.party_name, i.item_name, trs.name AS transporter_name
      FROM transactions t
      JOIN trucks tr ON t.truck_id = tr.truck_id
      JOIN parties p ON t.party_id = p.party_id
      JOIN items i ON t.item_id = i.item_id
      JOIN transporters trs ON t.transporter_id = trs.transporter_id
      WHERE 1=1`;
    const params = [];
    if (from) { sql += ' AND DATE(t.created_at) >= ?'; params.push(from); }
    if (to) { sql += ' AND DATE(t.created_at) <= ?'; params.push(to); }
    if (type && type !== 'all') { sql += ' AND t.transaction_type = ?'; params.push(type); }
    sql += ' ORDER BY t.transaction_id DESC';

    const [rows] = await db.execute(sql, params);
    const data = rows.map((r) => ({
      'TXN NO': r.gate_pass_no || `TRN${String(r.transaction_id).padStart(5, '0')}`,
      'Truck No': r.truck_no,
      'Item': r.item_name,
      'Party': r.party_name,
      'Type': r.transaction_type,
      'Invoice No': r.invoice_number,
      'Invoice Date': r.invoice_date,
      'Qty': r.invoice_quantity,
      'Status': r.current_status,
      'Remark 1': r.remark1 || '',
      'Remark 2': r.remark2 || '',
      'First Weight': r.first_weight ? parseFloat(r.first_weight) : '',
      'Second Weight': r.second_weight ? parseFloat(r.second_weight) : '',
      'Net Weight': r.net_weight ? parseFloat(r.net_weight) : '',
      'Created': r.created_at,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="gate-transactions-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
