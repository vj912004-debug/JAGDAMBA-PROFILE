import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ListColumn } from '../components/ListView';
import type { QuotationRecord, CNCQuotationRecord } from '../store/AppContext';

export function cellText(v: React.ReactNode): string {
  if (v == null || v === false) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(cellText).join('');
  if (React.isValidElement(v)) {
    const props = v.props as { children?: React.ReactNode };
    if (props.children !== undefined) return cellText(props.children);
  }
  return '';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\-./]+/g, '_').replace(/_+/g, '_').slice(0, 80) || 'record';
}

function savePdf(doc: jsPDF, filename: string) {
  doc.save(`${sanitizeFilename(filename)}.pdf`);
}

const NAVY = [30, 58, 95] as [number, number, number];
const TABLE_OPTS = {
  theme: 'grid' as const,
  headStyles: { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
  styles: { fontSize: 9, cellPadding: 3 },
  margin: { left: 14, right: 14 },
};

function addPdfHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('JAGDAMBA PROFILE', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), pageWidth / 2, 28, { align: 'center' });
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, pageWidth / 2, 35, { align: 'center' });
  }
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - 14, 42, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

export function rowValues<T>(columns: ListColumn<T>[], row: T, idx: number): Record<string, string> {
  const out: Record<string, string> = {};
  columns.forEach(c => { out[c.header] = cellText(c.render(row, idx)); });
  return out;
}

