import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';

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
  const minRows = 10;
  const totalRows = Math.max(minRows, items.length);
  const emptyRowsCount = totalRows - items.length;
  const emptyRows = Array.from({ length: emptyRowsCount });

  const basicAmount = po.totalAmount || 0;
  const gstAmount = Math.round(basicAmount * 0.18);
  const finalAmount = basicAmount + gstAmount;

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000' }} id="po-print-area">
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        #po-print-area {
          font-family: Arial, sans-serif;
          background: #fff;
          width: 210mm;
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
          color: #000;
        }
        #po-print-area * { box-sizing: border-box; }

        .po-container {
          width: 100%;
          background: #fff;
          border: 2px solid #000;
          padding: 10px;
        }

        .po-header { text-align: center; }
        .po-header h1 {
          color: #1fa3c6;
          margin: 0;
          font-size: 26px;
        }
        .po-header p {
          margin: 3px 0;
          font-size: 13px;
        }

        .po-title {
          background: #333;
          color: #fff;
          text-align: center;
          padding: 8px;
          font-weight: bold;
          margin-top: 10px;
        }

        .po-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .po-table th, .po-table td {
          border: 1px solid #000;
          padding: 6px;
          font-size: 13px;
        }
        .po-section-title {
          background: #333;
          color: #fff;
          font-weight: bold;
          text-align: left;
        }
        .po-center { text-align: center; }
        .po-right { text-align: right; }

        .po-items-head th {
          background: #333;
          color: #fff;
          font-weight: bold;
          text-align: center;
        }
        .po-item-row td { height: 30px; }

        .po-total-box td { height: 30px; }

        .po-footer-table td {
          height: 50px;
          text-align: center;
          vertical-align: top;
          font-weight: bold;
        }
        .po-signature {
          color: #1fa3c6;
          font-weight: bold;
        }
      `}</style>

      <div className="po-container">
        <div className="po-header">
          <h1>Jagdamba Profile</h1>
          <p>504/1A, GIDC Makarpura, Vadodara - 390010</p>
          <p>GST No: 24AJGPP9863R1Z5</p>
          <p>Mo: 9824917250, 9824025001, 8799617254 | Email: jagdambaprofile@gmail.com</p>
        </div>

        <div className="po-title">PURCHASE ORDER</div>

        <table className="po-table">
          <tbody>
            <tr>
              <th className="po-section-title">SUPPLIER DETAILS</th>
              <th className="po-section-title">PURCHASE ORDER DETAILS</th>
            </tr>
            <tr>
              <td>Party Name: {po.supplierName}</td>
              <td>PO No: {po.poNumber}</td>
            </tr>
            <tr>
              <td>Address: {po.supplierAddress || ''}</td>
              <td>PO Date: {formatDate(po.date)}</td>
            </tr>
            <tr>
              <td>GST Number: {po.supplierGST || ''}</td>
              <td>Payment Terms: {po.paymentTerms || ''}</td>
            </tr>
            <tr>
              <td>Mobile Number: {po.supplierMobile || ''}</td>
              <td>Make: {po.make || ''}</td>
            </tr>
            <tr>
              <td>Email ID: {po.supplierEmail || ''}</td>
              <td>
                UT Level: {po.utLevel || ''}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; TC {po.tc || ''}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="po-table">
          <tbody>
            <tr>
              <th colSpan={3} className="po-section-title">VEHICLE TRANSPORT DETAILS</th>
            </tr>
            <tr>
              <td>Vehicle Number: {po.transportNumber || ''}</td>
              <td>Driver Mobile No: {po.driverMobile || ''}</td>
              <td>Transport Name: {po.transportName || ''}</td>
            </tr>
          </tbody>
        </table>

        <table className="po-table">
          <thead>
            <tr className="po-items-head">
              <th>Sr No</th>
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
              <tr key={item.id || idx} className="po-item-row">
                <td className="po-center">{idx + 1}</td>
                <td>{item.grade || ''}</td>
                <td>{item.thickness || ''}</td>
                <td>{item.width || ''}</td>
                <td>{item.length || ''}</td>
                <td className="po-center">{item.nos || ''}</td>
                <td className="po-right">{item.kg ? formatNum(item.kg) : ''}</td>
                <td className="po-right">{item.rate ? formatNum(item.rate) : ''}</td>
                <td className="po-right">{item.amount ? formatNum(item.amount) : ''}</td>
              </tr>
            ))}
            {emptyRows.map((_, idx) => (
              <tr key={`empty-${idx}`} className="po-item-row">
                <td></td><td></td><td></td><td></td><td></td>
                <td></td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="po-table po-total-box">
          <tbody>
            <tr>
              <td rowSpan={3} className="po-center">TOTAL KG</td>
              <td>Basic Amount</td>
              <td className="po-right">{basicAmount ? formatNum(basicAmount) : ''}</td>
            </tr>
            <tr>
              <td>GST @ 18%</td>
              <td className="po-right">{gstAmount ? formatNum(gstAmount) : ''}</td>
            </tr>
            <tr>
              <td>Final Amount</td>
              <td className="po-right">{finalAmount ? formatNum(finalAmount) : ''}</td>
            </tr>
          </tbody>
        </table>

        <table className="po-table">
          <tbody>
            <tr>
              <th className="po-section-title">COMMERCIAL / QUALITY DETAILS</th>
            </tr>
            <tr>
              <td>Note {po.note ? `: ${po.note}` : ''}</td>
            </tr>
          </tbody>
        </table>

        <table className="po-table">
          <tbody>
            <tr>
              <th className="po-section-title">GENERAL TERMS AND CONDITIONS</th>
            </tr>
            <tr>
              <td>
                1. Material should be supplied strictly as per above size, grade and specification.<br />
                2. Test Certificate / MTC report wherever applicable.<br />
                3. Material should be free from heavy rust, lamination, oil, paint and major surface defects.<br />
                4. Final weight, rate and payment will be as per mutually agreed terms.<br />
                5. Delivery schedule and transport details must be confirmed before dispatch.
              </td>
            </tr>
          </tbody>
        </table>

        <table className="po-table po-footer-table">
          <tbody>
            <tr>
              <td>Prepared By</td>
              <td>Checked By</td>
              <td className="po-signature">
                For Jagdamba Profile<br /><br />
                Authorized Signatory
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
