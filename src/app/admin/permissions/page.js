"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PanelLayout } from "@/components/PanelLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionModal } from "@/components/PermissionModal";
import { EyeIcon, EditIcon, DeleteIcon } from "@/components/Icons";

// Icons for consistent dark mode
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

function KeyIcon({ className }) {
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
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  );
}

function PermissionsManagement() {
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [viewingPermission, setViewingPermission] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  function getHeaders() {
    const t =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  const fetchPermissions = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      const res = await fetch(`/api/permissions?${params}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load permissions");
      const data = await res.json();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPermissions(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchPermissions]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  function handleAdd() {
    setEditingPermission(null);
    setModalOpen(true);
  }

  function handleEdit(p) {
    setEditingPermission(p);
    setModalOpen(true);
  }

  function handleView(p) {
    setViewingPermission(p);
  }

  async function handleDelete(p) {
    if (!confirm(`Delete permission "${p.code}"?`)) return;
    setDeletingId(p.permission_id);
    try {
      const res = await fetch(`/api/permissions/${p.permission_id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchPermissions(search);
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

  return (
    <PanelLayout title="Permissions Management" roleName="Admin">
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div className="rounded-t-xl px-6 py-5 bg-white border border-zinc-200">
          <h2 className="text-xl font-semibold">Permissions Management</h2>
          <p className="text-sm text-zinc-500">
            Manage system permissions and access controls
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={handleAdd}
            className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-zinc-600 hover:bg-zinc-700"
          >
            <KeyIcon className="h-4 w-4" />
            Create New Permission
          </button>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions..."
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 sm:w-56"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border shadow-sm border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm bg-zinc-800 text-white">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">PERMISSION DETAILS</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                    </td>
                  </tr>
                )}
                {!loading &&
                  permissions.map((p, idx) => (
                    <tr
                      key={p.permission_id}
                      className="border-b hover:transition-colors border-zinc-100 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <KeyIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {p.code}
                            </p>
                            <p className="text-xs text-zinc-500">
                              ID: {p.permission_id}
                            </p>
                            <p className="text-xs text-zinc-500">
                              Created {formatDate(p.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(p)}
                            className="rounded p-2 transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(p)}
                            className="rounded p-2 transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            title="Edit Permission"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={deletingId === p.permission_id}
                            className="rounded p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-100 text-red-700 hover:bg-red-200"
                            title="Delete Permission"
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && permissions.length > 0 && (
            <div className="border-t px-4 py-2 text-sm border-zinc-200 text-zinc-500">
              Showing 1 to {permissions.length} of {permissions.length} entries
            </div>
          )}
          {!loading && permissions.length === 0 && !error && (
            <p className="py-12 text-center text-sm text-zinc-500">
              No permissions found
            </p>
          )}
          {error && (
            <p className="py-12 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      <PermissionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPermission(null);
        }}
        onSuccess={() => fetchPermissions(search)}
        permission={editingPermission}
      />

      {/* View Modal */}
      {viewingPermission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingPermission(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl border-zinc-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                Permission Details
              </h3>
              <button
                onClick={() => setViewingPermission(null)}
                className="rounded p-2 transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Code</dt>
                <dd className="font-medium text-zinc-900">
                  {viewingPermission.code}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="text-zinc-900">
                  {viewingPermission.name}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">ID</dt>
                <dd className="text-zinc-900">
                  {viewingPermission.permission_id}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="text-zinc-900">
                  {formatDate(viewingPermission.created_at)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingPermission(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewingPermission(null);
                  handleEdit(viewingPermission);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
              >
                Edit Permission
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default function PermissionsPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <PermissionsManagement />
    </ProtectedRoute>
  );
}
