"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { 
  CloseIcon, 
  TruckIcon as TruckSvgIcon,
  DashboardIcon as SiteIcon,
  ClipboardIcon as ProductIcon
} from "@/components/Icons";

export function ComposeLogisticModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Master Data State
  const [vehicles, setVehicles] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  const [form, setForm] = useState({
    consignor_name: "", consignor_address: "", consignor_place: "", consignor_gst: "",
    consignee_name: "", consignee_address: "", consignee_place: "", consignee_gst: "",
    truck_no: "", product: "",
    gross_weight: "", tare_weight: "", net_weight: "", rate: "", amounts: ""
  });

  useEffect(() => {
     if (open) {
         fetchMasters();
     }
  }, [open]);

  const fetchMasters = async () => {
      try {
          setLoadingMasters(true);
          const [resVehicles, resItems] = await Promise.all([
              fetch("/api/vehicles?status=Active"),
              fetch("/api/items?status=Active")
          ]);

          if (resVehicles.ok) {
              const data = await resVehicles.json();
              setVehicles(Array.isArray(data) ? data : []);
          }
          if (resItems.ok) {
              const data = await resItems.json();
              setItems(Array.isArray(data) ? data : []);
          }
      } catch (err) {
          toast.error("Failed to load master data");
      } finally {
          setLoadingMasters(false);
      }
  };

  const validateRequired = (value, label) => {
      if (!value || (typeof value === 'string' && !value.trim())) return `${label} is required`;
      return "";
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => {
        const next = { ...prev, [field]: value };
        // Auto-calculate Net Weight if Gross and Tare are present
        if (field === "gross_weight" || field === "tare_weight") {
            const gross = field === "gross_weight" ? parseFloat(value) : parseFloat(prev.gross_weight);
            const tare = field === "tare_weight" ? parseFloat(value) : parseFloat(prev.tare_weight);
            if (!isNaN(gross) && !isNaN(tare)) {
                next.net_weight = (gross - tare).toFixed(2);
            }
        }
        // Auto-calculate Total Amount if Net Weight and Rate are present
        if (field === "rate" || field === "gross_weight" || field === "tare_weight") {
            const net = parseFloat(next.net_weight);
            const rate = field === "rate" ? parseFloat(value) : parseFloat(prev.rate);
            if (!isNaN(net) && !isNaN(rate)) {
                next.amounts = (net * rate/1000).toFixed(2);
            }
        }
        return next;
    });
    
    if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = {};
    errors.truck_no = validateRequired(form.truck_no, "Truck No");
    errors.product = validateRequired(form.product, "Product");
    errors.consignor_name = validateRequired(form.consignor_name, "Consignor Name");
    errors.consignee_name = validateRequired(form.consignee_name, "Consignee Name");

    if (Object.values(errors).some(e => e)) {
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

      if (!res.ok) throw new Error(await res.text() || "Failed to create entry");

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
                    <InputField 
                        label="Consignor Name" 
                        required 
                        value={form.consignor_name} 
                        onChange={v => handleFieldChange("consignor_name", v)}
                        error={fieldErrors.consignor_name}
                    />
                    <TextAreaField 
                        label="Address" 
                        value={form.consignor_address} 
                        onChange={v => handleFieldChange("consignor_address", v)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="City/Place" value={form.consignor_place} onChange={v => handleFieldChange("consignor_place", v)} />
                        <InputField label="GSTIN" value={form.consignor_gst} onChange={v => handleFieldChange("consignor_gst", v.toUpperCase())} className="font-mono uppercase" />
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
                    <InputField 
                        label="Consignee Name" 
                        required 
                        value={form.consignee_name} 
                        onChange={v => handleFieldChange("consignee_name", v)}
                        error={fieldErrors.consignee_name}
                    />
                    <TextAreaField 
                        label="Address" 
                        value={form.consignee_address} 
                        onChange={v => handleFieldChange("consignee_address", v)}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="City/Place" value={form.consignee_place} onChange={v => handleFieldChange("consignee_place", v)} />
                        <InputField label="GSTIN" value={form.consignee_gst} onChange={v => handleFieldChange("consignee_gst", v.toUpperCase())} className="font-mono uppercase" />
                    </div>
                </div>
              </div>
            </div>

            {/* Load & Vehicle */}
            <div className="bg-zinc-50 rounded-xl p-5 border border-zinc-200 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <ProductIcon className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-zinc-700">Load & Vehicle Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1 w-full">
                        <label className="text-sm font-medium text-zinc-700">Truck Number <span className="text-red-500">*</span></label>
                        <select 
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                                fieldErrors.truck_no
                                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                                : 'border-zinc-300 bg-white focus:border-blue-500'
                            }`}
                            value={form.truck_no}
                            onChange={e => handleFieldChange("truck_no", e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Vehicle</option>
                            {vehicles.map(v => (
                                <option key={v.id || v.vehicle_id} value={v.truck_number || v.vehicle_number}>
                                    {v.truck_number || v.vehicle_number}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.truck_no && <p className="text-xs text-red-500 font-medium">{fieldErrors.truck_no}</p>}
                    </div>

                     <div className="space-y-1 w-full">
                        <label className="text-sm font-medium text-zinc-700">Product Name <span className="text-red-500">*</span></label>
                        <select 
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-all ${
                                fieldErrors.product
                                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                                : 'border-zinc-300 bg-white focus:border-blue-500'
                            }`}
                            value={form.product}
                            onChange={e => handleFieldChange("product", e.target.value)}
                            disabled={loadingMasters}
                        >
                            <option value="">Select Product</option>
                             {items.map(i => (
                                <option key={i.id || i.item_id} value={i.item_name}>
                                    {i.item_name}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.product && <p className="text-xs text-red-500 font-medium">{fieldErrors.product}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <InputField label="Gross Wt" type="number" value={form.gross_weight} onChange={v => handleFieldChange("gross_weight", v)} />
                    <InputField label="Tare Wt" type="number" value={form.tare_weight} onChange={v => handleFieldChange("tare_weight", v)} />
                    <InputField label="Net Wt" value={form.net_weight} readOnly className="bg-blue-50 text-blue-700 font-bold border-blue-200" />
                    <InputField label="Rate" type="number" value={form.rate} onChange={v => handleFieldChange("rate", v)} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-zinc-700">Total Amount</label>
                        <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 text-right">
                           {form.amounts || '0.00'}₹
                        </div>
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
            {loading ? "Processing..." : "Create Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                    : 'border-zinc-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400'
                } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
                value={value} 
                onChange={e => onChange && onChange(e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    )
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
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10' 
                    : 'border-zinc-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 hover:border-zinc-400'
                } ${className}`}
                value={value} 
                onChange={e => onChange && onChange(e.target.value)}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    )
}
