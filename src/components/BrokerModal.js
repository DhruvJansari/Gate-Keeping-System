"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UsersIcon, CloseIcon } from "@/components/Icons";

export function BrokerModal({ open, onClose, onSuccess, broker, readOnly }) {
  const isEdit = !!broker;
  const isView = !!readOnly;

  // Fields
  const [brokerName, setBrokerName] = useState("");
  const [brokerAddress, setBrokerAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateMobile = (value) => {
    if (!value.trim()) return "";
    const pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(value.trim())) return "Invalid mobile number (10 digits)";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) return "Invalid email format";
    return "";
  };

  const validateBrokerName = (value) => {
      if (!value.trim()) return "Broker name is required";
      return "";
  };

  const validatePan = (value) => {
    if (!value.trim()) return "";
    const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pattern.test(value.trim().toUpperCase())) return "Invalid PAN format (e.g. ABCDE1234F)";
    return "";
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFieldBlur = (field, value) => {
    let error = "";
    switch (field) {
      case "broker_name": error = validateBrokerName(value); break;
      case "mobile": error = validateMobile(value); break;
      case "email": error = validateEmail(value); break;
      case "pan_no": error = validatePan(value); break;
      default: break;
    }
    if (error) setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (open) {
      if (broker) {
        setBrokerName(broker.broker_name || "");
        setBrokerAddress(broker.broker_address || "");
        setMobile(broker.mobile || "");
        setEmail(broker.email || "");
        setGstNo(broker.gst_no || "");
        setPanNo(broker.pan_no || "");
        setStatus(broker.status || "Active");
      } else {
        setBrokerName("");
        setBrokerAddress("");
        setMobile("");
        setEmail("");
        setGstNo("");
        setPanNo("");
        setStatus("Active");
      }
      setError("");
      setFieldErrors({});
    }
  }, [open, broker]);

  async function handleSubmit(e) {
    if (isView) return;
    e.preventDefault();
    setError("");

    // Strict Validation
    const errors = {};
    let text = "";

    text = validateBrokerName(brokerName);
    if (text) errors.broker_name = text;

    text = validateMobile(mobile);
    if (text) errors.mobile = text;

    text = validateEmail(email);
    if (text) errors.email = text;

    text = validatePan(panNo);
    if (text) errors.pan_no = text;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/brokers/${broker.broker_id}` : "/api/brokers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broker_name: brokerName.trim(),
          broker_address: brokerAddress.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          gst_no: gstNo.trim(),
          pan_no: panNo.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(isEdit ? "Broker updated successfully" : "Broker created successfully");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save broker");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-white px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-blue-600 shadow-sm">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                    {isView ? "Broker Details" : isEdit ? "Edit Broker" : "Add New Broker"}
                </h2>
                <p className="text-sm text-zinc-500 font-medium">Manage broker information</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Broker Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={brokerName}
              onChange={(e) => handleFieldChange("broker_name", e.target.value, setBrokerName)}
              onBlur={() => handleFieldBlur("broker_name", brokerName)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                fieldErrors.broker_name ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              required
              disabled={isView}
            />
            {fieldErrors.broker_name && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.broker_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Mobile</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => handleFieldChange("mobile", e.target.value, setMobile)}
                onBlur={() => handleFieldBlur("mobile", mobile)}
                placeholder="10-digit number"
                className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                  fieldErrors.mobile ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={isView}
              />
              {fieldErrors.mobile && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.mobile}</p>}
            </div>
            
            <div className="space-y-1.5">
               <label className="text-sm font-bold text-zinc-700 ml-1">Email</label>
               <input
                type="email"
                value={email}
                onChange={(e) => handleFieldChange("email", e.target.value, setEmail)}
                onBlur={() => handleFieldBlur("email", email)}
                placeholder="email@example.com"
                className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                  fieldErrors.email ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={isView}
              />
              {fieldErrors.email && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">GST Number</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isView}
              />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-sm font-bold text-zinc-700 ml-1">PAN Number</label>
               <input
                type="text"
                value={panNo}
                onChange={(e) => handleFieldChange("pan_no", e.target.value.toUpperCase(), setPanNo)}
                onBlur={() => handleFieldBlur("pan_no", panNo)}
                placeholder="ABCDE1234F"
                className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono uppercase ${
                  fieldErrors.pan_no ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                disabled={isView}
              />
              {fieldErrors.pan_no && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.pan_no}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Address</label>
            <textarea
              value={brokerAddress}
              onChange={(e) => setBrokerAddress(e.target.value)}
              rows={2}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isView}
            />
          </div>

          {!isView && (
            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? "Saving..." : isEdit ? "Update Broker" : "Add Broker"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
