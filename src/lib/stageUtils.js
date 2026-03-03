// Stage order: Parking -> Gate In -> First Weighbridge -> Campus In -> Campus Out -> Second Weighbridge -> Gate Pass -> Gate Out
export const STAGES = [
  { key: 'parking', label: 'PARKING', shortLabel: 'Parking' },
  { key: 'gate_in', label: 'GATE IN', shortLabel: 'Gate In' },
  { key: 'first_weighbridge', label: 'FIRST WEIGHBRIDGE', shortLabel: 'First WeighBridge' },
  { key: 'campus_in', label: 'CAMPUS IN', shortLabel: 'Campus In' },
  { key: 'campus_out', label: 'CAMPUS OUT', shortLabel: 'Campus out' },
  { key: 'second_weighbridge', label: 'SECOND WEIGHBRIDGE', shortLabel: 'Second WeighBridge' },
  { key: 'gate_pass', label: 'GATE PASS', shortLabel: 'Gate Pass' },
  { key: 'gate_out', label: 'GATE OUT', shortLabel: 'Gate Out' },
];

export function getStageStatus(txn) {
  return {
    parking: !!txn.parking_confirmed_at,
    gate_in: !!txn.gate_in_at,
    first_weighbridge: !!txn.first_weigh_at,
    campus_in: !!txn.campus_in_at,
    campus_out: !!txn.campus_out_at,
    second_weighbridge: !!txn.second_weigh_at,
    gate_pass: !!txn.gate_pass_finalized_at,
    gate_out: !!txn.gate_out_at,
  };
}

export function getNextStageToConfirm(txn) {
  if (txn?.is_damaged) return null;
  const status = getStageStatus(txn);
  const next = STAGES.find((s) => !status[s.key]);
  return next?.key ?? null;
}

export function getStageTimestamps(txn) {
  return [
    { key: 'parking', label: 'PARKING', at: txn.parking_confirmed_at ?? txn.created_at },
    { key: 'gate_in', label: 'GATE IN', at: txn.gate_in_at },
    { key: 'first_weighbridge', label: 'FIRST WEIGHBRIDGE', at: txn.first_weigh_at },
    { key: 'campus_in', label: 'CAMPUS IN', at: txn.campus_in_at },
    { key: 'campus_out', label: 'CAMPUS OUT', at: txn.campus_out_at },
    { key: 'second_weighbridge', label: 'SECOND WEIGHBRIDGE', at: txn.second_weigh_at },
    { key: 'gate_pass', label: 'GATE PASS', at: txn.gate_pass_finalized_at },
    { key: 'gate_out', label: 'GATE OUT', at: txn.gate_out_at },
  ];
}
