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
  
  // ITEMS SELECTION STATE
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [items, setItems] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Determine if the selected role is a Yard role
  const selectedRole = roles?.find(r => r.role_id?.toString() === roleId?.toString());
  const isYardRole = selectedRole?.name?.toUpperCase().includes('YARD');

  const validateUsername = (value) => {
      if (!value.trim()) return "Username is required";
      if (value.trim().length < 3) return "Username must be at least 3 characters";
      return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) return "Invalid email format";
    return "";
  };

  const validatePassword = (value) => {
      if (!value) return "";
      if (value.length < 6) return "Password must be at least 6 characters";
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
      case "username": error = validateUsername(value); break;
      case "email": error = validateEmail(value); break;
      case "password": error = validatePassword(value); break;
      default: break;
    }
    if (error) setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  useEffect(() => {
    async function fetchItems() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/items', { headers });
        if (res.ok) {
          const data = await res.json();
          setItems(data.filter(i => i.status === 'Active') || []);
        }
      } catch (err) {
        console.error('Failed to fetch items', err);
      }
    }
    
    if (open) {
      fetchItems();
      setUsername(user?.username || '');
      setEmail(user?.email || '');
      setPassword('');
      setConfirmPassword('');
      setFullName(user?.full_name || '');
      setRoleId(user?.role_id?.toString() || (roles?.[0]?.role_id?.toString() ?? ''));
      setIsActive(user ? user.is_active !== 0 : true);
      setSelectedItemIds(user?.item_ids ?? (user?.items?.map(i => i.item_id) ?? []));
      setError('');
    }
  }, [open, user, roles]);

  function toggleItem(id) {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAllItems(checked) {
    setSelectedItemIds(checked ? items.map((i) => i.item_id) : []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Strict Validation
    const errors = {};
    let text = "";

    text = validateUsername(username);
    if (text) errors.username = text;

    text = validateEmail(email);
    if (text) errors.email = text;

    if (!roleId) {
        errors.role_id = 'Role is required';
    }

    if (!isEdit) {
        text = validatePassword(password);
        if (text) errors.password = text;
    }

    if (password && password !== confirmPassword) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
        item_ids: isYardRole ? selectedItemIds : [],
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-white px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-blue-600 shadow-sm">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">{isEdit ? "Edit User" : "Add New User"}</h2>
                <p className="text-sm text-zinc-500 font-medium">Manage system access</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="jdoe"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700 ml-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                />
            </div>

             <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Role <span className="text-red-500">*</span></label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                required
              >
                  <option value="">Select Role</option>
                  {roles?.map(r => (
                      <option key={r.role_id} value={r.role_id}>{r.name}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 ml-1">Password {isEdit && "(Leave blank to keep current)"} <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                required={!isEdit}
              />
            </div>

            <div className="space-y-1.5">
               <label className="text-sm font-bold text-zinc-700 ml-1">Confirm Password <span className="text-red-500">*</span></label>
               <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                required={!isEdit || password.length > 0}
              />
            </div>
            
            <div className="space-y-1.5 flex items-center pt-6">
               <label className="flex items-center gap-2 text-sm font-bold text-zinc-700 cursor-pointer">
                 <input
                   type="checkbox"
                   checked={isActive}
                   onChange={(e) => setIsActive(e.target.checked)}
                   className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                 />
                 Active User
               </label>
            </div>
          </div>

          {/* DYNAMIC ITEMS SELECTION FOR YARD ROLES */}
          {isYardRole && (
            <div className="mt-6 border-t border-zinc-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-zinc-900">Yard Items Assignment</label>
                  <p className="text-xs text-zinc-500 mt-0.5">Select items this user is allowed to manage.</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItemIds.length === items.length}
                    onChange={(e) => toggleAllItems(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  Select all
                </label>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border-2 border-zinc-100 bg-zinc-50/50 p-4 shadow-inner">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {items.map((i) => {
                    const isSelected = selectedItemIds.includes(i.item_id);
                    return (
                      <label
                        key={i.item_id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-zinc-200 bg-white hover:border-blue-200 hover:bg-zinc-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(i.item_id)}
                          className="mt-0.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className={`text-sm tracking-tight ${isSelected ? 'font-bold text-blue-900' : 'font-semibold text-zinc-700'}`}>
                          {i.item_name}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                    <p className="text-sm font-medium">No active items found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
