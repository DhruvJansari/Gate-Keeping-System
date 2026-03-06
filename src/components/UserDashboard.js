"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { NewGateEntryModal } from "@/components/NewGateEntryModal";
import { AdminStageDetailModal } from "@/components/AdminStageDetailModal";
import { useGatePassPrint } from "@/components/GatePassPrint";
import { STAGES, getStageStatus, getNextStageToConfirm, getPreviousStageOfActive } from "@/lib/stageUtils";
import { determineUserSteps, STEPS, PERMISSIONS } from "@/lib/permissionUtils";
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
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/Icons";
// import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";

// Edit Transaction Modal Component
// Edit Transaction Modal Component - Premium Light Theme
// Edit Transaction Modal Component - Premium styling
function EditTransactionModal({ transaction, onClose, onSuccess, token }) {
  const toast = useToast();
  const { values, errors, touched, handleChange, handleBlur, validateAll, setValues } = useFormValidation(
    {
      invoice_number: transaction.invoice_number || "",
      invoice_date: transaction.invoice_date?.split('T')[0] || "",
      invoice_quantity: transaction.invoice_quantity || "",
      po_do_number: transaction.po_do_number || "",
      lr_number: transaction.lr_number || "",
      mobile_number: transaction.mobile_number || "",
      remark1: transaction.remark1 || "",
      rate: transaction.rate || "",
    },
    {
      invoice_number: { required: true },
      invoice_date: { required: true },
      invoice_quantity: { required: true },
      mobile_number: { required: true, type: 'mobile' },
    }
  );
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveTransaction() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`/api/transactions/${transaction.transaction_id}`, { headers });
        if (!res.ok) throw new Error("Failed to fetch transaction details");
        const data = await res.json();
        if (isMounted) {
          setValues({
            invoice_number: data.invoice_number || "",
            invoice_date: data.invoice_date?.split('T')[0] || "",
            invoice_quantity: data.invoice_quantity || "",
            po_do_number: data.po_do_number || "",
            lr_number: data.lr_number || "",
            mobile_number: data.mobile_number || "",
            remark1: data.remark1 || "",
            rate: data.rate || "",
          });
          setLoadingData(false);
        }
      } catch (err) {
        if (isMounted) {
          toast.error("Could not load fresh transaction details.");
          setLoadingData(false);
        }
      }
    }
    fetchLiveTransaction();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.transaction_id, token]);

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

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent/50 backdrop-blur-sm p-4 transition-all">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center justify-center gap-4 shadow-2xl animate-pulse">
           <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
           <p className="text-zinc-600 font-medium">Loading live data...</p>
        </div>
      </div>
    );
  }

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

              {transaction.transaction_type === 'Loading' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 ml-1">
                    Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={values.rate}
                    onChange={(e) => handleChange('rate', e.target.value)}
                    className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                    placeholder="0.00"
                  />
                </div>
              )}

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
          ? "bg-amber-500 text-white shadow-md animate-pulse"
          : "bg-zinc-200 text-zinc-400"
      } ${isPending ? "opacity-40" : "opacity-100"}`}
    >
      <TruckIcon className="h-6 w-6" />
    </span>
  );
}

export default function UserDashboard({ roleName = "Dashboard" }) {
  const { user, loading: authLoading, permissions, hasPermission } = useAuth();
  // const { theme } = useTheme();
  const { printGatePass, printEntryPass, downloadGatePass } = useGatePassPrint();
  const [transactions, setTransactions] = useState([]);
  const [counts, setCounts] = useState({
    loading: 0,
    unloading: 0,
    items: 0,
    parties: 0,
    transporters: 0,
    users: 0,
    vehicles: 0,
  });
  const [itemCounts, setItemCounts] = useState({ loading: [], unloading: [] });
  // Weighbridge is no longer restricted to today's date in this context
  // nor is Gatekeeper. Only Yard is restricted to today. (Wait, the user requested NO date restriction for Yard anymore).
  // I will just remove the date locking entirely for all restricted roles to fulfill: "Remove this date-based filtering completely."
  const isRestrictedRole = false; // We no longer restrict dates for *any* role per the previous/current instructions
  const isGatekeeper = user?.role_name === 'Gatekeeper';
  
  const [dateFrom, setDateFrom] = useState(() => {
    if (typeof window === 'undefined') return "";
    return isRestrictedRole ? new Date().toISOString().split('T')[0] : "";
  });
  const [dateTo, setDateTo] = useState(() => {
    if (typeof window === 'undefined') return "";
    return isRestrictedRole ? new Date().toISOString().split('T')[0] : "";
  });

  // Re-sync dates if user object loads late
  useEffect(() => {
    if (isRestrictedRole) {
        const today = new Date().toISOString().split('T')[0];
        setDateFrom(today);
        setDateTo(today);
    }
  }, [isRestrictedRole]);

  const [filterType, setFilterType] = useState("all");
  const [filterItem, setFilterItem] = useState("");
  const [statusType, setStatusType] = useState('all'); // 'all', 'pending', 'damaged'
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

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // PERMISSION LOGIC
  const userSteps = determineUserSteps(permissions);
  // Viewers have 'view_transactions' but no specific steps returned by determineUserSteps usually
  // unless we specifically add logic. If userSteps is empty but user has view permission, treat as Viewer.
  const isViewer = !userSteps.length && permissions?.includes(PERMISSIONS.VIEW_TRANSACTIONS);

  // Filter STAGES based on user permissions
  const visibleStages = STAGES.filter(s => {
    if (isViewer) return true; // Viewer sees all stages read-only

    const k = s.key;
    if (userSteps.includes(STEPS.GATE)) {
      if (['parking', 'gate_in', 'gate_out'].includes(k)) return true;
    }
    if (userSteps.includes(STEPS.WEIGHBRIDGE)) {
      if (['gate_in', 'first_weighbridge', 'second_weighbridge', 'gate_pass'].includes(k)) return true;
    }
    if (userSteps.includes(STEPS.YARD)) {
      if (['campus_in', 'campus_out'].includes(k)) return true;
    }
    return false;
  });

  const canUserConfirmStage = (key) => {
    if (isViewer) return false;
    
    // Check specific permissions for the stage
    if (['parking', 'gate_in', 'gate_out'].includes(key)) {
        // Weighbridge role sees gate_in but cannot verify it
        if (key === 'gate_in' && user?.role_name === 'Weighbridge') return false;
        
        return hasPermission(PERMISSIONS.CONFIRM_STAGES) || hasPermission(PERMISSIONS.CREATE_TRANSACTIONS);
    }
    if (['first_weighbridge', 'second_weighbridge'].includes(key)) {
        return hasPermission(PERMISSIONS.ADD_WEIGHT_ENTRIES) || hasPermission(PERMISSIONS.WEIGHBRIDGE_ACCESS);
    }
    if (['gate_pass'].includes(key)) {
        return hasPermission(PERMISSIONS.WEIGHBRIDGE_ACCESS);
    }
    if (['campus_in', 'campus_out'].includes(key)) {
        return hasPermission(PERMISSIONS.CONFIRM_STAGES);
    }
    return false;
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    const from = dateFrom || undefined;
    const to = dateTo || undefined;
    // Params for Transaction List (Fetch ALL items for the current date and status)
    const listParams = new URLSearchParams();
    if (from) listParams.set("from", from);
    if (to) listParams.set("to", to);
    if (statusType && statusType !== "all") listParams.set("statusType", statusType);

    // Params for Stats/Counts (Only filters by Date, so tabs show global counts)
    const statsParams = new URLSearchParams();
    if (from) statsParams.set("from", from);
    if (to) statsParams.set("to", to);
    if (statusType && statusType !== "all") statsParams.set("statusType", statusType);

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [txnRes, countRes] = await Promise.all([
        fetch(`/api/transactions?${listParams}`, { headers }),
        fetch(`/api/transactions/counts?${statsParams}`, { headers }),
      ]);
      const txnData = await txnRes.json();
      const countData = await countRes.json();

      const transactionsList = Array.isArray(txnData) ? txnData : [];
      setTransactions(transactionsList);
      setCounts(countData);

      // Dynamic Item Counts calculation based on fetched backend list
      const derivedCounts = { loading: {}, unloading: {} };
      transactionsList.forEach(t => {
        if (!t.item_name) return;
        const tType = t.transaction_type === "Loading" ? "loading" : "unloading";
        derivedCounts[tType][t.item_name] = (derivedCounts[tType][t.item_name] || 0) + 1;
      });

      setItemCounts({
        loading: Object.entries(derivedCounts.loading).map(([n, c]) => ({ item_name: n, count: c })).sort((a,b)=>a.item_name.localeCompare(b.item_name)),
        unloading: Object.entries(derivedCounts.unloading).map(([n, c]) => ({ item_name: n, count: c })).sort((a,b)=>a.item_name.localeCompare(b.item_name))
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  }, [dateFrom, dateTo, filterType, filterItem, statusType, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleExport() {
    if (!hasPermission(PERMISSIONS.EXPORT_DATA)) return;
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (filterType !== "all") params.set("type", filterType);
    if (filterItem) params.set("item", filterItem);
    if (searchQuery) params.set("search", searchQuery);
    if (selectedStage) params.set("stage", selectedStage);
    window.open(`/api/export/transactions?${params}`, "_blank");
  }

  const toast = useToast();

  async function handleDelete(transactionId) {
    if (!hasPermission(PERMISSIONS.EDIT_TRANSACTIONS)) return;
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
    if (filterType === type && filterItem === item) {
        setFilterType("all");
        setFilterItem("");
    } else {
        setFilterType(type);
        setFilterItem(item);
    }
  };

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setFilterType("all");
    setFilterItem("");
  };

  const totalLoading = itemCounts.loading.reduce((sum, item) => sum + item.count, 0);
  const totalUnloading = itemCounts.unloading.reduce((sum, item) => sum + item.count, 0);

  // Filter transactions based on search query, item/type filters and selected stage
  const baseFilteredTransactions = transactions.filter((t) => {
    // Type and Item frontend filters
    if (filterType !== "all" && t.transaction_type !== filterType) return false;
    if (filterItem && t.item_name !== filterItem) return false;

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
    
    // Status Type filter fallback if api doesn't apply it (safety check)
    if (statusType === 'pending') {
      if (t.gate_out_at || t.is_damaged || t.closed_at) return false;
    } else if (statusType === 'damaged') {
      if (!t.is_damaged) return false;
    }

    // Stage filter is intentionally excluded here so that stageCounts uses the correct subset
    // We will apply the stage filter in a subsequent step
    return true;
  });

  // Now compute per-stage counts from the filtered transaction list (before stage filter)
  const stageCounts = (() => {
    const counts = { closed: 0 };
    STAGES.forEach(s => { counts[s.key] = 0; });
    baseFilteredTransactions.forEach(t => {
      if (t.closed_at) {
        counts.closed++;
      }
      // Calculate the previous stage of the active stage
      const prevStage = getPreviousStageOfActive(t);
      if (prevStage) {
        counts[prevStage]++;
      }
    });
    return counts;
  })();

  // Finally, apply the specific selected stage filter for the visual table
  const finalFilteredTransactions = baseFilteredTransactions.filter(t => {
    if (selectedStage) {
      if (selectedStage === 'closed') {
        if (!t.closed_at) return false;
      } else {
        const prevStage = getPreviousStageOfActive(t);
        if (prevStage !== selectedStage) return false;
      }
    }
    return true;
  }).sort((a, b) => {

    // Stage filter
    if (selectedStage) {
      if (selectedStage === 'closed') {
        if (!t.closed_at) return false;
      } else {
        const prevStage = getPreviousStageOfActive(t);
        if (prevStage !== selectedStage) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // console.log('Sorting:', sortOrder, a.transaction_id, b.transaction_id);
    return sortOrder === 'asc' 
      ? Number(a.transaction_id) - Number(b.transaction_id) 
      : Number(b.transaction_id) - Number(a.transaction_id);
  });

  const totalPages = Math.ceil(finalFilteredTransactions.length / itemsPerPage);
  const paginatedTransactions = finalFilteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Per-stage counts for the *filtered* list — drives table column header badges
  const filteredStageCounts = (() => {
    const counts = {};
    STAGES.forEach(s => { counts[s.key] = 0; });
    finalFilteredTransactions.forEach(t => {
      const statuses = getStageStatus(t);
      STAGES.forEach(s => {
        if (statuses[s.key]) {
          counts[s.key]++;
        }
      });
    });
    return counts;
  })();

  const isYardRole = user?.role_name?.toUpperCase().includes('YARD');

  return (
    <PanelLayout title="Dashboard" roleName={roleName}>
      {/* Background decorative elements - Subtle Light */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {roleName}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage your daily tasks and transactions</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {!isYardRole && (
              <>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  disabled={isRestrictedRole}
                  className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all ${isRestrictedRole ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                />
                <span className="text-slate-400 font-medium">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  disabled={isRestrictedRole}
                  className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all ${isRestrictedRole ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                />
                {isRestrictedRole && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    Viewing Today&apos;s Active
                  </span>
                )}
                <button
                  onClick={() => fetchData()}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all uppercase tracking-wider"
                >
                  GO
                </button>
              </>
            )}
            
            {hasPermission(PERMISSIONS.EXPORT_DATA) && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <DownloadIcon className="h-4 w-4" />
                Export
              </button>
            )}
            
          </div>
        </div>

        {/* Stats Cards - Top Row - Only for Gatekeeper */}
        {/* Stats Section - Responsive */}
        {user?.role_name === 'Gatekeeper' && (
          <div className="space-y-4">
            {/* Stats Items */}
            <div className="flex overflow-x-auto gap-3 pb-2 md:grid md:grid-cols-4 md:gap-4 md:pb-0 scrollbar-hide px-1">
              {[
                { label: "Gate Passes", value: counts.loading + counts.unloading, icon: ClipboardIcon, gradient: "from-pink-500 to-pink-600" },
                { label: "Transporters", value: counts.transporters, icon: UsersIcon, gradient: "from-violet-500 to-violet-600" },
                { label: "Vehicles", value: counts.vehicles, icon: TruckIcon, gradient: "from-fuchsia-500 to-fuchsia-600" },
                { label: "Users", value: counts.users, icon: UsersIcon, gradient: "from-blue-500 to-blue-600" },
              ].map((stat, idx) => (
                <div key={idx} className={`relative flex-shrink-0 min-w-[130px] md:min-w-0 rounded-xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-lg ring-1 ring-white/20`}>
                   <div className="flex flex-col h-full justify-between">
                     <div className="z-10">
                       <p className="text-3xl font-bold leading-none tracking-tight">{stat.value}</p>
                       <p className="text-xs font-semibold opacity-90 mt-1 uppercase tracking-wide">{stat.label}</p>
                     </div>
                     <stat.icon className="absolute right-2 bottom-2 h-12 w-12 opacity-10" />
                   </div>
                </div>
              ))}
            </div>

            {/* Category Filters - Responsive Wrapper */}
            <>
              {/* Mobile View (Compact) */}
              <div className="md:hidden grid grid-cols-2 gap-3">
                 {/* Unloading - Light Theme */}
                 <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden shadow-sm">
                    <button 
                       onClick={() => handleFilterClick("Unloading", "")}
                       className={`w-full p-3 text-left transition-colors ${filterType === "Unloading" && !filterItem ? "bg-rose-100" : "hover:bg-rose-100/50"}`}
                    >
                       <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">Inward</p>
                       <div className="flex items-center justify-between mt-0.5">
                         <span className="text-sm font-bold text-rose-900">Unloading</span>
                         <span className="bg-rose-200 text-rose-800 text-xs px-2 py-0.5 rounded-full font-bold">{totalUnloading}</span>
                       </div>
                    </button>
                    {filterType === "Unloading" && (
                       <div className="border-t border-rose-200 max-h-48 overflow-y-auto">
                          {itemCounts.unloading.map((item, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleFilterClick("Unloading", item.item_name)}
                                className={`w-full flex justify-between px-3 py-2 text-xs border-b border-rose-100 last:border-0 ${
                                   filterItem === item.item_name ? "bg-rose-200 font-bold text-rose-900" : "hover:bg-rose-100/50 text-rose-800"
                                }`}
                             >
                                <span className="truncate mr-2">{item.item_name}</span>
                                <span>{item.count}</span>
                             </button>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Loading - Light Theme */}
                 <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden shadow-sm">
                    <button 
                       onClick={() => handleFilterClick("Loading", "")}
                       className={`w-full p-3 text-left transition-colors ${filterType === "Loading" && !filterItem ? "bg-blue-100" : "hover:bg-blue-100/50"}`}
                    >
                       <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Outward</p>
                       <div className="flex items-center justify-between mt-0.5">
                         <span className="text-sm font-bold text-blue-900">Loading</span>
                         <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">{totalLoading}</span>
                       </div>
                    </button>
                    {filterType === "Loading" && (
                       <div className="border-t border-blue-200 max-h-48 overflow-y-auto">
                          {itemCounts.loading.map((item, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleFilterClick("Loading", item.item_name)}
                                className={`w-full flex justify-between px-3 py-2 text-xs border-b border-blue-100 last:border-0 ${
                                   filterItem === item.item_name ? "bg-blue-200 font-bold text-blue-900" : "hover:bg-blue-100/50 text-blue-800"
                                }`}
                             >
                                <span className="truncate mr-2">{item.item_name}</span>
                                <span>{item.count}</span>
                             </button>
                          ))}
                       </div>
                    )}
                 </div>
              </div>

              {/* Desktop View (Expanded) */}
              <div className="hidden md:grid gap-4 sm:grid-cols-2">
                {/* Unloading Section - Light Premium */}
                <div className="rounded-xl border-2 border-rose-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <button
                    onClick={() => handleFilterClick("Unloading", "")}
                    className={`w-full flex items-center justify-between p-4 border-b border-rose-100 transition-all ${
                      filterType === "Unloading" && !filterItem
                        ? "bg-rose-50"
                        : "hover:bg-rose-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-rose-100 p-2 text-rose-600 shadow-sm">
                        <UnloadingGoodsIcon className="h-6 w-6" />
                      </div>
                      <span className="font-bold text-rose-900">
                        Unloading - {totalUnloading}
                      </span>
                    </div>
                    {filterType === "Unloading" && (
                      <div 
                        onClick={handleClearFilter}
                        className="rounded-full bg-rose-200/50 p-1 text-rose-700 hover:bg-rose-300 transition-colors"
                        title="Clear Filter"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                  <div className="p-3 space-y-1 bg-white max-h-[300px] overflow-y-auto custom-scrollbar">
                    {itemCounts.unloading.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFilterClick("Unloading", item.item_name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          filterType === "Unloading" && filterItem === item.item_name
                            ? "bg-rose-100 text-rose-900 font-bold border border-rose-200 shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-rose-700 hover:pl-4"
                        }`}
                      >
                         <div className="flex justify-between items-center">
                            <span className="truncate pr-2">{item.item_name}</span>
                            <span className="font-medium bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-xs border border-rose-100">{String(item.count).padStart(2, "0")}</span>
                         </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loading Section - Light Premium */}
                <div className="rounded-xl border-2 border-blue-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <button
                    onClick={() => handleFilterClick("Loading", "")}
                    className={`w-full flex items-center justify-between p-4 border-b border-blue-100 transition-all ${
                      filterType === "Loading" && !filterItem
                        ? "bg-blue-50"
                        : "hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-600 shadow-sm">
                        <LoadingGoodsIcon className="h-6 w-6" />
                      </div>
                      <span className="font-semibold text-emerald-900">
                  Loading - {totalLoading}
                </span>
              </div>
              {filterType === "Loading" && (
                <div 
                  onClick={handleClearFilter}
                  className="rounded-full bg-emerald-200/50 p-1 text-emerald-700 hover:bg-emerald-300 transition-colors"
                  title="Clear Filter"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </button>
                  <div className="p-3 space-y-1 bg-white max-h-[300px] overflow-y-auto custom-scrollbar">
                    {itemCounts.loading.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFilterClick("Loading", item.item_name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          filterType === "Loading" && filterItem === item.item_name
                            ? "bg-blue-100 text-blue-900 font-bold border border-blue-200 shadow-sm"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-blue-700 hover:pl-4"
                        }`}
                      >
                         <div className="flex justify-between items-center">
                            <span className="truncate pr-2">{item.item_name}</span>
                            <span className="font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">{String(item.count).padStart(2, "0")}</span>
                         </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          </div>
        )}

        {/* Stage Filter Buttons - Light Theme */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wide opacity-80 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filter by Stage
             </h3>
             <div className="flex items-center gap-3">
               <span className="text-xs text-zinc-400 font-medium">{baseFilteredTransactions.length} total</span>
               {selectedStage && (
                 <button onClick={() => setSelectedStage(null)} className="text-xs text-blue-600 hover:underline font-medium">Clear Filter</button>
               )}
             </div>
          </div>
          <div className="overflow-x-auto -mx-2 px-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
            <div className="flex gap-2 min-w-max">
              {/* All Stages */}
              <button
                onClick={() => setSelectedStage(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shadow-sm border ${
                  selectedStage === null
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md ring-2 ring-blue-100'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                All Stages
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  selectedStage === null ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {baseFilteredTransactions.length}
                </span>
              </button>

              {/* Per-Stage buttons */}
              {visibleStages.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => setSelectedStage(stage.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shadow-sm border ${
                    selectedStage === stage.key
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md ring-2 ring-blue-100'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-900'
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shadow-sm border ${
                  selectedStage === 'closed'
                    ? 'bg-zinc-800 text-white border-zinc-800 shadow-md'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-800'
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

        {/* Transaction Content - Cards (Mobile) / Table (Desktop) - Premium Light */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden flex flex-col h-full min-h-[500px]">
          {/* Header with Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex-1 w-full sm:w-auto max-w-md">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search transactions..."  
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-blue-300"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
              
              <div className="flex border border-zinc-300 rounded-lg overflow-hidden bg-white shadow-sm hidden sm:flex">
                <button
                  onClick={() => setStatusType('all')}
                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                    statusType === 'all' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setStatusType('pending')}
                  className={`px-3 py-2 text-xs font-bold border-l border-zinc-200 transition-colors flex items-center gap-1 ${
                    statusType === 'pending' ? 'bg-amber-100 text-amber-800 shadow-inner' : 'text-zinc-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusType === 'pending' ? 'bg-amber-500' : 'bg-transparent'}`}></span>
                  PENDING
                </button>
                <button
                  onClick={() => setStatusType('damaged')}
                  className={`px-3 py-2 text-xs font-bold border-l border-zinc-200 transition-colors flex items-center gap-1 ${
                    statusType === 'damaged' ? 'bg-red-100 text-red-800 shadow-inner' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusType === 'damaged' ? 'bg-red-500' : 'bg-transparent'}`}></span>
                  DAMAGED
                </button>
              </div>

              <div className="text-sm font-medium text-zinc-500 whitespace-nowrap hidden lg:block bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm">
                <span className="text-zinc-900 font-bold">{finalFilteredTransactions.length}</span> results found
              </div>
              {hasPermission(PERMISSIONS.CREATE_TRANSACTIONS) && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  New Entry
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table View - Tally Prime Style */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="text-sm text-zinc-500 animate-pulse">Loading transactions...</p>
              </div>
            ) : (
              <table className="w-full min-w-[1200px] border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-600 font-bold">
                    <th 
                      className="px-4 py-3 w-16 text-center cursor-pointer hover:bg-zinc-200 transition-colors group select-none"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      title="Click to toggle sort order (Newest/Oldest)"
                    >
                      <div className="flex items-center justify-center gap-1">
                        S/N
                        <div className="flex flex-col">
                          <svg className={`w-2 h-2 ${sortOrder === 'asc' ? 'text-zinc-800' : 'text-zinc-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16l-8-8z"/></svg>
                          <svg className={`w-2 h-2 ${sortOrder === 'desc' ? 'text-zinc-800' : 'text-zinc-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l-8-8h16l-8 8z"/></svg>
                        </div>
                      </div>
                    </th>
                    <th className="px-4 py-3 w-48">Product Name</th>
                    <th className="px-4 py-3 w-32 text-center">Vehicle No.</th>
                    {!isYardRole && <th className="px-4 py-3 w-48">Vendor Name</th>}
                    {visibleStages.map((s) => (
                      <th
                        key={s.key}
                        className="px-2 py-3 text-center min-w-[100px]"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{s.shortLabel || s.label}</span>
                          <span className={`inline-flex items-center justify-center min-w-[20px] h-4 px-1.5 rounded-full text-[10px] font-bold ${
                            filteredStageCounts[s.key] > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}>
                            {filteredStageCounts[s.key] ?? 0}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedTransactions.map((t, idx) => {
                    const status = getStageStatus(t);
                    const isEven = idx % 2 === 0;
                    const serialNumber = t.transaction_id;
                    return (
                      <tr
                        key={t.transaction_id}
                        className={`transition-colors group hover:bg-blue-50/40 ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-zinc-400 text-center">
                          {serialNumber}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-900">
                          {t.item_name || <span className="text-zinc-400 italic">N/A</span>}
                        </td>
 <td className="px-4 py-3 text-center">
  <span className="inline-block whitespace-nowrap rounded px-2.5 py-1 text-xs font-bold bg-white text-zinc-700 border border-zinc-200 shadow-sm font-mono tracking-tight">
    {t.truck_no}
  </span>
</td>
                        {!isYardRole && (
                          <td className="px-4 py-3 text-sm text-zinc-600 font-medium">
                            {t.party_name}
                          </td>
                        )}
                        {visibleStages.map((s) => {
                          const isNext = getNextStageToConfirm(t) === s.key;
                          const canConfirm = canUserConfirmStage(s.key);
                          const isWeighbridgeGateIn = (user?.role_name === 'Weighbridge' || user?.role === 'Weighbridge') && s.key === 'gate_in';
                          const isCompleted = status[s.key];

                          return (
                            <td
                              key={s.key}
                              className="px-2 py-3 text-center align-middle"
                            > 
                              <div className="flex justify-center items-center h-full">
                              {canConfirm && isNext && !isCompleted && !isWeighbridgeGateIn ? (
                                <button
                                  onClick={() => setStageModal({
                                      transaction: t,
                                      clickedStageKey: s.key,
                                    })
                                  }
                                  className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm uppercase tracking-wide flex items-center gap-1"
                                  title="Confirm Stage"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Action
                                </button>
                              ) : (
                                <div 
                                  className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                  onClick={() => setStageModal({
                                      transaction: t,
                                      clickedStageKey: s.key,
                                    })
                                  }
                                >
                                   <StageStatusIcon stageKey={s.key} status={status} transaction={t} />
                                </div>
                              )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {!isYardRole && (
                              <>
                                <button
                                  onClick={() =>
                                    setStageModal({
                                      transaction: t,
                                      viewMode: "full",
                                    })
                                  }
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="View Details"
                                >
                                  <ViewIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setPrintModal(t)}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                                  title="Print"
                                >
                                  <PrinterIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                              {hasPermission(PERMISSIONS.EDIT_TRANSACTIONS) && (
                                <button
                                  onClick={() => setEditModal(t)}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Edit Transaction"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </button>
                              )}
                              {hasPermission(PERMISSIONS.EDIT_TRANSACTIONS) && user?.role_name !== 'Gatekeeper' && (
                                <button
                                  onClick={() => setDeleteConfirm(t)}
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Transaction"
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
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
                    className="relative inline-flex items-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-zinc-300 text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-zinc-700">
                      Showing <span className="font-bold text-zinc-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-zinc-900">{Math.min(currentPage * itemsPerPage, finalFilteredTransactions.length)}</span> of{' '}
                      <span className="font-bold text-zinc-900">{finalFilteredTransactions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-zinc-300 bg-white text-sm font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      
                      {/* Page Numbers - Limited for better UI */}
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
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-zinc-300 bg-white text-sm font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {!loading && finalFilteredTransactions.length === 0 && (
              <div className="py-20 text-center bg-zinc-50/50">
                 <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-4 border border-zinc-200 shadow-sm">
                    <ClipboardIcon className="h-10 w-10 text-zinc-300" />
                 </div>
                 <h3 className="text-xl font-bold text-zinc-900 mb-2">No transactions found</h3>
                 <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
                   {searchQuery ? `We couldn't find any transactions matching "${searchQuery}". Try a different search term.` : 'Get started by creating a new gate entry using the button above.'}
                 </p>
                 {searchQuery && (
                    <button 
                       onClick={() => setSearchQuery("")}
                       className="mt-6 px-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                       Clear search filters
                    </button>
                 )}
              </div>
            )}
          </div>

          {/* Mobile Card View - Premium Light */}
          <div className="md:hidden space-y-3 pb-20 bg-slate-50 p-3"> 
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                <p className="text-xs text-zinc-400">Loading...</p>
              </div>
            ) : finalFilteredTransactions.length === 0 ? (
               <div className="py-20 text-center">
                 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border border-zinc-200 mb-4 shadow-sm">
                    <ClipboardIcon className="h-8 w-8 text-zinc-300" />
                 </div>
                 <h3 className="text-lg font-bold text-zinc-900">No transactions</h3>
                 <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedTransactions.map((t) => {
                const status = getStageStatus(t);
                const nextStageKey = getNextStageToConfirm(t);
                const nextStageLabel = STAGES.find(s => s.key === nextStageKey)?.label || 'Completed';
                
                return (
                  <div key={t.transaction_id} className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden active:scale-[0.99] transition-transform duration-100 ring-1 ring-black/5">
                    <div className="p-4">
                      {/* Header: Truck & Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex flex-col">
                          <span className="inline-flex items-center self-start rounded px-2 py-1 text-sm font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-sm font-mono tracking-tight">
                            {t.truck_no}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold truncate max-w-[150px]">
                            {t.transaction_type} • {t.item_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shadow-sm ${
                            nextStageKey
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {nextStageKey ? 'Pending' : 'Done'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            #{t.transaction_id}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 bg-slate-50/80 rounded-lg p-3 border border-slate-100">
                        {!isYardRole && (
                          <div>
                             <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Party</p>
                             <p className="text-xs font-semibold text-zinc-800 truncate" title={t.party_name}>
                               {t.party_name}
                             </p>
                          </div>
                        )}
                        <div className={isYardRole ? "col-span-2" : ""}>
                           <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Current Stage</p>
                           <p className={`text-xs font-bold truncate ${
                             nextStageKey ? 'text-blue-600' : 'text-emerald-600'
                           }`}>
                             {nextStageLabel}
                           </p>
                        </div>
                        {!isYardRole && (userSteps.includes(STEPS.WEIGHBRIDGE) || isViewer) && (
                          <>
                            <div>
                               <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">First Wt</p>
                               <p className="text-xs font-mono font-medium text-zinc-700">
                                 {t.first_weight ? `${t.first_weight} kg` : '—'}
                               </p>
                            </div>
                            <div>
                               <p className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Second Wt</p>
                               <p className="text-xs font-mono font-medium text-zinc-700">
                                 {t.second_weight ? `${t.second_weight} kg` : '—'}
                               </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className={`grid gap-2 ${isYardRole ? 'grid-cols-1' : 'grid-cols-4'}`}>
                        {!isYardRole && (
                          <>
                            <button
                              onClick={() => setStageModal({ transaction: t, viewMode: 'full' })}
                              className="col-span-1 flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 active:bg-zinc-50 transition-colors shadow-sm"
                            >
                              <ViewIcon className="h-4 w-4 mb-0.5" />
                              <span className="text-[9px] font-bold">View</span>
                            </button>

                            <button
                              onClick={() => setPrintModal(t)}
                              className="col-span-1 flex flex-col items-center justify-center p-2 rounded-lg bg-white border border-zinc-200 text-zinc-600 active:bg-zinc-50 transition-colors shadow-sm"
                            >
                              <PrinterIcon className="h-4 w-4 mb-0.5" />
                              <span className="text-[9px] font-bold">Print</span>
                            </button>
                          </>
                        )}
                        
                        {/* Dynamic Confirm Action */}
                        <div className={isYardRole ? "col-span-1" : "col-span-2"}>
                        {visibleStages.map(s => {
                           if (s.key !== nextStageKey) return null;
                           const canConfirm = canUserConfirmStage(s.key);
                           const isWeighbridgeGateIn = (user?.role_name === 'Weighbridge' || user?.role === 'Weighbridge') && s.key === 'gate_in';
                           
                           if (canConfirm && !isWeighbridgeGateIn) {
                             return (
                               <button
                                 key={s.key}
                                 onClick={() => setStageModal({ transaction: t, clickedStageKey: s.key })}
                                 className="w-full h-full flex flex-col items-center justify-center p-2 rounded-lg bg-blue-600 text-white shadow-sm active:bg-blue-700 transition-colors"
                               >
                                 <TruckIcon className="h-4 w-4 mb-0.5" />
                                 <span className="text-[9px] font-bold uppercase tracking-wide">
                                   Confirm {s.shortLabel || s.label.split(' ')[0]}
                                 </span>
                               </button>
                             );
                           } else if (isWeighbridgeGateIn) {
                              return (
                                <div key={s.key} className="w-full h-full flex items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200">
                                   <span className="text-[10px] text-zinc-400 font-medium italic">Pending Gate Check...</span>
                                </div>
                              );
                           }
                           return null; 
                        })}
                        {/* If no pending action or completed, show Check */}
                        {!nextStageKey && (
                          <div className="w-full h-full flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Completed
                              </span>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 bg-white border-t border-zinc-200 mt-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-zinc-300 text-xs font-bold rounded-lg text-zinc-700 bg-white shadow-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-zinc-300 text-xs font-bold rounded-lg text-zinc-700 bg-white shadow-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
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
              canConfirmStage={canUserConfirmStage(stageModal.clickedStageKey)}
              isYardRole={isYardRole}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-red-600">
               <div className="p-2 bg-red-100 rounded-full border border-red-200 shadow-sm">
                  <DeleteIcon className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-zinc-900">
                  Confirm Delete
               </h3>
            </div>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              Are you sure you want to delete transaction <span className="font-mono font-bold text-zinc-800">{txnNo(deleteConfirm)}</span>? This action cannot be undone and will remove all associated data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.transaction_id)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              >
                Delete Transaction
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
