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
  const [printType, setPrintType] = useState<'ORIGINAL' | 'DUPLICATE'>('DUPLICATE');

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
                    <img src="data:image/png;base64,﻿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 " alt="Jagdamba Profile Logo" className="company-logo-orig" />
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
                          <b>TC :</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 15px', textAlign: 'center' }}>{tcVal}</div> 
                          <b>UT :</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', margin: '0 15px', textAlign: 'center' }}>{utVal}</div>
                        </div>
                    </div>
                    <div style={{ flex: 4 }}>
                        <div style={{ padding: '6px', borderBottom: '1px solid #000', display: 'flex', alignItems: 'center' }}>
                          <b>Loading Charge:</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '10px', textAlign: 'center' }}>{loadingVal}</div>
                        </div>
                        <div style={{ padding: '6px', display: 'flex', alignItems: 'center' }}>
                          <b>Transport Charge:</b> <div style={{ flexGrow: 1, borderBottom: '1px solid #000', marginLeft: '10px', textAlign: 'center' }}>{transportVal}</div>
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
              <img src="data:image/png;base64,﻿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 " alt="Shree Jagdamba Steel Profiles" style={{ width: '140px', height: 'auto' }} />
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
          <div className="commercial-grid">
            <div className="grid-cell" style={{ gridRow: 'span 2', alignItems: 'flex-start', paddingTop: '10px' }}>
              <label>Delivery Address :</label> {order?.deliveryAddress || party?.deliveryAddress || ''}
            </div>
            <div className="grid-cell no-right-border" style={{ display: 'flex' }}>
              <label>Loading Charge:</label>
              <div className="underline-input">
                {order?.loadingUnloadingCharges && order.loadingUnloadingCharges > 0 ? `₹${order.loadingUnloadingCharges.toLocaleString('en-IN')}` : ''}
              </div>
            </div>
            <div className="grid-cell no-right-border" style={{ display: 'flex' }}>
              <label>Transport Charge:</label>
              <div className="underline-input">
                {order?.transportationCharges && order.transportationCharges > 0 ? `₹${order.transportationCharges.toLocaleString('en-IN')}` : ''}
              </div>
            </div>
            <div className="grid-cell" style={{ borderBottom: 'none', display: 'flex' }}>
              <label>TC :</label>
              <div className="underline-input">
                {order?.tc === 'Yes' ? 'YES' : ''}
              </div>
            </div>
            <div className="grid-cell no-right-border" style={{ borderBottom: 'none', display: 'flex' }}>
              <label>UT :</label>
              <div className="underline-input">
                {order?.ut === 'Yes' ? 'YES' : ''}
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