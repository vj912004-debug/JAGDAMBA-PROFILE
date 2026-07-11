import React, { useLayoutEffect, useRef } from 'react';
import type { PurchaseOrder } from '../store/AppContext';
import {
  PO_PRINT_AREA_ID,
  PO_PRINT_STYLES,
  PO_PRINT_WIDTH_PX,
  PO_PDF_CAPTURE_ID,
  PO_BLANK_PRINT_AREA_ID,
  PO_FONT_LINK,
} from './purchaseOrderPrintStyles';
import {
  PoIconCalendar,
  PoIconCar,
  PoIconCertificate,
  PoIconClipboard,
  PoIconEmail,
  PoIconLocation,
  PoIconPen,
  PoIconPhone,
  PoIconShield,
  PoIconTruck,
  PoIconUser,
  PoIconWeight,
  PoIconWrench,
} from './poPrintIcons';
import { fitPoSheetBodyWhenReady } from '../utils/fitPoPrintLayout';
import { ShreePurchaseOrderPrint } from './ShreePurchaseOrderPrint';
import {
  buildPurchaseOrderPrintData,
  PO_COMPANY_BRANDS,
  type PoCompanyBrand,
  type PurchaseOrderPrintExtras,
  type PurchaseOrderPrintData,
} from './purchaseOrderPrintData';
import { SpecBoxSection } from './SpecBoxSection';

export { PO_PRINT_AREA_ID, PO_PRINT_WIDTH_PX, PO_PDF_CAPTURE_ID, PO_BLANK_PRINT_AREA_ID };
export type { PoCompanyBrand, PurchaseOrderPrintExtras, PurchaseOrderPrintData };
export { buildPurchaseOrderPrintData, PO_COMPANY_BRANDS };

const ROW_COUNT = 8;

const poStylesFor = (areaId: string) =>
  areaId === PO_PRINT_AREA_ID
    ? PO_PRINT_STYLES
    : PO_PRINT_STYLES.replaceAll(`#${PO_PRINT_AREA_ID}`, `#${areaId}`);

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('/') ? iso.split('/').reverse().join('-') + 'T12:00:00' : iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const cell = (v: string | number | undefined) => (v === 0 || v === '0' ? v : v || '');

const TERMS_LEFT = [
  'Goods to be supplied as per specification mentioned.',
  'GST Extra as applicable.',
  'Delivery subject to material availability.',
  'Payment Terms as mutually agreed.',
];

const TERMS_RIGHT = [
  'Material once cut / supplied will not be taken back.',
  'Please mention our Purchase Order No. on all documents.',
  'Test Certificate & Inspection report must be provided with material.',
  'Transport & unloading arrangement shall be as per above terms.',
];

const field = (value: string | undefined, blank: boolean) =>
  blank ? '' : (value || '');

const PanelRow = ({ label, value, blank }: { label: string; value: string; blank: boolean }) => (
  <div className="po-row">
    <span className="label">{label}</span>
    <span className="colon">:</span>
    <span className="fill">{field(value, blank)}</span>
  </div>
);

const SpecRow = ({ icon, label, value, blank }: { icon: React.ReactNode; label: string; value: string; blank: boolean }) => (
  <div className="row2">
    <span className="sqicon">{icon}</span>
    <span className="lbl">{label}</span> : <span className="fillx">{field(value, blank)}</span>
  </div>
);

const SummaryRow = ({ icon, label, value, blank, noBorder }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  blank: boolean;
  noBorder?: boolean;
}) => (
  <div className={`summary-row${noBorder ? ' no-border' : ''}`}>
    <span className="left">
      <span className="sqicon">{icon}</span>
      {label}
    </span>
    <span className="val">{field(value, blank)}</span>
  </div>
);

interface PurchaseOrderPrintProps {
  po?: PurchaseOrder;
  extras?: PurchaseOrderPrintExtras;
  printAreaId?: string;
  blank?: boolean;
  brand?: PoCompanyBrand;
}

