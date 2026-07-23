import re

with open(r'd:\j\src\projects\profile\components\purchaseOrderPrintStyles.ts', 'r', encoding='utf-8') as f:
    styles_content = f.read()

new_styles = """export const PO_PRINT_STYLES = `
  #${PO_PRINT_AREA_ID} {
    --blue-primary: #0076df;
    --orange-primary: #ff5500;
    --blue-light: #e6f2ff;
    --orange-light: #fff0e6;
    --text-dark: #000000;
    --border-color: #0076df;
    --grid-border: #a2c6ec;
    font-family: 'Roboto', sans-serif;
    color: var(--text-dark);
    width: ${PO_PRINT_WIDTH_PX}px;
    min-width: ${PO_PRINT_WIDTH_PX}px;
    max-width: ${PO_PRINT_WIDTH_PX}px;
    height: ${PO_PRINT_HEIGHT_PX}px;
    min-height: ${PO_PRINT_HEIGHT_PX}px;
    max-height: ${PO_PRINT_HEIGHT_PX}px;
    margin: 0 auto;
    background-color: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${PO_PRINT_AREA_ID} *,
  #${PO_PRINT_AREA_ID} *::before,
  #${PO_PRINT_AREA_ID} *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${PO_PRINT_AREA_ID} .page-container {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    padding: 25px;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  /* --- Header Section --- */
  #${PO_PRINT_AREA_ID} .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5px;
  }

  #${PO_PRINT_AREA_ID} .company-logo-zone {
    width: 55%;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .company-title-main {
    font-size: 42px;
    font-weight: 900;
    color: var(--blue-primary) !important;
    line-height: 1;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .company-title-sub {
    font-size: 38px;
    font-weight: 900;
    color: var(--orange-primary) !important;
    line-height: 1;
    margin-bottom: 8px;
  }

  #${PO_PRINT_AREA_ID} .company-tagline {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-dark) !important;
    word-spacing: 1px;
  }

  #${PO_PRINT_AREA_ID} .company-contact-zone {
    width: 45%;
    border-left: 2px solid var(--blue-primary) !important;
    padding-left: 15px;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .right-header-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--blue-primary) !important;
    margin-bottom: 5px;
  }

  #${PO_PRINT_AREA_ID} .contact-row {
    font-size: 12px;
    margin-bottom: 5px;
    color: var(--text-dark) !important;
  }
  
  #${PO_PRINT_AREA_ID} .contact-row strong {
    display: inline-block;
    width: 65px;
  }

  #${PO_PRINT_AREA_ID} .contact-row span.label-box {
    background-color: var(--blue-primary) !important;
    color: white !important;
    font-size: 9px;
    padding: 1px 3px;
    border-radius: 2px;
    font-weight: bold;
    margin-right: 5px;
  }

  /* --- Purchase Order Banner Row --- */
  #${PO_PRINT_AREA_ID} .po-title-bar {
    position: relative;
    text-align: center;
    margin: 15px 0;
  }

  #${PO_PRINT_AREA_ID} .po-title-bar::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 2px;
    background-color: var(--orange-primary) !important;
    z-index: 1;
  }

  #${PO_PRINT_AREA_ID} .po-title-box {
    position: relative;
    display: inline-block;
    background: white !important;
    padding: 0 15px;
    z-index: 2;
  }

  #${PO_PRINT_AREA_ID} .po-title-text {
    border: 2px solid var(--blue-primary) !important;
    color: var(--blue-primary) !important;
    font-size: 22px;
    font-weight: 900;
    padding: 4px 30px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .supplier-badge {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid var(--orange-primary) !important;
    color: var(--orange-primary) !important;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    background: white !important;
    z-index: 2;
    border-radius: 4px;
  }

  /* --- Meta Info Bar (PO No & Date) --- */
  #${PO_PRINT_AREA_ID} .meta-info-bar {
    border: 2px solid #b0b0b0 !important;
    border-radius: 6px;
    padding: 6px 15px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  /* --- Details Blocks (3 Columns) --- */
  #${PO_PRINT_AREA_ID} .details-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr 1.1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .details-card {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    background: #fff !important;
  }

  #${PO_PRINT_AREA_ID} .details-card.orange-theme {
    border-color: var(--orange-primary) !important;
  }

  #${PO_PRINT_AREA_ID} .card-header {
    background-color: var(--blue-primary) !important;
    color: white !important;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    padding: 5px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .card-header.orange-bg {
    background-color: var(--orange-primary) !important;
  }

  #${PO_PRINT_AREA_ID} .card-body {
    padding: 10px 8px;
    font-size: 11px;
    line-height: 1.5;
  }

  #${PO_PRINT_AREA_ID} .info-table {
    width: 100%;
    border-collapse: collapse;
  }

  #${PO_PRINT_AREA_ID} .info-table td {
    padding: 4px 2px;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .info-table td.lbl {
    font-weight: 500;
    color: #333 !important;
    width: 95px;
  }
  
  #${PO_PRINT_AREA_ID} .info-table td.cln {
    width: 10px;
    text-align: center;
  }

  #${PO_PRINT_AREA_ID} .info-table td.val {
    font-weight: 700;
    color: #000 !important;
  }

  /* Transport sub-block within right column */
  #${PO_PRINT_AREA_ID} .transport-block {
    margin-top: 10px;
    border-top: 1.5px solid var(--blue-primary) !important;
  }

  /* --- Item Details Table --- */
  #${PO_PRINT_AREA_ID} .items-section {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .items-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    font-size: 10px;
  }

  #${PO_PRINT_AREA_ID} .items-table th {
    background-color: var(--blue-primary) !important;
    color: white !important;
    font-weight: 700;
    padding: 6px 3px;
    border: 1px solid #ffffff !important;
    font-size: 9.5px;
  }

  #${PO_PRINT_AREA_ID} .items-table td {
    border: 1px solid var(--grid-border) !important;
    padding: 4px 4px;
    height: 24px;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .items-table tr.blank-row td {
    color: transparent !important;
  }

  /* Table Summary Row */
  #${PO_PRINT_AREA_ID} .table-summary-bar {
    background-color: var(--blue-light) !important;
    border-top: 1.5px solid var(--blue-primary) !important;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    color: var(--blue-primary) !important;
  }

  /* --- Bottom Section (Terms & Summary) --- */
  #${PO_PRINT_AREA_ID} .bottom-grid {
    display: grid;
    grid-template-columns: 1.35fr 1.1fr;
    gap: 15px;
    margin-bottom: 15px;
  }

  #${PO_PRINT_AREA_ID} .terms-box {
    border: 1.5px solid var(--orange-primary) !important;
    border-radius: 6px;
    overflow: hidden;
  }

  #${PO_PRINT_AREA_ID} .terms-header {
    background-color: var(--orange-primary) !important;
    color: white !important;
    padding: 6px 10px;
    font-weight: 700;
    font-size: 13px;
  }

  #${PO_PRINT_AREA_ID} .terms-body {
    padding: 8px;
    font-size: 10.5px;
    line-height: 1.4;
    font-weight: 500;
  }

  #${PO_PRINT_AREA_ID} .terms-list {
    list-style: none;
    margin-bottom: 8px;
    margin-top: 0;
    padding-left: 0;
  }

  #${PO_PRINT_AREA_ID} .terms-list li {
    margin-bottom: 3px;
    position: relative;
    padding-left: 15px;
  }

  #${PO_PRINT_AREA_ID} .terms-list li::before {
    content: attr(data-num);
    position: absolute;
    left: 0;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .note-box {
    background-color: var(--orange-light) !important;
    border-radius: 4px;
    padding: 6px;
    font-size: 10px;
  }
  #${PO_PRINT_AREA_ID} .note-box span.note-lbl {
    color: var(--orange-primary) !important;
    font-weight: 700;
  }

  /* Financial Summary Box */
  #${PO_PRINT_AREA_ID} .financial-box {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #${PO_PRINT_AREA_ID} .financial-header {
    background-color: var(--blue-primary) !important;
    color: white !important;
    padding: 6px 10px;
    font-weight: 700;
    font-size: 13px;
  }

  #${PO_PRINT_AREA_ID} .financial-rows {
    padding: 5px 10px;
  }

  #${PO_PRINT_AREA_ID} .fin-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 5px 0;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .fin-row .lbl { width: 50%; }
  #${PO_PRINT_AREA_ID} .fin-row .cln { width: 10%; text-align: center; }
  #${PO_PRINT_AREA_ID} .fin-row .val { width: 40%; text-align: right; }

  #${PO_PRINT_AREA_ID} .grand-total-bar {
    background-color: var(--blue-primary) !important;
    color: white !important;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 700;
  }

  /* --- Acknowledgement Section --- */
  #${PO_PRINT_AREA_ID} .ack-section {
    margin-top: 10px;
  }

  #${PO_PRINT_AREA_ID} .ack-banner {
    position: relative;
    text-align: center;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .ack-banner::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    border-top: 1.5px dashed var(--blue-primary) !important;
    z-index: 1;
  }

  #${PO_PRINT_AREA_ID} .ack-badge {
    position: relative;
    display: inline-block;
    background-color: var(--orange-primary) !important;
    color: white !important;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 20px;
    z-index: 2;
    border-radius: 2px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .ack-body {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.6;
    padding: 0 5px;
  }

  #${PO_PRINT_AREA_ID} .ack-left {
    width: 50%;
  }

  #${PO_PRINT_AREA_ID} .ack-right {
    width: 45%;
    text-align: left;
  }
  
  #${PO_PRINT_AREA_ID} .sign-line {
    margin-top: 15px;
    border-bottom: 1px solid #000 !important;
    display: inline-block;
    width: 180px;
  }

  /* --- Bottom Footer Bar --- */
  #${PO_PRINT_AREA_ID} .footer-bar {
    margin-top: auto;
    background: linear-gradient(to right, var(--orange-primary) 45%, var(--blue-primary) 45%) !important;
    color: white !important;
    display: flex;
    justify-content: space-between;
    padding: 6px 15px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 2px;
  }

  #${PO_PRINT_AREA_ID} .footer-left {
    width: 40%;
  }

  #${PO_PRINT_AREA_ID} .footer-right {
    width: 60%;
    display: flex;
    justify-content: space-around;
  }

  #${PO_PRINT_AREA_ID} .footer-right span::before {
    content: "●";
    margin-right: 5px;
    color: var(--orange-primary) !important;
  }

  #${PO_PDF_CAPTURE_ID} {
    width: ${PO_PRINT_WIDTH_PX}px !important;
    min-width: ${PO_PRINT_WIDTH_PX}px !important;
    max-width: ${PO_PRINT_WIDTH_PX}px !important;
    height: ${PO_PRINT_HEIGHT_PX}px !important;
    min-height: ${PO_PRINT_HEIGHT_PX}px !important;
    max-height: ${PO_PRINT_HEIGHT_PX}px !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  #${PO_PDF_CAPTURE_ID} .page-container {
    width: 100% !important;
    height: 100% !important;
    min-height: 100% !important;
    max-height: 100% !important;
    margin: 0 !important;
    padding: 25px !important;
    border-radius: 0 !important;
    box-sizing: border-box !important;
  }

  @page po-print-page {
    size: A4;
    margin: 0;
  }

  @media print {
    #${PO_PRINT_AREA_ID} {
      page: po-print-page;
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    #${PO_PRINT_AREA_ID} .page-container {
      width: 100% !important;
      height: 100% !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 25px !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      page-break-after: avoid;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    #${PO_PRINT_AREA_ID} .footer-bar {
      margin-top: auto !important;
    }
  }
`;"""

styles_content = re.sub(r'export const PO_PRINT_STYLES = `.*?`;', new_styles, styles_content, flags=re.DOTALL)
styles_content = styles_content.replace(
    "'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap'",
    "'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap'"
)

with open(r'd:\j\src\projects\profile\components\purchaseOrderPrintStyles.ts', 'w', encoding='utf-8') as f:
    f.write(styles_content)

print("Updated styles")

with open(r'd:\j\src\projects\profile\components\PurchaseOrderPrint.tsx', 'r', encoding='utf-8') as f:
    tsx_content = f.read()

new_tsx = """import React, { useLayoutEffect, useRef } from 'react';
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

  const company = PO_COMPANY_BRANDS.jagdamba;
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
"""

with open(r'd:\j\src\projects\profile\components\PurchaseOrderPrint.tsx', 'w', encoding='utf-8') as f:
    f.write(new_tsx)

print("Updated tsx")
