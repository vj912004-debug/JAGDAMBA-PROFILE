import type { Order, Stage, Plate, Usage, PurchaseReceipt, PurchaseOrder, CuttingAllocationRecord } from '../store/AppContext';

export function orderTotalAmount(order: Order): number {
  const items = order.items.reduce((s, i) => s + (i.amount || 0), 0);
  return items + (order.transportationCharges || 0) + (order.loadingUnloadingCharges || 0);
}

export function orderTotalNos(order: Order): number {
  return order.items.reduce((s, i) => s + (i.quantity || 0), 0);
}

export function formatOrderListStatus(stage: Stage): string {
  if (stage === 'Dispatch Done' || stage === 'Challan Done' || stage === 'Payment Pending' || stage === 'Payment Received') {
    return 'Dispatched';
  }
  if (stage === 'Ready') return 'Ready';
  if (['Cutting In Process', 'Production Pending', 'Nesting Done', 'Nesting Pending', 'Drawing Received'].includes(stage)) {
    return 'In Production';
  }
  return 'Pending';
}

export function daysBetween(fromIso: string): number {
  const from = new Date(fromIso);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

export function fmtDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
}

export function fmtINR(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function fmtKg(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ReadyDispatchRow {
  id: string;
  orderId: string;
  itemId: string;
  party: string;
  drawing: string;
  part: string;
  grade: string;
  thk: string;
  size: string;
  nos: number;
  wt: string;
  karigar: string;
  date: string;
}

export function buildReadyForDispatchRows(orders: Order[]): ReadyDispatchRow[] {
  const rows: ReadyDispatchRow[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const ready = Math.max(0, (item.completedQty || 0) - (item.dispatchedQty || 0));
      if (ready <= 0) continue;
      const perPieceWt = item.quantity ? (item.totalWeight || 0) / item.quantity : 0;
      rows.push({
        id: `${order.id}-${item.id}`,
        orderId: order.id,
        itemId: item.id,
        party: order.partyName,
        drawing: item.drawingNumber || '-',
        part: item.partName || '-',
        grade: item.materialGrade || '-',
        thk: item.thickness || '-',
        size: item.plateSize || item.length || '-',
        nos: ready,
        wt: fmtKg(perPieceWt * ready),
        karigar: item.assignedWorker || '-',
        date: fmtDate(item.completedAt || order.orderDate),
      });
    }
  }
  return rows;
}

export function grnSupplierName(receipt: PurchaseReceipt, purchaseOrders: PurchaseOrder[]): string {
  const po = purchaseOrders.find(p => p.id === receipt.poId);
  return po?.supplierName || '-';
}

export function grnGradeSummary(receipt: PurchaseReceipt, purchaseOrders: PurchaseOrder[]): string {
  const po = purchaseOrders.find(p => p.id === receipt.poId);
  if (!po?.items.length) return '-';
  const grades = [...new Set(po.items.map(i => i.grade).filter(Boolean))];
  return grades.slice(0, 2).join(', ') || '-';
}

export function stockReportFromPlates(plates: Plate[], usages: Usage[]) {
  const byGrade = new Map<string, { open: number; inward: number; outward: number }>();
  for (const p of plates) {
    const g = p.grade || 'Other';
    const e = byGrade.get(g) || { open: 0, inward: 0, outward: 0 };
    e.inward += p.initialWeight || 0;
    byGrade.set(g, e);
  }
  for (const u of usages) {
    const plate = plates.find(p => p.id === u.plateId);
    const g = plate?.grade || 'Other';
    const e = byGrade.get(g) || { open: 0, inward: 0, outward: 0 };
    e.outward += u.usedWeight + u.scrapQuantity;
    byGrade.set(g, e);
  }
  return Array.from(byGrade.entries()).map(([grade, v], i) => ({
    id: `sr-${i}`,
    grade,
    open: fmtKg(Math.max(0, v.inward - v.outward)),
    inward: fmtKg(v.inward),
    outward: fmtKg(v.outward),
    close: fmtKg(Math.max(0, v.inward - v.outward)),
  }));
}

export function productionReportFromAllocations(allocs: CuttingAllocationRecord[]) {
  const byKarigar = new Map<string, { alloc: number; done: number }>();
  for (const a of allocs) {
    for (const r of a.rows) {
      if (!r.karigar) continue;
      const e = byKarigar.get(r.karigar) || { alloc: 0, done: 0 };
      e.alloc += r.nos || 0;
      e.done += r.readyQty || 0;
      byKarigar.set(r.karigar, e);
    }
  }
  return Array.from(byKarigar.entries()).map(([karigar, v], i) => {
    const pend = Math.max(0, v.alloc - v.done);
    const eff = v.alloc ? `${Math.round((v.done / v.alloc) * 100)}%` : '-';
    return { id: `pr-${i}`, karigar, alloc: v.alloc, done: v.done, pend, eff };
  });
}
