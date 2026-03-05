"use client";

import { useEffect, useState, useRef } from "react";

/**
 * LogisticReceiptPrint
 *
 * Props:
 *   entry  — the logistic entry object (row data from the table)
 *   onClose — callback to close/dismiss the modal
 */
export function LogisticReceiptPrint({ entry, onClose }) {
  const componentRef = useRef();

  const [vehicleData, setVehicleData] = useState(null);

  // Derive driver from joined fields on the entry (populated by the API)
  // Supports both flat fields (driver_name, driver_mobile…) and a nested driver object
  const driver = entry?.driver || {
    driver_name: entry?.driver_name || "",
    adhar_number: entry?.driver_adhar_number || entry?.adhar_number || "",
    mobile: entry?.driver_mobile || entry?.mobile_number || "",
    licence: entry?.driver_licence || entry?.licence || "",
    licence_expiry: entry?.driver_licence_expiry || entry?.licence_expiry || "",
  };

  // Format date as DD/MM/YYYY
  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fmt = (v) => (v == null ? "" : String(v));

  // Fetch vehicle master by truck_no
  useEffect(() => {
    if (!entry?.truck_no) return;
    fetch(`/api/vehicles?search=${encodeURIComponent(entry.truck_no)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          const match =
            rows.find(
              (v) =>
                (v.vehicle_number || "").toLowerCase() ===
                entry.truck_no.toLowerCase()
            ) || rows[0];
          setVehicleData(match);
        }
      })
      .catch(() => {});
  }, [entry?.truck_no]);


  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);


  // Build the self-contained HTML for printing
  const buildPrintHtml = () => {
    const v = vehicleData || {};
    const d = driver;

    const entryDate = fmtDate(entry.entry_date) || fmtDate(new Date().toISOString());

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Transport Receipt - ${fmt(entry.lr_no || "")}</title>
<style>
  @page { size: 210mm 148mm; margin: 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; background: #fff; color: #000; }
  .receipt { width: 100%; border: 2px solid #000; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 2px 4px; vertical-align: top; font-size: 10px; }
  .bold { font-weight: bold; }
  .center { text-align: center; }
  .right { text-align: right; }
  .underline { text-decoration: underline; }
  .italic { font-style: italic; font-family: 'Times New Roman', serif; }
  .small { font-size: 9px; }
  .no-border { border: none; }
  .border-b { border-bottom: 1px solid #000; }
  .border-t { border-top: 1px solid #000; }
  .border-r { border-right: 1px solid #000; }
  .border-l { border-left: 1px solid #000; }
  .line { display: inline-block; border-bottom: 1px solid #000; min-width: 60px; }
</style>
</head>
<body>
<div class="receipt">

  <!-- Header Row -->
  <table>
    <tr>
      <td style="width:70%; border-right:1px solid #000; border-bottom:1px solid #000; padding:4px 6px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
          <span class="small underline">Subject to DEESA Jurisdiction</span>
          <span class="bold center" style="font-size:14px; flex:1; text-align:center;">TRANSPORT RECEIPT</span>
          <span class="bold" style="font-size:11px;">Mo. 90999 95309</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="/logo.png" style="height:40px;" alt="VARPL" onerror="this.style.display='none'"/>
          <span class="italic bold" style="font-size:16px;">Vaishnodevi Agro Resources Pvt. Ltd.</span>
        </div>
      </td>
      <td style="width:30%; border-bottom:1px solid #000; padding:0; vertical-align:top;">
        <div style="padding:4px 6px; border-bottom:1px solid #000; min-height:28px;">
          <span class="bold">L.R. No :</span> <span class="bold">${fmt(entry.lr_no)}</span>
        </div>
        <div style="padding:4px 6px; min-height:28px;">
          <span class="bold">Date :</span> <span class="bold">${entryDate}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Address Bar -->
  <div style="padding:3px 6px; border-bottom:1px solid #000; font-size:9px;">
    Survey No. 317, Village : Nani Pipali, Kandla-Radhanpur Highway (NH-14), Taluka-Radhanpur, District-Patan, Gujarat (India)-385340.
  </div>

  <!-- GSTIN / PAN -->
  <table>
    <tr>
      <td class="center bold border-r" style="width:50%; font-size:11px; border-bottom:1px solid #000;">GSTIN : 24AAHCV4950E1ZD</td>
      <td class="center bold" style="width:50%; font-size:11px; border-bottom:1px solid #000;">PAN : AAHCV4950E</td>
    </tr>
  </table>

  <!-- AT OWNERS RISK -->
  <div class="center bold" style="padding:3px; border-bottom:1px solid #000; font-size:11px;">AT OWNERS RISK</div>

  <!-- Consignor / Consignee Header -->
  <table>
    <tr>
      <td class="bold border-r" style="width:50%; border-bottom:1px solid #000; background:#f5f5f5;">Consignor Name &amp; Address</td>
      <td class="bold" style="width:50%; border-bottom:1px solid #000; background:#f5f5f5;">Consignee Name &amp; Address</td>
    </tr>
  </table>

  <!-- Main Body -->
  <table>
    <tr>
      <!-- LEFT column: Consignor -->
      <td style="width:50%; border-right:1px solid #000; vertical-align:top; padding:0;">
        <div style="border-bottom:1px solid #ccc; padding:3px 6px; font-weight:bold; min-height:18px;">${fmt(entry.consignor_name)}</div>
        <div style="border-bottom:1px solid #ccc; padding:3px 6px; min-height:18px; font-size:9px;">${fmt(entry.consignor_address)}</div>
        <div style="border-bottom:1px solid #000; padding:3px 6px; min-height:16px; font-size:9px;">${fmt(entry.consignor_place)}</div>
        <table style="border:none;">
          <tr><td style="border:none; border-top:1px solid #000; width:90px; white-space:nowrap;">GST No. :</td><td style="border:none; border-top:1px solid #000;">${fmt(entry.consignor_gst)}</td></tr>
          <tr><td style="border:none; border-top:1px solid #000; white-space:nowrap;">Product :</td><td style="border:none; border-top:1px solid #000;">${fmt(entry.product)}</td></tr>
          <tr><td style="border:none; border-top:1px solid #000; white-space:nowrap;">Invoice No. :</td><td style="border:none; border-top:1px solid #000;"></td></tr>
          <tr><td style="border:none; border-top:1px solid #000; white-space:nowrap;">Invoice Value :</td><td style="border:none; border-top:1px solid #000;"></td></tr>
          <tr><td style="border:none; border-top:1px solid #000; white-space:nowrap;">Seal No. 1 :</td><td style="border:none; border-top:1px solid #000;"></td></tr>
          <tr><td style="border:none; border-top:1px solid #000; white-space:nowrap;">Seal No. 2 :</td><td style="border:none; border-top:1px solid #000;"></td></tr>
        </table>
      </td>
      <!-- RIGHT column: Consignee -->
      <td style="width:50%; vertical-align:top; padding:0;">
        <div style="border-bottom:1px solid #ccc; padding:3px 6px; font-weight:bold; min-height:18px;">${fmt(entry.consignee_name)}</div>
        <div style="border-bottom:1px solid #ccc; padding:3px 6px; min-height:18px; font-size:9px;">${fmt(entry.consignee_address)}</div>
        <div style="border-bottom:1px solid #000; padding:3px 6px; min-height:16px; font-size:9px;">${fmt(entry.consignee_place)}</div>
        <table style="border:none;">
          <tr>
            <td style="border:none; border-top:1px solid #000; width:100px; white-space:nowrap;">Tanker No. :</td>
            <td style="border:none; border-top:1px solid #000; border-bottom:1px solid #aaa;">${fmt(entry.truck_no)}</td>
          </tr>
          <tr>
            <td style="border:none; border-top:1px solid #000; white-space:nowrap;">RC Number :</td>
            <td style="border:none; border-top:1px solid #000; border-bottom:1px solid #aaa;">${fmt(v.rc_number)}</td>
          </tr>
          <tr>
            <td colspan="2" style="border:none; border-top:1px solid #000; padding:0;">
              <table style="border:none; width:100%;">
                <tr>
                  <td style="border:none; white-space:nowrap; width:50%; padding:2px 4px;">Insurance Expiry : <span class="line">${fmtDate(v.insurance_expiry)}</span></td>
                  <td style="border:none; white-space:nowrap; width:50%; padding:2px 4px;">Permit Expiry : <span class="line">${fmtDate(v.permit_expiry)}</span></td>
                </tr>
                <tr>
                  <td style="border:none; white-space:nowrap; padding:2px 4px; border-top:1px solid #000;">Fitness Expiry : <span class="line">${fmtDate(v.fitness_expiry)}</span></td>
                  <td style="border:none; white-space:nowrap; padding:2px 4px; border-top:1px solid #000;">PUC Expiry : <span class="line">${fmtDate(v.puc_expiry)}</span></td>
                </tr>
                <tr>
                  <td style="border:none; white-space:nowrap; padding:2px 4px; border-top:1px solid #000;">Rate Pmt : <span class="line">${fmt(entry.rate)}</span></td>
                  <td style="border:none; white-space:nowrap; padding:2px 4px; border-top:1px solid #000;">Advance : <span class="line"></span></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border:none; border-top:1px solid #000; padding:2px 4px;" colspan="2">
              To Pay : <span class="line bold">${fmt(entry.amounts)}</span>&nbsp;&nbsp;&nbsp;<span class="bold right">FREIGHT</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Weights / Freight Row -->
  <table>
    <tr>
      <td style="width:50%; border-right:1px solid #000; padding:0; vertical-align:top;">
        <table style="width:100%; border:none;">
          <tr>
            <th style="border:none; border-right:1px solid #ccc; border-bottom:1px solid #000; text-align:center; width:33%;">First WT.</th>
            <th style="border:none; border-right:1px solid #ccc; border-bottom:1px solid #000; text-align:center; width:33%;">Second WT.</th>
            <th style="border:none; border-bottom:1px solid #000; text-align:center; width:34%;">Net WT.</th>
          </tr>
          <tr>
            <td style="border:none; border-right:1px solid #ccc; text-align:center;">${fmt(entry.gross_weight)}</td>
            <td style="border:none; border-right:1px solid #ccc; text-align:center;">${fmt(entry.tare_weight)}</td>
            <td style="border:none; text-align:center;">${fmt(entry.net_weight)}</td>
          </tr>
        </table>
      </td>
      <td style="width:50%; padding:0; vertical-align:top;">
        <table style="width:100%; border:none;">
          <tr>
            <th style="border:none; border-right:1px solid #ccc; border-bottom:1px solid #000; text-align:center; width:50%;">Freight</th>
            <th style="border:none; border-bottom:1px solid #000; text-align:center; width:50%;">To Be Billed</th>
          </tr>
          <tr>
            <td style="border:none; border-right:1px solid #ccc; min-height:20px;">&nbsp;</td>
            <td style="border:none; min-height:20px;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Received / Remarks Row -->
  <table>
    <tr>
      <td style="width:50%; border-right:1px solid #000; padding:0; vertical-align:top;">
        <table style="border:none; width:100%;">
          <tr>
            <td style="border:none; border-right:1px solid #ccc; border-bottom:1px solid #000; font-size:9px; width:50%;">Received the above goods</td>
            <td style="border:none; border-bottom:1px solid #000; font-size:9px; width:50%;">Consignee stamp &amp; signature</td>
          </tr>
          <tr>
            <td colspan="2" style="border:none; padding:0;">
              <table style="border:none; width:100%;">
                <tr>
                  <td style="border:none; border-right:1px solid #ccc; width:60px; font-weight:bold; font-size:9px;">Date</td>
                  <td style="border:none; border-right:1px solid #ccc; min-height:18px;">&nbsp;</td>
                  <td style="border:none; min-height:18px;" rowspan="3">&nbsp;</td>
                </tr>
                <tr>
                  <td style="border:none; border-right:1px solid #ccc; border-top:1px solid #ccc; font-weight:bold; font-size:9px;">Qty.</td>
                  <td style="border:none; border-right:1px solid #ccc; border-top:1px solid #ccc;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="border:none; border-right:1px solid #ccc; border-top:1px solid #ccc; font-weight:bold; font-size:9px;">Shortage</td>
                  <td style="border:none; border-right:1px solid #ccc; border-top:1px solid #ccc;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
      <td style="width:50%; vertical-align:top; padding:3px 6px;">
        <div style="border-bottom:1px solid #ccc; min-height:20px; font-size:9px;">Remarks :</div>
        <div style="border-bottom:1px solid #ccc; min-height:20px; font-size:9px; margin-top:2px;">Person Liable for GST IN :</div>
        <div style="min-height:20px; font-size:9px; margin-top:2px;">Consignee / Consignor :</div>
      </td>
    </tr>
  </table>

  <!-- Bottom: Driver Info / Signatures -->
  <table>
    <tr>
      <td style="border-right:1px solid #000; vertical-align:top; padding:0;">
        <div style="padding:3px 6px; border-bottom:1px solid #000; font-size:9px; text-decoration:underline;">
          Not to be unloaded without receipt of modvate copy of Invoice.
        </div>
        <div style="display:flex; align-items:center; gap:8px; padding:3px 6px; border-bottom:1px solid #000; min-height:22px;">
          <span style="font-weight:bold; white-space:nowrap; font-size:9px;">Driver Name :</span>
          <span style="flex:1; border-bottom:1px solid #000; min-height:14px;">${fmt(d.driver_name)}</span>
          <span style="font-weight:bold; white-space:nowrap; font-size:9px;">Aadhaar No :</span>
          <span style="flex:1; border-bottom:1px solid #000; min-height:14px;">${fmt(d.adhar_number)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px; padding:3px 6px; min-height:22px; flex-wrap:wrap;">
          <span style="font-weight:bold; white-space:nowrap; font-size:9px;">Mobile No :</span>
          <span style="border-bottom:1px solid #000; min-width:70px; min-height:14px;">${fmt(d.mobile)}</span>
          <span style="font-weight:bold; white-space:nowrap; font-size:9px;">License No :</span>
          <span style="border-bottom:1px solid #000; min-width:80px; min-height:14px;">${fmt(d.licence)}</span>
          <span style="font-weight:bold; white-space:nowrap; font-size:9px;">License Expiry :</span>
          <span style="border-bottom:1px solid #000; min-width:60px; min-height:14px;">${fmtDate(d.licence_expiry)}</span>
        </div>
        <div style="font-size:9px; padding:1px 6px;">(1)</div>
      </td>
      <td style="width:120px; border-left:1px solid #000; text-align:center; vertical-align:bottom; font-weight:bold; font-size:9px; padding:6px 4px; min-height:60px;">Driver Signature</td>
      <td style="width:120px; border-left:1px solid #000; text-align:center; vertical-align:bottom; font-weight:bold; font-size:9px; padding:6px 4px; min-height:60px;">Authorised Signature</td>
    </tr>
  </table>

</div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHtml();
    const printWin = window.open("", "_blank", "width=950,height=700");
    if (!printWin) {
      alert("Pop-up blocked! Please allow pop-ups for this page to print.");
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    // Small timeout to let images/fonts load, then print
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-start overflow-y-auto py-6 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Action bar ─────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3 w-full max-w-[880px]">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm"
        >
          ← Back
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>

        <span className="text-sm text-zinc-500 font-medium">
          {entry.lr_no ? <span className="font-bold text-blue-600">{entry.lr_no}</span> : null}
          {entry.lr_no ? " · " : ""}
          Transport Receipt — {fmt(entry.truck_no)}
        </span>
      </div>

      {/* ── Live Preview ──────────────────────────────────────── */}
      <div
        style={{
          background: "white",
          width: "880px",
          border: "2px solid #000",
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, padding: "4px 8px", borderRight: "1px solid #000" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span style={{ fontSize: "9px", textDecoration: "underline" }}>Subject to DEESA Jurisdiction</span>
              <span style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "1px", flex: 1, textAlign: "center" }}>TRANSPORT RECEIPT</span>
              <span style={{ fontSize: "11px", fontWeight: "bold" }}>Mo. 90999 95309</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="VARPL" style={{ height: "40px" }} />
              <span style={{ fontSize: "18px", fontFamily: "'Times New Roman', serif", fontStyle: "italic", fontWeight: "bold" }}>
                Vaishnodevi Agro Resources Pvt. Ltd.
              </span>
            </div>
          </div>
          <div style={{ width: "170px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "5px 8px", borderBottom: "1px solid #000", minHeight: "30px", fontWeight: "bold" }}>
              L.R. No : <span style={{ color: "#1d4ed8" }}>{fmt(entry.lr_no)}</span>
            </div>
            <div style={{ padding: "5px 8px", minHeight: "30px", fontWeight: "bold" }}>
              Date : {fmtDate(entry.entry_date) || fmtDate(new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Address bar */}
        <div style={{ padding: "3px 8px", fontSize: "9px", borderBottom: "1px solid #000" }}>
          Survey No. 317, Village : Nani Pipali, Kandla-Radhanpur Highway (NH-14), Taluka-Radhanpur, District-Patan, Gujarat (India)-385340.
        </div>

        {/* GSTIN / PAN */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, padding: "3px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11px", borderRight: "1px solid #000" }}>
            GSTIN : 24AAHCV4950E1ZD
          </div>
          <div style={{ flex: 1, padding: "3px 8px", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
            PAN : AAHCV4950E
          </div>
        </div>

        {/* AT OWNERS RISK */}
        <div style={{ textAlign: "center", fontWeight: "bold", padding: "3px", borderBottom: "1px solid #000", fontSize: "11px" }}>
          AT OWNERS RISK
        </div>

        {/* Consignor / Consignee header */}
        <div style={{ display: "flex", borderBottom: "1px solid #000", background: "#f5f5f5" }}>
          <div style={{ flex: 1, padding: "3px 8px", fontWeight: "bold", borderRight: "1px solid #000" }}>Consignor Name &amp; Address</div>
          <div style={{ flex: 1, padding: "3px 8px", fontWeight: "bold" }}>Consignee Name &amp; Address</div>
        </div>

        {/* Main body */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          {/* Left: Consignor */}
          <div style={{ flex: 1, borderRight: "1px solid #000" }}>
            <div style={{ borderBottom: "1px solid #ccc", padding: "3px 8px", fontWeight: "bold", minHeight: "18px" }}>{fmt(entry.consignor_name)}</div>
            <div style={{ borderBottom: "1px solid #ccc", padding: "3px 8px", fontSize: "9px", minHeight: "18px", wordBreak: "break-word" }}>{fmt(entry.consignor_address)}</div>
            <div style={{ borderBottom: "1px solid #000", padding: "3px 8px", fontSize: "9px", minHeight: "16px" }}>{fmt(entry.consignor_place)}</div>
            <FieldRow label="GST No. :" value={fmt(entry.consignor_gst)} />
            <FieldRow label="Product :" value={fmt(entry.product)} />
            <FieldRow label="Invoice No. :" value="" />
            <FieldRow label="Invoice Value :" value="" />
            <FieldRow label="Seal No. 1 :" value="" />
            <FieldRow label="Seal No. 2 :" value="" />
          </div>

          {/* Right: Consignee */}
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: "1px solid #ccc", padding: "3px 8px", fontWeight: "bold", minHeight: "18px" }}>{fmt(entry.consignee_name)}</div>
            <div style={{ borderBottom: "1px solid #ccc", padding: "3px 8px", fontSize: "9px", minHeight: "18px", wordBreak: "break-word" }}>{fmt(entry.consignee_address)}</div>
            <div style={{ borderBottom: "1px solid #000", padding: "3px 8px", fontSize: "9px", minHeight: "16px" }}>{fmt(entry.consignee_place)}</div>
            <RightFieldRow label="Tanker No. :" value={fmt(entry.truck_no)} />
            <RightFieldRow label="RC Number :" value={fmt(vehicleData?.rc_number)} />
            <SplitRow
              left={{ label: "Insurance Expiry :", value: fmtDate(vehicleData?.insurance_expiry) }}
              right={{ label: "Permit Expiry :", value: fmtDate(vehicleData?.permit_expiry) }}
            />
            <SplitRow
              left={{ label: "Fitness Expiry :", value: fmtDate(vehicleData?.fitness_expiry) }}
              right={{ label: "PUC Expiry :", value: fmtDate(vehicleData?.puc_expiry) }}
            />
            <SplitRow
              left={{ label: "Rate Pmt :", value: fmt(entry.rate) }}
              right={{ label: "Advance :", value: "" }}
            />
            <div style={{ display: "flex", borderTop: "1px solid #000", minHeight: "20px", alignItems: "center", padding: "2px 6px" }}>
              <span>To Pay :&nbsp;</span>
              <span style={{ borderBottom: "1px solid #888", minWidth: "60px", minHeight: "14px", fontWeight: "bold" }}>{fmt(entry.amounts)}</span>
              <span style={{ marginLeft: "auto", fontWeight: "bold" }}>FREIGHT</span>
            </div>
          </div>
        </div>

        {/* Weights */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, borderRight: "1px solid #000" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
              {["First WT.", "Second WT.", "Net WT."].map((h) => (
                <div key={h} style={{ flex: 1, textAlign: "center", fontWeight: "bold", padding: "2px", borderRight: "1px solid #ccc", fontSize: "9.5px" }}>{h}</div>
              ))}
            </div>
            <div style={{ display: "flex", minHeight: "22px" }}>
              <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: "3px 6px" }}>{fmt(entry.gross_weight)}</div>
              <div style={{ flex: 1, borderRight: "1px solid #ccc", padding: "3px 6px" }}>{fmt(entry.tare_weight)}</div>
              <div style={{ flex: 1, padding: "3px 6px" }}>{fmt(entry.net_weight)}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
              {["Freight", "To Be Billed"].map((h) => (
                <div key={h} style={{ flex: 1, textAlign: "center", fontWeight: "bold", padding: "2px", borderRight: "1px solid #ccc", fontSize: "9.5px" }}>{h}</div>
              ))}
            </div>
            <div style={{ display: "flex", minHeight: "22px" }}>
              <div style={{ flex: 1, borderRight: "1px solid #ccc" }}></div>
              <div style={{ flex: 1 }}></div>
            </div>
          </div>
        </div>

        {/* Received / Remarks */}
        <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
          <div style={{ flex: 1, borderRight: "1px solid #000" }}>
            <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
              <div style={{ flex: 1, padding: "2px 6px", fontSize: "9px", borderRight: "1px solid #ccc" }}>Received the above goods</div>
              <div style={{ flex: 1, padding: "2px 6px", fontSize: "9px" }}>Consignee stamp &amp; signature</div>
            </div>
            <div style={{ display: "flex", minHeight: "40px" }}>
              <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #ccc" }}>
                {["Date", "Qty.", "Shortage"].map((l, i) => (
                  <div key={l} style={{ padding: "2px 5px", borderBottom: i < 2 ? "1px solid #ccc" : "none", minHeight: "14px", fontWeight: "bold", fontSize: "9px" }}>{l}</div>
                ))}
              </div>
              <div style={{ flex: 1 }}></div>
              <div style={{ flex: 1.5, borderLeft: "1px solid #ccc" }}></div>
            </div>
          </div>
          <div style={{ flex: 1, padding: "3px 8px" }}>
            <div style={{ padding: "3px 0", borderBottom: "1px solid #ccc", fontSize: "9px", minHeight: "20px" }}>Remarks :</div>
            <div style={{ padding: "3px 0", borderBottom: "1px solid #ccc", fontSize: "9px", minHeight: "20px" }}>Person Liable for GST IN :</div>
            <div style={{ padding: "3px 0", fontSize: "9px", minHeight: "20px" }}>Consignee / Consignor :</div>
          </div>
        </div>

        {/* Bottom: Driver info */}
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, borderRight: "1px solid #000" }}>
            <div style={{ padding: "3px 8px", fontSize: "9px", textDecoration: "underline", borderBottom: "1px solid #000" }}>
              Not to be unloaded without receipt of modvate copy of Invoice.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderBottom: "1px solid #000", minHeight: "22px" }}>
              <span style={{ fontWeight: "bold", fontSize: "9px", whiteSpace: "nowrap" }}>Driver Name :</span>
              <span style={{ flex: 1, borderBottom: "1px solid #000", minHeight: "14px" }}>{fmt(driver.driver_name)}</span>
              <span style={{ fontWeight: "bold", fontSize: "9px", whiteSpace: "nowrap" }}>Aadhaar No :</span>
              <span style={{ flex: 1, borderBottom: "1px solid #000", minHeight: "14px" }}>{fmt(driver.adhar_number)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", padding: "3px 8px", fontSize: "9px", minHeight: "22px" }}>
              <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>Mobile No :</span>
              <span style={{ borderBottom: "1px solid #000", minWidth: "70px", minHeight: "14px" }}>{fmt(driver.mobile)}</span>
              <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>License No :</span>
              <span style={{ borderBottom: "1px solid #000", minWidth: "80px", minHeight: "14px" }}>{fmt(driver.licence)}</span>
              <span style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>License Expiry :</span>
              <span style={{ borderBottom: "1px solid #000", minWidth: "60px", minHeight: "14px" }}>{fmtDate(driver.licence_expiry)}</span>
            </div>
            <div style={{ fontSize: "9px", padding: "1px 8px" }}>(1)</div>
          </div>
          <div style={{ display: "flex", width: "240px" }}>
            {["Driver Signature", "Authorised Signature"].map((label) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  padding: "6px 4px",
                  fontWeight: "bold",
                  fontSize: "9px",
                  textAlign: "center",
                  borderLeft: "1px solid #000",
                  minHeight: "60px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* /receipt */}
    </div>
  );
}

/* ── Small helper sub-components ── */

function FieldRow({ label, value }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid #000", minHeight: "20px" }}>
      <span style={{ padding: "2px 6px", minWidth: "88px", whiteSpace: "nowrap", fontSize: "9.5px" }}>{label}</span>
      <span style={{ flex: 1, padding: "2px 6px", borderLeft: "1px solid #ccc", wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

function RightFieldRow({ label, value }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid #000", minHeight: "20px", alignItems: "center", padding: "2px 6px", gap: "4px" }}>
      <span style={{ minWidth: "90px", whiteSpace: "nowrap", fontSize: "9.5px" }}>{label}</span>
      <span style={{ flex: 1, borderBottom: "1px solid #888", minHeight: "13px" }}>{value}</span>
    </div>
  );
}

function SplitRow({ left, right }) {
  return (
    <div style={{ display: "flex", borderTop: "1px solid #000", minHeight: "20px", alignItems: "center", padding: "2px 4px", gap: "4px" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "3px", fontSize: "9.5px" }}>
        <span style={{ whiteSpace: "nowrap" }}>{left.label}</span>
        <span style={{ flex: 1, borderBottom: "1px solid #888", minHeight: "13px" }}>{left.value}</span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "3px", fontSize: "9.5px" }}>
        <span style={{ whiteSpace: "nowrap" }}>{right.label}</span>
        <span style={{ flex: 1, borderBottom: "1px solid #888", minHeight: "13px" }}>{right.value}</span>
      </div>
    </div>
  );
}
