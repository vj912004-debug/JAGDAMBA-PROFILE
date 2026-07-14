import type { PurchaseOrder, PurchaseReceipt, TransportBillRecord } from '../store/AppContext';

export const fmtKg = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function parseISODate(s: string): Date | null {
  if (!s) return null;
  const iso = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(`${iso}T12:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function fmtDisplayDate(s: string) {
  const d = parseISODate(s);
  return d ? d.toLocaleDateString('en-GB') : s;
}

export function isoDate(s: string) {
  const d = parseISODate(s);
  return d ? d.toISOString().split('T')[0] : '';
}

export function pendingDays(grnDate: string, ref = new Date()) {
  const d = parseISODate(grnDate);
  if (!d) return 0;
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const grnDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.max(0, Math.floor((refDay.getTime() - grnDay.getTime()) / 86_400_000));
}

export function receiptWeightKg(
  receiptId: string,
  purchaseReceipts: PurchaseReceipt[],
  purchaseOrders: PurchaseOrder[],
) {
  const pr = purchaseReceipts.find(r => r.id === receiptId);
  if (!pr) return 0;
  const po = purchaseOrders.find(p => p.id === pr.poId);
  if (!po) return 0;
  if (pr.items?.length) {
    return pr.items.reduce((sum, ri) => {
      const item = po.items.find(i => i.id === ri.itemId);
      if (!item) return sum;
      const perPiece = item.nos ? item.kg / item.nos : 0;
      return sum + perPiece * ri.receivedQty;
    }, 0);
  }
  const totalNos = po.items.reduce((s, i) => s + (i.nos || 0), 0);
  return po.totalKg ? (po.totalKg / Math.max(1, totalNos)) * pr.receivedQty : 0;
}

export interface EnrichedReceipt {
  id: string;
  grnNo: string;
  grnDate: string;
  grnDateIso: string;
  supplierName: string;
  fromLocation: string;
  vehicleNo: string;
  transportName: string;
  materialGrade: string;
  netWeightKg: number;
  billed: boolean;
  transportBillId?: string;
  po?: PurchaseOrder;
}

export function enrichReceipts(
  purchaseReceipts: PurchaseReceipt[],
  purchaseOrders: PurchaseOrder[],
): EnrichedReceipt[] {
  return purchaseReceipts.map(pr => {
    const po = purchaseOrders.find(p => p.id === pr.poId);
    const grades = po?.items?.map(i => i.grade).filter(Boolean) ?? [];
    const materialGrade = Array.from(new Set(grades)).join(', ') || po?.make || '-';
    return {
      id: pr.id,
      grnNo: pr.grnNumber || po?.poNumber || pr.id.slice(-6),
      grnDate: fmtDisplayDate(pr.date),
      grnDateIso: isoDate(pr.date),
      supplierName: po?.supplierName || '-',
      fromLocation: po?.location || '-',
      vehicleNo: pr.vehicleNo || po?.transportNumber || '-',
      transportName: pr.transporterName || po?.transportName || '-',
      materialGrade,
      netWeightKg: receiptWeightKg(pr.id, purchaseReceipts, purchaseOrders),
      billed: Boolean(pr.transportBillId),
      transportBillId: pr.transportBillId,
      po,
    };
  });
}

export function inDateRange(iso: string, from: string, to: string) {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

export interface RegisterFilters {
  fromDate: string;
  toDate: string;
  transportName: string;
  vehicleNo: string;
  billNo: string;
}

export function filterTransportBills(bills: TransportBillRecord[], f: RegisterFilters) {
  return bills.filter(b => {
    const iso = isoDate(b.billDate);
    if (!inDateRange(iso, f.fromDate, f.toDate)) return false;
    if (f.transportName !== 'All' && b.transportName.toUpperCase() !== f.transportName.toUpperCase()) return false;
    if (f.vehicleNo !== 'All' && (b.vehicleNo || '').toUpperCase() !== f.vehicleNo.toUpperCase()) return false;
    if (f.billNo !== 'All' && b.billNo !== f.billNo) return false;
    return true;
  }).sort((a, b) => (isoDate(b.billDate) > isoDate(a.billDate) ? 1 : -1));
}

export interface SummaryRow {
  transportName: string;
  totalTrips: number;
  totalGrn: number;
  totalWeightKg: number;
  avgWeightPerTrip: number;
}

export function computeTransportSummary(
  bills: TransportBillRecord[],
  filters: Pick<RegisterFilters, 'fromDate' | 'toDate' | 'transportName'>,
): SummaryRow[] {
  const filtered = filterTransportBills(bills, {
    ...filters,
    vehicleNo: 'All',
    billNo: 'All',
  });

  const map = new Map<string, SummaryRow>();
  for (const b of filtered) {
    const name = b.transportName || '—';
    const row = map.get(name) ?? {
      transportName: name,
      totalTrips: 0,
      totalGrn: 0,
      totalWeightKg: 0,
      avgWeightPerTrip: 0,
    };
    row.totalTrips += 1;
    row.totalGrn += b.receiptIds.length;
    row.totalWeightKg += b.totalWeightKg;
    map.set(name, row);
  }

  return Array.from(map.values())
    .map(r => ({
      ...r,
      avgWeightPerTrip: r.totalTrips ? Math.round(r.totalWeightKg / r.totalTrips) : 0,
    }))
    .sort((a, b) => b.totalWeightKg - a.totalWeightKg);
}

export interface PendingBillRow extends EnrichedReceipt {
  pendingDays: number;
}

export interface PendingFilters {
  fromDate: string;
  toDate: string;
  transportName: string;
  vehicleNo: string;
  supplierName: string;
}

export function computePendingBillRows(
  receipts: EnrichedReceipt[],
  filters: PendingFilters,
): PendingBillRow[] {
  return receipts
    .filter(r => !r.billed)
    .filter(r => inDateRange(r.grnDateIso, filters.fromDate, filters.toDate))
    .filter(r => filters.transportName === 'All' || r.transportName.toUpperCase() === filters.transportName.toUpperCase())
    .filter(r => filters.vehicleNo === 'All' || r.vehicleNo.toUpperCase() === filters.vehicleNo.toUpperCase())
    .filter(r => filters.supplierName === 'All' || r.supplierName.toUpperCase() === filters.supplierName.toUpperCase())
    .map(r => ({ ...r, pendingDays: pendingDays(r.grnDateIso) }))
    .sort((a, b) => b.pendingDays - a.pendingDays);
}

export function billDetailLines(
  bill: TransportBillRecord,
  receipts: EnrichedReceipt[],
) {
  const byId = new Map(receipts.map(r => [r.id, r]));
  return bill.receiptIds.map((id, i) => {
    const r = byId.get(id);
    return {
      sr: i + 1,
      grnNo: r?.grnNo || id.slice(-6),
      grnDate: r?.grnDate || '-',
      supplierName: r?.supplierName || '-',
      fromLocation: r?.fromLocation || '-',
      materialGrade: bill.billAgainst || r?.materialGrade || '-',
      netWeightKg: r?.netWeightKg ?? 0,
    };
  });
}
