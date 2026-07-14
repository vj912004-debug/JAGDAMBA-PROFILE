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
import { fitPoSheetBodyWhenReady } from '../utils/fitPoPrintLayout';
import { ShreePurchaseOrderPrint } from './ShreePurchaseOrderPrint';
import {
  buildPurchaseOrderPrintData,
  PO_COMPANY_BRANDS,
  type PoCompanyBrand,
  type PurchaseOrderPrintExtras,
  type PurchaseOrderPrintData,
} from './purchaseOrderPrintData';

export { PO_PRINT_AREA_ID, PO_PRINT_WIDTH_PX, PO_PDF_CAPTURE_ID, PO_BLANK_PRINT_AREA_ID };
export type { PoCompanyBrand, PurchaseOrderPrintExtras, PurchaseOrderPrintData };
export { buildPurchaseOrderPrintData, PO_COMPANY_BRANDS };

const ROW_COUNT = 8;

const poStylesFor = (areaId: string) =>
  areaId === PO_PRINT_AREA_ID
    ? PO_PRINT_STYLES
    : PO_PRINT_STYLES.replace(new RegExp(`#${PO_PRINT_AREA_ID}`, 'g'), `#${areaId}`);

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.includes('/') ? iso.split('/').reverse().join('-') + 'T12:00:00' : iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const cell = (v: string | number | undefined) => (v === 0 || v === '0' ? v : v || '');

const TERMS = [
  'Material should be as per our requirement & specification.',
  'Delivery should be within agreed time schedule.',
  'Test certificate (TC) must accompany the material.',
  'Payment will be made as per agreed payment terms.',
  'Subject to Vadodara jurisdiction only.',
];

