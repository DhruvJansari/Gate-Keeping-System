"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CloseIcon, SaveIcon } from "@/components/Icons";

export function LogisticEntryDetail({ entryId, onClose, onUpdate, readOnly = false }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transporters, setTransporters] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  const [form, setForm] = useState({
    transporter_name: "", driver_id: "", truck_no: "", product: "",
    consignor_name: "", consignee_name: "",
    tare_weight: "", gross_weight: "", net_weight: "", rate: "", amounts: "",
    advance: "", diesel_ltr: "", diesel_rate: "", deduction: "",
    holtage: "", net_amount: "", rec_amount: "", rec_date: "",
    payment_rec_ac: false, payment_rec_ac_note: "",
    payment_cash: false, payment_cash_note: "",
    start_km: "", end_km: "", total_km: "", deduction_2: "", company_notes: "",
    unloading_wt: "", loss_gain: "", expense: "", final_notes: ""
  });

  useEffect(() => {
    if (entryId) {
      fetchEntry();
      fetchMasters();
    }
  }, [entryId]);

  const fetchMasters = async () => {
    try {
      const [resTrans, resDriv] = await Promise.all([
        fetch("/api/transporters?status=Active"),
        fetch("/api/drivers?status=Active")
      ]);
      if (resTrans.ok) {
        const d = await resTrans.json();
        setTransporters(Array.isArray(d) ? d : []);
      }
      if (resDriv.ok) {
        const d = await resDriv.json();
        setDrivers(Array.isArray(d) ? d : []);
      }
    } catch { /* silent */ }
  };

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/logistic-entries/${entryId}`);
      if (!res.ok) throw new Error("Failed to load details");
      const data = await res.json();
      setEntry(data);
      
      setForm({
        transporter_name: data.transporter_name || "",
        driver_id: data.driver_id || "",
        truck_no: data.truck_no || "",
        product: data.product || "",
        consignor_name: data.consignor_name || "",
        consignee_name: data.consignee_name || "",
        tare_weight: data.tare_weight || "",
        gross_weight: data.gross_weight || "",
        net_weight: data.net_weight || "",
        rate: data.rate || "",
        amounts: data.amounts || "",
        advance: data.advance || "",
        diesel_ltr: data.diesel_ltr || "",
        diesel_rate: data.diesel_rate || "",
        deduction: data.deduction || "",
        holtage: data.holtage || "",
        net_amount: data.net_amount || "",
        rec_amount: data.rec_amount || "",
        rec_date: data.rec_date ? new Date(data.rec_date).toISOString().split('T')[0] : "",
        payment_rec_ac: !!data.payment_rec_ac,
        payment_rec_ac_note: data.payment_rec_ac_note || "",
        payment_cash: !!data.payment_cash,
        payment_cash_note: data.payment_cash_note || "",
        start_km: data.start_km || "",
        end_km: data.end_km || "",
        total_km: data.total_km || "",
        deduction_2: data.deduction_2 || "",
        company_notes: data.company_notes || "",
        unloading_wt: data.unloading_wt || "",
        loss_gain: data.loss_gain || "",
        expense: data.expense || "",
        final_notes: data.final_notes || ""
      });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (readOnly) return;
    setForm(prev => {
      const next = { ...prev, [field]: value };
      
      // 1. Net Weight Calculation (Always Absolute Positive)
      let netWt = parseFloat(next.net_weight) || 0;
      if (field === 'gross_weight' || field === 'tare_weight') {
        const gross = parseFloat(next.gross_weight) || 0;
        const tare = parseFloat(next.tare_weight) || 0;
        netWt = Math.abs(gross - tare);
        next.net_weight = netWt.toFixed(2);
      }
      
      // 2. Freight Amount Calculation
      let freightAmt = parseFloat(next.amounts) || 0;
      if (field === 'rate' || field === 'gross_weight' || field === 'tare_weight') {
         const freightRate = parseFloat(next.rate) || 0;
         freightAmt = (netWt / 1000) * freightRate;
         next.amounts = freightAmt.toFixed(2);
      }

      // 3. Loss / Gain Calculation
      if (field === 'unloading_wt' || field === 'gross_weight' || field === 'tare_weight') {
         const unloadWt = parseFloat(next.unloading_wt) || 0;
         next.loss_gain = (netWt - unloadWt).toFixed(2);
      }

      // 4. Net Amount Calculation
      if (field === 'rate' || field === 'gross_weight' || field === 'tare_weight' || 
          field === 'advance' || field === 'diesel_rate' || field === 'holtage') {
         const advance = parseFloat(next.advance) || 0;
         const dieselAmt = parseFloat(next.diesel_rate) || 0;
         const holtage = parseFloat(next.holtage) || 0;
         next.net_amount = (freightAmt - advance - dieselAmt + holtage).toFixed(2);
      }
      
      if (field === 'start_km' || field === 'end_km') {
        const start = parseFloat(next.start_km) || 0;
        const end = parseFloat(next.end_km) || 0;
        next.total_km = Math.max(0, end - start).toFixed(2);
      }
      
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/logistic-entries/${entryId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to update entry");
      toast.success("Entry updated successfully");
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleMarkCompleted = async () => {
    if (!window.confirm("Are you sure you want to mark this transaction as Completed?")) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/logistic-entries/${entryId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "Completed" })
      });
      if (!res.ok) throw new Error("Failed to mark as completed");
      toast.success("Transaction marked as completed");
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

console.log("transporters",transporters)
  if (!entryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">Logistic Entry Details</h2>
             <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-xs">#{entryId}</span>
                <span>•</span>
                <span className={readOnly ? "text-blue-600 font-medium" : "text-emerald-600 font-medium"}>
                    {readOnly ? "View Only" : "Edit Mode"}
                </span>
             </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-zinc-50/30">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100 mx-6">
                    <p className="font-semibold">Error loading entry</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>  
            ) : (
                <div className="space-y-6">
                    {/* Section 1: HEADER DETAILS */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                        <SectionTitle title="1. Header Details" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField label="Consignor" value={form.consignor_name} readOnly={true} />
                            <InputField label="Consignee" value={form.consignee_name} readOnly={true} />
                            
                            <div className="space-y-1 w-full">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Transporter Name</label>
                                <select 
                                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${readOnly ? 'bg-zinc-50 border-zinc-200 text-zinc-600 cursor-not-allowed' : 'bg-white border-zinc-300 focus:border-blue-500'}`}
                                    value={form.transporter_name}
                                    onChange={e => handleFieldChange('transporter_name', e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">Select Transporter</option>
                                    {transporters.map(t => (
                                        <option key={t.transporter_id} value={t.name}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1 w-full">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Driver Name</label>
                                <select 
                                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${readOnly ? 'bg-zinc-50 border-zinc-200 text-zinc-600 cursor-not-allowed' : 'bg-white border-zinc-300 focus:border-blue-500'}`}
                                    value={form.driver_id}
                                    onChange={e => handleFieldChange('driver_id', e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option value="">Select Driver</option>
                                    {drivers.map(d => (
                                        <option key={d.driver_id} value={d.driver_id}>{d.driver_name}</option>
                                    ))}
                                </select>
                            </div>

                            <InputField label="Truck No" value={form.truck_no} readOnly={true} />
                            <InputField label="Product" value={form.product} readOnly={true} />
                        </div>
                    </div>

                    {/* Section 2: WEIGHT + FREIGHT */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                        <SectionTitle title="2. Weight + Freight" />
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <InputField label="First Wt" type="number" value={form.tare_weight} onChange={v => handleFieldChange("tare_weight", v)} readOnly={readOnly} />
                            <InputField label="Second Wt" type="number" value={form.gross_weight} onChange={v => handleFieldChange("gross_weight", v)} readOnly={readOnly} />
                            <InputField label="Weight (Net)" value={form.net_weight} readOnly={true} className="bg-blue-50 text-blue-700 font-bold border-blue-200" title="Auto-calculated field (Math.abs difference)" />
                            <InputField label="Freight Rate" type="number" value={form.rate} onChange={v => handleFieldChange("rate", v)} readOnly={readOnly} />
                            <InputField label="Freight Amount" type="number" value={form.amounts} readOnly={true} title="Auto-calculated field (cannot be edited)" />
                        </div>
                    </div>

                    {/* Section 3: ACCOUNTING & OPERATIONS */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                        <SectionTitle title="3. Accounting & Operations" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-zinc-100">
                            <InputField label="Advance" type="number" value={form.advance} onChange={v => handleFieldChange("advance", v)} readOnly={readOnly} />
                            <InputField label="Diesel (Ltr)" type="number" value={form.diesel_ltr} onChange={v => handleFieldChange("diesel_ltr", v)} readOnly={readOnly} />
                            <InputField label="Diesel Amount" type="number" value={form.diesel_rate} onChange={v => handleFieldChange("diesel_rate", v)} readOnly={readOnly} />
                            <InputField label="Deduction" type="number" value={form.deduction} onChange={v => handleFieldChange("deduction", v)} readOnly={readOnly} />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-zinc-100">
                            <InputField label="Holtage" type="number" value={form.holtage} onChange={v => handleFieldChange("holtage", v)} readOnly={readOnly} />
                            <InputField label="Net Amount" type="number" value={form.net_amount} readOnly={true} title="Auto-calculated field (cannot be edited)" />
                            <InputField label="Received Amount" type="number" value={form.rec_amount} onChange={v => handleFieldChange("rec_amount", v)} readOnly={readOnly} />
                            <InputField label="Received Date" type="date" value={form.rec_date} onChange={v => handleFieldChange("rec_date", v)} readOnly={readOnly} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payment in A/c</label>
                                <div className="flex items-center h-[42px] px-3 border border-zinc-200 rounded-lg bg-zinc-50 transition-all">
                                    <input type="checkbox" checked={form.payment_rec_ac} disabled={readOnly} onChange={e => handleFieldChange("payment_rec_ac", e.target.checked)} className="h-4 w-4 text-blue-600 rounded border-zinc-300 focus:ring-blue-500" />
                                    <span className="ml-2 text-sm text-zinc-700 font-medium">Yes</span>
                                </div>
                                {form.payment_rec_ac && (
                                    <InputField label="A/c Notes" value={form.payment_rec_ac_note} onChange={v => handleFieldChange("payment_rec_ac_note", v)} readOnly={readOnly} />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payment in Cash</label>
                                <div className="flex items-center h-[42px] px-3 border border-zinc-200 rounded-lg bg-zinc-50 transition-all">
                                    <input type="checkbox" checked={form.payment_cash} disabled={readOnly} onChange={e => handleFieldChange("payment_cash", e.target.checked)} className="h-4 w-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500" />
                                    <span className="ml-2 text-sm text-zinc-700 font-medium">Yes</span>
                                </div>
                                {form.payment_cash && (
                                    <InputField label="Cash Notes" value={form.payment_cash_note} onChange={v => handleFieldChange("payment_cash_note", v)} readOnly={readOnly} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 4: COMPANY DETAILS (KM + EXTRA) */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                        <SectionTitle title="4. Company Details (KM + Extra)" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <InputField label="Start KM" type="number" value={form.start_km} onChange={v => handleFieldChange("start_km", v)} readOnly={readOnly} />
                            <InputField label="End KM" type="number" value={form.end_km} onChange={v => handleFieldChange("end_km", v)} readOnly={readOnly} />
                            <InputField label="Total KM" type="number" value={form.total_km} readOnly={true} className="bg-blue-50 text-blue-700 font-bold border-blue-200" />
                            <InputField label="Notes" value={form.company_notes} onChange={v => handleFieldChange("company_notes", v)} readOnly={readOnly} />
                        </div>
                    </div>

                    {/* Section 5: FINAL WEIGHT / LOSS */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
                        <SectionTitle title="5. Final Weight / Loss" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <InputField label="Unloading Weight" type="number" value={form.unloading_wt} onChange={v => handleFieldChange("unloading_wt", v)} readOnly={readOnly} />
                            <InputField label="Loss / Gain" type="number" value={form.loss_gain} readOnly={true} title="Auto-calculated field (cannot be edited)" />
                            <InputField label="Expense" type="number" value={form.expense} onChange={v => handleFieldChange("expense", v)} readOnly={readOnly} />
                            <InputField label="Notes" value={form.final_notes} onChange={v => handleFieldChange("final_notes", v)} readOnly={readOnly} />
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors">
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
              <>
                {entry?.status !== 'Completed' && (
                    <button 
                      onClick={handleMarkCompleted} 
                      disabled={saving || loading || error} 
                      className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow active:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                    >
                      Mark as Completed
                    </button>
                )}
                <button 
                  onClick={handleSave} 
                  disabled={saving || loading || error} 
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow active:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                >
                  <SaveIcon className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
    return (
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-800 tracking-tight">{title}</h3>
        </div>
    );
}

function InputField({ label, value, onChange, type = "text", className = "", readOnly, title }) {
    return (
        <div className="space-y-1 w-full" title={title}>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                {label} {readOnly && title && <span className="ml-1 text-[10px] text-zinc-400 normal-case">(Auto)</span>}
            </label>
            <input 
                type={type} 
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                    readOnly 
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-600 cursor-not-allowed' 
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400'
                } ${className}`}
                value={value ?? ""} 
                onChange={e => onChange && onChange(e.target.value)} 
                readOnly={readOnly}
                title={title}
            />
        </div>
    )
}
