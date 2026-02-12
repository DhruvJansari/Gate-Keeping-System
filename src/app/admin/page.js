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
  DownloadIcon,
  LoadingGoodsIcon,
  UnloadingGoodsIcon,
  ClipboardIcon,
  UsersIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  PrinterIcon,
  TruckIcon,
  CloseIcon,
} from "@/components/Icons";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";

// Edit Transaction Modal Component
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">Edit Transaction</h3>
            <p className="text-sm text-amber-100">
              {txnNo} • {transaction.transaction_type}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-2 hover:bg-amber-500/50" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Read-only Transaction Info */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Truck Number</p>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{transaction.truck_no}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Party Name</p>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{transaction.party_name}</p>
            </div>
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 p-3 bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Item Name</p>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">{transaction.item_name}</p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-6">
            {/* Invoice Section */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={values.invoice_number}
                    onChange={(e) => handleChange('invoice_number', e.target.value)}
                    onBlur={() => handleBlur('invoice_number')}
                    className={`w-full rounded-lg border ${
                      errors.invoice_number && touched.invoice_number
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-amber-500'
                    } bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
                  />
                  {errors.invoice_number && touched.invoice_number && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.invoice_number}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={values.invoice_date}
                    onChange={(e) => handleChange('invoice_date', e.target.value)}
                    onBlur={() => handleBlur('invoice_date')}
                    className={`w-full rounded-lg border ${
                      errors.invoice_date && touched.invoice_date
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-amber-500'
                    } bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
                  />
                  {errors.invoice_date && touched.invoice_date && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.invoice_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={values.invoice_quantity}
                    onChange={(e) => handleChange('invoice_quantity', e.target.value)}
                    onBlur={() => handleBlur('invoice_quantity')}
                    className={`w-full rounded-lg border ${
                      errors.invoice_quantity && touched.invoice_quantity
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-amber-500'
                    } bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
                  />
                  {errors.invoice_quantity && touched.invoice_quantity && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.invoice_quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    PO/DO Number
                  </label>
                  <input
                    type="text"
                    value={values.po_do_number}
                    onChange={(e) => handleChange('po_do_number', e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    LR Number
                  </label>
                  <input
                    type="text"
                    value={values.lr_number}
                    onChange={(e) => handleChange('lr_number', e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={values.mobile_number}
                    onChange={(e) => handleChange('mobile_number', e.target.value)}
                    onBlur={() => handleBlur('mobile_number')}
                    className={`w-full rounded-lg border ${
                      errors.mobile_number && touched.mobile_number
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-amber-500'
                    } bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
                  />
                  {errors.mobile_number && touched.mobile_number && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.mobile_number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Remarks
              </h4>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Entry Remarks
                </label>
                <textarea
                  value={values.remark1}
                  onChange={(e) => handleChange('remark1', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter any remarks for this transaction..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end border-t border-zinc-200 dark:border-zinc-700 pt-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-sm font-medium text-white disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
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
          ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-md"
          : isActive
          ? "bg-amber-500 dark:bg-amber-600 text-white shadow-md animate-pulse"
          : "bg-zinc-200 dark:bg-zinc-700/50 text-zinc-400 dark:text-zinc-500"
      } ${isPending ? "opacity-40" : "opacity-100"}`}
    >
      <TruckIcon className="h-4 w-4" />
    </span>
  );
}

function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  const { theme } = useTheme();
  const { printGatePass, downloadGatePass } = useGatePassPrint();
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
  const [searchQuery, setSearchQuery] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = useCallback(async () => {
    const from = dateFrom || undefined;
    const to = dateTo || undefined;
    const type = filterType !== "all" ? filterType : undefined;
    const item = filterItem || undefined;

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type) params.set("type", type);
    if (item) params.set("item", item);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [txnRes, countRes, itemCountRes] = await Promise.all([
      fetch(`/api/transactions?${params}`, { headers }),
      fetch(`/api/transactions/counts?${params}`, { headers }),
      fetch(`/api/transactions/item-counts?${params}`, { headers }),
    ]);
    const txnData = await txnRes.json();
    const countData = await countRes.json();
    const itemCountData = await itemCountRes.json();

    setTransactions(Array.isArray(txnData) ? txnData : []);
    setCounts(countData);
    setItemCounts(itemCountData);
    setLoading(false);
  }, [dateFrom, dateTo, filterType, filterItem]);

  useEffect(() => {
    fetchData();
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
      if (currentStage !== selectedStage) return false;
    }
    
    return true;
  });

  return (
    <PanelLayout title="Admin Dashboard" roleName="Admin">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-200/20 via-transparent to-transparent dark:from-amber-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/20 via-transparent to-transparent dark:from-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-100/10 via-transparent to-blue-100/10 dark:from-amber-900/5 dark:to-blue-900/5 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 dark:from-amber-400 dark:to-amber-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Monitor and manage all transactions</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-zinc-600 dark:text-zinc-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => window.location.href = '/admin'}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-2 text-sm font-medium text-white shadow-md transition-all"
            >
              GO
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-md transition-all"
            >
              <DownloadIcon className="h-4 w-4" />
              Export To Excel
            </button>
          </div>
        </div>

        {/* Stats Cards - Top Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Employee", value: counts.loading + counts.unloading, icon: UsersIcon, gradient: "from-amber-500 to-amber-600" },
            { label: "Total Items", value: counts.items, icon: ClipboardIcon, gradient: "from-orange-500 to-orange-600" },
            { label: "Total Transporter", value: counts.parties, icon: UsersIcon, gradient: "from-yellow-500 to-yellow-600" },
            { label: "Total Items", value: counts.transporters, icon: ClipboardIcon, gradient: "from-amber-600 to-amber-700" },
            { label: "Total Gate Pass", value: counts.loading + counts.unloading, icon: ClipboardIcon, gradient: "from-yellow-600 to-yellow-700" },
          ].map((stat, idx) => (
            <div key={idx} className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-lg hover:shadow-xl transition-shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm opacity-90 mt-1">{stat.label}</p>
                </div>
                <stat.icon className="h-10 w-10 opacity-80" />
              </div>
            </div>
          ))}
        </div>

        {/* Category Filter Sections */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Unloading Section */}
          <div className="rounded-xl border-2 border-rose-300 dark:border-rose-800/50 bg-gradient-to-br from-rose-100/90 to-rose-200/70 dark:from-rose-900/20 dark:to-rose-900/10 shadow-md backdrop-blur-sm">
            <button
              onClick={() => handleFilterClick("Unloading", "")}
              className={`w-full flex items-center justify-between p-4 border-b-2 border-rose-300 dark:border-rose-800/50 transition-all ${
                filterType === "Unloading" && !filterItem
                  ? "bg-rose-300 dark:bg-rose-800/50 shadow-inner"
                  : "hover:bg-rose-200/60 dark:hover:bg-rose-900/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-600 dark:bg-rose-700 p-2 shadow-md">
                  <UnloadingGoodsIcon className="h-6 w-6 text-white" />
                </div>
                <span className="font-semibold text-rose-900 dark:text-rose-100">
                  Unloading Goods [Inward] - {totalUnloading}
                </span>
              </div>
            </button>
            <div className="p-3 space-y-1">
              {itemCounts.unloading.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Unloading", item.item_name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    filterType === "Unloading" && filterItem === item.item_name
                      ? "bg-rose-300 dark:bg-rose-700 text-rose-900 dark:text-rose-100 font-medium shadow-md"
                      : "text-rose-800 dark:text-rose-300 hover:bg-rose-200/50 dark:hover:bg-rose-900/20"
                  }`}
                >
                  {item.item_name} - {String(item.count).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Section */}
          <div className="rounded-xl border-2 border-blue-300 dark:border-blue-800/50 bg-gradient-to-br from-blue-100/90 to-blue-200/70 dark:from-blue-900/20 dark:to-blue-900/10 shadow-md backdrop-blur-sm">
            <button
              onClick={() => handleFilterClick("Loading", "")}
              className={`w-full flex items-center justify-between p-4 border-b-2 border-blue-300 dark:border-blue-800/50 transition-all ${
                filterType === "Loading" && !filterItem
                  ? "bg-blue-300 dark:bg-blue-800/50 shadow-inner"
                  : "hover:bg-blue-200/60 dark:hover:bg-blue-900/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-600 dark:bg-blue-700 p-2 shadow-md">
                  <LoadingGoodsIcon className="h-6 w-6 text-white" />
                </div>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  Loading Goods [Outward] - {totalLoading}
                </span>
              </div>
            </button>
            <div className="p-3 space-y-1">
              {itemCounts.loading.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Loading", item.item_name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    filterType === "Loading" && filterItem === item.item_name
                      ? "bg-blue-400 dark:bg-blue-700 text-blue-900 dark:text-blue-100 font-medium shadow-md"
                      : "text-blue-800 dark:text-blue-300 hover:bg-blue-200/50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  {item.item_name} - {String(item.count).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stage Filter Buttons */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-900/90 shadow-md backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Filter by Current Stage</h3>
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="flex gap-2 min-w-max pb-2">
              <button
                onClick={() => setSelectedStage(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === null
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All Stages
              </button>
              {STAGES.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStage(stage.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedStage === stage.key
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 shadow-lg backdrop-blur-sm overflow-hidden">
          {/* Table Header with Search and Create Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800/50 bg-gradient-to-r from-zinc-50 to-zinc-100/50 dark:from-zinc-800 dark:to-zinc-900/50">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions (truck no, item, party, invoice...)"  
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {filteredTransactions.length} of {transactions.length} transactions
              </div>
              {hasPermission("create_transactions") && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
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
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 dark:border-amber-800 border-t-amber-600 dark:border-t-amber-400" />
              </div>
            ) : (
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gradient-to-r from-zinc-800 to-zinc-900 dark:from-zinc-900 dark:to-black text-left text-sm text-white">
                    <th className="px-4 py-3 font-semibold">S/N</th>
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
                  {filteredTransactions.map((t, idx) => {
                    const status = getStageStatus(t);
                    return (
                      <tr
                        key={t.transaction_id}
                        className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.item_name || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-md px-3 py-1 text-sm font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-800 dark:text-emerald-200 shadow-sm">
                            {t.truck_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                          {t.party_name}
                        </td>
                        {STAGES.map((s) => (
                          <td
                            key={s.key}
                            className="cursor-pointer px-2 py-3 text-center hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
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
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-md transition-all hover:shadow-lg"
                            title="View Full Transaction"
                          >
                            <ViewIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => printGatePass(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-800 hover:to-zinc-900 text-white shadow-md transition-all hover:shadow-lg"
                            title="Print"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setEditModal(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md transition-all hover:shadow-lg"
                            title="Edit"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => setDeleteConfirm(t)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md transition-all hover:shadow-lg"
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
            {!loading && filteredTransactions.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
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
