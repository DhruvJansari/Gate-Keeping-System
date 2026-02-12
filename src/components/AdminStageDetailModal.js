'use client';

import { useState, useEffect } from 'react';
import { STAGES, getStageStatus, getNextStageToConfirm } from '@/lib/stageUtils';
import { CloseIcon } from '@/components/Icons';

function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('en-IN') : '—';
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}

export function AdminStageDetailModal({
  transaction,
  clickedStageKey,
  viewMode,
  onClose,
  onConfirmSuccess,
  canConfirmStage,
}) {
  const [txn, setTxn] = useState(transaction);
  const [confirming, setConfirming] = useState(false);
  const [firstWeight, setFirstWeight] = useState('');
  const [secondWeight, setSecondWeight] = useState('');
  const [remark2, setRemark2] = useState('');
  const [error, setError] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState(null);

  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;
  const status = getStageStatus(txn);
  const isFullView = viewMode === 'full';
  const nextStage = getNextStageToConfirm(txn);
  const isThisStageNext = nextStage === clickedStageKey;
  const canConfirm = canConfirmStage && isThisStageNext && !isFullView;
  const isGateOut = clickedStageKey === 'gate_out';
  const isFinalStage = status.gate_out;

  useEffect(() => {
    if (!transaction?.transaction_id) return;
    fetch(`/api/transactions/${transaction.transaction_id}`)
      .then((r) => r.json())
      .then((data) => setTxn(data))
      .catch(() => setTxn(transaction));
  }, [transaction?.transaction_id]);

  async function handleConfirm() {
    setError('');
    setConfirming(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const body = { stage: clickedStageKey };
    if (clickedStageKey === 'first_weighbridge' && firstWeight !== '') body.first_weight = firstWeight;
    if (clickedStageKey === 'second_weighbridge' && secondWeight !== '') body.second_weight = secondWeight;
    if (clickedStageKey === 'campus_out' && remark2 !== '') body.remark2 = remark2;
    try {
      const res = await fetch(`/api/transactions/${txn.transaction_id}/confirm-stage`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm');
      setTxn(data.transaction);
      onConfirmSuccess?.(data.transaction);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  }

  const currentStageLabel = STAGES.find((s) => s.key === clickedStageKey)?.label || clickedStageKey;

  // Get timestamp for clicked stage
  const stageTimestamp = (() => {
    switch (clickedStageKey) {
      case 'parking': return txn.parking_confirmed_at ?? txn.created_at;
      case 'gate_in': return txn.gate_in_at;
      case 'first_weighbridge': return txn.first_weigh_at;
      case 'campus_in': return txn.campus_in_at;
      case 'campus_out': return txn.campus_out_at;
      case 'second_weighbridge': return txn.second_weigh_at;
      case 'gate_pass': return txn.gate_pass_finalized_at;
      case 'gate_out': return txn.gate_out_at;
      default: return null;
    }
  })();

  const stageConfirmerName = (() => {
    switch (clickedStageKey) {
      case 'parking': return txn.parking_confirmed_by_name;
      case 'gate_in': return txn.gate_in_confirmed_by_name;
      case 'first_weighbridge': return txn.first_weigh_confirmed_by_name;
      case 'campus_in': return txn.campus_in_confirmed_by_name;
      case 'campus_out': return txn.campus_out_confirmed_by_name;
      case 'second_weighbridge': return txn.second_weigh_confirmed_by_name;
      case 'gate_pass': return null; // Logic usually implies system/user
      case 'gate_out': return txn.gate_out_confirmed_by_name;
      default: return null;
    }
  })();
  
  // Previous Stage Logic for "Confirmed By" display
  const previousStageEntry = (() => {
    const idx = STAGES.findIndex(s => s.key === clickedStageKey);
    if (idx <= 0) return null;
    return STAGES[idx - 1];
  })();

  const previousStageConfirmerName = (() => {
    if (!previousStageEntry) return null;
    const key = previousStageEntry.key;
     switch (key) {
      case 'parking': return txn.parking_confirmed_by_name;
      case 'gate_in': return txn.gate_in_confirmed_by_name;
      case 'first_weighbridge': return txn.first_weigh_confirmed_by_name;
      case 'campus_in': return txn.campus_in_confirmed_by_name;
      case 'campus_out': return txn.campus_out_confirmed_by_name;
      case 'second_weighbridge': return txn.second_weigh_confirmed_by_name;
      default: return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`max-h-[90vh] w-full ${isFullView ? 'max-w-6xl' : 'max-w-2xl'} overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-amber-600 px-6 py-4 text-white">
          <div>
            <h3 className="text-lg font-semibold">
              {isFullView ? 'Full Transaction Details' : `Stage: ${currentStageLabel}`}
            </h3>
            <p className="text-sm text-amber-100">
              Txn: {txnNo(txn)} • {txn.transaction_type}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-2 hover:bg-amber-500" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>


        <div className="p-6 space-y-4">
          {/* Full Transaction View Layout */}
          {isFullView ? (
            <>
              {/* Transaction Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Info Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transaction Info
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-blue-700 dark:text-blue-400 font-medium">Transaction No</dt>
                      <dd className="text-blue-900 dark:text-blue-100 font-semibold">{txnNo(txn)}</dd>
                    </div>
                    <div>
                      <dt className="text-blue-700 dark:text-blue-400 font-medium">Type</dt>
                      <dd className="text-blue-900 dark:text-blue-100">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          txn.transaction_type === 'Loading'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-blue-700 dark:text-blue-400 font-medium">Status</dt>
                      <dd className="text-blue-900 dark:text-blue-100 font-semibold">{txn.current_status || 'In Progress'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Party & Truck Info Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Party & Vehicle
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-emerald-700 dark:text-emerald-400 font-medium">Truck Number</dt>
                      <dd className="text-emerald-900 dark:text-emerald-100 font-semibold">{txn.truck_no}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-700 dark:text-emerald-400 font-medium">Party Name</dt>
                      <dd className="text-emerald-900 dark:text-emerald-100">{txn.party_name}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-700 dark:text-emerald-400 font-medium">Item Name</dt>
                      <dd className="text-emerald-900 dark:text-emerald-100">{txn.item_name}</dd>
                    </div>
                    <div>
                      <dt className="text-emerald-700 dark:text-emerald-400 font-medium">Transporter</dt>
                      <dd className="text-emerald-900 dark:text-emerald-100">{txn.transporter_name}</dd>
                    </div>
                  </dl>
                </div>

                {/* Invoice Info Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoice Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-amber-700 dark:text-amber-400 font-medium">Invoice No</dt>
                      <dd className="text-amber-900 dark:text-amber-100 font-semibold">{txn.invoice_number}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-700 dark:text-amber-400 font-medium">Invoice Date</dt>
                      <dd className="text-amber-900 dark:text-amber-100">{formatDate(txn.invoice_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-700 dark:text-amber-400 font-medium">Quantity</dt>
                      <dd className="text-amber-900 dark:text-amber-100 font-semibold">{txn.invoice_quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-amber-700 dark:text-amber-400 font-medium">PO/DO Number</dt>
                      <dd className="text-amber-900 dark:text-amber-100">{txn.po_do_number || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Weight & Gate Pass Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight Information */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Weight Information
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">First Weight</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{txn.first_weight ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Second Weight</p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{txn.second_weight ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Net Weight</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{txn.net_weight ?? '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-800/10">
                  <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Additional Info
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-rose-700 dark:text-rose-400 font-medium">Gate Pass No</dt>
                      <dd className="text-rose-900 dark:text-rose-100 font-semibold">{txn.gate_pass_no || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-rose-700 dark:text-rose-400 font-medium">LR Number</dt>
                      <dd className="text-rose-900 dark:text-rose-100">{txn.lr_number || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-rose-700 dark:text-rose-400 font-medium">Mobile</dt>
                      <dd className="text-rose-900 dark:text-rose-100">{txn.mobile_number}</dd>
                    </div>
                    <div>
                      <dt className="text-rose-700 dark:text-rose-400 font-medium">Created</dt>
                      <dd className="text-rose-900 dark:text-rose-100 text-xs">{formatDateTime(txn.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Remarks Section */}
              {(txn.remark1 || txn.remark2) && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Remarks</h4>
                  <div className="space-y-2 text-sm">
                    {txn.remark1 && (
                      <div>
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">Entry Remarks: </span>
                        <span className="text-zinc-900 dark:text-zinc-100">{txn.remark1}</span>
                      </div>
                    )}
                    {txn.remark2 && (
                      <div>
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">Exit Remarks: </span>
                        <span className="text-zinc-900 dark:text-zinc-100">{txn.remark2}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Regular Stage-Specific Transaction Details */
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
            <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Transaction Details</h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Truck Number</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.truck_no}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Party Name</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.party_name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Item Name</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.item_name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Transporter</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.transporter_name}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Invoice Number</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.invoice_number}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Invoice Date</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(txn.invoice_date)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Quantity</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.invoice_quantity} units</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Mobile</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-100">{txn.mobile_number}</dd>
              </div>
            </dl>
          </div>
          )}


          {/* Stage Filter Buttons (Full View Only) */}
          {isFullView && txn.stages && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
              <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Filter by Stage</h4>
              <div className="overflow-x-auto -mx-2 px-2">
                <div className="flex gap-2 min-w-max pb-2">
                  <button
                    onClick={() => setSelectedStageFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedStageFilter === null
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    All Stages
                  </button>
                  {STAGES.map((stage) => (
                    <button
                      key={stage.key}
                      onClick={() => setSelectedStageFilter(stage.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                        selectedStageFilter === stage.key
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full Transaction View - All Stages */}
          {isFullView && txn.stages && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
              <h4 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Complete Stage History</h4>
              <div className="space-y-3">
                {STAGES.filter(stage => selectedStageFilter === null || stage.key === selectedStageFilter).map((stage) => {
                  const stageData = txn.stages[stage.key];
                  const isCompleted = stageData?.confirmed;
                  return (
                    <div
                      key={stage.key}
                      className={`rounded-lg border p-3 transition-all ${
                        isCompleted
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${
                            isCompleted ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {stage.label}
                          </span>
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {isCompleted ? '✓ Completed' : '⏳ Pending'}
                          </span>
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Timestamp:</span>
                            <span>{formatDateTime(stageData.confirmed_at)}</span>
                          </div>
                          {stageData.confirmed_by_name && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Approved by:</span>
                              <span className="text-zinc-700 dark:text-zinc-300">{stageData.confirmed_by_name}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage Status */}
          {!isFullView && clickedStageKey && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
            <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Current Stage Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Stage</span>
                <span className={`text-sm font-medium ${status[clickedStageKey] ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500'}`}>
                  {currentStageLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Status</span>
                <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                  status[clickedStageKey]
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {status[clickedStageKey] ? 'Completed' : 'Pending'}
                </span>
              </div>
              {stageTimestamp && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Timestamp</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDateTime(stageTimestamp)}
                  </span>
                </div>
              )}
              {stageConfirmerName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Confirmed By</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {stageConfirmerName}
                  </span>
                </div>
              )}
            </div>
          </div>
          )}


          {/* Weighbridge Info - only show for weighbridge stages or final stages */}
          {!isFullView && clickedStageKey && (clickedStageKey.includes('weighbridge') || isGateOut || isFinalStage) && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-800">
              <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Weight Information</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">First Weight</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{txn.first_weight ?? '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Second Weight</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{txn.second_weight ?? '—'}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Net Weight</p>
                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{txn.net_weight ?? '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Section */}
          {canConfirm && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 p-4">
              <h4 className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">Confirm This Stage</h4>
              {previousStageEntry && previousStageConfirmerName && (
                 <div className="mb-3 p-2 rounded bg-amber-100 dark:bg-amber-900/50 text-xs text-amber-900 dark:text-amber-100">
                   <strong>{previousStageEntry.label}</strong> was confirmed by <strong>{previousStageConfirmerName}</strong>
                 </div>
              )}
              {clickedStageKey === 'first_weighbridge' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    First weight (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={firstWeight}
                    onChange={(e) => setFirstWeight(e.target.value)}
                    placeholder="Enter first weight"
                    className="w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
              {clickedStageKey === 'second_weighbridge' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Second weight (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={secondWeight}
                    onChange={(e) => setSecondWeight(e.target.value)}
                    placeholder="Enter second weight"
                    className="w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
              {clickedStageKey === 'campus_out' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Campus out remarks (optional)
                  </label>
                  <textarea
                    value={remark2}
                    onChange={(e) => setRemark2(e.target.value)}
                    placeholder="Enter remarks for campus out stage"
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              )}
              {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {confirming ? 'Confirming...' : `Confirm ${currentStageLabel}`}
              </button>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Transaction will move to the next stage after confirmation.
              </p>
            </div>
          )}

          {/* Final Stage Message */}
          {isFinalStage && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 p-4">
              <h4 className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                Transaction Closed
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                All stages completed successfully.
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
