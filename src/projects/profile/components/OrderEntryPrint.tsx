import React from 'react';
import type { Order } from '../store/AppContext';

interface OrderEntryPrintProps {
  order: Order;
}

export const OrderEntryPrint: React.FC<OrderEntryPrintProps> = ({ order }) => {
  const items = order.items || [];
  const emptyRowsCount = Math.max(0, 8 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', width: '210mm', minHeight: '297mm' }} className="p-4 mx-auto" id="order-print-area">
      <style>{`
        .ack-container {
            width: 100%;
            margin: 0 auto;
            background: #fff;
            border: 2px solid #000;
            padding: 0;
            color: #000;
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .header-section {
            text-align: center;
            border-bottom: 2px solid #000;
            padding: 15px;
            position: relative;
        }

        .since-badge {
            position: absolute;
            top: 15px;
            left: 15px;
            font-weight: bold;
            font-size: 10px;
        }

        .gstin {
            position: absolute;
            top: 15px;
            right: 15px;
            font-weight: bold;
            font-size: 12px;
        }

        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 1px;
        }

        .tagline {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .address {
            margin-bottom: 5px;
        }

        .contact {
            margin-bottom: 10px;
        }

        .document-title {
            background-color: #000;
            color: #fff;
            display: inline-block;
            padding: 5px 20px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 3px;
        }

        .info-section {
            display: flex;
            border-bottom: 2px solid #000;
        }

        .info-left, .info-right {
            width: 50%;
            padding: 10px;
        }

        .info-left {
            border-right: 2px solid #000;
        }

        .info-row {
            display: flex;
            margin-bottom: 8px;
        }

        .info-label {
            font-weight: bold;
            min-width: 100px;
        }

        .info-value {
            border-bottom: 1px dotted #000;
            flex-grow: 1;
            padding-left: 5px;
        }

        .info-right .info-label {
            min-width: 120px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
        }

        .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left;
        }

        .items-table th {
            text-align: center;
            font-weight: bold;
            background-color: #f2f2f2;
        }

        .items-table tr.empty-row td {
            height: 25px;
        }

        .items-table td:nth-child(1), .items-table th:nth-child(1) { width: 40px; text-align: center; }
        .items-table td:nth-child(3), .items-table th:nth-child(3) { width: 80px; text-align: center; }
        .items-table td:nth-child(4), .items-table th:nth-child(4) { width: 80px; text-align: right; }

        .footer-section {
            padding: 15px;
            font-size: 11px;
            border-top: 1px solid #000;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding: 0 20px;
        }

        .sig-block {
            text-align: center;
            font-weight: bold;
            width: 200px;
        }

        .urgent-badge {
            color: red;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            margin: 10px 0;
            display: block;
        }

        @media print {
            body { background: none; padding: 0; }
            .ack-container { border: 2px solid #000; max-width: 100%; }
        }
      `}</style>

      <div className="ack-container">
        <div className="header-section">
            <div className="since-badge">SINCE 2002W</div>
            <div className="gstin">GSTIN: 24AJGPP9863R1Z5</div>
            <div className="company-name">JAGDAMBA PROFILE</div>
            <div className="tagline">Mfg.: M.S. & S.S., C.N.C. Profile Cutting Traders & Steel</div>
            <div className="address">Office: 504/1, GIDC, Industrial Estate, Makarpura, Vadodara - 390010</div>
            <div className="contact">
                Ph: 9824917250, 9824025001, 8799617250, 8799617251, 8799617252, 8799617254, 9099969507<br />
                E-mail ID: jagdambaprofile@gmail.com
            </div>
            <div className="document-title">ORDER ENTRY ACKNOWLEDGEMENT</div>
        </div>

        {order.urgent && <div className="urgent-badge">★★★ URGENT ORDER ★★★</div>}

        <div className="info-section">
            <div className="info-left">
                <div className="info-row">
                    <span className="info-label">Customer:</span>
                    <span className="info-value">{order.partyName}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Contact Person:</span>
                    <span className="info-value">{order.contactPerson || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Mobile No.:</span>
                    <span className="info-value">{order.mobileNumber || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{order.deliveryAddress || '-'}</span>
                </div>
            </div>
            <div className="info-right">
                <div className="info-row">
                    <span className="info-label">Order No.:</span>
                    <span className="info-value">{order.orderNo}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Order Date:</span>
                    <span className="info-value">{order.orderDate}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Cust. PO No.:</span>
                    <span className="info-value">{order.customerPONo || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Cust. PO Date:</span>
                    <span className="info-value">{order.customerPODate || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Delivery Date:</span>
                    <span className="info-value">{order.deliveryDate || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Handled By:</span>
                    <span className="info-value">{order.handledBy || 'System'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Delivery Type:</span>
                    <span className="info-value">{order.deliveryOption || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">GST Status:</span>
                    <span className="info-value" style={{ fontWeight: 'bold' }}>{order.gstType || 'GST 18%'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Payment Terms:</span>
                    <span className="info-value">{order.paymentTerms || '-'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">TC Required:</span>
                    <span className="info-value" style={{ fontWeight: 'bold' }}>{order.tc || 'No'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">UT Required:</span>
                    <span className="info-value" style={{ fontWeight: 'bold' }}>{order.ut || 'No'}</span>
                </div>
            </div>
        </div>

        <table className="items-table">
            <thead>
                <tr>
                    <th>Sr.</th>
                    <th>Description of Material</th>
                    <th>Qty</th>
                    <th>Grade</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>
                            <div style={{ fontWeight: 'bold' }}>{item.partName || '-'}</div>
                            <div style={{ fontSize: '10px', marginTop: '2px' }}>
                                {item.thickness} | {item.cuttingType} | {item.outerDiameter ? `OD: ${item.outerDiameter} x ID: ${item.innerDiameter || '0'}` : item.length ? `${item.length}x${item.width}` : (item.plateSize || '-')}
                            </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity} {item.unitType}</td>
                        <td style={{ textAlign: 'center' }}>{item.materialGrade}</td>
                    </tr>
                ))}
                {emptyRows.map((_, index) => (
                    <tr key={`empty-${index}`} className="empty-row">
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="footer-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '60%' }}>
                    <strong>Remarks:</strong> {order.remark || 'No special instructions.'}
                </div>
                <div style={{ width: '35%', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Transportation:</span>
                        <strong>₹{(order.transportationCharges || 0).toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Loading & Unloading:</span>
                        <strong>₹{(order.loadingUnloadingCharges || 0).toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            {order.termsAndConditions && (
                <div style={{ marginBottom: '10px', fontSize: '10px', border: '1px solid #000', padding: '5px' }}>
                    <strong>Terms & Conditions:</strong>
                    <div style={{ marginTop: '3px', whiteSpace: 'pre-wrap' }}>{order.termsAndConditions}</div>
                </div>
            )}
            
            <div className="signatures">
                <div className="sig-block" style={{ paddingTop: '5px' }}>
                    Customer Signature<br />
                    with Rubber Stamp
                </div>
                <div className="sig-block" style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
                    Authorized Signatory
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
