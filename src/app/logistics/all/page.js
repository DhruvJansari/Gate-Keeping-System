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
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-4">
            {/* ROW 1: High Signal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-50 pb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <TruckIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-900 leading-tight">{entry.product}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700">{entry.truck_no}</span>
                            <span className="text-xs text-zinc-400">•</span>
                            <span className="text-xs text-zinc-500">{formatDate(entry.entry_date)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-start md:self-center">
                    <div className="text-right hidden md:block">
                        <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Logistic ID</div>
                        <div className="text-xs font-mono text-zinc-600">#{entry.logistic_id}</div>
                    </div>
                    <StatusBadge status={entry.status} />
                </div>
            </div>

            {/* ROW 2: Parties */}
            <div className="flex items-center gap-2 text-sm text-zinc-600 bg-zinc-50/50 p-2 rounded-lg border border-zinc-100/50">
                <span className="font-semibold text-zinc-900">{entry.consignor_name}</span>
                <span className="text-zinc-300">→</span>
                <span className="font-semibold text-zinc-900">{entry.consignee_name}</span>
            </div>

            {/* ROW 3: Weights & Rate */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-1">
                <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">First / Second / Net</div>
                    <div className="text-sm font-medium text-zinc-700 mt-0.5">
                        {formatCurrency(entry.gross_weight)} / {formatCurrency(entry.tare_weight)} / <span className="font-bold text-zinc-900">{formatCurrency(entry.net_weight)}</span>
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Rate</div>
                     <div className="text-sm font-medium text-zinc-700 mt-0.5">₹{formatCurrency(entry.rate)}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Amount</div>
                     <div className="text-sm font-bold text-emerald-600 mt-0.5">₹{formatCurrency(entry.amounts)}</div>
                </div>
                 <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Deduction / Expense</div>
                     <div className="text-sm font-medium text-red-600 mt-0.5">
                        -{formatCurrency(Number(entry.deduction || 0) + Number(entry.deduction_2 || 0) + Number(entry.expense || 0))}
                     </div>
                </div>
            </div>

            {/* ROW 4: Stages */}
            <div className="flex flex-wrap items-center gap-1 py-2 border-t border-zinc-100 border-dashed">
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

             {/* ROW 5 & 6: Financials & Ops Compact */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs text-zinc-500 pt-2 border-t border-zinc-100">
                <div className="flex justify-between">
                    <span>Advance:</span>
                    <span className="font-mono font-medium text-zinc-700">₹{formatCurrency(entry.advance || 0)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Start KM:</span>
                    <span className="font-mono font-medium text-zinc-700">{formatCurrency(entry.start_km)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Diesel:</span>
                    <span className="font-mono font-medium text-zinc-700">{formatCurrency(entry.diesel_ltr)}L @ {formatCurrency(entry.diesel_rate)}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Net Amt:</span>
                    <span className="font-mono font-bold text-zinc-900">₹{formatCurrency(entry.net_amount)}</span>
                </div>
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
