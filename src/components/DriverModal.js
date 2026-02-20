"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UserIcon, CloseIcon } from "@/components/Icons";

export function DriverModal({ open, onClose, onSuccess, driver, readOnly }) {
  const isEdit = !!driver;
  const isView = !!readOnly;

  // ... (State same as before) ...
  const [driverName, setDriverName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [licence, setLicence] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [adharNumber, setAdharNumber] = useState("");
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

  const validateAdhar = (value) => {
    if (!value.trim()) return "";
    const pattern = /^\d{12}$/;
    if (!pattern.test(value.trim())) return "Adhar number must be 12 digits";
    return "";
  };

  const validateDriverName = (value) => {
      if (!value.trim()) return "Driver name is required";
      return "";
  };

  const validateLicence = (value) => {
      if (!value.trim()) return "Licence number is required";
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
      case "driver_name": error = validateDriverName(value); break;
      case "mobile": error = validateMobile(value); break;
      case "licence": error = validateLicence(value); break;
      case "adhar_number": error = validateAdhar(value); break;
      default: break;
    }
    if (error) setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    if (open) {
      if (driver) {
        setDriverName(driver.driver_name || "");
        setAddress(driver.address || "");
        setMobile(driver.mobile || "");
        setLicence(driver.licence || "");
        setLicenceExpiry(driver.licence_expiry ? driver.licence_expiry.split('T')[0] : "");
        setAdharNumber(driver.adhar_number || "");
        setStatus(driver.status || "Active");
      } else {
        setDriverName("");
        setAddress("");
        setMobile("");
        setLicence("");
        setLicenceExpiry("");
        setAdharNumber("");
        setStatus("Active");
      }
      setError("");
    }
  }, [open, driver]);

  async function handleSubmit(e) {
    if (isView) return;
    e.preventDefault();
    setError("");

    // Strict Validation
    const errors = {};
    let text = "";

    text = validateDriverName(driverName);
    if (text) errors.driver_name = text;

    text = validateMobile(mobile);
    if (text) errors.mobile = text;

    text = validateLicence(licence);
    if (text) errors.licence = text;

    text = validateAdhar(adharNumber);
    if (text) errors.adhar_number = text;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/drivers/${driver.driver_id}` : "/api/drivers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_name: driverName.trim(),
          address: address.trim(),
          mobile: mobile.trim(),
          licence: licence.trim(),
          licence_expiry: licenceExpiry || null,
          adhar_number: adharNumber.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(isEdit ? "Driver updated successfully" : "Driver created successfully");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save driver");
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
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                    {isView ? "Driver Details" : isEdit ? "Edit Driver" : "Add New Driver"}
                </h2>
                <p className="text-sm text-zinc-500 font-medium">Manage driver information</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Driver Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={isView}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Mobile No <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit number"
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              required
              disabled={isView}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Current residence address"
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isView}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700 ml-1">Licence No</label>
                <input
                type="text"
                value={licence}
                onChange={(e) => setLicence(e.target.value)}
                placeholder="DL number"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isView}
                />
            </div>
             <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700 ml-1">Licence Expiry</label>
                <input
                type="date"
                value={licenceExpiry}
                onChange={(e) => setLicenceExpiry(e.target.value)}
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isView}
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700 ml-1">Adhar Number</label>
                <input
                type="text"
                value={adharNumber}
                onChange={(e) => setAdharNumber(e.target.value)}
                placeholder="12-digit UID"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isView}
                />
            </div>
            <div className="space-y-1.5">
                 <label className="text-sm font-bold text-zinc-700 ml-1">Status</label>
                 {isView ? (
                     <div className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 font-medium">
                        {status}
                     </div>
                 ) : (
                  <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                  >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  </select>
                 )}
            </div>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Close
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Driver"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
