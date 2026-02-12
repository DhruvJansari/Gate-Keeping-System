"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { PartyModal } from "@/components/PartyModal";
import { CloseIcon, EyeIcon } from "@/components/Icons";
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

export function PartiesManagement() {
  const { user, hasPermission } = useAuth();
  const { theme } = useTheme();
  const [parties, setParties] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [viewingParty, setViewingParty] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const fetchParties = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/parties?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load parties");
      const data = await res.json();
      setParties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setParties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchParties(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchParties]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  function handleAdd() {
    setEditingParty(null);
    setModalOpen(true);
  }

  function handleEdit(party) {
    setEditingParty(party);
    setModalOpen(true);
  }

  function handleView(party) {
    setViewingParty(party);
  }

  async function handleDelete(party) {
    if (!confirm(`Delete party "${party.party_name}"?`)) return;
    setDeletingId(party.party_id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/parties/${party.party_id}`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchParties(search);
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
    <PanelLayout title="Party Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Header - Fixed with theme */}
        <div
          className={`rounded-t-xl px-6 py-5 ${
            theme === "dark"
              ? "bg-amber-700 text-white"
              : "bg-amber-600 text-white"
          }`}
        >
          <h2 className="text-xl font-semibold">Party Management</h2>
          <p
            className={`text-sm ${
              theme === "dark" ? "text-amber-200" : "text-amber-100"
            }`}
          >
            Manage all your business partners and contacts.
          </p>
        </div>

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
              + Add New Party
            </button>
          )}
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
              placeholder="Search parties..."
              className={`w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === "dark"
                  ? "border-zinc-600 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400"
              } sm:w-64`}
            />
          </div>
        </div>

        <div
          className={`overflow-hidden rounded-xl border shadow-sm ${
            theme === "dark"
              ? "border-zinc-700 bg-zinc-800"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr
                  className={`text-left text-sm ${
                    theme === "dark"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-800 text-white"
                  }`}
                >
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">PARTY DETAILS</th>
                  <th className="px-4 py-3">CONTACT INFO</th>
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
                  parties.map((party, idx) => (
                    <tr
                      key={party.party_id}
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              theme === "dark"
                                ? "bg-amber-900/50 text-amber-300"
                                : "bg-amber-100 text-amber-800"
                            } text-sm font-semibold`}
                          >
                            {getInitials(party.party_name)}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-zinc-100"
                                  : "text-zinc-900"
                              }`}
                            >
                              {party.party_name}
                            </p>
                            <p
                              className={`text-xs ${
                                theme === "dark"
                                  ? "text-zinc-400"
                                  : "text-zinc-500"
                              }`}
                            >
                              ID: PM{String(party.party_id).padStart(4, "0")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 text-sm">
                          {party.email && (
                            <p
                              className={
                                theme === "dark"
                                  ? "text-zinc-300"
                                  : "text-zinc-700"
                              }
                            >
                              {party.email}
                            </p>
                          )}
                          {party.contact_phone && (
                            <p
                              className={
                                theme === "dark"
                                  ? "text-zinc-300"
                                  : "text-zinc-700"
                              }
                            >
                              {party.contact_phone}
                            </p>
                          )}
                          {!party.email && !party.contact_phone && (
                            <span
                              className={
                                theme === "dark"
                                  ? "text-zinc-500"
                                  : "text-zinc-400"
                              }
                            >
                              —
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            party.status === "Active"
                              ? theme === "dark"
                                ? "bg-emerald-900/50 text-emerald-400"
                                : "bg-emerald-100 text-emerald-700"
                              : theme === "dark"
                              ? "bg-zinc-700 text-zinc-400"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {party.status === "Active" ? (
                            <>
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  theme === "dark"
                                    ? "bg-emerald-400"
                                    : "bg-emerald-500"
                                }`}
                              />{" "}
                              Active
                            </>
                          ) : (
                            <>Inactive</>
                          )}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        {formatDate(party.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(party)}
                            className={`rounded p-1.5 transition-colors ${
                              theme === "dark"
                                ? "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                          <button
                            onClick={() => handleEdit(party)}
                            className={`rounded p-1.5 transition-colors ${
                              theme === "dark"
                                ? "bg-blue-900/50 text-blue-400 hover:bg-blue-900"
                                : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                            }`}
                            title="Edit"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                          <button
                            onClick={() => handleDelete(party)}
                            disabled={deletingId === party.party_id}
                            className={`rounded p-1.5 transition-colors disabled:opacity-50 ${
                              theme === "dark"
                                ? "bg-red-900/50 text-red-400 hover:bg-red-900"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
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
          {!loading && parties.length > 0 && (
            <div
              className={`border-t px-4 py-2 text-sm ${
                theme === "dark"
                  ? "border-zinc-700 text-zinc-400"
                  : "border-zinc-200 text-zinc-500"
              }`}
            >
              Showing {parties.length} parties
            </div>
          )}
          {!loading && parties.length === 0 && !error && (
            <p
              className={`py-12 text-center text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              No parties found
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

      <PartyModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingParty(null);
        }}
        onSuccess={() => fetchParties(search)}
        party={editingParty}
      />

      {viewingParty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingParty(null)}
        >
          <div
            className={`w-full max-w-lg rounded-xl border p-6 shadow-xl ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-800"
                : "border-zinc-200 bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                }`}
              >
                Party Details
              </h3>
              <button
                onClick={() => setViewingParty(null)}
                className={`rounded p-2 hover:transition-colors ${
                  theme === "dark"
                    ? "hover:bg-zinc-700 text-zinc-400"
                    : "hover:bg-zinc-100 text-zinc-600"
                }`}
                aria-label="Close"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div
              className={`flex items-center gap-4 border-b pb-4 ${
                theme === "dark" ? "border-zinc-700" : "border-zinc-200"
              }`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                  theme === "dark"
                    ? "bg-amber-900/50 text-amber-300"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {getInitials(viewingParty.party_name)}
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }`}
                >
                  {viewingParty.party_name}
                </p>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  ID: PM{String(viewingParty.party_id).padStart(4, "0")}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  Status
                </dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewingParty.status === "Active"
                        ? theme === "dark"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : "bg-emerald-100 text-emerald-700"
                        : theme === "dark"
                        ? "bg-zinc-700 text-zinc-400"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {viewingParty.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  Email
                </dt>
                <dd
                  className={
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }
                >
                  {viewingParty.email || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  Phone
                </dt>
                <dd
                  className={
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }
                >
                  {viewingParty.contact_phone || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  GST No
                </dt>
                <dd
                  className={
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }
                >
                  {viewingParty.gst_no || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  Address
                </dt>
                <dd
                  className={`whitespace-pre-wrap ${
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }`}
                >
                  {viewingParty.address || "—"}
                </dd>
              </div>
              <div>
                <dt
                  className={
                    theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                  }
                >
                  Created
                </dt>
                <dd
                  className={
                    theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                  }
                >
                  {formatDate(viewingParty.created_at)}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setViewingParty(null)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Close
              </button>
              {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                <button
                  onClick={() => {
                    setViewingParty(null);
                    handleEdit(viewingParty);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                    theme === "dark"
                      ? "bg-amber-700 hover:bg-amber-800"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  Edit Party
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
