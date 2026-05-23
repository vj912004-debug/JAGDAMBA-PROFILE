import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const items = po.items || [];
  const emptyRowsCount = Math.max(0, 12 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div className="bg-white p-0 mx-auto text-black font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id="po-print-area">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        #po-print-area {
          font-family: Arial, sans-serif;
          font-size: 12px;
          margin: 0 auto;
          padding: 15px;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }
        
        /* Main wrapper for the outer double border effect */
        .outer-container {
          border: 2px solid #ccc;
          padding: 8px;
          box-sizing: border-box;
          background-color: #fff;
          min-height: calc(297mm - 30px);
          display: flex;
          flex-direction: column;
        }
        
        /* Inner black border */
        .inner-container {
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          box-sizing: border-box;
        }
        
        /* Header Section */
        .main-header {
          text-align: center;
          background-color: #eef4fb; /* Light blue */
          color: #1a4d8c;
          font-size: 26px;
          font-weight: bold;
          padding: 12px;
          border-bottom: 1px solid #000;
        }
        .address-bar {
          padding: 6px 10px;
          border-bottom: 1px solid #000;
          text-align: left;
        }
        .po-title {
          font-weight: bold;
          padding: 6px 10px;
          border-bottom: 1px solid #000;
          font-size: 14px;
          text-align: left;
        }
        
        /* Section Headers */
        .section-header {
          background-color: #888;
          color: #fff;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          border-bottom: 1px solid #000;
          display: flex;
          box-sizing: border-box;
        }
        .section-header.full {
          display: block;
        }
        .section-header .left-title {
          flex: 6;
          border-right: 1px solid #fff;
          text-align: center;
        }
        .section-header .right-title {
          flex: 4;
          text-align: center;
        }
        
        /* Split Layout for Party / PO Details */
        .split-section {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .split-left {
          flex: 6;
          border-right: 1px solid #000;
          padding: 8px 10px;
          box-sizing: border-box;
        }
        .split-right {
          flex: 4;
          padding: 8px 10px;
          box-sizing: border-box;
        }
        
        /* Reusable form line elements */
        .form-row {
          display: flex;
          margin-bottom: 8px;
          align-items: flex-end;
        }
        .form-label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 5px;
        }
        .form-line {
          flex-grow: 1;
          border-bottom: 1px solid #000;
          height: 14px; /* Creates the underline effect */
          padding-left: 6px;
          font-weight: bold;
          font-size: 11.5px;
          line-height: 14px;
          text-align: left;
        }
        
        .full-section {
          padding: 8px 10px;
          border-bottom: 1px solid #000;
          box-sizing: border-box;
        }
    
        /* Main Data Table */
        .po-table {
          width: 100%;
          border-collapse: collapse;
          border-bottom: 1px solid #000;
        }
        .po-table th, .po-table td {
          border: 1px solid #000;
          text-align: center;
          padding: 6px;
          font-size: 11px;
        }
        .po-table th {
          background-color: #eef4fb;
          font-weight: bold;
        }
        .po-table th:first-child, .po-table td:first-child {
          border-left: none; /* Align to the container border */
        }
        .po-table th:last-child, .po-table td:last-child {
          border-right: none;
        }
        .item-row td {
          height: 24px;
        }
        .empty-row td {
          height: 24px; /* Fixed height for empty rows */
        }
        .totals-row td {
          font-weight: bold;
          background-color: #eee;
          height: 26px;
        }
        .totals-row .no-border {
          border-left: none;
          border-bottom: none;
          background-color: #fff;
        }
        
        /* Terms and Conditions list */
        .terms {
          font-size: 11px;
          text-align: left;
        }
        .terms ol {
          margin: 5px 0 5px 15px;
          padding: 0;
        }
        .terms li {
          margin-bottom: 3px;
        }
        
        /* Footer Signatures */
        .footer-signatures {
          display: flex;
          text-align: center;
          font-weight: bold;
          margin-top: auto; /* Push signature block to bottom */
        }
        .sig-box {
          flex: 1;
          border-right: 1px solid #000;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 80px;
          padding: 15px 10px 10px 10px;
          box-sizing: border-box;
        }
        .sig-box:last-child {
          border-right: none;
        }
      `}</style>

      <div className="outer-container">
        <div className="inner-container">
          <div className="main-header">JAGDAMBA PROFILE</div>
          <div className="address-bar">504/1/A, GIDC Makarpura, Vadodara - 390010</div>
          <div className="po-title">PURCHASE ORDER</div>

          <div className="section-header">
            <div className="left-title">SUPPLIER / PARTY DETAILS</div>
            <div className="right-title">PO DETAILS</div>
          </div>

          <div className="split-section">
            <div className="split-left">
              <div className="form-row">
                <div className="form-label">Party Name:</div>
                <div className="form-line">{po.supplierName}</div>
              </div>
              <div className="form-row">
                <div className="form-label">Address:</div>
                <div className="form-line">{po.supplierAddress || ''}</div>
              </div>
              <div className="form-row">
                <div className="form-label">GST Number:</div>
                <div className="form-line" style={{ flexGrow: 0, width: '250px' }}>{po.supplierGST || ''}</div>
              </div>
              <div className="form-row">
                <div className="form-label">E-mail ID:</div>
                <div className="form-line">{po.supplierEmail || ''}</div>
              </div>
            </div>
            <div className="split-right">
              <div className="form-row">
                <div className="form-label">PO No:</div>
                <div className="form-line">{po.poNumber}</div>
              </div>
              <div className="form-row">
                <div className="form-label">PO Date:</div>
                <div className="form-line">{po.date}</div>
              </div>
              <div className="form-row" style={{ marginTop: '28px' }}>
                <div className="form-label">Mobile:</div>
                <div className="form-line">{po.supplierMobile || ''}</div>
              </div>
            </div>
          </div>

          <div className="section-header full">DELIVERY & TRANSPORT DETAILS</div>
          <div className="full-section">
            <div className="form-row">
              <div className="form-label">Delivery Address:</div>
              <div className="form-line">{po.deliveryAddress || ''}</div>
            </div>
            <div className="form-row">
              <div className="form-label">Transport Name:</div>
              <div className="form-line">{po.transportName || ''}</div>
              <div className="form-label" style={{ marginLeft: '20px' }}>Transport Number:</div>
              <div className="form-line">{po.transportNumber || ''}</div>
            </div>
          </div>

          <table className="po-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Sr No</th>
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
                  <td>{item.kg ? item.kg.toLocaleString('en-IN') : ''}</td>
                  <td>{item.rate ? item.rate.toLocaleString('en-IN') : ''}</td>
                  <td>{item.amount ? item.amount.toLocaleString('en-IN') : ''}</td>
                </tr>
              ))}
              {emptyRows.map((_, idx) => (
                <tr key={`empty-${idx}`} className="empty-row">
                  <td>{items.length + idx + 1}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
              <tr className="totals-row">
                <td colSpan={6} className="no-border" style={{ textAlign: 'right', paddingRight: '15px' }}>Total Kg</td>
                <td>{po.totalKg ? po.totalKg.toLocaleString('en-IN') : ''}</td>
                <td className="no-border" style={{ textAlign: 'right', paddingRight: '15px', borderLeft: '1px solid #000' }}>Total Amount</td>
                <td>{po.totalAmount ? `₹${po.totalAmount.toLocaleString('en-IN')}` : ''}</td>
              </tr>
            </tbody>
          </table>

          <div className="section-header full" style={{ borderTop: 'none' }}>COMMERCIAL / QUALITY DETAILS</div>
          <div className="full-section">
            <div className="form-row">
              <div className="form-label">Payment Term:</div>
              <div className="form-line">{po.paymentTerms || ''}</div>
            </div>
            <div className="form-row">
              <div className="form-label">Make:</div>
              <div className="form-line" style={{ flex: 1 }}>{po.make || ''}</div>
              <div className="form-label" style={{ marginLeft: '20px' }}>UT Level:</div>
              <div className="form-line" style={{ flex: 2 }}>{po.utLevel || ''}</div>
            </div>
            <div className="form-row" style={{ marginTop: '8px' }}>
              <div className="form-label" style={{ fontWeight: 'normal' }}>
                <strong>Note:</strong> Plate not pitted and bend acceptable.
              </div>
            </div>
          </div>

          <div className="section-header full">GENERAL TERMS AND CONDITIONS</div>
          <div className="full-section terms">
            <ol>
              <li>Material should be supplied strictly as per above size, grade and specification.</li>
              <li>Test Certificate / MTC required wherever applicable.</li>
              <li>Material should be free from heavy rust, lamination, oil, paint and major surface defects.</li>
              <li>Final weight, rate and payment will be as per mutually agreed terms.</li>
              <li>Delivery schedule and transport details must be confirmed before dispatch.</li>
            </ol>
          </div>

          <div className="footer-signatures">
            <div className="sig-box">
              <div></div>
              <div>Prepared By</div>
            </div>
            <div className="sig-box">
              <div></div>
              <div>Checked By</div>
            </div>
            <div className="sig-box" style={{ borderBottom: '1px solid transparent' }}>
              <div>For Jagdamba Profile</div>
              <div>Authorized Signatory</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
