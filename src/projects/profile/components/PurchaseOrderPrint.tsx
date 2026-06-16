import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';
import { LOGO2_BASE64 } from '../utils/logo2Base64';

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

const formatNum = (n: number) => (n ? n.toLocaleString('en-IN') : '');

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return dateStr;
};

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const items = po.items || [];
  const emptyRowsCount = Math.max(0, 11 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const basicAmount = po.totalAmount || 0;
  const gstAmount = Math.round(basicAmount * 0.18);
  const finalAmount = basicAmount + gstAmount;

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000' }} className="p-0 mx-auto font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id="po-print-area">
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        #po-print-area {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0 auto;
          padding: 0;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          color: #000;
        }
        #po-print-area * { box-sizing: border-box; margin: 0; padding: 0; color: #000; }

        .po-container {
          width: 210mm;
          background-color: #fff;
          border: 2px solid #000;
          padding: 4px;
          margin: 0 auto;
        }
        .po-inner {
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
        }

        .po-header {
          display: flex;
          align-items: center;
          padding: 12px 15px;
          border-bottom: 1px solid #000;
        }
        .po-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 20px;
          width: 80px;
          flex-shrink: 0;
        }
        .po-logo { width: 70px; height: auto; object-fit: contain; }
        .po-logo-text {
          font-size: 8px;
          font-weight: bold;
          font-style: italic;
          text-align: center;
          margin-top: 3px;
        }
        .po-header-text { flex-grow: 1; }
        .po-company-name {
          color: #00AEEF;
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
        }
        .po-company-details {
          font-size: 11px;
          color: #D97E26;
          text-align: center;
          line-height: 1.5;
        }
        .po-contact-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px 20px;
          margin-top: 2px;
        }

        .po-doc-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          padding: 7px;
          border-bottom: 1px solid #000;
          background-color: #000;
          color: #fff !important;
        }

        .po-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .po-section-header {
          background-color: #000 !important;
          color: #fff !important;
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          padding: 6px 10px;
          border-bottom: 1px solid #000;
        }
        .po-section-header:first-child { border-right: 1px solid #fff; }

        .po-grid-cell {
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
          padding: 6px 10px;
          font-size: 11px;
          min-height: 28px;
          display: flex;
          align-items: center;
        }
        .po-grid-cell.no-right { border-right: none; }
        .po-grid-cell label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 6px;
        }
        .po-grid-cell .underline {
          flex-grow: 1;
          border-bottom: 1px solid #000;
          min-height: 14px;
          padding-left: 4px;
          font-weight: bold;
        }
        .po-inline-fields {
          display: flex;
          align-items: center;
          flex-grow: 1;
          gap: 8px;
        }
        .po-inline-fields .underline { flex: 1; }

        .po-transport-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid #000;
        }
        .po-transport-grid .po-grid-cell {
          border-right: 1px solid #000;
          border-bottom: none;
        }
        .po-transport-grid .po-grid-cell:last-child { border-right: none; }

        .po-items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .po-items-table th, .po-items-table td {
          border: 1px solid #000;
          padding: 5px 4px;
          text-align: center;
          font-size: 11px;
        }
        .po-items-table th {
          background-color: #000 !important;
          color: #fff !important;
          font-weight: bold;
        }
        .po-items-table th:first-child, .po-items-table td:first-child { border-left: none; }
        .po-items-table th:last-child, .po-items-table td:last-child { border-right: none; }
        .po-items-table .data-row td { height: 24px; }
        .po-items-table .totals-label {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .po-items-table .amount-label {
          font-weight: bold;
          text-align: left;
          padding-left: 8px;
        }
        .po-items-table .amount-value {
          font-weight: bold;
          text-align: right;
          padding-right: 8px;
        }

        .po-note-row {
          border-bottom: 1px solid #000;
          padding: 8px 10px;
          min-height: 32px;
          font-size: 11px;
          display: flex;
          align-items: center;
        }
        .po-note-row label { font-weight: bold; margin-right: 8px; }
        .po-note-row .underline {
          flex-grow: 1;
          border-bottom: 1px solid #000;
          min-height: 14px;
        }

        .po-terms {
          padding: 8px 12px 10px;
          font-size: 10.5px;
          line-height: 1.55;
          border-bottom: 1px solid #000;
        }
        .po-terms ol { margin: 0; padding-left: 18px; }
        .po-terms li { margin-bottom: 2px; }

        .po-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          min-height: 90px;
        }
        .po-sig-box {
          border-right: 1px solid #000;
          padding: 10px;
          font-weight: bold;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          text-align: center;
        }
        .po-sig-box:last-child {
          border-right: none;
          justify-content: space-between;
          align-items: flex-end;
          text-align: right;
        }
        .po-sig-blue { color: #00AEEF !important; }
      `}</style>

      <div className="po-container">
        <div className="po-inner">
          <div className="po-header">
            <div className="po-logo-wrap">
              <img src={LOGO2_BASE64} alt="Jagdamba Profile" className="po-logo" />
              <div className="po-logo-text">Jagdamba Profile</div>
            </div>
            <div className="po-header-text">
              <div className="po-company-name">Jagdamba Profile</div>
              <div className="po-company-details">
                <div>504/1A, GIDC Makarpura, Vadodara - 390010.</div>
                <div className="po-contact-row">
                  <span>GST No: 24AJGPP9863R1Z5</span>
                  <span>Mo: 9824917250, 9824025001, 8799617254</span>
                  <span>Email: jagdambaprofile@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="po-doc-title">PURCHASE ORDER</div>

          <div className="po-grid-2">
            <div className="po-section-header">SUPPLIER DETAILS</div>
            <div className="po-section-header">PURCHASE ORDER DETAILS</div>

            <div className="po-grid-cell">
              <label>Party Name :</label>
              <div className="underline">{po.supplierName}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>PO No :</label>
              <div className="underline">{po.poNumber}</div>
            </div>

            <div className="po-grid-cell">
              <label>Address :</label>
              <div className="underline">{po.supplierAddress || ''}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>PO Date :</label>
              <div className="underline">{formatDate(po.date)}</div>
            </div>

            <div className="po-grid-cell">
              <label>GST Number :</label>
              <div className="underline">{po.supplierGST || ''}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>Payment Terms :</label>
              <div className="underline">{po.paymentTerms || ''}</div>
            </div>

            <div className="po-grid-cell">
              <label>Mobile Number :</label>
              <div className="underline">{po.supplierMobile || ''}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>Make :</label>
              <div className="underline">{po.make || ''}</div>
            </div>

            <div className="po-grid-cell">
              <label>Email ID :</label>
              <div className="underline">{po.supplierEmail || ''}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>UT Level :</label>
              <div className="po-inline-fields">
                <div className="underline">{po.utLevel || ''}</div>
                <label style={{ marginLeft: 4 }}>TC</label>
                <div className="underline" style={{ maxWidth: 70 }}>{po.tc || ''}</div>
              </div>
            </div>
          </div>

          <div className="po-section-header" style={{ borderRight: 'none' }}>VEHICLE TRANSPORT DETAILS</div>
          <div className="po-transport-grid">
            <div className="po-grid-cell">
              <label>Vehicle Number :</label>
              <div className="underline">{po.transportNumber || ''}</div>
            </div>
            <div className="po-grid-cell">
              <label>Driver Mobile No :</label>
              <div className="underline">{po.driverMobile || ''}</div>
            </div>
            <div className="po-grid-cell no-right">
              <label>Transport Name :</label>
              <div className="underline">{po.transportName || ''}</div>
            </div>
          </div>

          <table className="po-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Sr No</th>
                <th style={{ width: '12%' }}>Grade</th>
                <th style={{ width: '10%' }}>Thickness</th>
                <th style={{ width: '10%' }}>Width</th>
                <th style={{ width: '10%' }}>Length</th>
                <th style={{ width: '8%' }}>Nos</th>
                <th style={{ width: '10%' }}>Kg</th>
                <th style={{ width: '12%' }}>Rate</th>
                <th style={{ width: '13%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="data-row">
                  <td>{idx + 1}</td>
                  <td>{item.grade || ''}</td>
                  <td>{item.thickness || ''}</td>
                  <td>{item.width || ''}</td>
                  <td>{item.length || ''}</td>
                  <td>{item.nos || ''}</td>
                  <td>{item.kg ? formatNum(item.kg) : ''}</td>
                  <td>{item.rate ? formatNum(item.rate) : ''}</td>
                  <td>{item.amount ? formatNum(item.amount) : ''}</td>
                </tr>
              ))}
              {emptyRows.map((_, idx) => (
                <tr key={`empty-${idx}`} className="data-row">
                  <td></td><td></td><td></td><td></td><td></td>
                  <td></td><td></td><td></td><td></td>
                </tr>
              ))}
              <tr>
                <td colSpan={6} rowSpan={3} className="totals-label">TOTAL KG</td>
                <td rowSpan={3}>{po.totalKg ? formatNum(po.totalKg) : ''}</td>
                <td className="amount-label">BASIC AMOUNT</td>
                <td className="amount-value">{basicAmount ? formatNum(basicAmount) : ''}</td>
              </tr>
              <tr>
                <td className="amount-label">GST @ 18%</td>
                <td className="amount-value">{gstAmount ? formatNum(gstAmount) : ''}</td>
              </tr>
              <tr>
                <td className="amount-label">FINAL AMOUNT</td>
                <td className="amount-value">{finalAmount ? formatNum(finalAmount) : ''}</td>
              </tr>
            </tbody>
          </table>

          <div className="po-section-header" style={{ borderRight: 'none', textAlign: 'center' }}>COMMERCIAL / QUALITY DETAILS</div>
          <div className="po-note-row">
            <label>Note</label>
            <div className="underline">{po.note || ''}</div>
          </div>

          <div className="po-section-header" style={{ borderRight: 'none', textAlign: 'center' }}>GENERAL TERMS AND CONDITIONS</div>
          <div className="po-terms">
            <ol>
              <li>Material should be supplied strictly as per above size, grade and specification.</li>
              <li>Test Certificate / MTC report wherever applicable.</li>
              <li>Material should be free from heavy rust, lamination, oil, paint and major surface defects.</li>
              <li>Final weight, rate and payment will be as per mutually agreed terms.</li>
              <li>Delivery schedule and transport details must be confirmed before dispatch.</li>
            </ol>
          </div>

          <div className="po-signatures">
            <div className="po-sig-box">Prepared By</div>
            <div className="po-sig-box">Checked By</div>
            <div className="po-sig-box">
              <span className="po-sig-blue">For Jagdamba Profile</span>
              <span className="po-sig-blue">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
