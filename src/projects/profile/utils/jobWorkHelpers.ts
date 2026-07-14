import { parseNum } from '../components/NumericInput';

export const calcJobWorkKg = (thickness: number, width: number, length: number, nos: number) =>
  parseFloat(((thickness * width * length * nos * 8) / 1_000_000).toFixed(3));

export const getFinancialYear = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

export const nextJobWorkNo = (prefix: 'OUT' | 'IN', existing: string[], dateStr: string) => {
  const fy = getFinancialYear(dateStr);
  const max = existing.reduce((m, no) => {
    const match = no.match(/(\d{5})$/);
    const n = match ? parseInt(match[1], 10) : 0;
    return Math.max(m, n);
  }, 0);
  return `${prefix}/${fy}/${String(max + 1).padStart(5, '0')}`;
};

export const fmtKg3 = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const fmtAmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface JobWorkMaterialRow {
  id: string;
  grade: string;
  thickness: number;
  width: number;
  length: number;
  nos: number;
  calculatedKg: number;
  actualKg: number;
  receivedKg: number;
  remark: string;
}

export interface JobWorkLabour {
  mtrQty: number;
  pcsQty: number;
  mtrRate: number;
  piercingRate: number;
}

export interface JobWorkOutwardRecord {
  id: string;
  outwardNo: string;
  outwardDate: string;
  partyName: string;
  address: string;
  mobileNo: string;
  partyCuttingName: string;
  vehicleNo: string;
  note: string;
  rows: JobWorkMaterialRow[];
  labour: JobWorkLabour;
  totalCalculatedKg: number;
  totalActualKg: number;
  totalLabour: number;
}

export interface JobWorkInwardRecord {
  id: string;
  inwardNo: string;
  inwardDate: string;
  againstOutwardNo: string;
  outwardDate: string;
  partyName: string;
  address: string;
  mobileNo: string;
  vehicleNo: string;
  note: string;
  rows: JobWorkMaterialRow[];
  labour: JobWorkLabour;
  totalReceivedKg: number;
  totalLabour: number;
}

export const emptyMaterialRow = (): JobWorkMaterialRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  grade: '',
  thickness: 0,
  width: 0,
  length: 0,
  nos: 1,
  calculatedKg: 0,
  actualKg: 0,
  receivedKg: 0,
  remark: '',
});

export const emptyLabour = (): JobWorkLabour => ({
  mtrQty: 0,
  pcsQty: 0,
  mtrRate: 0,
  piercingRate: 0,
});

export const labourAmount = (labour: JobWorkLabour) => {
  const mtrAmt = parseNum(labour.mtrQty) * parseNum(labour.mtrRate);
  const pierceAmt = parseNum(labour.pcsQty) * parseNum(labour.piercingRate);
  return parseFloat((mtrAmt + pierceAmt).toFixed(2));
};

export const hydrateMaterialRow = (row: JobWorkMaterialRow): JobWorkMaterialRow => {
  const t = parseNum(row.thickness);
  const w = parseNum(row.width);
  const l = parseNum(row.length);
  const n = parseNum(row.nos) || 1;
  return { ...row, nos: n, calculatedKg: calcJobWorkKg(t, w, l, n) };
};
