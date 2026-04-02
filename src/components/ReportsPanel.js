'use client';

import { useState, useEffect, useCallback } from 'react';
import { PanelLayout } from '@/components/PanelLayout';
import { useAuth } from '@/context/AuthContext';
import { formatWeight } from '@/utils/formatters';
import { STAGES, getNextStageToConfirm } from '@/lib/stageUtils';
import { GateTransactionDetailModal } from '@/components/GateTransactionDetailModal';
import { useGatePassPrint } from '@/components/GatePassPrint';
import { EyeIcon } from '@/components/Icons';

export function ReportsPanel() {
  const { user } = useAuth();
  const { printGatePass, printEntryPass } = useGatePassPrint();
  const [detailTxn, setDetailTxn] = useState(null);
  
  // Filter states
  const [loadingChecked, setLoadingChecked] = useState(true);
  const [unloadingChecked, setUnloadingChecked] = useState(true);
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [composeDateFrom, setComposeDateFrom] = useState('');
  const [composeDateTo, setComposeDateTo] = useState('');
  const [weighbridgeDateFrom, setWeighbridgeDateFrom] = useState('');
  const [weighbridgeDateTo, setWeighbridgeDateTo] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [rateFilter, setRateFilter] = useState('');
  
  // Master data
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [transporters, setTransporters] = useState([]);
  
  // Results
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch master data on mount
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [partiesRes, itemsRes, transportersRes] = await Promise.all([
          fetch('/api/parties', { headers }),
          fetch('/api/items', { headers }),
          fetch('/api/transporters', { headers })
        ]);
        
        const partiesData = await partiesRes.json();
        const itemsData = await itemsRes.json();
        const transportersData = await transportersRes.json();
        
        setParties(Array.isArray(partiesData) ? partiesData : []);
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setTransporters(Array.isArray(transportersData) ? transportersData : []);
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };
    fetchMasters();
  }, [token]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      
      // Transaction type filter
      if (loadingChecked && !unloadingChecked) {
        params.set('type', 'Loading');
      } else if (unloadingChecked && !loadingChecked) {
        params.set('type', 'Unloading');
      }
      
      // Date filters
      if (composeDateFrom) params.set('from', composeDateFrom);
      if (composeDateTo) params.set('to', composeDateTo);
      
      // Item filter
      if (selectedItem) params.set('item', selectedItem);
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/transactions?${params.toString()}`, { headers });
      const data = await res.json();
      
      let filtered = Array.isArray(data) ? data : [];
      
      // Client-side filtering for party and transporter (if API doesn't support)
      if (selectedParty) {
        filtered = filtered.filter(t => t.party_name === selectedParty);
      }
      if (selectedTransporter) {
        filtered = filtered.filter(t => t.transporter_name === selectedTransporter);
      }
      
      // Second weighbridge date filter (client-side)
      if (weighbridgeDateFrom || weighbridgeDateTo) {
        filtered = filtered.filter(t => {
          if (!t.second_weigh_at) return false;
          const weighDate = new Date(t.second_weigh_at).toISOString().split('T')[0];
          if (weighbridgeDateFrom && weighDate < weighbridgeDateFrom) return false;
          if (weighbridgeDateTo && weighDate > weighbridgeDateTo) return false;
          return true;
        });
      }

      // Rate filter (client-side) - Range based (approximate values)
      // Allow +/- 5% variance for easier range scanning
      if (rateFilter !== '') {
        const queryRate = Number(rateFilter);
        if (queryRate > 0) {
          const lowerBound = queryRate * 0.95; // -5%
          const upperBound = queryRate * 1.05; // +5%
          
          filtered = filtered.filter(t => {
            if (t.rate == null) return false;
            const truckRate = Number(t.rate);
            return truckRate >= lowerBound && truckRate <= upperBound;
          });
        } else {
          // Fallback to exact 0 if query is 0
          filtered = filtered.filter(t => t.rate != null && Number(t.rate) === 0);
        }
      }

      // Stage filter (client-side) - Logic: Show trucks currently AT this stage
      if (selectedStage) {
        filtered = filtered.filter(t => {
          const nextStage = getNextStageToConfirm(t);
          if (selectedStage === 'completed') {
            return nextStage === null; // All stages done
          }
          return nextStage === selectedStage;
        });
      }
      
      setTransactions(filtered);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [loadingChecked, unloadingChecked, selectedParty, selectedItem, selectedTransporter, 
      composeDateFrom, composeDateTo, weighbridgeDateFrom, weighbridgeDateTo, selectedStage, rateFilter, token]);

  // Helper functions for formatting
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const txnNo = (t) => t.gate_pass_no || `TRN${String(t.transaction_id).padStart(5, '0')}`;

  const handleExport = useCallback(async () => {
    if (transactions.length === 0) {
      return; // No data to export
    }

    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');

      const LABELS = [
        'Transaction ID',
        'Type',
        'Truck Number',
        'Party Name',
        'Item Name',
        'Transporter',
        'PO/DO Number',
        'LR Number',
        'Invoice Number',
        'Invoice Date',
        'Invoice Quantity',
        'Rate',
        'Mobile Number',
        'Remark 1',
        'Remark 2',
        'First Weight',
        'Second Weight',
        'Net Weight',
        'Parking Confirmed At',
        'Gate In At',
        'First Weigh At',
        'Second Weigh At',
        'Campus In At',
        'Campus Out At',
        'Gate Pass Finalized At',
        'Gate Out At',
        'Created Date',
        'Status'
      ];

      // Build array-of-arrays: each row is a transaction
      const aoa = [LABELS];

      transactions.forEach((t) => {
        const invoiceDate = formatDate(t.invoice_date);
        const formatTime = (iso) => iso ? new Date(iso).toLocaleString('en-IN') : '';
        const createdDate = t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '';

        const values = [
          t.transaction_id || '',
          t.transaction_type || '',
          t.truck_no || '',
          t.party_name || '',
          t.item_name || '',
          t.transporter_name || '',
          t.po_do_number || '',
          t.lr_number || '',
          t.invoice_number || '',
          invoiceDate,
          t.invoice_quantity != null ? Number(t.invoice_quantity) : '',
          t.rate != null ? Number(t.rate) : '',
          t.mobile_number || '',
          t.remark1 || '',
          t.remark2 || '',
          t.first_weight != null ? Math.round(parseFloat(t.first_weight)) : '',
          t.second_weight != null ? Math.round(parseFloat(t.second_weight)) : '',
          t.net_weight != null ? Math.round(parseFloat(t.net_weight)) : '',
          formatTime(t.parking_confirmed_at),
          formatTime(t.gate_in_at),
          formatTime(t.first_weigh_at),
          formatTime(t.second_weigh_at),
          formatTime(t.campus_in_at),
          formatTime(t.campus_out_at),
          formatTime(t.gate_pass_finalized_at),
          formatTime(t.gate_out_at),
          createdDate,
          t.current_status || 'In Progress'
        ];
        
        aoa.push(values);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered Report');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Report_Filtered_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    }
  }, [transactions, formatDate]);

  return (
    <PanelLayout title="Reports" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Filter Form */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-zinc-900 mb-6">Transaction Report Filters</h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Transaction Type */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Transaction Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loadingChecked}
                    onChange={(e) => setLoadingChecked(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700">Loading Goods (Out Ward)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unloadingChecked}
                    onChange={(e) => setUnloadingChecked(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-700">Unloading Goods (In Ward)</span>
                </label>
              </div>
            </div>

            {/* Party Master */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Party Master
              </label>
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Parties</option>
                {parties.map((p) => (
                  <option key={p.party_id} value={p.party_name}>
                    {p.party_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Master */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Item Master
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_name}>
                    {i.item_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Transport Master */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Transport Master
              </label>
              <select
                value={selectedTransporter}
                onChange={(e) => setSelectedTransporter(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Transporters</option>
                {transporters.map((t) => (
                  <option key={t.transporter_id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Master */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Rate Amount (Approximate)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rateFilter}
                onChange={(e) => setRateFilter(e.target.value)}
                placeholder="Target Rate (±5%)..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* New Compose Date */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                New Compose Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={composeDateFrom}
                  onChange={(e) => setComposeDateFrom(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-zinc-500">To</span>
                <input
                  type="date"
                  value={composeDateTo}
                  onChange={(e) => setComposeDateTo(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Second WeighBridge Date */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Second WeighBridge Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={weighbridgeDateFrom}
                  onChange={(e) => setWeighbridgeDateFrom(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-zinc-500">To</span>
                <input
                  type="date"
                  value={weighbridgeDateTo}
                  onChange={(e) => setWeighbridgeDateTo(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stage Filter */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                Filter by Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.shortLabel || s.label}
                  </option>
                ))}
                <option value="completed">All Completed / Closed</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md transition-all w-full sm:w-auto"
            >
              Go
            </button>
            {hasSearched && transactions.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-md transition-all w-full sm:w-auto"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Export To Excel
              </button>
            )}
          </div>
        </div>

        {/* Results Table */}
        {hasSearched && (
          <div className="rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-zinc-100/50">
              <h3 className="text-lg font-semibold text-zinc-900">
                Report Results ({transactions.length} transactions)
              </h3>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <svg className="h-16 w-16 text-zinc-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-zinc-600">No records found</p>
                  <p className="text-sm text-zinc-500 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <table className="w-full min-w-[1400px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-zinc-800 to-zinc-900 text-left text-sm text-white whitespace-nowrap">
                      <th className="px-4 py-3 font-semibold">S/N</th>
                      <th className="px-4 py-3 font-semibold text-center">Action</th>
                      <th className="px-4 py-3 font-semibold">Transaction No</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Party Name</th>
                      <th className="px-4 py-3 font-semibold">Item Name</th>
                      <th className="px-4 py-3 font-semibold">Transporter</th>
                      <th className="px-4 py-3 font-semibold">Rate</th>
                      <th className="px-4 py-3 font-semibold">Truck Number</th>
                      <th className="px-4 py-3 font-semibold">Invoice No</th>
                      <th className="px-4 py-3 font-semibold">Invoice Date</th>
                      <th className="px-4 py-3 font-semibold">First Weight</th>
                      <th className="px-4 py-3 font-semibold">Second Weight</th>
                      <th className="px-4 py-3 font-semibold">Net Weight</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr
                        key={t.transaction_id}
                        className={`border-b border-zinc-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-zinc-700">
                          {(() => {
                            if (t.gate_pass_no && t.gate_pass_no.startsWith('GP-')) {
                              const parts = t.gate_pass_no.split('-');
                              if (parts.length === 3) return parts[1];
                            }
                            return '—';
                          })()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailTxn(t)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-200 transition-colors shadow-sm"
                          >
                            <EyeIcon className="h-3 w-3" /> View
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900 whitespace-nowrap">{txnNo(t)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.transaction_type}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.party_name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{t.item_name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.transporter_name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.rate != null ? '₹' + t.rate : '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.truck_no}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.invoice_number || '—'}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{formatDate(t.invoice_date)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{formatWeight(t.first_weight)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{formatWeight(t.second_weight)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{formatWeight(t.net_weight)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.current_status || 'In Progress'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {detailTxn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailTxn(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <GateTransactionDetailModal
              transaction={detailTxn}
              onClose={() => setDetailTxn(null)}
              onPrint={(txn, type) => {
                if (type === 'entry') {
                  printEntryPass(txn);
                } else {
                  printGatePass(txn);
                }
              }}
            />
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
