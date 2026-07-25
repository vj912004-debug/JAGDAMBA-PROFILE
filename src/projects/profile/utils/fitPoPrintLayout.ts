import { PO_BODY_FIT_SCALE } from '../components/purchaseOrderPrintStyles';

/** Never shrink below this — microscopic scale makes item rows look "missing". */
const MIN_READABLE_SCALE = 0.72;

/** Scale PO body to fit inside the sheet without clipping rows or footer. */
export function fitPoSheetBody(sheet: HTMLElement, maxScale = PO_BODY_FIT_SCALE): void {
  const wrap = sheet.querySelector('.po-body-wrap') as HTMLElement | null;
  const body = sheet.querySelector('.po-body') as HTMLElement | null;
  if (!wrap || !body) return;

  body.style.transform = '';
  body.style.width = '';
  body.style.marginLeft = '';
  wrap.style.height = '';
  wrap.style.overflow = '';

  const wrapStyles = getComputedStyle(wrap);
  const padY = parseFloat(wrapStyles.paddingTop) + parseFloat(wrapStyles.paddingBottom);
  const available = wrap.clientHeight - padY;
  const needed = body.scrollHeight;
  if (available <= 1 || needed <= 0) return;

  let scale = Math.min(maxScale, available / needed);

  // If fit would crush the document, keep it readable and allow scroll/overflow
  // instead of making item rows vanish into white space.
  if (scale < MIN_READABLE_SCALE) {
    scale = Math.min(maxScale, 1);
    body.style.transform = '';
    body.style.width = '';
    body.style.marginLeft = '';
    wrap.style.height = '';
    wrap.style.overflow = 'visible';
    sheet.style.overflow = 'visible';
    sheet.style.height = 'auto';
    sheet.style.maxHeight = 'none';
    sheet.style.minHeight = '0';
    const root = sheet.closest('[id]') as HTMLElement | null;
    if (root && root !== sheet) {
      root.style.height = 'auto';
      root.style.maxHeight = 'none';
      root.style.overflow = 'visible';
    }
    return;
  }

  body.style.transform = `scale(${scale})`;
  body.style.transformOrigin = 'top center';
  body.style.width = `${100 / scale}%`;
  body.style.marginLeft = `${(100 - 100 / scale) / 2}%`;
  wrap.style.height = `${Math.ceil(needed * scale) + padY}px`;
  wrap.style.overflow = 'hidden';
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
