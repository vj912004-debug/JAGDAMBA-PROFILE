import React from 'react';
import type { ChallanRecord, Order } from '../store/AppContext';

interface ChallanPrintProps {
  challan: ChallanRecord;
  order?: Order;
}

export const ChallanPrint: React.FC<ChallanPrintProps> = ({ challan, order }) => {
  // Fill table with empty rows if needed
  const items = order?.items || [];
  const emptyRowsCount = Math.max(0, 8 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div className="bg-white p-4 mx-auto" id="challan-print-area" style={{ width: '210mm', minHeight: '297mm' }}>
      <style>{`
        .challan-container {
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
            padding: 8px;
            text-align: left;
        }

        .items-table th {
            text-align: center;
            font-weight: bold;
        }

        .items-table tr.empty-row td {
            height: 30px;
        }

        .items-table td:nth-child(1), .items-table th:nth-child(1) { width: 50px; text-align: center; }
        .items-table td:nth-child(3), .items-table th:nth-child(3) { width: 100px; text-align: center; }
        .items-table td:nth-child(4), .items-table th:nth-child(4) { width: 100px; text-align: right; }

        .charges-row td {
            font-weight: bold;
        }
        
        .charges-row td:first-child {
            text-align: right;
            border-right: none;
        }

        .charges-row td:last-child {
            border-left: none;
        }

        .footer-section {
            padding: 15px;
            font-size: 11px;
        }

        .footer-note {
            margin-bottom: 15px;
            line-height: 1.4;
        }

        .weightment {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            margin: 10px 0;
            text-decoration: underline;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            padding: 0 20px;
        }

        .sig-block {
            text-align: center;
            font-weight: bold;
        }

        @media print {
            body {
                background: none;
                padding: 0;
            }
            .challan-container {
                border: 2px solid #000;
                max-width: 100%;
            }
        }
      `}</style>

      <div className="challan-container">
        <div className="header-section">
            <div className="since-badge">SINCE 2002W</div>
            <div className="gstin">GSTIN: 24AJGPP9863R1Z5</div>
            <div className="company-name">JAGDAMBA PROFILE</div>
            <div className="tagline">Mfg.: M.S. & S.S., C.N.C. Profile Cutting Traders & Steel</div>
            <div className="address">Office: 504/1, GIDC, Industrial Estate, Makarpura, Vadodara -390010.</div>
            <div className="contact">
                Ph: 9824917250, 9824025001, 8799617250, 8799617251, 8799617252, 8799617254, 9099969507<br />
                E-mail ID: jagdambaprofile@gmail.com
            </div>
            <div className="document-title">DELIVERY CHALLAN</div>
        </div>

        <div className="info-section">
            <div className="info-left">
                <div className="info-row">
                    <span className="info-label">M/s.</span>
                    <span className="info-value">{challan.partyName}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Gadi Number</span>
                    <span className="info-value"></span>
                </div>
                <div className="info-row">
                    <span className="info-label">Driver No.</span>
                    <span className="info-value"></span>
                </div>
                <div className="info-row">
                    <span className="info-label">Lr No.</span>
                    <span className="info-value"></span>
                </div>
                <div className="info-row">
                    <span className="info-label">Delivery Address:</span>
                    <span className="info-value">{order?.deliveryAddress}</span>
                </div>
            </div>
            <div className="info-right">
                <div className="info-row">
                    <span className="info-label">Ch. No.</span>
                    <span className="info-value">{challan.challanNo}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Date</span>
                    <span className="info-value">{challan.challanDate}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">PO.No.</span>
                    <span className="info-value">{order?.orderNo}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">P.O. DATE</span>
                    <span className="info-value">{order?.orderDate}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">ORDER PAGE NO.:</span>
                    <span className="info-value"></span>
                </div>
                <div className="info-row">
                    <span className="info-label">PAYMENT</span>
                    <span className="info-value">{challan.status}</span>
                </div>
            </div>
        </div>

        <table className="items-table">
            <thead>
                <tr>
                    <th>Sr. No.</th>
                    <th>Description of Material</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>{item.partName || '-'} - {item.thickness} ({item.materialType} {item.materialGrade})</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity} {item.unitType}</td>
                        <td style={{ textAlign: 'right' }}>{item.rate.toLocaleString()}</td>
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
                
                <tr className="charges-row">
                    <td colSpan={2}>Loading Charge</td>
                    <td colSpan={2}></td>
                </tr>
                <tr className="charges-row">
                    <td colSpan={2}>Transport Charge</td>
                    <td colSpan={2}></td>
                </tr>
            </tbody>
        </table>

        <div className="footer-section">
            <p className="footer-note"><strong>Please receive the following goods in good condition & return duplicate copy duly signed.</strong></p>
            <p className="weightment">THIS VEHICLE IS GOING FOR WEIGHTMENT</p>
            <p className="footer-note">
                Please receive & confirm the above mentioned ordered Material & send the duplicate. Once the material is found, stamp and sign the duplicate challan. If this is a policy you are giving me, I have noted that I must be informed of any material problems within 7 days of receipt, otherwise, you will not be responsible.
            </p>
            
            <div className="signatures">
                <div className="sig-block">
                    Receiver's Signature<br />
                    with Rubber Stamp
                </div>
                <div className="sig-block">
                    For Jagdamba Profile
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
