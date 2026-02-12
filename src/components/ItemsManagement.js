"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ItemModal } from "@/components/ItemModal";
import { ClipboardIcon } from "@/components/Icons";
import { useTheme } from "@/context/ThemeContext";

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
  const { theme } = useTheme();

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
          className={`rounded-t-xl px-6 py-5 ${
            theme === "dark"
              ? "bg-amber-700 text-white"
              : "bg-amber-600 text-white"
          }`}
        >
          <h2 className="text-xl font-semibold">Items Management</h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-amber-200" : "text-amber-100"
            }`}
          >
            Manage all items in your system.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className={`w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                theme === "dark"
                  ? "bg-amber-700 hover:bg-amber-800"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              + Add New Item
            </button>
          )}
          
          {/* If user doesn't have permission to add, we show empty div to keep layout if needed, or just search bar */}
          {!(user?.role_name === 'Admin' || hasPermission('manage_masters')) && <div />}

          <div className="relative">
            <SearchIcon
              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                theme === "dark" ? "text-zinc-500" : "text-zinc-400"
              }`}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className={`w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
              } sm:w-64`}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className={`overflow-hidden rounded-xl border shadow-sm ${
            theme === "dark"
              ? "border-zinc-700 bg-zinc-800"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr
                  className={`text-left text-sm ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">NAME</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">CREATED</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div
                        className={`mx-auto h-8 w-8 animate-spin rounded-full border-2 ${
                          theme === "dark"
                            ? "border-zinc-600 border-t-zinc-400"
                            : "border-zinc-300 border-t-zinc-700"
                        }`}
                      />
                    </td>
                  </tr>
                )}

                {!loading &&
                  items.map((item, idx) => (
                    <tr
                      key={item.item_id}
                      className={`border-b hover:transition-colors ${
                        theme === "dark"
                          ? "border-zinc-700 hover:bg-zinc-700/50"
                          : "border-zinc-100 hover:bg-zinc-50"
                      }`}
                    >
                      <td
                        className={`px-4 py-3 text-sm ${
                          theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {idx + 1}
                      </td>

                      <td className="px-4 py-3 flex items-center gap-2">
                        <ClipboardIcon
                          className={`h-4 w-4 ${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                          }`}
                        />
                        <span
                          className={
                            theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                          }
                        >
                          {item.item_name}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === "Active"
                              ? theme === "dark"
                                ? "bg-emerald-900/50 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"
                              : theme === "dark"
                              ? "bg-zinc-700 text-zinc-400"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td
                        className={`px-4 py-3 text-sm ${
                          theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-4 py-3 flex gap-2">
                        {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                          <button
                            onClick={() => handleEdit(item)}
                            className={`rounded p-1.5 transition-colors ${
                              theme === "dark"
                                ? "bg-blue-900/50 text-blue-400 hover:bg-blue-900"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                        )}

                        {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.item_id}
                            className={`rounded p-1.5 transition-colors disabled:opacity-50 ${
                              theme === "dark"
                                ? "bg-red-900/50 text-red-400 hover:bg-red-900"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!loading && items.length > 0 && (
            <div
              className={`border-t px-4 py-2 text-sm ${
                theme === "dark"
                  ? "border-zinc-700 text-zinc-400"
                  : "border-zinc-200 text-zinc-500"
              }`}
            >
              Showing {items.length} items
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <p
              className={`py-12 text-center text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              No items found
            </p>
          )}

          {error && (
            <p
              className={`py-12 text-center text-sm ${
                theme === "dark" ? "text-red-400" : "text-red-600"
              }`}
            >
              {error}
            </p>
          )}
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
