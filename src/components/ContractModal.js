"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { CloseIcon, UnloadingGoodsIcon, LoadingGoodsIcon } from "@/components/Icons";

export function ContractModal({ open, onClose, onSuccess, contract, viewMode = false }) {
  const [contractType, setContractType] = useState("Purchase Order");
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    contract_no: "",
    contract_date: "",
    from_date: "",
    to_date: "",
    contract_type: "Purchase Order",
    party_contract_number: "",
    party_id: "",
    item_id: "",
    broker_id: "",
    contract_rate: "",
    contract_quantity: "",
    rec_qty: "0",
    settal_qty: "0",
    pending_qty: "0",
    contract_status: "Pending",
    ex_paint: "",
    for_field: "",
    payment_terms: "",
    remark1: "",
    remark2: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/items?status=Active").then((r) => r.json()),
        fetch("/api/parties?status=Active").then((r) => r.json()),
        fetch("/api/brokers?status=Active").then((r) => r.json()),
      ]).then(([i, p, b]) => {
        setItems(Array.isArray(i) ? i : []);
        setParties(Array.isArray(p) ? p : []);
        setBrokers(Array.isArray(b) ? b : []);
      });

      if (contract) {
        // Edit mode
        setForm({
          contract_no: contract.contract_no || "",
          contract_date: contract.contract_date ? contract.contract_date.split('T')[0] : "",
          from_date: contract.contract_from_date ? contract.contract_from_date.split('T')[0] : "",
          to_date: contract.to_date ? contract.to_date.split('T')[0] : (contract.contract_due_date ? contract.contract_due_date.split('T')[0] : ""),
          contract_type: contract.contract_type || "Purchase Order",
          party_contract_number: contract.party_contract_number || "",
          party_id: contract.party_id || "",
          item_id: contract.item_id || "",
          broker_id: contract.broker_id || "",
          contract_rate: contract.contract_rate || "",
          contract_quantity: contract.contract_quantity || "",
          rec_qty: contract.rec_qty || "0",
          settal_qty: contract.settal_qty || "0",
          pending_qty: contract.pending_qty || "0",
          contract_status: contract.contract_status || "Pending",
          ex_paint: contract.ex_paint || "",
          for_field: contract.for_field || "",
          payment_terms: contract.payment_terms || "",
          remark1: contract.remark1 || contract.remarks || "",
          remark2: contract.remark2 || "",
        });
        setContractType(contract.contract_type || "Purchase Order");
      } else {
        // Create mode
        setForm({
          contract_no: "",
          contract_date: "",
          from_date: "",
          to_date: "",
          contract_type: "Purchase Order",
          party_contract_number: "",
          party_id: "",
          item_id: "",
          broker_id: "",
          contract_rate: "",
          contract_quantity: "",
          rec_qty: "0",
          settal_qty: "0",
          pending_qty: "0",
          contract_status: "Pending",
          ex_paint: "",
          for_field: "",
          payment_terms: "",
          remark1: "",
          remark2: "",
        });
        setContractType("Purchase Order");
      }
      setError("");
      setFieldErrors({});
    }
  }, [open, contract]);

  // Update form when contract type changes
  useEffect(() => {
    setForm((f) => ({ ...f, contract_type: contractType }));
  }, [contractType]);

  // Handle field changes with specific logic for Ex_Plant/For and Quantities
  const handleFieldChange = (field, value) => {
    let newForm = { ...form, [field]: value };

    // Mutually Exclusive Ex_Plant / For
    if (field === "ex_paint" && value) {
        newForm.for_field = "";
    } else if (field === "for_field" && value) {
        newForm.ex_paint = "";
    }

    // Auto-calculate Pending Qty
    if (["contract_quantity", "rec_qty", "settal_qty"].includes(field)) {
        const cQty = parseFloat(newForm.contract_quantity) || 0;
        const rQty = parseFloat(newForm.rec_qty) || 0;
        const sQty = parseFloat(newForm.settal_qty) || 0;
        
        // Validation: Rec + Set cannot exceed Contract
        if (rQty + sQty > cQty) {
            // If user is typing, we might just show error, but for strictness we could clamp or warn.
            // For now, let's calculate pending, but it might go negative if we don't clamp.
            // The requirement says: "display validation error" & "prevent submission".
            // We'll allow typing but show error in UI.
        }
        
        const pQty = Math.max(0, cQty - rQty - sQty);
        newForm.pending_qty = pQty.toFixed(3); // Keep precision
    }

    setForm(newForm);
    
    // Clear error for this field
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Client-side Validation for Quantity
    const cQty = parseFloat(form.contract_quantity) || 0;
    const rQty = parseFloat(form.rec_qty) || 0;
    const sQty = parseFloat(form.settal_qty) || 0;

    if (rQty + sQty > cQty) {
        setLoading(false);
        toast.error("Received + Settled Quantity cannot exceed Contract Quantity");
        return;
    }

    // Date range validation
    if (form.from_date && form.to_date && form.from_date > form.to_date) {
      setFieldErrors({ from_date: "From Date cannot be after To Date" });
      toast.error("From Date cannot be after To Date");
      setLoading(false);
      return;
    }

    const errors = {};
    if (!form.contract_no.trim()) errors.contract_no = "Contract number is required";
    if (!form.contract_date) errors.contract_date = "Contract date is required";
    if (!form.party_id) errors.party_id = "Party is required";
    if (!form.item_id) errors.item_id = "Item is required";
    if (!form.contract_rate || parseFloat(form.contract_rate) <= 0) {
      errors.contract_rate = "Valid rate is required";
    }
    if (!form.contract_quantity || parseFloat(form.contract_quantity) <= 0) {
      errors.contract_quantity = "Valid quantity is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Please fix validation errors");
      setLoading(false); // Ensure loading is reset if validation fails
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };

      const url = contract ? `/api/contracts/${contract.contract_id}` : "/api/contracts";
      const method = contract ? "PUT" : "POST";

      const payload = {
        ...form,
        // Ensure backend always receives contract_due_date regardless of form field naming
        contract_due_date: form.to_date || form.contract_due_date || null,
        from_date: form.from_date || null,
        to_date: form.to_date || null,
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save contract");

      toast.success(contract ? "Contract updated successfully" : "Contract created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save contract");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
 function formatQty(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.000";
  return num.toFixed(3);
}
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 ring-1 ring-black/5">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 md:px-6 py-4 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  {viewMode ? "View Contract" : (contract ? "Edit Contract" : "New Contract")}
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  {contractType === "Purchase Order" ? "Purchase Order" : "Sales Order"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-90px)]">
          <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-white">
            {/* Contract Type Selector - Hide in View Mode if preferred, or show as read-only */}
            {!viewMode && (
              <div className="mb-8">
                <label className="mb-3 block text-sm font-bold text-zinc-700">
                  Contract Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContractType("Purchase Order")}
                    className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      contractType === "Purchase Order"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    <UnloadingGoodsIcon className={`h-4 w-4 ${contractType === "Purchase Order" ? "text-blue-200" : "text-zinc-400"}`} />
                    Purchase Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractType("Sales Order")}
                    className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                      contractType === "Sales Order"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2"
                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    <LoadingGoodsIcon className={`h-4 w-4 ${contractType === "Sales Order" ? "text-blue-200" : "text-zinc-400"}`} />
                    Sales Order
                  </button>
                </div>
              </div>
            )}

            {/* Form Grid */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Contract Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={viewMode || (contract && contract.contract_id)}
                      value={form.contract_no}
                      onChange={(e) => handleFieldChange("contract_no", e.target.value)}
                      placeholder="CONTRACT-001"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.contract_no
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                      } ${viewMode || (contract && contract.contract_id) ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      required={!viewMode}
                    />
                    {fieldErrors.contract_no && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.contract_no}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Party Contract No
                    </label>
                    <input
                      type="text"
                      disabled={viewMode || (contract && contract.contract_id)}
                      value={form.party_contract_number}
                      onChange={(e) => handleFieldChange("party_contract_number", e.target.value)}
                      placeholder="Optional"
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${viewMode || (contract && contract.contract_id) ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Contract Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      disabled={viewMode || (contract && contract.contract_id)}
                      value={form.contract_date}
                      onChange={(e) => handleFieldChange("contract_date", e.target.value)}
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.contract_date
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                      } ${viewMode || (contract && contract.contract_id) ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      required={!viewMode}
                    />
                    {fieldErrors.contract_date && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.contract_date}
                      </p>
                    )}
                  </div>
                  {/* Duration: From Date → To Date */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-zinc-700">Due From Date</label>
                      <input
                        type="date"
                        disabled={viewMode}
                        value={form.from_date}
                        onChange={(e) => handleFieldChange("from_date", e.target.value)}
                        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                          fieldErrors.from_date
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      />
                      {fieldErrors.from_date && (
                        <p className="text-xs font-medium text-red-600 mt-1">{fieldErrors.from_date}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-zinc-700">Due To Date</label>
                      <input
                        type="date"
                        disabled={viewMode}
                        value={form.to_date}
                        onChange={(e) => handleFieldChange("to_date", e.target.value)}
                        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                          fieldErrors.from_date
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Party Information */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Party Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Party Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        disabled={viewMode}
                        value={form.party_id}
                        onChange={(e) => handleFieldChange("party_id", e.target.value)}
                        className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                          fieldErrors.party_id
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                        required={!viewMode}
                      >
                        <option value="" className="text-zinc-500">Select Party</option>
                        {parties.map((p) => (
                          <option key={p.party_id} value={p.party_id} className="text-zinc-900">
                            {p.party_name}
                          </option>
                        ))}
                      </select>
                      {/* {!viewMode && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )} */}
                    </div>
                    {fieldErrors.party_id && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.party_id}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Broker (Optional)
                    </label>
                    <div className="relative">
                      <select
                        disabled={viewMode}
                        value={form.broker_id}
                        onChange={(e) => handleFieldChange("broker_id", e.target.value)}
                        className={`w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      >
                        <option value="" className="text-zinc-500">Select Broker (Optional)</option>
                        {brokers.map((b) => (
                          <option key={b.broker_id} value={b.broker_id} className="text-zinc-900">
                            {b.broker_name}
                          </option>
                        ))}
                      </select>
                      {/* {!viewMode && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Item & Pricing */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Item & Pricing</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        disabled={viewMode}
                        value={form.item_id}
                        onChange={(e) => handleFieldChange("item_id", e.target.value)}
                        className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                          fieldErrors.item_id
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                            : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                        } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                        required={!viewMode}
                      >
                        <option value="" className="text-zinc-500">Select Item</option>
                        {items.map((i) => (
                          <option key={i.item_id} value={i.item_id} className="text-zinc-900">
                            {i.item_name}
                          </option>
                        ))}
                      </select>
                      {/* {!viewMode && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )} */}
                    </div>
                    {fieldErrors.item_id && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.item_id}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Rate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      disabled={viewMode}
                      step="0.01"
                      value={formatQty(form.contract_rate)}
                      onChange={(e) => handleFieldChange("contract_rate", e.target.value)}
                      placeholder="0.00"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.contract_rate
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                      } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      required={!viewMode}
                    />
                    {fieldErrors.contract_rate && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.contract_rate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Total Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      disabled={viewMode}
                      step="0.0001"
                      value={formatQty(form.contract_quantity)}
                      onChange={(e) => handleFieldChange("contract_quantity", e.target.value)}
                      placeholder="0.000"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.contract_quantity
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20"
                      } ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                      required={!viewMode}
                    />
                    {fieldErrors.contract_quantity && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.contract_quantity}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      disabled={viewMode}
                      value={form.payment_terms}
                      onChange={(e) => handleFieldChange("payment_terms", e.target.value)}
                      placeholder="e.g. 30 Days"
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {/* Logistics (Mutually Exclusive) */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Logistics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700 flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="logistics_type"
                        checked={!!form.ex_paint}
                        onChange={() => handleFieldChange("ex_paint", "Yes")} // Set arbitrary truthy value or text
                        disabled={viewMode}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Ex_Plant
                    </label>
                    <input
                      type="text"
                      disabled={viewMode || !form.ex_paint}
                      value={form.ex_paint}
                      onChange={(e) => handleFieldChange("ex_paint", e.target.value)}
                      placeholder={form.ex_paint ? "e.g. Factory" : "Select Ex_Plant to enter"}
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${
                        (viewMode || !form.ex_paint) ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700 flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="logistics_type" 
                        checked={!!form.for_field}
                        onChange={() => handleFieldChange("for_field", "Yes")}
                        disabled={viewMode}
                         className="text-blue-600 focus:ring-blue-500"
                      />
                      For
                    </label>
                    <input
                      type="text"
                      disabled={viewMode || !form.for_field}
                      value={form.for_field}
                      onChange={(e) => handleFieldChange("for_field", e.target.value)}
                      placeholder={form.for_field ? "e.g. Destination" : "Select For to enter"}
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${
                        (viewMode || !form.for_field) ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Quantity Tracking */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Quantity Tracking</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Received Qty
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formatQty(form.rec_qty)}
                      onChange={(e) => handleFieldChange("rec_qty", e.target.value)}
                      disabled={viewMode}
                      placeholder="0.000"
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Settlement Qty
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formatQty(form.settal_qty)}
                      onChange={(e) => handleFieldChange("settal_qty", e.target.value)}
                      disabled={viewMode}
                      placeholder="0.000"
                      className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Pending Qty <span className="text-xs font-normal text-zinc-500">(Auto)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formatQty(form.pending_qty)}
                      disabled
                      readOnly
                      placeholder="0.00"
                      className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none cursor-not-allowed shadow-sm font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={form.contract_status}
                        onChange={(e) => handleFieldChange("contract_status", e.target.value)}
                        disabled
                        className="w-full appearance-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:outline-none cursor-not-allowed shadow-sm"
                      >
                        <option value="Pending">Pending</option>
                        {/* <option value="Incomplete">Incomplete</option> */}
                        <option value="Complete">Complete</option>
                      </select>
                      {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div> */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-zinc-700">
                    Remark 1
                  </label>
                  <textarea
                    disabled={viewMode}
                    value={form.remark1}
                    onChange={(e) => handleFieldChange("remark1", e.target.value)}
                    rows={3}
                    placeholder="Add notes..."
                    className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-zinc-700">
                    Remark 2
                  </label>
                  <textarea
                    disabled={viewMode}
                    value={form.remark2}
                    onChange={(e) => handleFieldChange("remark2", e.target.value)}
                    rows={3}
                    placeholder="Add additional notes..."
                    className={`w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none ${viewMode ? "bg-zinc-50 text-zinc-600 cursor-not-allowed border-zinc-200" : ""}`}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 rounded-lg p-4 bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-red-800">Error</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3 border-t border-zinc-100 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-bold text-zinc-600 transition-all duration-300 hover:bg-zinc-50 hover:text-zinc-800 shadow-sm"
              >
                {viewMode ? "Close" : "Cancel"}
              </button>
              {!viewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {contract ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {contract ? "Update Contract" : "Create Contract"}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