/** Download a single list row as PDF */
export function downloadListRow<T>(opts: {
  title: string;
  columns: ListColumn<T>[];
  row: T;
  rowIndex: number;
  getLabel?: (row: T) => string;
}) {
  const { title, columns, row, rowIndex, getLabel } = opts;
  const data = rowValues(columns, row, rowIndex);
  const label = getLabel?.(row) ?? `${title}_${rowIndex + 1}`;

  const doc = new jsPDF();
  addPdfHeader(doc, title, label);

  autoTable(doc, {
    ...TABLE_OPTS,
    startY: 48,
    head: [['Field', 'Value']],
    body: Object.entries(data).map(([k, v]) => [k, v]),
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  savePdf(doc, label);
}

export function downloadPlainRow(
  title: string,
  data: Record<string, string | number>,
  filename?: string
) {
  const doc = new jsPDF();
  addPdfHeader(doc, title, filename);

  autoTable(doc, {
    ...TABLE_OPTS,
    startY: 48,
    head: [['Field', 'Value']],
    body: Object.entries(data).map(([k, v]) => [k, String(v)]),
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
  });

  savePdf(doc, filename ?? title);
}

export function downloadPlateQuotation(q: QuotationRecord) {
  const filename = sanitizeFilename(q.quoteNo || 'quotation');
  const doc = new jsPDF();
  addPdfHeader(doc, 'Plate Quotation', q.quoteNo);

  autoTable(doc, {
    ...TABLE_OPTS,
    startY: 48,
    head: [['Field', 'Value']],
    body: [
      ['Quotation No', q.quoteNo],
      ['Date', q.date],
      ['Valid Until', q.validUntil],
      ['Party', q.partyName],
      ['Contact', q.contactPerson || '-'],
      ['Mobile', q.mobileNo || '-'],
      ['Address', q.address || '-'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  const startY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 48) + 8;

  autoTable(doc, {
    ...TABLE_OPTS,
    startY,
    head: [['Sr', 'Shape', 'Grade', 'Thk', 'W', 'L', 'OD', 'ID', 'Nos', 'Wt', 'Rate', 'Amount']],
    body: q.items.map((it, i) => [
      i + 1,
      it.shape,
      it.grade,
      String(it.thickness),
      String(it.width),
      String(it.length),
      String(it.od || '-'),
      String(it.id_dim || '-'),
      String(it.nos),
      it.weight.toFixed(2),
      String(it.rate),
      it.amount.toFixed(2),
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
  });

  const finalY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sub Total: Rs. ${q.totalAmount.toLocaleString('en-IN')}`, 14, finalY);
  doc.text(`GST (${q.gstRate}%): Rs. ${((q.grandTotal - q.totalAmount)).toLocaleString('en-IN')}`, 14, finalY + 6);
  doc.text(`Grand Total: Rs. ${q.grandTotal.toLocaleString('en-IN')}`, 14, finalY + 12);

  savePdf(doc, filename);
}

export type MaterialPendingRow = {
  poNumber: string;
  poDate: string;
  supplier: string;
  grade: string;
  spec: string;
  orderedNos: number;
  receivedNos: number;
  pendingNos: number;
  pendingWeightKg: number;
  rate: number;
  pendingAmount: number;
  expectedDate: string;
};

export function downloadMaterialPendingReportPDF(
  rows: MaterialPendingRow[],
  totals: {
    orderedNos: number;
    receivedNos: number;
    pendingNos: number;
    pendingWeight: number;
    pendingAmount: number;
  }
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  addPdfHeader(doc, 'Pending Material Details', 'Purchase Order Pending Report');

  const head = [[
    'Sr', 'PO No', 'PO Date', 'Supplier', 'Item/Grade', 'Specification',
    'PO Nos', 'Received', 'Pending', 'Pending KG', 'Rate', 'Pending Amt', 'Expected',
  ]];

  const body = rows.map((r, i) => [
    i + 1,
    r.poNumber,
    r.poDate,
    r.supplier,
    r.grade,
    r.spec,
    String(r.orderedNos),
    String(r.receivedNos),
    String(r.pendingNos),
    r.pendingWeightKg.toFixed(2),
    r.rate.toFixed(2),
    r.pendingAmount.toFixed(2),
    r.expectedDate,
  ]);

  if (rows.length > 0) {
    body.push([
      '', '', '', '', '', 'Total',
      String(totals.orderedNos),
      String(totals.receivedNos),
      String(totals.pendingNos),
      totals.pendingWeight.toFixed(2),
      '',
      totals.pendingAmount.toFixed(2),
      '',
    ]);
  }

  autoTable(doc, {
    ...TABLE_OPTS,
    startY: 48,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { ...TABLE_OPTS.headStyles, fontSize: 7 },
  });

  savePdf(doc, `material_pending_report_${new Date().toISOString().split('T')[0]}`);
}

export function downloadCNCQuotation(q: CNCQuotationRecord) {
  const filename = sanitizeFilename(q.quoteNo || 'cnc_quotation');
  const doc = new jsPDF();
  addPdfHeader(doc, 'CNC Quotation 2', q.quoteNo);

  autoTable(doc, {
    ...TABLE_OPTS,
    startY: 48,
    head: [['Field', 'Value']],
    body: [
      ['Quotation No', q.quoteNo],
      ['Date', q.date],
      ['Party', q.partyName],
      ['Mobile', q.mobileNo || '-'],
    ],
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  const startY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 48) + 8;

  autoTable(doc, {
    ...TABLE_OPTS,
    startY,
    head: [['Sr', 'Shape', 'Drawing', 'Grade', 'Thk', 'W', 'L', 'Part Nos', 'Wt', 'Rate', 'Amount']],
    body: q.items.map((it, i) => [
      i + 1,
      it.shape,
      it.drawingNo || '-',
      it.grade,
      String(it.thickness),
      String(it.width),
      String(it.length),
      String(it.partOfNos),
      it.finishGoodWeight.toFixed(2),
      it.finalRate.toFixed(2),
      it.amount.toFixed(2),
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
  });

  const finalY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY) + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sub Total: Rs. ${q.totalAmount.toLocaleString('en-IN')}`, 14, finalY);
  doc.text(`GST (${q.gstRate}%): Rs. ${((q.grandTotal - q.totalAmount)).toLocaleString('en-IN')}`, 14, finalY + 6);
  doc.text(`Grand Total: Rs. ${q.grandTotal.toLocaleString('en-IN')}`, 14, finalY + 12);

  savePdf(doc, filename);
}

export function downloadCustomPendingMaterialPDF(
  rows: any[],
  totals: any,
  filters: any,
  dateStr: string,
  timeStr: string
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawPageElements = () => {
    doc.setDrawColor(10, 49, 97);
    doc.setLineWidth(1);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    doc.setLineWidth(0.3);
    doc.rect(9.5, 9.5, pageWidth - 19, pageHeight - 19);

    doc.setTextColor(10, 49, 97);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PENDING MATERIALS LIST', pageWidth / 2, 20, { align: 'center' });

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - 46, 12, 36, 12);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Date  :  ${dateStr}`, pageWidth - 44, 16);
    doc.text(`Time  :  ${timeStr}`, pageWidth - 44, 21);
  };

  let startY = 28;
  
  doc.setDrawColor(230, 81, 0);
  doc.setLineWidth(0.5);
  doc.rect(12, startY, pageWidth - 24, 16);
  
  const col1X = 16;
  const col2X = (pageWidth / 2) - 25;
  const col3X = pageWidth - 65;

  const fmtDate = (d: string) => {
    if (!d) return 'All Dates';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
  };

  doc.setTextColor(10, 49, 97);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTY NAME', col1X, startY + 6);
  doc.text(':', col1X + 25, startY + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.supplier || 'All Suppliers', col1X + 30, startY + 6);

  doc.setTextColor(10, 49, 97);
  doc.setFont('helvetica', 'bold');
  doc.text('PO DATE TO', col2X, startY + 6);
  doc.text(':', col2X + 22, startY + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(filters.toDate), col2X + 27, startY + 6);

  doc.setTextColor(10, 49, 97);
  doc.setFont('helvetica', 'bold');
  doc.text('GRADE', col3X, startY + 6);
  doc.text(':', col3X + 15, startY + 6);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.itemGrade || 'All Grades', col3X + 20, startY + 6);

  doc.setTextColor(10, 49, 97);
  doc.setFont('helvetica', 'bold');
  doc.text('PO DATE FROM', col1X, startY + 12);
  doc.text(':', col1X + 25, startY + 12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(filters.fromDate), col1X + 30, startY + 12);

  doc.setTextColor(10, 49, 97);
  doc.setFont('helvetica', 'bold');
  doc.text('PO NO.', col2X, startY + 12);
  doc.text(':', col2X + 22, startY + 12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.poNo || 'All PO', col2X + 27, startY + 12);

  doc.setTextColor(10, 49, 97);
  doc.setFont('helvetica', 'bold');
  doc.text('MAKE', col3X, startY + 12);
  doc.text(':', col3X + 15, startY + 12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(filters.make || 'All Makes', col3X + 20, startY + 12);

  startY += 20;

  const tableHead = [[
    'SR.', 'PARTY NAME', 'PO DATE', 'PO NO.', 'GRADE', 'SIZE', 'THICK\n(MM)', 'WIDTH\n(MM)', 'LENGTH\n(MM)', 'PENDING\nNOS', 'PENDING\nKG'
  ]];

  const tableBody = rows.map((r, i) => [
    i + 1,
    r.supplier,
    r.poDateFmt,
    r.poNumber,
    r.grade,
    r.sizeSection || '-',
    r.thickness || '-',
    r.width || '-',
    r.length || '-',
    r.pendingNos,
    Number(r.pendingKg).toLocaleString('en-IN', {minimumFractionDigits: 2})
  ]);

  autoTable(doc, {
    startY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    margin: { left: 12, right: 12, top: 48, bottom: 35 },
    styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0], lineColor: [160, 160, 160], lineWidth: 0.2, valign: 'middle' },
    headStyles: { fillColor: [230, 81, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', lineColor: [255, 255, 255], lineWidth: 0.2 },
    columnStyles: {
      0: { halign: 'center' },
      1: { fontStyle: 'bold', halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
      10: { halign: 'center' }
    },
    didDrawPage: drawPageElements
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  
  if (finalY > pageHeight - 45) {
    doc.addPage();
    drawPageElements();
    (doc as any).lastAutoTable.finalY = 32; 
  }
  
  const currentY = (doc as any).lastAutoTable.finalY > 32 ? (doc as any).lastAutoTable.finalY + 8 : 32;

  doc.setDrawColor(230, 81, 0);
  doc.setLineWidth(0.5);
  doc.rect(12, currentY, pageWidth - 24, 18);
  
  const boxWidth = (pageWidth - 24) / 6;
  for (let i = 1; i < 6; i++) {
    doc.line(12 + (boxWidth * i), currentY, 12 + (boxWidth * i), currentY + 18);
  }

  const summaries = [
    { label: "TOTAL PO'S", value: String(totals.totalPos) },
    { label: "TOTAL ITEMS", value: String(totals.totalItems) },
    { label: "TOTAL NOS", value: String(totals.totalNos) },
    { label: "TOTAL PENDING KG", value: totals.totalPendingWeight.toLocaleString('en-IN', {minimumFractionDigits: 2}) },
    { label: "TOTAL PENDING NOS", value: String(totals.totalPendingNos) },
    { label: "TOTAL PO WEIGHT (KG)", value: totals.totalPoWeight.toLocaleString('en-IN', {minimumFractionDigits: 2}) }
  ];

  doc.setTextColor(10, 49, 97);
  doc.setFontSize(8);
  summaries.forEach((s, i) => {
    const xCenter = 12 + (boxWidth * i) + (boxWidth / 2);
    doc.setFont('helvetica', 'bold');
    doc.text(s.label, xCenter, currentY + 6, { align: 'center' });
    doc.setFontSize(14);
    doc.text(s.value, xCenter, currentY + 14, { align: 'center' });
    doc.setFontSize(8);
  });

  const footerY = currentY + 25;
  doc.setTextColor(230, 81, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTE :', 12, footerY);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Pending Nos = PO Nos - Received Nos', 12, footerY + 6);
  doc.text('2. Pending Kg = PO Kg - Received Kg', 12, footerY + 11);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 75, footerY + 6, pageWidth - 12, footerY + 6);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorised Signatory', pageWidth - 43, footerY + 11, { align: 'center' });

  doc.save(`Pending_Material_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
