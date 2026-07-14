import { getIndianFinancialYearLabel } from './poNumber';

export function formatGRNNumber(sequence: number, date = new Date()): string {
  const fy = getIndianFinancialYearLabel(date);
  return `GRN/${fy}/${String(sequence).padStart(6, '0')}`;
}

export function nextGRNNumberFromExisting(
  receipts: { grnNumber?: string }[],
  date = new Date(),
): string {
  const fy = getIndianFinancialYearLabel(date);
  const prefix = `GRN/${fy}/`;

  const maxNum = receipts.reduce((max, r) => {
    if (!r.grnNumber?.startsWith(prefix)) return max;
    const seq = parseInt(r.grnNumber.slice(prefix.length), 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  return formatGRNNumber(maxNum + 1, date);
}
