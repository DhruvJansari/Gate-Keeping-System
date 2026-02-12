"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TruckIcon as TruckSvgIcon, CloseIcon } from "@/components/Icons";
import { useTheme } from "@/context/ThemeContext";

const STAGES = [
  "parking",
  "gate_in",
  "first_weighbridge",
  "campus_in",
  "campus_out",
  "second_weighbridge",
  "gate_pass",
  "gate_out",
];

export function TruckIcon({ completed }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
        completed
          ? "bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-500/20"
          : "bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-500 dark:text-zinc-400 backdrop-blur-sm"
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
  const { theme } = useTheme();

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
    // Pattern: XX 00 XX 0000 (flexible spacing)
    const pattern = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{1,4}$/i;
    if (!pattern.test(value.trim())) {
      return "Invalid format. Example: MH 12 AB 1234";
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
    if (!value || value === "") return "Invoice quantity is required";
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Quantity must be a positive number";
    }
    return "";
  };

  const validateInvoiceRate = (value) => {
    if (!value || value === "") return "Invoice rate is required";
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return "Rate must be a positive number";
    }
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
      default:
        break;
    }
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  useEffect(() => {
    if (open) {
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

  const getThemeColors = () => {
    if (theme === "dark") {
      return {
        bg: "bg-zinc-900/95 backdrop-blur-lg",
        cardBg: "bg-zinc-900",
        border: "border-zinc-800",
        text: "text-zinc-100",
        textMuted: "text-zinc-400",
        headerBg: "bg-amber-900/20 border-b border-amber-900/30",
        buttonPrimary: "bg-amber-600 hover:bg-amber-700",
        buttonSecondary:
          "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700",
        inputBg: "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600",
        errorBg: "bg-red-900/20 border border-red-800/30",
      };
    }
    return {
      bg: "bg-black/40 backdrop-blur-sm",
      cardBg: "bg-white",
      border: "border-zinc-200",
      text: "text-zinc-900",
      textMuted: "text-zinc-600",
      headerBg: "bg-amber-50 border-b border-amber-200",
      buttonPrimary: "bg-amber-600 hover:bg-amber-700",
      buttonSecondary:
        "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-300",
      inputBg: "bg-white border-zinc-300 hover:border-zinc-400",
      errorBg: "bg-red-50 border border-red-200",
    };
  };

  const colors = getThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl ${colors.cardBg} ${colors.border} border shadow-2xl animate-in slide-in-from-bottom-10 duration-300`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-4 md:px-6 py-4 ${colors.headerBg}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  theme === "dark" ? "bg-amber-900/40" : "bg-amber-100"
                } transition-colors`}
              >
                <TruckSvgIcon
                  className={`h-5 w-5 ${
                    theme === "dark" ? "text-amber-400" : "text-amber-600"
                  }`}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  New Gate Entry
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {type === "Loading"
                    ? "Loading Goods (Inward)"
                    : "Unloading Goods (Outward)"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${colors.textMuted}`}
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            {/* Transaction Type Selector */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("Loading")}
                  className={`relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    type === "Loading"
                      ? `${colors.buttonPrimary} text-white border-transparent shadow-lg shadow-amber-600/20`
                      : `${colors.buttonSecondary} border`
                  }`}
                >
                  {type === "Loading" && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500"></span>
                    </span>
                  )}
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
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Loading (Inward)
                </button>
                <button
                  type="button"
                  onClick={() => setType("Unloading")}
                  className={`relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    type === "Unloading"
                      ? `${colors.buttonPrimary} text-white border-transparent shadow-lg shadow-amber-600/20`
                      : `${colors.buttonSecondary} border`
                  }`}
                >
                  {type === "Unloading" && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500"></span>
                    </span>
                  )}
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
                      d="M17 8V20m0 0l4-4m-4 4l-4-4M7 4v16m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                  Unloading (Outward)
                </button>
              </div>
            </div>

            {/* Form Grid */}
            <div className="space-y-6">
              {/* First Row - PO/DO and Product Name */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    PO / DO Number
                  </label>
                  <input
                    type="text"
                    value={form.po_do_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, po_do_number: e.target.value }))
                    }
                    placeholder="PO-12345"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.item_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, item_id: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                    required
                  >
                    <option value="" className="text-zinc-500">
                      Select Product
                    </option>
                    {items.map((i) => (
                      <option
                        key={i.item_id}
                        value={i.item_id}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        {i.item_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row - Party and Truck */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Party Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.party_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, party_id: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                    required
                  >
                    <option value="" className="text-zinc-500">
                      Select Party
                    </option>
                    {parties.map((p) => (
                      <option
                        key={p.party_id}
                        value={p.party_id}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        {p.party_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Truck Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.truck_no}
                    onChange={(e) => handleFieldChange("truck_no", e.target.value)}
                    onBlur={() => handleFieldBlur("truck_no")}
                    placeholder="MH 12 AB 1234"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 ${fieldErrors.truck_no ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'focus:ring-amber-500/50 focus:border-amber-500'} ${colors.inputBg} ${colors.text}`}
                    required
                  />
                  {fieldErrors.truck_no && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {fieldErrors.truck_no}
                    </p>
                  )}
                </div>
              </div>

              {/* Third Row - Invoice Details */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.invoice_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, invoice_number: e.target.value }))
                    }
                    placeholder="INV-2024-001"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.invoice_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, invoice_date: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Invoice Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={form.invoice_quantity}
                    onChange={(e) => handleFieldChange("invoice_quantity", e.target.value)}
                    onBlur={() => handleFieldBlur("invoice_quantity")}
                    placeholder="0.000"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 ${fieldErrors.invoice_quantity ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'focus:ring-amber-500/50 focus:border-amber-500'} ${colors.inputBg} ${colors.text}`}
                    required
                  />
                  {fieldErrors.invoice_quantity && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {fieldErrors.invoice_quantity}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Invoice Rate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.invoice_rate}
                    onChange={(e) => handleFieldChange("invoice_rate", e.target.value)}
                    onBlur={() => handleFieldBlur("invoice_rate")}
                    placeholder="0.00"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 ${fieldErrors.invoice_rate ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'focus:ring-amber-500/50 focus:border-amber-500'} ${colors.inputBg} ${colors.text}`}
                    required
                  />
                  {fieldErrors.invoice_rate && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {fieldErrors.invoice_rate}
                    </p>
                  )}
                </div>
              </div>

              {/* Fourth Row - Transporter and LR */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Transporter Name
                  </label>
                  <select
                    value={form.transporter_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, transporter_id: e.target.value }))
                    }
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                  >
                    <option value="" className="text-zinc-500">
                      Select Transporter
                    </option>
                    {transporters.map((t) => (
                      <option
                        key={t.transporter_id}
                        value={t.transporter_id}
                        className="text-zinc-900 dark:text-zinc-100"
                      >
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    LR Number
                  </label>
                  <input
                    type="text"
                    value={form.lr_number}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lr_number: e.target.value }))
                    }
                    placeholder="LR-12345"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text}`}
                  />
                </div>
              </div>

              {/* Fifth Row - Mobile Number */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.mobile_number}
                    onChange={(e) => handleFieldChange("mobile_number", e.target.value)}
                    onBlur={() => handleFieldBlur("mobile_number")}
                    placeholder="9876543210"
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 ${fieldErrors.mobile_number ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'focus:ring-amber-500/50 focus:border-amber-500'} ${colors.inputBg} ${colors.text}`}
                    required
                  />
                  {fieldErrors.mobile_number && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {fieldErrors.mobile_number}
                    </p>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Remarks 1
                  </label>
                  <textarea
                    value={form.remark1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remark1: e.target.value }))
                    }
                    placeholder="Any additional remarks..."
                    rows={2}
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 ${colors.inputBg} ${colors.text} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`mt-6 rounded-xl p-4 ${colors.errorBg}`}>
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
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Error
                    </p>
                    <p className="text-sm text-red-500 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-95 ${colors.buttonSecondary}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${colors.buttonPrimary} shadow-lg shadow-amber-600/20`}
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
