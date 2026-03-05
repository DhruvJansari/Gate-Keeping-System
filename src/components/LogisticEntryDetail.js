"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CloseIcon, SaveIcon } from "@/components/Icons";

export function LogisticEntryDetail({ entryId, onClose, onUpdate, readOnly = false }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Editable fields for Step 3
  const [form, setForm] = useState({
    deduction: "", net_amount: "", rec_amount: "", rec_date: "",
    payment_rec_ac: false, payment_rec_ac_note: "",
    payment_cash: false, payment_cash_note: "",
    expense: "", advance: "", diesel_ltr: "", diesel_rate: "",
    unloading_wt: "", deduction_2: "", holtage: "", start_km: "", end_km: ""
  });

  useEffect(() => {
    if (entryId) fetchEntry();
  }, [entryId]);

  const fetchEntry = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/logistic-entries/${entryId}`);
      if (!res.ok) throw new Error("Failed to load details");
      
      const data = await res.json();
      setEntry(data);
      
      // Initialize edit form
      setForm({
        deduction: data.deduction || "",
        net_amount: data.net_amount || "",
        rec_amount: data.rec_amount || "",
        rec_date: data.rec_date ? new Date(data.rec_date).toISOString().split('T')[0] : "",
        payment_rec_ac: !!data.payment_rec_ac,
        payment_rec_ac_note: data.payment_rec_ac_note || "",
        payment_cash: !!data.payment_cash,
        payment_cash_note: data.payment_cash_note || "",
        expense: data.expense || "",
        advance: data.advance || "",
        diesel_ltr: data.diesel_ltr || "",
        diesel_rate: data.diesel_rate || "",
        unloading_wt: data.unloading_wt || "",
        deduction_2: data.deduction_2 || "",
        holtage: data.holtage || "",
        start_km: data.start_km || "",
        end_km: data.end_km || ""
      });
      
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/logistic-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Failed to update entry");
      
      toast.success("Entry updated successfully");
      if (onUpdate) onUpdate();
      onClose(); // Auto close on success
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!entryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                <>
                    {/* Step 1: Read Only Details */}
                    <div className="bg-zinc-50/80 rounded-xl border border-zinc-200 p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
                                Details
                            </h3>
                            <span className="text-xs font-mono text-zinc-500 bg-white px-2 py-1 rounded border border-zinc-200">
                                {new Date(entry.entry_date).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Consignor</label>
                                <div className="font-semibold text-zinc-900">{entry.consignor_name}</div>
                                <div className="text-zinc-500 text-xs">{entry.consignor_address}</div>
                                <div className="text-zinc-500 text-xs mt-0.5">{entry.consignor_place} • GST: {entry.consignor_gst || "N/A"}</div>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Consignee</label>
                                <div className="font-semibold text-zinc-900">{entry.consignee_name}</div>
                                <div className="text-zinc-500 text-xs">{entry.consignee_address}</div>
                                <div className="text-zinc-500 text-xs mt-0.5">{entry.consignee_place} • GST: {entry.consignee_gst || "N/A"}</div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-white rounded-lg border border-zinc-200 grid grid-cols-2 sm:grid-cols-5 gap-4 mt-2 shadow-sm">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 block mb-1">Truck No</label>
                                <div className="font-mono font-bold text-zinc-900 bg-zinc-50 inline-block px-1.5 rounded">{entry.truck_no}</div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 block mb-1">Amount</label>
                                <div className="font-mono font-bold text-zinc-900 bg-zinc-50 inline-block px-1.5 rounded">{entry.amounts}</div>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-zinc-500 block mb-1">Product</label>
                                <div className="font-medium text-zinc-900">{entry.product}</div>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-zinc-500 block mb-1">Weight (Net)</label>
                                <div className="font-mono font-medium text-zinc-900">{entry.net_weight}</div>
                            </div>
                             <div>
                                <label className="text-xs font-medium text-zinc-500 block mb-1">Rate</label>
                                <div className="font-mono font-medium text-zinc-900">{entry.rate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Editable Fields */}
                    <div className="bg-white rounded-xl border border-blue-100 p-5 space-y-6 shadow-sm ring-1 ring-blue-50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                        
                        <div className="flex items-center gap-2 pb-2 border-b border-blue-50">
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                Accounting & Operations
                            </h3>
                            {readOnly && <span className="ml-auto text-xs font-medium text-zinc-400 italic">Read Only Mode</span>}
                        </div>
                        
                        {/* Financials */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <InputField label="Deduction" value={form.deduction} onChange={v => setForm({...form, deduction: v})} type="number" readOnly={readOnly} />
                            <InputField label="Net Amount" value={form.net_amount} onChange={v => setForm({...form, net_amount: v})} type="number" readOnly={readOnly} />
                            <InputField label="Received Amount" value={form.rec_amount} onChange={v => setForm({...form, rec_amount: v})} type="number" readOnly={readOnly} />
                            <InputField label="Received Date" value={form.rec_date} onChange={v => setForm({...form, rec_date: v})} type="date" readOnly={readOnly} />
                        </div>

                        {/* Payment Mode */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className={`flex flex-col gap-2 p-3 rounded-lg border ${form.payment_rec_ac ? 'bg-blue-50/50 border-blue-100' : 'bg-zinc-50 border-zinc-100'}`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.payment_rec_ac} 
                                        onChange={e => !readOnly && setForm({...form, payment_rec_ac: e.target.checked})} 
                                        disabled={readOnly}
                                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" 
                                    />
                                    <label className="text-sm font-medium text-zinc-700">Payment Received in A/c</label>
                                </div>
                                {form.payment_rec_ac && (
                                    <input 
                                        placeholder="Note (Optional)" 
                                        className="input-zinc-sm ml-7 w-[calc(100%-1.75rem)]" 
                                        value={form.payment_rec_ac_note} 
                                        onChange={e => setForm({...form, payment_rec_ac_note: e.target.value})} 
                                        readOnly={readOnly}
                                    />
                                )}
                             </div>

                              <div className={`flex flex-col gap-2 p-3 rounded-lg border ${form.payment_cash ? 'bg-emerald-50/50 border-emerald-100' : 'bg-zinc-50 border-zinc-100'}`}>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.payment_cash} 
                                        onChange={e => !readOnly && setForm({...form, payment_cash: e.target.checked})} 
                                        disabled={readOnly}
                                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" 
                                    />
                                    <label className="text-sm font-medium text-zinc-700">Payment Received in Cash</label>
                                </div>
                                {form.payment_cash && (
                                    <input 
                                        placeholder="Note (Optional)" 
                                        className="input-zinc-sm ml-7 w-[calc(100%-1.75rem)]" 
                                        value={form.payment_cash_note} 
                                        onChange={e => setForm({...form, payment_cash_note: e.target.value})} 
                                        readOnly={readOnly}
                                    />
                                )}
                             </div>
                         </div>

                        {/* Expenses & Operations */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-zinc-100">
                            <InputField label="Expense" value={form.expense} onChange={v => setForm({...form, expense: v})} type="number" readOnly={readOnly} />
                            <InputField label="Advance" value={form.advance} onChange={v => setForm({...form, advance: v})} type="number" readOnly={readOnly} />
                            <InputField label="Unloading Wt" value={form.unloading_wt} onChange={v => setForm({...form, unloading_wt: v})} type="number" readOnly={readOnly} />
                            <InputField label="Deduction 2" value={form.deduction_2} onChange={v => setForm({...form, deduction_2: v})} type="number" readOnly={readOnly} />
                            <InputField label="Holtage" value={form.holtage} onChange={v => setForm({...form, holtage: v})} type="number" readOnly={readOnly} />
                        </div>
                        
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                <InputField label="Diesel (Ltr)" value={form.diesel_ltr} onChange={v => setForm({...form, diesel_ltr: v})} type="number" readOnly={readOnly} className="bg-white" />
                                <InputField label="Diesel Rate" value={form.diesel_rate} onChange={v => setForm({...form, diesel_rate: v})} type="number" readOnly={readOnly} className="bg-white" />
                            </div>
                            
                             <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                <InputField label="Start KM" value={form.start_km} onChange={v => setForm({...form, start_km: v})} type="number" readOnly={readOnly} className="bg-white" />
                                <InputField label="End KM" value={form.end_km} onChange={v => setForm({...form, end_km: v})} type="number" readOnly={readOnly} className="bg-white" />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
              <button 
                onClick={handleSave} 
                disabled={saving || loading || error} 
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow active:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                <SaveIcon className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
          )}
        </div>

        <style jsx>{`
            .input-zinc-sm {
                @apply w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-white;
            }
        `}</style>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", className = "", readOnly }) {
    return (
        <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
            <input 
                type={type} 
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                    readOnly 
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-600 cursor-not-allowed' 
                    : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400'
                } ${className}`}
                value={value} 
                onChange={e => onChange && onChange(e.target.value)} 
                readOnly={readOnly}
            />
        </div>
    )
}
