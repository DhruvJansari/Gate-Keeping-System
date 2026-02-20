'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldIcon, CloseIcon } from '@/components/Icons';

export function RoleModal({ open, onClose, onSuccess, role, permissions }) {
  const isEdit = !!role;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(role?.name || '');
      setDescription(role?.description || '');
      setSelectedIds(role?.permission_ids ?? []);
      setError('');
    }
  }, [open, role]);

  function getHeaders() {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  function togglePermission(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll(checked) {
    if (!Array.isArray(permissions)) return;
    setSelectedIds(checked ? permissions.map((p) => p.permission_id) : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    // Strict Validation
    if (!name.trim()) {
        setError('Role name is required');
        return;
    }
    
    setLoading(true);
    try {
      const url = isEdit ? `/api/roles/${role.role_id}` : '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          permission_ids: selectedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(isEdit ? 'Role updated successfully' : 'Role created successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save role');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const permList = Array.isArray(permissions) ? permissions : [];
  const allSelected = permList.length > 0 && selectedIds.length === permList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="rounded-t-xl bg-white px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-indigo-600">
                <ShieldIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {isEdit ? 'Edit Role' : 'Create Role'}
                </h2>
                <p className="text-sm text-zinc-500">Manage user roles and permissions</p>
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
                placeholder="Enter role name"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-700">Permission</label>
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Select all
                </label>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {permList.map((p) => (
                    <label
                      key={p.permission_id}
                      className="flex cursor-pointer items-center gap-2 rounded border border-zinc-100 px-3 py-2 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.permission_id)}
                        onChange={() => togglePermission(p.permission_id)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-900">{p.code}</span>
                    </label>
                  ))}
                </div>
                {permList.length === 0 && (
                  <p className="py-4 text-center text-sm text-zinc-500">No permissions defined. Create permissions first.</p>
                )}
              </div>
            </div>
          </div>
          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
