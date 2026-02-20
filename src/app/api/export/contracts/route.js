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

    if (from) {
      sql += ' AND c.contract_date >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND c.contract_date <= ?';
      params.push(to);
    }
    if (type && type !== 'all') {
      sql += ' AND c.contract_type = ?';
      params.push(type);
    }
    if (item) {
      sql += ' AND i.item_name = ?';
       params.push(item);
    }

    sql += ' ORDER BY c.contract_date DESC, c.contract_no DESC';

    const [rows] = await db.execute(sql, params);
    
    const data = rows.map((r) => ({
      'Contract No': r.contract_no,
      'Type': r.contract_type,
      'Date': r.contract_date ? new Date(r.contract_date).toLocaleDateString('en-GB') : '',
      'Due Date': r.contract_due_date ? new Date(r.contract_due_date).toLocaleDateString('en-GB') : '—',
      'Party Name': r.party_name,
      'Party Contract No': r.party_contract_number || '—',
      'Item': r.item_name,
      'Broker': r.broker_name || '—',
      'Rate': r.contract_rate,
      'Contract Qty': r.contract_quantity,
      'Rec Qty': r.rec_qty,
      'Set Qty': r.settal_qty,
      'Pen Qty': r.pending_qty,
      'Status': r.contract_status,
      'Ex_Plant': r.ex_paint || '—',
      'For': r.for_field || '—',
      'Payment Terms': r.payment_terms || '—',
      'Remark 1': r.remark1 || '—',
      'Remark 2': r.remark2 || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contracts');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="contracts-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
