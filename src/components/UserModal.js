'use client';

import { useState, useEffect } from 'react';
import { UserIcon, CloseIcon } from '@/components/Icons';

export function UserModal({ open, onClose, onSuccess, user, roles }) {
  const isEdit = !!user;
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setUsername(user?.username || '');
      setEmail(user?.email || '');
      setPassword('');
      setConfirmPassword('');
      setFullName(user?.full_name || '');
      setRoleId(user?.role_id?.toString() || (roles?.[0]?.role_id?.toString() ?? ''));
      setIsActive(user ? user.is_active !== 0 : true);
      setError('');
    }
  }, [open, user, roles]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isEdit && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const body = {
        username: username.trim(),
        email: email.trim(),
        full_name: fullName.trim() || null,
        role_id: parseInt(roleId, 10),
        is_active: isActive ? 1 : 0,
      };
      if (password && password.trim()) {
        body.password = password;
      }

      const url = isEdit ? `/api/users/${user.user_id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');
      window.dispatchEvent(new Event('sidebar-counts-refresh'));
      onSuccess?.();
      onClose();
    } catch (err) {
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
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? 'Edit User' : 'Create New User'}
                </h2>
                <p className="text-sm text-amber-100">
                  {isEdit ? 'Update user information and permissions.' : 'Add a new system user.'}
                </p>
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
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Password {isEdit && '(leave empty to keep current)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Enter password (min 6 chars)'}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required={!isEdit}
              />
              {isEdit && (
                <p className="mt-1 text-xs text-zinc-500">
                  Leave empty if you don&apos;t want to change the password.
                </p>
              )}
            </div>
            {(!isEdit || password) && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required={!isEdit || !!password}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              >
                <option value="">Select role</option>
                {Array.isArray(roles) &&
                  roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
              <select
                value={isActive ? '1' : '0'}
                onChange={(e) => setIsActive(e.target.value === '1')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
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
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
