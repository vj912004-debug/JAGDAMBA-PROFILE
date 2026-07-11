import type { PurchaseOrder } from '../store/AppContext';
import {
  inferItemTypeFromName,
  type SpecDetails,
} from '../config/itemTypeConfig';

export type PoCompanyBrand = 'jagdamba' | 'shree';

export const PO_COMPANY_BRANDS: Record<PoCompanyBrand, {
  titleNavy: string;
  titleOrange: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  signFor: string;
}> = {
  jagdamba: {
    titleNavy: 'JAGDAMBA',
    titleOrange: 'PROFILE',
    address: '504/1A GIDC, Makarpura, Vadodara - 390010, Gujarat',
    phone: '9824025001, 9824917250',
    email: 'jagdambaprofile@gmail.com',
    gst: '24AJGPP9863R1Z5',
    signFor: 'JAGDAMBA PROFILE',
  },
  shree: {
    titleNavy: 'SHREE JAGDAMBA',
    titleOrange: 'STEEL PROFILES',
    address: '503/1A GIDC, Makarpura, Vadodara - 390010',
    phone: '9824025001, 9824917250',
    email: 'jagdambaprofile@gmail.com',
    gst: '24ANGPP6200L1Z0',
    signFor: 'SHREE JAGDAMBA STEEL PROFILES',
  },
};

function splitIntoAddressLines(raw: string): [string, string, string, string] {
  const text = raw.replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
  if (!text) return ['', '', '', ''];
  const parts = text.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [parts[0] || '', '', '', ''];
  if (parts.length === 2) return [parts[0], parts[1], '', ''];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], ''];
  const q = Math.ceil(parts.length / 3);
  return [
    parts.slice(0, q).join(', '),
    parts.slice(q, q * 2).join(', '),
    parts.slice(q * 2).join(', '),
    '',
  ];
}

export interface PurchaseOrderPrintExtras {
  contactPerson?: string;
  inquiryQuotationNo?: string;
  deliveryTerms?: string;
  deliveryRequiredBy?: string;
  inspection?: string;
  loadingCharge?: number;
  transportCharge?: number;
  gstRate?: number;
  roundOff?: number;
}

export interface PurchaseOrderPrintData {
  poNumber: string;
  date: string;
  supplierName: string;
  address: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  gstNo: string;
  email: string;
  phone: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryRequiredBy: string;
  placeOfDelivery: string;
  items: PurchaseOrder['items'];
  make: string;
  utLevel: string;
  tcText: string;
  transportName: string;
  vehicleNo: string;
  totalKg: number;
  loadingCharge: number;
  transportCharge: number;
  subTotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  /** Detected item type key for the first PO line item */
  itemTypeKey?: string;
  /** Resolved spec field values for the first PO line item */
  specDetails?: SpecDetails;
}

export function buildPurchaseOrderPrintData(
  po: PurchaseOrder,
  extras: PurchaseOrderPrintExtras = {},
): PurchaseOrderPrintData {
  const [address, addressLine2, addressLine3, addressLine4] = splitIntoAddressLines(po.supplierAddress || '');
  const gstRate = extras.gstRate ?? 18;
  const subTotal = po.totalAmount || 0;
  const gstAmount = Math.round(subTotal * gstRate / 100 * 100) / 100;
  const loadingCharge = extras.loadingCharge ?? 0;
  const transportCharge = extras.transportCharge ?? 0;
  const roundOff = extras.roundOff ?? 0;
  const grandTotal = Math.round((subTotal + gstAmount + loadingCharge + transportCharge + roundOff) * 100) / 100;
  const tcUpper = (po.tc || '').toUpperCase();
  const tcYes = tcUpper === 'YES' || tcUpper === 'Y';
  const tcNo = tcUpper === 'NO' || tcUpper === 'N';
  const tcText = tcYes ? 'YES' : tcNo ? 'NO' : (po.tc || '');

  // ── Item type detection for the spec box ──
  const firstPoItem = (po.items || [])[0];
  const rawItemName = firstPoItem?.itemName?.trim() || '';
  const detectedConfig = inferItemTypeFromName(rawItemName);
  const specDetails: SpecDetails | undefined = firstPoItem
    ? {
        grade:         firstPoItem.grade          || '',
        thickness:     firstPoItem.thickness       || '',
        width:         firstPoItem.width           || '',
        length:        firstPoItem.length          || '',
        weight:        firstPoItem.kg              || '',
        outerDiameter: '',
        diameter:      '',
        size:          '',
      }
    : undefined;

  return {
    poNumber: po.poNumber,
    date: po.date,
    supplierName: po.supplierName,
    address,
    addressLine2,
    addressLine3,
    addressLine4,
    gstNo: po.supplierGST || '',
    email: po.supplierEmail || '',
    phone: po.supplierMobile || '',
    paymentTerms: po.paymentTerms || '',
    deliveryTerms: extras.deliveryTerms || po.transportName || '',
    deliveryRequiredBy: extras.deliveryRequiredBy || '',
    placeOfDelivery: po.deliveryAddress || po.location || '',
    items: po.items || [],
    make: po.make || '',
    utLevel: po.utLevel || '',
    tcText,
    transportName: po.transportName || '',
    vehicleNo: po.transportNumber || '',
    totalKg: po.totalKg || 0,
    loadingCharge,
    transportCharge,
    subTotal,
    gstRate,
    gstAmount,
    grandTotal,
    itemTypeKey: detectedConfig?.key,
    specDetails,
  };
}
