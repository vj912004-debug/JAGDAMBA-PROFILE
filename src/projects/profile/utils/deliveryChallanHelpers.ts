import type {
  ChallanRecord,
  CompanyProfileData,
  DispatchRecord,
  Order,
  OrderLineItem,
  PartyMaster,
} from '../store/AppContext';
import {
  inferItemTypeFromName,
  type SpecDetails,
} from '../config/itemTypeConfig';

export interface DeliveryChallanPrintRow {
  item: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  nos: string | number;
  actualWeight: string;
  rate: string;
}

export interface DeliveryChallanPrintData {
  challanNo: string;
  challanDate: string;
  vehicleNo: string;
  driverName: string;
  driverMobile: string;
  soNo: string;
  partyName: string;
  deliveryAddress: string;
  partyPONo: string;
  partyPODate: string;
  remark: string;
  gstNo: string;
  loadingCharge: string;
  transportCharge: string;
  rows: DeliveryChallanPrintRow[];
  totalNos: number;
  totalKg: string;
  /** Detected item type key (e.g. "MS_PLATE") — drives the dynamic spec box */
  itemTypeKey?: string;
  /** Resolved spec field values for the first representative order item */
  specDetails?: SpecDetails;
}

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB');
};

const fmtDec = (n: number, dec: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const parseThickness = (raw: string) => {
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return n ? fmtDec(n, 2) : '—';
};

const parseFromRemark = (remark: string, key: 'Driver' | 'Mob') => {
  const re = new RegExp(`${key}:\\s*([^|]+)`, 'i');
  return remark.match(re)?.[1]?.trim() || '';
};

const mapItemRow = (item: OrderLineItem): DeliveryChallanPrintRow => {
  const qty = item.quantity || 0;
  const perPiece = qty ? (item.totalWeight || 0) / qty : 0;
  const weight = item.unitType === 'Kg'
    ? item.quantity
    : item.totalWeight || perPiece * qty;

  return {
    item: item.partName?.trim() || item.drawingNumber?.trim() || '—',
    grade: item.materialGrade || '—',
    thickness: parseThickness(item.thickness),
    width: item.width || item.outerDiameter || item.innerDiameter || '—',
    length: item.length || item.innerDiameter || '—',
    nos: item.unitType === 'Nos' ? item.quantity : '—',
    actualWeight: weight > 0 ? fmtDec(weight, 3) : '—',
    rate: item.rate > 0 ? fmtDec(item.rate, 2) : '—',
  };
};

export function buildDeliveryChallanPrintData(
  challan: ChallanRecord,
  order: Order | undefined,
  parties: PartyMaster[],
  dispatches: DispatchRecord[],
  companyProfile?: CompanyProfileData,
): DeliveryChallanPrintData {
  const dispatch = dispatches.find((d) => d.orderNo === challan.orderNo);
  const party = parties.find((p) => p.partyName === challan.partyName);
  const remark = dispatch?.remark || order?.remark || '';
  const items = order?.items || [];
  const rows = items.map(mapItemRow);

  const totalNos = items.reduce(
    (sum, item) => (item.unitType === 'Nos' ? sum + item.quantity : sum),
    0,
  );
  const totalKgNum = items.reduce((sum, item) => {
    if (item.unitType === 'Kg') return sum + item.quantity;
    return sum + (item.totalWeight || 0);
  }, 0);

  const loading = order?.loadingUnloadingCharges;
  const transport = order?.transportationCharges;

  // ── Resolve item type & spec details from the first representative order item ──
  const firstItem = items[0];
  const rawItemName = firstItem?.partName?.trim() || '';
  const detectedConfig = inferItemTypeFromName(rawItemName);
  const specDetails: SpecDetails | undefined = firstItem
    ? {
        size:          firstItem.plateSize     || '',
        thickness:     firstItem.thickness     || '',
        width:         firstItem.width         || firstItem.outerDiameter || '',
        length:        firstItem.length        || firstItem.innerDiameter || '',
        grade:         firstItem.materialGrade || '',
        weight:        firstItem.totalWeight   ?? '',
        diameter:      firstItem.outerDiameter || '',
        outerDiameter: firstItem.outerDiameter || '',
      }
    : undefined;

  return {
    challanNo: challan.challanNo,
    challanDate: fmtDate(challan.challanDate),
    vehicleNo: dispatch?.vehicleNo || '',
    driverName: parseFromRemark(remark, 'Driver'),
    driverMobile: parseFromRemark(remark, 'Mob'),
    soNo: order?.orderNo || challan.orderNo,
    partyName: challan.partyName,
    deliveryAddress: party?.deliveryAddress || order?.deliveryAddress || party?.address || '',
    partyPONo: order?.customerPONo || '',
    partyPODate: fmtDate(order?.customerPODate || ''),
    remark,
    gstNo: companyProfile?.gst || '24AAJFJ9056B1ZP',
    loadingCharge: loading && loading > 0 ? fmtDec(loading, 2) : '—',
    transportCharge: transport && transport > 0 ? fmtDec(transport, 2) : '—',
    rows,
    totalNos,
    totalKg: totalKgNum > 0 ? fmtDec(totalKgNum, 3) : '—',
    itemTypeKey: detectedConfig?.key,
    specDetails,
  };
}

