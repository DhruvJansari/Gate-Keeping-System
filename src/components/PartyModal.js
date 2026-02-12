'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UsersIcon, CloseIcon } from '@/components/Icons';

export function PartyModal({ open, onClose, onSuccess, party }) {
  const isEdit = !!party;
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validatePartyName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Party name is required";
    if (trimmed.length < 3) return "Party name must be at least 3 characters";
    if (trimmed.length > 200) return "Party name must not exceed 200 characters";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return ""; // Optional field
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) {
      return "Invalid email format";
    }
    return "";
  };

  const validatePhone = (value) => {
    if (!value.trim()) return ""; // Optional field
    const pattern = /^[6-9]\d{9}$/;
    if (!pattern.test(value.trim())) {
      return "Invalid phone number. Must be 10 digits starting with 6-9";
    }
    return "";
  };

  const validateGST = (value) => {
    if (!value.trim()) return ""; // Optional field
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!pattern.test(value.trim())) {
      return "Invalid GST format. Example: 22AAAAA0000A1Z5";
    }
    return "";
  };

  const validatePAN = (value) => {
    if (!value.trim()) return ""; // Optional field
    const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!pattern.test(value.trim())) {
      return "Invalid PAN format. Example: ABCDE1234F";
    }
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
      case "party_name":
        error = validatePartyName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
      case "gst_no":
        error = validateGST(value);
        break;
      case "pan_no":
        error = validatePAN(value);
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
      setPartyName(party?.party_name || '');
      setAddress(party?.address || '');
      setGstNo(party?.gst_no || '');
      setPanNo(party?.pan_no || '');
      setPhone(party?.contact_phone || '');
      setEmail(party?.email || '');
      setStatus(party?.status || 'Active');
      setError('');
      setFieldErrors({});
    }
  }, [open, party]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const errors = {};
    errors.party_name = validatePartyName(partyName);
    if (email) errors.email = validateEmail(email);
    if (phone) errors.phone = validatePhone(phone);
    if (gstNo) errors.gst_no = validateGST(gstNo);
    if (panNo) errors.pan_no = validatePAN(panNo);
    
    const validationErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, v]) => v !== "")
    );
    
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the validation errors");
      return;
    }
    
    setLoading(true);
    try {
      const url = isEdit ? `/api/parties/${party.party_id}` : '/api/parties';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = {
        party_name: partyName,
        address,
        gst_no: gstNo,
        pan_no: panNo,
        contact_phone: phone,
        email,
        ...(isEdit && { status }),
      };
      
      console.log('Party API Request:', { url, method, payload });
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      console.log('Party API Response:', { status: res.status, data });
      
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(isEdit ? 'Party updated successfully' : 'Party created successfully');
      window.dispatchEvent(new Event('sidebar-counts-refresh'));
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Party save error:', err);
      toast.error(err.message || 'Failed to save party');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <div className="rounded-t-xl bg-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-white/20 text-white">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? 'Edit Party' : 'Add New Party'}
                </h2>
                <p className="text-sm text-amber-100">Enter party details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partyName}
                onChange={(e) => handleFieldChange("party_name", e.target.value, setPartyName)}
                onBlur={() => handleFieldBlur("party_name", partyName)}
                placeholder="Enter party name"
                className={`w-full rounded-lg border ${fieldErrors.party_name ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                required
              />
              {fieldErrors.party_name && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.party_name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">GST No</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => handleFieldChange("gst_no", e.target.value.toUpperCase(), setGstNo)}
                onBlur={() => handleFieldBlur("gst_no", gstNo)}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={`w-full rounded-lg border ${fieldErrors.gst_no ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.gst_no && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.gst_no}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">PAN No</label>
              <input
                type="text"
                value={panNo}
                onChange={(e) => handleFieldChange("pan_no", e.target.value.toUpperCase(), setPanNo)}
                onBlur={() => handleFieldBlur("pan_no", panNo)}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`w-full rounded-lg border ${fieldErrors.pan_no ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.pan_no && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.pan_no}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handleFieldChange("phone", e.target.value, setPhone)}
                onBlur={() => handleFieldBlur("phone", phone)}
                placeholder="9876543210"
                className={`w-full rounded-lg border ${fieldErrors.phone ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleFieldChange("email", e.target.value, setEmail)}
                onBlur={() => handleFieldBlur("email", email)}
                placeholder="email@example.com"
                className={`w-full rounded-lg border ${fieldErrors.email ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            {isEdit && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
