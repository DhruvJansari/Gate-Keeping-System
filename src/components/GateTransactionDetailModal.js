'use client';

import { STAGES, getStageStatus } from '@/lib/stageUtils';
import { formatWeight } from '@/utils/formatters';
import { CheckIcon, ClockIcon, CloseIcon, PrinterIcon } from '@/components/Icons';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
}

function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function StageItem({ label, timestamp, completed, approver }) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
        {completed ? (
          <CheckIcon className="h-4 w-4 text-emerald-600" />
        ) : (
          <ClockIcon className="h-4 w-4 text-zinc-400" />
        )}
      </div>
      <div className="text-xs text-zinc-500">
        Date&Time: {formatDateTime(timestamp)}
      </div>
      {approver && (
        <div className="text-xs text-zinc-600 italic">
          By: {approver}
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex justify-between py-1 text-xs">
      <span className="text-zinc-600">{label}:</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

export function GateTransactionDetailModal({ transaction, onClose, onPrint }) {
  if (!transaction) return null;

  const status = getStageStatus(transaction);
  const txnNo = transaction.gate_pass_no || `TRN${String(transaction.transaction_id).padStart(5, '0')}`;
  
  const remark1 = transaction.remark1 || '—';
  const remark2 = transaction.remark2 || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex flex-col max-h-[90vh] w-full max-w-[95vw] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex-none flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Transaction Details</h3>
            <p className="text-sm text-zinc-500">Stage-wise progress view</p>
          </div>
          <button onClick={onClose} className="rounded p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cards Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            
            {/* Step-1 Card */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <div className="mb-3 border-b border-rose-200 pb-2">
                <h4 className="text-sm font-bold text-rose-700">Step-1</h4>
                <p className="text-xs text-rose-600">Parking • Gate In • Gate Out</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <StageItem 
                  label="Parking" 
                  timestamp={transaction.parking_confirmed_at || transaction.created_at}
                  completed={status.parking}
                  approver={transaction.parking_confirmed_by_name}
                />
                <StageItem 
                  label="Gate In" 
                  timestamp={transaction.gate_in_at}
                  completed={status.gate_in}
                  approver={transaction.gate_in_confirmed_by_name}
                />
                <StageItem 
                  label="Gate Out" 
                  timestamp={transaction.gate_out_at}
                  completed={status.gate_out}
                  approver={transaction.gate_out_confirmed_by_name}
                />
              </div>

              <div className="border-t border-rose-200 pt-3 space-y-1">
                <DataRow label="Number" value={txnNo} />
                <DataRow label="Item Name" value={transaction.item_name || 'N/A'} />
                <DataRow label="Truck Number" value={transaction.truck_no} />
                <DataRow label="Party Name" value={transaction.party_name} />
                <DataRow label="Invoice No" value={transaction.invoice_number} />
                <DataRow label="Invoice Date" value={formatDate(transaction.invoice_date)} />
<DataRow 
  label="Invoice Qty" 
  value={
    transaction.invoice_quantity != null
      ? `${formatWeight(transaction.invoice_quantity)}`
      : '—'
  } 
/>                <DataRow label="PO / Do No" value={transaction.po_do_number || '—'} />
                <DataRow label="Transporter" value={transaction.transporter_name} />
                <DataRow label="Mobile No" value={transaction.mobile_number} />
                <DataRow label="Remark - 1" value={remark1} />
                <DataRow label="Remark - 2" value={remark2} />
              </div>
            </div>

            {/* Step-2 Card */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
              <div className="mb-3 border-b border-purple-200 pb-2">
                <h4 className="text-sm font-bold text-purple-700">Step-2</h4>
                <p className="text-xs text-purple-600">WeighBridge • Gate Pass • Campus</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <StageItem 
                  label="First WeighBridge" 
                  timestamp={transaction.first_weigh_at}
                  completed={status.first_weighbridge}
                  approver={transaction.first_weigh_confirmed_by_name}
                />
                <StageItem 
                  label="Second WeighBridge" 
                  timestamp={transaction.second_weigh_at}
                  completed={status.second_weighbridge}
                  approver={transaction.second_weigh_confirmed_by_name}
                />
                <StageItem 
                  label="Gate Pass" 
                  timestamp={transaction.gate_pass_finalized_at}
                  completed={status.gate_pass}
                  approver={transaction.gate_pass_confirmed_by_name}
                />
                <StageItem 
                  label="Campus In" 
                  timestamp={transaction.campus_in_at}
                  completed={status.campus_in}
                  approver={transaction.campus_in_confirmed_by_name}
                />
                <StageItem 
                  label="Campus Out" 
                  timestamp={transaction.campus_out_at}
                  completed={status.campus_out}
                  approver={transaction.campus_out_confirmed_by_name}
                />
              </div>

              <div className="border-t border-purple-200 pt-3 space-y-1">
                <DataRow label="ID name" value={`TXN-${transaction.transaction_id}`} />
                <DataRow label="Item Name" value={transaction.item_name || 'N/A'} />
                <DataRow label="Transaction Number" value={txnNo} />
                <DataRow label="Truck Number" value={transaction.truck_no} />
                <DataRow label="Party Name" value={transaction.party_name} />
                <DataRow label="First Weight" value={formatWeight(transaction.first_weight)} />
                <DataRow label="Second Weight" value={formatWeight(transaction.second_weight)} />
                <DataRow label="Net Weight" value={formatWeight(transaction.net_weight)} />
                <DataRow label="Remark - 1" value={remark1} />
                <DataRow label="Remark - 2" value={remark2} />
              </div>
            </div>

            {/* Step-3 Card */}
            <div className="rounded-xl border border-pink-200 bg-pink-50/50 p-4 shadow-sm">
              <div className="mb-3 border-b border-pink-200 pb-2">
                <h4 className="text-sm font-bold text-pink-700">Step-3</h4>
                <p className="text-xs text-pink-600">Campus In • Campus Out</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <StageItem 
                  label="Campus In" 
                  timestamp={transaction.campus_in_at}
                  completed={status.campus_in}
                  approver={transaction.campus_in_confirmed_by_name}
                />
                <StageItem 
                  label="Campus Out" 
                  timestamp={transaction.campus_out_at}
                  completed={status.campus_out}
                  approver={transaction.campus_out_confirmed_by_name}
                />
              </div>

              <div className="border-t border-pink-200 pt-3 space-y-1">
                <DataRow label="Date&Time" value={formatDateTime(transaction.created_at)} />
                <DataRow label="ID name" value={`TXN-${transaction.transaction_id}`} />
                <DataRow label="Transaction Number" value={txnNo} />
                <DataRow label="Truck Number" value={transaction.truck_no} />
                <DataRow label="Item Name" value={transaction.item_name || 'N/A'} />
                <DataRow label="Mobile No" value={transaction.mobile_number} />
                <DataRow label="Remark - 1" value={remark1} />
                <DataRow label="Remark - 2" value={remark2} />
              </div>
            </div>

            {/* View Card */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <div className="mb-3 border-b border-blue-200 pb-2">
                <h4 className="text-sm font-bold text-blue-700">View</h4>
                <p className="text-xs text-blue-600">Transaction Summary</p>
              </div>
              
              <div className="space-y-1">
                <DataRow label="Number" value={txnNo} />
                <DataRow label="Transaction" value={transaction.transaction_type} />
                <DataRow label="Item Name" value={transaction.item_name || 'N/A'} />
                <DataRow label="Truck Number" value={transaction.truck_no} />
                <DataRow label="Party Name" value={transaction.party_name} />
                <DataRow label="Invoice No" value={transaction.invoice_number} />
                <DataRow label="Invoice Date" value={formatDate(transaction.invoice_date)} />
<DataRow 
  label="Invoice Qty" 
  value={
    transaction.invoice_quantity != null
      ? `${formatWeight(transaction.invoice_quantity)}`
      : '—'
  } 
/>                <DataRow label="PO / Do No" value={transaction.po_do_number || '—'} />
                <DataRow label="Transporter" value={transaction.transporter_name} />
                <DataRow label="Mobile No" value={transaction.mobile_number} />
                <DataRow label="Remark - 1" value={remark1} />
                <DataRow label="Remark - 2" value={remark2} />
                <div className="border-t border-blue-200 my-2 pt-2">
  <DataRow label="First Weight" value={formatWeight(transaction.first_weight)} />
  <DataRow label="Second Weight" value={formatWeight(transaction.second_weight)} />
  <DataRow label="Net Weight" value={formatWeight(transaction.net_weight)} />
</div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-none flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-zinc-200 px-6 py-4 bg-zinc-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition"
          >
            Close
          </button>
          <button
            onClick={() => onPrint?.(transaction, 'entry')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition"
          >
            <PrinterIcon className="h-4 w-4" /> Entry Pass
          </button>
          <button
            onClick={() => onPrint?.(transaction, 'gatepass')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <PrinterIcon className="h-4 w-4" /> Gate Pass
          </button>
        </div>
      </div>
    </div>
  );
}
