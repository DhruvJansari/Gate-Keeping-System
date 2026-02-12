'use client';

import { useCallback } from 'react';
import { STAGES, getStageStatus } from '@/lib/stageUtils';

export function getGatePassHtml(transaction, options = {}) {
  const { forPrint = false } = options;
  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—');

  // Use remark1/remark2 directly from transaction if available
  const remark1 = transaction.remark1 || '';
  const remark2 = transaction.remark2 || '';

  // Mapping for confirmation details
  const confirmationMap = {
    parking: { label: 'Parking', userKey: 'parking_confirmed_by_name', dateKey: 'parking_confirmed_at' },
    gate_in: { label: 'Gate In', userKey: 'gate_in_confirmed_by_name', dateKey: 'gate_in_at' },
    first_weighbridge: { label: 'First Weighbridge', userKey: 'first_weigh_confirmed_by_name', dateKey: 'first_weigh_at' },
    campus_in: { label: 'Campus In', userKey: 'campus_in_confirmed_by_name', dateKey: 'campus_in_at' },
    campus_out: { label: 'Campus Out', userKey: 'campus_out_confirmed_by_name', dateKey: 'campus_out_at' },
    second_weighbridge: { label: 'Second Weighbridge', userKey: 'second_weigh_confirmed_by_name', dateKey: 'second_weigh_at' },
    gate_pass: { label: 'Gate Pass', userKey: 'gate_pass_confirmed_by_name', dateKey: 'gate_pass_finalized_at' },
    gate_out: { label: 'Gate Out', userKey: 'gate_out_confirmed_by_name', dateKey: 'gate_out_at' },
  };

  const status = getStageStatus(transaction);
  const completedCount = STAGES.filter((s) => status[s.key]).length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GATE PASS - ${txnNo(transaction)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 8pt; line-height: 1.3; padding: 5mm; background: white; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 5mm; position: relative; }
    .header { text-align: center; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 5px; }
    .logo { height: 60px; margin-bottom: 5px; max-width: 200px; object-fit: contain; }
    .header h1 { font-size: 16pt; font-weight: bold; margin-bottom: 2px; }
    .header-meta { font-size: 7pt; }
    .red-box { border: 1px solid #000; padding: 4px; margin-bottom: 4px; }
    .section-title { font-weight: bold; font-size: 9pt; margin-bottom: 4px; background: #f0f0f0; padding: 2px; border-bottom: 1px solid #ccc; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 7pt; }
    .info-table td { padding: 2px 4px; vertical-align: top; border: 1px solid #000; }
    .info-table .label { font-weight: bold; width: 35%; background: #f5f5f5; }
    .weights-row { display: flex; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .weights-row > div { flex: 1; min-width: 80px; border: 1px solid #000; padding: 6px; }
    .weight-box { text-align: center; padding: 8px; border: 1px solid #000; margin: 2px; }
    .weight-box .val { font-size: 12pt; font-weight: bold; }
    
    /* Stage Table Styles */
    .stage-table { width: 100%; border-collapse: collapse; font-size: 7pt; margin-top: 2px; }
    .stage-table th { background: #f5f5f5; font-weight: bold; text-align: left; padding: 3px; border: 1px solid #000; }
    .stage-table td { padding: 3px; border: 1px solid #000; }
    .stage-done { color: #166534; font-weight: bold; }
    .stage-pending { color: #737373; font-style: italic; }

    .footer { text-align: center; margin-top: 15px; font-size: 7pt; border-top: 1px solid #000; padding-top: 5px; }
    .signature { text-align: right; margin-top: 40px; font-size: 8pt; font-weight: bold; padding-right: 20px; }
    @media print { body { padding: 0; } .page { margin: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
        <h1>GATE PASS</h1>
        <div class="header-meta">
          Printed on: ${formatDateTime(new Date())}<br>
          (ORIGINAL FOR RECIPIENT)
        </div>
      </div>
      <table style="width: 100%; border: 1px solid #000;">
        <tr>
          <td style="width: 150px; padding: 5px; border: none; vertical-align: middle;">
             <img src="/logo.png" alt="VARPL Logo" class="logo" style="max-height: 80px; width: auto; object-fit: contain;">
          </td>
          <td style="padding: 5px; text-align: left; border: none; vertical-align: middle;">
            <div style="font-size: 14pt; font-weight: bold; margin-bottom: 5px;">VAISHNODEVI AGRO RESOURCES PRIVATE LIMITED</div>
            <div style="font-size: 8pt; margin-bottom: 2px;">SURVEY NO 317, NH-14, KANDLA RADHANPUR HIGHWAY, VILLAGE - NANI PIPALI,</div>
            <div style="font-size: 8pt; margin-bottom: 2px;">RADHANPUR - 385340</div>
            <div style="font-size: 8pt; font-weight: bold;">GSTIN: 24AAHCV4950E1ZD</div>
          </td>
        </tr>
      </table>
    </div>

    <div class="red-box">
      <strong>Gate Pass No.:</strong> ${txnNo(transaction)} &nbsp;|&nbsp;
      <strong>Date:</strong> ${formatDate(transaction.created_at)} &nbsp;|&nbsp;
      <strong>Type:</strong> ${transaction.transaction_type} (${transaction.transaction_type === 'Loading' ? 'Inward' : 'Outward'})
    </div>

    <div class="red-box">
      <div class="section-title">BASIC INFORMATION</div>
      <table class="info-table">
        <tr>
          <td class="label">Truck Number</td>
          <td>${transaction.truck_no}</td>
          <td class="label">Party Name</td>
          <td>${transaction.party_name}</td>
        </tr>
        <tr>
          <td class="label">Item</td>
          <td>${transaction.item_name || 'N/A'}</td>
          <td class="label">Transporter</td>
          <td>${transaction.transporter_name}</td>
        </tr>
        <tr>
          <td class="label">Mobile No</td>
          <td>${transaction.mobile_number}</td>
          <td class="label">LR No</td>
          <td>${transaction.lr_number || '—'}</td>
        </tr>
      </table>
    </div>

    <div class="red-box">
      <div class="section-title">INVOICE DETAILS</div>
      <table class="info-table">
        <tr>
          <td class="label">Invoice No</td>
          <td>${transaction.invoice_number}</td>
          <td class="label">Invoice Date</td>
          <td>${formatDate(transaction.invoice_date)}</td>
        </tr>
        <tr>
          <td class="label">Invoice Qty</td>
          <td>${transaction.invoice_quantity} units</td>
          <td class="label">PO/DO No</td>
          <td>${transaction.po_do_number || '—'}</td>
        </tr>
      </table>
    </div>

    <div class="red-box">
      <div class="section-title">WEIGHBRIDGE INFORMATION</div>
      <div class="weights-row">
        <div class="weight-box"><div>First Weight</div><div class="val">${transaction.first_weight ?? '—'}</div></div>
        <div class="weight-box"><div>Second Weight</div><div class="val">${transaction.second_weight ?? '—'}</div></div>
        <div class="weight-box"><div>Net Weight</div><div class="val">${transaction.net_weight ?? '—'}</div></div>
      </div>
    </div>

    <div class="red-box">
      <div class="section-title">STAGE HISTORY & CONFIRMATIONS</div>
      <table class="stage-table">
        <thead>
            <tr>
                <th style="width: 25%">Stage</th>
                <th style="width: 15%">Status</th>
                <th style="width: 30%">Confirmed By</th>
                <th style="width: 30%">Timestamp</th>
            </tr>
        </thead>
        <tbody>
        ${STAGES.map((s) => {
          const isDone = status[s.key];
          const conf = confirmationMap[s.key];
          const user = transaction[conf?.userKey] || '—';
          const time = transaction[conf?.dateKey] ? formatDateTime(transaction[conf?.dateKey]) : '—';
          
          return `
          <tr>
            <td>${s.label}</td>
            <td class="${isDone ? 'stage-done' : 'stage-pending'}">${isDone ? 'COMPLETED' : 'PENDING'}</td>
            <td>${isDone ? user : ''}</td>
            <td>${isDone ? time : ''}</td>
          </tr>
          `;
        }).join('')}
        </tbody>
      </table>
    </div>

    ${(remark1 || remark2) ? `
    <div class="red-box">
      <div class="section-title">REMARKS</div>
      ${remark1 ? `<div style="padding: 2px;"><strong>Remark 1:</strong> ${remark1}</div>` : ''}
      ${remark2 ? `<div style="padding: 2px;"><strong>Remark 2:</strong> ${remark2}</div>` : ''}
    </div>
    ` : ''}

    <div class="red-box" style="margin-top: 10px;">
      <div><strong>Current Status:</strong> ${transaction.current_status}</div>
    </div>

    <div class="signature">Authorised Signatory</div>

    <div class="footer">
      <strong>THIS IS A COMPUTER GENERATED GATE PASS</strong>
      <div style="font-style: italic; margin-top: 5px;">
        We declare that this gate pass shows the actual details of the transaction and that all particulars are true and correct.
      </div>
    </div>
  </div>
  ${forPrint ? `<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };<\/script>` : ''}
</body>
</html>`;
}

export function useGatePassPrint() {
  const printGatePass = useCallback((transaction) => {
    const html = getGatePassHtml(transaction, { forPrint: true });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
  }, []);

  const downloadGatePass = useCallback((transaction) => {
    const html = getGatePassHtml(transaction, { forPrint: false });
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gate-pass-${transaction.gate_pass_no || transaction.transaction_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { printGatePass, downloadGatePass };
}
