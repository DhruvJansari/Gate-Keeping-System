'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TruckIcon, CloseIcon } from '@/components/Icons';

export function TransporterModal({ open, onClose, onSuccess, transporter }) {
  const isEdit = !!transporter;
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateName = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "Transporter name is required";
    if (trimmed.length < 3) return "Name must be at least 3 characters";
    if (trimmed.length > 200) return "Name must not exceed 200 characters";
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

  useEffect(() => {
    if (open) {
      setName(transporter?.name || '');
      setAddress(transporter?.address || '');
      setGstNo(transporter?.gst_no || '');
      setPanNo(transporter?.pan_no || '');
      setPhone(transporter?.contact_phone || '');
      setEmail(transporter?.email || '');
      setContactPerson(transporter?.contact_person || '');
      setStatus(transporter?.status || 'Active');
      setError('');
      setFieldErrors({});
    }
  }, [open, transporter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Validate all fields
    const errors = {};
    errors.name = validateName(name);
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
      const url = isEdit ? `/api/transporters/${transporter.transporter_id}` : '/api/transporters';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          gst_no: gstNo,
          pan_no: panNo,
          contact_phone: phone,
          email,
          contact_person: contactPerson,
          ...(isEdit && { status }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(isEdit ? 'Transporter updated successfully' : 'Transporter created successfully');
      window.dispatchEvent(new Event('sidebar-counts-refresh'));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save transporter');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="rounded-t-xl bg-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-white/20 text-white">
                <TruckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? 'Edit Transporter' : 'Add New Transporter'}
                </h2>
                <p className="text-sm text-amber-100">Manage logistics partners and carriers</p>
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
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Transporter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                onBlur={() => {
                  const err = validateName(name);
                  if (err) setFieldErrors((prev) => ({ ...prev, name: err }));
                }}
                placeholder="Enter transporter name"
                className={`w-full rounded-lg border ${fieldErrors.name ? 'border-red-500' : 'border-zinc-300'} bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
                required
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address..."
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">GST No</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => {
                  setGstNo(e.target.value.toUpperCase());
                  if (fieldErrors.gst_no) {
                    setFieldErrors((prev) => ({ ...prev, gst_no: "" }));
                  }
                }}
                onBlur={() => {
                  const err = validateGST(gstNo);
                  if (err) setFieldErrors((prev) => ({ ...prev, gst_no: err }));
                }}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className={`w-full rounded-lg border ${fieldErrors.gst_no ? 'border-red-500' : 'border-zinc-300'} bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.gst_no && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.gst_no}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">PAN No</label>
              <input
                type="text"
                value={panNo}
                onChange={(e) => {
                  setPanNo(e.target.value.toUpperCase());
                  if (fieldErrors.pan_no) {
                    setFieldErrors((prev) => ({ ...prev, pan_no: "" }));
                  }
                }}
                onBlur={() => {
                  const err = validatePAN(panNo);
                  if (err) setFieldErrors((prev) => ({ ...prev, pan_no: err }));
                }}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`w-full rounded-lg border ${fieldErrors.pan_no ? 'border-red-500' : 'border-zinc-300'} bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.pan_no && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.pan_no}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Mobile Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: "" }));
                  }
                }}
                onBlur={() => {
                  const err = validatePhone(phone);
                  if (err) setFieldErrors((prev) => ({ ...prev, phone: err }));
                }}
                placeholder="9876543210"
                className={`w-full rounded-lg border ${fieldErrors.phone ? 'border-red-500' : 'border-zinc-300'} bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                onBlur={() => {
                  const err = validateEmail(email);
                  if (err) setFieldErrors((prev) => ({ ...prev, email: err }));
                }}
                placeholder="email@example.com"
                className={`w-full rounded-lg border ${fieldErrors.email ? 'border-red-500' : 'border-zinc-300'} bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Contact Person</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Enter contact person name"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {isEdit && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Transporter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
