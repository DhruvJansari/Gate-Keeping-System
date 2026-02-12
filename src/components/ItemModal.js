"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ClipboardIcon, CloseIcon } from "@/components/Icons";

export function ItemModal({ open, onClose, onSuccess, item }) {
  const isEdit = !!item;

  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================
     PREFILL ON EDIT
  ============================ */
  useEffect(() => {
    if (open) {
      setItemName(item?.item_name || "");
      setDescription(item?.description || "");
      setStatus(item?.status || "Active");
      setError("");
    }
  }, [open, item]);

  /* ============================
     SUBMIT CREATE / UPDATE
  ============================ */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit ? `/api/items/${item.item_id}` : "/api/items";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemName,
          description,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="rounded-t-xl bg-amber-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-white/20 text-white">
                <ClipboardIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isEdit ? "Edit Item" : "Add Item"}
                </h2>
                <p className="text-sm text-amber-100">
                  {isEdit
                    ? "Update item details"
                    : "Add a new item to your inventory"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter item description"
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
