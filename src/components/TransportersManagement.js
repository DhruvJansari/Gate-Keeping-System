"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { TransporterModal } from "@/components/TransporterModal";
// import { useTheme } from "@/context/ThemeContext";

// Icons for consistent dark mode support
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

function TruckIcon({ className }) {
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
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
      />
    </svg>
  );
}

function PhoneIcon({ className }) {
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
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
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

function EyeIcon({ className }) {
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
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
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

export function TransportersManagement() {
  const { user, hasPermission } = useAuth();
  // const { theme } = useTheme(); 
  const [transporters, setTransporters] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState(null);
  const [viewingTransporter, setViewingTransporter] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const fetchTransporters = useCallback(async (query = "", status = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (status && status !== "all") params.set("status", status);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/transporters?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load transporters");
      const data = await res.json();
      setTransporters(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setTransporters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchTransporters(search, statusFilter),
      300
    );
    return () => clearTimeout(debounceRef.current);
  }, [search, statusFilter, fetchTransporters]);

  useEffect(() => {
    fetchTransporters();
  }, [fetchTransporters]);

  function handleAdd() {
    setEditingTransporter(null);
    setModalOpen(true);
  }

  function handleEdit(t) {
    setEditingTransporter(t);
    setModalOpen(true);
  }

  function handleView(t) {
    setViewingTransporter(t);
  }

  async function handleDelete(t) {
    if (!confirm(`Delete transporter "${t.name}"?`)) return;
    setDeletingId(t.transporter_id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/transporters/${t.transporter_id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchTransporters(search, statusFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function getInitials(name) {
    if (!name?.trim()) return "?";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function formatDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <PanelLayout title="Transporters Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div
          className="rounded-t-xl px-6 py-5 bg-amber-600 text-white"
        >
          <h2 className="text-xl font-semibold">Transporters Management</h2>
          <p
            className="text-sm text-amber-100"
          >
            Manage all your logistics partners and carriers
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-700"
            >
              + Add New Transporter
            </button>
          )}
          {!(user?.role_name === 'Admin' || hasPermission('manage_masters')) && <div />}
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transporters..."
                className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 sm:w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900"
            >
              <option value="all">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-hidden rounded-xl border shadow-sm border-zinc-200 bg-white"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr
                  className="text-left text-sm bg-zinc-800 text-white"
                >
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">TRANSPORTER DETAILS</th>
                  <th className="px-4 py-3">CONTACT INFORMATION</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">CREATED</th>
                  <th className="px-4 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div
                        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
                      />
                    </td>
                  </tr>
                )}
                {!loading &&
                  transporters.map((t, idx) => (
                    <tr
                      key={t.transporter_id}
                      className="border-b hover:transition-colors border-zinc-100 hover:bg-zinc-50"
                    >
                      <td
                        className="px-4 py-3 text-sm text-zinc-600"
                      >
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold bg-amber-100 text-amber-800"
                          >
                            {getInitials(t.name)}
                          </div>
                          <div>
                            <p
                              className="font-medium text-zinc-900"
                            >
                              {t.name}
                            </p>
                            {t.service_type && (
                              <p
                                className="flex items-center gap-1 text-xs text-zinc-500"
                              >
                                <TruckIcon className="h-3 w-3" />{" "}
                                {t.service_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          {t.contact_person && (
                            <p
                              className="text-zinc-700"
                            >
                              {t.contact_person}
                            </p>
                          )}
                          {t.contact_phone && (
                            <p
                              className="flex items-center gap-2 text-zinc-700"
                            >
                              <PhoneIcon
                                className="h-3 w-3 text-zinc-400"
                              />
                              {t.contact_phone}
                            </p>
                          )}
                          {t.email && (
                            <p
                              className="flex items-center gap-2 text-zinc-700"
                            >
                              <MailIcon
                                className="h-3 w-3 text-zinc-400"
                              />
                              {t.email}
                            </p>
                          )}
                          {!t.contact_person &&
                            !t.contact_phone &&
                            !t.email && (
                              <span
                                className="text-zinc-400"
                              >
                                —
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            t.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {t.status === "Active" ? (
                            <>
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                              />
                              Active
                            </>
                          ) : (
                            <>Inactive</>
                          )}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-zinc-600"
                      >
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(t)}
                            className="rounded p-1.5 transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                          <button
                            onClick={() => handleEdit(t)}
                            className="rounded p-1.5 transition-colors bg-blue-100 text-blue-600 hover:bg-blue-200"
                            title="Edit"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                          <button
                            onClick={() => handleDelete(t)}
                            disabled={deletingId === t.transporter_id}
                            className="rounded p-1.5 transition-colors disabled:opacity-50 bg-red-100 text-red-600 hover:bg-red-200"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!loading && transporters.length > 0 && (
            <div
              className="border-t px-4 py-2 text-sm border-zinc-200 text-zinc-500"
            >
              Showing {transporters.length} transporters
            </div>
          )}
          {!loading && transporters.length === 0 && !error && (
            <p
              className="py-12 text-center text-sm text-zinc-500"
            >
              No transporters found
            </p>
          )}
          {error && (
            <p
              className="py-12 text-center text-sm text-red-600"
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <TransporterModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTransporter(null);
        }}
        onSuccess={() => fetchTransporters(search, statusFilter)}
        transporter={editingTransporter}
      />

      {/* View Modal */}
      {viewingTransporter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingTransporter(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border p-6 shadow-xl border-zinc-200 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                className="text-lg font-semibold text-zinc-900"
              >
                Transporter Details
              </h3>
              <button
                onClick={() => setViewingTransporter(null)}
                className="rounded p-2 transition-colors text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div
              className="flex items-center gap-4 border-b pb-4 border-zinc-200"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold bg-amber-100 text-amber-800"
              >
                {getInitials(viewingTransporter.name)}
              </div>
              <div>
                <p
                  className="font-semibold text-zinc-900"
                >
                  {viewingTransporter.name}
                </p>
                {viewingTransporter.service_type && (
                  <p
                    className="flex items-center gap-1 text-sm text-zinc-500"
                  >
                    <TruckIcon className="h-3 w-3" />{" "}
                    {viewingTransporter.service_type}
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Status
                </dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewingTransporter.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {viewingTransporter.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Contact Person
                </dt>
                <dd
                  className="text-zinc-900"
                >
                  {viewingTransporter.contact_person || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Phone
                </dt>
                <dd
                  className="text-zinc-900"
                >
                  {viewingTransporter.contact_phone || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Email
                </dt>
                <dd
                  className="text-zinc-900"
                >
                  {viewingTransporter.email || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Notes
                </dt>
                <dd
                  className="whitespace-pre-wrap text-zinc-900"
                >
                  {viewingTransporter.notes || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className="text-zinc-500"
                >
                  Created
                </dt>
                <dd
                  className="text-zinc-900"
                >
                  {formatDate(viewingTransporter.created_at)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingTransporter(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                <button
                  onClick={() => {
                    setViewingTransporter(null);
                    handleEdit(viewingTransporter);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-amber-600 hover:bg-amber-700"
                >
                  Edit Transporter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
