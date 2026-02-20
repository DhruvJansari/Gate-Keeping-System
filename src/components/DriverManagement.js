"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { DriverModal } from "@/components/DriverModal";
import { EyeIcon, UserIcon } from "@/components/Icons";
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

export function DriverManagement() {
  const { user, hasPermission } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const toast = useToast();
  const fetchDrivers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query) params.set("search", query);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/drivers?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load drivers");

      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDrivers(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchDrivers]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  function handleAdd() {
    setEditingDriver(null);
    setIsViewMode(false);
    setModalOpen(true);
  }

  function handleEdit(driver) {
    setEditingDriver(driver);
    setIsViewMode(false);
    setModalOpen(true);
  }

  // View Mode State
  const [isViewMode, setIsViewMode] = useState(false);

  function handleView(driver) {
      setEditingDriver(driver);
      setIsViewMode(true);
      setModalOpen(true);
  }

  // Status Toggle Handler
  async function handleToggleStatus(driver) {
    const originalStatus = driver.status;
    const newStatus = originalStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic Update
    setDrivers(prev => prev.map(d => 
      d.driver_id === driver.driver_id ? { ...d, status: newStatus } : d
    ));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      
      const res = await fetch(`/api/drivers/${driver.driver_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...driver, status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success(`Driver ${newStatus}`); 
      fetchDrivers(); 
    } catch (err) {
      // Revert
      setDrivers(prev => prev.map(d => 
        d.driver_id === driver.driver_id ? { ...d, status: originalStatus } : d
      ));
      toast.error(err.message);
      console.error(err);
    }
  }

  async function handleDelete(driver) {
    if (!confirm(`Delete driver "${driver.driver_name}"?`)) return;

    setDeletingId(driver.driver_id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/drivers/${driver.driver_id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      } 

      toast.success(`Driver deleted successfully`); 
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchDrivers(search);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PanelLayout title="Driver Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        <div className="rounded-t-xl px-6 py-5 bg-white border border-zinc-200">
          <h2 className="text-xl font-semibold">Driver Management</h2>
          <p className="text-sm text-zinc-500">Manage all drivers in your system.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className="w-fit rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 hover:bg-blue-700"
            >
              + Add New Driver
            </button>
          )}
          
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drivers..."
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
                  <th className="px-6 py-3 font-semibold">Driver Name</th>
                  <th className="px-6 py-3 font-semibold">Mobile</th>
                  <th className="px-6 py-3 font-semibold">Licence</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan="6" className="py-8 text-center">Loading...</td></tr>
                ) : drivers.length === 0 && !error ? (
                  <tr><td colSpan="6" className="py-8 text-center text-zinc-400">No drivers found</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="py-8 text-center text-red-600">{error}</td></tr>
                ) : (
                  drivers.map((d, index) => (
                    <tr key={d.driver_id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{index + 1}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{d.driver_name}</td>
                      <td className="px-6 py-3 text-zinc-600">{d.mobile}</td>
                      <td className="px-6 py-3 text-zinc-600">{d.licence || "—"}</td>
                      <td className="px-6 py-3 text-center">
                        {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(d)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                d.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  d.status === 'Active' ? 'translate-x-4.5' : 'translate-x-1'
                                }`}
                                style={{ transform: d.status === 'Active' ? 'translateX(1px)' : 'translateX(2px)' }}
                              />
                            </button>
                            <span className={`text-[10px] font-medium ${d.status === 'Active' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                {d.status}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(d)}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {(user?.role_name === 'Admin' || hasPermission('manage_masters')) && (
                            <button
                              onClick={() => handleEdit(d)}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                            <button
                              onClick={() => handleDelete(d)}
                              disabled={deletingId === d.driver_id}
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
             <p className="text-xs text-zinc-500">Showing {drivers.length} records</p>
          </div>
        </div>
      </div>
      <DriverModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDriver(null);
          setIsViewMode(false);
        }}
        onSuccess={() => fetchDrivers(search)}
        driver={editingDriver}
        readOnly={isViewMode}
      />
    </PanelLayout>
  );
}
