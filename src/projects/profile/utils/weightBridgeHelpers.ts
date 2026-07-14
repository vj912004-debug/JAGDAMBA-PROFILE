export type WeightBridgePrintData = {
  serialNo: string;
  copyNo: string;
  vehicleNo: string;
  supplierName: string;
  entryDate: string;
  operatorName: string;
  grossWeightKg: number;
  grossDate: string;
  grossTime: string;
  tareWeightKg: number;
  tareDate: string;
  tareTime: string;
  netWeightKg: number;
  charges: number;
  remark: string;
};

export interface WeighbridgeRecord {
  id: string;
  serialNo: string;
  copyNo: string;
  vehicleNo: string;
  supplierName: string;
  entryDate: string;
  operatorName: string;
  grossWeightKg: number;
  grossDate: string;
  grossTime: string;
  tareWeightKg: number;
  tareDate: string;
  tareTime: string;
  netWeightKg: number;
  charges: number;
  remark: string;
  savedAt: string;
}

/** Back-compat for entries saved before layout change */
export function normalizeWeighbridgeRecord(raw: Record<string, unknown>): WeighbridgeRecord {
  if (raw.serialNo != null && raw.serialNo !== '') {
    return raw as unknown as WeighbridgeRecord;
  }
  const gross = Number(raw.firstWeightKg ?? raw.grossWeightKg ?? 0);
  const tare = Number(raw.secondWeightKg ?? raw.tareWeightKg ?? 0);
  const entryDate = String(raw.entryDate ?? raw.ticketDate ?? '').slice(0, 10);
  return {
    id: String(raw.id ?? Date.now()),
    serialNo: String(raw.serialNo ?? raw.ticketNo ?? ''),
    copyNo: String(raw.copyNo ?? ''),
    vehicleNo: String(raw.vehicleNo ?? ''),
    supplierName: String(raw.supplierName ?? raw.partyName ?? ''),
    entryDate,
    operatorName: String(raw.operatorName ?? raw.driverName ?? ''),
    grossWeightKg: gross,
    grossDate: String(raw.grossDate ?? entryDate),
    grossTime: String(raw.grossTime ?? raw.timeIn ?? ''),
    tareWeightKg: tare,
    tareDate: String(raw.tareDate ?? entryDate),
    tareTime: String(raw.tareTime ?? raw.timeOut ?? ''),
    netWeightKg: Number(raw.netWeightKg ?? Math.abs(gross - tare)),
    charges: Number(raw.charges ?? 0),
    remark: String(raw.remark ?? ''),
    savedAt: String(raw.savedAt ?? new Date().toISOString()),
  };
}

export function nextSerialNo(entries: WeighbridgeRecord[]): string {
  const nums = entries
    .map(e => parseInt(e.serialNo, 10))
    .filter(n => !Number.isNaN(n));
  return String(nums.length ? Math.max(...nums) + 1 : 1);
}

export function nextCopyNo(entries: WeighbridgeRecord[]): string {
  const nums = entries
    .map(e => parseInt(e.copyNo, 10))
    .filter(n => !Number.isNaN(n));
  return String(nums.length ? Math.max(...nums) + 1 : 1);
}

export function calcNetWeightKg(gross: number, tare: number): number {
  return Math.abs(gross - tare);
}

export const fmtKg = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

/** Dot-matrix slip — plain kg, no commas (e.g. 30470) */
export const fmtKgSlip = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n));
};

export const fmtRs = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
