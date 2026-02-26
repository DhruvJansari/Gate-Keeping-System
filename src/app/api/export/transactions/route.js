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
    const item = searchParams.get('item');

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
    if (item) { sql += ' AND i.item_name = ?'; params.push(item); }
    sql += ' ORDER BY t.transaction_id ASC';

    const [rows] = await db.execute(sql, params);

    // ── Vertical Format ──────────────────────────────────────────
    // Row 1 = Label row, Cols B, C, D … = one transaction each
    // Labels in Column A (index 0)
    const LABELS = [
      'Item:',
      'Truck No:',
      'Party Name:',
      'Invoice No',
      'Invoice Date',
      'Invoice Qty',
      'PO / Do No:',
      'Transporter:',
      'Lr Number',
      'Mobile No',
      'Remark - 1',
      'Remark - 2',
      'First Weight',
      'Second Weight',
      'Net Weight',
    ];

    // Build array-of-arrays: each row starts with its label, then one value per transaction
    const aoa = LABELS.map((label) => [label]);

    rows.forEach((r) => {
      const invoiceNo = r.invoice_number || '';
      const poDoNo = r.po_do_number || '';
      const invoiceDate = r.invoice_date
        ? new Date(r.invoice_date).toLocaleDateString('en-IN')
        : '';

      const values = [
        r.item_name || '',
        r.truck_no || '',
        r.party_name || '',
        invoiceNo,
        invoiceDate,
        r.invoice_quantity != null ? Number(r.invoice_quantity) : '',
        poDoNo,
        r.transporter_name || '',
        r.lr_number || '',
        r.mobile_number || '',
        r.remark1 || '',
        r.remark2 || '',
        r.first_weight != null ? Math.round(parseFloat(r.first_weight)) : '',
        r.second_weight != null ? Math.round(parseFloat(r.second_weight)) : '',
        r.net_weight != null ? Math.round(parseFloat(r.net_weight)) : '',
      ];

      values.forEach((val, rowIdx) => {
        aoa[rowIdx].push(val);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
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
