import React, { useLayoutEffect, useRef } from 'react';
import type { PurchaseOrder } from '../store/AppContext';
import {
  buildPurchaseOrderPrintData,
  type PurchaseOrderPrintExtras,
  PO_COMPANY_BRANDS,
} from './purchaseOrderPrintData';
import { PO_SHREE_FONT_LINK, shreePoStylesFor } from './shreePurchaseOrderPrintStyles';
import {
  PoIconCalendar,
  PoIconCar,
  PoIconCertificate,
  PoIconClipboard,
  PoIconEmail,
  PoIconLocation,
  PoIconPen,
  PoIconPhone,
  PoIconTruck,
  PoIconUser,
  PoIconWeight,
  PoIconWrench,
} from './poPrintIcons';
import { fitPoSheetBodyWhenReady } from '../utils/fitPoPrintLayout';

const MIN_ROW_COUNT = 4;

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('/') ? iso.split('/').reverse().join('-') + 'T12:00:00' : iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const field = (value: string | undefined, blank: boolean) =>
  blank ? '' : (value || '');

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

function supplierAddressBlock(data: ReturnType<typeof buildPurchaseOrderPrintData>, blank: boolean) {
  if (blank) return '';
  return [data.address, data.addressLine2, data.addressLine3, data.addressLine4].filter(Boolean).join('\n');
}

export interface ShreePurchaseOrderPrintProps {
  po?: PurchaseOrder;
  extras?: PurchaseOrderPrintExtras;
  printAreaId: string;
  blank?: boolean;
}

