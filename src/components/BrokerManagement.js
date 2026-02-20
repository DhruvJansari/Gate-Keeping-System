"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { BrokerModal } from "@/components/BrokerModal";
import { EyeIcon, UsersIcon } from "@/components/Icons";
import { useToast } from "@/hooks/useToast";

function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function BrokerManagement() {
  const { user, hasPermission } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  const debounceRef = useRef(null);

  const fetchBrokers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query) params.set("search", query);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/brokers?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load brokers");

      const data = await res.json();
      setBrokers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBrokers(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchBrokers]);

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  function handleAdd() {
    setEditingBroker(null);
    setIsViewMode(false);
    setModalOpen(true);
  }

  function handleEdit(broker) {
    setEditingBroker(broker);
    setIsViewMode(false);
    setModalOpen(true);
  }

  // View Mode
  const [isViewMode, setIsViewMode] = useState(false);

  function handleView(broker) {
      setEditingBroker(broker);
      setIsViewMode(true);
      setModalOpen(true);
  }

  // Status Toggle
  async function handleToggleStatus(broker) {
    const originalStatus = broker.status;
    const newStatus = originalStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic Update
    setBrokers(prev => prev.map(b => 
      b.broker_id === broker.broker_id ? { ...b, status: newStatus } : b
    ));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      
      const res = await fetch(`/api/brokers/${broker.broker_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...broker, status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Broker ${newStatus}`); 
      fetchBrokers(); 
    } catch (err) {
      // Revert
      setBrokers(prev => prev.map(b => 
        b.broker_id === broker.broker_id ? { ...b, status: originalStatus } : b
      ));
      toast.error(err.message);
      console.error(err);
    }
  }

  async function handleDelete(broker) {
    if (!confirm(`Delete broker "${broker.broker_name}"?`)) return;

    setDeletingId(broker.broker_id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/brokers/${broker.broker_id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      toast.success(`Broker deleted successfully`); 
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchBrokers(search);
    } catch (err) {
      toast.error(err.message);
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
    <PanelLayout title="Broker Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        <div className="rounded-t-xl px-6 py-5 bg-white border border-zinc-200">
          <h2 className="text-xl font-semibold">Broker Management</h2>
          <p className="text-sm text-zinc-500">Manage all brokers in your system.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
            >
              + Add New Broker
            </button>
          )}
          
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brokers..."
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 sm:w-64"
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-semibold w-16">Sr No.</th>
                  <th className="px-6 py-3 font-semibold">Broker Details</th>
                  <th className="px-6 py-3 font-semibold">Contact Info</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan="6" className="py-8 text-center">Loading...</td></tr>
                ) : brokers.length === 0 && !error ? (
                  <tr><td colSpan="6" className="py-8 text-center text-zinc-400">No brokers found</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="py-8 text-center text-red-600">{error}</td></tr>
                ) : (
                  brokers.map((b, index) => (
                    <tr key={b.broker_id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{index + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                            {getInitials(b.broker_name)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">{b.broker_name}</p>
                            <p className="text-xs text-zinc-500">ID: BR{String(b.broker_id).padStart(4, "0")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-1 text-sm">
                          {b.email && <p className="text-zinc-700">{b.email}</p>}
                          {b.mobile && <p className="text-zinc-700">{b.mobile}</p>}
                          {!b.email && !b.mobile && <span className="text-zinc-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            b.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
                          {b.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-zinc-500">{formatDate(b.created_at)}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(b)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                            <button
                              onClick={() => handleEdit(b)}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                            <button
                              onClick={() => handleDelete(b)}
                              disabled={deletingId === b.broker_id}
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
             <p className="text-xs text-zinc-500">Showing {brokers.length} records</p>
          </div>
        </div>
      </div>
      <BrokerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBroker(null);
          setIsViewMode(false);
        }}
        onSuccess={() => fetchBrokers(search)}
        broker={editingBroker}
        readOnly={isViewMode}
      />
    </PanelLayout>
  );
}
