"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NewGateEntryModal } from "@/components/NewGateEntryModal";
import { AdminStageDetailModal } from "@/components/AdminStageDetailModal";
import { useGatePassPrint } from "@/components/GatePassPrint";
import { STAGES, getStageStatus, getNextStageToConfirm } from "@/lib/stageUtils";
import {
  PrinterIcon,
  TruckIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  UsersIcon,
  ClipboardIcon,
  UnloadingGoodsIcon,
  LoadingGoodsIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
} from "@/components/Icons";
// import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";

// Edit Transaction Modal Component
// Edit Transaction Modal Component - Premium styling
function EditTransactionModal({ transaction, onClose, onSuccess, token }) {
  const toast = useToast();
  const { values, errors, touched, handleChange, handleBlur, validateAll } = useFormValidation(
    {
      invoice_number: transaction.invoice_number || "",
      invoice_date: transaction.invoice_date?.split('T')[0] || "",
      invoice_quantity: transaction.invoice_quantity || "",
      po_do_number: transaction.po_do_number || "",
      lr_number: transaction.lr_number || "",
      mobile_number: transaction.mobile_number || "",
      remark1: transaction.remark1 || "",
    },
    {
      invoice_number: { required: true },
      invoice_date: { required: true },
      invoice_quantity: { required: true },
      mobile_number: { required: true, type: 'mobile' },
    }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAll()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setSaving(true);
    const loadingToast = toast.loading('Updating transaction...');

    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/transactions/${transaction.transaction_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(values),
      });
      
      toast.dismiss(loadingToast);
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update transaction');
        return;
      }
      
      toast.success('Transaction updated successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const txnNo = transaction.gate_pass_no || `TRN${String(transaction.transaction_id).padStart(5, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent/50 backdrop-blur-sm p-4 transition-all" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/80 backdrop-blur-md px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                <EditIcon className="h-5 w-5" />
              </span>
              Edit Transaction
            </h3>
            <p className="text-sm text-zinc-500 font-medium ml-10 mt-1">
              {txnNo} • <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-xs border border-zinc-200 font-semibold">{transaction.transaction_type}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors" 
            aria-label="Close"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Read-only Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Truck Number</p>
              <p className="text-sm font-bold text-zinc-900 font-mono">{transaction.truck_no}</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Party Name</p>
              <p className="text-sm font-bold text-zinc-900 truncate" title={transaction.party_name}>{transaction.party_name}</p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Item Name</p>
              <p className="text-sm font-bold text-zinc-900 truncate" title={transaction.item_name}>{transaction.item_name}</p>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Invoice Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Invoice Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={values.invoice_number}
                  onChange={(e) => handleChange('invoice_number', e.target.value)}
                  onBlur={() => handleBlur('invoice_number')}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium outline-none transition-all ${
                    errors.invoice_number && touched.invoice_number
                      ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-500'
                      : 'border-zinc-100 bg-zinc-50 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="Enter invoice number"
                />
                {errors.invoice_number && touched.invoice_number && (
                  <p className="text-xs text-red-600 font-medium ml-1">{errors.invoice_number}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={values.invoice_date}
                  onChange={(e) => handleChange('invoice_date', e.target.value)}
                  onBlur={() => handleBlur('invoice_date')}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium outline-none transition-all ${
                    errors.invoice_date && touched.invoice_date
                       ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-500'
                       : 'border-zinc-100 bg-zinc-50 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                  }`}
                />
                {errors.invoice_date && touched.invoice_date && (
                  <p className="text-xs text-red-600 font-medium ml-1">{errors.invoice_date}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={values.invoice_quantity}
                  onChange={(e) => handleChange('invoice_quantity', e.target.value)}
                  onBlur={() => handleBlur('invoice_quantity')}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium outline-none transition-all ${
                    errors.invoice_quantity && touched.invoice_quantity
                       ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-500'
                       : 'border-zinc-100 bg-zinc-50 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="0.00"
                />
                {errors.invoice_quantity && touched.invoice_quantity && (
                  <p className="text-xs text-red-600 font-medium ml-1">{errors.invoice_quantity}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  PO/DO Number
                </label>
                <input
                  type="text"
                  value={values.po_do_number}
                  onChange={(e) => handleChange('po_do_number', e.target.value)}
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Transport Details Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 pb-2 border-b border-zinc-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Transport Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Driver Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={values.mobile_number}
                  onChange={(e) => handleChange('mobile_number', e.target.value.replace(/\D/g, ''))}
                  onBlur={() => handleBlur('mobile_number')}
                  className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium outline-none transition-all font-mono ${
                    errors.mobile_number && touched.mobile_number
                       ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-500'
                       : 'border-zinc-100 bg-zinc-50 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
                  }`}
                  placeholder="10-digit number"
                />
                {errors.mobile_number && touched.mobile_number && (
                  <p className="text-xs text-red-600 font-medium ml-1">{errors.mobile_number}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  LR Number
                </label>
                <input
                  type="text"
                  value={values.lr_number}
                  onChange={(e) => handleChange('lr_number', e.target.value)}
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                  placeholder="Optional"
                />
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Remarks / Notes
                </label>
                <textarea
                  value={values.remark1}
                  onChange={(e) => handleChange('remark1', e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400 resize-none"
                  placeholder="Any additional information..."
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-zinc-100 bg-zinc-50/80 backdrop-blur px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-zinc-900/10 hover:bg-zinc-800 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Stage Icon with Status Indicator
function StageStatusIcon({ stageKey, status, transaction }) {
  const nextStage = getNextStageToConfirm(transaction);
  const isCompleted = status[stageKey];
  const isActive = nextStage === stageKey;
  const isPending = !isCompleted && !isActive;

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded transition-all ${
        isCompleted
          ? "text-emerald-500 shadow-md"
          : isActive
          ? "bg-blue-500 text-white shadow-md animate-pulse"
          : "bg-zinc-200 text-zinc-400"
      } ${isPending ? "opacity-40" : "opacity-100"}`}
    >
      <TruckIcon className="h-6 w-6" />
    </span>
  );
}

function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  // const { theme } = useTheme();
  const { printGatePass, printEntryPass } = useGatePassPrint();
  const [transactions, setTransactions] = useState([]);
  const [counts, setCounts] = useState({
    loading: 0,
    unloading: 0,
    items: 0,
    parties: 0,
    transporters: 0,
    users: 0,
  });
  const [itemCounts, setItemCounts] = useState({ loading: [], unloading: [] });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterItem, setFilterItem] = useState("");
  const [selectedStage, setSelectedStage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stageModal, setStageModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [printModal, setPrintModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = useCallback(async () => {
    const from = dateFrom || undefined;
    const to = dateTo || undefined;
    const type = filterType !== "all" ? filterType : undefined;
    const item = filterItem || undefined;

    // Params for Transaction List (Includes all filters)
    const listParams = new URLSearchParams();
    if (from) listParams.set("from", from);
    if (to) listParams.set("to", to);
    if (type) listParams.set("type", type);
    if (item) listParams.set("item", item);

    // Params for Stats/Counts (Only filters by Date, so tabs show global counts)
    const statsParams = new URLSearchParams();
    if (from) statsParams.set("from", from);
    if (to) statsParams.set("to", to);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [txnRes, countRes, itemCountRes] = await Promise.all([
      fetch(`/api/transactions?${listParams}`, { headers }),
      fetch(`/api/transactions/counts?${statsParams}`, { headers }),
      fetch(`/api/transactions/item-counts?${statsParams}`, { headers }),
    ]);
    const txnData = await txnRes.json();
    const countData = await countRes.json();
    const itemCountData = await itemCountRes.json();

    setTransactions(Array.isArray(txnData) ? txnData : []);
    setCounts(countData);
    setItemCounts(itemCountData);
    setLoading(false);
    setCurrentPage(1);
  }, [dateFrom, dateTo, filterType, filterItem, token]);

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, [fetchData]);

  function handleExport() {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (filterType !== "all") params.set("type", filterType);
    if (filterItem) params.set("item", filterItem);
    window.open(`/api/export/transactions?${params}`, "_blank");
  }

  const toast = useToast();

  async function handleDelete(transactionId) {
    setDeleteConfirm(null);
    const loadingToast = toast.loading('Deleting transaction...');
    
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
        headers,
      });
      
      toast.dismiss(loadingToast);
      
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete transaction');
        return;
      }
      
      toast.success('Transaction deleted successfully!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error. Please try again.');
    }
  }

  const txnNo = (t) =>
    t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, "0")}`;

  const handleFilterClick = (type, item = "") => {
    setFilterType(type);
    setFilterItem(item);
  };

  const totalLoading = itemCounts.loading.reduce((sum, item) => sum + item.count, 0);
  const totalUnloading = itemCounts.unloading.reduce((sum, item) => sum + item.count, 0);

  // Compute per-stage counts from the current transaction list
  const stageCounts = (() => {
    const counts = { closed: 0 };
    STAGES.forEach(s => { counts[s.key] = 0; });
    transactions.forEach(t => {
      const next = getNextStageToConfirm(t);
      if (next === null) {
        counts.closed++;
      } else {
        counts[next] = (counts[next] || 0) + 1;
      }
    });
    return counts;
  })();

  // Filter transactions based on search query and selected stage
  const filteredTransactions = transactions.filter((t) => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        t.truck_no?.toLowerCase().includes(query) ||
        t.item_name?.toLowerCase().includes(query) ||
        t.party_name?.toLowerCase().includes(query) ||
        t.invoice_number?.toLowerCase().includes(query) ||
        t.gate_pass_no?.toLowerCase().includes(query) ||
        t.transaction_id?.toString().includes(query) ||
        txnNo(t).toLowerCase().includes(query)
      );
      if (!matchesSearch) return false;
    }
    
    // Stage filter
    if (selectedStage) {
      const currentStage = getNextStageToConfirm(t);
      if (selectedStage === 'closed') {
        if (currentStage !== null) return false;
      } else {
        if (currentStage !== selectedStage) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    return sortOrder === 'asc' 
      ? Number(a.transaction_id) - Number(b.transaction_id) 
      : Number(b.transaction_id) - Number(a.transaction_id);
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <PanelLayout title="Admin Dashboard" roleName="Admin">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Monitor and manage all transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
                <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                />
                <span className="text-slate-400 font-medium hidden sm:inline">to</span>
                <span className="text-slate-400 font-medium sm:hidden text-center">↓</span>
                <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
                />
            </div>
            <div className="flex items-center gap-2">
                <button
                onClick={() => window.location.href = '/admin'}
                className="flex-1 sm:flex-none rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider text-center"
                >
                GO
                </button>
                <button
                onClick={handleExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                <DownloadIcon className="h-4 w-4" />
                Export
                </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Top Row */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total Employee", value: counts.loading + counts.unloading, icon: UsersIcon, gradient: "from-blue-500 to-blue-600" },
            { label: "Total Items", value: counts.items, icon: ClipboardIcon, gradient: "from-indigo-500 to-indigo-600" },
            { label: "Total Transporter", value: counts.parties, icon: UsersIcon, gradient: "from-violet-500 to-violet-600" },
            { label: "Total Items", value: counts.transporters, icon: ClipboardIcon, gradient: "from-fuchsia-500 to-fuchsia-600" },
            { label: "Total Gate Pass", value: counts.loading + counts.unloading, icon: ClipboardIcon, gradient: "from-pink-500 to-pink-600" },
          ].map((stat, idx) => (
            <div key={idx} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg ring-1 ring-white/20 hover:shadow-xl transition-all hover:-translate-y-1`}>
              <div className="flex flex-col h-full justify-between relative z-10">
                <div>
                  <p className="text-3xl font-bold leading-none tracking-tight">{stat.value}</p>
                  <p className="text-xs font-semibold opacity-90 mt-1 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
              <stat.icon className="absolute right-2 bottom-2 h-16 w-16 opacity-10" />
            </div>
          ))}
        </div>

        {/* Category Filter Sections */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Unloading Section */}
          <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden shadow-sm">
            <button
              onClick={() => handleFilterClick("Unloading", "")}
              className={`w-full flex items-center justify-between p-4 border-b border-rose-100 transition-all ${
                filterType === "Unloading" && !filterItem
                  ? "bg-rose-100/50 shadow-inner"
                  : "hover:bg-rose-100/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-500 p-2 shadow-sm text-white">
                  <UnloadingGoodsIcon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-rose-900">
                  Unloading Goods [Inward] - {totalUnloading}
                </span>
              </div>
            </button>
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
              {itemCounts.unloading.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Unloading", item.item_name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    filterType === "Unloading" && filterItem === item.item_name
                      ? "bg-rose-100 text-rose-900 font-medium shadow-sm"
                      : "text-rose-700 hover:bg-rose-100/50"
                  }`}
                >
                   <div className="flex justify-between items-center">
                     <span>{item.item_name}</span>
                     <span className="bg-rose-200/50 px-2 py-0.5 rounded text-xs">{item.count}</span>
                   </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Section */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden shadow-sm">
            <button
              onClick={() => handleFilterClick("Loading", "")}
              className={`w-full flex items-center justify-between p-4 border-b border-blue-100 transition-all ${
                filterType === "Loading" && !filterItem
                  ? "bg-blue-100/50 shadow-inner"
                  : "hover:bg-blue-100/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500 p-2 shadow-sm text-white">
                  <LoadingGoodsIcon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-blue-900">
                  Loading Goods [Outward] - {totalLoading}
                </span>
              </div>
            </button>
            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
              {itemCounts.loading.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Loading", item.item_name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    filterType === "Loading" && filterItem === item.item_name
                      ? "bg-blue-100 text-blue-900 font-medium shadow-sm"
                      : "text-blue-700 hover:bg-blue-100/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{item.item_name}</span>
                    <span className="bg-blue-200/50 px-2 py-0.5 rounded text-xs">{item.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Filter Buttons */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-700">Filter by Current Stage</h3>
            <span className="text-xs text-zinc-400 font-medium">{transactions.length} total transactions</span>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="flex gap-2 min-w-max pb-2">
              {/* All Stages */}
              <button
                onClick={() => setSelectedStage(null)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === null
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                All Stages
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  selectedStage === null ? 'bg-white/20 text-white' : 'bg-zinc-300 text-zinc-700'
                }`}>
                  {transactions.length}
                </span>
              </button>

              {/* Per-Stage buttons */}
              {STAGES.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStage(stage.key)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedStage === stage.key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                  }`}
                >
                  {stage.label}
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                    selectedStage === stage.key
                      ? 'bg-white/20 text-white'
                      : stageCounts[stage.key] > 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-zinc-200 text-zinc-500'
                  }`}>
                    {stageCounts[stage.key] ?? 0}
                  </span>
                </button>
              ))}

              {/* Closed */}
              <button
                onClick={() => setSelectedStage('closed')}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === 'closed'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                CLOSED
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  selectedStage === 'closed'
                    ? 'bg-white/20 text-white'
                    : stageCounts.closed > 0
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-200 text-zinc-500'
                }`}>
                  {stageCounts.closed}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
          {/* Table Header with Search and Create Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions (truck no, item, party, invoice...)"  
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalPages > 1 && (
                <div className="flex items-center bg-white rounded-lg border border-zinc-200 p-1 shadow-sm">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-zinc-700 px-2 min-w-[70px] text-center border-x border-zinc-100">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="text-sm text-zinc-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-zinc-200">
                {filteredTransactions.length} results
              </div>
              {hasPermission("create_transactions") && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Transaction
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              </div>
            ) : (
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-zinc-100/80 text-left text-sm text-zinc-600 border-b border-zinc-200">
                    <th 
                      className="px-4 py-3 font-semibold cursor-pointer hover:bg-zinc-200 transition-colors group select-none"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      title="Click to toggle sort order (Newest/Oldest)"
                    >
                      <div className="flex items-center gap-1">
                        S/N
                        <div className="flex flex-col">
                          <svg className={`w-2 h-2 ${sortOrder === 'asc' ? 'text-zinc-800' : 'text-zinc-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                          <svg className={`w-2 h-2 ${sortOrder === 'desc' ? 'text-zinc-800' : 'text-zinc-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16l-8 8z"/></svg>
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 font-semibold">Product Name</th>
                    <th className="px-4 py-3 font-semibold">Vehicle Number</th>
                    <th className="px-4 py-3 font-semibold">Vendor Name</th>
                    {STAGES.map((s) => (
                      <th
                        key={s.key}
                        className="px-2 py-3 text-center text-xs font-semibold"
                      >
                        {s.shortLabel || s.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center font-semibold">View</th>
                    <th className="px-3 py-3 text-center font-semibold">Print</th>
                    <th className="px-3 py-3 text-center font-semibold">Edit</th>
                    <th className="px-3 py-3 text-center font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((t, idx) => {
                    const status = getStageStatus(t);
                    const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr
                        key={t.transaction_id}
                        className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-zinc-700">
                          {serialNumber}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                          {t.item_name || "N/A"}
                        </td>
                <td className="px-4 py-3">
  <span className="inline-block whitespace-nowrap rounded-md px-6 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
    {t.truck_no}
  </span>
</td>

                        <td className="px-4 py-3 text-sm text-zinc-700">
                          {t.party_name}
                        </td>
                        {STAGES.map((s) => (
                          <td
                            key={s.key}
                            className="cursor-pointer px-2 py-3 text-center hover:bg-zinc-100 transition-colors"
                            onClick={() =>
                              setStageModal({
                                transaction: t,
                                clickedStageKey: s.key,
                              })
                            }
                            title={`View ${s.label} stage`}
                          >
                            <StageStatusIcon stageKey={s.key} status={status} transaction={t} />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() =>
                              setStageModal({
                                transaction: t,
                                viewMode: "full",
                              })
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 shadow-sm transition-all"
                            title="View Full Transaction"
                          >
                            <ViewIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setPrintModal(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm transition-all"
                            title="Print"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setEditModal(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-orange-600 shadow-sm transition-all"
                            title="Edit"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setDeleteConfirm(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-red-600 shadow-sm transition-all"
                            title="Delete"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-zinc-50 border-t border-zinc-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-zinc-700">
                      Showing <span className="font-bold text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> of{' '}
                      <span className="font-bold text-zinc-900">{filteredTransactions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 bg-white text-sm font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (totalPages <= 7) return true;
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, index, array) => (
                          <div key={page} className="flex">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="relative inline-flex items-center px-4 py-2 border border-zinc-300 bg-white text-sm font-medium text-zinc-700">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-all ${
                                currentPage === page
                                  ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-md'
                                  : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                              }`}
                            >
                              {page}
                            </button>
                          </div>
                        ))}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 bg-white text-sm font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {!loading && filteredTransactions.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-600">
                {searchQuery ? `No transactions found matching "${searchQuery}"` : 'No transactions found'}
              </p>
            )}
          </div>
        </div>
      </div>

      <NewGateEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        token={token}
      />

      {stageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setStageModal(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AdminStageDetailModal
              transaction={stageModal.transaction}
              clickedStageKey={stageModal.clickedStageKey}
              viewMode={stageModal.viewMode}
              onClose={() => setStageModal(null)}
              onConfirmSuccess={() => fetchData()}
              onPrint={(txn) => printGatePass(txn)}
              onDownload={(txn) => downloadGatePass(txn)}
              canConfirmStage={
                hasPermission("confirm_stages") ||
                hasPermission("edit_transactions")
              }
            />
          </div>
        </div>
      )}

      {editModal && (
        <EditTransactionModal
          transaction={editModal}
          onClose={() => setEditModal(null)}
          onSuccess={fetchData}
          token={token}
        />
      )}

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Confirm Delete
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Are you sure you want to delete transaction {txnNo(deleteConfirm)}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.transaction_id)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-sm font-medium text-white shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {printModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPrintModal(null)}
        >
          <div 
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Select Print Format</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Choose the format you want to print for transaction #{printModal.transaction_id}.
            </p>
            
            <div className="flex flex-col gap-3">
               <button
                onClick={() => {
                  printEntryPass(printModal);
                  setPrintModal(null);
                }}
                className="flex items-center justify-center gap-3 rounded-lg border-2 border-zinc-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 group-hover:bg-blue-200">
                  <PrinterIcon className="h-5 w-5 text-zinc-600 group-hover:text-blue-700" />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-zinc-900 group-hover:text-blue-900">Entry Pass</span>
                  <span className="block text-xs text-zinc-500">Small thermal receipt format</span>
                </div>
              </button>

              <button
                onClick={() => {
                   printGatePass(printModal);
                   setPrintModal(null);
                }}
                className="flex items-center justify-center gap-3 rounded-lg border-2 border-zinc-200 p-4 hover:border-amber-500 hover:bg-amber-50 transition-all group"
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-zinc-100 group-hover:bg-amber-200">
                  <PrinterIcon className="h-5 w-5 text-zinc-600 group-hover:text-amber-700" />
                </div>
                <div className="text-left flex-1">
                   <span className="block font-bold text-zinc-900 group-hover:text-amber-900">Gate Pass</span>
                   <span className="block text-xs text-zinc-500">Full A4 page format</span>
                </div>
              </button>
            </div>

            <button
               onClick={() => setPrintModal(null)}
               className="mt-6 w-full rounded-lg py-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
