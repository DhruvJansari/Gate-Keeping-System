"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ItemModal } from "@/components/ItemModal";
import { ClipboardIcon } from "@/components/Icons";
// import { useTheme } from "@/context/ThemeContext";

function SearchIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

export function ItemsManagement() {
  const { user, hasPermission } = useAuth();
  // const { theme } = useTheme();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);

  const fetchItems = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query) params.set("search", query);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/items?${params}`, { headers });

      if (!res.ok) throw new Error("Failed to load items");

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchItems(search);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [search, fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleAdd() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function handleEdit(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleDelete(item) {
    if (!confirm(`Delete item "${item.item_name}"?`)) return;

    setDeletingId(item.item_id);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/items/${item.item_id}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Delete failed");

      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchItems(search);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // Permission check for viewing the component should be done by parent or generic wrapper
  // But inside we can check for specific actions like Add/Edit/Delete

  return (
    <PanelLayout title="Items Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div
          className="rounded-t-xl px-6 py-5 bg-white border border-zinc-200"
        >
          <h2 className="text-xl font-semibold">Items Management</h2>
          <p
            className="text-sm text-zinc-500"
          >
            Manage all items in your system.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
            >
              + Add New Item
            </button>
          )}
          
          {/* If user doesn't have permission to add, we show empty div to keep layout if needed, or just search bar */}
          {!(user?.role_name === 'Admin' || hasPermission('manage_masters')) && <div />}

          <div className="relative">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 sm:w-64"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-semibold w-16">Sr No.</th>
                  <th className="px-6 py-3 font-semibold">Item Name</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan="5" className="py-8 text-center">Loading...</td></tr>
                ) : items.length === 0 && !error ? (
                  <tr><td colSpan="5" className="py-8 text-center text-zinc-400">No items found</td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="py-8 text-center text-red-600">{error}</td></tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.item_id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{index + 1}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{item.item_name}</td>
                      <td className="px-6 py-3">
                         <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-600/20'
                         }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-600' : 'bg-zinc-400'}`}></span>
                            {item.status}
                         </span>
                      </td>
                      <td className="px-6 py-3 text-zinc-500">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.item_id}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-3">
             <p className="text-xs text-zinc-500">Showing {items.length} records</p>
          </div>
        </div>
      </div>

      <ItemModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchItems(search)}
        item={editingItem}
      />
    </PanelLayout>
  );
}
