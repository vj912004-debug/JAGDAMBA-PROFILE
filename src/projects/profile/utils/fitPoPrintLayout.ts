import { PO_BODY_FIT_SCALE } from '../components/purchaseOrderPrintStyles';

/** Scale PO body to fit inside the sheet without clipping rows or footer. */
export function fitPoSheetBody(sheet: HTMLElement, maxScale = PO_BODY_FIT_SCALE): void {
  const wrap = sheet.querySelector('.po-body-wrap') as HTMLElement | null;
  const body = sheet.querySelector('.po-body') as HTMLElement | null;
  if (!wrap || !body) return;

  body.style.transform = '';
  body.style.width = '';
  body.style.marginLeft = '';
  wrap.style.height = '';

  const wrapStyles = getComputedStyle(wrap);
  const padY = parseFloat(wrapStyles.paddingTop) + parseFloat(wrapStyles.paddingBottom);
  const available = wrap.clientHeight - padY;
  const needed = body.scrollHeight;
  if (available <= 0 || needed <= 0) return;

  // Always shrink enough so every item row stays visible on one A4 page
  const scale = Math.min(maxScale, available / needed);

  body.style.transform = `scale(${scale})`;
  body.style.transformOrigin = 'top center';
  body.style.width = `${100 / scale}%`;
  body.style.marginLeft = `${(100 - 100 / scale) / 2}%`;
  wrap.style.height = `${Math.ceil(needed * scale) + padY}px`;
}

export async function fitPoSheetBodyWhenReady(sheet: HTMLElement | null | undefined): Promise<void> {
  if (!sheet) return;
  fitPoSheetBody(sheet);
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    /* ignore */
  }
  fitPoSheetBody(sheet);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  fitPoSheetBody(sheet);
}
