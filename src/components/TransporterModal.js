"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TruckIcon, CloseIcon } from "@/components/Icons";

export function TransporterModal({ open, onClose, onSuccess, transporter }) {
  const isEdit = !!transporter;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [panNo, setPanNo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Transporter name is required";
    if (trimmed.length < 3) return "Name must be at least 3 characters";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) return "Invalid email format";
    return "";
  };

  const validatePhone = (value) => {
    if (!value.trim()) return "";
    const pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(value.trim())) return "Invalid mobile number (10 digits)";
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
      case "name": error = validateName(value); break;
      case "email": error = validateEmail(value); break;
      case "phone": error = validatePhone(value); break;
      case "pan_no": error = validatePan(value); break;
      default: break;
    }
    if (error) setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (open) {
      setName(transporter?.name || "");
      setAddress(transporter?.address || "");
      setGstNo(transporter?.gst_no || "");
      setPanNo(transporter?.pan_no || "");
      setPhone(transporter?.contact_phone || "");
      setEmail(transporter?.email || "");
      setContactPerson(transporter?.contact_person || "");
      setStatus(transporter?.status || "Active");
      setError("");
      setFieldErrors({});
    }
  }, [open, transporter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    // Strict Validation
    const errors = {};
    let text = "";
    
    text = validateName(name);
    if (text) errors.name = text;
    
    text = validateEmail(email);
    if (text) errors.email = text;

    text = validatePhone(phone);
    if (text) errors.phone = text;

    text = validatePan(panNo);
    if (text) errors.pan_no = text;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/transporters/${transporter.transporter_id}` : "/api/transporters";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          gst_no: gstNo.trim(),
          pan_no: panNo.trim(),
          contact_phone: phone.trim(),
          email: email.trim(),
          contact_person: contactPerson.trim(),
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(isEdit ? "Transporter updated successfully" : "Transporter created successfully");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save transporter");
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
                <TruckIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">{isEdit ? "Edit Transporter" : "Add New Transporter"}</h2>
                <p className="text-sm text-zinc-500 font-medium">Capture logistics partner information</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Transporter Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleFieldChange("name", e.target.value, setName)}
              onBlur={() => handleFieldBlur("name", name)}
              placeholder="Full legal name of transporter"
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                fieldErrors.name ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
            {fieldErrors.name && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Name of person"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Mobile No</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handleFieldChange("phone", e.target.value, setPhone)}
                onBlur={() => handleFieldBlur("phone", phone)}
                placeholder="10-digit number"
                className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono ${
                  fieldErrors.phone ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
                }`}
              />
              {fieldErrors.phone && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleFieldChange("email", e.target.value, setEmail)}
              onBlur={() => handleFieldBlur("email", email)}
              placeholder="logistics@company.com"
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                fieldErrors.email ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
            {fieldErrors.email && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">GST Number</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value.toUpperCase())}
                placeholder="22AAAAA0000A1Z5"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono uppercase"
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
                }`}
              />
              {fieldErrors.pan_no && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.pan_no}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Office Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, Pin code"
              rows={2}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? "Saving..." : isEdit ? "Update Details" : "Add Transporter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
