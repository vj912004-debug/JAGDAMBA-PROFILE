import React, { useState } from 'react';
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
  // Force table to always have 10 rows just like your static HTML
  const emptyRowsCount = Math.max(0, 10 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const totalNos = items.reduce((sum, item) => item.unitType === 'Nos' ? sum + item.quantity : sum, 0);
  const totalKg = items.reduce((sum, item) => item.unitType === 'Kg' ? sum + item.quantity : sum + (item.totalWeight || 0), 0);

  const tcVal = order?.tc === 'Yes' ? 'YES' : 'NO';
  const utVal = order?.ut === 'Yes' ? 'YES' : 'NO';
  const loadingVal = order?.loadingUnloadingCharges && order.loadingUnloadingCharges > 0 
    ? `₹${order.loadingUnloadingCharges.toLocaleString('en-IN')}` 
    : 'NO';
  const transportVal = order?.transportationCharges && order.transportationCharges > 0 
    ? `₹${order.transportationCharges.toLocaleString('en-IN')}` 
    : 'NO';

  // State for Original vs Duplicate
  const [printType, setPrintType] = useState<'ORIGINAL' | 'DUPLICATE'>('ORIGINAL');

  const handlePrint = (type: 'ORIGINAL' | 'DUPLICATE') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="flex flex-col items-center w-full pb-10 bg-gray-100 min-h-screen">

      {/* Action Buttons (Hidden when printing) */}
      <div className="no-print flex gap-4 my-6">
        <button
          onClick={() => handlePrint('ORIGINAL')}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow-md hover:bg-blue-700 font-bold transition-colors cursor-pointer"
        >
          Print Original Only
        </button>
        <button
          onClick={() => handlePrint('DUPLICATE')}
          className="bg-amber-500 text-white px-6 py-2 rounded shadow-md hover:bg-amber-600 font-bold transition-colors cursor-pointer"
        >
          Print Original & Duplicate
        </button>
      </div>

      {/* Your EXACT Design starts here */}
      <div id="challan-print-area" className="flex flex-col items-center">
        <style>{`
          /* Scoped Reset to protect your ERP styles */
          #challan-print-area {
            background-color: transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          #challan-print-area * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            color: #000;
          }

          /* Print Settings */
          @media print {
            .no-print { display: none !important; }
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }

          /* YOUR CSS EXACTLY AS PROVIDED */
          .challan-container {
            width: 210mm; /* A4 width approximate */
            background-color: white;
            border: 2px solid #000;
            padding: 4px;
            margin: 0 auto;
            page-break-inside: avoid;
          }

          .inner-border {
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
          }

          .header {
            display: flex;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #000;
          }

          .logo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-right: 20px;
            gap: 4px;
          }

          .logo-mark {
            font-size: 50px;
            color: #f26522 !important;
            font-weight: bold;
            line-height: 1.1;
            text-align: center;
            margin-bottom: 2px;
          }
          
          .logo-text-small {
            font-size: 9px;
            text-align: center;
            font-weight: bold;
            color: #333;
          }

          .header-text {
            flex-grow: 1;
          }

          .company-title {
            color: #f26522 !important;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
          }

          .company-details {
            font-size: 12px;
            line-height: 1.5;
          }

          .contact-row {
            display: flex;
            justify-content: space-between;
          }

          .document-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            padding: 8px;
            border-bottom: 1px solid #000;
            background-color: #f9f9f9 !important;
          }

          .section-header {
            background-color: #000 !important;
            color: #fff !important;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 10px;
            border-bottom: 1px solid #000;
          }

          .grid-2-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .grid-cell {
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
            padding: 8px 10px;
            font-size: 12px;
            min-height: 35px;
            display: flex;
            align-items: center;
          }

          .grid-cell.no-right-border {
            border-right: none;
          }

          .grid-cell label {
            font-weight: bold;
            margin-right: 10px;
          }

          .transport-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border-bottom: 1px solid #000;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
          }

          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 6px;
            text-align: center;
            font-size: 12px;
          }

          .items-table th {
            background-color: #000 !important;
            color: #fff !important;
            font-weight: bold;
            border-top: none;
          }

          .items-table tr.empty-row td {
            height: 25px;
          }
          
          .items-table th:first-child, .items-table td:first-child { border-left: none; }
          .items-table th:last-child, .items-table td:last-child { border-right: none; }

          .total-row td {
            font-weight: bold;
          }

          .commercial-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border-bottom: 1px solid #000;
          }

          .terms-content {
            padding: 10px 15px;
            font-size: 11px;
            border-bottom: 1px solid #000;
          }

          .terms-list {
            list-style-type: none;
            display: flex;
            flex-wrap: wrap;
            gap: 10px 20px;
          }

          .signatures-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1.5fr;
            min-height: 80px;
          }

          .signature-box {
            padding: 10px;
            font-size: 12px;
            font-weight: bold;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .signature-box:last-child {
            border-right: none;
            align-items: flex-end;
          }

          .sig-label-bottom {
            align-self: flex-end;
            width: 100%;
            text-align: right;
          }
          
          .underline-input {
            flex-grow: 1;
            border-bottom: 1px solid #000;
            height: 15px;
            margin-left: 5px;
            min-width: 50px;
            display: flex;
            align-items: center;
            padding-left: 5px;
            font-weight: bold;
          }

          .cut-line {
            width: 210mm;
            border-top: 1px dashed #999;
            margin: 15px 0;
            position: relative;
          }
          
          .cut-line::after {
            content: "✂";
            position: absolute;
            left: -20px;
            top: -12px;
            font-size: 16px;
            color: #999;
          }

          /* ORIGINAL COPY STYLES */
          .challan-container-orig, .challan-container-orig * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; color: #000; }
          .challan-container-orig { width: 210mm; background-color: #fff; border: 2px solid #000; padding: 15px; margin: 0 auto; position: relative; page-break-inside: avoid; }
          .inner-border-orig { border: 1px solid #000; padding: 5px; }
          .header-orig { display: flex; align-items: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 5px; }
          .logo-container-orig { display: flex; flex-direction: column; align-items: center; margin-right: 20px; margin-left: 10px; width: 70px; }
          .company-logo-orig { width: 60px; height: auto; object-fit: contain; }
          .logo-text-orig { font-size: 8px; font-weight: bold; font-style: italic; text-align: center; margin-top: 3px; }
          .company-info-container-orig { flex-grow: 1; }
          .company-name-orig { font-size: 32px; font-weight: 900; text-align: center; letter-spacing: 2px; margin-bottom: 10px; }
          .company-details-orig { display: flex; flex-direction: column; font-size: 11px; }
          .contact-row-orig { display: flex; justify-content: space-between; }
          .title-orig { text-align: center; font-size: 16px; font-weight: bold; margin: 10px 0; }
          .challan-container-orig table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .challan-container-orig th, .challan-container-orig td { border: 1px solid #000; padding: 6px; text-align: left; }
          .section-header-orig { background-color: #222 !important; color: #fff !important; font-weight: bold; font-size: 12px; text-align: left; }
          .section-header-center-orig { background-color: #222 !important; color: #fff !important; font-weight: bold; font-size: 12px; text-align: center; }
          .flex-row-orig { display: flex; width: 100%; border: 1px solid #000; margin-bottom: 10px; }
          .flex-col-orig { flex: 1; }
          .flex-col-orig:first-child { border-right: 1px solid #000; }
          .flex-col-orig .section-header-orig { padding: 6px; border-bottom: 1px solid #000; }
          .input-row-orig { display: flex; border-bottom: 1px solid #000; min-height: 28px; }
          .input-row-orig:last-child { border-bottom: none; }
          .input-label-orig { padding: 6px; font-weight: bold; width: 130px; flex-shrink: 0; }
          .input-value-orig { padding: 6px; flex-grow: 1; display: flex; align-items: center; }
          .item-table-orig th { background-color: #222 !important; color: #fff !important; text-align: center; font-weight: bold; }
          .item-table-orig td { height: 24px; text-align: center; }
          .total-row-orig td { font-weight: bold; }
          .terms-box-orig { border: 1px solid #000; margin-bottom: 10px; }
          .terms-content-orig { padding: 6px; font-size: 11px; line-height: 1.6; }
          .signature-row-orig { display: flex; border: 1px solid #000; height: 80px; }
          .sig-box-orig { flex: 1; padding: 6px; font-weight: bold; display: flex; flex-direction: column; justify-content: space-between; }
          .sig-box-orig:not(:last-child) { border-right: 1px solid #000; }
          .sig-box-orig.right-align-orig { align-items: flex-end; }
          .copy-stamp-orig { position: absolute; top: 18px; right: 18px; font-size: 13px; font-weight: bold; color: #1a4d8c; border: 2px solid #1a4d8c; padding: 2px 10px; border-radius: 3px; letter-spacing: 1px; background: #fff; z-index: 10; }
        `}</style>

        <ChallanOriginalCopy />
        
        {printType === 'DUPLICATE' && (
          <>
            <div className="cut-line"></div>
            <ChallanDuplicateCopy />
          </>
        )}

      </div>
    </div>
  );

  function ChallanOriginalCopy() {
    return (
      <div className="challan-container-orig">
        <div className="copy-stamp-orig">ORIGINAL COPY</div>
        <div className="inner-border-orig">
            
            <div className="header-orig">
                <div className="logo-container-orig">
                    <img src="/logo.png" alt="Jagdamba Profile Logo" className="company-logo-orig" />
                    <div className="logo-text-orig">Jagdamba Profile</div>
                </div>
                <div className="company-info-container-orig">
                    <div className="company-name-orig">Jagdamba Profile</div>
                    <div className="company-details-orig">
                        <div>504/1A, GIDC Makarpura, Vadodara -390010.</div>
                        <div>GST No: 24AJGPP9863R1Z5</div>
                        <div className="contact-row-orig">
                            <div>Mo: 8799617251, 8799617252, 8799617254, 9824025001</div>
                            <div>Email: jagdambaprofile@gmail.com</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="title-orig">DELIVERY CHALLAN</div>

            <div className="flex-row-orig">
                <div className="flex-col-orig">
                    <div className="section-header-orig">PARTY DETAILS</div>
                    <div className="input-row-orig" style={{ height: '40px' }}>
                        <div className="input-label-orig">Party Name:</div>
                        <div className="input-value-orig">{challan.partyName}</div>
                    </div>
                    <div className="input-row-orig" style={{ height: '50px' }}>
                        <div className="input-label-orig">Address:</div>
                        <div className="input-value-orig">{party?.deliveryAddress || order?.deliveryAddress || ''}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">GST Number:</div>
                        <div className="input-value-orig">{party?.gstNumber || order?.gstType || ''}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">Mobile Number:</div>
                        <div className="input-value-orig">{party?.mobileNumber || order?.mobileNumber || ''}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">Email ID :</div>
                        <div className="input-value-orig">{party?.email || ''}</div>
                    </div>
                </div>
                <div className="flex-col-orig">
                    <div className="section-header-orig">CHALLAN / ORDER DETAILS</div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">Challan No:</div>
                        <div className="input-value-orig" style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{challan.challanNo}</div>
                    </div>
                    <div className="input-row-orig" style={{ height: '40px' }}>
                        <div className="input-label-orig">Challan Date:</div>
                        <div className="input-value-orig">{challan.challanDate}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">PO No:</div>
                        <div className="input-value-orig">{order?.orderNo || ''}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">PO Date:</div>
                        <div className="input-value-orig">{order?.orderDate || ''}</div>
                    </div>
                    <div className="input-row-orig">
                        <div className="input-label-orig">Order Page Number:</div>
                        <div className="input-value-orig">1 of 1</div>
                    </div>
                </div>
            </div>

            <table>
                <tbody>
                  <tr>
                      <td colSpan={3} className="section-header-center-orig">VEHICLE TRANSPORT DETAILS</td>
                  </tr>
                  <tr>
                      <td style={{ width: '33.33%' }}><b>Vehicle Number:</b> {vehicleNo}</td>
                      <td style={{ width: '33.33%' }}><b>Driver Mobile No:</b> {driverMobile}</td>
                      <td style={{ width: '33.33%' }}><b>Payment Terms :</b> {order?.paymentTerms || ''}</td>
                  </tr>
                </tbody>
            </table>

            <table className="item-table-orig">
                <thead>
                  <tr>
                      <th style={{ width: '5%' }}>Sr No</th>
                      <th style={{ width: '25%' }}>Item</th>
                      <th style={{ width: '10%' }}>Grade</th>
                      <th style={{ width: '10%' }}>Thickness</th>
                      <th style={{ width: '10%' }}>Width</th>
                      <th style={{ width: '10%' }}>Length</th>
                      <th style={{ width: '10%' }}>Nos</th>
                      <th style={{ width: '10%' }}>Kg</th>
                      <th style={{ width: '10%' }}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
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
                      <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
                  <tr className="total-row-orig">
                      <td colSpan={6} style={{ textAlign: 'center' }}>Total</td>
                      <td style={{ textAlign: 'center' }}>{totalNos > 0 ? totalNos : ''}</td>
                      <td style={{ textAlign: 'center' }}>{totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                      <td></td>
                  </tr>
                </tbody>
            </table>

            <div style={{ border: '1px solid #000', marginBottom: '10px' }}>
                <div className="section-header-orig" style={{ padding: '6px' }}>COMMERCIAL / QUALITY DETAILS</div>
                <div style={{ display: 'flex' }}>
                    <div style={{ flex: 6, borderRight: '1px solid #000' }}>
                        <div style={{ padding: '6px', height: '50px', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center' }}>
                          <b>Delivery Address :</b> <span style={{ marginLeft: '8px' }}>{order?.deliveryAddress || party?.deliveryAddress || ''}</span>
                        </div>
                        <div style={{ padding: '6px', display: 'flex', alignItems: 'center' }}>
                          <b>TC :</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 15px', textAlign: 'center' }}>{order?.tc === 'Yes' ? 'YES' : ''}</div> 
                          <b>UT :</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 15px', textAlign: 'center' }}>{order?.ut === 'Yes' ? 'YES' : ''}</div>
                        </div>
                    </div>
                    <div style={{ flex: 4 }}>
                        <div style={{ padding: '6px', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center' }}>
                          <b>Loading Charge:</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '10px', textAlign: 'center' }}>{loadingVal === 'NO' ? '' : loadingVal}</div>
                        </div>
                        <div style={{ padding: '6px', display: 'flex', alignItems: 'center' }}>
                          <b>Transport Charge:</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '10px', textAlign: 'center' }}>{transportVal === 'NO' ? '' : transportVal}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="terms-box-orig">
                <div className="section-header-orig" style={{ padding: '6px' }}>GENERAL TERMS AND CONDITIONS</div>
                <div className="terms-content-orig">
                    1. Material should be supplied strictly as per challan details. &nbsp;&nbsp;&nbsp; 2. Final weight / quantity will be considered as mutually agreed.<br/>
                    3. Loading and transport charges as mentioned above. &nbsp;&nbsp;&nbsp; 4. Please verify material at the time of delivery.
                </div>
            </div>

            <div className="signature-row-orig">
                <div className="sig-box-orig">
                    <div>Receiver's Signature</div>
                </div>
                <div className="sig-box-orig">
                    <div>Dispatch</div>
                </div>
                <div className="sig-box-orig right-align-orig">
                    <div style={{ alignSelf: 'flex-start' }}>For</div>
                    <div style={{ fontSize: '14px' }}>For Jagdamba Profile</div>
                </div>
            </div>

        </div>
      </div>
    );
  }

  function ChallanDuplicateCopy() {
    return (
      <div className="challan-container">
        <div className="inner-border">

          <div className="header">
            <div className="logo-container">
              <img src="/logo.png" alt="Shree Jagdamba Steel Profiles" style={{ width: '140px', height: 'auto' }} />
            </div>
            <div className="header-text">
              <div className="company-title">SHREE JAGDAMBA STEEL PROFILES</div>
              <div className="company-details">
                <div>503/1A, GIDC Makarpura, Vadodara - 390010.</div>
                <div>GST No: 24AJGPP9863R1Z5</div>
                <div className="contact-row">
                  <span>Mo: 8799617251, 8799617252, 8799617254, 9824025001</span>
                  <span>Email: jagdambaprofile@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          <div className="document-title">
            DELIVERY CHALLAN | DUPLICATE COPY
          </div>

          <div className="grid-2-col">
            <div className="section-header" style={{ borderRight: '1px solid #fff' }}>PARTY DETAILS</div>
            <div className="section-header">CHALLAN / ORDER DETAILS</div>

            <div className="grid-cell"><label>Party Name:</label> {challan.partyName}</div>
            <div className="grid-cell no-right-border"><label>Challan No:</label> <span style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{challan.challanNo}</span></div>

            <div className="grid-cell"><label>Address:</label> {party?.deliveryAddress || order?.deliveryAddress || ''}</div>
            <div className="grid-cell no-right-border"><label>Challan Date:</label> {challan.challanDate}</div>

            <div className="grid-cell"><label>GST Number:</label> {party?.gstNumber || order?.gstType || ''}</div>
            <div className="grid-cell no-right-border"><label>PO No:</label> {order?.orderNo || ''}</div>

            <div className="grid-cell"><label>Mobile Number:</label> {party?.mobileNumber || order?.mobileNumber || ''}</div>
            <div className="grid-cell no-right-border"><label>PO Date:</label> {order?.orderDate || ''}</div>

            <div className="grid-cell"><label>Email ID :</label> {party?.email || ''}</div>
            <div className="grid-cell no-right-border"><label>Order Page Number:</label> 1 of 1</div>
          </div>

          <div className="section-header" style={{ textAlign: 'center' }}>VEHICLE TRANSPORT DETAILS</div>
          <div className="transport-grid">
            <div className="grid-cell" style={{ borderBottom: 'none' }}><label>Vehicle Number:</label> {vehicleNo}</div>
            <div className="grid-cell" style={{ borderBottom: 'none' }}><label>Driver Mobile No:</label> {driverMobile}</div>
            <div className="grid-cell no-right-border" style={{ borderBottom: 'none' }}><label>Payment Terms :</label> {order?.paymentTerms || ''}</div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Sr No</th>
                <th style={{ width: '25%' }}>Item</th>
                <th style={{ width: '10%' }}>Grade</th>
                <th style={{ width: '10%' }}>Thickness</th>
                <th style={{ width: '10%' }}>Width</th>
                <th style={{ width: '10%' }}>Length</th>
                <th style={{ width: '10%' }}>Nos</th>
                <th style={{ width: '10%' }}>Kg</th>
                <th style={{ width: '10%' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="empty-row">
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
                <tr key={`empty-${index}`} className="empty-row">
                  <td>{items.length > 0 ? items.length + index + 1 : ''}</td>
                  <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={6} style={{ textAlign: 'center', borderBottom: 'none' }}>Total</td>
                <td style={{ borderBottom: 'none' }}>{totalNos > 0 ? totalNos : ''}</td>
                <td style={{ borderBottom: 'none' }}>{totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                <td style={{ borderBottom: 'none' }}></td>
              </tr>
            </tbody>
          </table>

          <div className="section-header" style={{ borderTop: '1px solid #000' }}>COMMERCIAL / QUALITY DETAILS</div>
          <div className="commercial-grid" style={{ display: 'flex' }}>
            <div className="grid-cell" style={{ width: '50%', alignItems: 'flex-start', paddingTop: '10px' }}>
              <label>Delivery Address :</label>
              <span className="val">{order?.deliveryAddress || party?.deliveryAddress || ''}</span>
            </div>
            <div style={{ width: '50%', display: 'flex', flexWrap: 'wrap' }}>
                <div className="grid-cell no-right" style={{ width: '50%', display: 'flex', alignItems: 'center', borderBottom: '1px solid #000' }}>
                  <label>Loading Charge:</label>
                  <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '5px', paddingBottom: '2px' }}>{loadingVal === 'NO' ? '' : loadingVal}</div>
                </div>
                <div className="grid-cell no-right" style={{ width: '50%', display: 'flex', alignItems: 'center', borderBottom: '1px solid #000' }}>
                  <label>Transport Charge:</label>
                  <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '5px', paddingBottom: '2px' }}>{transportVal === 'NO' ? '' : transportVal}</div>
                </div>
                <div className="grid-cell" style={{ width: '50%', borderBottom: 'none', display: 'flex', alignItems: 'center' }}>
                  <label>TC :</label>
                  <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '5px', paddingBottom: '2px' }}>{tcVal === 'NO' ? '' : tcVal}</div>
                </div>
                <div className="grid-cell no-right" style={{ width: '50%', borderBottom: 'none', display: 'flex', alignItems: 'center' }}>
                  <label>UT :</label>
                  <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '5px', paddingBottom: '2px' }}>{utVal === 'NO' ? '' : utVal}</div>
                </div>
            </div>
          </div>

          <div className="section-header">GENERAL TERMS AND CONDITIONS</div>
          <div className="terms-content">
            <ul className="terms-list">
              <li>1. Material should be supplied strictly as per challan details.</li>
              <li>2. Final weight / quantity will be considered as mutually agreed.</li>
              <li>3. Loading and transport charges as mentioned above.</li>
              <li>4. Please verify material at the time of delivery.</li>
            </ul>
          </div>

          <div className="signatures-section">
            <div className="signature-box">
              <span>Receiver's Signature</span>
            </div>
            <div className="signature-box">
              <span>Dispatch</span>
            </div>
            <div className="signature-box">
              <span style={{ alignSelf: 'flex-start' }}>For</span>
              <span className="sig-label-bottom">For Shree Jagdamba Steel Profiles</span>
            </div>
          </div>

        </div>
      </div>
    );
  }
};

