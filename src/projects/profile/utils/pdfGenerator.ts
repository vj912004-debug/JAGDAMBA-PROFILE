import { LOGO_PRINT_BASE64 } from './logoPrintBase64';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';
import type { Order, PurchaseOrder } from '../store/AppContext';

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
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      alert(`Error: Element ${elementId} not found`);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed;left:0;top:0;z-index:-9999;opacity:1;pointer-events:none;background:#fff;';
    const clone = element.cloneNode(true) as HTMLElement;
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${sanitizeFilename(filename)}.pdf`);
    } finally {
      document.body.removeChild(wrapper);
    }
  } catch (err: any) {
    console.error("PDF Generation Error:", err);
    alert("Error generating PDF: " + (err.message || String(err)));
  }
};

/**
 * Capture a DOM element and return PDF as base64 string
 */
export const getPdfBase64 = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

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
  return pdf.output('datauristring');
};


export { generateChallanPDF } from './challanDownload';


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

const formatPODate = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return dateStr;
};

const fmtPO = (n: number) => (n ? n.toLocaleString('en-IN') : '');

const PO_MARGIN = 7;
const PO_HEAD: [number, number, number] = [0, 0, 0];
const PO_ORANGE: [number, number, number] = [242, 101, 34];
const PO_BLUE: [number, number, number] = [10, 30, 74];

function buildPurchaseOrderPDFDoc(po: PurchaseOrder): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const inner = pw - PO_MARGIN * 2 - 4;
  const half = inner / 2;
  const third = inner / 3;

  doc.setDrawColor(0);
  doc.setLineWidth(0.6);
  doc.rect(PO_MARGIN, PO_MARGIN, pw - PO_MARGIN * 2, doc.internal.pageSize.getHeight() - PO_MARGIN * 2);

  try {
    doc.addImage(LOGO_PRINT_BASE64, 'JPEG', PO_MARGIN + 3, PO_MARGIN + 4, 20, 20);
  } catch { /* logo optional */ }

  const cx = pw / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...PO_BLUE);
  doc.text('Jagdamba Profile', cx, PO_MARGIN + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...PO_ORANGE);
  doc.text('504/1A, GIDC Makarpura, Vadodara -390010.', cx, PO_MARGIN + 21, { align: 'center' });
  doc.text('GST No: 24AJGPP9863R1Z5', cx, PO_MARGIN + 26, { align: 'center' });
  doc.text('Mo: 9824917250, 9824025001, 8799617254', cx, PO_MARGIN + 31, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.text('Email: jagdambaprofile@gmail.com', pw - PO_MARGIN - 3, PO_MARGIN + 31, { align: 'right' });

  let y = PO_MARGIN + 36;
  const ml = PO_MARGIN + 2;

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    body: [['PURCHASE ORDER']],
    theme: 'plain',
    styles: { fillColor: PO_HEAD, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 12, cellPadding: 3 },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    head: [['SUPPLIER DETAILS', 'PURCHASE ORDER DETAILS']],
    body: [
      [`Party Name: ${po.supplierName || ''}`, `PO No: ${po.poNumber || ''}`],
      [`Address: ${po.supplierAddress || ''}`, `PO Date: ${formatPODate(po.date)}`],
      [`GST Number: ${po.supplierGST || ''}`, `Payment Terms: ${po.paymentTerms || ''}`],
      [`Mobile Number: ${po.supplierMobile || ''}`, `Make: ${po.make || ''}`],
      [`Email ID: ${po.supplierEmail || ''}`, `UT Level: ${po.utLevel || ''}     TC: ${po.tc || ''}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: PO_HEAD, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: half }, 1: { cellWidth: half } },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    head: [['VEHICLE TRANSPORT DETAILS', '', '']],
    body: [[
      `Vehicle Number: ${po.transportNumber || ''}`,
      `Driver Mobile No: ${po.driverMobile || ''}`,
      `Transport Name: ${po.transportName || ''}`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: PO_HEAD, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: { 0: { cellWidth: third }, 1: { cellWidth: third }, 2: { cellWidth: third } },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const items = po.items || [];
  const itemBody: (string | { content: string; rowSpan?: number; colSpan?: number; styles?: Record<string, unknown> })[][] = items.map((item, idx) => [
    String(idx + 1),
    item.grade || '',
    item.thickness || '',
    item.width || '',
    item.length || '',
    String(item.nos || ''),
    item.kg ? fmtPO(item.kg) : '',
    item.rate ? fmtPO(item.rate) : '',
    item.amount ? fmtPO(item.amount) : '',
  ]);
  while (itemBody.length < 10) {
    itemBody.push(['', '', '', '', '', '', '', '', '']);
  }

  const basicAmount = po.totalAmount || 0;
  const gstAmount = Math.round(basicAmount * 0.18);
  const finalAmount = basicAmount + gstAmount;
  const totalKgLabel = po.totalKg ? `TOTAL KG\n${fmtPO(po.totalKg)}` : 'TOTAL KG';

  itemBody.push([
    { content: totalKgLabel, rowSpan: 3, colSpan: 7, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', minCellHeight: 24 } },
    { content: 'BASIC AMOUNT', styles: { fontStyle: 'bold' } },
    { content: basicAmount ? fmtPO(basicAmount) : '', styles: { halign: 'right' } },
  ] as (string | { content: string; rowSpan?: number; colSpan?: number; styles?: Record<string, unknown> })[]);
  itemBody.push([
    { content: 'GST @ 18%', styles: { fontStyle: 'bold' } },
    { content: gstAmount ? fmtPO(gstAmount) : '', styles: { halign: 'right' } },
  ]);
  itemBody.push([
    { content: 'FINAL AMOUNT', styles: { fontStyle: 'bold' } },
    { content: finalAmount ? fmtPO(finalAmount) : '', styles: { halign: 'right' } },
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    head: [['Sr No', 'Grade', 'Thickness', 'Width', 'Length', 'Nos', 'Kg', 'Rate', 'Amount']],
    body: itemBody,
    theme: 'grid',
    headStyles: { fillColor: PO_HEAD, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.1, minCellHeight: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    body: [['COMMERCIAL / QUALITY DETAILS'], [`Note: ${po.note || ''}`]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = PO_HEAD;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 1) {
        data.cell.styles.minCellHeight = 14;
      }
    },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  const terms =
    '1. Material should be supplied strictly as per above size, grade and specification.\n' +
    '2. Test Certificate / MTC report wherever applicable.\n' +
    '3. Material should be free from heavy rust, lamination, oil, paint and major surface defects.\n' +
    '4. Final weight, rate and payment will be as per mutually agreed terms.\n' +
    '5. Delivery schedule and transport details must be confirmed before dispatch.';

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    body: [['GENERAL TERMS AND CONDITIONS'], [terms]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.1 },
    didParseCell: (data) => {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = PO_HEAD;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.row.index === 1) {
        data.cell.styles.minCellHeight = 28;
      }
    },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    margin: { left: ml, right: ml },
    body: [['Prepared By', 'Checked By', 'For Jagdamba Profile\n\nAuthorized Signatory']],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4, minCellHeight: 22, halign: 'center', valign: 'top', fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: third },
      1: { cellWidth: third },
      2: { cellWidth: third, textColor: PO_BLUE },
    },
  });

  return doc;
}

/** Download Purchase Order PDF matching official PO format */
export const generatePurchaseOrderPDF = (po: PurchaseOrder) => {
  const doc = buildPurchaseOrderPDFDoc(po);
  doc.save(`${sanitizeFilename(po.poNumber.replace(/\//g, '-'))}.pdf`);
};

/** Base64 PDF for WhatsApp / email attachments */
export const getPurchaseOrderPdfBase64 = (po: PurchaseOrder): string => {
  const doc = buildPurchaseOrderPDFDoc(po);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1] ?? '';
};


