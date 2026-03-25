"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  CloseIcon,
  TruckIcon as TruckSvgIcon,
  DashboardIcon as SiteIcon,
  ClipboardIcon as ProductIcon,
} from "@/components/Icons";

// ── Party Autocomplete Field ──────────────────────────────────────────────────
// Search party master by name; selecting a party auto-fills related fields.
// User can also type freely (manual entry).
function PartyAutocomplete({ label, required, error, prefix, form, onChange }) {
  const [query, setQuery] = useState(form[`${prefix}_name`] || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Keep query in sync when form is reset externally
  useEffect(() => {
    setQuery(form[`${prefix}_name`] || "");
  }, [form[`${prefix}_name`]]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (value) => {
    setQuery(value);
    onChange(`${prefix}_name`, value); // always sync manual typed value
    clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parties?search=${encodeURIComponent(value)}&status=Active`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
          setOpen(true);
        }
      } catch { /* silent */ } finally { setLoading(false); }
    }, 250);
  };

  const select = (party) => {
    setQuery(party.party_name);
    setOpen(false);
    setSuggestions([]);
    // Auto-fill all related fields
    onChange(`${prefix}_name`, party.party_name);
    onChange(`${prefix}_address`, party.address || "");
    onChange(`${prefix}_gst`, party.gst_no || "");
    // Auto-fill city/place from party master
    onChange(`${prefix}_place`, party.city || "");
  };

  return (
    <div className="space-y-1 w-full" ref={wrapRef}>
      <label className="text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          placeholder="Search or type party name…"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setOpen(true)}
          className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-400 ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              : "border-zinc-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400"
          }`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">…</span>
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-xl max-h-52 overflow-y-auto">
            {suggestions.map((p) => (
              <li
                key={p.party_id}
                onMouseDown={() => select(p)}
                className="flex flex-col px-3 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-zinc-50 last:border-0"
              >
                <span className="text-sm font-semibold text-zinc-800">{p.party_name}</span>
                {(p.address || p.gst_no) && (
                  <span className="text-xs text-zinc-400 truncate">
                    {[p.address, p.gst_no].filter(Boolean).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function ComposeLogisticModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [vehicles, setVehicles] = useState([]);
  const [items, setItems] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const emptyForm = {
    consignor_name: "", consignor_address: "", consignor_place: "", consignor_gst: "",
    consignee_name: "", consignee_address: "", consignee_place: "", consignee_gst: "",
    truck_no: "", product: "", driver_id: "", name: "",
    gross_weight: "", tare_weight: "", net_weight: "", rate: "", amounts: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      fetchMasters();
      setForm(emptyForm);
      setFieldErrors({});
    }
  }, [open]);

  const fetchMasters = async () => {
    try {
      setLoadingMasters(true);
      const [resVehicles, resItems, resDrivers, resTransporters] = await Promise.all([
        fetch("/api/vehicles?status=Active"),
        fetch("/api/items?status=Active"),
        fetch("/api/drivers?status=Active"),
        fetch("/api/transporters?status=Active"),
      ]);
      if (resVehicles.ok) { const d = await resVehicles.json(); setVehicles(Array.isArray(d) ? d : []); }
      if (resItems.ok) { const d = await resItems.json(); setItems(Array.isArray(d) ? d : []); }
      if (resDrivers.ok) { const d = await resDrivers.json(); setDrivers(Array.isArray(d) ? d : []); }
      if (resTransporters.ok) { const d = await resTransporters.json(); setTransporters(Array.isArray(d) ? d : []); }
    } catch {
      toast.error("Failed to load vehicle data");
    } finally {
      setLoadingMasters(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "gross_weight" || field === "tare_weight") {
        const gross = field === "gross_weight" ? parseFloat(value) : parseFloat(prev.gross_weight);
        const tare  = field === "tare_weight"  ? parseFloat(value) : parseFloat(prev.tare_weight);
        if (!isNaN(gross) && !isNaN(tare)) next.net_weight = Math.max(0, gross - tare).toFixed(2);
      }
      if (field === "rate" || field === "gross_weight" || field === "tare_weight") {
        const net  = parseFloat(next.net_weight);
        const rate = field === "rate" ? parseFloat(value) : parseFloat(prev.rate);
        if (!isNaN(net) && !isNaN(rate)) next.amounts = (net * rate / 1000).toFixed(2);
      }
      return next;
    });
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!form.truck_no?.trim())        errors.truck_no       = "Truck No is required";
    if (!form.product?.trim())         errors.product        = "Product is required";
    if (!form.consignor_name?.trim())  errors.consignor_name = "Consignor Name is required";
    if (!form.consignee_name?.trim())  errors.consignee_name = "Consignee Name is required";
    if (!form.driver_id)               errors.driver_id      = "Driver is required";

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/logistic-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.text()) || "Failed to create entry");
      toast.success("Entry created successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">New Logistic Entry</h2>
            <p className="text-sm text-zinc-500">Create independent record</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Consignor */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100">
                <SiteIcon className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-zinc-700">Consignor Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <PartyAutocomplete
                  label="Consignor Name"
                  required
                  prefix="consignor"
                  form={form}
                  error={fieldErrors.consignor_name}
                  onChange={handleFieldChange}
                />
                <TextAreaField
                  label="Address"
                  value={form.consignor_address}
                  onChange={(v) => handleFieldChange("consignor_address", v)}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City/Place" value={form.consignor_place} onChange={(v) => handleFieldChange("consignor_place", v)} />
                  <InputField label="GSTIN" value={form.consignor_gst} onChange={(v) => handleFieldChange("consignor_gst", v.toUpperCase())} className="font-mono uppercase" />
                </div>
              </div>
            </div>

            {/* Consignee */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100">
                <SiteIcon className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-zinc-700">Consignee Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <PartyAutocomplete
                  label="Consignee Name"
                  required
                  prefix="consignee"
                  form={form}
                  error={fieldErrors.consignee_name}
                  onChange={handleFieldChange}
                />
                <TextAreaField
                  label="Address"
                  value={form.consignee_address}
                  onChange={(v) => handleFieldChange("consignee_address", v)}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="City/Place" value={form.consignee_place} onChange={(v) => handleFieldChange("consignee_place", v)} />
                  <InputField label="GSTIN" value={form.consignee_gst} onChange={(v) => handleFieldChange("consignee_gst", v.toUpperCase())} className="font-mono uppercase" />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Weights */}
          <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
              <ProductIcon className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-bold text-zinc-700">Vehicle & Weight Details</h3>
            </div>

            {/* Truck selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 w-full">
                <label className="text-sm font-medium text-zinc-700">
                  Truck Number <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.truck_no
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-zinc-300 bg-white focus:border-blue-500"
                  }`}
                  value={form.truck_no}
                  onChange={(e) => handleFieldChange("truck_no", e.target.value)}
                  disabled={loadingMasters}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id || v.vehicle_id} value={v.truck_number || v.vehicle_number}>
                      {v.truck_number || v.vehicle_number}
                    </option>
                  ))}
                </select>
                {fieldErrors.truck_no && <p className="text-xs text-red-500 font-medium">{fieldErrors.truck_no}</p>}
              </div>

              <div className="space-y-1 w-full">
                <label className="text-sm font-medium text-zinc-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.product
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-zinc-300 bg-white focus:border-blue-500"
                  }`}
                  value={form.product}
                  onChange={(e) => handleFieldChange("product", e.target.value)}
                  disabled={loadingMasters}
                >
                  <option value="">Select Product</option>
                  {items.map((i) => (
                    <option key={i.id || i.item_id} value={i.item_name}>
                      {i.item_name}
                    </option>
                  ))}
                </select>
                {fieldErrors.product && <p className="text-xs text-red-500 font-medium">{fieldErrors.product}</p>}
              </div>
            </div>

            {/* Weights & amounts */}
            {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InputField label="First Wt" type="number" value={form.tare_weight} onChange={(v) => handleFieldChange("tare_weight", v)} />
              <InputField label="Second Wt"  type="number" value={form.gross_weight}  onChange={(v) => handleFieldChange("gross_weight", v)} />
              <InputField label="Weight (Net)"   value={form.net_weight} readOnly className="bg-blue-50 text-blue-700 font-bold border-blue-200" />
              <InputField label="Freight Rate"     type="number" value={form.rate} onChange={(v) => handleFieldChange("rate", v)} />
            </div> */}

            {/* Transporter & Driver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 w-full">
                <label className="text-sm font-medium text-zinc-700">
                  Transporter Name
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all border-zinc-300 bg-white focus:border-blue-500`}
                  value={form.transporter_name}
                  onChange={(e) => handleFieldChange("transporter_name", e.target.value)}
                  disabled={loadingMasters}
                >
                  <option value="">Select Transporter</option>
                  {transporters.map((t) => (
                    <option key={t.transporter_id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 w-full">
                <label className="text-sm font-medium text-zinc-700">
                  Driver <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                    fieldErrors.driver_id
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : "border-zinc-300 bg-white focus:border-blue-500"
                  }`}
                  value={form.driver_id}
                  onChange={(e) => handleFieldChange("driver_id", e.target.value)}
                  disabled={loadingMasters}
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.driver_name}{d.mobile ? ` (${d.mobile})` : ""}
                    </option>
                  ))}
                </select>
                {fieldErrors.driver_id && <p className="text-xs text-red-500 font-medium">{fieldErrors.driver_id}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">Total Amount</label>
              <div className="w-45 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 text-right">
                {form.amounts || "0.00"} ₹
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow active:translate-y-0.5 transition-all flex items-center gap-2"
          >
            {loading ? "Processing…" : "Create Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function InputField({ label, value, onChange, type = "text", required, error, className = "", readOnly, placeholder }) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-400 ${
          error
            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            : "border-zinc-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400"
        } ${readOnly ? "opacity-70 cursor-not-allowed" : ""} ${className}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function TextAreaField({ label, value, onChange, required, error, className = "" }) {
  return (
    <div className="space-y-1 w-full">
      <label className="text-sm font-medium text-zinc-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        rows={2}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all resize-none placeholder:text-zinc-400 ${
          error
            ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            : "border-zinc-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400"
        } ${className}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
