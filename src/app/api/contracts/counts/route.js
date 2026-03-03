import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Perform all-time counts without any date filtering
    const [totalRows] = await db.execute('SELECT COUNT(*) as cnt FROM contracts');
    const [poRows] = await db.execute('SELECT COUNT(*) as cnt FROM contracts WHERE contract_type = "Purchase Order"');
    const [soRows] = await db.execute('SELECT COUNT(*) as cnt FROM contracts WHERE contract_type = "Sales Order"');
    const [pendingRows] = await db.execute('SELECT COUNT(*) as cnt FROM contracts WHERE contract_status = "Pending"');
    const [completedRows] = await db.execute('SELECT COUNT(*) as cnt FROM contracts WHERE contract_status = "Complete"');

    return NextResponse.json({
      total: totalRows[0].cnt || 0,
      po: poRows[0].cnt || 0,
      so: soRows[0].cnt || 0,
      pending: pendingRows[0].cnt || 0,
      completed: completedRows[0].cnt || 0
    });
  } catch (err) {
    console.error('Contract counts get error:', err);
    return NextResponse.json({ error: 'Failed to fetch contract counts' }, { status: 500 });
  }
}
