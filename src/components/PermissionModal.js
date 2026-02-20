'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { KeyIcon, CloseIcon } from '@/components/Icons';

export function PermissionModal({ open, onClose, onSuccess, permission }) {
  const isEdit = !!permission;
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setCode(permission?.code || '');
      setName(permission?.name || '');
      setError('');
    }
  }, [open, permission]);

  function getHeaders() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Strict Validation
    if (!name.trim()) {
        setError('Permission name is required');
        return;
    }
    if (!code.trim()) {
        setError('Permission code is required');
        return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/permissions/${permission.permission_id}` : '/api/permissions';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ code: code.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(isEdit ? 'Permission updated successfully' : 'Permission created successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save permission');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="rounded-t-xl bg-white px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-indigo-600">
                <KeyIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {isEdit ? 'Edit Permission' : 'Create Permission'}
                </h2>
                <p className="text-sm text-zinc-500">Add a new system permission</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600" aria-label="Close">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter permission name (e.g., user-create, post-edit)"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-zinc-500">Use a descriptive name following naming conventions</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. user_create, gate_in"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 disabled:bg-zinc-50"
                required
                disabled={isEdit}
              />
              {isEdit && <p className="mt-1 text-xs text-zinc-500">Code cannot be changed after creation</p>}
            </div>
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Saving...' : isEdit ? 'Update Permission' : 'Create Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
