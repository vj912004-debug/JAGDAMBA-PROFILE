import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';
import { LOGO2_BASE64 } from '../utils/logo2Base64';

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

const formatNum = (n: number) => (n ? n.toLocaleString('en-IN') : '');

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const items = po.items || [];
  const emptyRowsCount = Math.max(0, 10 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const basicAmount = po.totalAmount || 0;
  const gstAmount = Math.round(basicAmount * 0.18);
  const finalAmount = basicAmount + gstAmount;

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000' }} className="p-0 mx-auto font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id="po-print-area">
      <style>{`
        @page { size: A4; margin: 0; }
        #po-print-area {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0 auto;
          padding: 12px;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          color: #000;
        }
        #po-print-area * { box-sizing: border-box; }

        .po-outer {
          border: 2px solid #ccc;
          padding: 6px;
          min-height: calc(297mm - 24px);
          display: flex;
          flex-direction: column;
        }
        .po-inner {
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .po-header {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border-bottom: 1px solid #000;
        }
        .po-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 16px;
          width: 72px;
          flex-shrink: 0;
        }
        .po-logo {
          width: 58px;
          height: auto;
          object-fit: contain;
        }
        .po-logo-text {
          font-size: 8px;
          font-weight: bold;
          font-style: italic;
          text-align: center;
          margin-top: 2px;
        }
        .po-header-body { flex-grow: 1; }
        .po-company-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: bold;
          color: #00AEEF;
          text-align: center;
          margin-bottom: 6px;
        }
        .po-contact {
          font-size: 11px;
          color: #D97E26;
          text-align: center;
          line-height: 1.5;
        }
        .po-contact-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 4px 16px;
        }

        .po-doc-title {
          background-color: #000;
          color: #fff;
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          padding: 7px;
          letter-spacing: 0.5px;
        }

        .po-split-header {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .po-split-header > div {
          flex: 1;
          background-color: #000;
          color: #fff;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          font-size: 11px;
        }
        .po-split-header > div:first-child {
          border-right: 1px solid #fff;
        }

        .po-split-body {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .po-split-col {
          flex: 1;
          padding: 0;
        }
        .po-split-col:first-child {
          border-right: 1px solid #000;
        }
        .po-field-row {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #000;
          min-height: 30px;
          padding: 4px 10px;
          font-size: 11px;
        }
        .po-field-row:last-child { border-bottom: none; }
        .po-field-label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 6px;
        }
        .po-field-value {
          flex-grow: 1;
          font-weight: bold;
          min-height: 14px;
        }
        .po-field-row-inline {
          display: flex;
          align-items: center;
          border-bottom: none;
        }
        .po-field-row-inline .po-field-value {
          border-bottom: 1px solid #000;
          margin-left: 4px;
          padding-left: 4px;
        }

        .po-section-bar {
          background-color: #000;
          color: #fff;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          font-size: 11px;
          border-bottom: 1px solid #000;
        }

        .po-transport-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid #000;
        }
        .po-transport-cell {
          padding: 8px 10px;
          font-size: 11px;
          border-right: 1px solid #000;
          min-height: 32px;
          display: flex;
          align-items: center;
        }
        .po-transport-cell:last-child { border-right: none; }
        .po-transport-cell b { margin-right: 4px; }

        .po-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 1px solid #000;
        }
        .po-table th, .po-table td {
          border: 1px solid #000;
          text-align: center;
          padding: 5px 4px;
          font-size: 11px;
        }
        .po-table th {
          background-color: #000;
          color: #fff;
          font-weight: bold;
        }
        .po-table th:first-child, .po-table td:first-child { border-left: none; }
        .po-table th:last-child, .po-table td:last-child { border-right: none; }
        .po-table .item-row td, .po-table .empty-row td { height: 24px; }
        .po-table .totals-label {
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        .po-table .amount-label {
          font-weight: bold;
          text-align: left;
          padding-left: 8px;
        }
        .po-table .amount-value {
          font-weight: bold;
          text-align: right;
          padding-right: 8px;
        }

        .po-note-section {
          border-bottom: 1px solid #000;
          padding: 8px 10px;
          min-height: 36px;
          font-size: 11px;
          display: flex;
          align-items: flex-start;
        }
        .po-note-section b { margin-right: 6px; white-space: nowrap; }

        .po-terms {
          padding: 8px 12px;
          font-size: 10.5px;
          line-height: 1.6;
          border-bottom: 1px solid #000;
        }
        .po-terms ol {
          margin: 0;
          padding-left: 18px;
        }
        .po-terms li { margin-bottom: 2px; }

        .po-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          min-height: 80px;
          margin-top: auto;
        }
        .po-sig-box {
          border-right: 1px solid #000;
          padding: 10px;
          font-weight: bold;
          font-size: 11px;
          text-align: center;
        }
        .po-sig-box:last-child {
          border-right: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
        }
        .po-sig-blue { color: #00AEEF; }
      `}</style>

      <div className="po-outer">
        <div className="po-inner">
          <div className="po-header">
            <div className="po-logo-wrap">
              <img src={LOGO2_BASE64} alt="Jagdamba Profile" className="po-logo" />
              <div className="po-logo-text">Jagdamba Profile</div>
            </div>
            <div className="po-header-body">
              <div className="po-company-name">Jagdamba Profile</div>
              <div className="po-contact">
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

          <div className="po-split-header">
            <div>SUPPLIER DETAILS</div>
            <div>PURCHASE ORDER DETAILS</div>
          </div>
          <div className="po-split-body">
            <div className="po-split-col">
              <div className="po-field-row">
                <span className="po-field-label">Party Name :</span>
                <span className="po-field-value">{po.supplierName}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">Address :</span>
                <span className="po-field-value">{po.supplierAddress || ''}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">GST Number :</span>
                <span className="po-field-value">{po.supplierGST || ''}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">Mobile Number :</span>
                <span className="po-field-value">{po.supplierMobile || ''}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">Email ID :</span>
                <span className="po-field-value">{po.supplierEmail || ''}</span>
              </div>
            </div>
            <div className="po-split-col">
              <div className="po-field-row">
                <span className="po-field-label">PO No :</span>
                <span className="po-field-value">{po.poNumber}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">PO Date :</span>
                <span className="po-field-value">{po.date}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">Payment Terms :</span>
                <span className="po-field-value">{po.paymentTerms || ''}</span>
              </div>
              <div className="po-field-row">
                <span className="po-field-label">Make :</span>
                <span className="po-field-value">{po.make || ''}</span>
              </div>
              <div className="po-field-row po-field-row-inline">
                <span className="po-field-label">UT Level :</span>
                <span className="po-field-value" style={{ flex: 1 }}>{po.utLevel || ''}</span>
                <span className="po-field-label" style={{ marginLeft: 12 }}>TC</span>
                <span className="po-field-value" style={{ flex: 1, maxWidth: 80 }}></span>
              </div>
            </div>
          </div>

          <div className="po-section-bar">VEHICLE TRANSPORT DETAILS</div>
          <div className="po-transport-row">
            <div className="po-transport-cell">
              <b>Vehicle Number :</b> {po.transportNumber || ''}
            </div>
            <div className="po-transport-cell">
              <b>Driver Mobile No :</b>
            </div>
            <div className="po-transport-cell">
              <b>Transport Name :</b> {po.transportName || ''}
            </div>
          </div>

          <table className="po-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr No</th>
                <th>Grade</th>
                <th>Thickness</th>
                <th>Width</th>
                <th>Length</th>
                <th>Nos</th>
                <th>Kg</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="item-row">
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
                <tr key={`empty-${idx}`} className="empty-row">
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

          <div className="po-section-bar">COMMERCIAL / QUALITY DETAILS</div>
          <div className="po-note-section">
            <b>Note</b>
            <span></span>
          </div>

          <div className="po-section-bar">GENERAL TERMS AND CONDITIONS</div>
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
