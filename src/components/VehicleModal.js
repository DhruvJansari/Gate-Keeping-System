"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { TruckIcon, CloseIcon } from "@/components/Icons";

export function VehicleModal({ open, onClose, onSuccess, vehicle, readOnly }) {
  const isEdit = !!vehicle;
  const isView = !!readOnly;

  // Fields
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState(""); // Changed from "Truck"
  const [ownerName, setOwnerName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [fitnessExpiry, setFitnessExpiry] = useState("");
  const [permitExpiry, setPermitExpiry] = useState("");
  const [pucExpiry, setPucExpiry] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateVehicleNumber = (value) => {
    if (!value.trim()) return "Vehicle number is required";
    // Regex for Indian Vehicle No (e.g., MH01AB1234, GJ 01 A 1234) - flexible for spacing
    const pattern = /^[A-Z]{2}\s*\d{1,2}\s*[A-Z]{0,3}\s*\d{4}$/i;
    // Removing spaces for easier check can be done, but let's allow user flexibility or enforce format?
    // Let's enforce uppercase and allow spaces but validate pattern
    if (!pattern.test(value.trim())) return "Invalid vehicle number (e.g. MH01AB1234)";
    return "";
  };

  const validateRequired = (value, label) => {
    if (!value.trim()) return `${label} is required`;
    return "";
  };

  useEffect(() => {
    if (open) {
      if (vehicle) {
        setVehicleNumber(vehicle.vehicle_number || "");
        setVehicleType(vehicle.vehicle_type || "Truck");
        setOwnerName(vehicle.owner_name || "");
        setRcNumber(vehicle.rc_number || "");
        setChassisNumber(vehicle.chassis_number || "");
        setInsuranceExpiry(vehicle.insurance_expiry ? vehicle.insurance_expiry.split('T')[0] : "");
        setFitnessExpiry(vehicle.fitness_expiry ? vehicle.fitness_expiry.split('T')[0] : "");
        setPermitExpiry(vehicle.permit_expiry ? vehicle.permit_expiry.split('T')[0] : "");
        setPucExpiry(vehicle.puc_expiry ? vehicle.puc_expiry.split('T')[0] : "");
        setStatus(vehicle.status || "Active");
      } else {
        setVehicleNumber("");
        setVehicleType("Truck");
        setOwnerName("");
        setRcNumber("");
        setChassisNumber("");
        setInsuranceExpiry("");
        setFitnessExpiry("");
        setPermitExpiry("");
        setPucExpiry("");
        setStatus("Active");
      }
      setError("");
      setFieldErrors({});
    }
  }, [open, vehicle]);

  const handleFieldChange = (setter, field, value) => {
      setter(value);
      if (fieldErrors[field]) {
          setFieldErrors(prev => ({ ...prev, [field]: "" }));
      }
  };

  const handleBlur = (field, value) => {
      let err = "";
      switch (field) {
          case "vehicle_number": err = validateVehicleNumber(value); break;
          case "vehicle_type": err = validateRequired(value, "Vehicle Type"); break;
          case "owner_name": err = validateRequired(value, "Owner Name"); break;
          default: break;
      }
      if (err) setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const errors = {};
    let err = "";

    err = validateVehicleNumber(vehicleNumber);
    if (err) errors.vehicle_number = err;

    err = validateRequired(vehicleType, "Vehicle Type");
    if (err) errors.vehicle_type = err;

    err = validateRequired(ownerName, "Owner Name");
    if (err) errors.owner_name = err;

    if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/vehicles/${vehicle.vehicle_id}` : "/api/vehicles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_number: vehicleNumber.trim().toUpperCase().replace(/\s+/g, ''), // Clean spaces
          vehicle_type: vehicleType.trim(),
          owner_name: ownerName.trim(),
          rc_number: rcNumber.trim(),
          chassis_number: chassisNumber.trim(),
          insurance_expiry: insuranceExpiry || null,
          fitness_expiry: fitnessExpiry || null,
          permit_expiry: permitExpiry || null,
          puc_expiry: pucExpiry || null,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(isEdit ? "Vehicle updated successfully" : "Vehicle created successfully");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save vehicle");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-white px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-blue-600 shadow-sm">
                <TruckIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">{isEdit ? "Edit Vehicle" : "Add Vehicle"}</h2>
                <p className="text-sm text-zinc-500 font-medium">Manage fleet details</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Vehicle Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => handleFieldChange(setVehicleNumber, "vehicle_number", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("vehicle_number", vehicleNumber)}
              placeholder="e.g. MH01AB1234"
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium uppercase ${
                  fieldErrors.vehicle_number ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
            {fieldErrors.vehicle_number && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.vehicle_number}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Vehicle Type <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={vehicleType}
              onChange={(e) => handleFieldChange(setVehicleType, "vehicle_type", e.target.value)}
              onBlur={() => handleBlur("vehicle_type", vehicleType)}
              placeholder="e.g. Truck, Trailer, Tanker"
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                 fieldErrors.vehicle_type ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
            {fieldErrors.vehicle_type && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.vehicle_type}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Owner Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => handleFieldChange(setOwnerName, "owner_name", e.target.value)}
              onBlur={() => handleBlur("owner_name", ownerName)}
              placeholder="Full name of owner"
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                 fieldErrors.owner_name ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
             {fieldErrors.owner_name && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.owner_name}</p>}
          </div>


          <div className="space-y-1.5">
             <label className="text-sm font-bold text-zinc-700 ml-1">Status</label>
              <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">RC Number</label>
            <input
              type="text"
              value={rcNumber}
              onChange={(e) => setRcNumber(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Chassis Number</label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Insurance Expiry</label>
            <input
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Fitness Expiry</label>
            <input
              type="date"
              value={fitnessExpiry}
              onChange={(e) => setFitnessExpiry(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Permit Expiry</label>
            <input
              type="date"
              value={permitExpiry}
              onChange={(e) => setPermitExpiry(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">PUC Expiry</label>
            <input
              type="date"
              value={pucExpiry}
              onChange={(e) => setPucExpiry(e.target.value)}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 flex gap-4 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
