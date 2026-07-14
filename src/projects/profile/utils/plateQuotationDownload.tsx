import { createRoot } from 'react-dom/client';
import type { QuotationRecord } from '../store/AppContext';
import type { PartyMaster } from '../store/AppContext';
import {
  PlateQuotationPrint,
  PLATE_QUOTATION_PRINT_AREA_ID,
  buildPlateQuotationPrintData,
} from '../components/PlateQuotationPrint';
import { downloadSinglePagePDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

export async function generatePlateQuotationPDF(
  quote: QuotationRecord,
  parties: PartyMaster[] = [],
) {
  const data = buildPlateQuotationPrintData(quote, parties);
  const existing = document.getElementById(PLATE_QUOTATION_PRINT_AREA_ID);
  if (existing) {
    await downloadSinglePagePDF(PLATE_QUOTATION_PRINT_AREA_ID, `Plate_Quotation_${sanitizeFilename(data.quoteNo)}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<PlateQuotationPrint data={data} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    await downloadSinglePagePDF(PLATE_QUOTATION_PRINT_AREA_ID, `Plate_Quotation_${sanitizeFilename(data.quoteNo)}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
