export interface AnmsHeatAnalysis {
  id: string;
  heatNo: string;
  c: string;
  mn: string;
  s: string;
  p: string;
  si: string;
  al: string;
  cr: string;
  cu: string;
  ni: string;
  ti: string;
  v: string;
  nb: string;
  mo: string;
  n: string;
  mae: string;
  ce: string;
}

export interface AnmsMechanicalProperty {
  id: string;
  heatNo: string;
  itemNo: string;
  batchId: string;
  thk: string;
  wid: string;
  qtyNet: string;
  ys: string;
  uts: string;
  el: string;
  bend: string;
}

export interface AnmsMtcRecord {
  id: string;
  testCertificateNo: string;
  saleOrderNo: string;
  testCertificateDate: string;
  salesOrderDate: string;
  invoiceNo: string;
  vehicleNo: string;
  productType: string;
  internalGrade: string;
  specification: string;
  equivalentSpecification: string;
  customerTo: string;
  supplierManufacturer: string;
  make: string;
  remarks: string;
  heatAnalysis: AnmsHeatAnalysis[];
  mechanicalProperties: AnmsMechanicalProperty[];
}

export const PRODUCT_TYPES = ['HR-COIL', 'HR-PLATE', 'CR-COIL', 'PLATE'] as const;
export const SPECIFICATIONS = [
  'IS 2062 E 250 A 2011',
  'IS 2062 E 250 B 2011',
  'IS 2062 E 350 C 2011',
  'IS 2062 E 410 2011',
] as const;
export const EQUIVALENT_SPECS = [
  'EN_10025_2_S235_JR',
  'EN_10025_2_S355_J2_N',
  'ASTM_A36',
] as const;
export const AMNS_SUPPLIERS = [
  'ArcelorMittal Nippon Steel India Ltd.',
  'AM/NS India — Hazira',
  'AM/NS India — Kalinganagar',
] as const;
export const AMNS_MAKES = ['AM/NS INDIA', 'AMNS'] as const;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const defaultCustomerTo = (companyName = 'JAGDAMBA PROFILE', address = '') => {
  if (address.trim()) return address.trim();
  return [
    companyName.toUpperCase(),
    '504/1/A, G.I.D.C. MAKARPURA',
    '390010',
    'VADODARA 06',
    'India.',
  ].join('\n');
};

export const emptyHeatRow = (heatNo = ''): AnmsHeatAnalysis => ({
  id: uid(),
  heatNo,
  c: '', mn: '', s: '', p: '', si: '', al: '', cr: '', cu: '',
  ni: '', ti: '', v: '', nb: '', mo: '', n: '', mae: '', ce: '',
});

export const emptyMechRow = (heatNo = ''): AnmsMechanicalProperty => ({
  id: uid(),
  heatNo,
  itemNo: '',
  batchId: '',
  thk: '',
  wid: '',
  qtyNet: '',
  ys: '',
  uts: '',
  el: '',
  bend: 'OK',
});

export const emptyAnmsMtc = (companyName?: string, companyAddress?: string): AnmsMtcRecord => ({
  id: '',
  testCertificateNo: '',
  saleOrderNo: '',
  testCertificateDate: new Date().toISOString().split('T')[0],
  salesOrderDate: new Date().toISOString().split('T')[0],
  invoiceNo: '',
  vehicleNo: '',
  productType: 'HR-COIL',
  internalGrade: '',
  specification: 'IS 2062 E 350 C 2011',
  equivalentSpecification: 'EN_10025_2_S355_J2_N',
  customerTo: defaultCustomerTo(companyName, companyAddress),
  supplierManufacturer: '',
  make: 'AM/NS INDIA',
  remarks: '',
  heatAnalysis: [emptyHeatRow()],
  mechanicalProperties: [emptyMechRow()],
});

export const sumQtyNet = (rows: AnmsMechanicalProperty[]) =>
  rows.reduce((sum, r) => sum + (parseFloat(r.qtyNet) || 0), 0);

export const fmtQtyNet = (n: number) => (Number.isFinite(n) ? n.toFixed(3) : '0.000');
