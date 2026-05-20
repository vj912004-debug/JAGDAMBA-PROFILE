import React from 'react';
import type { Order } from '../store/AppContext';

interface SalesOrderPrintProps {
  order: Order;
}

export const SalesOrderPrint: React.FC<SalesOrderPrintProps> = ({ order }) => {
  const items = order.items || [];
  const emptyRowsCount = Math.max(0, 12 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const tcText = order.tc === 'Yes' ? 'YES' : 'NO';
  const utText = order.ut === 'Yes' ? 'YES' : 'NO';
  const transportText = (order.transportationCharges && order.transportationCharges > 0) ? 'YES' : 'NO';
  const loadingText = (order.loadingUnloadingCharges && order.loadingUnloadingCharges > 0) ? 'YES' : 'NO';

  return (
    <div className="bg-white p-4 mx-auto" id="sales-order-print-area" style={{ width: '210mm', minHeight: '297mm' }}>
      <style>{`
        .order-container-print {
            width: 100%;
            margin: auto;
            background: #fff;
            border: 2px solid #000;
            padding: 10px;
            box-sizing: border-box;
            color: #000;
            font-family: Arial, sans-serif;
        }

        .header-print {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .header-print h1 {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
        }

        .header-print h3 {
            margin-top: 5px;
            font-size: 16px;
            margin: 5px 0 0 0;
        }

        .company-info-print {
            margin-top: 10px;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 10px;
        }

        .gst-print {
            margin-top: 10px;
            font-size: 11px;
            font-weight: bold;
        }

        .sales-title-print {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0;
            border: 2px solid #000;
            padding: 5px;
        }

        .info-table-print {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .info-table-print td {
            border: 1px solid #000;
            padding: 8px;
            height: 35px;
            font-size: 11px;
        }

        .main-table-print {
            width: 100%;
            border-collapse: collapse;
        }

        .main-table-print th,
        .main-table-print td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            height: 30px;
            font-size: 10px;
        }

        .main-table-print th {
            background: #eaeaea;
            font-weight: bold;
        }

        .footer-table-print {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .footer-table-print td {
            border: 1px solid #000;
            padding: 8px;
            height: 35px;
            font-size: 11px;
        }

        .signature-table-print {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .signature-table-print td {
            border: 1px solid #000;
            padding: 15px 10px 5px 10px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            height: 50px;
            vertical-align: bottom;
        }

        @media print {
            body {
                background: #fff;
            }
            .order-container-print {
                border: 2px solid #000;
            }
        }
      `}</style>

      <div className="order-container-print">
          <div className="header-print">
              <h1>JAGDAMBA PROFILE</h1>
              <h3>MS & SS CNC Profile Cutting Works | Steel Traders</h3>

              <div className="company-info-print">
                  Address: Makarpura GIDC / Por GIDC, Vadodara |
                  Mobile: 9824917250 |
                  Email: jagdambaprofile@gmail.com
              </div>

              <div className="gst-print">
                  GST No: 24AJGPP9863R1Z5
              </div>
          </div>

          <div className="sales-title-print">
              SALES ORDER
          </div>

          {/* Top Info */}
          <table className="info-table-print">
              <tbody>
                  <tr>
                      <td style={{ width: '20%' }}><b>Sales Order No</b></td>
                      <td style={{ width: '30%', fontWeight: 'bold', color: '#1e3a8a' }}>{order.orderNo}</td>
                      <td style={{ width: '20%' }}><b>Date</b></td>
                      <td style={{ width: '30%' }}>{order.orderDate}</td>
                  </tr>

                  <tr>
                      <td><b>Party PO No</b></td>
                      <td>{order.customerPONo || ''}</td>
                      <td><b>PO Date</b></td>
                      <td>{order.customerPODate || ''}</td>
                  </tr>

                  <tr>
                      <td><b>Party Name</b></td>
                      <td style={{ fontWeight: 'bold' }}>{order.partyName}</td>
                      <td><b>Contact Person</b></td>
                      <td>{order.contactPerson || ''}</td>
                  </tr>

                  <tr>
                      <td><b>Party Address</b></td>
                      <td>{order.deliveryAddress || ''}</td>
                      <td><b>GST No</b></td>
                      <td></td>
                  </tr>
              </tbody>
          </table>

          {/* Main Table */}
          <table className="main-table-print">
              <thead>
                  <tr>
                      <th style={{ width: '5%' }}>Sr</th>
                      <th style={{ width: '35%' }}>Item</th>
                      <th style={{ width: '15%' }}>Grade</th>
                      <th style={{ width: '10%' }}>Thickness</th>
                      <th style={{ width: '10%' }}>Width</th>
                      <th style={{ width: '10%' }}>Length</th>
                      <th style={{ width: '5%' }}>Nos</th>
                      <th style={{ width: '5%' }}>Rate</th>
                      <th style={{ width: '5%' }}>Rate Type</th>
                  </tr>
              </thead>
              <tbody>
                  {items.map((item, index) => (
                      <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td style={{ textAlign: 'left' }}>{item.partName || item.cuttingType}</td>
                          <td>{item.materialGrade || '-'}</td>
                          <td>{item.thickness || '-'}</td>
                          <td>{item.width || item.innerDiameter || '-'}</td>
                          <td>{item.length || item.outerDiameter || '-'}</td>
                          <td>{item.quantity}</td>
                          <td>{item.rate}</td>
                          <td>{item.unitType}</td>
                      </tr>
                  ))}
                  {emptyRows.map((_, index) => (
                      <tr key={`empty-${index}`}>
                          <td>{items.length + index + 1}</td>
                          <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                      </tr>
                  ))}
              </tbody>
          </table>

          {/* Footer */}
          <table className="footer-table-print">
              <tbody>
                  <tr>
                      <td style={{ width: '20%' }}><b>Delivery Address</b></td>
                      <td style={{ width: '30%' }}>{order.partyName} - {order.deliveryAddress || ''}</td>
                      <td style={{ width: '20%' }}><b>Payment Terms</b></td>
                      <td style={{ width: '30%' }}>{order.paymentTerms || ''}</td>
                  </tr>

                  <tr>
                      <td><b>TC</b></td>
                      <td>{tcText}</td>
                      <td><b>UT</b></td>
                      <td>{utText}</td>
                  </tr>

                  <tr>
                      <td><b>Transport</b></td>
                      <td>{transportText}</td>
                      <td><b>Loading</b></td>
                      <td>{loadingText}</td>
                  </tr>

                  <tr>
                      <td><b>Remarks</b></td>
                      <td colSpan={3}>{order.remark || ''}</td>
                  </tr>
              </tbody>
          </table>

          {/* Signature */}
          <table className="signature-table-print">
              <tbody>
                  <tr>
                      <td style={{ width: '33.33%' }}>Prepared By</td>
                      <td style={{ width: '33.33%' }}>Checked By</td>
                      <td style={{ width: '33.33%' }}>Authorized Signature</td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
  );
};