const field = (value: string | undefined, blank: boolean) =>
  blank ? '' : (value || '');

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

  const source = blank || !po ? EMPTY_PO : po;
  const data = buildPurchaseOrderPrintData(source, blank ? {} : extras);
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => data.items[i] ?? null);
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

  const totalItemsCount = data.items.length;
  
  const calculateTotalKg = () => data.totalKg;
  const calculateAmount = () => data.subTotal;
  
  const renderAddressLines = () => {
    if (blank) return <br />;
    const lines = [data.address, data.addressLine2, data.addressLine3, data.addressLine4].filter(Boolean);
    return (
      <>
        {lines.map((l, i) => (
          <React.Fragment key={i}>
            {l}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div id={printAreaId}>
      <link rel="stylesheet" href={PO_FONT_LINK} />
      <style>{poStylesFor(printAreaId)}</style>

      <div ref={sheetRef} className="page-container">
        
        {/* Header */}
        <table className="header-table">
            <tbody>
                <tr>
                    <td className="company-logo-zone">
                        <div className="company-title-main">JAGDAMBA</div>
                        <div className="company-title-sub">PROFILE</div>
                        <div className="company-tagline">MS & SS CNC PROFILE CUTTING | LASER CUTTING | DRILLING | MARKING</div>
                    </td>
                    <td className="company-contact-zone">
                        <div className="right-header-title">Jagdamba Profile</div>
                        <div className="contact-row">504/1A GIDC Makarpura, Vadodara 390010</div>
                        <div className="contact-row"><span className="label-box">GST</span><strong>GST</strong> : 24AJGPP9863R1Z5</div>
                        <div className="contact-row"><strong>Email ID</strong> : jagdambaprofile@gmail.com</div>
                        <div className="contact-row"><strong>Mo.</strong> : 9824025001 / 9824917250</div>
                    </td>
                </tr>
            </tbody>
        </table>

        {/* Purchase Order Banner Line */}
        <div className="po-title-bar">
            <div className="po-title-box">
                <span className="po-title-text">PURCHASE ORDER</span>
            </div>
            <div className="supplier-badge">ORIGINAL FOR SUPPLIER</div>
        </div>

        {/* Meta Info Bar */}
        <div className="meta-info-bar">
            <div>PO NO. : <span style={{color: 'var(--orange-primary)'}}>{field(data.poNumber, blank)}</span></div>
            <div>PO DATE : <span style={{color: 'var(--orange-primary)'}}>{fmtDate(data.date)}</span></div>
        </div>

        {/* Details Grid Blocks */}
        <div className="details-grid">
            {/* Supplier Details Box */}
            <div className="details-card orange-theme">
                <div className="card-header orange-bg">SUPPLIER DETAILS</div>
                <div className="card-body">
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="lbl">Supplier Name</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.supplierName, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Address</td>
                                <td className="cln">:</td>
                                <td className="val">{renderAddressLines()}</td>
                            </tr>
                            <tr>
                                <td className="lbl">PO Date</td>
                                <td className="cln">:</td>
                                <td className="val">{fmtDate(data.date)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">GST No.</td>
                                <td className="cln">:</td>
                                <td className="val"><span style={{display:'inline-block', width:'100%', borderBottom:'1px solid #000', height:'12px'}}></span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Details Box */}
            <div className="details-card">
                <div className="card-header">DELIVERY DETAILS</div>
                <div className="card-body">
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="lbl">Delivery Location</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.placeOfDelivery, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Transport Name</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.transportName, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Driver Mobile No.</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.vehicleNo, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl" style={{paddingTop:'15px'}}>Note</td>
                                <td className="cln" style={{paddingTop:'15px'}}>:</td>
                                <td className="val" style={{paddingTop:'15px'}}>
                                    {!blank && data.itemTypeKey === 'plate' ? (
                                        <>PLATE 6000<br/>CUTTING SIZE</>
                                    ) : ''}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment & Other Details Box */}
            <div className="details-card orange-theme">
                <div className="card-header orange-bg">PAYMENT & OTHER DETAILS</div>
                <div className="card-body" style={{padding: '10px 8px 0 8px'}}>
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="lbl">Payment Terms</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.paymentTerms, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Inspection</td>
                                <td className="cln">:</td>
                                <td className="val">{blank ? '' : 'YES'}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Test Certificate</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.tcText, blank)}</td>
                            </tr>
                            <tr>
                                <td className="lbl">UT Level</td>
                                <td className="cln">:</td>
                                <td className="val">{field(data.utLevel, blank)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    {/* Transport Charges Sub-header Box Inside */}
                    <div className="transport-block">
                        <div className="card-header" style={{borderRadius:0, margin:'0 -8px', fontSize:'11px', padding:'3px'}}>TRANSPORT & LOADING CHARGE</div>
                        <table className="info-table" style={{marginTop: '5px'}}>
                            <tbody>
                                <tr>
                                    <td className="lbl">Transport</td>
                                    <td className="cln">:</td>
                                    <td className="val">{blank || !data.transportCharge ? 'EXTRA' : '₹ ' + fmt(data.transportCharge)}</td>
                                </tr>
                                <tr>
                                    <td className="lbl">Loading</td>
                                    <td className="cln">:</td>
                                    <td className="val">{blank || !data.loadingCharge ? 'EXTRA' : '₹ ' + fmt(data.loadingCharge)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* Item Details Grid Table */}
        <div className="items-section">
            <table className="items-table">
                <thead>
                    <tr>
                        <th style={{width: '4%'}}>SR. NO.</th>
                        {hasItem && <th style={{width: '14%'}}>ITEM</th>}
                        {hasGrade && <th style={{width: '11%'}}>GRADE</th>}
                        {hasMake && <th style={{width: '9%'}}>MAKE</th>}
                        {hasSizeSection && <th style={{width: '13%'}}>SIZE / SECTION</th>}
                        {hasThickness && <th style={{width: '7%'}}>THICK (MM)</th>}
                        {hasWidth && <th style={{width: '7%'}}>WIDTH (MM)</th>}
                        {hasLength && <th style={{width: '7%'}}>LENGTH (MM)</th>}
                        {hasNos && <th style={{width: '5%'}}>NOS</th>}
                        <th style={{width: '8%'}}>WEIGHT (KG)</th>
                        <th style={{width: '7%'}}>RATE (₹)</th>
                        <th style={{width: '9%'}}>RATE BASIS</th>
                        <th style={{width: '11%'}}>AMOUNT (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((item, i) => (
                        <tr key={i} className={blank || !item ? "blank-row" : ""}>
                            <td>{i + 1}</td>
                            {hasItem && <td style={{color: 'var(--blue-primary)', textAlign: 'left', paddingLeft: '5px'}}>{blank ? '' : (item?.itemName || '')}</td>}
                            {hasGrade && <td>{blank ? '' : (item?.grade || '')}</td>}
                            {hasMake && <td>{blank ? '' : (item?.make || '')}</td>}
                            {hasSizeSection && <td>{blank ? '' : (item?.sizeSection || '')}</td>}
                            {hasThickness && <td>{blank || !item ? '' : cell(item.thickness)}</td>}
                            {hasWidth && <td>{blank || !item ? '' : cell(item.width)}</td>}
                            {hasLength && <td>{blank || !item ? '' : cell(item.length)}</td>}
                            {hasNos && <td>{blank || !item ? '' : cell(item.nos)}</td>}
                            <td>{blank || !item ? '' : fmt(item.kg)}</td>
                            <td>{blank || !item ? '' : fmt(item.rate)}</td>
                            <td>{blank || !item ? '' : (item.rateBasis === 'Per Kg' ? 'PER KG' : (item.rateBasis === 'Per Piece' ? 'PER PC' : 'PER KG'))}</td>
                            <td style={{textAlign: 'right', paddingRight: '5px'}}>{blank || !item ? '' : fmt(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {/* Items Total Row Summary */}
            <div className="table-summary-bar">
                <div>TOTAL ITEMS : &nbsp;<span style={{color:'#000'}}>{blank ? '' : totalItemsCount}</span></div>
                <div>TOTAL WEIGHT (KG) : &nbsp;<span style={{color:'#000'}}>{blank ? '' : fmt(calculateTotalKg())}</span></div>
                <div>TOTAL AMOUNT (₹) : &nbsp;<span style={{color:'#000'}}>{blank ? '' : fmt(calculateAmount())}</span></div>
            </div>
        </div>

        {/* Bottom Grid (Terms and Financial Summary) */}
        <div className="bottom-grid">
            {/* Terms and Conditions Block */}
            <div className="terms-box">
                <div className="terms-header">TERMS & CONDITIONS</div>
                <div className="terms-body">
                    <ul className="terms-list">
                        {TERMS.map((t, i) => (
                            <li key={i} data-num={`${i + 1}.`}>{t}</li>
                        ))}
                    </ul>
                    <div className="note-box">
                        <span className="note-lbl">NOTE :</span>
                        <div style={{paddingLeft: '35px', marginTop: '-14px', lineHeight: '1.3', fontWeight: 700}}>
                            1. Weight calculated as per standard.<br/>
                            2. All dimensions are in MM.<br/>
                            3. Weight tolerance ± 5% acceptable.
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Calculations Breakdown Box */}
            <div className="financial-box">
                <div>
                    <div className="financial-header">FINANCIAL SUMMARY</div>
                    <div className="financial-rows">
                        <div className="fin-row">
                            <div className="lbl">Total Before Tax</div>
                            <div className="cln">:</div>
                            <div className="val">₹ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{blank ? '' : fmt(data.subTotal)}</div>
                        </div>
                        <div className="fin-row">
                            <div className="lbl">GST ({data.gstRate}%)</div>
                            <div className="cln">:</div>
                            <div className="val">₹ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{blank ? '' : fmt(data.gstAmount)}</div>
                        </div>
                        <div className="fin-row">
                            <div className="lbl">Round Off</div>
                            <div className="cln">:</div>
                            <div className="val">₹ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{blank ? '' : fmt(data.grandTotal - data.subTotal - data.gstAmount)}</div>
                        </div>
                    </div>
                </div>
                
                {/* Grand Total Banner Base inside block */}
                <div className="grand-total-bar">
                    <span>GRAND TOTAL :</span>
                    <span>₹ {blank ? '' : fmt(data.grandTotal)}</span>
                </div>
            </div>
        </div>

        {/* Acknowledgement Row Layout */}
        <div className="ack-section">
            <div className="ack-banner">
                <span className="ack-badge">ACKNOWLEDGEMENT</span>
            </div>
            <div className="ack-body">
                <div className="ack-left">
                    We hereby confirm that we have received the Purchase Order<br/>
                    PO No. : &nbsp;<span style={{color:'var(--orange-primary)'}}>{field(data.poNumber, blank)}</span> &nbsp;&nbsp;&nbsp;&nbsp; Dated : &nbsp;<span style={{color:'var(--orange-primary)'}}>{fmtDate(data.date)}</span><br/>
                    for the above mentioned items.
                </div>
                <div className="ack-right">
                    <strong>For Supplier (Sign & Seal)</strong><br/>
                    Name &nbsp;: <span className="sign-line"></span><br/>
                    Date &nbsp;&nbsp;&nbsp;: <span className="sign-line"></span>
                </div>
            </div>
        </div>

        {/* Bottom Base Decorative Line Badge */}
        <div className="footer-bar">
            <div className="footer-left">THANK YOU FOR YOUR BUSINESS!</div>
            <div className="footer-right">
                <span>Quality Products</span>
                <span>On-Time Delivery</span>
                <span>Best Price</span>
            </div>
        </div>

      </div>
    </div>
  );
};
