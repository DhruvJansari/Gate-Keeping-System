"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TruckIcon as TruckSvgIcon, CloseIcon } from "@/components/Icons";

export function TruckIcon({ completed }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
        completed
          ? "bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-200"
          : "bg-zinc-100 text-zinc-400 border border-zinc-200"
      }`}
      title={completed ? "Completed" : "Pending"}
    >
      <TruckSvgIcon className="h-4 w-4" />
    </span>
  );
}

export function NewGateEntryModal({ open, onClose, onSuccess, token }) {
  const [type, setType] = useState("Loading");
  const [items, setItems] = useState([]);
  const [parties, setParties] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    po_do_number: "",
    item_id: "",
    party_id: "",
    truck_no: "",
    invoice_number: "",
    invoice_date: "",
    invoice_quantity: "",
    invoice_rate: "",
    transporter_id: "",
    lr_number: "",
    mobile_number: "",
    remark1: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Validation functions
  const validateTruckNo = (value) => {
    if (!value.trim()) return "Truck number is required";
    // Flexible Pattern: XX 00 XX 0000 (allows spaces or no spaces)
    const pattern = /^[A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{4}$/i;
    if (!pattern.test(value.trim())) {
      return "Invalid format. Example: MH12AB1234 or MH 12 AB 1234";
    }
    return "";
  };

  const validateMobileNumber = (value) => {
    if (!value.trim()) return "Mobile number is required";
    const pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(value.trim())) {
      return "Invalid mobile number. Must be 10 digits starting with 6-9";
    }
    return "";
  };

  const validateInvoiceQuantity = (value) => {
    if (!value || value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return "Quantity must be a positive number";
    }
    return "";
  };

  const validateInvoiceRate = (value) => {
    if (!value || value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return "Rate must be a positive number";
    }
    return "";
  };

  const validateRequired = (value, label) => {
      if (!value || (typeof value === 'string' && !value.trim())) return `${label} is required`;
      return "";
  };

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFieldBlur = (field) => {
    let error = "";
    switch (field) {
      case "truck_no":
        error = validateTruckNo(form.truck_no);
        break;
      case "mobile_number":
        error = validateMobileNumber(form.mobile_number);
        break;
      case "invoice_quantity":
        error = validateInvoiceQuantity(form.invoice_quantity);
        break;
      case "invoice_rate":
        error = validateInvoiceRate(form.invoice_rate);
        break;
      case "item_id":
        error = validateRequired(form.item_id, "Product");
        break;
      case "party_id":
        error = validateRequired(form.party_id, "Party");
        break;
      case "invoice_number":
         // Optional
         break;
      case "invoice_date":
         // Optional
         break;
      default:
        break;
    }
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    if (open) {
      // ... (fetching logic remains same)
      Promise.all([
        fetch("/api/items?status=Active").then((r) => r.json()),
        fetch("/api/parties?status=Active").then((r) => r.json()),
        fetch("/api/transporters?status=Active").then((r) => r.json()),
      ]).then(([i, p, t]) => {
        setItems(Array.isArray(i) ? i : []);
        setParties(p);
        setTransporters(t);
      });
      setForm({
        po_do_number: "",
        item_id: "",
        party_id: "",
        truck_no: "",
        invoice_number: "",
        invoice_date: "",
        invoice_quantity: "",
        invoice_rate: "",
        transporter_id: "",
        lr_number: "",
        mobile_number: "",
        remark1: "",
      });
      setError("");
      setFieldErrors({});
    }
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    // Validate all required fields
    const errors = {};
    errors.truck_no = validateTruckNo(form.truck_no);
    errors.mobile_number = validateMobileNumber(form.mobile_number);
    errors.invoice_quantity = validateInvoiceQuantity(form.invoice_quantity);
    errors.invoice_rate = validateInvoiceRate(form.invoice_rate);
    errors.item_id = validateRequired(form.item_id, "Product");
    errors.party_id = validateRequired(form.party_id, "Party");
    // Filter out empty errors

    // Filter out empty errors
    const validationErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== "")
    );
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      const errorMessages = Object.values(validationErrors).join(", ");
      toast.error(`Validation failed: ${errorMessages}`);
      setError("Please fix the validation errors before submitting");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          transaction_type: type,
          rate: form.invoice_rate || null, // Map frontend UI field to expected DB payload field
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success("Transaction created successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create transaction");
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
      <div
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 md:px-6 py-4 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200">
                <TruckSvgIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  New Gate Entry
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  {type === "Loading"
                    ? "Loading Goods (Outward)"
                    : "Unloading Goods (Inward)"}
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
            {/* Transaction Type Selector */}
            <div className="mb-8">
              <label className="mb-3 block text-sm font-bold text-zinc-700">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("Loading")}
                  className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                    type === "Loading"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${type === "Loading" ? "text-blue-200" : "text-zinc-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Loading (Outward)[Sales]
                </button>
                <button
                  type="button"
                  onClick={() => setType("Unloading")}
                  className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
                    type === "Unloading"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm"
                  }`}
                >
                  <svg
                    className={`h-4 w-4 ${type === "Unloading" ? "text-blue-200" : "text-zinc-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8V20m0 0l4-4m-4 4l-4-4M7 4v16m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Unloading (Inward)[Purchase]
                </button>
              </div>
            </div>

            {/* Form Grid */}
            <div className="space-y-6">
              {/* Product Info Section */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Product Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      PO / DO Number
                    </label>
                    <input
                      type="text"
                      value={form.po_do_number}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, po_do_number: e.target.value }))
                      }
                      placeholder="PO-12345"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                        value={form.item_id}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, item_id: e.target.value }))
                        }
                        className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        required
                        >
                        <option value="" className="text-zinc-500">
                            Select Product
                        </option>
                        {items.map((i) => (
                            <option
                            key={i.item_id}
                            value={i.item_id}
                            className="text-zinc-900"
                            >
                            {i.item_name}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {fieldErrors.item_id && <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.item_id}</p>}
                  </div>
                </div>
              </div>

              {/* Transport Info Section */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Transport Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Party Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                        value={form.party_id}
                        onChange={(e) => handleFieldChange("party_id", e.target.value)}
                        onBlur={() => handleFieldBlur("party_id")}
                        className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                            fieldErrors.party_id
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        required
                        >
                        <option value="" className="text-zinc-500">
                            Select Party
                        </option>
                        {parties.map((p) => (
                            <option
                            key={p.party_id}
                            value={p.party_id}
                            className="text-zinc-900"
                            >
                            {p.party_name}
                            </option>
                        ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Truck Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.truck_no}
                      onChange={(e) => handleFieldChange("truck_no", e.target.value)}
                      onBlur={() => handleFieldBlur("truck_no")}
                      placeholder="MH 12 AB 1234"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.truck_no 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                      required
                    />
                    {fieldErrors.truck_no && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.truck_no}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                        Transporter Name
                    </label>
                    <div className="relative">
                        <select
                            value={form.transporter_id}
                            onChange={(e) =>
                            setForm((f) => ({ ...f, transporter_id: e.target.value }))
                            }
                            className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        >
                            <option value="" className="text-zinc-500">
                            Select Transporter
                            </option>
                            {transporters.map((t) => (
                            <option
                                key={t.transporter_id}
                                value={t.transporter_id}
                                className="text-zinc-900"
                            >
                                {t.name}
                            </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                        LR Number
                    </label>
                    <input
                        type="text"
                        value={form.lr_number}
                        onChange={(e) =>
                        setForm((f) => ({ ...f, lr_number: e.target.value }))
                        }
                        placeholder="LR-12345"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                        driver Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        value={form.mobile_number}
                        onChange={(e) => handleFieldChange("mobile_number", e.target.value)}
                        onBlur={() => handleFieldBlur("mobile_number")}
                        placeholder="9876543210"
                        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.mobile_number 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                        required
                    />
                    {fieldErrors.mobile_number && (
                        <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.mobile_number}
                        </p>
                    )}
                 </div>
                </div>
              </div>

              {/* Invoice Details Section */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Invoice Details</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Invoice No <span className="text-zinc-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.invoice_number}
                      onChange={(e) => handleFieldChange("invoice_number", e.target.value)}
                      onBlur={() => handleFieldBlur("invoice_number")}
                      placeholder="INV-001"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.invoice_number 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.invoice_number && <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.invoice_number}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Invoice Date <span className="text-zinc-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={form.invoice_date}
                      onChange={(e) => handleFieldChange("invoice_date", e.target.value)}
                      onBlur={() => handleFieldBlur("invoice_date")}
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.invoice_date 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.invoice_date && <p className="text-xs font-bold text-red-500 mt-1">{fieldErrors.invoice_date}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Quantity <span className="text-zinc-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={form.invoice_quantity}
                      onChange={(e) => handleFieldChange("invoice_quantity", e.target.value)}
                      onBlur={() => handleFieldBlur("invoice_quantity")}
                      placeholder="0.000"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.invoice_quantity 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.invoice_quantity && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.invoice_quantity}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-zinc-700">
                      Rate <span className="text-zinc-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.invoice_rate}
                      onChange={(e) => handleFieldChange("invoice_rate", e.target.value)}
                      onBlur={() => handleFieldBlur("invoice_rate")}
                      placeholder="0.00"
                      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                        fieldErrors.invoice_rate 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-zinc-300 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.invoice_rate && (
                      <p className="text-xs font-medium text-red-600 mt-1">
                        {fieldErrors.invoice_rate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-zinc-700">
                  Remarks / Notes
                </label>
                <textarea
                  value={form.remark1}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, remark1: e.target.value }))
                  }
                  placeholder="Any additional remarks..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 rounded-lg p-4 bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-red-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-red-800">
                      Error
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      {error}
                    </p>
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Create Gate Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
