import type { PurchaseOrder, PurchaseReceipt } from '../store/AppContext';

export interface POItemPending {
  poId: string;
  poNumber: string;
  poDate: string;
  supplier: string;
  itemId: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  poNos: number;
  receivedNos: number;
  pendingNos: number;
  poKg: number;
  receivedKg: number;
  pendingKg: number;
  rate: number;
  pendingAmount: number;
}

/** Sum GRN received nos per PO line item (supports legacy receipts without line breakdown). */
export function buildReceivedByItem(
  purchaseOrders: PurchaseOrder[],
  purchaseReceipts: PurchaseReceipt[],
): Map<string, number> {
  const map = new Map<string, number>();

  purchaseReceipts.forEach(r => {
    const po = purchaseOrders.find(p => p.id === r.poId);
    if (!po || r.receivedQty <= 0) return;

    if (r.items?.length) {
      r.items.forEach(ri => {
        if (ri.receivedQty > 0) {
          map.set(ri.itemId, (map.get(ri.itemId) || 0) + ri.receivedQty);
        }
      });
      return;
    }

    if (po.items.length === 1) {
      const id = po.items[0].id;
      map.set(id, (map.get(id) || 0) + r.receivedQty);
      return;
    }

    // Legacy: allocate receipt qty to PO lines in order (FIFO)
    let remaining = r.receivedQty;
    for (const item of po.items) {
      if (remaining <= 0) break;
      const ordered = item.nos || 0;
      const already = map.get(item.id) || 0;
      const room = Math.max(0, ordered - already);
      const take = Math.min(remaining, room > 0 ? room : remaining);
      map.set(item.id, already + take);
      remaining -= take;
    }
  });

  return map;
}

export function computePOPendingRows(
  purchaseOrders: PurchaseOrder[],
  purchaseReceipts: PurchaseReceipt[],
  filter?: (po: PurchaseOrder, item: PurchaseOrder['items'][0]) => boolean,
): POItemPending[] {
  const receivedByItem = buildReceivedByItem(purchaseOrders, purchaseReceipts);
  const out: POItemPending[] = [];

  purchaseOrders.forEach(po => {
    po.items.forEach(item => {
      if (filter && !filter(po, item)) return;
      const poNos = item.nos || 0;
      const receivedNos = Math.min(poNos, receivedByItem.get(item.id) || 0);
      const pendingNos = Math.max(0, poNos - receivedNos);
      if (pendingNos <= 0 && poNos <= 0) return;

      const perPieceKg = poNos ? item.kg / poNos : 0;
      const d = po.date;

      out.push({
        poId: po.id,
        poNumber: po.poNumber,
        poDate: d,
        supplier: po.supplierName,
        itemId: item.id,
        grade: item.grade,
        thickness: item.thickness,
        width: item.width,
        length: item.length,
        poNos,
        receivedNos,
        pendingNos,
        poKg: item.kg,
        receivedKg: perPieceKg * receivedNos,
        pendingKg: perPieceKg * pendingNos,
        rate: item.rate || 0,
        pendingAmount: perPieceKg * pendingNos * (item.rate || 0),
      });
    });
  });

  return out.filter(r => r.pendingNos > 0);
}
