"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ClipboardIcon, CloseIcon, CubeIcon } from "@/components/Icons";

export function ItemModal({ open, onClose, onSuccess, item }) {
  const isEdit = !!item;

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateItemName = (value) => {
    if (!value.trim()) return "Item name is required";
    if (value.trim().length < 3) return "Item name must be at least 3 characters";
    return "";
  };

  useEffect(() => {
    if (open) {
      setItemName(item?.item_name || "");
      setDescription(item?.description || "");
      setStatus(item?.status || "Active");
      setError("");
      setFieldErrors({});
    }
  }, [open, item]);

  const handleFieldChange = (setter, field, value) => {
      setter(value);
      if (fieldErrors[field]) {
          setFieldErrors(prev => ({ ...prev, [field]: "" }));
      }
  };

  const handleBlur = (field, value) => {
      let err = "";
      if (field === "item_name") err = validateItemName(value);
      if (err) setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const nameError = validateItemName(itemName);
    if (nameError) {
        setFieldErrors({ item_name: nameError });
        return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/items/${item.item_id}` : "/api/items";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemName.trim(),
          description: description.trim(),
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(isEdit ? "Item updated successfully" : "Item created successfully");
      window.dispatchEvent(new Event("sidebar-counts-refresh"));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save item");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-white px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-blue-600 shadow-sm">
                <CubeIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">{isEdit ? "Edit Item" : "Add New Item"}</h2>
                <p className="text-sm text-zinc-500 font-medium">Manage inventory items</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Item Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => handleFieldChange(setItemName, "item_name", e.target.value)}
              onBlur={() => handleBlur("item_name", itemName)}
              placeholder="e.g. Iron Ore, Coal, etc."
              className={`w-full rounded-xl border-2 px-4 py-3 text-zinc-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium ${
                fieldErrors.item_name ? 'border-red-100 bg-red-50 focus:border-red-500' : 'border-zinc-100 bg-zinc-50 focus:border-blue-500'
              }`}
            />
            {fieldErrors.item_name && <p className="text-xs font-bold text-red-500 ml-1">{fieldErrors.item_name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the item..."
              rows={3}
              className="w-full rounded-xl border-2 border-zinc-100 bg-zinc-50 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 ml-1">Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("Active")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  status === "Active"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${status === "Active" ? "bg-blue-600" : "bg-zinc-400"}`} />
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus("Inactive")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                  status === "Inactive"
                    ? "border-zinc-500 bg-zinc-100 text-zinc-700"
                    : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${status === "Inactive" ? "bg-zinc-600" : "bg-zinc-400"}`} />
                Inactive
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border-2 border-zinc-100 px-4 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50">
              {loading ? (
                 <div className="flex items-center justify-center gap-2">
                   <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                   Saving...
                 </div>
              ) : isEdit ? "Update Item" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
