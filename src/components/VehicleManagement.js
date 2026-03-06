"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PanelLayout } from "@/components/PanelLayout";
import { VehicleModal } from "@/components/VehicleModal";
import { EyeIcon, PlusIcon, TruckIcon } from "@/components/Icons";
import { ToastProvider } from "./ToastProvider";
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

export function VehicleManagement() {
  const { user, hasPermission } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debounceRef = useRef(null);
  const toast = useToast();
  const fetchVehicles = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query) params.set("search", query);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/vehicles?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load vehicles");

      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVehicles(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchVehicles]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const [isViewMode, setIsViewMode] = useState(false);

  function handleAdd() {
    setEditingVehicle(null);
    setIsViewMode(false);
    setModalOpen(true);
  }

  function handleEdit(vehicle) {
    setEditingVehicle(vehicle);
    setIsViewMode(false);
    setModalOpen(true);
  }

  async function handleDelete(vehicle) {
    if (!confirm(`Delete vehicle "${vehicle.vehicle_number}"?`)) return;

    setDeletingId(vehicle.vehicle_id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/vehicles/${vehicle.vehicle_id}`, {
        method: "DELETE",
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      fetchVehicles(search);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  // Status Toggle Handler
  // Status Toggle Handler
  async function handleToggleStatus(vehicle) {
    const originalStatus = vehicle.status;
    const newStatus = originalStatus === 'Active' ? 'Inactive' : 'Active';

    // Optimistic Update
    setVehicles(prev => prev.map(v => 
      v.vehicle_id === vehicle.vehicle_id ? { ...v, status: newStatus } : v
    ));

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      
      const res = await fetch(`/api/vehicles/${vehicle.vehicle_id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ ...vehicle, status: newStatus }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      toast.success(`Vehicle ${newStatus}`);
      // No need to refetch immediately if we trust the optimistic update, but can do it silently or later.
      // fetchVehicles(); 
    } catch (err) {
      // Revert on failure
      setVehicles(prev => prev.map(v => 
        v.vehicle_id === vehicle.vehicle_id ? { ...v, status: originalStatus } : v
      ));
      toast.error(err.message);
    }
  }

  // View Handler
  function handleView(vehicle) {
    setEditingVehicle(vehicle);
    setIsViewMode(true);
    setModalOpen(true);
  }

  return (
    <PanelLayout title="Vehicle Management" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        <div className="rounded-t-xl px-6 py-5 bg-white border border-zinc-200">
          <h2 className="text-xl font-semibold">Vehicle Management</h2>
          <p className="text-sm text-zinc-500">Manage all vehicles in your system.</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 pl-9 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {(user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('manage_masters')) && (
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              Add Vehicle
            </button>
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3 font-semibold w-16">Sr No.</th>
                  <th className="px-6 py-3 font-semibold">Vehicle No</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Owner</th>
                  {/* <th className="px-6 py-3 font-semibold">Mobile</th> */}
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan="7" className="py-8 text-center">Loading...</td></tr>
                ) : vehicles.length === 0 && !error ? (
                  <tr><td colSpan="7" className="py-8 text-center text-zinc-400">No vehicles found</td></tr>
                ) : error ? (
                  <tr><td colSpan="7" className="py-8 text-center text-red-600">{error}</td></tr>
                ) : (
                  vehicles.map((v, index) => (
                    <tr key={v.vehicle_id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-3 text-zinc-500 font-mono text-xs">{index + 1}</td>
                      <td className="px-6 py-3 font-medium text-zinc-900">{v.vehicle_number}</td>
                      <td className="px-6 py-3">{v.vehicle_type}</td>
                      <td className="px-6 py-3">{v.owner_name}</td>
                      {/* <td className="px-6 py-3">{v.mobile || '—'}</td> */}
                       <td className="px-6 py-3 text-center">
                          {/* Status Toggle Switch */}
                          {(user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('manage_masters')) && (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggleStatus(v)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                                  v.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    v.status === 'Active' ? 'translate-x-4.5' : 'translate-x-1'
                                  }`}
                                  style={{ transform: v.status === 'Active' ? 'translateX(1px)' : 'translateX(2px)' }}
                                />
                              </button>
                              <span className={`text-[10px] font-medium ${v.status === 'Active' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                {v.status}
                              </span>
                            </div>
                          )}
                       </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                              onClick={() => handleView(v)}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                              title="View Details"
                          >
                              <EyeIcon className="h-4 w-4" />
                          </button>
                          {(user?.role_name === 'Admin' || user?.role_name === 'Logistics Manager' || hasPermission('manage_masters')) && (
                            <button
                              onClick={() => handleEdit(v)}
                              className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-blue-600"
                              title="Edit"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                          )}
                          {(user?.role_name === 'Admin' || hasPermission('delete_masters')) && (
                            <button
                              onClick={() => handleDelete(v.vehicle_id)}
                              disabled={deletingId === v.vehicle_id}
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
             <p className="text-xs text-zinc-500">Showing {vehicles.length} records</p>
          </div>
        </div>
      </div>
      <VehicleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingVehicle(null);
          setIsViewMode(false);
        }}
        onSuccess={() => fetchVehicles(search)}
        vehicle={editingVehicle}
        readOnly={isViewMode}
      />
    </PanelLayout>
  );
}
