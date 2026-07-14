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

/** A4 at 96dpi — html2canvas resolves mm inconsistently; px is reliable. */
export const A4_WIDTH_PX = Math.round((210 * 96) / 25.4);
export const A4_HEIGHT_PX = Math.round((297 * 96) / 25.4);
/** AM/NS MTC template — A4 landscape content area (285 × 198 mm). */
export const ANMS_MTC_WIDTH_PX = Math.round((285 * 96) / 25.4);
export const ANMS_MTC_HEIGHT_PX = Math.round((198 * 96) / 25.4);

export type A4PdfFitMode = 'fit-page' | 'fit-width';

/** Keep capture hosts off-screen — visible hosts flash over the UI during PDF download. */
export function hiddenPrintHostStyle(widthPx: number, heightPx?: number, overflow: 'hidden' | 'visible' = 'hidden'): string {
  return [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${widthPx}px`,
    heightPx ? `height:${heightPx}px` : 'height:auto',
    `overflow:${overflow}`,
    'opacity:1',
    'pointer-events:none',
    'z-index:-1',
    'background:#fff',
  ].join(';');
}

function pinPoCaptureSize(root: HTMLElement, page: HTMLElement | null, widthPx: number) {
  root.style.width = `${widthPx}px`;
  root.style.maxWidth = `${widthPx}px`;
  root.style.minWidth = `${widthPx}px`;
  root.style.margin = '0';
  root.style.padding = '0';
  root.style.overflow = 'visible';
  root.style.transform = 'none';
  if (page) {
    page.style.width = `${widthPx}px`;
    page.style.maxWidth = `${widthPx}px`;
    page.style.minWidth = `${widthPx}px`;
    page.style.margin = '0';
    page.style.overflow = 'visible';
    page.style.height = 'auto';
    page.style.minHeight = '0';
    page.style.maxHeight = 'none';
    page.style.transform = 'none';
    page.style.transformOrigin = 'top left';
    page.style.boxSizing = 'border-box';
  }
}

function mountPrintClone(element: HTMLElement, widthPx = A4_WIDTH_PX): { wrapper: HTMLDivElement; clone: HTMLElement } {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = hiddenPrintHostStyle(widthPx, undefined, 'visible');
  const clone = element.cloneNode(true) as HTMLElement;
  const page = clone.querySelector('.page-container, .po-page') as HTMLElement | null;
  pinPoCaptureSize(clone, page, widthPx);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  return { wrapper, clone };
}

async function waitForPrintFonts(timeoutMs = 2500): Promise<void> {
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    /* ignore */
  }
  await new Promise((resolve) => setTimeout(resolve, 150));
}

function resolveCaptureTarget(clone: HTMLElement): HTMLElement {
  return clone;
}

async function capturePrintCanvas(clone: HTMLElement, widthPx = A4_WIDTH_PX) {
  await waitForPrintFonts();
  const target = resolveCaptureTarget(clone);
  const page = clone.querySelector('.page-container, .po-page') as HTMLElement | null;
  pinPoCaptureSize(clone, page, widthPx);

  clone.style.overflow = 'visible';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';

  if (page) {
    page.style.overflow = 'visible';
    page.style.height = 'auto';
    page.style.minHeight = '0';
    page.style.maxHeight = 'none';
    page.style.boxSizing = 'border-box';
  }

  const content = clone.querySelector('.content-wrapper, .po-content') as HTMLElement | null;
  if (content) {
    content.style.overflow = 'visible';
    content.style.height = 'auto';
  }

  const width = Math.max(target.scrollWidth, target.offsetWidth, widthPx);
  const height = target.scrollHeight;
  return html2canvas(target, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width,
    windowWidth: width,
    height,
    windowHeight: height,
  });
}

import { fitPoSheetBody } from './fitPoPrintLayout';

function fitPoBodyToSheet(page: HTMLElement): void {
  fitPoSheetBody(page);
}

function preparePoPdfCapture(root: HTMLElement, widthPx: number): HTMLElement {
  root.style.width = `${widthPx}px`;
  root.style.minWidth = `${widthPx}px`;
  root.style.maxWidth = `${widthPx}px`;
  root.style.height = `${A4_HEIGHT_PX}px`;
  root.style.minHeight = `${A4_HEIGHT_PX}px`;
  root.style.maxHeight = `${A4_HEIGHT_PX}px`;
  root.style.margin = '0';
  root.style.padding = '0';
  root.style.overflow = 'hidden';
  root.style.background = '#ffffff';
  root.style.boxSizing = 'border-box';

  const page = root.querySelector('.po-sheet, .page-container, .po-page') as HTMLElement | null;
  if (page) {
    page.style.boxSizing = 'border-box';
    page.style.overflow = 'hidden';
    page.style.boxShadow = 'none';
    fitPoBodyToSheet(page);
  }

  void root.offsetHeight;
  return root;
}

/** Capture PO at exact A4 dimensions — matches official HTML template. */
export async function capturePoOnePageA4(element: HTMLElement, widthPx = A4_WIDTH_PX): Promise<HTMLCanvasElement> {
  await waitForPrintFonts();
  const page = preparePoPdfCapture(element, widthPx);

  return html2canvas(page, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: widthPx,
    windowWidth: widthPx,
    height: A4_HEIGHT_PX,
    windowHeight: A4_HEIGHT_PX,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    imageTimeout: 15000,
    onclone: (doc) => {
      const area = (doc.getElementById(element.id) || doc.querySelector('[id$="pdf-capture-area"], #po-pdf-capture-area')) as HTMLElement | null;
      if (area) {
        area.style.width = `${widthPx}px`;
        area.style.height = `${A4_HEIGHT_PX}px`;
        area.style.overflow = 'hidden';
        area.style.background = '#ffffff';
        area.style.boxSizing = 'border-box';
      }
      const clonedPage = area?.querySelector('.po-sheet, .page-container, .po-page') as HTMLElement | null;
      if (clonedPage) {
        clonedPage.style.overflow = 'hidden';
        clonedPage.style.boxSizing = 'border-box';
        clonedPage.style.boxShadow = 'none';
        fitPoBodyToSheet(clonedPage);
      }
      doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        if (node instanceof HTMLElement) {
          node.setAttribute('media', 'all');
        }
      });
    },
  });
}

function canvasToPoOnePageA4Pdf(canvas: HTMLCanvasElement): jsPDF {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL('image/png');

  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
  return pdf;
}

export async function downloadPoOnePagePdf(element: HTMLElement, filename: string) {
  const canvas = await capturePoOnePageA4(element);
  canvasToPoOnePageA4Pdf(canvas).save(`${sanitizeFilename(filename)}.pdf`);
}

export async function getPoOnePagePdfBase64(element: HTMLElement): Promise<string | null> {
  try {
    const canvas = await capturePoOnePageA4(element);
    return canvasToPoOnePageA4Pdf(canvas).output('datauristring');
  } catch (err: unknown) {
    console.error('PO PDF base64 generation error:', err);
    return null;
  }
}

function pinAnmsMtcCaptureSize(root: HTMLElement, page: HTMLElement | null, widthPx: number, heightPx: number) {
  root.style.width = `${widthPx}px`;
  root.style.maxWidth = `${widthPx}px`;
  root.style.minWidth = `${widthPx}px`;
  root.style.margin = '0';
  root.style.padding = '0';
  root.style.overflow = 'visible';
  root.style.background = '#fff';
  if (page) {
    page.style.width = `${widthPx}px`;
    page.style.maxWidth = `${widthPx}px`;
    page.style.minWidth = `${widthPx}px`;
    page.style.minHeight = `${heightPx}px`;
    page.style.height = 'auto';
    page.style.margin = '0';
    page.style.boxShadow = 'none';
    page.style.boxSizing = 'border-box';
  }
}

/** Capture AM/NS Mill Test Certificate at landscape template size. */
export async function captureAnmsMtcLandscape(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { wrapper, clone } = mountPrintClone(element, ANMS_MTC_WIDTH_PX);
  const page = clone.querySelector('.page') as HTMLElement | null;
  pinAnmsMtcCaptureSize(clone, page, ANMS_MTC_WIDTH_PX, ANMS_MTC_HEIGHT_PX);
  try {
    await waitForPrintFonts();
    const target = page ?? clone;
    const width = Math.max(target.scrollWidth, target.offsetWidth, ANMS_MTC_WIDTH_PX);
    const height = Math.max(target.scrollHeight, ANMS_MTC_HEIGHT_PX);
    return html2canvas(target, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width,
      windowWidth: width,
      height,
      windowHeight: height,
    });
  } finally {
    document.body.removeChild(wrapper);
  }
}

function canvasToLandscapeA4Pdf(canvas: HTMLCanvasElement): jsPDF {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgData = canvas.toDataURL('image/png');
  const naturalHeight = (canvas.height * pageWidth) / canvas.width;
  const scale = Math.min(1, pageHeight / naturalHeight);
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth * scale, naturalHeight * scale);
  return pdf;
}

export async function downloadAnmsMtcLandscapePdf(element: HTMLElement, filename: string) {
  const canvas = await captureAnmsMtcLandscape(element);
  canvasToLandscapeA4Pdf(canvas).save(`${sanitizeFilename(filename)}.pdf`);
}

export async function getAnmsMtcLandscapePdfBase64(element: HTMLElement): Promise<string | null> {
  try {
    const canvas = await captureAnmsMtcLandscape(element);
    return canvasToLandscapeA4Pdf(canvas).output('datauristring');
  } catch (err: unknown) {
    console.error('ANMS MTC PDF base64 generation error:', err);
    return null;
  }
}

/** Scale content to fit one A4 page at full width, then capture full height. */
async function capturePrintCanvasOnePageA4(clone: HTMLElement, widthPx = A4_WIDTH_PX): Promise<HTMLCanvasElement> {
  return capturePoOnePageA4(clone, widthPx);
}

/** Fit entire canvas on one page (may shrink width when content is tall). */
function canvasToFitPagePdf(canvas: HTMLCanvasElement): jsPDF {
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const naturalHeight = (canvas.height * pageWidth) / canvas.width;
  const scale = Math.min(1, pageHeight / naturalHeight);
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth * scale, naturalHeight * scale);
  return pdf;
}

/** Full A4 width; extra height continues on following pages. */
function canvasToFullWidthA4Pdf(canvas: HTMLCanvasElement): jsPDF {
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
}

function canvasToA4Pdf(canvas: HTMLCanvasElement, fit: A4PdfFitMode): jsPDF {
  return fit === 'fit-width' ? canvasToFullWidthA4Pdf(canvas) : canvasToFitPagePdf(canvas);
}

/**
 * Capture a DOM element and fit it on a single A4 page (no page split).
 * Tall content is scaled down — width may shrink. Use downloadFullWidthA4PDF for PO-style docs.
 */
export const downloadSinglePagePDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      alert(`Error: Element ${elementId} not found`);
      return;
    }

    const { wrapper, clone } = mountPrintClone(element);
    try {
      const canvas = await capturePrintCanvas(clone);
      canvasToA4Pdf(canvas, 'fit-page').save(`${sanitizeFilename(filename)}.pdf`);
    } finally {
      document.body.removeChild(wrapper);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('PDF Generation Error:', err);
    alert('Error generating PDF: ' + message);
  }
};

/**
 * Capture at full A4 width; scale down uniformly to fit exactly one page (no page split).
 */
export const downloadOnePageA4PDFFromElement = async (element: HTMLElement, filename: string) => {
  if (element.querySelector('.page-container, .po-page')) {
    await downloadPoOnePagePdf(element, filename);
    return;
  }
  const { wrapper, clone } = mountPrintClone(element);
  try {
    const canvas = await capturePrintCanvasOnePageA4(clone);
    canvasToPoOnePageA4Pdf(canvas).save(`${sanitizeFilename(filename)}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const getOnePageA4PdfBase64FromElement = async (element: HTMLElement): Promise<string | null> => {
  if (element.querySelector('.page-container, .po-page')) {
    return getPoOnePagePdfBase64(element);
  }
  const { wrapper, clone } = mountPrintClone(element);
  try {
    const canvas = await capturePrintCanvasOnePageA4(clone);
    return canvasToPoOnePageA4Pdf(canvas).output('datauristring');
  } catch (err: unknown) {
    console.error('PDF base64 generation error:', err);
    return null;
  } finally {
    document.body.removeChild(wrapper);
  }
};

/**
 * Capture a DOM element at full A4 width (210mm). Tall content spans multiple pages.
 */
export const downloadFullWidthA4PDFFromElement = async (element: HTMLElement, filename: string) => {
  const { wrapper, clone } = mountPrintClone(element);
  try {
    const canvas = await capturePrintCanvas(clone);
    canvasToA4Pdf(canvas, 'fit-width').save(`${sanitizeFilename(filename)}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
};

/**
 * Capture a DOM element at full A4 width (210mm). Tall content spans multiple pages.
 */
export const downloadFullWidthA4PDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      alert(`Error: Element ${elementId} not found`);
      return;
    }
    await downloadFullWidthA4PDFFromElement(element, filename);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('PDF Generation Error:', err);
    alert('Error generating PDF: ' + message);
  }
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

      const page = clone.querySelector('.page-container, .po-page') as HTMLElement | null;
      if (page) {
        page.style.overflow = 'visible';
        page.style.height = 'auto';
        page.style.minHeight = '0';
        page.style.maxHeight = 'none';
        page.style.boxSizing = 'border-box';
      }
      const content = clone.querySelector('.content-wrapper, .po-content') as HTMLElement | null;
      if (content) {
        content.style.overflow = 'visible';
        content.style.height = 'auto';
      }

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
 * Capture a DOM element (via visible clone) and return single-page PDF as data URI.
 * Uses the same clone approach as downloadSinglePagePDF so hidden/print-only elements work.
 */
export const getSinglePagePdfBase64 = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const { wrapper, clone } = mountPrintClone(element);
  try {
    const canvas = await capturePrintCanvas(clone);
    return canvasToA4Pdf(canvas, 'fit-page').output('datauristring');
  } catch (err: unknown) {
    console.error('PDF base64 generation error:', err);
    return null;
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const getFullWidthA4PdfBase64FromElement = async (element: HTMLElement): Promise<string | null> => {
  const { wrapper, clone } = mountPrintClone(element);
  try {
    const canvas = await capturePrintCanvas(clone);
    return canvasToA4Pdf(canvas, 'fit-width').output('datauristring');
  } catch (err: unknown) {
    console.error('PDF base64 generation error:', err);
    return null;
  } finally {
    document.body.removeChild(wrapper);
  }
};

export const getFullWidthA4PdfBase64 = async (elementId: string): Promise<string | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;
  return getFullWidthA4PdfBase64FromElement(element);
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

export {
  generatePurchaseOrderPDF,
  generateBlankPurchaseOrderPDF,
  downloadPurchaseOrderPDF,
  getPurchaseOrderPdfBase64,
} from './purchaseOrderDownload';

