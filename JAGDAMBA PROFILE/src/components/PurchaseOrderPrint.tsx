import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const emptyRowsCount = 12 - po.items.length;
  const emptyRows = Array.from({ length: Math.max(0, emptyRowsCount) });

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
          color: #000;
          background: white;
          padding: 20px;
          box-sizing: border-box;
          width: 210mm;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border: 1px solid #ccc;
          padding: 10px;
          margin-bottom: 5px;
        }
        .header h1 {
          color: #2c5a8d;
          margin: 0;
          font-size: 24px;
          letter-spacing: 1px;
        }
        .header p {
          margin: 5px 0;
          font-weight: bold;
        }
        .po-title {
          font-weight: bold;
          border-top: 1px solid #ccc;
          margin-top: 10px;
          padding-top: 5px;
          text-decoration: underline;
        }
        .section-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
        }
        .section-box {
          border: 1px solid #444;
          margin-bottom: -1px;
        }
        .section-header {
          background-color: #888;
          color: white;
          padding: 4px 10px;
          font-weight: bold;
          text-align: center;
          font-size: 11px;
          text-transform: uppercase;
        }
        .field {
          padding: 5px 10px;
          display: flex;
        }
        .field label {
          font-weight: bold;
          margin-right: 8px;
          white-space: nowrap;
        }
        .field span {
          flex-grow: 1;
          border-bottom: 1px dotted #ccc;
          min-height: 1.2em;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: -1px;
        }
        .items-table th {
          background-color: #d9eaf7;
          border: 1px solid #444;
          padding: 8px 4px;
          font-size: 11px;
        }
        .items-table td {
          border: 1px solid #444;
          height: 28px;
          text-align: center;
        }
        .text-right { text-align: right !important; padding-right: 10px; }
        .bold { font-weight: bold; }
        .note { 
          padding: 8px 10px; 
          margin: 0; 
          border-top: 1px solid #444;
        }
        .terms {
          padding: 10px 30px;
          margin: 0;
          font-size: 10.5px;
          line-height: 1.4;
        }
        .footer-sign {
          display: grid;
          grid-template-columns: 1fr 1fr 1.5fr;
          text-align: center;
        }
        .sign-box {
          border: 1px solid #444;
          height: 90px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px;
        }
        .company-name { font-weight: bold; margin-bottom: 10px; }
        .sign-space { flex-grow: 1; }
      `}</style>

      <header className="header">
        <h1>JAGDAMBA PROFILE</h1>
        <p>504/1/A, GIDC Makarpura, Vadodara - 390010</p>
        <div className="po-title">PURCHASE ORDER</div>
      </header>

      <div className="section-grid">
        <div className="section-box">
          <div className="section-header">SUPPLIER / PARTY DETAILS</div>
          <div className="field"><label>Party Name:</label><span>{po.supplierName}</span></div>
          <div className="field"><label>Address:</label><span>{po.supplierAddress}</span></div>
          <div className="field"><label>GST Number:</label><span>{po.supplierGST}</span></div>
          <div className="field"><label>E-mail ID:</label><span>{po.supplierEmail}</span></div>
        </div>
        <div className="section-box">
          <div className="section-header">PO DETAILS</div>
          <div className="field"><label>PO No:</label><span>{po.poNumber}</span></div>
          <div className="field"><label>PO Date:</label><span>{po.date}</span></div>
          <div className="field"><label>Mobile:</label><span>{po.supplierMobile}</span></div>
        </div>
      </div>

      <div className="section-box">
        <div className="section-header">DELIVERY & TRANSPORT DETAILS</div>
        <div className="field"><label>Delivery Address:</label><span>{po.deliveryAddress}</span></div>
        <div className="grid-2">
          <div className="field"><label>Transport Name:</label><span>{po.transportName}</span></div>
          <div className="field"><label>Transport Number:</label><span>{po.transportNumber}</span></div>
        </div>
      </div>

      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>Sr No</th>
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
          {po.items.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>{item.grade}</td>
              <td>{item.thickness}</td>
              <td>{item.width}</td>
              <td>{item.length}</td>
              <td>{item.nos}</td>
              <td>{item.kg.toLocaleString()}</td>
              <td>{item.rate.toLocaleString()}</td>
              <td>{item.amount.toLocaleString()}</td>
            </tr>
          ))}
          {emptyRows.map((_, idx) => (
            <tr key={`empty-${idx}`}>
              <td>{po.items.length + idx + 1}</td>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} className="text-right bold">Total Kg</td>
            <td className="bold">{po.totalKg.toLocaleString()}</td>
            <td className="bold">Total Amount</td>
            <td className="bold">₹{po.totalAmount.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <div className="section-box">
        <div className="section-header">COMMERCIAL / QUALITY DETAILS</div>
        <div className="field"><label>Payment Term:</label><span>{po.paymentTerms}</span></div>
        <div className="grid-2">
          <div className="field"><label>Make:</label><span>{po.make}</span></div>
          <div className="field"><label>UT Level:</label><span>{po.utLevel}</span></div>
        </div>
        <div className="note"><strong>Note:</strong> Plate not pitted and bend acceptable.</div>
      </div>

      <div className="section-box">
        <div className="section-header">GENERAL TERMS AND CONDITIONS</div>
        <ol className="terms">
          <li>Material should be supplied strictly as per above size, grade and specification.</li>
          <li>Test Certificate / MTC required wherever applicable.</li>
          <li>Material should be free from heavy rust, lamination, oil, paint and major surface defects.</li>
          <li>Final weight, rate and payment will be as per mutually agreed terms.</li>
          <li>Delivery schedule and transport details must be confirmed before dispatch.</li>
        </ol>
      </div>

      <div className="footer-sign">
        <div className="sign-box">
          <div className="bold">Prepared By</div>
        </div>
        <div className="sign-box">
          <div className="bold">Checked By</div>
        </div>
        <div className="sign-box">
          <div className="company-name">For Jagdamba Profile</div>
          <div className="sign-space"></div>
          <div className="bold">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};
