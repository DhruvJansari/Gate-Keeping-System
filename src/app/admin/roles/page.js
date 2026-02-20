"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PanelLayout } from "@/components/PanelLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleModal } from "@/components/RoleModal";
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

function ShieldIcon({ className }) {
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
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  function getHeaders() {
    const t =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  const fetchRoles = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      params.set("withPermissions", "true");
      const res = await fetch(`/api/roles?${params}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/permissions", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to load permissions");
      const data = await res.json();
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRoles(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchRoles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  async function fetchRoleWithPermissions(roleId) {
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load role");
      return await res.json();
    } catch {
      return null;
    }
  }

  function handleAdd() {
    setEditingRole(null);
    setModalOpen(true);
  }

  async function handleEdit(role) {
    const full = await fetchRoleWithPermissions(role.role_id);
    setEditingRole(full || role);
    setModalOpen(true);
  }

  function handleView(role) {
    setViewingRole(role);
  }

  async function handleDelete(role) {
    if (
      !confirm(
        `Delete role "${role.name}"? Users with this role will need to be reassigned first.`
      )
    )
      return;
    setDeletingId(role.role_id);
    try {
      const res = await fetch(`/api/roles/${role.role_id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      fetchRoles(search);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    const now = new Date();
    const diff = now - dt;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days < 30) return `Created ${days} day${days !== 1 ? "s" : ""} ago`;
    if (days < 365) return `Created ${Math.floor(days / 30)} months ago`;
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <PanelLayout title="Roles Management" roleName="Admin">
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-t-xl px-6 py-5 bg-white border border-zinc-200">
          <div>
            <h2 className="text-xl font-semibold">Roles Management</h2>
            <p className="text-sm text-zinc-500">
              Manage user roles and permissions
            </p>
          </div>
          <span className="rounded-lg px-3 py-1 text-sm font-medium bg-zinc-500/30">
            {roles.length} Roles
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={handleAdd}             
            className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-zinc-600 hover:bg-zinc-700"
          >
            + Create New Role
          </button>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
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
                  <th className="px-4 py-3">ROLE DETAILS</th>
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
                  roles.map((r, idx) => (
                    <tr
                      key={r.role_id}
                      className="border-b hover:transition-colors border-zinc-100 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                            <ShieldIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {r.name}
                            </p>
                            <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-800">
                              {r.permission_count ?? 0} Permissions
                            </span>
                            <p className="mt-1 text-xs text-zinc-500">
                              {formatDate(r.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(r)}
                            className="rounded p-2 transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(r)}
                            className="rounded p-2 transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            title="Edit Role"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={deletingId === r.role_id}
                            className="rounded p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-100 text-red-700 hover:bg-red-200"
                            title="Delete Role"
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
          {!loading && roles.length > 0 && (
            <div className="border-t px-4 py-2 text-sm border-zinc-200 text-zinc-500">
              Showing 1 to {roles.length} of {roles.length} entries
            </div>
          )}
          {!loading && roles.length === 0 && !error && (
            <p className="py-12 text-center text-sm text-zinc-500">
              No roles found
            </p>
          )}
          {error && (
            <p className="py-12 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      <RoleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingRole(null);
        }}
        onSuccess={() => fetchRoles(search)}
        role={editingRole}
        permissions={permissions}
      />

      {/* View Modal */}
      {viewingRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingRole(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl border-zinc-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                Role Details
              </h3>
              <button
                onClick={() => setViewingRole(null)}
                className="rounded p-2 transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">
                  {viewingRole.name}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Description</dt>
                <dd className="text-zinc-900">
                  {viewingRole.description || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Permissions</dt>
                <dd className="text-zinc-900">
                  {viewingRole.permission_count ?? 0} assigned
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="text-zinc-900">
                  {formatDate(viewingRole.created_at)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingRole(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewingRole(null);
                  handleEdit(viewingRole);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
              >
                Edit Role
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default function RolesPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <RolesManagement />
    </ProtectedRoute>
  );
}
