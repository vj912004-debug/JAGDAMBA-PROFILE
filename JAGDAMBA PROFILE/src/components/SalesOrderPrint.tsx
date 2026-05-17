import React from 'react';
import type { Order } from '../store/AppContext';

interface SalesOrderPrintProps {
  order: Order;
}

export const SalesOrderPrint: React.FC<SalesOrderPrintProps> = ({ order }) => {
  const items = order.items || [];
  const emptyRowsCount = Math.max(0, 12 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const totalKg = items.reduce((sum, item) => sum + (Number((item.plateSize || '').split('x')[0]) || 0), 0); // Mocking Kg for now
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="bg-white p-4 mx-auto" id="sales-order-print-area" style={{ width: '210mm', minHeight: '297mm' }}>
      <style>{`
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        .order-container {
            width: 100%;
            margin: 0 auto;
            background: #fff;
            border: 2px solid #000;
            padding: 0;
            color: #000;
            font-family: Arial, sans-serif;
            font-size: 11px;
        }

        .header-section {
            text-align: center;
            border-bottom: 2px solid #000;
            padding: 10px;
            position: relative;
        }

        .company-name {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 2px;
            letter-spacing: 1px;
        }

        .address {
            margin-bottom: 2px;
            font-size: 11px;
        }

        .gst-no {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 11px;
        }

        .document-title {
            background-color: #000;
            color: #fff;
            display: inline-block;
            padding: 4px 20px;
            font-size: 14px;
            font-weight: bold;
            border-radius: 2px;
        }

        .top-info {
            display: flex;
            border-bottom: 2px solid #000;
        }

        .party-details, .order-details {
            width: 50%;
            padding: 8px;
        }

        .party-details {
            border-right: 2px solid #000;
        }

        .info-row {
            display: flex;
            margin-bottom: 4px;
            align-items: flex-end;
        }

        .info-label {
            font-weight: bold;
            min-width: 80px;
        }

        .info-value {
            border-bottom: 1px dotted #000;
            flex-grow: 1;
            min-height: 14px;
            padding-left: 5px;
        }

        .delivery-details {
            padding: 8px;
            border-bottom: 2px solid #000;
        }

        .delivery-title {
            font-weight: bold;
            text-align: center;
            text-decoration: underline;
            margin-bottom: 8px;
            font-size: 12px;
        }

        .delivery-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 15px;
        }

        .delivery-row-full {
            grid-column: 1 / -1;
            display: flex;
            margin-bottom: 4px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
            font-size: 10px;
        }

        .items-table th {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        .items-table th:nth-child(2), .items-table td:nth-child(2) {
            text-align: left;
            width: 25%;
        }

        .items-table tr td {
            height: 22px;
        }

        .totals-row td {
            font-weight: bold;
            text-align: right;
            border-top: 2px solid #000;
        }

        .totals-row td.total-val {
            text-align: center;
        }

        .footer-signatures {
            display: flex;
            justify-content: space-between;
            padding: 40px 20px 10px 20px;
        }

        .sig-block {
            text-align: center;
            font-weight: bold;
            border-top: 1px solid #000;
            width: 150px;
            padding-top: 5px;
            font-size: 11px;
        }
      `}</style>

      <div className="order-container">
          <div className="header-section">
              <div className="company-name">JAGDAMBA PROFILE</div>
              <div className="address">504/1/A, GIDC Makarpura, Vadodara - 390010</div>
              <div className="gst-no">GST No: 24AJGPP9863R1Z5</div>
              <div className="document-title">SALES ORDER</div>
          </div>

          <div className="top-info">
              <div className="party-details">
                  <div className="info-row"><span className="info-label">Party Name:</span><span className="info-value">{order.partyName}</span></div>
                  <div className="info-row"><span className="info-label">Address:</span><span className="info-value">{order.deliveryAddress}</span></div>
                  <div className="info-row"><span className="info-label">GST:</span><span className="info-value"></span></div>
                  <div className="info-row"><span className="info-label">Email ID:</span><span className="info-value"></span></div>
                  <div className="info-row"><span className="info-label">Mobile Number:</span><span className="info-value">{order.mobileNumber}</span></div>
              </div>
              <div className="order-details">
                  <div className="info-row"><span className="info-label">SO No:</span><span className="info-value">{order.orderNo}</span></div>
                  <div className="info-row"><span className="info-label">SO Date:</span><span className="info-value">{order.orderDate}</span></div>
                  <div className="info-row"><span className="info-label">PO No:</span><span className="info-value"></span></div>
                  <div className="info-row"><span className="info-label">PO Date:</span><span className="info-value"></span></div>
              </div>
          </div>

          <div className="delivery-details">
              <div className="delivery-title">DELIVERY & OTHER DETAILS</div>
              <div className="delivery-row-full">
                  <span className="info-label" style={{ minWidth: '220px' }}>Delivery Address (Party Name + Address):</span>
                  <span className="info-value">{order.partyName} - {order.deliveryAddress}</span>
              </div>
              <div className="delivery-grid">
                  <div className="info-row"><span className="info-label">Transport Extra:</span><span className="info-value">₹{(order.transportationCharges || 0).toLocaleString()}</span></div>
                  <div className="info-row"><span className="info-label">Delivery Type:</span><span className="info-value">{order.deliveryOption || '-'}</span></div>
                  <div className="info-row"><span className="info-label">Loading & Unloading:</span><span className="info-value">₹{(order.loadingUnloadingCharges || 0).toLocaleString()}</span></div>
                  <div className="info-row"><span className="info-label">Burning Loss:</span><span className="info-value"></span></div>
                  <div className="info-row"><span className="info-label">Payment Term:</span><span className="info-value">{order.paymentTerms || '-'}</span></div>
                  <div className="info-row"><span className="info-label">TC:</span><span className="info-value"></span></div>
                  <div className="info-row"><span className="info-label">GST Status:</span><span className="info-value" style={{ fontWeight: 'bold' }}>{order.gstType || 'GST 18%'}</span></div>
                  <div className="info-row"><span className="info-label">UT:</span><span className="info-value"></span></div>
              </div>
              <div className="delivery-row-full" style={{ marginTop: '4px' }}>
                  <span className="info-label" style={{ minWidth: '40px' }}>Note:</span>
                  <span className="info-value">{order.remark}</span>
              </div>
          </div>

          <table className="items-table">
              <thead>
                  <tr>
                      <th>Sr</th>
                      <th>Item</th>
                      <th>Grade</th>
                      <th>Thk</th>
                      <th>Width</th>
                      <th>Length</th>
                      <th>Nos</th>
                      <th>Kg</th>
                      <th>Rate</th>
                      <th>Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {items.map((item, index) => (
                      <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.partName || item.cuttingType}</td>
                          <td>{item.materialGrade}</td>
                          <td>{item.thickness}</td>
                          <td>{item.width || item.innerDiameter || '-'}</td>
                          <td>{item.length || item.outerDiameter || '-'}</td>
                          <td>{item.quantity}</td>
                          <td>-</td>
                          <td>{item.rate}</td>
                          <td>{(item.amount || 0).toLocaleString()}</td>
                      </tr>
                  ))}
                  {emptyRows.map((_, index) => (
                      <tr key={`empty-${index}`}>
                          <td>{items.length + index + 1}</td>
                          <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      </tr>
                  ))}
                  
                  <tr className="totals-row">
                      <td colSpan={7}>Total Kg</td>
                      <td className="total-val">-</td>
                      <td>Grand Total</td>
                      <td className="total-val">₹{(totalAmount + (order.transportationCharges || 0) + (order.loadingUnloadingCharges || 0)).toLocaleString()}</td>
                  </tr>
              </tbody>
          </table>

          {order.termsAndConditions && (
              <div style={{ padding: '8px', borderBottom: '2px solid #000', fontSize: '9px' }}>
                  <strong>Terms & Conditions:</strong>
                  <div style={{ marginTop: '2px', whiteSpace: 'pre-wrap' }}>{order.termsAndConditions}</div>
              </div>
          )}

          <div className="footer-signatures">
              <div className="sig-block">Prepared By</div>
              <div className="sig-block">Checked By</div>
              <div className="sig-block">Authorized Sign</div>
          </div>
      </div>
    </div>
  );
};
