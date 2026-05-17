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

  doc.save(`Challan_${sanitizeFilename(challan.challanNo)}.pdf`);
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

export const generateSalesOrderPDF = (order: Order) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  // Header Section
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('JAGDAMBA PROFILE', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('504/1/A, GIDC Makarpura, Vadodara - 390010', pageWidth / 2, 26, { align: 'center' });
  doc.text('GST No: 24AJGPP9863R1Z5', pageWidth / 2, 31, { align: 'center' });

  // Document Title Banner
  doc.setFillColor(0, 0, 0);
  doc.rect(pageWidth / 2 - 25, 35, 50, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES ORDER', pageWidth / 2, 41, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Info Sections Borders
  doc.setLineWidth(0.3);
  doc.line(5, 48, pageWidth - 5, 48); // Top line
  doc.line(pageWidth / 2, 48, pageWidth / 2, 95); // Middle divider
  doc.line(5, 95, pageWidth - 5, 95); // Bottom line

  doc.setFontSize(9);
  let y = 55;
  const leftX = 10;
  const rightX = pageWidth / 2 + 5;

  // Left Column (Party Details)
  doc.text('Party Name:', leftX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.partyName, leftX + 25, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.text('Address:', leftX, y);
  doc.text(order.deliveryAddress || '-', leftX + 25, y, { maxWidth: 60 });
  y += 12; // Adjusted from 14
  doc.text('GST:', leftX, y);
  y += 7;
  doc.text('Email ID:', leftX, y);
  y += 7;
  doc.text('Mobile No:', leftX, y);
  doc.text(order.mobileNumber || '-', leftX + 25, y);

  // Right Column (Order Details)
  y = 55;
  doc.text('SO No:', rightX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.orderNo, rightX + 25, y);
  doc.setFont('helvetica', 'normal');
  y += 7;
  doc.text('SO Date:', rightX, y);
  doc.text(order.orderDate, rightX + 25, y);
  y += 7;
  doc.text('PO No:', rightX, y);
  y += 7;
  doc.text('PO Date:', rightX, y);

  // Delivery & Other Details
  doc.setFont('helvetica', 'bold');
  doc.text('DELIVERY & OTHER DETAILS', pageWidth / 2, 102, { align: 'center' });
  doc.line(pageWidth / 2 - 30, 103, pageWidth / 2 + 30, 103);
  
  doc.setFont('helvetica', 'normal');
  y = 108;
  doc.text('Delivery Address:', leftX, y);
  doc.text(`${order.partyName} - ${order.deliveryAddress}`, leftX + 35, y);
  
  y += 7;
  doc.text('Burning Loss:', leftX, y);
  doc.text('Loading & Unloading:', rightX, y);
  doc.text(`Rs. ${(order.loadingUnloadingCharges || 0).toLocaleString()}`, rightX + 35, y);
  
  y += 7;
  doc.text('Payment Term:', leftX, y);
  doc.text(order.paymentTerms || '-', leftX + 25, y);
  doc.text('Status:', rightX, y);
  doc.text(order.stage, rightX + 25, y);
  
  y += 7;
  doc.text('TC:', leftX, y);
  doc.text('UT:', rightX, y);

  y += 10;
  doc.text('Note:', leftX, y);
  doc.text(order.remark || '-', leftX + 15, y, { maxWidth: pageWidth - 30 });

  // Items Table
  const tableData = order.items.map((item, index) => [
    index + 1,
    item.partName || item.cuttingType,
    item.materialGrade,
    (item.thickness || '').replace(/mm/gi, '') + 'mm',
    item.width || item.innerDiameter || '-',
    item.length || item.outerDiameter || '-',
    item.quantity,
    '-',
    (item.rate || 0).toLocaleString(),
    (item.amount || 0).toLocaleString()
  ]);

  while (tableData.length < 12) {
    tableData.push(['', '', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y + 5,
    margin: { left: 5, right: 5 },
    head: [['Sr', 'Item', 'Grade', 'Thk', 'Width', 'Length', 'Nos', 'Kg', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' },
    styles: { fontSize: 7, cellPadding: 2, lineWidth: 0.1, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 35, halign: 'left' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 20, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Footer Totals
  doc.setFont('helvetica', 'bold');
  const totalItemsAmount = order.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAmount = totalItemsAmount + (order.transportationCharges || 0) + (order.loadingUnloadingCharges || 0);
  doc.text('Total Amount:', pageWidth - 60, finalY + 8);
  doc.text(`Rs. ${totalAmount.toLocaleString()}`, pageWidth - 10, finalY + 8, { align: 'right' });

  // Signatures
  const footerY = pageHeight - 20;
  doc.line(10, footerY, 60, footerY);
  doc.line(pageWidth / 2 - 25, footerY, pageWidth / 2 + 25, footerY);
  doc.line(pageWidth - 60, footerY, pageWidth - 10, footerY);
  
  doc.text('Prepared By', 35, footerY + 5, { align: 'center' });
  doc.text('Checked By', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('Authorized Sign', pageWidth - 35, footerY + 5, { align: 'center' });

  doc.save(`SalesOrder_${sanitizeFilename(order.orderNo)}.pdf`);
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