export const ShreePurchaseOrderPrint: React.FC<ShreePurchaseOrderPrintProps> = ({
  po,
  extras,
  printAreaId,
  blank = false,
}) => {
  const company = PO_COMPANY_BRANDS.shree;
  const source = blank || !po ? EMPTY_PO : po;
  const data = buildPurchaseOrderPrintData(source, blank ? {} : extras);
  const rowCount = blank
    ? MIN_ROW_COUNT
    : Math.max(data.items.length, data.items.length >= 4 ? data.items.length : MIN_ROW_COUNT);
  const rows = Array.from({ length: rowCount }, (_, i) => data.items[i] ?? null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const hasItem = rows.some(i => i?.itemName);
  const hasGrade = blank || rows.some(i => i?.grade);
  const hasMake = rows.some(i => i?.make);
  const hasSizeSection = rows.some(i => i?.sizeSection);
  const hasThickness = blank || rows.some(i => i?.thickness);
  const hasWidth = blank || rows.some(i => i?.width);
  const hasLength = blank || rows.some(i => i?.length);
  const hasNos = blank || rows.some(i => i?.nos);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    void fitPoSheetBodyWhenReady(sheet);
    const t = window.setTimeout(() => void fitPoSheetBodyWhenReady(sheet), 250);
    return () => clearTimeout(t);
  }, [blank, printAreaId, data.poNumber, data.supplierName, data.items.length, data.grandTotal]);

  return (
    <div id={printAreaId}>
      <link rel="stylesheet" href={PO_SHREE_FONT_LINK} />
      <style>{shreePoStylesFor(printAreaId)}</style>

      <div ref={sheetRef} className="sj-po-sheet po-sheet">
        <div className="sj-decor-line-wrap">
          <div className="sj-decor-line top">
            <div className="sj-band-blue" />
            <div className="sj-band-orange" />
            <div className="sj-band-blue-short" />
          </div>
        </div>

        <div className="po-body-wrap">
          <div className="po-body">
            <div className="sj-header">
              <div>
                <div className="sj-company-title">
                  <h1>
                    <span className="sj-title-blue">{company.titleNavy}</span>{' '}
                    <span className="sj-title-orange">{company.titleOrange}</span>
                  </h1>
                </div>
                <div className="sj-contact-info">
                  <div className="sj-contact-row">
                    <span className="icon"><PoIconLocation /></span>
                    <span>{company.address}</span>
                  </div>
                  <div className="sj-contact-row">
                    <span className="icon"><PoIconPhone /></span>
                    <span><b>Mo. :</b> {company.phone}</span>
                  </div>
                  <div className="sj-contact-row">
                    <span className="icon"><PoIconEmail /></span>
                    <span><b>E-mail :</b> {company.email}</span>
                    <span className="sj-gst-no"><b>GST No. :</b> {company.gst}</span>
                  </div>
                </div>
              </div>
              <div className="sj-po-badge-wrap">
                <div className="sj-badge-dots">• • •</div>
                <div className="sj-po-badge">PURCHASE ORDER</div>
                <div className="sj-badge-dots">• • •</div>
              </div>
            </div>

            <div className="sj-divider">
              <div className="sj-divider-dots"><span /><span /><span /></div>
            </div>

            <div className="sj-two-column">
              <div className="sj-column">
                <div className="sj-header-wrapper">
                  <div className="sj-section-icon"><PoIconUser /></div>
                  <div className="sj-section-header">SUPPLIER DETAIL</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">Supplier</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.supplierName, blank)}</div>
                </div>
                <div className="sj-form-group address">
                  <div className="sj-form-label">Address</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input multiline" style={{ whiteSpace: 'pre-wrap' }}>
                    {supplierAddressBlock(data, blank)}
                  </div>
                </div>
                <div className="sj-form-group" style={{ marginTop: 16 }}>
                  <div className="sj-form-label">Mobile No.</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.phone, blank)}</div>
                </div>
              </div>

              <div className="sj-column">
                <div className="sj-header-wrapper">
                  <div className="sj-section-icon"><PoIconClipboard /></div>
                  <div className="sj-section-header">PURCHASE ORDER DETAIL</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">PO No.</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.poNumber, blank)}</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">PO Date</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(fmtDate(data.date), blank)}</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">Delivery Date</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(fmtDate(data.deliveryRequiredBy), blank)}</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">Payment Terms</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.paymentTerms, blank)}</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">Transport Mode</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.deliveryTerms || data.transportName, blank)}</div>
                </div>
                <div className="sj-form-group">
                  <div className="sj-form-label">Destination</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-form-input">{field(data.placeOfDelivery, blank)}</div>
                </div>
              </div>
            </div>

            <div className="sj-table-wrap">
              <table className="sj-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>Sr.<br />No.</th>
                    {hasItem && <th>Item</th>}
                    {hasGrade && <th>Grade</th>}
                    {hasMake && <th>Make</th>}
                    {hasSizeSection && <th>Size / Section</th>}
                    {hasThickness && <th>Thickness<br />(MM)</th>}
                    {hasWidth && <th>Width<br />(MM)</th>}
                    {hasLength && <th>Length<br />(MM)</th>}
                    {hasNos && <th>Nos</th>}
                    <th>Kg</th>
                    <th>Rate<br />(Rs.)</th>
                    <th>Amount<br />(Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      {hasItem && <td>{blank ? '' : (item?.itemName || '')}</td>}
                      {hasGrade && <td>{blank ? '' : (item?.grade || '')}</td>}
                      {hasMake && <td>{blank ? '' : (item?.make || '')}</td>}
                      {hasSizeSection && <td>{blank ? '' : (item?.sizeSection || '')}</td>}
                      {hasThickness && <td>{blank || !item ? '' : cell(item.thickness)}</td>}
                      {hasWidth && <td>{blank || !item ? '' : cell(item.width)}</td>}
                      {hasLength && <td>{blank || !item ? '' : cell(item.length)}</td>}
                      {hasNos && <td>{blank || !item ? '' : cell(item.nos)}</td>}
                      <td>{blank || !item ? '' : fmt(item.kg)}</td>
                      <td>{blank || !item ? '' : fmt(item.rate)}</td>
                      <td>{blank || !item ? '' : fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sj-bottom-details">
              <div className="sj-left-details">
                <div className="sj-detail-row">
                  <div className="sj-icon-box"><PoIconWrench /></div>
                  <div className="sj-detail-label">Make</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-detail-input">{field(data.make, blank)}</div>
                </div>
                <div className="sj-detail-row">
                  <div className="sj-icon-box"><PoIconWrench /></div>
                  <div className="sj-detail-label">UT Level</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-detail-input">{field(data.utLevel, blank)}</div>
                </div>
                <div className="sj-detail-row">
                  <div className="sj-icon-box"><PoIconCertificate /></div>
                  <div className="sj-detail-label">Test Certificate</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-detail-input">{field(data.tcText, blank)}</div>
                </div>
                <div className="sj-detail-row">
                  <div className="sj-icon-box"><PoIconTruck /></div>
                  <div className="sj-detail-label">Transport Name</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-detail-input">{field(data.transportName, blank)}</div>
                </div>
                <div className="sj-detail-row">
                  <div className="sj-icon-box"><PoIconCar /></div>
                  <div className="sj-detail-label">Vehicle No.</div>
                  <div className="sj-form-colon">:</div>
                  <div className="sj-detail-input">{field(data.vehicleNo, blank)}</div>
                </div>
              </div>

              <div className="sj-right-details">
                <div className="sj-charge-row">
                  <div className="sj-icon-box"><PoIconWeight /></div>
                  <div className="sj-charge-label">Total Kg</div>
                  <div className="sj-charge-value">{blank ? '' : fmt(data.totalKg)}</div>
                </div>
                <div className="sj-charge-row">
                  <div className="sj-icon-box"><PoIconTruck /></div>
                  <div className="sj-charge-label">Loading Charge</div>
                  <div className="sj-charge-value">{blank || !data.loadingCharge ? '' : fmt(data.loadingCharge)}</div>
                </div>
                <div className="sj-charge-row">
                  <div className="sj-icon-box"><PoIconTruck /></div>
                  <div className="sj-charge-label">Transport Charge</div>
                  <div className="sj-charge-value">{blank || !data.transportCharge ? '' : fmt(data.transportCharge)}</div>
                </div>
                <div className="sj-charge-row">
                  <div className="sj-icon-box"><PoIconCalendar /></div>
                  <div className="sj-charge-label">Sub Total</div>
                  <div className="sj-charge-value">{blank ? '' : fmt(data.subTotal)}</div>
                </div>
                <div className="sj-charge-row">
                  <div className="sj-icon-box"><span>%</span></div>
                  <div className="sj-charge-label">GST ({data.gstRate}%)</div>
                  <div className="sj-charge-value">{blank ? '' : fmt(data.gstAmount)}</div>
                </div>
                <div className="sj-final-amount">
                  <div className="sj-final-label">FINAL AMOUNT</div>
                  <div className="sj-final-currency">
                    {blank || !data.grandTotal ? '₹' : `₹ ${fmt(data.grandTotal)}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="sj-terms">
              <div className="sj-terms-header-wrap">
                <div className="sj-section-icon"><PoIconClipboard /></div>
                <div className="sj-terms-header">TERMS &amp; CONDITIONS :</div>
              </div>
              <div className="sj-terms-grid">
                <div className="sj-terms-col">
                  <ol>{TERMS_LEFT.map(t => <li key={t}>{t}</li>)}</ol>
                </div>
                <div className="sj-terms-col">
                  <ol start={5}>{TERMS_RIGHT.map(t => <li key={t}>{t}</li>)}</ol>
                </div>
              </div>
            </div>

            <div className="sj-signatures">
              <div className="sj-sig-box">
                <div className="sj-sig-icon"><PoIconPen /></div>
                <div className="sj-sig-title">For {company.signFor.toUpperCase()}</div>
                <div className="sj-sig-line">Authorized Signatory <span /></div>
              </div>
              <div className="sj-sig-box">
                <div className="sj-sig-icon"><PoIconPen /></div>
                <div className="sj-sig-title">For Supplier</div>
                <div className="sj-sig-line">Supplier Sign &amp; Seal <span /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="sj-decor-line-wrap bottom">
          <div className="sj-decor-line bottom">
            <div className="sj-band-blue-short" />
            <div className="sj-band-orange" />
            <div className="sj-band-blue" />
          </div>
        </div>
      </div>
    </div>
  );
};
