'use client';

import { useCallback } from 'react';
import { STAGES, getStageStatus } from '@/lib/stageUtils';
import { formatWeight } from '@/utils/formatters';

export function getGatePassHtml(transaction, options = {}) {
  const { forPrint = false } = options;
  console.log("transaction",transaction);
  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');
  const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '—');

  const remark1 = transaction.remark1 || '';
  const remark2 = transaction.remark2 || '';

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

  // Fields that should appear bigger and bolder throughout
  const highlight = `font-size: 9pt; font-weight: bold;`;

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

    /* Info table — label narrow, value gets the space */
    .info-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; table-layout: fixed; }
    .info-table td { padding: 3px 4px; vertical-align: middle; border: 1px solid #000; overflow: hidden; white-space: nowrap; }
    .info-table .label { font-weight: bold; width: 15%; background: #f5f5f5; font-size: 6.5pt; white-space: nowrap; }
    .info-table .value { width: 28%; }

    /* Highlight class for key fields */
    .hl { font-size: 9pt; font-weight: bold; }

    .weights-row { display: flex; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .weights-row > div { flex: 1; min-width: 80px; border: 1px solid #000; padding: 6px; }
    .weight-box { text-align: center; padding: 8px; border: 1px solid #000; margin: 2px; }
    .weight-box .val { font-size: 12pt; font-weight: bold; }

    /* Top summary bar */
    .summary-bar { border: 1px solid #000; padding: 6px 8px; margin-bottom: 4px; display: flex; flex-wrap: wrap; gap: 6px 20px; align-items: center; background: #fafafa; }
    .summary-bar .sb-item { display: flex; flex-direction: column; }
    .summary-bar .sb-label { font-size: 6pt; color: #555; text-transform: uppercase; letter-spacing: 0.3px; }
    .summary-bar .sb-value { font-size: 9.5pt; font-weight: bold; }
    .summary-bar .sb-sep { color: #ccc; font-size: 14pt; align-self: center; }

    /* Stage Table */
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

    <!-- HEADER -->
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

    <!-- KEY SUMMARY BAR -->
    <div class="summary-bar">
      <div class="sb-item">
        <span class="sb-label">Gate Pass No.</span>
        <span class="sb-value">${txnNo(transaction)}</span>
      </div>
      <span class="sb-sep">|</span>
      <div class="sb-item">
        <span class="sb-label">Date</span>
        <span class="sb-value">${formatDate(transaction.created_at)}</span>
      </div>
      <span class="sb-sep">|</span>
      <div class="sb-item">
        <span class="sb-label">Type</span>
        <span class="sb-value">${transaction.transaction_type} (${transaction.transaction_type === 'Loading' ? 'Inward' : 'Outward'})</span>
      </div>
      <span class="sb-sep">|</span>
      <div class="sb-item">
        <span class="sb-label">Gate In Time</span>
        <span class="sb-value" style="font-size: 8pt;">${transaction.gate_in_at ? formatDateTime(transaction.gate_in_at) : '—'}</span>
      </div>
      <span class="sb-sep">|</span>
      <div class="sb-item">
        <span class="sb-label">Entry Created</span>
        <span class="sb-value" style="font-size: 8pt;">${formatDateTime(transaction.created_at)}</span>
      </div>
    </div>

    <!-- BASIC INFORMATION -->
    <div class="red-box">
      <div class="section-title">BASIC INFORMATION</div>
      <table class="info-table">
        <tr>
          <td class="label">Truck No</td>
          <td class="value hl">${transaction.truck_no}</td>
          <td class="label">Party Name</td>
          <td class="value">${transaction.party_name}</td>
        </tr>
        <tr>
          <td class="label">Item</td>
          <td class="value hl">${transaction.item_name || 'N/A'}</td>
          <td class="label">Transporter</td>
          <td class="value">${transaction.transporter_name}</td>
        </tr>
        <tr>
          <td class="label">Driver Mobile</td>
          <td class="value hl">${transaction.mobile_number}</td>
          <td class="label">LR No</td>
          <td class="value">${transaction.lr_number || '—'}</td>
        </tr>
      </table>
    </div>

    <!-- INVOICE DETAILS -->
    <div class="red-box">
      <div class="section-title">INVOICE DETAILS</div>
      <table class="info-table">
        <tr>
          <td class="label">Invoice No</td>
          <td class="value hl">${transaction.invoice_number}</td>
          <td class="label">Invoice Date</td>
          <td class="value hl">${formatDate(transaction.invoice_date)}</td>
        </tr>
        <tr>
          <td class="label">Invoice Qty</td>
          <td class="value hl">${transaction.invoice_quantity}</td>
          <td class="label">PO/DO No</td>
          <td class="value hl">${transaction.po_do_number || '—'}</td>
        </tr>
        <tr>
          <td class="label">Rate</td>
          <td class="value hl">${transaction.rate !== null && transaction.rate !== undefined ? '₹' + transaction.rate : '—'}</td>
          <td class="label"></td>
          <td class="value"></td>
        </tr>
      </table>
    </div>

    <!-- WEIGHBRIDGE -->
    <div class="red-box">
      <div class="section-title">WEIGHBRIDGE INFORMATION</div>
      <div class="weights-row">
        <div class="weight-box"><div>First Weight</div><div class="val">${formatWeight(transaction.first_weight)} kg</div></div>
        <div class="weight-box"><div>Second Weight</div><div class="val">${formatWeight(transaction.second_weight)} kg</div></div>
        <div class="weight-box"><div>Net Weight</div><div class="val">${formatWeight(transaction.net_weight)} kg</div></div>
      </div>
    </div>

    <!-- STAGE HISTORY -->
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
          </tr>`;
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

export function getEntryPassHtml(transaction, options = {}) {
  const { forPrint = false } = options;
  const displayId = String(transaction.gate_pass_no).padStart(5, '0');

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const parkingTime = formatDateTime(transaction.parking_confirmed_at);
  const gateInTime = formatDateTime(transaction.gate_in_at);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ENTRY PASS - ${displayId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: white; padding: 5px; }
    .ticket {
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      border: 2px dashed #000;
      text-align: center;
    }
    .logo {
      max-width: 100px;
      height: auto;
      margin-bottom: 10px;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .divider {
      border-bottom: 1px solid #000;
      margin: 8px 0;
    }
    .timing-block {
      text-align: left;
      font-size: 11px;
      margin: 6px 0;
      line-height: 1.6;
    }
    .timing-block .timing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .timing-block .label {
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .timing-block .value {
      font-size: 11px;
    }
    .txn-id {
      font-size: 24px;
      font-weight: bold;
      margin: 8px 0;
    }
    .item-name {
      font-size: 18px;
      font-weight: bold;
      margin: 8px 0;
      text-transform: uppercase;
    }
    .truck-no {
      font-size: 20px;
      font-weight: bold;
      margin: 8px 0;
      text-transform: uppercase;
    }
    .driver-mobile {
      font-size: 16px;
      font-weight: bold;
      margin: 8px 0;
    }
    @media print {
      body { padding: 0; }
      .ticket { border: 2px dashed #000; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="ticket">
        <span class="lable">Vaishnodevi Agro Resources Private Limited</span>

    <div class="divider"></div>
    <div class="timing-block">
      <div class="timing-row">
        <span class="label">Parking In</span>
        <span class="value">${parkingTime}</span>
      </div>
      <div class="timing-row">
        <span class="label">Gate In</span>
        <span class="value">${gateInTime}</span>
      </div>
    </div>
    <div class="divider"></div>

    <div class="txn-id">${displayId}</div>
    <div class="divider"></div>

    <div class="item-name">${transaction.item_name || 'N/A'}</div>
    <div class="divider"></div>

    <div class="truck-no">${transaction.truck_no}</div>
    <div class="divider"></div>

    <div class="timing-block">
      <div class="timing-row">
        <span class="label">Driver Mobile</span>
        <span class="value driver-mobile">${transaction.mobile_number || 'N/A'}</span>
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
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
  }, []);

  const printEntryPass = useCallback((transaction) => {
    const html = getEntryPassHtml(transaction, { forPrint: true });
    // Open a smaller window for the thermal print preview
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
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

  return { printGatePass, printEntryPass, downloadGatePass };
}
