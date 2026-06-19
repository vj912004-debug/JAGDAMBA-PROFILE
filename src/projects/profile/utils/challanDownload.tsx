import { createRoot } from 'react-dom/client';
import type { ChallanRecord, Order, PartyMaster } from '../store/AppContext';
import {
  buildChallanPrintData,
  ChallanDuplicatePrintView,
  ChallanOriginalPrintView,
  ChallanPrintStyles,
  CHALLAN_DUPLICATE_PRINT_ID,
  CHALLAN_ORIGINAL_PRINT_ID,
} from '../components/ChallanPrintViews';
import { downloadPDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

async function waitForRender() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 250));
}

async function downloadChallanCopy(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Challan print area ${elementId} not found`);
  await waitForImages(element);
  await downloadPDF(elementId, filename);
}

export async function generateChallanPDF(
  challan: ChallanRecord,
  order: Order | undefined,
  parties: PartyMaster[] = [],
  dispatches: { orderNo: string; vehicleNo?: string }[] = []
) {
  const printData = buildChallanPrintData(challan, order, parties, dispatches);
  const baseName = sanitizeFilename(challan.challanNo);

  const existingOriginal = document.getElementById(CHALLAN_ORIGINAL_PRINT_ID);
  const existingDuplicate = document.getElementById(CHALLAN_DUPLICATE_PRINT_ID);

  if (existingOriginal && existingDuplicate) {
    await downloadChallanCopy(CHALLAN_ORIGINAL_PRINT_ID, `Challan_${baseName}_Original`);
    await new Promise((r) => setTimeout(r, 600));
    await downloadChallanCopy(CHALLAN_DUPLICATE_PRINT_ID, `Challan_${baseName}_Duplicate`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(
      <div className="challan-print-root" style={{ background: '#fff' }}>
        <ChallanPrintStyles />
        <ChallanOriginalPrintView {...printData} />
        <ChallanDuplicatePrintView {...printData} />
      </div>
    );

    await waitForRender();

    await downloadChallanCopy(CHALLAN_ORIGINAL_PRINT_ID, `Challan_${baseName}_Original`);
    await new Promise((r) => setTimeout(r, 600));
    await downloadChallanCopy(CHALLAN_DUPLICATE_PRINT_ID, `Challan_${baseName}_Duplicate`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
