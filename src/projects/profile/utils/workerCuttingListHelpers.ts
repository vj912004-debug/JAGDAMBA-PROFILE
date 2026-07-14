import type { CuttingAllocationRecord } from '../store/AppContext';

export interface WorkerCuttingListPrintRow {
  item: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  nos: number;
  party: string;
}

export interface WorkerCuttingListPrintData {
  allocationNo: string;
  allocationDate: string;
  workerName: string;
  machineNo: string;
  priority: string;
  rows: WorkerCuttingListPrintRow[];
}

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
};

const fmtNum = (v: string | number, dec = 2) => {
  const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
  if (!n) return '';
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

export function buildWorkerCuttingListPrintData(
  allocations: CuttingAllocationRecord[],
  workerName: string,
  machineNo: string,
  priority: string,
  asOnDate: string,
  options?: { pendingOnly?: boolean },
): WorkerCuttingListPrintData | null {
  const pendingOnly = options?.pendingOnly ?? false;
  const rows: WorkerCuttingListPrintRow[] = [];
  let latestAlloc: CuttingAllocationRecord | null = null;

  for (const alloc of allocations) {
    for (const r of alloc.rows) {
      if (r.karigar !== workerName || r.nos <= 0) continue;
      const balance = r.nos - (r.readyQty || 0);
      const nos = pendingOnly ? balance : r.nos;
      if (pendingOnly && nos <= 0) continue;

      if (!latestAlloc || (alloc.entryDate || '') >= (latestAlloc.entryDate || '')) {
        latestAlloc = alloc;
      }

      rows.push({
        item: r.drawingNo?.trim() || r.itemType || '—',
        grade: r.grade || '—',
        thickness: fmtNum(r.thickness),
        width: r.widthOd || '—',
        length: r.lengthId || '—',
        nos,
        party: alloc.partyName || '—',
      });
    }
  }

  if (rows.length === 0) return null;

  return {
    allocationNo: latestAlloc?.entryNo || '—',
    allocationDate: fmtDate(latestAlloc?.entryDate || asOnDate),
    workerName,
    machineNo,
    priority: priority || 'Normal',
    rows,
  };
}
