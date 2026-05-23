import React from 'react';
import { useAppContext, type ChallanRecord, type Order } from '../store/AppContext';

interface ChallanPrintProps {
  challan: ChallanRecord;
  order?: Order;
}

export const ChallanPrint: React.FC<ChallanPrintProps> = ({ challan, order }) => {
  const { dispatches, parties } = useAppContext();
  const dispatch = dispatches.find(d => d.orderNo === challan.orderNo);
  const party = parties.find(p => p.partyName === challan.partyName);
  
  const vehicleNo = dispatch?.vehicleNo || '';
  const driverMobile = ''; // Dotted/blank line if not available

  const items = order?.items || [];
  const emptyRowsCount = Math.max(0, 10 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const totalNos = items.reduce((sum, item) => item.unitType === 'Nos' ? sum + item.quantity : sum, 0);
  const totalKg = items.reduce((sum, item) => item.unitType === 'Kg' ? sum + item.quantity : sum + (item.totalWeight || 0), 0);

  return (
    <div className="bg-white p-0 mx-auto text-black font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id="challan-print-area">
      <style>{`
        @page {
          size: A4;
          margin: 0;
        }
        #challan-print-area {
          font-family: Arial, sans-serif;
          margin: 0 auto;
          padding: 15px;
          background-color: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
        }

        /* Double Border Effect */
        .border-outer {
          border: 2px solid black;
          padding: 3px;
          height: 100%;
          box-sizing: border-box;
          min-height: calc(297mm - 30px);
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
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 10px 15px 5px 15px;
          box-sizing: border-box;
        }
        
        .logo-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
        }
        
        .company-logo {
          width: 100%;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .company-title {
          font-family: 'Georgia', serif;
          font-size: 36px;
          font-weight: 900;
          letter-spacing: 1px;
          color: #222;
          flex-grow: 1;
          text-align: center;
          margin-bottom: 5px;
        }

        .contact-info-bar {
          padding: 0 10px 8px 10px;
          font-size: 12px;
          border-bottom: 1px solid black;
          box-sizing: border-box;
        }
        .contact-row-flex {
          display: flex;
          justify-content: space-between;
          margin-top: 3px;
        }

        /* Title Bar */
        .document-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          padding: 6px;
          border-bottom: 1px solid black;
          box-sizing: border-box;
        }

        /* Global Table Styles */
        .flush-table {
          width: 100%;
          border-collapse: collapse;
        }
        .flush-table th, .flush-table td {
          border: 1px solid black;
          font-size: 12px;
          color: #000;
        }
        
        /* Flush Tables (for items touching the main borders) */
        .flush-table { border-left: none; border-right: none; }
        .flush-table th:first-child, .flush-table td:first-child { border-left: none; }
        .flush-table th:last-child, .flush-table td:last-child { border-right: none; }

        /* Dark Headers */
        .dark-header {
          background-color: #2b2b2b;
          color: white;
          font-weight: bold;
          text-align: left;
          padding: 6px 8px;
          font-size: 11px;
          text-transform: uppercase;
        }
        .dark-header.center {
          text-align: center;
        }

        /* Detail Tables (Party / Order) */
        .details-table td {
          width: 50%;
          padding: 6px 8px;
          vertical-align: top;
          height: 28px;
          box-sizing: border-box;
        }
        
        /* Vehicle Transport Section */
        .vehicle-table td {
          width: 33.33%;
          padding: 6px 8px;
          height: 28px;
          box-sizing: border-box;
        }

        /* Items Grid */
        .items-table {
          border-top: 1px solid black;
        }
        .items-table th {
          padding: 8px 4px;
        }
        .items-table td {
          height: 24px;
          text-align: center;
          box-sizing: border-box;
        }
        /* Specific widths */
        .items-table th:nth-child(1) { width: 5%; }
        .items-table th:nth-child(2) { width: 22%; }
        .items-table th:nth-child(3) { width: 9%; }
        .items-table th:nth-child(4) { width: 9%; }
        .items-table th:nth-child(5) { width: 9%; }
        .items-table th:nth-child(6) { width: 9%; }
        .items-table th:nth-child(7) { width: 8%; }
        .items-table th:nth-child(8) { width: 10%; }
        .items-table th:nth-child(9) { width: 19%; }

        .items-table .total-row td {
          height: 28px;
        }

        /* Commercial / Quality Section */
        .commercial-container {
          display: flex;
          width: 100%;
          border-bottom: 1px solid black;
          box-sizing: border-box;
        }
        .commercial-left {
          width: 60%;
          border-right: 1px solid black;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .commercial-right {
          width: 40%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .commercial-cell {
          padding: 8px 10px;
          font-size: 12px;
          box-sizing: border-box;
        }
        .border-bot { border-bottom: 1px solid black; }

        /* Terms & Conditions */
        .terms-section {
          padding: 8px 10px;
          font-size: 11.5px;
          line-height: 1.6;
          border-bottom: 1px solid black;
          box-sizing: border-box;
        }
        .terms-row {
          display: flex;
          justify-content: space-between;
        }

        /* Fixed Signatures Section */
        .signature-wrapper {
          padding: 10px;
          flex-grow: 1; 
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          box-sizing: border-box;
        }
        .signature-table-fixed {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid black;
        }
        .signature-table-fixed td {
          border: 1px solid black;
          width: 33.333%;
          padding: 0;
          vertical-align: top;
          box-sizing: border-box;
        }
        .sig-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 110px;
          padding: 8px 10px;
          box-sizing: border-box;
        }
        .sig-title {
          font-weight: bold;
          font-size: 12px;
        }
        .sig-company {
          font-weight: bold;
          font-size: 15px;
          align-self: flex-end;
        }
      `}</style>

      <div className="border-outer">
        <div className="border-inner">

            <div className="header-container">
                <div className="logo-area">
                    <img src="/logo.jpg" alt="Jagdamba Profile Logo" className="company-logo" onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const svgSibling = e.currentTarget.nextElementSibling as HTMLElement;
                      if (svgSibling) svgSibling.style.display = 'block';
                    }} />
                    <svg width="55" height="55" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none', margin: '0 auto' }}>
                      <defs>
                        <radialGradient id="redSphere" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stopColor="#ff8888" />
                          <stop offset="40%" stopColor="#ff0000" />
                          <stop offset="100%" stopColor="#aa0000" />
                        </radialGradient>
                        <radialGradient id="blueGlow" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </radialGradient>
                      </defs>
                      <path d="M30 40 C30 20, 80 15, 80 50 C80 85, 45 95, 30 75 L30 105" fill="none" stroke="url(#blueGlow)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="30" cy="30" r="16" fill="url(#redSphere)" />
                    </svg>
                </div>
                <div className="company-title">Jagdamba Profile</div>
                <div style={{ width: '80px' }}></div>
            </div>

            <div className="contact-info-bar">
                <div>504/1A, GIDC Makarpura, Vadodara -390010.</div>
                <div>GST No: 24AJGPP9863R1Z5</div>
                <div className="contact-row-flex">
                    <div>Mo: 8799617251, 8799617252, 8799617254, 9824025001</div>
                    <div>Email: jagdambaprofile@gmail.com</div>
                </div>
            </div>

            <div className="document-title">DELIVERY CHALLAN</div>

            <table className="flush-table details-table">
              <tbody>
                <tr>
                    <th className="dark-header" style={{ borderRight: '1px solid white' }}>PARTY DETAILS</th>
                    <th className="dark-header">CHALLAN / ORDER DETAILS</th>
                </tr>
                <tr>
                    <td>Party Name: <strong style={{ marginLeft: '4px' }}>{challan.partyName}</strong></td>
                    <td>Challan No: <strong style={{ marginLeft: '4px', color: '#1e3a8a' }}>{challan.challanNo}</strong></td>
                </tr>
                <tr>
                    <td rowSpan={2}>Address: <span style={{ marginLeft: '4px' }}>{party?.deliveryAddress || order?.deliveryAddress || ''}</span></td>
                    <td>Challan Date: <span style={{ marginLeft: '4px' }}>{challan.challanDate}</span></td>
                </tr>
                <tr>
                    <td>PO No: <span style={{ marginLeft: '4px' }}>{order?.orderNo || ''}</span></td>
                </tr>
                <tr>
                    <td>GST Number: <span style={{ marginLeft: '4px' }}>{party?.gstNumber || order?.gstType || ''}</span></td>
                    <td>PO Date: <span style={{ marginLeft: '4px' }}>{order?.orderDate || ''}</span></td>
                </tr>
                <tr>
                    <td>Mobile Number: <span style={{ marginLeft: '4px' }}>{party?.mobileNumber || order?.mobileNumber || ''}</span></td>
                    <td rowSpan={2}>Order Page Number: <span style={{ marginLeft: '4px' }}>1 of 1</span></td>
                </tr>
                <tr>
                    <td>Email ID : <span style={{ marginLeft: '4px' }}>{party?.email || ''}</span></td>
                </tr>
              </tbody>
            </table>

            <table className="flush-table vehicle-table" style={{ borderTop: '1px solid black' }}>
              <tbody>
                <tr>
                    <th colSpan={3} className="dark-header center">VEHICLE TRANSPORT DETAILS</th>
                </tr>
                <tr>
                    <td>Vehicle Number: <strong style={{ marginLeft: '4px' }}>{vehicleNo}</strong></td>
                    <td>Driver Mobile No: <span style={{ marginLeft: '4px' }}>{driverMobile}</span></td>
                    <td>Payment Terms : <span style={{ marginLeft: '4px' }}>{order?.paymentTerms || ''}</span></td>
                </tr>
              </tbody>
            </table>

            <table className="flush-table items-table">
                <thead>
                    <tr>
                        <th className="dark-header center">Sr No</th>
                        <th className="dark-header center">Item</th>
                        <th className="dark-header center">Grade</th>
                        <th className="dark-header center">Thickness</th>
                        <th className="dark-header center">Width</th>
                        <th className="dark-header center">Length</th>
                        <th className="dark-header center">Nos</th>
                        <th className="dark-header center">Kg</th>
                        <th className="dark-header center">Rate</th>
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
                        <td>{item.unitType === 'Nos' ? item.quantity : '-'}</td>
                        <td>{item.unitType === 'Kg' ? item.quantity : item.totalWeight || '-'}</td>
                        <td>{item.rate > 0 ? `₹${item.rate.toLocaleString('en-IN')}` : '-'}</td>
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
                    <tr className="total-row">
                        <td colSpan={6} style={{ textAlign: 'center', fontWeight: 'bold' }}>Total</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalNos > 0 ? totalNos : ''}</td>
                        <td style={{ fontWeight: 'bold', textAlign: 'center' }}>{totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <div className="dark-header" style={{ borderTop: '1px solid black', borderBottom: '1px solid black' }}>
                COMMERCIAL / QUALITY DETAILS
            </div>
            
            <div className="commercial-container">
                <div className="commercial-left">
                    <div className="commercial-cell border-bot" style={{ minHeight: '40px' }}>
                      Delivery Address : <span style={{ fontWeight: 'bold', marginLeft: '6px' }}>{order?.deliveryAddress || party?.deliveryAddress || ''}</span>
                    </div>
                    <div className="commercial-cell" style={{ minHeight: '40px', display: 'flex', alignItems: 'flex-end' }}>
                      TC : &nbsp;<strong style={{ borderBottom: '1px solid black', minWidth: '150px', display: 'inline-block', textAlign: 'center' }}>{order?.tc === 'Yes' ? 'YES' : 'NO'}</strong>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      UT : &nbsp;<strong style={{ borderBottom: '1px solid black', minWidth: '150px', display: 'inline-block', textAlign: 'center' }}>{order?.ut === 'Yes' ? 'YES' : 'NO'}</strong>
                    </div>
                </div>
                <div className="commercial-right">
                    <div className="commercial-cell border-bot">
                      Loading Charge: &nbsp;<strong style={{ borderBottom: '1px solid black', minWidth: '130px', display: 'inline-block', textAlign: 'center' }}>{order?.loadingUnloadingCharges && order.loadingUnloadingCharges > 0 ? `₹${order.loadingUnloadingCharges.toLocaleString('en-IN')}` : 'NO'}</strong>
                    </div>
                    <div className="commercial-cell border-bot">
                      Transport Charge: &nbsp;<strong style={{ borderBottom: '1px solid black', minWidth: '120px', display: 'inline-block', textAlign: 'center' }}>{order?.transportationCharges && order.transportationCharges > 0 ? `₹${order.transportationCharges.toLocaleString('en-IN')}` : 'NO'}</strong>
                    </div>
                    <div className="commercial-cell" style={{ flexGrow: 1 }}></div>
                </div>
            </div>

            <div className="dark-header" style={{ borderBottom: '1px solid black' }}>
                GENERAL TERMS AND CONDITIONS
            </div>
            <div className="terms-section">
                <div className="terms-row">
                    <span>1. Material should be supplied strictly as per challan details.</span>
                    <span>2. Final weight / quantity will be considered as mutually agreed.</span>
                </div>
                <div className="terms-row">
                    <span>3. Loading and transport charges as mentioned above.</span>
                    <span>4. Please verify material at the time of delivery.</span>
                </div>
            </div>

            <div className="signature-wrapper">
                <table className="signature-table-fixed">
                  <tbody>
                    <tr>
                        <td>
                            <div className="sig-content">
                                <span className="sig-title">Receiver's Signature</span>
                            </div>
                        </td>
                        <td>
                            <div className="sig-content">
                                <span className="sig-title">Dispatch</span>
                            </div>
                        </td>
                        <td>
                            <div className="sig-content">
                                <span className="sig-title">For</span>
                                <span className="sig-company">For Jagdamba Profile</span>
                            </div>
                        </td>
                    </tr>
                  </tbody>
                </table>
            </div>

        </div>
      </div>
    </div>
  );
};
