import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ChallanRecord, Order, PurchaseOrder } from '../store/AppContext';

/**
 * Sanitize filename to prevent issues with special characters
 */
const sanitizeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
};

/**
 * Capture a DOM element and download as PDF
 */
export const downloadPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${sanitizeFilename(filename)}.pdf`);
};

/**
 * Delivery Challan PDF Generator (High-Fidelity DOM-to-Canvas clone)
 */
export const generateChallanPDF = async (
  challan: ChallanRecord,
  order: Order | undefined,
  parties: any[] = [],
  dispatches: any[] = []
) => {
  const dispatch = dispatches.find(d => d.orderNo === challan.orderNo);
  const party = parties.find(p => p.partyName === challan.partyName);
  
  const vehicleNo = dispatch?.vehicleNo || '';
  const driverMobile = ''; 

  const items = order?.items || [];
  const emptyRowsCount = Math.max(0, 10 - items.length);
  
  const rowsHtml = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="text-align: left; padding-left: 8px;">${item.partName || item.drawingNumber || '-'}</td>
      <td>${item.materialGrade || '-'}</td>
      <td>${item.thickness ? `${item.thickness.replace(/mm/gi, '')}mm` : '-'}</td>
      <td>${item.width || item.innerDiameter || '-'}</td>
      <td>${item.length || item.outerDiameter || '-'}</td>
      <td>${item.unitType === 'Nos' ? item.quantity : '-'}</td>
      <td>${item.unitType === 'Kg' ? item.quantity : item.totalWeight || '-'}</td>
      <td>${item.rate > 0 ? '₹' + item.rate.toLocaleString('en-IN') : '-'}</td>
    </tr>
  `).join('');

  const emptyRowsHtml = Array.from({ length: emptyRowsCount }).map((_, index) => `
    <tr>
      <td>${items.length + index + 1}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `).join('');

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

  const hiddenWrapper = document.createElement('div');
  hiddenWrapper.style.position = 'absolute';
  hiddenWrapper.style.left = '-9999px';
  hiddenWrapper.style.top = '0px';
  hiddenWrapper.style.width = '0px';
  hiddenWrapper.style.height = '0px';
  hiddenWrapper.style.overflow = 'hidden';
  hiddenWrapper.style.zIndex = '-9999';

  const tempDiv = document.createElement('div');
  tempDiv.style.width = '1000px';
  tempDiv.style.background = '#ffffff';
  hiddenWrapper.appendChild(tempDiv);

  const styleStr = `
    .challan-container-dl {
        width: 1000px;
        margin: auto;
        background: #fff;
        padding: 15px;
        color: #000;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }

    /* Double Border Effect */
    .border-outer-dl {
        border: 2px solid black;
        padding: 3px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }
    .border-inner-dl {
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        flex-grow: 1;
    }

    /* Header Section */
    .header-container-dl {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 10px 15px 5px 15px;
        box-sizing: border-box;
    }
    
    .logo-area-dl {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 80px;
    }
    
    .company-logo-dl {
        width: 100%;
        height: auto;
        object-fit: contain;
        display: block;
    }

    .company-title-dl {
        font-family: 'Georgia', serif;
        font-size: 36px;
        font-weight: 900;
        letter-spacing: 1px;
        color: #222;
        flex-grow: 1;
        text-align: center;
        margin-bottom: 5px;
    }

    .contact-info-bar-dl {
        padding: 0 10px 8px 10px;
        font-size: 12px;
        border-bottom: 1px solid black;
        box-sizing: border-box;
    }
    .contact-row-flex-dl {
        display: flex;
        justify-content: space-between;
        margin-top: 3px;
    }

    /* Title Bar */
    .document-title-dl {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        padding: 6px;
        border-bottom: 1px solid black;
        box-sizing: border-box;
    }

    /* Global Table Styles */
    .flush-table-dl {
        width: 100%;
        border-collapse: collapse;
    }
    .flush-table-dl th, .flush-table-dl td {
        border: 1px solid black;
        font-size: 12px;
        color: #000;
    }
    
    /* Flush Tables (for items touching the main borders) */
    .flush-table-dl { border-left: none; border-right: none; }
    .flush-table-dl th:first-child, .flush-table-dl td:first-child { border-left: none; }
    .flush-table-dl th:last-child, .flush-table-dl td:last-child { border-right: none; }

    /* Dark Headers */
    .dark-header-dl {
        background-color: #2b2b2b;
        color: white;
        font-weight: bold;
        text-align: left;
        padding: 6px 8px;
        font-size: 11px;
        text-transform: uppercase;
    }
    .dark-header-dl.center {
        text-align: center;
    }

    /* Detail Tables (Party / Order) */
    .details-table-dl td {
        width: 50%;
        padding: 6px 8px;
        vertical-align: top;
        height: 28px;
        box-sizing: border-box;
    }
    
    /* Vehicle Transport Section */
    .vehicle-table-dl td {
        width: 33.33%;
        padding: 6px 8px;
        height: 28px;
        box-sizing: border-box;
    }

    /* Items Grid */
    .items-table-dl {
        border-top: 1px solid black;
    }
    .items-table-dl th {
        padding: 8px 4px;
    }
    .items-table-dl td {
        height: 24px;
        text-align: center;
        box-sizing: border-box;
    }
    /* Specific widths */
    .items-table-dl th:nth-child(1) { width: 5%; }
    .items-table-dl th:nth-child(2) { width: 22%; }
    .items-table-dl th:nth-child(3) { width: 9%; }
    .items-table-dl th:nth-child(4) { width: 9%; }
    .items-table-dl th:nth-child(5) { width: 9%; }
    .items-table-dl th:nth-child(6) { width: 9%; }
    .items-table-dl th:nth-child(7) { width: 8%; }
    .items-table-dl th:nth-child(8) { width: 10%; }
    .items-table-dl th:nth-child(9) { width: 19%; }

    .items-table-dl .total-row-dl td {
        height: 28px;
    }

    /* Commercial / Quality Section */
    .commercial-container-dl {
        display: flex;
        width: 100%;
        border-bottom: 1px solid black;
        box-sizing: border-box;
    }
    .commercial-left-dl {
        width: 60%;
        border-right: 1px solid black;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    .commercial-right-dl {
        width: 40%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    .commercial-cell-dl {
        padding: 8px 10px;
        font-size: 12px;
        box-sizing: border-box;
    }
    .border-bot-dl { border-bottom: 1px solid black; }

    /* Terms & Conditions */
    .terms-section-dl {
        padding: 8px 10px;
        font-size: 11.5px;
        line-height: 1.6;
        border-bottom: 1px solid black;
        box-sizing: border-box;
    }
    .terms-row-dl {
        display: flex;
        justify-content: space-between;
    }

    /* Fixed Signatures Section */
    .signature-wrapper-dl {
        padding: 10px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        box-sizing: border-box;
        margin-top: 15px;
    }
    .signature-table-fixed-dl {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid black;
    }
    .signature-table-fixed-dl td {
        border: 1px solid black;
        width: 33.333%;
        padding: 0;
        vertical-align: top;
        box-sizing: border-box;
    }
    .sig-content-dl {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 110px;
        padding: 8px 10px;
        box-sizing: border-box;
    }
    .sig-title-dl {
        font-weight: bold;
        font-size: 12px;
    }
    .sig-company-dl {
        font-weight: bold;
        font-size: 15px;
        align-self: flex-end;
    }
  `;

  tempDiv.innerHTML = `
    <style>${styleStr}</style>
    <div class="challan-container-dl">
      <div class="border-outer-dl">
        <div class="border-inner-dl">

            <div class="header-container-dl">
                <div class="logo-area-dl">
                    <img src="/logo.jpg" alt="Jagdamba Profile Logo" class="company-logo-dl" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='block';" />
                    <svg width="55" height="55" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="display: none; margin: 0 auto;">
                      <defs>
                        <radialGradient id="redSpherePDF" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stop-color="#ff8888" />
                          <stop offset="40%" stop-color="#ff0000" />
                          <stop offset="100%" stop-color="#aa0000" />
                        </radialGradient>
                        <radialGradient id="blueGlowPDF" cx="35%" cy="35%" r="65%">
                          <stop offset="0%" stop-color="#3b82f6" />
                          <stop offset="100%" stop-color="#1d4ed8" />
                        </radialGradient>
                      </defs>
                      <path d="M30 40 C30 20, 80 15, 80 50 C80 85, 45 95, 30 75 L30 105" fill="none" stroke="url(#blueGlowPDF)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
                      <circle cx="30" cy="30" r="16" fill="url(#redSpherePDF)" />
                    </svg>
                </div>
                <div class="company-title-dl">Jagdamba Profile</div>
                <div style="width: 80px;"></div>
            </div>

            <div class="contact-info-bar-dl">
                <div>504/1A, GIDC Makarpura, Vadodara -390010.</div>
                <div>GST No: 24AJGPP9863R1Z5</div>
                <div class="contact-row-flex-dl">
                    <div>Mo: 8799617251, 8799617252, 8799617254, 9824025001</div>
                    <div>Email: jagdambaprofile@gmail.com</div>
                </div>
            </div>

            <div class="document-title-dl">DELIVERY CHALLAN</div>

            <table class="flush-table-dl details-table-dl">
              <tbody>
                <tr>
                    <th class="dark-header-dl" style="border-right: 1px solid white;">PARTY DETAILS</th>
                    <th class="dark-header-dl">CHALLAN / ORDER DETAILS</th>
                </tr>
                <tr>
                    <td>Party Name: <strong style="margin-left: 4px;">${challan.partyName}</strong></td>
                    <td>Challan No: <strong style="margin-left: 4px; color: #1e3a8a;">${challan.challanNo}</strong></td>
                </tr>
                <tr>
                    <td rowspan="2">Address: <span style="margin-left: 4px;">${party?.deliveryAddress || order?.deliveryAddress || ''}</span></td>
                    <td>Challan Date: <span style="margin-left: 4px;">${challan.challanDate}</span></td>
                </tr>
                <tr>
                    <td>PO No: <span style="margin-left: 4px;">${order?.orderNo || ''}</span></td>
                </tr>
                <tr>
                    <td>GST Number: <span style="margin-left: 4px;">${party?.gstNumber || order?.gstType || ''}</span></td>
                    <td>PO Date: <span style="margin-left: 4px;">${order?.orderDate || ''}</span></td>
                </tr>
                <tr>
                    <td>Mobile Number: <span style="margin-left: 4px;">${party?.mobileNumber || order?.mobileNumber || ''}</span></td>
                    <td rowspan="2">Order Page Number: <span style="margin-left: 4px;">1 of 1</span></td>
                </tr>
                <tr>
                    <td>Email ID : <span style="margin-left: 4px;">${party?.email || ''}</span></td>
                </tr>
              </tbody>
            </table>

            <table class="flush-table-dl vehicle-table-dl" style="border-top: 1px solid black;">
              <tbody>
                <tr>
                    <th colspan="3" class="dark-header-dl center">VEHICLE TRANSPORT DETAILS</th>
                </tr>
                <tr>
                    <td>Vehicle Number: <strong style="margin-left: 4px;">${vehicleNo}</strong></td>
                    <td>Driver Mobile No: <span style="margin-left: 4px;">${driverMobile}</span></td>
                    <td>Payment Terms : <span style="margin-left: 4px;">${order?.paymentTerms || ''}</span></td>
                </tr>
              </tbody>
            </table>

            <table class="flush-table-dl items-table-dl">
                <thead>
                    <tr>
                        <th class="dark-header-dl center">Sr No</th>
                        <th class="dark-header-dl center">Item</th>
                        <th class="dark-header-dl center">Grade</th>
                        <th class="dark-header-dl center">Thickness</th>
                        <th class="dark-header-dl center">Width</th>
                        <th class="dark-header-dl center">Length</th>
                        <th class="dark-header-dl center">Nos</th>
                        <th class="dark-header-dl center">Kg</th>
                        <th class="dark-header-dl center">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    ${emptyRowsHtml}
                    <tr class="total-row-dl">
                        <td colspan="6" style="text-align: center; font-weight: bold;">Total</td>
                        <td style="font-weight: bold; text-align: center;">${totalNos > 0 ? totalNos : ''}</td>
                        <td style="font-weight: bold; text-align: center;">${totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                        <td></td>
                    </tr>
                </tbody>
            </table>

            <div class="dark-header-dl" style="border-top: 1px solid black; border-bottom: 1px solid black;">
                COMMERCIAL / QUALITY DETAILS
            </div>
            
            <div class="commercial-container-dl">
                <div class="commercial-left-dl">
                    <div class="commercial-cell-dl border-bot-dl" style="min-height: 40px;">
                      Delivery Address : <span style="font-weight: bold; margin-left: 6px;">${order?.deliveryAddress || party?.deliveryAddress || ''}</span>
                    </div>
                    <div class="commercial-cell-dl" style="min-height: 40px; display: flex; align-items: flex-end;">
                      TC : &nbsp;<strong style="border-bottom: 1px solid black; min-width: 150px; display: inline-block; text-align: center;">${tcVal}</strong>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      UT : &nbsp;<strong style="border-bottom: 1px solid black; min-width: 150px; display: inline-block; text-align: center;">${utVal}</strong>
                    </div>
                </div>
                <div class="commercial-right-dl">
                    <div class="commercial-cell-dl border-bot-dl">
                      Loading Charge: &nbsp;<strong style="border-bottom: 1px solid black; min-width: 130px; display: inline-block; text-align: center;">${loadingVal}</strong>
                    </div>
                    <div class="commercial-cell-dl border-bot-dl">
                      Transport Charge: &nbsp;<strong style="border-bottom: 1px solid black; min-width: 120px; display: inline-block; text-align: center;">${transportVal}</strong>
                    </div>
                    <div class="commercial-cell-dl" style="flex-grow: 1;"></div>
                </div>
            </div>

            <div class="dark-header-dl" style="border-bottom: 1px solid black;">
                GENERAL TERMS AND CONDITIONS
            </div>
            <div class="terms-section-dl">
                <div class="terms-row-dl">
                    <span>1. Material should be supplied strictly as per challan details.</span>
                    <span>2. Final weight / quantity will be considered as mutually agreed.</span>
                </div>
                <div class="terms-row-dl">
                    <span>3. Loading and transport charges as mentioned above.</span>
                    <span>4. Please verify material at the time of delivery.</span>
                </div>
            </div>

            <div class="signature-wrapper-dl">
                <table class="signature-table-fixed-dl">
                  <tbody>
                    <tr>
                        <td>
                            <div class="sig-content-dl">
                                <span class="sig-title-dl">Receiver's Signature</span>
                            </div>
                        </td>
                        <td>
                            <div class="sig-content-dl">
                                <span class="sig-title-dl">Dispatch</span>
                            </div>
                        </td>
                        <td>
                            <div class="sig-content-dl">
                                <span class="sig-title-dl">For</span>
                                <span class="sig-company-dl">For Jagdamba Profile</span>
                            </div>
                        </td>
                    </tr>
                  </tbody>
                </table>
            </div>

        </div>
      </div>
    </div>
  `;

  // Helper to build the challan HTML with a given copy label (e.g., "Original" or "Duplicate")
  const buildChallanHtml = (copyLabel: string) => {
    const origStyleStr = `
      .challan-container-orig, .challan-container-orig * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; color: #000; }
      .challan-container-orig {
          width: 1000px;
          background-color: #fff;
          border: 2px solid #000;
          padding: 15px;
          margin: auto;
      }
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
      .section-header-orig { background-color: #222; color: #fff; font-weight: bold; font-size: 12px; text-align: left; }
      .section-header-center-orig { background-color: #222; color: #fff; font-weight: bold; font-size: 12px; text-align: center; }
      .flex-row-orig { display: flex; width: 100%; border: 1px solid #000; margin-bottom: 10px; }
      .flex-col-orig { flex: 1; }
      .flex-col-orig:first-child { border-right: 1px solid #000; }
      .flex-col-orig .section-header-orig { padding: 6px; border-bottom: 1px solid #000; }
      .input-row-orig { display: flex; border-bottom: 1px solid #000; min-height: 28px; }
      .input-row-orig:last-child { border-bottom: none; }
      .input-label-orig { padding: 6px; font-weight: bold; width: 130px; flex-shrink: 0; }
      .input-value-orig { padding: 6px; flex-grow: 1; display: flex; align-items: center; }
      .item-table-orig th { background-color: #222; color: #fff; text-align: center; font-weight: bold; }
      .item-table-orig td { height: 24px; text-align: center; }
      .total-row-orig td { font-weight: bold; }
      .terms-box-orig { border: 1px solid #000; margin-bottom: 10px; }
      .terms-content-orig { padding: 6px; font-size: 11px; line-height: 1.6; }
      .signature-row-orig { display: flex; border: 1px solid #000; height: 80px; }
      .sig-box-orig { flex: 1; padding: 6px; font-weight: bold; display: flex; flex-direction: column; justify-content: space-between; }
      .sig-box-orig:not(:last-child) { border-right: 1px solid #000; }
      .sig-box-orig.right-align-orig { align-items: flex-end; }
      .copy-stamp-orig { position: absolute; top: 18px; right: 18px; font-size: 13px; font-weight: bold; color: #1a4d8c; border: 2px solid #1a4d8c; padding: 2px 10px; border-radius: 3px; letter-spacing: 1px; background: #fff; z-index: 10; }
    `;

    const rowsHtmlOrig = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align: left; padding-left: 8px;">${item.partName || item.drawingNumber || '-'}</td>
        <td>${item.materialGrade || '-'}</td>
        <td>${item.thickness ? `${item.thickness.replace(/mm/gi, '')}mm` : '-'}</td>
        <td>${item.width || item.innerDiameter || '-'}</td>
        <td>${item.length || item.outerDiameter || '-'}</td>
        <td>${item.unitType === 'Nos' ? item.quantity : '-'}</td>
        <td>${item.unitType === 'Kg' ? item.quantity : item.totalWeight || '-'}</td>
        <td>${item.rate > 0 ? '₹' + item.rate.toLocaleString('en-IN') : '-'}</td>
      </tr>
    `).join('');

    const emptyRowsCountOrig = Math.max(0, 10 - items.length);
    const emptyRowsHtmlOrig = Array.from({ length: emptyRowsCountOrig }).map(() => `
      <tr>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    `).join('');

    return `
      <style>${origStyleStr}</style>
      <div class="challan-container-orig" style="position: relative;">
        <div class="copy-stamp-orig">${copyLabel} COPY</div>
        <div class="inner-border-orig">
            
            <div class="header-orig">
                <div class="logo-container-orig">
                    <img src="/logo.png" alt="Jagdamba Profile Logo" class="company-logo-orig" onerror="this.style.display='none';">
                    <div class="logo-text-orig">Jagdamba Profile</div>
                </div>
                <div class="company-info-container-orig">
                    <div class="company-name-orig">Jagdamba Profile</div>
                    <div class="company-details-orig">
                        <div>504/1A, GIDC Makarpura, Vadodara -390010.</div>
                        <div>GST No: 24AJGPP9863R1Z5</div>
                        <div class="contact-row-orig">
                            <div>Mo: 8799617251, 8799617252, 8799617254, 9824025001</div>
                            <div>Email: jagdambaprofile@gmail.com</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="title-orig">DELIVERY CHALLAN</div>

            <div class="flex-row-orig">
                <div class="flex-col-orig">
                    <div class="section-header-orig">PARTY DETAILS</div>
                    <div class="input-row-orig" style="height: 40px;">
                        <div class="input-label-orig">Party Name:</div>
                        <div class="input-value-orig">${challan.partyName}</div>
                    </div>
                    <div class="input-row-orig" style="height: 50px;">
                        <div class="input-label-orig">Address:</div>
                        <div class="input-value-orig">${party?.deliveryAddress || order?.deliveryAddress || ''}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">GST Number:</div>
                        <div class="input-value-orig">${party?.gstNumber || order?.gstType || ''}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">Mobile Number:</div>
                        <div class="input-value-orig">${party?.mobileNumber || order?.mobileNumber || ''}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">Email ID :</div>
                        <div class="input-value-orig">${party?.email || ''}</div>
                    </div>
                </div>
                <div class="flex-col-orig">
                    <div class="section-header-orig">CHALLAN / ORDER DETAILS</div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">Challan No:</div>
                        <div class="input-value-orig" style="color: #1e3a8a; font-weight: bold;">${challan.challanNo}</div>
                    </div>
                    <div class="input-row-orig" style="height: 40px;">
                        <div class="input-label-orig">Challan Date:</div>
                        <div class="input-value-orig">${challan.challanDate}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">PO No:</div>
                        <div class="input-value-orig">${order?.orderNo || ''}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">PO Date:</div>
                        <div class="input-value-orig">${order?.orderDate || ''}</div>
                    </div>
                    <div class="input-row-orig">
                        <div class="input-label-orig">Order Page Number:</div>
                        <div class="input-value-orig">1 of 1</div>
                    </div>
                </div>
            </div>

            <table>
                <tr>
                    <td colspan="3" class="section-header-center-orig">VEHICLE TRANSPORT DETAILS</td>
                </tr>
                <tr>
                    <td style="width: 33.33%;"><b>Vehicle Number:</b> ${vehicleNo}</td>
                    <td style="width: 33.33%;"><b>Driver Mobile No:</b> ${driverMobile}</td>
                    <td style="width: 33.33%;"><b>Payment Terms :</b> ${order?.paymentTerms || ''}</td>
                </tr>
            </table>

            <table class="item-table-orig">
                <tr>
                    <th style="width: 5%;">Sr No</th>
                    <th style="width: 25%;">Item</th>
                    <th style="width: 10%;">Grade</th>
                    <th style="width: 10%;">Thickness</th>
                    <th style="width: 10%;">Width</th>
                    <th style="width: 10%;">Length</th>
                    <th style="width: 10%;">Nos</th>
                    <th style="width: 10%;">Kg</th>
                    <th style="width: 10%;">Rate</th>
                </tr>
                ${rowsHtmlOrig}
                ${emptyRowsHtmlOrig}
                <tr class="total-row-orig">
                    <td colspan="6" style="text-align: center;">Total</td>
                    <td style="text-align: center;">${totalNos > 0 ? totalNos : ''}</td>
                    <td style="text-align: center;">${totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                    <td></td>
                </tr>
            </table>

            <div style="border: 1px solid #000; margin-bottom: 10px;">
                <div class="section-header-orig" style="padding: 6px;">COMMERCIAL / QUALITY DETAILS</div>
                <div style="display: flex;">
                    <div style="flex: 6; border-right: 1px solid #000;">
                        <div style="padding: 6px; height: 50px; border-bottom: 1px solid #000; display: flex; align-items: center;"><b>Delivery Address :</b> <span style="margin-left: 8px;">${order?.deliveryAddress || party?.deliveryAddress || ''}</span></div>
                        <div style="padding: 6px; display: flex; align-items: center;">
                          <b>TC :</b> <div style="flex-grow: 1; border-bottom: 1px solid #000; margin: 0 15px; text-align: center;">${tcVal}</div> 
                          <b>UT :</b> <div style="flex-grow: 1; border-bottom: 1px solid #000; margin: 0 15px; text-align: center;">${utVal}</div>
                        </div>
                    </div>
                    <div style="flex: 4;">
                        <div style="padding: 6px; border-bottom: 1px solid #000; display: flex; align-items: center;"><b>Loading Charge:</b> <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 10px; text-align: center;">${loadingVal}</div></div>
                        <div style="padding: 6px; display: flex; align-items: center;"><b>Transport Charge:</b> <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 10px; text-align: center;">${transportVal}</div></div>
                    </div>
                </div>
            </div>

            <div class="terms-box-orig">
                <div class="section-header-orig" style="padding: 6px;">GENERAL TERMS AND CONDITIONS</div>
                <div class="terms-content-orig">
                    1. Material should be supplied strictly as per challan details. &nbsp;&nbsp;&nbsp; 2. Final weight / quantity will be considered as mutually agreed.<br>
                    3. Loading and transport charges as mentioned above. &nbsp;&nbsp;&nbsp; 4. Please verify material at the time of delivery.
                </div>
            </div>

            <div class="signature-row-orig">
                <div class="sig-box-orig">
                    <div>Receiver's Signature</div>
                </div>
                <div class="sig-box-orig">
                    <div>Dispatch</div>
                </div>
                <div class="sig-box-orig right-align-orig">
                    <div style="align-self: flex-start;">For</div>
                    <div style="font-size: 14px;">For Jagdamba Profile</div>
                </div>
            </div>

        </div>
      </div>
    `;
  };

  // Separate template for Duplicate copy — matches user-specified "SHREE JAGDAMBA STEEL PROFILES" design
  const buildChallanDuplicateHtml = () => {
    const duplicateStyleStr = `
      .challan-container-dup, .challan-container-dup * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .challan-container-dup {
        width: 1000px;
        background-color: white;
        border: 2px solid #000;
        padding: 4px;
        margin: auto;
      }
      .inner-border-dup {
        border: 1px solid #000;
        display: flex;
        flex-direction: column;
      }
      .header-dup {
        display: flex;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid #000;
      }
      .logo-container-dup {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-right: 20px;
        min-width: 80px;
      }
      .logo-mark-dup {
        font-size: 60px;
        color: #f26522;
        font-weight: bold;
        line-height: 1;
        text-align: center;
      }
      .logo-text-small-dup {
        font-size: 9px;
        text-align: center;
        font-weight: bold;
        color: #333;
      }
      .header-text-dup { flex-grow: 1; }
      .company-title-dup {
        color: #f26522;
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      .company-details-dup { font-size: 12px; line-height: 1.5; }
      .contact-row-dup { display: flex; justify-content: space-between; }
      .document-title-dup {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        padding: 8px;
        border-bottom: 1px solid #000;
        background-color: #f9f9f9;
      }
      .section-header-dup {
        background-color: #000;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        padding: 6px 10px;
        border-bottom: 1px solid #000;
      }
      .grid-2-col-dup {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .grid-cell-dup {
        border-bottom: 1px solid #000;
        border-right: 1px solid #000;
        padding: 8px 10px;
        font-size: 12px;
        min-height: 35px;
        display: flex;
        align-items: center;
      }
      .grid-cell-dup.no-right { border-right: none; }
      .grid-cell-dup label { font-weight: bold; margin-right: 8px; white-space: nowrap; }
      .grid-cell-dup .val { flex-grow: 1; }
      .transport-grid-dup {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        border-bottom: 1px solid #000;
      }
      .items-table-dup {
        width: 100%;
        border-collapse: collapse;
      }
      .items-table-dup th, .items-table-dup td {
        border: 1px solid #000;
        padding: 6px;
        text-align: center;
        font-size: 12px;
      }
      .items-table-dup th {
        background-color: #000;
        color: #fff;
        font-weight: bold;
        border-top: none;
      }
      .items-table-dup tr.empty-row-dup td { height: 25px; }
      .items-table-dup th:first-child, .items-table-dup td:first-child { border-left: none; }
      .items-table-dup th:last-child, .items-table-dup td:last-child { border-right: none; }
      .total-row-dup td { font-weight: bold; }
      .commercial-grid-dup {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-bottom: 1px solid #000;
      }
      .terms-content-dup {
        padding: 10px 15px;
        font-size: 11px;
        border-bottom: 1px solid #000;
      }
      .terms-list-dup {
        list-style-type: none;
        display: flex;
        flex-wrap: wrap;
        gap: 6px 20px;
      }
      .signatures-section-dup {
        display: grid;
        grid-template-columns: 1fr 1fr 1.5fr;
        min-height: 90px;
      }
      .signature-box-dup {
        padding: 10px;
        font-size: 12px;
        font-weight: bold;
        border-right: 1px solid #000;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .signature-box-dup:last-child { border-right: none; align-items: flex-end; }
      .sig-label-bottom-dup { align-self: flex-end; width: 100%; text-align: right; }
      .underline-input-dup {
        flex-grow: 1;
        border-bottom: 1px solid #000;
        height: 15px;
        margin-left: 5px;
        min-width: 50px;
      }
    `;

    const rowsHtmlDup = items.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align: left; padding-left: 8px;">${item.partName || item.drawingNumber || '-'}</td>
        <td>${item.materialGrade || '-'}</td>
        <td>${item.thickness ? `${item.thickness.replace(/mm/gi, '')}mm` : '-'}</td>
        <td>${item.width || item.innerDiameter || '-'}</td>
        <td>${item.length || item.outerDiameter || '-'}</td>
        <td>${item.unitType === 'Nos' ? item.quantity : '-'}</td>
        <td>${item.unitType === 'Kg' ? item.quantity : item.totalWeight || '-'}</td>
        <td>${item.rate > 0 ? '₹' + item.rate.toLocaleString('en-IN') : '-'}</td>
      </tr>
    `).join('');

    const emptyRowsCountDup = Math.max(0, 10 - items.length);
    const emptyRowsHtmlDup = Array.from({ length: emptyRowsCountDup }).map((_, index) => `
      <tr class="empty-row-dup">
        <td>${items.length + index + 1}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    `).join('');

    return `
      <style>${duplicateStyleStr}</style>
      <div class="challan-container-dup">
        <div class="inner-border-dup">

          <div class="header-dup">
            <div class="logo-container-dup">
              <img src="/logo.png" alt="Shree Jagdamba Steel Profiles" style="width: 140px; height: auto;" />
            </div>
            <div class="header-text-dup">
              <div class="company-title-dup">SHREE JAGDAMBA STEEL PROFILES</div>
              <div class="company-details-dup">
                <div>503/1A, GIDC Makarpura, Vadodara - 390010.</div>
                <div>GST No: 24AJGPP9863R1Z5</div>
                <div class="contact-row-dup">
                  <span>Mo: 8799617251, 8799617252, 8799617254, 9824025001</span>
                  <span>Email: jagdambaprofile@gmail.com</span>
                </div>
              </div>
            </div>
          </div>

          <div class="document-title-dup">DELIVERY CHALLAN &nbsp;&nbsp;|&nbsp;&nbsp; <span style="color:#f26522;">DUPLICATE COPY</span></div>

          <div style="display: flex;">
            <div class="section-header-dup" style="flex: 1; border-right: 1px solid #fff;">PARTY DETAILS</div>
            <div class="section-header-dup" style="flex: 1;">CHALLAN / ORDER DETAILS</div>
          </div>
          <div class="grid-2-col-dup">

            <div class="grid-cell-dup"><label>Party Name:</label><span class="val">${challan.partyName}</span></div>
            <div class="grid-cell-dup no-right"><label>Challan No:</label><span class="val" style="color:#1e3a8a; font-weight:bold;">${challan.challanNo}</span></div>

            <div class="grid-cell-dup" style="align-items: flex-start; padding-top: 8px;"><label>Address:</label><span class="val">${party?.deliveryAddress || order?.deliveryAddress || ''}</span></div>
            <div class="grid-cell-dup no-right"><label>Challan Date:</label><span class="val">${challan.challanDate}</span></div>

            <div class="grid-cell-dup"><label>GST Number:</label><span class="val">${party?.gstNumber || order?.gstType || ''}</span></div>
            <div class="grid-cell-dup no-right"><label>PO No:</label><span class="val">${order?.orderNo || ''}</span></div>

            <div class="grid-cell-dup"><label>Mobile Number:</label><span class="val">${party?.mobileNumber || order?.mobileNumber || ''}</span></div>
            <div class="grid-cell-dup no-right"><label>PO Date:</label><span class="val">${order?.orderDate || ''}</span></div>

            <div class="grid-cell-dup"><label>Email ID :</label><span class="val">${party?.email || ''}</span></div>
            <div class="grid-cell-dup no-right"><label>Order Page Number:</label><span class="val">1 of 1</span></div>
          </div>

          <div class="section-header-dup" style="text-align: center;">VEHICLE TRANSPORT DETAILS</div>
          <div class="transport-grid-dup">
            <div class="grid-cell-dup" style="border-bottom: none;"><label>Vehicle Number:</label><span class="val">${vehicleNo}</span></div>
            <div class="grid-cell-dup" style="border-bottom: none;"><label>Driver Mobile No:</label><span class="val">${driverMobile}</span></div>
            <div class="grid-cell-dup no-right" style="border-bottom: none;"><label>Payment Terms :</label><span class="val">${order?.paymentTerms || ''}</span></div>
          </div>

          <table class="items-table-dup">
            <thead>
              <tr>
                <th style="width:5%;">Sr No</th>
                <th style="width:25%;">Item</th>
                <th style="width:10%;">Grade</th>
                <th style="width:10%;">Thickness</th>
                <th style="width:10%;">Width</th>
                <th style="width:10%;">Length</th>
                <th style="width:10%;">Nos</th>
                <th style="width:10%;">Kg</th>
                <th style="width:10%;">Rate</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtmlDup}
              ${emptyRowsHtmlDup}
              <tr class="total-row-dup">
                <td colspan="6" style="text-align: center; border-bottom: none;">Total</td>
                <td style="border-bottom: none; font-weight: bold;">${totalNos > 0 ? totalNos : ''}</td>
                <td style="border-bottom: none; font-weight: bold;">${totalKg > 0 ? totalKg.toLocaleString('en-IN') : ''}</td>
                <td style="border-bottom: none;"></td>
              </tr>
            </tbody>
          </table>

          <div class="section-header-dup" style="border-top: 1px solid #000;">COMMERCIAL / QUALITY DETAILS</div>
          <div class="commercial-grid-dup">
            <div class="grid-cell-dup" style="grid-row: span 2; align-items: flex-start; padding-top: 10px;">
              <label>Delivery Address :</label>
              <span class="val">${order?.deliveryAddress || party?.deliveryAddress || ''}</span>
            </div>
            <div class="grid-cell-dup no-right" style="display: flex; align-items: center;">
              <label>Loading Charge:</label>
              <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 5px; padding-bottom: 2px;">${loadingVal}</div>
            </div>
            <div class="grid-cell-dup no-right" style="display: flex; align-items: center;">
              <label>Transport Charge:</label>
              <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 5px; padding-bottom: 2px;">${transportVal}</div>
            </div>
            <div class="grid-cell-dup" style="border-bottom: none; display: flex; align-items: center;">
              <label>TC :</label>
              <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 5px; padding-bottom: 2px;">${tcVal}</div>
            </div>
            <div class="grid-cell-dup no-right" style="border-bottom: none; display: flex; align-items: center;">
              <label>UT :</label>
              <div style="flex-grow: 1; border-bottom: 1px solid #000; margin-left: 5px; padding-bottom: 2px;">${utVal}</div>
            </div>
          </div>

          <div class="section-header-dup">GENERAL TERMS AND CONDITIONS</div>
          <div class="terms-content-dup">
            <ul class="terms-list-dup">
              <li>1. Material should be supplied strictly as per challan details.</li>
              <li>2. Final weight / quantity will be considered as mutually agreed.</li>
              <li>3. Loading and transport charges as mentioned above.</li>
              <li>4. Please verify material at the time of delivery.</li>
            </ul>
          </div>

          <div class="signatures-section-dup">
            <div class="signature-box-dup">
              <span>Receiver's Signature</span>
            </div>
            <div class="signature-box-dup">
              <span>Dispatch</span>
            </div>
            <div class="signature-box-dup">
              <span style="align-self: flex-start;">For</span>
              <span class="sig-label-bottom-dup">For Shree Jagdamba Steel Profiles</span>
            </div>
          </div>

        </div>
      </div>
    `;
  };

  document.body.appendChild(hiddenWrapper);

  try {
    const pdfWidth = new jsPDF('p', 'mm', 'a4').internal.pageSize.getWidth();
    const margin = 5;
    const width = pdfWidth - 2 * margin;

    // --- Download 1: Original ---
    tempDiv.innerHTML = buildChallanHtml('Original');
    const canvasOriginal = await html2canvas(tempDiv, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const pdfOriginal = new jsPDF('p', 'mm', 'a4');
    const imgOriginal = canvasOriginal.toDataURL('image/png');
    const heightOriginal = (canvasOriginal.height * width) / canvasOriginal.width;
    pdfOriginal.addImage(imgOriginal, 'PNG', margin, margin, width, heightOriginal);
    pdfOriginal.save(`Challan_${sanitizeFilename(challan.challanNo)}_Original.pdf`);

    // Small delay so the browser doesn't block the second download
    await new Promise(resolve => setTimeout(resolve, 500));

    // --- Download 2: Duplicate (new Shree Jagdamba Steel Profiles design) ---
    tempDiv.innerHTML = buildChallanDuplicateHtml();
    const canvasDuplicate = await html2canvas(tempDiv, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const pdfDuplicate = new jsPDF('p', 'mm', 'a4');
    const imgDuplicate = canvasDuplicate.toDataURL('image/png');
    const heightDuplicate = (canvasDuplicate.height * width) / canvasDuplicate.width;
    pdfDuplicate.addImage(imgDuplicate, 'PNG', margin, margin, width, heightDuplicate);
    pdfDuplicate.save(`Challan_${sanitizeFilename(challan.challanNo)}_Duplicate.pdf`);
  } catch (error) {
    console.error('Error generating challan PDF:', error);
  } finally {
    document.body.removeChild(hiddenWrapper);
  }
};

/**
 * Order Entry PDF Generator
 */
export const generateOrderEntryPDF = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  // Header Section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SINCE 2002W', 10, 15);
  doc.text('GSTIN: 24AJGPP9863R1Z5', pageWidth - 10, 15, { align: 'right' });

  doc.setFontSize(24);
  doc.text('JAGDAMBA PROFILE', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(9);
  doc.text('Mfg.: M.S. & S.S., C.N.C. Profile Cutting Traders & Steel', pageWidth / 2, 31, { align: 'center' });
  doc.text('Office: 504/1, GIDC, Industrial Estate, Makarpura, Vadodara -390010.', pageWidth / 2, 36, { align: 'center' });
  doc.text('Ph: 9824917250, 9824025001, 8799617250, 8799617251 | Email: jagdambaprofile@gmail.com', pageWidth / 2, 41, { align: 'center' });

  // Document Title Banner
  doc.setFillColor(0, 0, 0);
  doc.rect(pageWidth / 2 - 50, 48, 100, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER ENTRY ACKNOWLEDGEMENT', pageWidth / 2, 54, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  if (order.urgent) {
    doc.setTextColor(255, 0, 0);
    doc.text('*** URGENT ORDER ***', pageWidth / 2, 65, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // Info Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let y = 75;
  const leftX = 15;
  const rightX = pageWidth / 2 + 10;

  doc.text('Customer:', leftX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.partyName, leftX + 30, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text('Contact Person:', leftX, y);
  doc.text(order.contactPerson || '-', leftX + 30, y);
  y += 8;
  doc.text('Mobile No.:', leftX, y);
  doc.text(order.mobileNumber || '-', leftX + 30, y);
  y += 8;
  doc.text('Address:', leftX, y);
  doc.text(order.deliveryAddress || '-', leftX + 30, y, { maxWidth: pageWidth / 2 - 45 });

  y = 75;
  doc.text('Order No.:', rightX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderNo, rightX + 30, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text('Order Date:', rightX, y);
  doc.text(order.orderDate, rightX + 30, y);
  y += 8;
  doc.text('Delivery Date:', rightX, y);
  doc.text(order.deliveryDate || '-', rightX + 30, y);

  autoTable(doc, {
    startY: 115,
    margin: { left: 10, right: 10 },
    head: [['Sr.', 'Description of Material', 'Qty', 'Grade']],
    body: order.items.map((item, index) => [
      index + 1,
      `${item.partName || '-'} - ${item.thickness.replace(/mm/gi, '')}mm (${item.cuttingType})`,
      `${item.quantity} ${item.unitType}`,
      item.materialGrade
    ]),
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
    styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0, 0, 0] },
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFont('helvetica', 'bold');
  doc.text(`Remarks: ${order.remark || 'No special instructions.'}`, 10, finalY + 15, { maxWidth: pageWidth - 20 });

  const footerY = pageHeight - 30;
  doc.text("Customer Signature", 30, footerY);
  doc.text("Authorized Signatory", pageWidth - 60, footerY);

  doc.save(`Order_${sanitizeFilename(order.orderNo)}.pdf`);
};

export const generateSalesOrderPDF = async (order: Order, parties: any[] = []) => {
  const hiddenWrapper = document.createElement('div');
  hiddenWrapper.style.position = 'absolute';
  hiddenWrapper.style.left = '-9999px';
  hiddenWrapper.style.top = '0px';
  hiddenWrapper.style.width = '0px';
  hiddenWrapper.style.height = '0px';
  hiddenWrapper.style.overflow = 'hidden';
  hiddenWrapper.style.zIndex = '-9999';

  const tempDiv = document.createElement('div');
  tempDiv.style.width = '1000px';
  tempDiv.style.background = '#ffffff';
  hiddenWrapper.appendChild(tempDiv);

  const party = parties.find(p => p.partyName === order.partyName);
  const items = order.items || [];
  const emptyRowsCount = Math.max(0, 12 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const styleStr = `
    .order-container-dl {
        width: 1000px;
        margin: auto;
        background: #fff;
        padding: 12px;
        color: #000;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }
    
    /* Double Border Effect */
    .border-outer-dl {
        border: 2px solid black;
        padding: 2px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }
    .border-inner-dl {
        border: 1px solid black;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }

    /* Header Section */
    .header-section-dl {
        text-align: center;
    }
    .header-section-dl h1 {
        margin: 10px 0 5px 0;
        font-size: 26px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: bold;
    }
    .header-subtitle-dl {
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        padding: 6px;
        font-weight: bold;
        font-size: 14px;
    }
    .header-contact-dl {
        padding: 6px;
        font-size: 12px;
    }
    .header-gst-dl {
        border-top: 1px solid black;
        padding: 8px 10px;
        font-size: 13px;
        text-align: left;
    }

    /* Title Bar */
    .sales-order-bar-dl {
        border-top: 1px solid black;
        border-bottom: 1px solid black;
        background-color: #e6e6e6;
        text-align: center;
        font-size: 22px;
        font-weight: bold;
        padding: 8px;
        letter-spacing: 0.5px;
    }

    /* General Table Styling */
    .sales-order-table-dl {
        width: 100%;
        border-collapse: collapse;
        margin-top: -1px;
    }
    .sales-order-table-dl th, .sales-order-table-dl td {
        border: 1px solid black;
        padding: 8px 6px;
        font-size: 13px;
    }
    /* Remove outer borders of tables to sit flush with inner wrapper */
    .sales-order-table-dl th:first-child, .sales-order-table-dl td:first-child { border-left: none; }
    .sales-order-table-dl th:last-child, .sales-order-table-dl td:last-child { border-right: none; }

    /* Top Order Info Table */
    .info-table-dl td.label {
        font-weight: bold;
        width: 20%;
        background-color: #fafafa;
    }
    .info-table-dl td.input {
        width: 30%;
    }

    /* Items Grid */
    .items-table-dl th {
        font-weight: bold;
        background-color: #e6e6e6;
        text-align: center;
        padding: 10px 4px;
    }
    .items-table-dl td {
        text-align: center;
        height: 28px;
    }
    .items-table-dl th:nth-child(1) { width: 5%; }
    .items-table-dl th:nth-child(2) { width: 23%; }
    .items-table-dl th:nth-child(3) { width: 10%; }
    .items-table-dl th:nth-child(4) { width: 10%; }
    .items-table-dl th:nth-child(5) { width: 10%; }
    .items-table-dl th:nth-child(6) { width: 10%; }
    .items-table-dl th:nth-child(7) { width: 7%; }
    .items-table-dl th:nth-child(8) { width: 10%; }
    .items-table-dl th:nth-child(9) { width: 15%; }

    /* Footer Info Table */
    .footer-table-dl td.label {
        font-weight: bold;
        width: 20%;
        background-color: #fafafa;
    }
    .footer-table-dl td.input {
        width: 30%;
    }
    .footer-table-dl td.center {
        text-align: center;
    }

    /* Fixed Signature Block */
    .signature-table-dl {
        border-bottom: none;
        margin-top: 40px;
    }
    .signature-table-dl td {
        height: 70px;
        vertical-align: bottom;
        text-align: center;
        font-weight: bold;
        width: 33.333%;
        padding-bottom: 12px;
        border-bottom: none;
    }
  `;

  const rowsHtml = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td style="text-align: left; padding-left: 8px;">${item.partName || item.drawingNumber || '-'}</td>
      <td>${item.materialGrade || '-'}</td>
      <td>${item.thickness ? `${item.thickness.replace(/mm/gi, '')}mm` : '-'}</td>
      <td>${item.width || item.innerDiameter || '-'}</td>
      <td>${item.length || item.outerDiameter || '-'}</td>
      <td>${item.quantity}</td>
      <td>${item.rate > 0 ? '₹' + item.rate.toLocaleString('en-IN') : '-'}</td>
      <td>${item.unitType || '-'}</td>
    </tr>
  `).join('');

  const emptyRowsHtml = emptyRows.map((_, index) => `
    <tr>
      <td>${items.length + index + 1}</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  `).join('');

  tempDiv.innerHTML = `
    <style>${styleStr}</style>
    <div class="order-container-dl">
      <div class="border-outer-dl">
        <div class="border-inner-dl">
            
            <div class="header-section-dl">
                <h1>Jagdamba Profile</h1>
                <div class="header-subtitle-dl">MS & SS CNC Profile Cutting Works | Steel Traders</div>
                <div class="header-contact-dl">Address: Makarpura GIDC / Por GIDC, Vadodara | Mobile: 9824917250 | Email: jagdambaprofile@gmail.com</div>
                <div class="header-gst-dl">GST No: 24AJGPP9863R1Z5</div>
            </div>

            <div class="sales-order-bar-dl">SALES ORDER</div>

            <table class="sales-order-table-dl info-table-dl">
              <tbody>
                <tr>
                    <td class="label">Sales Order No</td>
                    <td class="input" style="font-weight: bold;">${order.orderNo}</td>
                    <td class="label">Date</td>
                    <td class="input">${order.orderDate}</td>
                </tr>
                <tr>
                    <td class="label">Party PO No</td>
                    <td class="input">${order.customerPONo || '-'}</td>
                    <td class="label">PO Date</td>
                    <td class="input">${order.customerPODate || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Party Name</td>
                    <td class="input" style="font-weight: bold;">${order.partyName}</td>
                    <td class="label">Contact Person</td>
                    <td class="input">${order.contactPerson || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Party Address</td>
                    <td class="input">${party?.deliveryAddress || order.deliveryAddress || ''}</td>
                    <td class="label">GST No</td>
                    <td class="input">${party?.gstNumber || order.gstType || '-'}</td>
                </tr>
              </tbody>
            </table>

            <table class="sales-order-table-dl items-table-dl">
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
                    ${rowsHtml}
                    ${emptyRowsHtml}
                </tbody>
            </table>

            <table class="sales-order-table-dl footer-table-dl">
              <tbody>
                <tr>
                    <td class="label">Delivery Address</td>
                    <td class="input">${order.deliveryAddress || '-'}</td>
                    <td class="label">Payment Terms</td>
                    <td class="input">${order.paymentTerms || '-'}</td>
                </tr>
                <tr>
                    <td class="label">TC</td>
                    <td class="center" style="font-weight: bold;">${order.tc === 'Yes' ? 'YES' : 'NO'}</td>
                    <td class="label">UT</td>
                    <td class="center" style="font-weight: bold;">${order.ut === 'Yes' ? 'YES' : 'NO'}</td>
                </tr>
                <tr>
                    <td class="label">Transport</td>
                    <td class="center" style="font-weight: bold;">${order.handledBy ? 'YES' : 'NO'}</td>
                    <td class="label">Loading</td>
                    <td class="center" style="font-weight: bold;">${(order.loadingUnloadingCharges && order.loadingUnloadingCharges > 0) ? 'YES' : 'NO'}</td>
                </tr>
                <tr>
                    <td class="label">Remarks</td>
                    <td colSpan="3">${order.remark || '-'}</td>
                </tr>
              </tbody>
            </table>

            <table class="sales-order-table-dl signature-table-dl">
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
  `;

  document.body.appendChild(hiddenWrapper);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    const margin = 5;
    const width = pdfWidth - 2 * margin;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, width, height);
    pdf.save(`SalesOrder_${sanitizeFilename(order.orderNo)}.pdf`);
  } catch (error) {
    console.error('Error generating sales order PDF:', error);
  } finally {
    document.body.removeChild(hiddenWrapper);
  }
};

/**
 * Worker-wise Task List PDF
 */
export const generateWorkerTaskPDF = (workerName: string, items: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('WORKER TASK LIST', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Worker: ${workerName}`, 15, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 30, { align: 'right' });

  autoTable(doc, {
    startY: 40,
    head: [['Order No', 'Party', 'Description', 'Qty', 'Status']],
    body: items.map(i => [
      i.orderNo,
      i.partyName,
      `${i.partName || i.cuttingType} (${i.thickness})`,
      `${i.completedQty || 0} / ${i.quantity}`,
      i.itemStatus || 'Pending'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
  });

  doc.save(`Tasks_${sanitizeFilename(workerName)}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Worker-wise Performance Report PDF
 */
export const generateWorkerPerformancePDF = (workerName: string, items: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('WORKER PERFORMANCE REPORT', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Worker: ${workerName}`, 15, 30);
  doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 30, { align: 'right' });

  const completed = items.filter(i => i.itemStatus === 'Completed');
  const totalItems = items.length;

  doc.setFontSize(10);
  doc.text(`Total Tasks Assigned: ${totalItems}`, 15, 45);
  doc.text(`Tasks Completed: ${completed.length}`, 15, 52);
  doc.text(`Efficiency: ${totalItems > 0 ? Math.round((completed.length / totalItems) * 100) : 0}%`, 15, 59);

  autoTable(doc, {
    startY: 70,
    head: [['Order No', 'Party', 'Item', 'Qty', 'Completion Date']],
    body: completed.map(i => [
      i.orderNo,
      i.partyName,
      i.partName || i.cuttingType,
      i.quantity,
      i.completedAt ? new Date(i.completedAt).toLocaleDateString() : '-'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald-600
  });

  doc.save(`Report_${sanitizeFilename(workerName)}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Detailed Purchase Report PDF Generator (Landscape)
 */
export const generatePurchaseReportPDF = (orders: PurchaseOrder[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.width;

  // Header Section
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('JAGDAMBA PROFILE', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(14);
  doc.text('PURCHASE REPORT', pageWidth / 2, 23, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 15, 23, { align: 'right' });

  const rows: any[] = [];
  orders.forEach(po => {
    po.items.forEach(item => {
      rows.push([
        po.invoiceNo || '-',
        po.date,
        po.poNumber,
        po.supplierName,
        item.grade,
        item.thickness,
        item.length,
        item.width,
        item.nos,
        item.kg.toFixed(3),
        po.deliveryAddress || '-',
        item.rate.toLocaleString(),
        po.make || '-',
        po.transportName || '-',
        (item.actualWeight || 0).toFixed(3),
        po.transportNumber || '-',
        po.customer || '-',
        po.location || '-',
        item.heatNo || '-',
        (item.nos * item.kg).toFixed(3) // Theoretical Total
      ]);
    });
  });

  autoTable(doc, {
    startY: 30,
    margin: { left: 5, right: 5 },
    head: [['Inv No', 'Date', 'PO No', 'Supplier', 'Grade', 'Thk', 'Len', 'Wid', 'Nos', 'Theor Wt', 'Delivery', 'Rate', 'Make', 'Transport', 'Actual Wt', 'Gadi No', 'Customer', 'Loc', 'Heat No', 'Total']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], halign: 'center', fontSize: 6 },
    columnStyles: {
      0: { cellWidth: 15 }, // Inv No
      1: { cellWidth: 15 }, // Date
      2: { cellWidth: 15 }, // PO No
      3: { cellWidth: 25 }, // Supplier
      9: { halign: 'right' }, // Theor Wt
      11: { halign: 'right' }, // Rate
      14: { halign: 'right' }, // Actual Wt
      19: { halign: 'right' }, // Total
    }
  });

  doc.save(`Purchase_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generate Test Certificate (TC) as Base64 Data URL
 */
export const generateTCPDFBase64 = (tc: any): string => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, doc.internal.pageSize.height - 10);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TEST CERTIFICATE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`TC No: ${tc.tcNumber || '-'}`, 15, 30);
  doc.text(`Date: ${tc.tcDate || '-'}`, pageWidth - 15, 30, { align: 'right' });

  doc.line(5, 35, pageWidth - 5, 35);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let y = 45;
  const leftX = 15;
  const rightX = pageWidth / 2 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Core Details', leftX, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`Heat Number: ${tc.heatNumber || '-'}`, leftX, y);
  doc.text(`Plate Number: ${tc.plateNumber || '-'}`, rightX, y);
  y += 8;
  doc.text(`Grade: ${tc.grade || '-'}`, leftX, y);
  doc.text(`Thickness: ${tc.thickness || '-'}`, rightX, y);
  y += 8;
  doc.text(`Width: ${tc.width || '-'}`, leftX, y);
  doc.text(`Length: ${tc.length || '-'}`, rightX, y);
  y += 8;
  doc.text(`Weight: ${tc.plateWeight || '-'} Kg`, leftX, y);
  doc.text(`Make: ${tc.make || '-'}`, rightX, y);
  y += 8;
  doc.text(`Standard: ${tc.standard || '-'}`, leftX, y);

  y += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', leftX, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.text(`Sales Order No: ${tc.salesOrderNumber || '-'}`, leftX, y);
  doc.text(`SO Date: ${tc.salesOrderDate || '-'}`, rightX, y);
  y += 8;
  doc.text(`Purchase Order No: ${tc.purchaseOrderNumber || '-'}`, leftX, y);
  doc.text(`PO Date: ${tc.purchaseOrderDate || '-'}`, rightX, y);
  y += 8;
  doc.text(`Supplier Invoice No: ${tc.supplierInvoiceNumber || '-'}`, leftX, y);
  doc.text(`Invoice Date: ${tc.supplierInvoiceDate || '-'}`, rightX, y);

  doc.setFontSize(9);
  doc.text('This is a system generated summary of the Test Certificate.', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

  return doc.output('datauristring');
};

