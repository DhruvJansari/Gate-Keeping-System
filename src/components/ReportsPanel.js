'use client';

import { useState, useEffect, useCallback } from 'react';
import { PanelLayout } from '@/components/PanelLayout';
import { useAuth } from '@/context/AuthContext';
import { formatWeight } from '@/utils/formatters';

export function ReportsPanel() {
  const { user } = useAuth();
  
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
      
      setTransactions(filtered);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [loadingChecked, unloadingChecked, selectedParty, selectedItem, selectedTransporter, 
      composeDateFrom, composeDateTo, weighbridgeDateFrom, weighbridgeDateTo, token]);

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
      
      // Format filtered transactions for export
      const exportData = transactions.map((t, idx) => ({
        'S/N': idx + 1,
        'Transaction No': txnNo(t),
        'Type': t.transaction_type,
        'Party Name': t.party_name,
        'Item Name': t.item_name,
        'Transporter': t.transporter_name,
        'Truck Number': t.truck_no,
        'Invoice No': t.invoice_number || '—',
        'Invoice Date': formatDate(t.invoice_date),
        'PO/DO Number': t.po_do_number || '—',
        'LR Number': t.lr_number || '—',
        'Mobile': t.mobile_number || '—',
        'First Weight': t.first_weight ? parseFloat(t.first_weight) : '—',
        'Second Weight': t.second_weight ? parseFloat(t.second_weight) : '—',
        'Net Weight': t.net_weight ? parseFloat(t.net_weight) : '—',
        'Status': t.current_status || 'In Progress',
        'Remark 1': t.remark1 || '',
        'Remark 2': t.remark2 || '',
        'Created Date': formatDate(t.created_at),
        'Gate In': formatDate(t.gate_in_at),
        'Gate Out': formatDate(t.gate_out_at),
        'First Weigh': formatDate(t.first_weigh_at),
        'Second Weigh': formatDate(t.second_weigh_at),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add worksheet to workbook
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
  }, [transactions, formatDate, txnNo]);

  return (
    <PanelLayout title="Reports" roleName={user?.role_name || "User"}>
      <div className="space-y-6">
        {/* Filter Form */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-lg p-6">
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
                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-zinc-700">Loading Goods (Out Ward)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unloadingChecked}
                    onChange={(e) => setUnloadingChecked(e.target.checked)}
                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">All Transporters</option>
                {transporters.map((t) => (
                  <option key={t.transporter_id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-zinc-500">To</span>
                <input
                  type="date"
                  value={composeDateTo}
                  onChange={(e) => setComposeDateTo(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-zinc-500">To</span>
                <input
                  type="date"
                  value={weighbridgeDateTo}
                  onChange={(e) => setWeighbridgeDateTo(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md transition-all"
            >
              Go
            </button>
            {hasSearched && transactions.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-md transition-all"
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
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
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
                    <tr className="bg-gradient-to-r from-zinc-800 to-zinc-900 text-left text-sm text-white">
                      <th className="px-4 py-3 font-semibold">S/N</th>
                      <th className="px-4 py-3 font-semibold">Transaction No</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Party Name</th>
                      <th className="px-4 py-3 font-semibold">Item Name</th>
                      <th className="px-4 py-3 font-semibold">Transporter</th>
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
                        className="border-b border-zinc-100 hover:bg-amber-50/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-zinc-700">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{txnNo(t)}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.transaction_type}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.party_name}</td>
                        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{t.item_name}</td>
                        <td className="px-4 py-3 text-sm text-zinc-700">{t.transporter_name}</td>
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
    </PanelLayout>
  );
}
