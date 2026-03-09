"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { TruckIcon, ViewIcon, EditIcon, DeleteIcon, CloseIcon, SearchIcon, DownloadIcon, ListIcon } from "@/components/Icons";
import { ComposeLogisticModal } from "@/components/ComposeLogisticModal";
import { LogisticEntryDetail } from "@/components/LogisticEntryDetail";
import { LogisticReceiptPrint } from "@/components/LogisticReceiptPrint";
import toast from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";

function TruckSvgIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function ConfirmationModal({ open, title, message, onConfirm, onClose, isDestructive }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 transition-colors"><CloseIcon className="h-5 w-5" /></button>
                </div>
                <p className="text-sm text-zinc-600">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm active:scale-95 transition-all ${isDestructive ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}

function FilterDropdown({ label, value, onChange, options, disabled }) {
    return (
        <div className="flex flex-col gap-1 min-w-[140px] flex-1">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</label>
            <select 
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-2 py-2 text-sm text-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer hover:bg-white hover:border-zinc-300"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">All</option>
                {options.map((opt, i) => {
                    const isObj = typeof opt === 'object' && opt !== null;
                    const val = isObj ? (opt.driver_id || opt.value || opt.id) : opt;
                    const text = isObj ? (opt.driver_name || opt.label || opt.name) : opt;
                    return (
                        <option key={val || i} value={val}>{text}</option>
                    );
                })}
            </select>
        </div>
    )
}

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

export default function LogisticDashboard() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Create / Edit / View Modals
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, id: null, readOnly: false });
  
  // Print State
  const [printEntry, setPrintEntry] = useState(null);

  // Confirmation State
  const [confirmState, setConfirmState] = useState({ open: false, title: "", message: "", action: null, isDestructive: false });

  // Filters & Search
  const [filters, setFilters] = useState({ consignor: "", consignee: "", truck_no: "", product: "", driver: "" });
  const [dateFilters, setDateFilters] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [filterOptions, setFilterOptions] = useState({ consignors: [], consignees: [], trucks: [], products: [], drivers: [] });

  // Admin/Manager: default to today's date on first mount
  useEffect(() => {
    if (!user) return;
    if (user.role_name === 'Admin' || user.role_name === 'View Only Admin' || user.role_name === 'Manager') {
      const today = new Date().toISOString().split('T')[0];
      setDateFilters({ from: today, to: today });
    }
  }, [user?.role_name]); // eslint-disable-line react-hooks/exhaustive-deps
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Stage Sequence
  const STAGES = [
    { field: "loading_site_at", label: "Loading Site" },
    { field: "loading_point_in_at", label: "Loading In" },
    { field: "loading_point_out_at", label: "Loading Out" },
    { field: "unloading_site_at", label: "Unloading Site" },
    { field: "unloading_point_in_at", label: "Unloading In" },
    { field: "unloading_point_out_at", label: "Unloading Out" },
  ];

  // Fetch unique options for filters
  useEffect(() => {
    fetch("/api/logistic-entries?type=filters")
        .then(res => res.json())
        .then(data => {
            if (data && !data.error) {
                setFilterOptions({
                    consignors: data.consignors || [],
                    consignees: data.consignees || [],
                    trucks: data.trucks || [],
                    products: data.products || [],
                    drivers: data.drivers || []
                });
            }
        })
        .catch(err => console.error("Failed to load filters", err));
  }, [sortOrder]); // Re-run when sort order changes

  const fetchEntries = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'View Only Admin' || user?.role_name === 'Manager';
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fromDate = dateFilters.from || (isAdmin ? today : "");
      const toDate = dateFilters.to || (isAdmin ? today : "");

      if (filters.consignor) params.append("consignor", filters.consignor);
      if (filters.consignee) params.append("consignee", filters.consignee);
      if (filters.truck_no) params.append("truck_no", filters.truck_no);
      if (filters.product) params.append("product", filters.product);
      if (filters.driver) params.append("driver_id", filters.driver);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      if (statusFilter !== "All") params.append("status_filter", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("order", sortOrder);

      const res = await fetch(`/api/logistic-entries?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!isBackground) setError(err.message);
      // Don't show toast on background poll failure to avoid spam
      if (!isBackground) toast.error("Failed to load entries");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [filters, dateFilters, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchEntries();

    // Real-time updates: Poll every 10 seconds
    const intervalId = setInterval(() => {
        // Only poll if window is focused to save resources (optional, but good practice)
        if (document.visibilityState === 'visible') {
            fetchEntries(true);
        }
    }, 10000);  

    return () => clearInterval(intervalId);
  }, [fetchEntries]);

  const handleExport = async () => {
      try {
          const params = new URLSearchParams();
          if (filters.consignor) params.append("consignor", filters.consignor);
          if (filters.consignee) params.append("consignee", filters.consignee);
          if (filters.truck_no) params.append("truck_no", filters.truck_no);
          if (filters.product) params.append("product", filters.product);
          if (dateFilters.from) params.append("from", dateFilters.from);
          if (dateFilters.to) params.append("to", dateFilters.to);
          if (statusFilter !== "All") params.append("status_filter", statusFilter);
          if (debouncedSearch) params.append("search", debouncedSearch);

          // Show specific toast if no date selected (exporting today's data)
          if (!dateFilters.from && !dateFilters.to) {
             toast("Exporting today's records (Default)", { icon: "ℹ️" });
          } else {
             toast.loading("Exporting data...", { id: "export" });
          }
          
          const res = await fetch(`/api/logistic-entries/export?${params.toString()}`);
          if (!res.ok) throw new Error("Export failed");
          
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `logistic-export-${new Date().toISOString().split('T')[0]}.csv`; // Or .xlsx
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          
          toast.success("Export complete", { id: "export" });
      } catch (err) {
          toast.error("Export failed: " + err.message, { id: "export" });
      }
  };

  const handleConfirmStageClick = (entry, field) => {
      const stage = STAGES.find(s => s.field === field);
      setConfirmState({
          open: true,
          title: `Confirm ${stage.label}`,
          message: `Are you sure you want to mark ${stage.label} as completed? This will move the transaction to the next stage.`,
          action: () => processStageConfirm(entry.logistic_id, field, stage),
          isDestructive: false
      });
  };

  const processStageConfirm = async (id, field, stage) => {
      try {
          const updateData = { [field]: new Date().toISOString() };
          // If this is the last stage, also close the entry
          if (field === STAGES[STAGES.length - 1].field) {
              updateData.status = "Closed";
          }

          const token = localStorage.getItem("token");
          const res = await fetch(`/api/logistic-entries/${id}`, {
              method: "PATCH",
              headers: { 
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify(updateData)
          });
          if (!res.ok) throw new Error("Failed to update status");
          toast.success(`${stage.label} confirmed`);
          fetchEntries();
          setConfirmState({ ...confirmState, open: false });
      } catch (err) {
          toast.error(err.message);
      }
  };

  const handleDeleteClick = (id) => {
      setConfirmState({
          open: true,
          title: "Delete Entry",
          message: "Are you sure you want to delete this logistic entry? This action cannot be undone.",
          action: () => processDelete(id),
          isDestructive: true
      });
  };

  const processDelete = async (id) => {
      try {
           const token = localStorage.getItem("token");
           const res = await fetch(`/api/logistic-entries/${id}`, { 
               method: "DELETE",
               headers: {
                   "Content-Type": "application/json",
                   ...(token ? { Authorization: `Bearer ${token}` } : {})
               }
           });
           if (res.status === 405 || res.status === 404) {
                toast.error("Delete not supported for this item type yet");
                setConfirmState({ ...confirmState, open: false });
                return;
           }
           if (!res.ok) throw new Error("Failed to delete entry");
           
           toast.success("Entry deleted successfully");
           fetchEntries();
           setConfirmState({ ...confirmState, open: false });
      } catch(err) {
           toast.error(err.message);
      }
  };

  const fmtDate = (isoString) => {
      if (!isoString) return "";
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const StageCell = ({ entry, field, index }) => {
      const isDone = !!entry[field];
      const isPreviousDone = index === 0 || !!entry[STAGES[index - 1].field];
      const hasPerm = user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('edit_transactions') || hasPermission('manage_logistics');
      const isActive = !isDone && isPreviousDone && entry.status !== "Closed" && hasPerm;

      return (
          <td className={`px-2 py-3 border-r border-zinc-100 text-center transition-all ${isActive ? 'bg-blue-50/30 cursor-pointer' : 'cursor-default'}`}
             onClick={(e) => {
                 e.stopPropagation();
                 if (isActive) handleConfirmStageClick(entry, field);
             }}
          >
              <div className="flex flex-col items-center justify-center">
                  {isDone ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-500 shadow-sm border border-emerald-100" title={`Completed at ${new Date(entry[field]).toLocaleString()}`}>
                          <TruckIcon className="h-5 w-5" />
                      </div>
                  ) : isActive ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20 border-2 border-blue-500 animate-pulse" title="Next stage to confirm">
                          <TruckIcon className="h-5 w-5" />
                      </div>
                  ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 border border-zinc-200 opacity-60">
                          <TruckIcon className="h-5 w-5" />
                      </div>
                  )}
              </div>
          </td>
      );
  };

  return (
    <PanelLayout title="Logistic Dashboard" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <TruckSvgIcon className="h-6 w-6" />
                    </div>
                     <div>
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                            Logistic Dashboard
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                LIVE
                            </span>
                        </h2>
                        <p className="text-sm text-zinc-500 font-medium">Manage independent logistic entries</p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200 w-full sm:w-auto overflow-x-auto">
                      <DateFilter label="From" value={dateFilters.from} onChange={v => setDateFilters(prev => ({ ...prev, from: v }))} />
                      <div className="w-px h-8 bg-zinc-200 shrink-0"></div>
                      <DateFilter label="To" value={dateFilters.to} onChange={v => setDateFilters(prev => ({ ...prev, to: v }))} />
                    </div>
                    
                    <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                        <button 
                            onClick={() => setStatusFilter("Pending")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === "Pending" ? "bg-white text-blue-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setStatusFilter("Completed")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${statusFilter === "Completed" ? "bg-white text-emerald-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                        >
                            Completed
                        </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button 
                             onClick={handleExport}
                             className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-semibold rounded-lg text-sm transition-all shadow-sm h-[42px] whitespace-nowrap"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            Export
                        </button>
                        <button 
                            onClick={() => router.push(user?.role_name === 'Logistics Manager' ? "/logistics/all" : "/admin/logistic-dashboard/all")}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 font-semibold rounded-lg text-sm transition-all shadow-sm h-[42px] whitespace-nowrap"
                        >
                            <ListIcon className="h-4 w-4" />
                            View All
                        </button>
                        {(user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('edit_transactions') || hasPermission('manage_logistics')) && (
                          <button 
                              onClick={() => setIsComposeOpen(true)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-blue-500/20 shadow-lg text-sm transition-all active:scale-95 h-[42px] whitespace-nowrap"
                          >
                              + New
                          </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="px-6 py-4 bg-zinc-50/50 flex flex-col xl:flex-row items-stretch gap-4">
                 <div className="relative flex-1 min-w-[200px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-2/2 h-4 w-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search entries..." 
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                 </div>
                 
                 <div className="w-px h-8 bg-zinc-200 hidden xl:block"></div>

                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-[2]">
                    <FilterDropdown 
                        label="Consignor" 
                        value={filters.consignor} 
                        onChange={v => setFilters(prev => ({ ...prev, consignor: v }))} 
                        options={filterOptions.consignors} 
                    />
                    <FilterDropdown 
                        label="Consignee" 
                        value={filters.consignee} 
                        onChange={v => setFilters(prev => ({ ...prev, consignee: v }))} 
                        options={filterOptions.consignees} 
                    />
                    <FilterDropdown 
                        label="Truck No" 
                        value={filters.truck_no} 
                        onChange={v => setFilters(prev => ({ ...prev, truck_no: v }))} 
                        options={filterOptions.trucks} 
                    />
                    <FilterDropdown 
                        label="Product" 
                        value={filters.product} 
                        onChange={v => setFilters(prev => ({ ...prev, product: v }))} 
                        options={filterOptions.products} 
                    />
                    <FilterDropdown 
                        label="Driver" 
                        value={filters.driver} 
                        onChange={v => setFilters(prev => ({ ...prev, driver: v }))} 
                        options={filterOptions.drivers} 
                    />
                 </div>
            </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th 
                      className="px-4 py-4 font-bold border-r border-zinc-200 cursor-pointer hover:bg-zinc-200 transition-colors"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      title="Sort Oldest/Latest"
                  >
                      S/N {sortOrder === 'desc' ? '↓' : '↑'}
                  </th>
                  {/* <th className="px-4 py-4 font-bold border-r border-zinc-200">Item</th> */}
                  <th className="px-4 py-4 font-bold border-r border-zinc-200">Vehicle No</th>
                  <th className="px-4 py-4 font-bold border-r border-zinc-200">Date</th>
                  {STAGES.map(s => (
                    <th key={s.field} className="px-4 py-4 font-bold border-r border-zinc-200 text-center">{s.label}</th>
                  ))}
                  <th className="px-4 py-4 font-bold text-center border-r border-zinc-200">Status</th>
                  <th className="px-4 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan="12" className="py-12 text-center text-zinc-400">Loading entries...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan="12" className="py-12 text-center text-zinc-400">No entries found matching your filters.</td></tr>
                ) : (
                  entries.map((entry, i) => (
                    <tr 
                        key={entry.logistic_id} 
                        className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 border-r border-zinc-100 font-mono text-xs text-zinc-500">{entry.logistic_id}</td>
                      {/* <td className="px-4 py-3 border-r border-zinc-100 font-bold text-zinc-900">{entry.product}</td> */}
                      <td className="px-4 py-3 border-r border-zinc-100 font-mono font-bold text-zinc-800">{entry.truck_no}</td>
                      <td className="px-4 py-3 border-r border-zinc-100 whitespace-nowrap">{fmtDate(entry.entry_date)}</td>
                      
                      {STAGES.map((s, idx) => (
                          <StageCell key={s.field} entry={entry} field={s.field} index={idx} />
                      ))}

                      <td className="px-4 py-3 text-center border-r border-zinc-100">
                          <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${entry.status === 'Closed' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-700'}`}>
                              {entry.status}
                          </span>
                      </td>
                      
                      <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => setDetailModal({ open: true, id: entry.logistic_id, readOnly: true })}
                                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                  <ViewIcon className="h-4 w-4" />
                              </button>
                              {(user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('edit_transactions') || hasPermission('manage_logistics')) && (
                                <button 
                                  onClick={() => setDetailModal({ open: true, id: entry.logistic_id, readOnly: false })}
                                  className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit Entry"
                                >
                                    <EditIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setPrintEntry(entry)}
                                className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                title="Print Transport Receipt"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                              </button>
                              {(user?.role_name === 'Admin' || hasPermission('delete_transactions')) && user?.role_name !== 'Logistics Manager' && user?.role_name !== 'Manager' && (
                                <button 
                                  onClick={() => handleDeleteClick(entry.logistic_id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Entry"
                                >
                                    <DeleteIcon className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden bg-zinc-50/50 p-4 space-y-4">
             {loading ? (
                  <div className="flex items-center justify-center p-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center p-8 text-zinc-400 italic">No entries found matching your filters.</div>
                ) : (
                  entries.map((entry) => {
                    // Calculate active stage for mobile display
                    const activeStageIndex = STAGES.findIndex(s => !entry[s.field]);
                    const activeStage = activeStageIndex !== -1 ? STAGES[activeStageIndex] : null;

                    return (
                    <div key={entry.logistic_id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        {/* Card Header */}
                        <div className="p-3 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono font-bold text-lg text-zinc-900">{entry.truck_no}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${entry.status === 'Closed' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {entry.status}
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-500 font-medium">{fmtDate(entry.entry_date)}</div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setDetailModal({ open: true, id: entry.logistic_id, readOnly: true })}
                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                                >
                                    <ViewIcon className="h-4 w-4" />
                                </button>
                                {(user?.role_name === 'Admin' || hasPermission('delete_transactions')) && user?.role_name !== 'Logistics Manager' && user?.role_name !== 'Manager' && (
                                  <button 
                                      onClick={() => handleDeleteClick(entry.logistic_id)}
                                      className="p-2 bg-red-50 text-red-600 rounded-lg"
                                  >
                                      <DeleteIcon className="h-4 w-4" />
                                  </button>
                                )}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3 space-y-3">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Product</div>
                                <div className="font-semibold text-zinc-900 text-sm">{entry.product}</div>
                            </div>
                            
                            {/* Mobile Stage Action */}
                            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-zinc-700">Current Stage</span>
                                    {entry.status === "Closed" ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                            <TruckIcon className="h-3 w-3" /> Completed
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-blue-600">
                                            {activeStage?.label || "Processing"}
                                        </span>
                                    )}
                                </div>
                                
                                {entry.status !== "Closed" && activeStage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleConfirmStageClick(entry, activeStage.field);
                                        }}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-blue-500/20 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <TruckIcon className="h-4 w-4" />
                                        Confirm {activeStage.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    )
                  })
                )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ComposeLogisticModal 
        open={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        onSuccess={fetchEntries} 
      />
      
      {printEntry && (
          <LogisticReceiptPrint entry={printEntry} onClose={() => setPrintEntry(null)} />
      )}

      {detailModal.open && (
          <LogisticEntryDetail 
            entryId={detailModal.id} 
            readOnly={detailModal.readOnly}
            onClose={() => setDetailModal({ open: false, id: null })}
            onUpdate={fetchEntries}
          />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal 
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onClose={() => setConfirmState({ ...confirmState, open: false })}
        isDestructive={confirmState.isDestructive}
      />

    </PanelLayout>
  );
}
