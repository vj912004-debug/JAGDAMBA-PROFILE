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
  addPdfHeader(doc, 'Pending Material Details', 'Material Pending Report');

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
  addPdfHeader(doc, 'CNC Quotation', q.quoteNo);

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
