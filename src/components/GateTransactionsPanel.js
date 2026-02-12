'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PanelLayout } from '@/components/PanelLayout';
import { NewGateEntryModal } from '@/components/NewGateEntryModal';
import { GateTransactionDetailModal } from '@/components/GateTransactionDetailModal';
import { useGatePassPrint } from '@/components/GatePassPrint';
import { STAGES, getStageStatus } from '@/lib/stageUtils';
import { TruckIcon, ClockIcon, DownloadIcon, EyeIcon } from '@/components/Icons';

function StageBadge({ completed }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        completed
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-zinc-100 text-zinc-500'
      }`}
    >
      {completed ? (
        <>
          <TruckIcon className="h-3.5 w-3.5" /> Completed
        </>
      ) : (
        <>
          <ClockIcon className="h-3.5 w-3.5" /> Pending
        </>
      )}
    </span>
  );
}

export function GateTransactionsPanel() {
  const { user, hasPermission } = useAuth();
  const { printGatePass } = useGatePassPrint();
  const [transactions, setTransactions] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailTxn, setDetailTxn] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = useCallback(async () => {
    const from = dateFrom || undefined;
    const to = dateTo || undefined;
    const type = filterType !== 'all' ? filterType : undefined;

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (type) params.set('type', type);

    try {
      setLoading(true);
      setError("");
      // Ensure strict check for token if required by API, but our API allows public read (maybe?) 
      // Actually /api/transactions requires auth? Let's check. 
      // Yes, /api/transactions checks for Authorization header.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const res = await fetch(`/api/transactions?${params}`, { headers });
      
      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || `Error ${res.status}: Failed to fetch transactions`);
      }
      
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("GateTransactionsPanel fetch error:", err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, filterType, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleExport() {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (filterType !== 'all') params.set('type', filterType);
    
    // Export endpoint is public, but if we wanted to secure it we'd need to fetchBlob and download
    // For now, consistent with verification, we know it's public.
    window.open(`/api/export/transactions?${params}`, '_blank');
  }

  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;

  return (
    <PanelLayout title="Gate Transactions" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        <div className="rounded-t-xl bg-amber-600 px-6 py-5 text-white">
          <h2 className="text-xl font-semibold">Gate Transactions</h2>
          <p className="text-sm text-amber-100">Manage all gate entries and track their progress</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
            <span className="text-zinc-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="all">All Types</option>
              <option value="Loading">Loading</option>
              <option value="Unloading">Unloading</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <DownloadIcon className="h-4 w-4" /> Export
            </button>
            {/* Permission check for create button */}
            {hasPermission('create_transactions') && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                + New Gate Entry
              </button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-600">
                <p className="font-medium">Error loading data</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : (
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-zinc-800 text-left text-sm text-white">
                    <th className="px-4 py-3 font-medium">STAGES</th>
                    <th className="px-4 py-3 font-medium">TXN NO</th>
                    <th className="px-4 py-3 font-medium">TRUCK NO</th>
                    {STAGES.map((s) => (
                      <th key={s.key} className="px-3 py-3 text-center font-medium">
                        {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => {
                    const status = getStageStatus(t);
                    return (
                      <tr
                        key={t.transaction_id}
                        className="border-b border-zinc-100 hover:bg-zinc-50"
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDetailTxn(t)}
                            className="inline-flex items-center gap-2 rounded-lg bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-200"
                          >
                            <EyeIcon className="h-4 w-4" /> View
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-amber-800">
                            {txnNo(t)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-emerald-700">
                            {t.truck_no}
                          </span>
                        </td>
                        {STAGES.map((s) => (
                          <td key={s.key} className="px-3 py-3 text-center">
                            <StageBadge completed={status[s.key]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && transactions.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">No transactions found</p>
            )}
          </div>
        </div>
      </div>

      <NewGateEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        token={token}
      />

      {detailTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailTxn(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <GateTransactionDetailModal
              transaction={detailTxn}
              onClose={() => setDetailTxn(null)}
              onPrint={(txn) => {
                printGatePass(txn);
              }}
            />
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
