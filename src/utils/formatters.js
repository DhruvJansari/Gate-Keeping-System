export function formatWeight(weight) {
  if (weight === null || weight === undefined || weight === '') return '—';
  const num = parseFloat(weight);
  if (isNaN(num)) return weight;
  
  // Create a formatter that allows up to 2 decimal places but removes them if they are zero
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
