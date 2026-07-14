import { createRoot } from 'react-dom/client';
import {
  JobWorkOutwardPrint,
  JOB_WORK_OUTWARD_PRINT_AREA_ID,
} from '../components/JobWorkOutwardPrint';
import type { JobWorkOutwardRecord } from './jobWorkHelpers';
import { downloadSinglePagePDF, getPdfBase64 } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

async function renderOffScreen(record: JobWorkOutwardRecord, userName?: string) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;width:210mm;';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<JobWorkOutwardPrint record={record} userName={userName} />);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));

  const printArea = document.getElementById(JOB_WORK_OUTWARD_PRINT_AREA_ID);
  if (!printArea) {
    root.unmount();
    document.body.removeChild(host);
    throw new Error('Job Work Outward print area not found');
  }

  return {
    cleanup: () => {
      root.unmount();
      document.body.removeChild(host);
    },
  };
}

export async function generateJobWorkOutwardPDF(
  record: JobWorkOutwardRecord,
  userName?: string,
) {
  const filename = `JobWork_Outward_${sanitizeFilename(record.outwardNo)}`;
  const existing = document.getElementById(JOB_WORK_OUTWARD_PRINT_AREA_ID);
  if (existing) {
    await downloadSinglePagePDF(JOB_WORK_OUTWARD_PRINT_AREA_ID, filename);
    return;
  }

  const { cleanup } = await renderOffScreen(record, userName);
  try {
    await downloadSinglePagePDF(JOB_WORK_OUTWARD_PRINT_AREA_ID, filename);
  } finally {
    cleanup();
  }
}

export async function getJobWorkOutwardPdfBase64(
  record: JobWorkOutwardRecord,
  userName?: string,
): Promise<string | null> {
  const existing = document.getElementById(JOB_WORK_OUTWARD_PRINT_AREA_ID);
  let cleanup: (() => void) | null = null;

  if (!existing) {
    ({ cleanup } = await renderOffScreen(record, userName));
  }

  try {
    const dataUri = await getPdfBase64(JOB_WORK_OUTWARD_PRINT_AREA_ID);
    if (!dataUri) return null;
    return dataUri.split(',')[1] ?? null;
  } finally {
    cleanup?.();
  }
}
