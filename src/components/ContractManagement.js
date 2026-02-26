"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ContractModal } from "@/components/ContractModal";
import { 
  ScrollIcon, 
  RefreshIcon, 
  DownloadIcon, 
  ViewIcon, 
  EditIcon, 
  DeleteIcon,
  UnloadingGoodsIcon,
  LoadingGoodsIcon,
  ClipboardIcon,
  UsersIcon
} from "@/components/Icons";
import toast from "react-hot-toast";

export function ContractManagement() {
  const { user, hasPermission } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState(null);
  
  // Text View Modal State
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textModalContent, setTextModalContent] = useState({ title: "", content: "" });

  // Filters
  const [contractType, setContractType] = useState("all"); // 'all', 'Purchase Order', 'Sales Order'
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedItem, setSelectedItem] = useState(""); // Filter by Item
  const [searchQuery, setSearchQuery] = useState("");

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Fetch all for the date range to calculate board stats
      if (dateFrom) params.set("start_date", dateFrom);
      if (dateTo) params.set("end_date", dateTo);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/contracts?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load contracts");
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Derived Data: Stats
  const stats = useMemo(() => {
    const total = contracts.length;
    const po = contracts.filter(c => c.contract_type === "Purchase Order").length;
    const so = contracts.filter(c => c.contract_type === "Sales Order").length;
    const pending = contracts.filter(c => c.contract_status === "Pending").length;
    const completed = contracts.filter(c => c.contract_status === "Complete").length;
    
    return { total, po, so, pending, completed };
  }, [contracts]);

  // Derived Data: Category Item Counts
  const { poItems, soItems } = useMemo(() => {
    const po = {};
    const so = {};
    contracts.forEach(c => {
      const name = c.item_name || "Unknown Item";
      if (c.contract_type === "Purchase Order") {
        po[name] = (po[name] || 0) + 1;
      } else {
        so[name] = (so[name] || 0) + 1;
      }
    });
    return {
      poItems: Object.entries(po).map(([name, count]) => ({ name, count })),
      soItems: Object.entries(so).map(([name, count]) => ({ name, count }))
    };
  }, [contracts]);

  // Total Itemized Counts
  const totalInwardItems = poItems.reduce((sum, item) => sum + item.count, 0);
  const totalOutwardItems = soItems.reduce((sum, item) => sum + item.count, 0);

  // Filtered Contracts for Table
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      // Type filter
      if (contractType !== "all" && c.contract_type !== contractType) return false;
      // Item filter
      if (selectedItem && c.item_name !== selectedItem) return false;
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.contract_no?.toLowerCase().includes(query) ||
          c.party_name?.toLowerCase().includes(query) ||
          c.item_name?.toLowerCase().includes(query) ||
          c.broker_name?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [contracts, contractType, selectedItem, searchQuery]);

  // Handlers
  function handleAdd() {
    setEditingContract(null);
    setModalOpen(true);
  }

  function handleEdit(contract) {
    setEditingContract(contract);
    setModalOpen(true);
  }

  function handleView(contract) {
    setViewingContract(contract);
    setViewModalOpen(true);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`/api/contracts/${id}`, { method: "DELETE", headers });
      toast.success("Contract deleted");
      fetchContracts();
    } catch (err) {
      toast.error("Failed to delete");
    }
  }

  function handleViewText(title, content) {
    setTextModalContent({ title, content });
    setTextModalOpen(true);
  }

  async function handleInlineUpdate(id, field, value) {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
      
      // Inline Validation for Quantity
      if (['rec_qty', 'settal_qty'].includes(field)) {
        const contract = contracts.find(c => c.contract_id === id);
        if (contract) {
            const cQty = parseFloat(contract.contract_quantity) || 0;
            const rQty = field === 'rec_qty' ? parseFloat(value) || 0 : parseFloat(contract.rec_qty) || 0;
            const sQty = field === 'settal_qty' ? parseFloat(value) || 0 : parseFloat(contract.settal_qty) || 0;
            
            if (rQty + sQty > cQty) {
                toast.error("Received + Settled Quantity cannot exceed Contract Quantity");
                // Revert UI to original value
                setContracts(prev => [...prev]); 
                return;
            }
        }
      }

      const res = await fetch(`/api/contracts/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      
      // Optimistic Update & Auto-calc Pending
      setContracts(prev => prev.map(c => {
        if (c.contract_id === id) {
            const updated = { ...c, [field]: value };
            if (['rec_qty', 'settal_qty'].includes(field)) {
                const cQty = parseFloat(updated.contract_quantity) || 0;
                const rQty = parseFloat(updated.rec_qty) || 0;
                const sQty = parseFloat(updated.settal_qty) || 0;
                updated.pending_qty = Math.max(0, cQty - rQty - sQty).toFixed(4);
            }
            return updated;
        }
        return c;
      }));
      toast.success("Updated", { id: "inline-update", duration: 1000 });
    } catch (err) {
      toast.error(err.message || "Failed to update");
      fetchContracts();
    }
  }

  function handleExport() {
    if (!hasPermission('export_data')) return;
    const params = new URLSearchParams();
    if (contractType !== "all") params.set("type", contractType);
    if (selectedItem) params.set("item", selectedItem);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    
    window.open(`/api/export/contracts?${params.toString()}`, "_blank");
  }

  const handleFilterClick = (type, item = "") => {
    if (contractType === type && selectedItem === item) {
      setContractType("all");
      setSelectedItem("");
    } else {
      setContractType(type);
      setSelectedItem(item);
    }
  };

  const handleClearFilter = (e) => {
    e.stopPropagation();
    setContractType("all");
    setSelectedItem("");
  };

  function formatDate(d) {
    if (!d) return "—";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  return (
    <PanelLayout title="Contract Dashboard" roleName={user?.role_name || "Admin"}>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-50/40 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Contract Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage and track all Purchase & Sales contracts</p>
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
                onClick={fetchContracts}
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

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Total Contracts", value: stats.total, icon: ClipboardIcon, gradient: "from-blue-500 to-blue-600" },
            { label: "Purchase Orders", value: stats.po, icon: UnloadingGoodsIcon, gradient: "from-indigo-500 to-indigo-600" },
            { label: "Sales Orders", value: stats.so, icon: LoadingGoodsIcon, gradient: "from-violet-500 to-violet-600" },
            { label: "Pending", value: stats.pending, icon: ScrollIcon, gradient: "from-zinc-500 to-zinc-600" },
            { label: "Completed", value: stats.completed, icon: UsersIcon, gradient: "from-emerald-500 to-emerald-600" },
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

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Purchase Order Button Section */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 overflow-hidden shadow-sm">
            <button
              onClick={() => handleFilterClick("Purchase Order", "")}
              className={`w-full flex items-center justify-between p-4 border-b border-indigo-100 transition-all ${
                contractType === "Purchase Order" && !selectedItem
                  ? "bg-indigo-100 shadow-inner"
                  : "hover:bg-indigo-100/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-500 p-2 shadow-sm text-white">
                  <UnloadingGoodsIcon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-indigo-900">
                  Purchase Orders - {totalInwardItems}
                </span>
              </div>
              {contractType === "Purchase Order" && (
                <div 
                  onClick={handleClearFilter}
                  className="rounded-full bg-indigo-200/50 p-1 text-indigo-700 hover:bg-indigo-300 transition-colors"
                  title="Clear Filter"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </button>
            <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
              {poItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Purchase Order", item.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    contractType === "Purchase Order" && selectedItem === item.name
                      ? "bg-indigo-100 text-indigo-900 font-medium shadow-sm"
                      : "text-indigo-700 hover:bg-indigo-100/50"
                  }`}
                >
                   <div className="flex justify-between items-center">
                     <span>{item.name}</span>
                     <span className="bg-indigo-200/50 px-2 py-0.5 rounded text-xs">{item.count}</span>
                   </div>
                </button>
              ))}
              {poItems.length === 0 && <p className="p-4 text-center text-indigo-600/50 italic text-sm">No items</p>}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 overflow-hidden shadow-sm">
            <button
              onClick={() => handleFilterClick("Sales Order", "")}
              className={`w-full flex items-center justify-between p-4 border-b border-blue-100 transition-all ${
                contractType === "Sales Order" && !selectedItem
                  ? "bg-blue-100/50 shadow-inner"
                  : "hover:bg-blue-100/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500 p-2 shadow-sm text-white">
                  <LoadingGoodsIcon className="h-5 w-5" />
                </div>
                <span className="font-semibold text-blue-900">
                  Sales Orders - {totalOutwardItems}
                </span>
              </div>
              {contractType === "Sales Order" && (
                <div 
                  onClick={handleClearFilter}
                  className="rounded-full bg-blue-200/50 p-1 text-blue-700 hover:bg-blue-300 transition-colors"
                  title="Clear Filter"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </button>
            <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
              {soItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFilterClick("Sales Order", item.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    contractType === "Sales Order" && selectedItem === item.name
                      ? "bg-blue-100 text-blue-900 font-medium shadow-sm"
                      : "text-blue-700 hover:bg-blue-100/50"
                  }`}
                >
                   <div className="flex justify-between items-center">
                     <span>{item.name}</span>
                     <span className="bg-blue-200/50 px-2 py-0.5 rounded text-xs">{item.count}</span>
                   </div>
                </button>
              ))}
              {soItems.length === 0 && <p className="p-4 text-center text-blue-600/50 italic text-sm">No items</p>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search contracts (No, Party, Item...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white pl-10 pr-10 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-zinc-200">
                {filteredContracts.length} results
              </div>
              {(user?.role_name === 'Admin' || hasPermission('manage_contracts')) && (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Contract
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              </div>
            ) : (
              <table className="w-full min-w-[1200px] text-sm text-left">
                  <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Contract No</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Due Date</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Party Contract No</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Party Name</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Item</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Broker Name</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Rate</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Contract Qty</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Rec Qty</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Set. Qty</th>
                      <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Pen. Qty</th>
                      <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Ex_Plant</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">For</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Payment Terms</th>
                      <th className="px-4 py-3 font-semibold text-center whitespace-nowrap sticky right-0 bg-zinc-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredContracts.map((c) => (
                      <tr key={c.contract_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-zinc-900">{c.contract_no}</td>
                        <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatDate(c.contract_date)}</td>
                        <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">{formatDate(c.contract_due_date)}</td>
                        <td className="px-4 py-3 text-zinc-600">{c.party_contract_number || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-zinc-900 truncate max-w-[200px]" title={c.party_name}>
                            {c.party_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{c.item_name}</td>
                        <td className="px-4 py-3 text-zinc-600">{c.broker_name || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono">₹{c.contract_rate}</td>
                        <td className="px-4 py-3 text-right font-bold text-zinc-900">{c.contract_quantity}</td>
                        
                        <td className="px-4 py-3">
                          {hasPermission('manage_contracts') ? (
                            <input 
                              type="number" 
                              className="w-24 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-right text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                              defaultValue={c.rec_qty}
                              onBlur={(e) => handleInlineUpdate(c.contract_id, 'rec_qty', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-xs">{c.rec_qty || 0}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasPermission('manage_contracts') ? (
                            <input 
                              type="number" 
                              className="w-24 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-right text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                              defaultValue={c.settal_qty}
                              onBlur={(e) => handleInlineUpdate(c.contract_id, 'settal_qty', e.target.value)}
                            />
                          ) : (
                            <span className="font-mono text-xs">{c.settal_qty || 0}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="number" 
                            className="w-24 bg-zinc-100 border border-zinc-200 rounded px-2 py-1 text-right text-xs font-semibold text-zinc-600 outline-none cursor-not-allowed"
                            value={c.pending_qty}
                            disabled
                            readOnly
                          />
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          {hasPermission('manage_contracts') ? (
                            <select
                              className={`text-xs border rounded-lg px-2 py-1 font-bold cursor-pointer outline-none transition-all ${
                                c.contract_status === 'Complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                c.contract_status === 'Pending' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : 
                                'bg-zinc-50 text-zinc-600 border-zinc-200'
                              }`}
                              value={c.contract_status || 'Pending'}
                              onChange={(e) => handleInlineUpdate(c.contract_id, 'contract_status', e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Incomplete">Incomplete</option>
                              <option value="Complete">Complete</option>
                            </select>
                          ) : (
                            <span className={`text-xs border rounded-lg px-2 py-1 font-bold outline-none transition-all ${
                              c.contract_status === 'Complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              c.contract_status === 'Pending' ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : 
                              'bg-zinc-50 text-zinc-600 border-zinc-200'
                            }`}>
                              {c.contract_status || 'Pending'}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-zinc-600">{c.ex_paint || "—"}</td>
                        <td className="px-4 py-3 text-zinc-600">{c.for_field || "—"}</td>
                        <td 
                          className="px-4 py-3 text-zinc-600 truncate max-w-[150px] cursor-pointer hover:text-blue-600 hover:underline"
                          title="Click to view full text"
                          onClick={() => handleViewText("Payment Terms", c.payment_terms)}
                        >
                          {c.payment_terms || "—"}
                        </td>

                        <td className="px-4 py-3 sticky right-0 bg-white shadow-l">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => handleView(c)} 
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="View Contract"
                            >
                              <ViewIcon className="h-4 w-4" />
                            </button>
                            {(user?.role_name === 'Admin' || hasPermission('manage_contracts')) && (
                              <>
                                <button 
                                  onClick={() => handleEdit(c)} 
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Edit Contract"
                                >
                                  <EditIcon className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(c.contract_id)} 
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                                  title="Delete Contract"
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={18} className="py-12 text-center text-zinc-500 italic">
                        No contracts found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden bg-zinc-50/50 p-4 space-y-4">
            {loading ? (
               <div className="flex items-center justify-center p-12">
                 <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
               </div>
            ) : filteredContracts.length === 0 ? (
                <div className="text-center p-8 text-zinc-500 italic">No contracts found.</div>
            ) : (
                filteredContracts.map((c) => (
                    <div key={c.contract_id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        {/* Card Header */ }
                        <div className="p-4 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-lg text-zinc-900">{c.contract_no}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        c.contract_type === 'Purchase Order' 
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {c.contract_type === 'Purchase Order' ? 'PO' : 'SO'}
                                    </span>
                                </div>
                                <div className="text-xs text-zinc-500 font-mono">{formatDate(c.contract_date)}</div>
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => handleView(c)}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"
                                >
                                    <ViewIcon className="h-4 w-4" />
                                </button>
                                {(user?.role_name === 'Admin' || hasPermission('manage_contracts')) && (
                                    <button 
                                        onClick={() => handleEdit(c)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                            <div>
                                <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Party</div>
                                <div className="font-semibold text-zinc-900 text-sm">{c.party_name}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Item</div>
                                    <div className="font-medium text-zinc-900 text-sm">{c.item_name}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-0.5">Rate</div>
                                    <div className="font-mono font-medium text-zinc-900 text-sm">₹{c.contract_rate}</div>
                                </div>
                            </div>

                            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500">Contract Qty</span>
                                    <span className="font-bold text-sm text-zinc-900">{c.contract_quantity}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500">Pending Qty</span>
                                    <span className="font-bold text-sm text-amber-600">{c.pending_qty}</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${Math.min(100, ((c.contract_quantity - c.pending_qty) / c.contract_quantity) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 mt-2">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                      c.contract_status === 'Complete' ? 'bg-emerald-100 text-emerald-700' : 
                                      c.contract_status === 'Pending' ? 'bg-zinc-100 text-zinc-600' : 
                                      'bg-amber-50 text-amber-700'
                                }`}>
                                    {c.contract_status}
                                </span>
                                {(user?.role_name === 'Admin' || hasPermission('manage_contracts')) && (
                                    <button 
                                        onClick={() => handleDelete(c.contract_id)} 
                                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>

      <ContractModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditingContract(null); }} 
        onSuccess={fetchContracts}
        contract={editingContract}
      />
      
      <ContractModal 
        open={viewModalOpen} 
        onClose={() => { setViewModalOpen(false); setViewingContract(null); }} 
        contract={viewingContract}
        viewMode={true}
      />

      {/* Text View Modal */}
      {textModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="fixed inset-0 bg-black/50 backdrop-blur-sm"
             onClick={() => setTextModalOpen(false)}
           />
           <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-zinc-900">{textModalContent.title}</h3>
                <button 
                  onClick={() => setTextModalOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 text-zinc-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100 text-sm text-zinc-700 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                {textModalContent.content || "No content"}
              </div>
           </div>
        </div>
      )}
    </PanelLayout>
  );
}
