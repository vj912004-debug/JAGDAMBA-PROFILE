import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { ChallanRecord, Order, PurchaseOrder } from '../store/AppContext';

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
  pdf.save(`${filename}.pdf`);
};

/**
 * Delivery Challan PDF Generator (Modern Design)
 */
export const generateChallanPDF = (challan: ChallanRecord, order: Order | undefined) => {
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
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Office: 504/1, GIDC, Industrial Estate, Makarpura, Vadodara -390010.', pageWidth / 2, 36, { align: 'center' });
  doc.text('Ph: 9824917250, 9824025001, 8799617250, 8799617251, 8799617252, 8799617254, 9099969507', pageWidth / 2, 41, { align: 'center' });
  doc.text('E-mail ID: jagdambaprofile@gmail.com', pageWidth / 2, 45, { align: 'center' });

  // Document Title Banner
  doc.setFillColor(0, 0, 0);
  doc.rect(pageWidth / 2 - 30, 48, 60, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY CHALLAN', pageWidth / 2, 54, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Info Section
  doc.setLineWidth(0.3);
  doc.line(5, 60, pageWidth - 5, 60);
  doc.line(pageWidth / 2, 60, pageWidth / 2, 105);
  doc.line(5, 105, pageWidth - 5, 105);

  doc.setFontSize(9);
  let y = 68;
  const leftX = 10;
  const rightX = pageWidth / 2 + 5;

  doc.text('M/s.', leftX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(challan.partyName, leftX + 15, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.text('Gadi Number:', leftX, y);
  y += 7;
  doc.text('Driver No.:', leftX, y);
  y += 7;
  doc.text('Lr No.:', leftX, y);
  y += 7;
  doc.text('Delivery Address:', leftX, y);
  doc.text(order?.deliveryAddress || '', leftX + 30, y, { maxWidth: 60 });

  y = 68;
  doc.text('Challan No:', rightX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(challan.challanNo, rightX + 25, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.text('Challan Date:', rightX, y);
  doc.text(challan.challanDate, rightX + 25, y);
  y += 7;
  doc.text('Order No:', rightX, y);
  doc.text(challan.orderNo, rightX + 25, y);

  autoTable(doc, {
    startY: 110,
    margin: { left: 10, right: 10 },
    head: [['Sr.', 'Description of Material', 'Quantity', 'Rate', 'Amount']],
    body: (order?.items || []).map((item: any, index: number) => [
      index + 1,
      `${item.partName} - ${(item.thickness || '').replace(/mm/gi, '')}mm (${item.cuttingType})`,
      `${item.quantity} ${item.unitType}`,
      item.rate,
      (item.amount || 0).toLocaleString()
    ]),
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
    styles: { fontSize: 9, cellPadding: 3, lineWidth: 0.1, lineColor: [0, 0, 0] },
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Footer
  let footerY = finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.text("Receiver's Signature", 30, footerY);
  doc.text("For Jagdamba Profile", pageWidth - 60, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text("with Rubber Stamp", 30, footerY + 5);

  doc.save(`Challan_${challan.challanNo}.pdf`);
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

  doc.save(`Order_${order.orderNo}.pdf`);
};

export const generateSalesOrderPDF = async (order: Order) => {
  const sanitizeFilename = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
  };

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '1000px';
  tempDiv.style.background = '#ffffff';

  const styleStr = `
    .order-container-dl {
        width: 1000px;
        margin: auto;
        background: #fff;
        border: 2px solid #000;
        padding: 10px;
        color: #000;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }

    .header-dl {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 10px;
    }

    .header-dl h1 {
        font-size: 42px;
        font-weight: bold;
        margin: 0;
        padding: 0;
    }

    .header-dl h3 {
        margin-top: 5px;
        font-size: 20px;
        margin: 5px 0 0 0;
        padding: 0;
    }

    .company-info-dl {
        margin-top: 10px;
        font-size: 14px;
        border-top: 1px solid #000;
        padding-top: 10px;
    }

    .gst-dl {
        margin-top: 10px;
        font-size: 14px;
    }

    .sales-title-dl {
        text-align: center;
        font-size: 36px;
        font-weight: bold;
        margin: 20px 0;
        border: 2px solid #000;
        padding: 10px;
    }

    .info-table-dl {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 10px;
    }

    .info-table-dl td {
        border: 1px solid #000;
        padding: 12px;
        height: 50px;
        font-size: 14px;
    }

    .main-table-dl {
        width: 100%;
        border-collapse: collapse;
    }

    .main-table-dl th,
    .main-table-dl td {
        border: 1px solid #000;
        padding: 10px;
        text-align: center;
        height: 45px;
        font-size: 13px;
    }

    .main-table-dl th {
        background: #eaeaea;
        font-weight: bold;
    }

    .footer-table-dl {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    .footer-table-dl td {
        border: 1px solid #000;
        padding: 12px;
        height: 55px;
        font-size: 14px;
    }

    .signature-table-dl {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    .signature-table-dl td {
        border: 1px solid #000;
        padding: 20px;
        text-align: center;
        font-weight: bold;
        height: 70px;
        vertical-align: bottom;
        font-size: 14px;
    }
  `;

  const items = order.items || [];
  const rows = Array.from({ length: 12 }).map((_, idx) => {
    const item = items[idx];
    if (item) {
      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="text-align: left;">${item.partName || item.cuttingType}</td>
          <td>${item.materialGrade || '-'}</td>
          <td>${item.thickness || '-'}</td>
          <td>${item.width || item.innerDiameter || '-'}</td>
          <td>${item.length || item.outerDiameter || '-'}</td>
          <td>${item.quantity || '0'}</td>
          <td>${item.rate || '0'}</td>
          <td>${item.unitType || 'Nos'}</td>
        </tr>
      `;
    } else {
      return `
        <tr>
          <td>${idx + 1}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    }
  }).join('');

  const tcVal = order.tc || 'No';
  const utVal = order.ut || 'No';
  const transportVal = (order.transportationCharges && order.transportationCharges > 0) ? 'YES' : 'NO';
  const loadingVal = (order.loadingUnloadingCharges && order.loadingUnloadingCharges > 0) ? 'YES' : 'NO';

  tempDiv.innerHTML = `
    <style>${styleStr}</style>
    <div class="order-container-dl">
      <div class="header-dl">
          <h1>JAGDAMBA PROFILE</h1>
          <h3>MS & SS CNC Profile Cutting Works | Steel Traders</h3>

          <div class="company-info-dl">
              Address: Makarpura GIDC / Por GIDC, Vadodara |
              Mobile: 9824917250 |
              Email: jagdambaprofile@gmail.com
          </div>

          <div class="gst-dl">
              GST No: 24AJGPP9863R1Z5
          </div>
      </div>

      <div class="sales-title-dl">
          SALES ORDER
      </div>

      <!-- Top Info -->
      <table class="info-table-dl">
          <tr>
              <td style="width: 20%;"><b>Sales Order No</b></td>
              <td style="width: 30%; font-weight: bold; color: #1e3a8a;">${order.orderNo}</td>
              <td style="width: 20%;"><b>Date</b></td>
              <td style="width: 30%;">${order.orderDate}</td>
          </tr>

          <tr>
              <td><b>Party PO No</b></td>
              <td>${order.customerPONo || ''}</td>
              <td><b>PO Date</b></td>
              <td>${order.customerPODate || ''}</td>
          </tr>

          <tr>
              <td><b>Party Name</b></td>
              <td style="font-weight: bold;">${order.partyName}</td>
              <td><b>Contact Person</b></td>
              <td>${order.contactPerson || ''}</td>
          </tr>

          <tr>
              <td><b>Party Address</b></td>
              <td>${order.deliveryAddress || ''}</td>
              <td><b>GST No</b></td>
              <td></td>
          </tr>
      </table>

      <!-- Main Table -->
      <table class="main-table-dl">
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
              ${rows}
          </tbody>
      </table>

      <!-- Footer -->
      <table class="footer-table-dl">
          <tr>
              <td style="width: 20%;"><b>Delivery Address</b></td>
              <td style="width: 30%;">${order.partyName} - ${order.deliveryAddress || ''}</td>
              <td style="width: 20%;"><b>Payment Terms</b></td>
              <td style="width: 30%;">${order.paymentTerms || ''}</td>
          </tr>

          <tr>
              <td><b>TC</b></td>
              <td>${tcVal.toUpperCase()}</td>
              <td><b>UT</b></td>
              <td>${utVal.toUpperCase()}</td>
          </tr>

          <tr>
              <td><b>Transport</b></td>
              <td>${transportVal}</td>
              <td><b>Loading</b></td>
              <td>${loadingVal}</td>
          </tr>

          <tr>
              <td><b>Remarks</b></td>
              <td colspan="3">${order.remark || ''}</td>
          </tr>
      </table>

      <!-- Signature -->
      <table class="signature-table-dl">
          <tr>
              <td style="width: 33%;">Prepared By</td>
              <td style="width: 33%;">Checked By</td>
              <td style="width: 34%;">Authorized Signature</td>
          </tr>
      </table>
    </div>
  `;

  document.body.appendChild(tempDiv);

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
    document.body.removeChild(tempDiv);
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

  doc.save(`Tasks_${workerName}_${new Date().toISOString().split('T')[0]}.pdf`);
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
  const inProgress = items.filter(i => i.itemStatus === 'In Progress');
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

  doc.save(`Report_${workerName}_${new Date().toISOString().split('T')[0]}.pdf`);
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
