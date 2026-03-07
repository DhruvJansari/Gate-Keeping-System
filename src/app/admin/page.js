"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NewGateEntryModal } from "@/components/NewGateEntryModal";
import { AdminStageDetailModal } from "@/components/AdminStageDetailModal";
import { useGatePassPrint } from "@/components/GatePassPrint";
import { STAGES, getStageStatus, getNextStageToConfirm, getPreviousStageOfActive } from "@/lib/stageUtils";
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
import { FaTruck } from "react-icons/fa";
// import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/useToast";
import { useFormValidation } from "@/hooks/useFormValidation";

// Edit Transaction Modal Component
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
      truck_no: transaction.truck_no || "",
      party_id: transaction.party_id || "",
      item_id: transaction.item_id || "",
      transporter_id: transaction.transporter_id || "",
    },
    {
      invoice_number: { required: true },
      invoice_date: { required: true },
      invoice_quantity: { required: true },
      mobile_number: { required: true, type: 'mobile' },
      truck_no: { required: true },
      party_id: { required: true },
      item_id: { required: true },
    }
  );
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [transporters, setTransporters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveTransactionAndMasters() {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [res, pRes, iRes, tRes] = await Promise.all([
          fetch(`/api/transactions/${transaction.transaction_id}`, { headers }),
          fetch('/api/parties', { headers }),
          fetch('/api/items', { headers }),
          fetch('/api/transporters', { headers })
        ]);
        
        if (!res.ok) throw new Error("Failed to fetch transaction details");
        
        const data = await res.json();
        const pData = await pRes.json();
        const iData = await iRes.json();
        const tData = await tRes.json();
        
        if (isMounted) {
          setParties(pData);
          setItems(iData);
          setTransporters(tData);
          setValues({
            invoice_number: data.invoice_number || "",
            invoice_date: data.invoice_date?.split('T')[0] || "",
            invoice_quantity: data.invoice_quantity || "",
            po_do_number: data.po_do_number || "",
            lr_number: data.lr_number || "",
            mobile_number: data.mobile_number || "",
            remark1: data.remark1 || "",
            rate: data.rate || "",
            truck_no: data.truck_no || "",
            party_id: data.party_id || "",
            item_id: data.item_id || "",
            transporter_id: data.transporter_id || "",
          });
          setLoadingData(false);
        }
      } catch (err) {
        if (isMounted) {
          toast.error("Could not load fresh transaction details or master data.");
          setLoadingData(false);
        }
      }
    }
    fetchLiveTransactionAndMasters();
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
  const isFirstWeighbridgeCompleted = transaction.first_weigh_at !== null;

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
 function formatQty(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  return num.toFixed(0);
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
          {/* Context Layer: Editable pre-Weighbridge, Read-Only post-Weighbridge */}
          {!isFirstWeighbridgeCompleted ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-zinc-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Truck <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={values.truck_no}
                  onChange={(e) => handleChange('truck_no', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('truck_no')}
                  className={`w-full rounded-xl border-2 px-3 py-2 text-sm font-medium outline-none transition-all font-mono uppercase ${
                    errors.truck_no && touched.truck_no ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500 focus:bg-white'
                  }`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Party Name <span className="text-red-500">*</span></label>
                <select
                  value={values.party_id}
                  onChange={(e) => handleChange('party_id', e.target.value)}
                  onBlur={() => handleBlur('party_id')}
                  className={`w-full rounded-xl border-2 px-3 py-2 text-sm font-medium outline-none transition-all ${
                    errors.party_id && touched.party_id ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500 focus:bg-white'
                  }`}
                >
                  <option value="">Select Party</option>
                  {parties.map(p => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Item Name <span className="text-red-500">*</span></label>
                <select
                  value={values.item_id}
                  onChange={(e) => handleChange('item_id', e.target.value)}
                  onBlur={() => handleBlur('item_id')}
                  className={`w-full rounded-xl border-2 px-3 py-2 text-sm font-medium outline-none transition-all ${
                    errors.item_id && touched.item_id ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500 focus:bg-white'
                  }`}
                >
                  <option value="">Select Item</option>
                  {items.map(i => <option key={i.item_id} value={i.item_id}>{i.item_name}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-zinc-100">
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
          )}

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
                  value={formatQty(values.invoice_quantity)}
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
                  Transporter Name
                </label>
                <select
                  value={values.transporter_id}
                  onChange={(e) => handleChange('transporter_id', e.target.value)}
                  className="w-full rounded-xl border-2 px-4 py-2.5 text-sm font-medium outline-none transition-all border-zinc-100 bg-zinc-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="">Select Transporter (Optional)</option>
                  {transporters.map(t => <option key={t.transporter_id} value={t.transporter_id}>{t.name}</option>)}
                </select>
              </div>
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
          ? "text-emerald-500"
          : isActive
          ? "text-blue-500 animate-pulse"
          : "bg-zinc-200 text-zinc-400"
      } ${isPending ? "opacity-40" : "opacity-100"}`}
    >
      <FaTruck className="h-6 w-6" />
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
  const [statusType, setStatusType] = useState("all"); // 'all', 'pending', 'damaged'
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
    const isAdmin = user?.role_name === 'Admin' || user?.role_name === 'View Only Admin' || user?.role_name === 'Manager';
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const from = dateFrom || (isAdmin ? today : undefined);
    const to = dateTo || (isAdmin ? today : undefined);
    // Params for Transaction List (Fetch ALL items for the current date and status)
    const listParams = new URLSearchParams();
    if (from) listParams.set("from", from);
    if (to) listParams.set("to", to);
    if (statusType && statusType !== "all") listParams.set("statusType", statusType);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [txnRes, countRes] = await Promise.all([
      fetch(`/api/transactions?${listParams}`, { headers }),
      fetch(`/api/transactions/counts`, { headers }),
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

    setLoading(false);
    setCurrentPage(1);
  }, [dateFrom, dateTo, filterType, filterItem, statusType, token]);

  useEffect(() => {
    setTimeout(() => fetchData(), 0);
  }, [fetchData]);

  function handleExport() {
    const params = new URLSearchParams();
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (filterType !== "all") params.set("type", filterType);
    if (filterItem) params.set("item", filterItem);
    if (statusType && statusType !== "all") params.set("statusType", statusType);
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

    // Status fallback (in case API doesn't filter perfectly)
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
    return sortOrder === 'asc' 
      ? Number(a.transaction_id) - Number(b.transaction_id) 
      : Number(b.transaction_id) - Number(a.transaction_id);
  });

  const totalPages = Math.ceil(finalFilteredTransactions.length / itemsPerPage);
  const paginatedTransactions = finalFilteredTransactions.slice(
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
                onClick={() => fetchData()}
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
            { label: "Total Employee", value: counts.users, icon: UsersIcon, gradient: "from-blue-500 to-blue-600" },
            { label: "Total Items", value: counts.items, icon: ClipboardIcon, gradient: "from-indigo-500 to-indigo-600" },
            { label: "Total Parties", value: counts.parties, icon: UsersIcon, gradient: "from-violet-500 to-violet-600" },
            { label: "Total Transporters", value: counts.transporters, icon: ClipboardIcon, gradient: "from-fuchsia-500 to-fuchsia-600" },
            { label: "Total Gate Passes", value: counts.loading + counts.unloading, icon: ClipboardIcon, gradient: "from-pink-500 to-pink-600" },
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
          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
            filterType === "Unloading" && filterItem === item.item_name
              ? "bg-rose-100 text-rose-900 shadow-sm"
              : "text-rose-700 hover:bg-rose-100/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">
              {item.item_name}
            </span>
            <span className="bg-rose-200/60 px-2 py-0.5 rounded text-xs font-medium">
              ({item.count})
            </span>
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
          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
            filterType === "Loading" && filterItem === item.item_name
              ? "bg-blue-100 text-blue-900 shadow-sm"
              : "text-blue-700 hover:bg-blue-100/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base">
              {item.item_name}
            </span>
            <span className="bg-blue-200/60 px-2 py-0.5 rounded text-xs font-medium">
              ({item.count})
            </span>
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
                onClick={() => { setSelectedStage(null); setStatusType("all"); }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === null && statusType === "all"
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                All Stages
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  selectedStage === null && statusType === "all" ? 'bg-white/20 text-white' : 'bg-zinc-300 text-zinc-700'
                }`}>
                  {baseFilteredTransactions.length}
                </span>
              </button>

              {/* Per-Stage buttons */}
              {STAGES.map((stage) => (
                <button
                  key={stage.key}
                  onClick={() => { setSelectedStage(stage.key); setStatusType("all"); }}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedStage === stage.key && statusType === "all"
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
                onClick={() => { setSelectedStage('closed'); setStatusType("all"); }}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedStage === 'closed' && statusType === "all"
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
        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden mb-15">
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
              
              {/* Status Filter Toggle Group */}
              <div className="flex border border-zinc-300 rounded-lg overflow-hidden bg-white/80 backdrop-blur shadow-sm hidden md:flex">
                <button
                  onClick={() => { setStatusType('all'); setSelectedStage(null); }}
                  className={`px-4 py-2 text-sm font-bold transition-colors ${
                    statusType === 'all' ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => { setStatusType('pending'); setSelectedStage(null); }}
                  className={`px-4 py-2 text-sm font-bold border-l border-zinc-200 transition-colors flex items-center gap-1.5 ${
                    statusType === 'pending' ? 'bg-amber-100 text-amber-800 shadow-inner' : 'text-zinc-500 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusType === 'pending' ? 'bg-amber-500' : 'bg-transparent'}`}></span>
                  Pending
                </button>
                <button
                  onClick={() => { setStatusType('damaged'); setSelectedStage(null); }}
                  className={`px-4 py-2 text-sm font-bold border-l border-zinc-200 transition-colors flex items-center gap-1.5 ${
                    statusType === 'damaged' ? 'bg-red-100 text-red-800 shadow-inner' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusType === 'damaged' ? 'bg-red-500' : 'bg-transparent'}`}></span>
                  Damaged
                </button>
              </div>

              <div className="text-sm text-zinc-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-zinc-200 hidden sm:block">
                {finalFilteredTransactions.length} results
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

<div className="overflow-x-auto bg-white rounded-xl border border-zinc-200 shadow-sm">
  {loading ? (
    <div className="flex items-center justify-center p-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  ) : (
    <table className="w-full min-w-[1200px] text-sm table-fixed">
      <thead>
        <tr className="bg-zinc-100/80 text-left text-sm text-zinc-600 border-b border-zinc-200">

          <th 
            className="w-[70px] px-4 py-3 font-semibold whitespace-nowrap cursor-pointer hover:bg-zinc-200 transition-colors"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title="Sort Oldest/Latest"
          >
            S/N {sortOrder === 'desc' ? '↓' : '↑'}
          </th>

          <th className="w-[200px] px-4 py-3 font-semibold whitespace-nowrap">
            Product Name
          </th>

          <th className="w-[170px] px-4 py-3 font-semibold whitespace-nowrap">
            Vehicle Number
          </th>

          <th className="w-[220px] px-4 py-3 font-semibold whitespace-nowrap">
            Vendor Name
          </th>

          {STAGES.map((s) => (
            <th
              key={s.key}
              className="w-[85px] px-2 py-3 text-center text-xs font-semibold text-zinc-600 whitespace-nowrap"
            >
              <div className="truncate" title={s.label}>
                {s.shortLabel || s.label}
              </div>
            </th>
          ))}

          <th className="w-[70px] px-3 py-3 text-center font-semibold whitespace-nowrap">
            View
          </th>

          <th className="w-[70px] px-3 py-3 text-center font-semibold whitespace-nowrap">
            Print
          </th>

          {hasPermission("edit_transactions") && (
            <th className="w-[70px] px-3 py-3 text-center font-semibold whitespace-nowrap">
              Edit
            </th>
          )}
          
          {(user?.role_name === 'Admin' || hasPermission("delete_transactions")) && user?.role_name !== 'Logistics Manager' && user?.role_name !== 'Manager' && (
            <th className="w-[70px] px-3 py-3 text-center font-semibold whitespace-nowrap">
              Delete
            </th>
          )}
        </tr>
      </thead>

      <tbody>
        {paginatedTransactions.map((t, idx) => {
          const status = getStageStatus(t);
          const serialNumber = t.transaction_id;

          return (
            <tr
              key={t.transaction_id}
              className={`border-b border-zinc-100 transition-colors hover:bg-blue-50/40 ${
                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <td className="px-4 py-3 align-middle font-medium text-zinc-700 whitespace-nowrap">
                {serialNumber}
              </td>

              <td
                className="px-4 py-3 align-middle truncate whitespace-nowrap font-semibold text-zinc-900"
                title={t.item_name}
              >
                {t.item_name || "N/A"}
              </td>

              <td className="px-4 py-3 align-middle whitespace-nowrap">
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-medium text-sm shadow-sm">
                  {t.truck_no}
                </div>
              </td>

              <td
                className="px-4 py-3 align-middle truncate whitespace-nowrap text-zinc-700"
                title={t.party_name}
              >
                {t.party_name}
              </td>

              {STAGES.map((s) => (
                <td
                  key={s.key}
                  className="px-2 py-3 align-middle text-center whitespace-nowrap hover:bg-zinc-100 transition-colors cursor-pointer"
                  onClick={() =>
                    setStageModal({
                      transaction: t,
                      clickedStageKey: s.key,
                    })
                  }
                >
                  <div className="flex items-center justify-center">
                    <StageStatusIcon
                      stageKey={s.key}
                      status={status}
                      transaction={t}
                    />
                  </div>
                </td>
              ))}



<td className="px-3 py-3 text-center whitespace-nowrap">
  <button
    onClick={() =>
      setStageModal({
        transaction: t,
        viewMode: "full",
      })
    }
    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-blue-600 shadow-sm transition-all"
    title="View"
  >
    <ViewIcon className="h-4 w-4" />
  </button>
</td>

<td className="px-3 py-3 text-center whitespace-nowrap">
  <button
    onClick={() => setPrintModal(t)}
    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm transition-all"
    title="Print"
  >
    <PrinterIcon className="h-4 w-4" />
  </button>
</td>

{hasPermission("edit_transactions") && (
    <td className="px-3 py-3 text-center whitespace-nowrap">
      <button
        onClick={() => setEditModal(t)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-orange-600 shadow-sm transition-all"
        title="Edit"
      >
        <EditIcon className="h-4 w-4" />
      </button>
    </td>
)}

{(user?.role_name === 'Admin' || hasPermission("delete_transactions")) && user?.role_name !== 'Logistics Manager' && user?.role_name !== 'Manager' && (
    <td className="px-3 py-3 text-center whitespace-nowrap">
      <button
        onClick={() => setDeleteConfirm(t)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-red-600 shadow-sm transition-all"
        title="Delete"
      >
        <DeleteIcon className="h-4 w-4" />
      </button>
    </td>
)}
            </tr>
          );
        })}
      </tbody>
    </table>
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
    <ProtectedRoute allowedRoles={["Admin", "View Only Admin", "Manager"]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
