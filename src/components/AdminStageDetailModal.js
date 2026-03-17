'use client';

import { useState, useEffect } from 'react';
import { STAGES, getStageStatus, getNextStageToConfirm } from '@/lib/stageUtils';
import { formatWeight } from '@/utils/formatters';
import { CloseIcon, PrinterIcon } from '@/components/Icons';
import { useGatePassPrint } from '@/components/GatePassPrint';
import { useToast } from '@/hooks/useToast';

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
  isYardRole = false,
}) {
  const [txn, setTxn] = useState(transaction);
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [firstWeight, setFirstWeight] = useState('');
  const [secondWeight, setSecondWeight] = useState('');
  const [remark2, setRemark2] = useState('');
  const [error, setError] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState(null);
  const { printEntryPass } = useGatePassPrint();

  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;
  const status = getStageStatus(txn);
  const isFullView = viewMode === 'full';
  const nextStage = getNextStageToConfirm(txn);
  const isThisStageNext = nextStage === clickedStageKey;
  const isDamaged = Boolean(txn.is_damaged);
  const canConfirm = canConfirmStage && isThisStageNext && !isFullView && !isDamaged;
  const isGateOut = clickedStageKey === 'gate_out';
  const isFinalStage = status.gate_out;

  useEffect(() => {
    if (!transaction?.transaction_id) return;
    fetch(`/api/transactions/${transaction.transaction_id}`)
      .then((r) => r.json())
      .then((data) => setTxn(data))
      .catch(() => setTxn(transaction));
  }, [transaction, transaction?.transaction_id]);

  async function handleConfirm() {
    setError('');

    if (clickedStageKey === 'second_weighbridge' && secondWeight !== '') {
      const sw = Number(secondWeight);
      const fw = txn.first_weight !== null ? Number(txn.first_weight) : null;
      if (!isNaN(sw) && fw !== null) {
        if (txn.transaction_type === "Loading" && fw >= sw) {
          setError("For Loading transaction, First Weighbridge weight must be LESS THAN Second Weighbridge weight.");
          return;
        }
        if (txn.transaction_type === "Unloading" && sw >= fw) {
          setError("For Unloading transaction, Second Weighbridge weight must be LESS THAN First Weighbridge weight.");
          return;
        }
      }
    }

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
      toast.success('Stage confirmed successfully!', { id: 'stage-confirm' });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-transparent p-0 sm:p-4 transition-all">
      <div
        className={`w-full ${isFullView ? 'sm:max-w-5xl' : 'sm:max-w-lg'} h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col bg-white rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex-none flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 px-4 py-3 sm:px-6 sm:py-4 z-20">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              {isFullView ? (
                <>
                  <span className="p-1 rounded bg-blue-100 text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </span>
                  Full Details
                </>
              ) : (
                <>
                  <span className="p-1 rounded bg-blue-100 text-blue-600">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </span>
                  {currentStageLabel}
                </>
              )}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono font-medium">
              {txnNo(txn)} • {txn.transaction_type}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-zinc-300">
          
          {/* 1. COMPACT CONFIRMATION VIEW (Default/Action Mode) */}
          {!isFullView && (
            <div className="space-y-4">
               {isDamaged && (
                 <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in fade-in">
                   <h4 className="text-red-800 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                     <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                     Transaction Rejected
                   </h4>
                   <div className="bg-white/60 p-3 rounded-lg border border-red-100/50 mt-2">
                     <p className="text-red-900 font-medium text-sm">&quot;{txn.damaged_reason}&quot;</p>
                     <div className="flex gap-4 mt-2 text-xs text-red-700/80 font-semibold">
                       <span>By: {txn.damaged_by_name}</span>
                       <span>At: {formatDateTime(txn.damaged_at)}</span>
                     </div>
                   </div>
                 </div>
               )}

               {/* Context Card: Key Details - HIGH CONTRAST */}
               <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Row 1: Vehicle & Item */}
                    <div className="space-y-1">
                       <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Vehicle No</p>
                       <p className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2 py-1 rounded w-fit border border-zinc-200 shadow-sm font-mono">
                         {txn.truck_no}
                       </p>
                    </div>
                    <div className="space-y-1 text-right">
                       <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Item</p>
                       <p className="text-sm font-bold text-zinc-800 truncate max-w-[120px] ml-auto" title={txn.item_name}>{txn.item_name}</p>
                    </div>

                    {!isYardRole && (
                      <>
                        {/* Row 2: Party Name (Full Width) */}
                        <div className="col-span-2 space-y-1 pt-3 border-t border-zinc-100">
                           <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Party Name</p>
                           <p className="text-sm font-semibold text-zinc-800 truncate" title={txn.party_name}>{txn.party_name}</p>
                        </div>

                        {/* Row 3: Transporter Name (Full Width) */}
                        <div className="col-span-2 space-y-1 pt-3 border-t border-zinc-100">
                           <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Transporter</p>
                           <p className="text-sm font-medium text-zinc-700 truncate" title={txn.transporter_name}>{txn.transporter_name || '—'}</p>
                        </div>

                        {/* Row 4: Invoice No & Quantity */}
                        <div className="space-y-1 pt-3 border-t border-zinc-100">
                           <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Invoice No</p>
                           <p className="text-xs font-bold text-zinc-700 truncate font-mono">{txn.invoice_number || '—'}</p>
                        </div>
                        <div className="space-y-1 pt-3 border-t border-zinc-100 text-right">
                           <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold opacity-90">Quantity</p>
                           <p className="text-xs font-bold text-zinc-700 font-mono">{formatWeight(txn.invoice_quantity)}</p>
                        </div>
                      </>
                    )}
                  </div>
               </div>

               {/* Current Status Block - INCREASED CONTRAST */}
               <div className={`rounded-xl border p-4 shadow-sm ${
                  status[clickedStageKey] 
                    ? 'bg-emerald-50 border-emerald-200' // Completed
                    : 'bg-zinc-50 border-zinc-200' // Pending
               }`}>
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-xs font-bold uppercase tracking-wider ${
                        status[clickedStageKey] ? 'text-emerald-700' : 'text-zinc-700'
                     }`}>Status</span>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shadow-sm ${
                        status[clickedStageKey] 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-zinc-100 text-zinc-800 border-zinc-200'
                     }`}>
                        {status[clickedStageKey] ? 'Completed' : 'Pending Action'}
                     </span>
                  </div>
                  
                  {/* Detailed Timestamps if available */}
                  {(stageTimestamp || stageConfirmerName) && (
                     <div className={`text-xs space-y-1 pt-2 border-t mt-2 ${
                        status[clickedStageKey] ? 'border-emerald-200' : 'border-zinc-200'
                     }`}>
                        {stageTimestamp && (
                           <div className="flex justify-between">
                              <span className="opacity-70 font-medium text-zinc-600">Time:</span>
                              <span className="font-mono font-bold text-zinc-800">{formatDateTime(stageTimestamp)}</span>
                           </div>
                        )}
                         {stageConfirmerName && (
                           <div className="flex justify-between">
                              <span className="opacity-70 font-medium text-zinc-600">By:</span>
                              <span className="font-bold text-zinc-800">{stageConfirmerName}</span>
                           </div>
                        )}
                     </div>
                  )}
                  {clickedStageKey === 'gate_in' && status.gate_in && (
                    <div className="mt-4 pt-3 border-t border-emerald-200">
                      <button
                        onClick={() => printEntryPass(txn)}
                        className="w-full py-2.5 px-4 rounded-lg bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                         <PrinterIcon className="h-4 w-4" />
                         Print Entry Pass
                      </button>
                    </div>
                  )}
               </div>
              
              {/* Weights Display (if relevant) */}
              {(clickedStageKey.includes('weighbridge') || isGateOut || isFinalStage) && (
                 <div className="bg-zinc-900 rounded-xl p-4 text-zinc-100 shadow-md border border-zinc-800">
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-zinc-700">
                       <div>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5 font-bold">First</p>
                          <p className="text-base font-mono font-bold text-white">{formatWeight(txn.first_weight)} kg</p>
                       </div>
                       <div>
                          <p className="text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5 font-bold">Second</p>
                          <p className="text-base font-mono font-bold text-white">{formatWeight(txn.second_weight)} kg</p>
                       </div>
                       <div>
                          <p className="text-[9px] uppercase tracking-wider text-emerald-400 mb-0.5 font-bold">Net</p>
                          <p className="text-base font-mono font-bold text-emerald-400">{formatWeight(txn.net_weight)} kg</p>
                       </div>
                    </div>
                 </div>
              )}

              {/* ACTION FORM - INCREASED INPUT CONTRAST */}
              {canConfirm && (
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-black/5">
                  <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse ring-4 ring-blue-500/20" />
                     Action Required
                  </h4>

                  <div className="space-y-4">
                     {/* Inputs based on stage */}
                     {clickedStageKey === 'first_weighbridge' && (
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Enter First Weight (KG)</label>
                           <input
                              type="number"
                              step="any"
                              value={firstWeight}
                              onChange={(e) => setFirstWeight(e.target.value)}
                              placeholder="e.g. 45000"
                              className="w-full text-lg font-mono font-bold p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                              autoFocus
                           />
                        </div>
                     )}
                     
                     {clickedStageKey === 'second_weighbridge' && (
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Enter Second Weight (KG)</label>
                           <input
                              type="number"
                              step="any"
                              value={secondWeight}
                              onChange={(e) => setSecondWeight(e.target.value)}
                              placeholder="e.g. 15000"
                              className="w-full text-lg font-mono font-bold p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                              autoFocus
                           />
                        </div>
                     )}

                     {clickedStageKey === 'campus_out' && (
                        <div>
                           <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">Remarks (Optional)</label>
                           <textarea
                              value={remark2}
                              onChange={(e) => setRemark2(e.target.value)}
                              rows={3}
                              className="w-full p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm shadow-inner font-medium"
                              placeholder="Any comments..."
                           />
                        </div>
                     )}

                     {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-sm">
                           {error}
                        </div>
                     )}

                     <button
                        onClick={handleConfirm}
                        disabled={confirming}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                     >
                        {confirming ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Processing...
                           </>
                        ) : (
                           `Confirm ${currentStageLabel}`
                        )}
                     </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. FULL DETAILS VIEW - RESTORED ORIGINAL RICH LAYOUT */}
          {isFullView && (
            <div className="space-y-4">
              {/* Transaction Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Info Card */}
                <div className="rounded-xl border border-zinc-200 p-4 bg-blue-50/50 shadow-sm">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transaction Info
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-blue-700 font-medium">Transaction No</dt>
                      <dd className="text-blue-900 font-bold font-mono">{txnNo(txn)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700 font-medium">Type</dt>
                      <dd>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          txn.transaction_type === 'Loading'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {txn.transaction_type}
                        </span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700 font-medium">Status</dt>
                      <dd className="text-blue-900 font-semibold">{txn.current_status || 'In Progress'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Party & Truck Info Card */}
                <div className="rounded-xl border border-zinc-200 p-4 bg-emerald-50/50 shadow-sm">
                  <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Party & Vehicle
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-emerald-700 font-medium">Truck Number</dt>
                      <dd className="text-emerald-900 font-bold bg-white px-1.5 rounded shadow-sm">{txn.truck_no}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-emerald-700 font-medium whitespace-nowrap">Party Name</dt>
                      <dd className="text-emerald-900 text-right truncate">{txn.party_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-emerald-700 font-medium whitespace-nowrap">Item Name</dt>
                      <dd className="text-emerald-900 text-right truncate">{txn.item_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-emerald-700 font-medium whitespace-nowrap">Transporter</dt>
                      <dd className="text-emerald-900 text-right truncate">{txn.transporter_name}</dd>
                    </div>
                  </dl>
                </div>

                {/* Invoice Info Card */}
                <div className="rounded-xl border border-zinc-200 p-4 bg-orange-50/50 shadow-sm">
                  <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoice Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-orange-700 font-medium">Invoice No</dt>
                      <dd className="text-orange-900 font-semibold">{txn.invoice_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-orange-700 font-medium">Invoice Date</dt>
                      <dd className="text-orange-900">{formatDate(txn.invoice_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-orange-700 font-medium">Quantity</dt>
                      <dd className="text-orange-900 font-semibold">{formatWeight(txn.invoice_quantity)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-orange-700 font-medium">PO/DO No</dt>
                      <dd className="text-orange-900">{txn.po_do_number || '—'}</dd>
                    </div>
                     <div className="flex justify-between">
                      <dt className="text-orange-700 font-medium">Rate</dt>
                      <dd className="text-orange-900">{txn.rate || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Weight & Gate Pass Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight Information */}
                <div className="rounded-xl border border-zinc-200 p-4 bg-purple-50/50 shadow-sm">
                  <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Weight Information
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                      <p className="text-xs text-purple-600 mb-1 uppercase tracking-wider font-bold">First</p>
                      <p className="text-lg font-bold text-purple-900 font-mono">{formatWeight(txn.first_weight)}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                      <p className="text-xs text-purple-600 mb-1 uppercase tracking-wider font-bold">Second</p>
                      <p className="text-lg font-bold text-purple-900 font-mono">{formatWeight(txn.second_weight)}</p>
                    </div>
                    <div className="bg-emerald-100 p-2 rounded-lg border border-emerald-200 shadow-sm">
                      <p className="text-xs text-emerald-700 mb-1 uppercase tracking-wider font-bold">Net</p>
                      <p className="text-lg font-bold text-emerald-800 font-mono">{formatWeight(txn.net_weight)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="rounded-xl border border-zinc-200 p-4 bg-rose-50/50 shadow-sm">
                  <h4 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Additional Info
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-rose-700 font-medium">Gate Pass No</dt>
                      <dd className="text-rose-900 font-semibold">{txn.gate_pass_no || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-rose-700 font-medium">LR Number</dt>
                      <dd className="text-rose-900">{txn.lr_number || '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-rose-700 font-medium">Mobile</dt>
                      <dd className="text-rose-900 font-mono bg-white px-1.5 rounded border border-rose-100">{txn.mobile_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-rose-700 font-medium">Created</dt>
                      <dd className="text-rose-900 text-xs">{formatDateTime(txn.created_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Remarks Section */}
              {(txn.remark1 || txn.remark2) && (
                <div className="rounded-xl border border-zinc-200 p-4 bg-white shadow-sm">
                  <h4 className="text-sm font-bold text-zinc-700 mb-3">Remarks</h4>
                  <div className="space-y-3 text-sm">
                    {txn.remark1 && (
                      <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                        <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entry Remarks</span>
                        <span className="text-zinc-900 font-medium">{txn.remark1}</span>
                      </div>
                    )}
                    {txn.remark2 && (
                      <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                         <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Exit Remarks</span>
                         <span className="text-zinc-900 font-medium">{txn.remark2}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stage Filter Buttons (Full View Only) */}
              {txn.stages && (
                <div className="rounded-xl border border-zinc-200 p-4 bg-white shadow-sm">
                  <h4 className="mb-3 text-sm font-bold text-zinc-700">Filter by Stage</h4>
                  <div className="overflow-x-auto -mx-2 px-2 pb-2">
                    <div className="flex gap-2 min-w-max">
                      <button
                        onClick={() => setSelectedStageFilter(null)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                          selectedStageFilter === null
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {stage.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage History */}
              {txn.stages && (
                <div className="rounded-xl border border-zinc-200 p-4 bg-white shadow-sm">
                  <h4 className="mb-4 text-sm font-bold text-zinc-700">Complete Stage History</h4>
                  <div className="space-y-3">
                    {STAGES.filter(stage => selectedStageFilter === null || stage.key === selectedStageFilter).map((stage) => {
                      const stageData = txn.stages[stage.key];
                      const isCompleted = stageData?.confirmed;
                      return (
                        <div
                          key={stage.key}
                          className={`rounded-lg border p-3 transition-all ${
                            isCompleted
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-zinc-200 bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${
                                isCompleted ? 'text-emerald-700' : 'text-zinc-600'
                              }`}>
                                {stage.label}
                              </span>
                              <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              }`}>
                                {isCompleted ? '✓ Completed' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                          {isCompleted && (
                            <div className="space-y-1 text-xs text-zinc-600">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold opacity-70">Timestamp:</span>
                                <span className="font-mono">{formatDateTime(stageData.confirmed_at)}</span>
                              </div>
                              {stageData.confirmed_by_name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold opacity-70">Approved by:</span>
                                  <span className="text-zinc-800 font-medium">{stageData.confirmed_by_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {txn.is_damaged && (
                       <div className="rounded-lg border border-red-200 p-3 bg-red-50 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                           <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                         </div>
                         <div className="flex items-center gap-2 mb-2 relative z-10">
                           <span className="text-sm font-bold text-red-700">Rejected Stage</span>
                           <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                             ⚠️ Triggered
                           </span>
                         </div>
                         <div className="space-y-1 text-xs text-red-800 relative z-10">
                            <div className="flex items-start gap-2">
                               <span className="font-semibold opacity-70 whitespace-nowrap">Reason:</span>
                               <span className="font-medium italic leading-relaxed">&quot;{txn.damaged_reason}&quot;</span>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="font-semibold opacity-70">Marked by:</span>
                              <span className="font-medium">{txn.damaged_by_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold opacity-70">Timestamp:</span>
                              <span className="font-mono">{formatDateTime(txn.damaged_at)}</span>
                            </div>
                          </div>
                        </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer (Action buttons if needed, or close) */}
        <div className="flex-none p-4 border-t border-zinc-200 bg-zinc-50 sm:rounded-b-xl z-20 md:hidden">
             <button
               onClick={onClose}
               className="w-full py-3 rounded-xl border border-zinc-300 text-zinc-600 font-medium active:bg-zinc-100"
             >
               Close
             </button>
        </div>
      </div>
    </div>
  );
}
