import { createRoot } from 'react-dom/client';
import { RingQuotationPrint, RING_QUOTATION_PRINT_AREA_ID, type RingQuotationPrintData } from '../components/RingQuotationPrint';
import { downloadSinglePagePDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

export async function generateRingQuotationPDF(data: RingQuotationPrintData) {
  const existing = document.getElementById(RING_QUOTATION_PRINT_AREA_ID);
  if (existing) {
    await downloadSinglePagePDF(RING_QUOTATION_PRINT_AREA_ID, `Ring_Quotation_${sanitizeFilename(data.quoteNo)}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<RingQuotationPrint data={data} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    await downloadSinglePagePDF(RING_QUOTATION_PRINT_AREA_ID, `Ring_Quotation_${sanitizeFilename(data.quoteNo)}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
