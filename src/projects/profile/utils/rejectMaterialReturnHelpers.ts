import { getIndianFinancialYearLabel } from './poNumber';

export type DebitNoteStatus = 'Pending' | 'Received';

export interface RejectMaterialReturnRecord {
  id: string;
  entryNo: string;
  entryDate: string;
  partyName: string;
  itemGrade: string;
  nos: number;
  kg: number;
  debitNoteStatus: DebitNoteStatus;
  billNo: string;
  billDate: string;
  partyChallanNo: string;
  sizeDetail: string;
  remark: string;
  savedAt: string;
}

export function formatRMREntryNumber(sequence: number, date = new Date()): string {
  const fy = getIndianFinancialYearLabel(date);
  return `RMR/${fy}/${String(sequence).padStart(6, '0')}`;
}

export function nextRMREntryNumberFromExisting(
  entries: { entryNo?: string }[],
  date = new Date(),
): string {
  const fy = getIndianFinancialYearLabel(date);
  const prefix = `RMR/${fy}/`;

  const maxNum = entries.reduce((max, row) => {
    if (!row.entryNo?.startsWith(prefix)) return max;
    const seq = parseInt(row.entryNo.slice(prefix.length), 10);
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);

  return formatRMREntryNumber(maxNum + 1, date);
}

export const fmtKg = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const fmtDisplayDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
};
