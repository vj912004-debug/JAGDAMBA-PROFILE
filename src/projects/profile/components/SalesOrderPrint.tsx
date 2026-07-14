import React from 'react';
import { useAppContext, type Order, type PartyMaster } from '../store/AppContext';

export const SALES_ORDER_PRINT_AREA_ID = 'sales-order-print-area';

interface SalesOrderPrintProps {
  order: Order;
  parties?: PartyMaster[];
}

const YesNoCell: React.FC<{ value: boolean }> = ({ value }) => (
  <td className="center">
    {value ? (
      <>
        <strong>YES</strong> / NO
      </>
    ) : (
      <>
        YES / <strong>NO</strong>
      </>
    )}
  </td>
);

export const SalesOrderPrintInner: React.FC<{ order: Order; parties: PartyMaster[] }> = ({ order, parties }) => {
  const party = parties.find(p => p.partyName === order.partyName);
  
  const items = order.items || [];
  const emptyRowsCount = Math.max(0, 12 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000' }} className="p-0 mx-auto font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id={SALES_ORDER_PRINT_AREA_ID}>
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        #sales-order-print-area {
          font-family: Arial, sans-serif;
          margin: 0 auto;
          padding: 12px;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }
        
        /* Double Border Effect */
        .border-outer {
          border: 2px solid black;
          padding: 2px;
          height: 100%;
          box-sizing: border-box;
          min-height: calc(297mm - 24px);
          display: flex;
          flex-direction: column;
        }
        .border-inner {
          border: 1px solid black;
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-grow: 1;
          box-sizing: border-box;
        }

        /* Header Section */
        .header-section {
          text-align: center;
        }
        .header-section h1 {
          margin: 10px 0 5px 0;
          font-size: 26px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #000;
          font-weight: bold;
        }
        .header-subtitle {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
          padding: 6px;
          font-weight: bold;
          font-size: 14px;
          color: #000;
        }
        .header-contact {
          padding: 6px;
          font-size: 12px;
          color: #000;
        }
        .header-gst {
          border-top: 1px solid black;
          padding: 8px 10px;
          font-size: 13px;
          text-align: left;
          color: #000;
        }

        /* Title Bar */
        .sales-order-bar {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
          background-color: #e6e6e6;
          text-align: center;
          font-size: 22px;
          font-weight: bold;
          padding: 8px;
          letter-spacing: 0.5px;
          color: #000;
        }

        /* General Table Styling */
        .sales-order-print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: -1px; /* Overlaps borders to prevent double lines */
        }
        .sales-order-print-table th, .sales-order-print-table td {
          border: 1px solid black;
          padding: 8px 6px;
          font-size: 13px;
          color: #000;
        }
        /* Remove outer borders of tables to sit flush with inner wrapper */
        .sales-order-print-table th:first-child, .sales-order-print-table td:first-child { border-left: none; }
        .sales-order-print-table th:last-child, .sales-order-print-table td:last-child { border-right: none; }

        /* Top Order Info Table */
        .info-table td.label {
          font-weight: bold;
          width: 20%;
        }
        .info-table td.input {
          width: 30%;
        }
        .info-table td.address-cell {
          min-height: 52px;
          vertical-align: top;
        }

        /* Items Grid */
        .items-table th {
          font-weight: bold;
          background-color: #e6e6e6;
          text-align: center;
          padding: 10px 4px;
        }
        .items-table td {
          text-align: center;
          height: 28px; /* Consistent height for blank rows */
        }
        .items-table th:nth-child(1) { width: 5%; }
        .items-table th:nth-child(2) { width: 23%; }
        .items-table th:nth-child(3) { width: 10%; }
        .items-table th:nth-child(4) { width: 10%; }
        .items-table th:nth-child(5) { width: 10%; }
        .items-table th:nth-child(6) { width: 10%; }
        .items-table th:nth-child(7) { width: 7%; }
        .items-table th:nth-child(8) { width: 10%; }
        .items-table th:nth-child(9) { width: 15%; }

        /* Footer Info Table */
        .footer-table td.label {
          font-weight: bold;
          width: 20%;
        }
        .footer-table td.input {
          width: 30%;
        }
        .footer-table td.center {
          text-align: center;
        }

        /* Fixed Signature Block */
        .signature-table {
          border-bottom: none;
          margin-top: 36px;
        }
        .signature-table td {
          height: 70px; /* Provides space for physical signatures */
          vertical-align: bottom;
          text-align: center;
          font-weight: bold;
          width: 33.333%;
          padding-bottom: 12px;
          border-bottom: none; /* Removes bottom border to sit flush */
        }
      `}</style>

      <div className="border-outer">
        <div className="border-inner">
            
            <div className="header-section">
                <h1>JAGDAMBA PROFILE</h1>
                <div className="header-subtitle">MS & SS CNC Profile Cutting Works | Steel Traders</div>
                <div className="header-contact">Address: Makarpura GIDC / Por GIDC, Vadodara | Mobile: 9824917250 | Email: jagdambaprofile@gmail.com</div>
                <div className="header-gst">GST No: 24AJGPP9863R1Z5</div>
            </div>

            <div className="sales-order-bar">SALES ORDER</div>

            <table className="sales-order-print-table info-table">
              <tbody>
                <tr>
                    <td className="label">Sales Order No</td>
                    <td className="input" style={{ fontWeight: 'bold' }}>{order.orderNo}</td>
                    <td className="label">Date</td>
                    <td className="input">{order.orderDate}</td>
                </tr>
                <tr>
                    <td className="label">Party PO No</td>
                    <td className="input">{order.customerPONo || '-'}</td>
                    <td className="label">PO Date</td>
                    <td className="input">{order.customerPODate || '-'}</td>
                </tr>
                <tr>
                    <td className="label">Party Name</td>
                    <td className="input" style={{ fontWeight: 'bold' }}>{order.partyName}</td>
                    <td className="label">Contact Person</td>
                    <td className="input">{order.contactPerson || '-'}</td>
                </tr>
                <tr>
                    <td className="label">Party Address</td>
                    <td className="input address-cell">{party?.deliveryAddress || order.deliveryAddress || ''}</td>
                    <td className="label">GST No</td>
                    <td className="input">{party?.gstNumber || order.gstType || '-'}</td>
                </tr>
              </tbody>
            </table>

            <table className="sales-order-print-table items-table">
                <thead>
                    <tr>
                        <th>Sr</th>
                        <th>Item</th>
                        <th>Grade</th>
                        <th>Thickness</th>
                        <th>Width</th>
                        <th>Length</th>
                        <th>Nos</th>
                        <th>Rate</th>
                        <th>Rate Type</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td style={{ textAlign: 'left', paddingLeft: '8px' }}>{item.partName || item.drawingNumber || '-'}</td>
                        <td>{item.materialGrade || '-'}</td>
                        <td>{item.thickness ? `${item.thickness.replace(/mm/gi, '')}mm` : '-'}</td>
                        <td>{item.width || item.innerDiameter || '-'}</td>
                        <td>{item.length || item.outerDiameter || '-'}</td>
                        <td>{item.quantity}</td>
                        <td>{item.rate > 0 ? `₹${item.rate.toLocaleString('en-IN')}` : '-'}</td>
                        <td>{item.unitType || '-'}</td>
                      </tr>
                    ))}
                    {emptyRows.map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td>{items.length + index + 1}</td>
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
                </tbody>
            </table>

            <table className="sales-order-print-table footer-table">
              <tbody>
                <tr>
                    <td className="label">Delivery Address</td>
                    <td className="input">{order.deliveryAddress || '-'}</td>
                    <td className="label">Payment Terms</td>
                    <td className="input">{order.paymentTerms || '-'}</td>
                </tr>
                <tr>
                    <td className="label">TC</td>
                    <YesNoCell value={order.tc === 'Yes'} />
                    <td className="label">UT</td>
                    <YesNoCell value={order.ut === 'Yes'} />
                </tr>
                <tr>
                    <td className="label">Transport</td>
                    <YesNoCell value={!!order.handledBy} />
                    <td className="label">Loading</td>
                    <YesNoCell value={!!(order.loadingUnloadingCharges && order.loadingUnloadingCharges > 0)} />
                </tr>
                <tr>
                    <td className="label">Remarks</td>
                    <td colSpan={3}>{order.remark || '-'}</td>
                </tr>
              </tbody>
            </table>

            <table className="sales-order-print-table signature-table">
              <tbody>
                <tr>
                    <td>Prepared By</td>
                    <td>Checked By</td>
                    <td>Authorized Signature</td>
                </tr>
              </tbody>
            </table>

        </div>
      </div>
    </div>
  );
};

export const SalesOrderPrint: React.FC<SalesOrderPrintProps> = ({ order, parties: partiesProp }) => {
  const { parties: contextParties } = useAppContext();
  return <SalesOrderPrintInner order={order} parties={partiesProp ?? contextParties} />;
};
