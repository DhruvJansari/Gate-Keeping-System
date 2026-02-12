"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserModal } from "@/components/UserModal";
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

function MailIcon({ className }) {
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
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function UserIcon({ className }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
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

function UsersManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const getHeaders = () => {
    const t =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchUsers = useCallback(async (query = "", role = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (role && role !== "all") params.set("role", role);
      const res = await fetch(`/api/users?${params}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(search, roleFilter), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, roleFilter, fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleAdd() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function handleEdit(u) {
    setEditingUser(u);
    setModalOpen(true);
  }

  function handleView(u) {
    setViewingUser(u);
  }

  async function handleDelete(u) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    setDeletingId(u.user_id);
    try {
      const res = await fetch(`/api/users/${u.user_id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchUsers(search, roleFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function getInitials(name, username) {
    if (name?.trim()) {
      return name
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    }
    return (username?.[0] || "?").toUpperCase();
  }

  return (
    <PanelLayout title="Users Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div className="rounded-t-xl px-6 py-5 bg-amber-600 text-white">
          <h2 className="text-xl font-semibold">Users Management</h2>
          <p className="text-sm text-amber-100">
            Manage system users and their roles
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={handleAdd}
            className="flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-700"
          >
            <UserIcon className="h-4 w-4" />
            Create New User
          </button>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 sm:w-48"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900"
            >
              <option value="all">Filter by Role: All</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border shadow-sm border-zinc-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-sm bg-zinc-800 text-white">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">USER DETAILS</th>
                  <th className="px-4 py-3">CONTACT</th>
                  <th className="px-4 py-3">ROLES</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((u, idx) => (
                    <tr
                      key={u.user_id}
                      className="border-b hover:transition-colors border-zinc-100 hover:bg-zinc-50"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold bg-amber-100 text-amber-800">
                            {getInitials(u.full_name, u.username)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">
                              {u.username}
                            </p>
                            <p className="text-xs text-zinc-500">
                              ID: {u.user_id}
                            </p>
                            <span
                              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {u.is_active ? (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                                  Active
                                </>
                              ) : (
                                "Inactive"
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-zinc-700">
                          <MailIcon className="h-4 w-4 text-zinc-400" />
                          {u.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            u.role_name === "Admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          <ShieldIcon className="h-3 w-3" />
                          {u.role_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(u)}
                            className="rounded p-2 transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(u)}
                            className="rounded p-2 transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200"
                            title="Edit User"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={
                              deletingId === u.user_id ||
                              u.user_id === user?.user_id
                            }
                            className="rounded p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-100 text-red-700 hover:bg-red-200"
                            title={
                              u.user_id === user?.user_id
                                ? "Cannot delete own account"
                                : "Delete User"
                            }
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
          {!loading && users.length > 0 && (
            <div className="border-t px-4 py-2 text-sm border-zinc-200 text-zinc-500">
              Showing 1 to {users.length} of {users.length} entries
            </div>
          )}
          {!loading && users.length === 0 && !error && (
            <p className="py-12 text-center text-sm text-zinc-500">
              No users found
            </p>
          )}
          {error && (
            <p className="py-12 text-center text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={() => fetchUsers(search, roleFilter)}
        user={editingUser}
        roles={roles}
      />

      {/* View Modal */}
      {viewingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingUser(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-xl border-zinc-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                User Details
              </h3>
              <button
                onClick={() => setViewingUser(null)}
                className="rounded p-2 transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-4 border-b pb-4 border-zinc-200">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold bg-amber-100 text-amber-800">
                {getInitials(viewingUser.full_name, viewingUser.username)}
              </div>
              <div>
                <p className="font-semibold text-zinc-900">
                  {viewingUser.username}
                </p>
                <p className="text-sm text-zinc-500">
                  ID: {viewingUser.user_id}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    viewingUser.is_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {viewingUser.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Full Name</dt>
                <dd className="text-zinc-900">
                  {viewingUser.full_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-zinc-900">{viewingUser.email}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Role</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewingUser.role_name === "Admin"
                        ? "bg-red-100 text-red-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {viewingUser.role_name}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingUser(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setViewingUser(null);
                  handleEdit(viewingUser);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-700"
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <UsersManagement />
    </ProtectedRoute>
  );
}
