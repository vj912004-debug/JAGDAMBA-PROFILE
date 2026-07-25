import { PO_PRINT_AREA_ID, PO_PRINT_STYLES, PO_FONT_LINK, PO_FA_LINK } from '../components/purchaseOrderPrintStyles';
import { PO_SHREE_FONT_LINK, shreePoStylesFor } from '../components/shreePurchaseOrderPrintStyles';
import type { PoCompanyBrand } from '../components/purchaseOrderPrintData';
import { fitPoSheetBodyWhenReady } from './fitPoPrintLayout';

function poStylesForArea(areaId: string, brand: PoCompanyBrand = 'jagdamba') {
  if (brand === 'shree') return shreePoStylesFor(areaId);
  return areaId === PO_PRINT_AREA_ID
    ? PO_PRINT_STYLES
    : PO_PRINT_STYLES.replace(new RegExp(`#${PO_PRINT_AREA_ID}`, 'g'), `#${areaId}`);
}

/** Open PO in a dedicated window sized for full A4 print (zero page margins). */
export function openPurchaseOrderPrintWindow(
  docTitle: string,
  printAreaId = PO_PRINT_AREA_ID,
  brand: PoCompanyBrand = 'jagdamba',
): boolean {
  const el = document.getElementById(printAreaId);
  if (!el) return false;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return false;

  const fontLink = brand === 'shree' ? PO_SHREE_FONT_LINK : PO_FONT_LINK;

  // IMPORTANT: wrap cloned content in #printAreaId so CSS selectors match.
  // el.innerHTML alone omits the id wrapper and all #po-print-area rules fail.
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${docTitle}</title>
    <link href="${fontLink}" rel="stylesheet" />
    <link rel="stylesheet" href="${PO_FA_LINK}" />
    <style>
      html, body { margin: 0; padding: 0; background: #fff; }
      @page { size: A4; margin: 0; }
      ${poStylesForArea(printAreaId, brand)}
    </style>
  </head>
  <body>
    <div id="${printAreaId}">${el.innerHTML}</div>
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  void (async () => {
    // Clear any stale inline fit styles copied from the on-screen preview
    const sheet = printWindow.document.querySelector('.po-sheet, .page-container') as HTMLElement | null;
    const body = printWindow.document.querySelector('.po-body') as HTMLElement | null;
    const wrap = printWindow.document.querySelector('.po-body-wrap') as HTMLElement | null;
    if (body) {
      body.style.transform = '';
      body.style.width = '';
      body.style.marginLeft = '';
    }
    if (wrap) {
      wrap.style.height = '';
      wrap.style.overflow = '';
    }
    if (sheet) {
      sheet.style.height = '';
      sheet.style.maxHeight = '';
      sheet.style.overflow = '';
    }
    await fitPoSheetBodyWhenReady(sheet);
    printWindow.print();
    printWindow.close();
  })();
  return true;
}
