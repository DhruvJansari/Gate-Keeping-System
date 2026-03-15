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
    const statusType = searchParams.get('statusType'); // 'pending' or 'damaged'
    const search = searchParams.get('search');
    const stage = searchParams.get('stage');

    let sql = `SELECT 
      t.transaction_id, t.gate_pass_no, t.transaction_type, t.invoice_number, t.invoice_date,
      t.invoice_quantity, t.po_do_number, t.lr_number, t.mobile_number, t.remark1, t.remark2,
      t.current_status, t.first_weight, t.second_weight, t.net_weight, t.rate,
      t.parking_confirmed_at, t.gate_in_at, t.first_weigh_at, t.second_weigh_at,
      t.campus_in_at, t.campus_out_at, t.gate_pass_finalized_at, t.gate_out_at, t.created_at,
      tr.truck_no, p.party_name, i.item_name, trs.name AS transporter_name
      FROM transactions t
      JOIN trucks tr ON t.truck_id = tr.truck_id
      JOIN parties p ON t.party_id = p.party_id
      JOIN items i ON t.item_id = i.item_id
      JOIN transporters trs ON t.transporter_id = trs.transporter_id
      WHERE 1=1`;
      
    const params = [];
    if (statusType !== 'pending' && statusType !== 'damaged') {
      if (from) { sql += ' AND DATE(t.created_at) >= ?'; params.push(from); }
      if (to) { sql += ' AND DATE(t.created_at) <= ?'; params.push(to); }
    }
    if (type && type !== 'all') { sql += ' AND t.transaction_type = ?'; params.push(type); }
    if (item) { sql += ' AND i.item_name = ?'; params.push(item); }
    if (statusType === 'damaged') {
      sql += ' AND t.is_damaged = 1';
    } else if (statusType === 'pending') {
      sql += ' AND t.gate_out_at IS NULL AND t.is_damaged = 0 AND t.closed_at IS NULL';
    }

    if (search) {
      sql += ` AND (
        tr.truck_no LIKE ? OR 
        p.party_name LIKE ? OR 
        i.item_name LIKE ? OR 
        t.invoice_number LIKE ? OR 
        t.po_do_number LIKE ?
      )`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (stage) {
      if (stage === 'closed') {
        sql += ' AND t.closed_at IS NOT NULL';
      } else {
        switch(stage) {
          case 'parking': sql += ' AND t.parking_confirmed_at IS NOT NULL'; break;
          case 'gate_in': sql += ' AND t.gate_in_at IS NOT NULL'; break;
          case 'first_weighbridge': sql += ' AND t.first_weigh_at IS NOT NULL'; break;
          case 'campus_in': sql += ' AND t.campus_in_at IS NOT NULL'; break;
          case 'campus_out': sql += ' AND t.campus_out_at IS NOT NULL'; break;
          case 'second_weighbridge': sql += ' AND t.second_weigh_at IS NOT NULL'; break;
          case 'gate_pass': sql += ' AND t.gate_pass_finalized_at IS NOT NULL'; break;
          case 'gate_out': sql += ' AND t.gate_out_at IS NOT NULL'; break;
        }
      }
    }
    
    sql += ' ORDER BY t.transaction_id ASC';

    const [rows] = await db.execute(sql, params);

    // ── Horizontal Format (Standard Output) ──────────────────────
    const LABELS = [
      'Transaction ID',
      'Type',
      'Truck Number',
      'Party Name',
      'Item Name',
      'Transporter',
      'PO/DO Number',
      'LR Number',
      'Invoice Number',
      'Invoice Date',
      'Invoice Quantity',
      'Rate',
      'Mobile Number',
      'Remark 1',
      'Remark 2',
      'First Weight',
      'Second Weight',
      'Net Weight',
      'Parking Confirmed At',
      'Gate In At',
      'First Weigh At',
      'Second Weigh At',
      'Campus In At',
      'Campus Out At',
      'Gate Pass Finalized At',
      'Gate Out At',
      'Created Date',
      'Status'
    ];

    const aoa = [LABELS];

    rows.forEach((r) => {
      const invoiceDate = r.invoice_date ? new Date(r.invoice_date).toLocaleDateString('en-IN') : '';
      const createdDate = r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '';
      const formatTime = (iso) => iso ? new Date(iso).toLocaleString('en-IN') : '';

      const values = [
        r.transaction_id || '',
        r.transaction_type || '',
        r.truck_no || '',
        r.party_name || '',
        r.item_name || '',
        r.transporter_name || '',
        r.po_do_number || '',
        r.lr_number || '',
        r.invoice_number || '',
        invoiceDate,
        r.invoice_quantity != null ? Number(r.invoice_quantity) : '',
        r.rate != null ? Number(r.rate) : '',
        r.mobile_number || '',
        r.remark1 || '',
        r.remark2 || '',
        r.first_weight != null ? Math.round(parseFloat(r.first_weight)) : '',
        r.second_weight != null ? Math.round(parseFloat(r.second_weight)) : '',
        r.net_weight != null ? Math.round(parseFloat(r.net_weight)) : '',
        formatTime(r.parking_confirmed_at),
        formatTime(r.gate_in_at),
        formatTime(r.first_weigh_at),
        formatTime(r.second_weigh_at),
        formatTime(r.campus_in_at),
        formatTime(r.campus_out_at),
        formatTime(r.gate_pass_finalized_at),
        formatTime(r.gate_out_at),
        createdDate,
        r.current_status || ''
      ];

      aoa.push(values);
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
