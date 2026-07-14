import { parseNum } from '../components/NumericInput';
import type { JobWorkInwardRecord, JobWorkMaterialRow, JobWorkOutwardRecord } from './jobWorkHelpers';

export interface JobWorkPendingRow {
  id: string;
  partyName: string;
  outwardNo: string;
  outwardDate: string;
  grade: string;
  thickness: number;
  width: number;
  length: number;
  nos: number;
  outwardKg: number;
  receivedKg: number;
  pendingKg: number;
}

const rowKey = (grade: string, thickness: number, width: number, length: number) =>
  `${grade}|${parseNum(thickness)}|${parseNum(width)}|${parseNum(length)}`;

function parseISODate(s: string): string {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

function fmtDisplayDate(s: string) {
  const iso = parseISODate(s);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return s;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildReceivedMap(inwards: JobWorkInwardRecord[]) {
  const map = new Map<string, number>();
  for (const inward of inwards) {
    for (const row of inward.rows) {
      const key = `${inward.againstOutwardNo}|${rowKey(row.grade, row.thickness, row.width, row.length)}`;
      map.set(key, (map.get(key) || 0) + parseNum(row.receivedKg));
    }
  }
  return map;
}

export function computeJobWorkPendingRows(
  outwards: JobWorkOutwardRecord[],
  inwards: JobWorkInwardRecord[],
  filters: {
    fromDate: string;
    toDate: string;
    party: string;
    grade: string;
    showPending: 'pending' | 'all';
  },
): JobWorkPendingRow[] {
  const receivedMap = buildReceivedMap(inwards);
  const rows: JobWorkPendingRow[] = [];

  for (const outward of outwards) {
    const isoDate = parseISODate(outward.outwardDate);
    if (filters.fromDate && isoDate < filters.fromDate) continue;
    if (filters.toDate && isoDate > filters.toDate) continue;
    if (filters.party !== 'All' && outward.partyName !== filters.party) continue;

    for (const row of outward.rows) {
      if (!row.grade) continue;
      if (filters.grade !== 'All' && row.grade !== filters.grade) continue;

      const outwardKg = parseNum(row.actualKg) || parseNum(row.calculatedKg);
      if (outwardKg <= 0) continue;

      const key = `${outward.outwardNo}|${rowKey(row.grade, row.thickness, row.width, row.length)}`;
      const receivedKg = parseFloat((receivedMap.get(key) || 0).toFixed(3));
      const pendingKg = parseFloat(Math.max(0, outwardKg - receivedKg).toFixed(3));

      if (filters.showPending === 'pending' && pendingKg <= 0) continue;

      rows.push({
        id: `${outward.id}-${row.id}`,
        partyName: outward.partyName,
        outwardNo: outward.outwardNo,
        outwardDate: fmtDisplayDate(outward.outwardDate),
        grade: row.grade,
        thickness: parseNum(row.thickness),
        width: parseNum(row.width),
        length: parseNum(row.length),
        nos: parseNum(row.nos) || 1,
        outwardKg,
        receivedKg,
        pendingKg,
      });
    }
  }

  return rows.sort((a, b) => a.partyName.localeCompare(b.partyName) || a.outwardNo.localeCompare(b.outwardNo));
}

export function jobWorkPendingTotals(rows: JobWorkPendingRow[]) {
  return {
    outwardKg: rows.reduce((s, r) => s + r.outwardKg, 0),
    receivedKg: rows.reduce((s, r) => s + r.receivedKg, 0),
    pendingKg: rows.reduce((s, r) => s + r.pendingKg, 0),
  };
}

export function fmtKgReport(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
