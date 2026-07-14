import { createRoot } from 'react-dom/client';
import type { CNCQuotationRecord } from '../store/AppContext';
import { CNCQuotationPrint, CNC_QUOTATION_PRINT_AREA_ID } from '../components/CNCQuotationPrint';
import { downloadSinglePagePDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

export async function generateCNCQuotationPDF(quote: CNCQuotationRecord, userName?: string) {
  const existing = document.getElementById(CNC_QUOTATION_PRINT_AREA_ID);
  if (existing) {
    await downloadSinglePagePDF(CNC_QUOTATION_PRINT_AREA_ID, `CNC_Quotation_${sanitizeFilename(quote.quoteNo)}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<CNCQuotationPrint quote={quote} userName={userName} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    await downloadSinglePagePDF(CNC_QUOTATION_PRINT_AREA_ID, `CNC_Quotation_${sanitizeFilename(quote.quoteNo)}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
