import { createRoot } from 'react-dom/client';
import { CNCRateCalculationPrint, CNC_RATE_CALC_PRINT_AREA_ID, type CNCRateCalcPrintData } from '../components/CNCRateCalculationPrint';
import { downloadSinglePagePDF, getSinglePagePdfBase64 } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

export async function generateCNCRateCalculationPDF(data: CNCRateCalcPrintData) {
  const existing = document.getElementById(CNC_RATE_CALC_PRINT_AREA_ID);
  if (existing) {
    await downloadSinglePagePDF(CNC_RATE_CALC_PRINT_AREA_ID, `CNC_Rate_${sanitizeFilename(data.inquiryNo)}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<CNCRateCalculationPrint data={data} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    await downloadSinglePagePDF(CNC_RATE_CALC_PRINT_AREA_ID, `CNC_Rate_${sanitizeFilename(data.inquiryNo)}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}

async function capturePrintAreaBase64(): Promise<string | null> {
  const dataUri = await getSinglePagePdfBase64(CNC_RATE_CALC_PRINT_AREA_ID);
  if (!dataUri) return null;
  return dataUri.split(',')[1] ?? null;
}

/** Base64 PDF for WhatsApp / email attachments */
export async function getCNCRateCalculationPdfBase64(data: CNCRateCalcPrintData): Promise<string | null> {
  const existing = document.getElementById(CNC_RATE_CALC_PRINT_AREA_ID);
  if (existing) {
    return capturePrintAreaBase64();
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<CNCRateCalculationPrint data={data} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    return capturePrintAreaBase64();
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