const EMPTY_PO: PurchaseOrder = {
  id: '',
  poNumber: '',
  date: '',
  supplierName: '',
  items: [],
  totalKg: 0,
  totalAmount: 0,
  status: 'Pending',
};

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({
  po,
  extras,
  printAreaId = PO_PRINT_AREA_ID,
  blank = false,
  brand = 'jagdamba',
}) => {
  if (brand === 'shree') {
    return (
      <ShreePurchaseOrderPrint
        po={po}
        extras={extras}
        printAreaId={printAreaId}
        blank={blank}
      />
    );
  }

  const company = PO_COMPANY_BRANDS.jagdamba;
  const source = blank || !po ? EMPTY_PO : po;
  const data = buildPurchaseOrderPrintData(source, blank ? {} : extras);
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => data.items[i] ?? null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    void fitPoSheetBodyWhenReady(sheet);
    const t = window.setTimeout(() => void fitPoSheetBodyWhenReady(sheet), 250);
    return () => clearTimeout(t);
  }, [blank, printAreaId, data.poNumber, data.supplierName, data.items.length, data.grandTotal]);

  return (
    <div id={printAreaId}>
      <link rel="stylesheet" href={PO_FONT_LINK} />
      <style>{poStylesFor(printAreaId)}</style>

      <div ref={sheetRef} className="po-sheet page-container">
        <div className="po-edge-top" aria-hidden>
          <div className="stripe-top" />
          <div className="bar-orange top" />
        </div>

        <div className="po-body-wrap">
        <div className="po-body">
          <div className="po-head">
            <div>
              <div className="company-title">
                <span className="navy">{company.titleNavy}</span>{' '}
                <span className="orange">{company.titleOrange}</span>
              </div>
              <div className="contact-info">
                <div>
                  <span className="icon"><PoIconLocation /></span>
                  {company.address}
                </div>
                <div>
                  <span className="icon"><PoIconPhone /></span>
                  <b>Mo. :</b> {company.phone}
                </div>
                <div>
                  <span className="icon"><PoIconEmail /></span>
                  <b>E-mail :</b> {company.email} &nbsp; | &nbsp; <b>GST No. :</b> {company.gst}
                </div>
              </div>
            </div>
            <div className="po-badge">PURCHASE ORDER</div>
          </div>

          <hr className="po-divider" />
          <div className="dots">● ● ●</div>

          <div className="two-col">
            <div className="panel">
              <div className="panel-header">
                <span className="panel-icon"><PoIconUser /></span>
                SUPPLIER DETAIL
              </div>
              <div className="panel-rows">
                <PanelRow label="Supplier" value={data.supplierName} blank={blank} />
                <PanelRow label="Address" value={data.address} blank={blank} />
                <div className="po-row"><span className="label" /><span className="colon" /><span className="fill">{field(data.addressLine2, blank)}</span></div>
                <div className="po-row"><span className="label" /><span className="colon" /><span className="fill">{field(data.addressLine3, blank)}</span></div>
                <div className="po-row"><span className="label" /><span className="colon" /><span className="fill">{field(data.addressLine4, blank)}</span></div>
                <PanelRow label="Mobile No." value={data.phone} blank={blank} />
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-icon"><PoIconClipboard /></span>
                PURCHASE ORDER DETAIL
              </div>
              <div className="panel-rows">
                <PanelRow label="PO No." value={data.poNumber} blank={blank} />
                <PanelRow label="PO Date" value={fmtDate(data.date)} blank={blank} />
                <PanelRow label="Delivery Date" value={fmtDate(data.deliveryRequiredBy)} blank={blank} />
                <PanelRow label="Payment Terms" value={data.paymentTerms} blank={blank} />
                <PanelRow label="Transport Mode" value={data.deliveryTerms || data.transportName} blank={blank} />
                <PanelRow label="Destination" value={data.placeOfDelivery} blank={blank} />
              </div>
            </div>
          </div>

          {/* ── Dynamic item type spec box — auto-hidden when type not detected ── */}
          {!blank && data.itemTypeKey && data.specDetails && (
            <SpecBoxSection
              itemTypeKey={data.itemTypeKey}
              details={data.specDetails}
            />
          )}

          <table className="maintable">
            <thead>
              <tr>
                <th>Sr.<br />No.</th>
                <th>Grade</th>
                <th>Thickness<br />(MM)</th>
                <th>Width<br />(MM)</th>
                <th>Length<br />(MM)</th>
                <th>Nos</th>
                <th>Kg</th>
                <th>Rate<br />(Rs.)</th>
                <th>Amount<br />(Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{blank ? '' : (item?.grade || '')}</td>
                  <td>{blank || !item ? '' : cell(item.thickness)}</td>
                  <td>{blank || !item ? '' : cell(item.width)}</td>
                  <td>{blank || !item ? '' : cell(item.length)}</td>
                  <td>{blank || !item ? '' : cell(item.nos)}</td>
                  <td>{blank || !item ? '' : fmt(item.kg)}</td>
                  <td>{blank || !item ? '' : fmt(item.rate)}</td>
                  <td>{blank || !item ? '' : fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bottom-section">
            <div className="po-spec-box">
              <SpecRow icon={<PoIconShield />} label="Make" value={data.make} blank={blank} />
              <SpecRow icon={<PoIconWrench />} label="UT Level" value={data.utLevel} blank={blank} />
              <SpecRow icon={<PoIconCertificate />} label="Test Certificate" value={data.tcText} blank={blank} />
              <SpecRow icon={<PoIconTruck />} label="Transport Name" value={data.transportName} blank={blank} />
              <SpecRow icon={<PoIconCar />} label="Vehicle No." value={data.vehicleNo} blank={blank} />
            </div>

            <div className="summary-box">
              <SummaryRow icon={<PoIconWeight />} label="Total Kg" value={blank ? '' : fmt(data.totalKg)} blank={blank} />
              <SummaryRow icon={<PoIconTruck />} label="Loading Charge" value={blank || !data.loadingCharge ? '' : fmt(data.loadingCharge)} blank={blank} />
              <SummaryRow icon={<PoIconTruck />} label="Transport Charge" value={blank || !data.transportCharge ? '' : fmt(data.transportCharge)} blank={blank} />
              <SummaryRow icon={<PoIconCalendar />} label="Sub Total" value={blank ? '' : fmt(data.subTotal)} blank={blank} />
              <SummaryRow icon={<span>%</span>} label={`GST (${data.gstRate}%)`} value={blank ? '' : fmt(data.gstAmount)} blank={blank} noBorder />
              <div className="final-amount">
                <div className="fa-label">FINAL AMOUNT</div>
                <div className="fa-val">
                  {blank || !data.grandTotal ? '₹' : `₹ ${fmt(data.grandTotal)}`}
                </div>
              </div>
            </div>
          </div>

          <div className="terms">
            <div className="terms-header">
              <span className="terms-icon"><PoIconClipboard /></span>
              TERMS &amp; CONDITIONS :
            </div>
            <div className="terms-body">
              <ol start={1}>
                {TERMS_LEFT.map(t => <li key={t}>{t}</li>)}
              </ol>
              <ol start={5}>
                {TERMS_RIGHT.map(t => <li key={t}>{t}</li>)}
              </ol>
            </div>
          </div>

          <div className="sign-section">
            <div className="sign-box">
              <span className="sqicon"><PoIconPen /></span>
              <div className="text">
                <b>For {company.signFor}</b>
                <div className="sub">Authorized Signatory <span className="line" /></div>
              </div>
            </div>
            <div className="sign-box">
              <span className="sqicon"><PoIconPen /></span>
              <div className="text">
                <b>For Supplier</b>
                <div className="sub">Supplier Sign &amp; Seal <span className="line" /></div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="po-edge-bottom" aria-hidden>
          <div className="stripe-bottom" />
          <div className="bar-orange bottom" />
        </div>
      </div>
    </div>
  );
};
