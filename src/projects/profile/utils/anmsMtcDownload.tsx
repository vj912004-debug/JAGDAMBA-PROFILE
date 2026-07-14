import { createRoot } from 'react-dom/client';
import { AnmsMtcPrint } from '../components/AnmsMtcPrint';
import { ANMS_MTC_PRINT_AREA_ID } from '../components/anmsMtcPrintStyles';
import type { AnmsMtcRecord } from './anmsMtcHelpers';
import { ANMS_MTC_WIDTH_PX, downloadAnmsMtcLandscapePdf, hiddenPrintHostStyle } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

async function waitForMtcRender() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  try {
    await Promise.race([
      document.fonts.ready,
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 300));
}

async function renderOffScreen(data: AnmsMtcRecord) {
  const host = document.createElement('div');
  host.style.cssText = hiddenPrintHostStyle(ANMS_MTC_WIDTH_PX, undefined, 'visible');
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<AnmsMtcPrint data={data} />);
  await waitForMtcRender();

  const printArea = document.getElementById(ANMS_MTC_PRINT_AREA_ID);
  if (!printArea) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error('MTC print area not found');
  }

  return {
    printArea,
    cleanup: () => {
      root.unmount();
      document.body.removeChild(host);
    },
  };
}

function mtcFilename(data: AnmsMtcRecord) {
  const heat = data.heatAnalysis.find(h => h.heatNo.trim())?.heatNo || 'MTC';
  const tc = data.testCertificateNo.trim() || data.id || 'Draft';
  return sanitizeFilename(`MTC_${tc}_${heat}`);
}

export async function downloadAnmsMtcPdf(data: AnmsMtcRecord) {
  const existing = document.getElementById(ANMS_MTC_PRINT_AREA_ID);
  if (existing) {
    await downloadAnmsMtcLandscapePdf(existing, mtcFilename(data));
    return;
  }

  const { printArea, cleanup } = await renderOffScreen(data);
  try {
    await downloadAnmsMtcLandscapePdf(printArea, mtcFilename(data));
  } finally {
    cleanup();
  }
}
