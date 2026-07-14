import { createRoot } from 'react-dom/client';

import type { PurchaseOrder } from '../store/AppContext';

import {

  PurchaseOrderPrint,

  PO_PRINT_AREA_ID,

  type PurchaseOrderPrintExtras,

  type PoCompanyBrand,

} from '../components/PurchaseOrderPrint';

import {
  downloadPoOnePagePdf,
  getPoOnePagePdfBase64,
  hiddenPrintHostStyle,
} from './pdfGenerator';

import { PO_PRINT_WIDTH_PX, PO_PRINT_HEIGHT_PX, PO_PDF_CAPTURE_ID, PO_FONT_LINK } from '../components/purchaseOrderPrintStyles';
import { PO_SHREE_FONT_LINK } from '../components/shreePurchaseOrderPrintStyles';

import { poDownloadName } from './poNumber';
import { fitPoSheetBodyWhenReady } from './fitPoPrintLayout';
import { promptPoBrandChoice } from './purchaseOrderBrandPicker';

export type { PoCompanyBrand } from '../components/purchaseOrderPrintData';
export type { PurchaseOrderPrintExtras } from '../components/PurchaseOrderPrint';

function poPdfBasename(poNumber: string, brand: PoCompanyBrand) {
  const base = poDownloadName(poNumber);
  return brand === 'shree' ? `${base}_Shree` : base;
}

async function waitForPoRender(host: HTMLElement, brand: PoCompanyBrand = 'jagdamba') {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 4000)),
    ]);
    if (brand === 'shree') {
      await Promise.all([
        document.fonts.load('600 28px Oswald'),
        document.fonts.load('500 11px Roboto'),
        document.fonts.load('700 11px Roboto'),
      ]);
    } else {
      await Promise.all([
        document.fonts.load('900 36px Poppins'),
        document.fonts.load('800 17px Poppins'),
        document.fonts.load('600 10.5px Poppins'),
      ]);
    }
  } catch {
    /* ignore */
  }

  await new Promise((r) => setTimeout(r, 200));
}

function ensurePoAssetLinks(host: HTMLElement, brand: PoCompanyBrand = 'jagdamba') {
  const href = brand === 'shree' ? PO_SHREE_FONT_LINK : PO_FONT_LINK;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  host.appendChild(link);
}

async function renderPOForPdf(
  po?: PurchaseOrder,
  extras?: PurchaseOrderPrintExtras,
  blank = false,
  brand: PoCompanyBrand = 'jagdamba',
) {
  const host = document.createElement('div');
  host.style.cssText = hiddenPrintHostStyle(PO_PRINT_WIDTH_PX, PO_PRINT_HEIGHT_PX, 'hidden');
  ensurePoAssetLinks(host, brand);

  document.body.appendChild(host);

  const root = createRoot(host);

  root.render(
    blank
      ? <PurchaseOrderPrint blank printAreaId={PO_PDF_CAPTURE_ID} brand={brand} />
      : <PurchaseOrderPrint po={po!} extras={extras} printAreaId={PO_PDF_CAPTURE_ID} brand={brand} />,
  );

  await waitForPoRender(host, brand);

  const printArea = host.querySelector(`#${PO_PDF_CAPTURE_ID}`) as HTMLElement | null;
  if (!printArea) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error('PO print area not found');
  }

  await new Promise((r) => setTimeout(r, 100));

  const page = printArea.querySelector('.po-sheet, .page-container') as HTMLElement | null;
  await fitPoSheetBodyWhenReady(page);
  if (page) void page.offsetHeight;

  return {
    printArea,
    cleanup: () => {
      root.unmount();
      document.body.removeChild(host);
    },
  };
}

/** Download Purchase Order PDF — single A4 page, full layout */
export async function generatePurchaseOrderPDF(
  po: PurchaseOrder,
  extras?: PurchaseOrderPrintExtras,
  brand: PoCompanyBrand = 'jagdamba',
) {
  const { printArea, cleanup } = await renderPOForPdf(po, extras, false, brand);
  try {
    await downloadPoOnePagePdf(printArea, poPdfBasename(po.poNumber, brand));
  } finally {
    cleanup();
  }
}

/** Prompt for PO brand, then download. Returns false if cancelled. */
export async function downloadPurchaseOrderPDF(
  po: PurchaseOrder,
  extras?: PurchaseOrderPrintExtras,
): Promise<boolean> {
  const brand = await promptPoBrandChoice('Which format would you like to download?');
  if (!brand) return false;
  await generatePurchaseOrderPDF(po, extras, brand);
  return true;
}

/** Download blank PO template PDF */
export async function generateBlankPurchaseOrderPDF(brand: PoCompanyBrand = 'jagdamba') {
  const { printArea, cleanup } = await renderPOForPdf(undefined, undefined, true, brand);
  const fileLabel = brand === 'shree' ? 'Shree_Jagdamba_Steel_Profile_PO_Blank' : 'Jagdamba_Profile_PO_Blank';
  try {
    await downloadPoOnePagePdf(printArea, fileLabel);
  } finally {
    cleanup();
  }
}

/** Base64 PDF for WhatsApp / email attachments */
export async function getPurchaseOrderPdfBase64(
  po: PurchaseOrder,
  extras?: PurchaseOrderPrintExtras,
): Promise<string | null> {
  const { printArea, cleanup } = await renderPOForPdf(po, extras);
  try {
    const dataUri = await getPoOnePagePdfBase64(printArea);
    if (!dataUri) return null;
    return dataUri.split(',')[1] ?? null;
  } finally {
    cleanup();
  }
}

