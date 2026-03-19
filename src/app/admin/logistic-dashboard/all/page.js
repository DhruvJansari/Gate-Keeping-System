"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { TruckIcon, SearchIcon, ArrowLeftIcon } from "@/components/Icons";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/format";
import toast from "react-hot-toast";

function DateFilter({ label, value, onChange }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</label>
            <input 
                type="date" 
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-2 py-2 text-sm text-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:bg-white hover:border-zinc-300"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}

function StatusBadge({ status }) {
    const isClosed = status === 'Closed';
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
            isClosed 
            ? 'bg-zinc-100 text-zinc-500 border-zinc-200' 
            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
        }`}>
            {status}
        </span>
    );
}

function LogisticCard({ entry, stages }) {
    // Helper to check if a stage is done
    const isStageDone = (field) => !!entry[field];
    
    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-5">
            {/* SECTION 1: BASIC INFO */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <TruckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-zinc-900 leading-tight tracking-tight">{entry.truck_no}</h3>
                            <StatusBadge status={entry.status} />
                        </div>
                        <p className="text-sm font-medium text-zinc-600 mb-1">{entry.product}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-zinc-500 font-medium">
                            <span className="flex items-center gap-1"><span className="text-zinc-400">Transporter:</span> <span className="text-zinc-700">{entry.transporter_name || 'N/A'}</span></span>
                            <span className="hidden sm:block text-zinc-300">•</span>
                            <span className="flex items-center gap-1"><span className="text-zinc-400">Driver:</span> <span className="text-zinc-700">{entry.driver_name || 'N/A'}</span></span>
                        </div>
                    </div>
                </div>
                <div className="text-left md:text-right shrink-0">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Entry Date</div>
                    <div className="text-sm font-medium text-zinc-700">{formatDate(entry.entry_date)}</div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">#{entry.logistic_id}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* SECTION 2: WEIGHT DETAILS */}
                <div className="space-y-3 bg-zinc-50/50 rounded-lg p-3 border border-zinc-100">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Weight Details</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-zinc-500">First Wt</div>
                        <div className="font-medium text-zinc-800 text-right">{formatCurrency(entry.tare_weight)}</div>
                        <div className="text-zinc-500">Second Wt</div>
                        <div className="font-medium text-zinc-800 text-right">{formatCurrency(entry.gross_weight)}</div>
                        <div className="text-zinc-500 font-bold border-t border-zinc-200 pt-1 mt-1">Net Wt</div>
                        <div className="font-black text-blue-700 text-right border-t border-zinc-200 pt-1 mt-1">{formatCurrency(entry.net_weight)}</div>
                        <div className="text-zinc-500">Unloading Wt</div>
                        <div className="font-medium text-zinc-800 text-right">{formatCurrency(entry.unloading_wt)}</div>
                        <div className="text-zinc-500">Loss / Gain</div>
                        <div className={`font-medium text-right ${entry.loss_gain < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {entry.loss_gain > 0 ? '+' : ''}{formatCurrency(entry.loss_gain)}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: FINANCIAL DETAILS */}
                <div className="space-y-3 bg-zinc-50/50 rounded-lg p-3 border border-zinc-100">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Financial Details</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-zinc-500">Freight Rate</div>
                        <div className="font-medium text-zinc-800 text-right">₹{formatCurrency(entry.rate)}</div>
                        <div className="text-zinc-500">Freight Amt</div>
                        <div className="font-semibold text-emerald-600 text-right">₹{formatCurrency(entry.amounts)}</div>
                        <div className="text-zinc-500">Advance</div>
                        <div className="font-medium text-zinc-800 text-right text-red-500">- ₹{formatCurrency(entry.advance)}</div>
                        <div className="text-zinc-500 font-bold border-t border-zinc-200 pt-1 mt-1">Net Amount</div>
                        <div className="font-black text-emerald-700 text-right border-t border-zinc-200 pt-1 mt-1">₹{formatCurrency(entry.net_amount)}</div>
                    </div>
                </div>

                {/* SECTION 4: KM DETAILS */}
                <div className="space-y-3 bg-zinc-50/50 rounded-lg p-3 border border-zinc-100">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">KM Details</div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-zinc-500">Start KM</div>
                        <div className="font-medium text-zinc-800 text-right">{formatCurrency(entry.start_km)}</div>
                        <div className="text-zinc-500">End KM</div>
                        <div className="font-medium text-zinc-800 text-right">{formatCurrency(entry.end_km)}</div>
                        <div className="text-zinc-500 font-bold border-t border-zinc-200 pt-1 mt-1">Total KM</div>
                        <div className="font-black text-indigo-700 text-right border-t border-zinc-200 pt-1 mt-1">{formatCurrency(entry.total_km)}</div>
                    </div>
                </div>

                {/* SECTION 5: PAYMENT DETAILS */}
                <div className="space-y-3 bg-zinc-50/50 rounded-lg p-3 border border-zinc-100 flex flex-col justify-between">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Payment Details</div>
                        <div className="space-y-2 text-xs">
                            <div className="flex flex-col gap-1 p-1.5 rounded bg-white border border-zinc-200">
                                <span className={`font-bold ${entry.payment_rec_ac ? 'text-blue-600' : 'text-zinc-500'}`}>Bank A/c: {entry.payment_rec_ac ? 'Yes' : 'No'}</span>
                                {entry.payment_rec_ac_note && <span className="text-zinc-500 italic max-h-12 overflow-y-auto w-full break-words break-all relative inline-block whitespace-normal">{entry.payment_rec_ac_note}</span>}
                            </div>
                            <div className="flex flex-col gap-1 p-1.5 rounded bg-white border border-zinc-200">
                                <span className={`font-bold ${entry.payment_cash ? 'text-emerald-600' : 'text-zinc-500'}`}>Cash: {entry.payment_cash ? 'Yes' : 'No'}</span>
                                {entry.payment_cash_note && <span className="text-zinc-500 italic max-h-12 overflow-y-auto w-full break-words break-all relative inline-block whitespace-normal">{entry.payment_cash_note}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STAGES Tracker */}
            <div className="flex flex-wrap items-center gap-1 pt-3 mt-1 border-t border-zinc-100 border-dashed">
                {stages.map((stage, idx) => {
                    const done = isStageDone(stage.field);
                    return (
                        <div key={stage.field} className="flex items-center">
                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                done 
                                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                : 'bg-zinc-50 text-zinc-400 border-zinc-100'
                            }`}>
                                {stage.label}
                            </div>
                            {idx < stages.length - 1 && <div className="w-4 h-px bg-zinc-200 mx-1"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function ViewAllLogisticEntries() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFilters, setDateFilters] = useState({ from: "", to: "" });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateFilters.from) params.append("from", dateFilters.from);
      if (dateFilters.to) params.append("to", dateFilters.to);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(`/api/logistic-entries?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [dateFilters, debouncedSearch]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Stage Config
  const STAGES = [
    { field: "loading_site_at", label: "L. Site" },
    { field: "loading_point_in_at", label: "L. In" },
    { field: "loading_point_out_at", label: "L. Out" },
    { field: "unloading_site_at", label: "U. Site" },
    { field: "unloading_point_in_at", label: "U. In" },
    { field: "unloading_point_out_at", label: "U. Out" },
  ];

  return (
    <PanelLayout title="All Logistic Entries" roleName={user?.role_name || "User"}>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">All Logistic Entries</h1>
                    <p className="text-sm text-zinc-500">Comprehensive list of all records</p>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
             <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Search all fields..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2 w-full md:w-auto">
                <DateFilter label="From" value={dateFilters.from} onChange={v => setDateFilters(prev => ({ ...prev, from: v }))} />
                <div className="w-px h-8 bg-zinc-200 hidden md:block"></div>
                <DateFilter label="To" value={dateFilters.to} onChange={v => setDateFilters(prev => ({ ...prev, to: v }))} />
             </div>
        </div>

        {/* List */}
        <div className="space-y-4">
            {loading ? (
                <div className="text-center py-20 text-zinc-400">Loading records...</div>
            ) : entries.length === 0 ? (
                <div className="text-center py-20 text-zinc-400">No records found matching your criteria.</div>
            ) : (
                entries.map(entry => (
                    <LogisticCard key={entry.logistic_id} entry={entry} stages={STAGES} />
                ))
            )}
        </div>
      </div>
    </PanelLayout>
  );
}
