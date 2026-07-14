import { createRoot } from 'react-dom/client';
import type { ChallanRecord, CompanyProfileData, DispatchRecord, Order, PartyMaster } from '../store/AppContext';
import { DeliveryChallanPrint, DELIVERY_CHALLAN_PRINT_AREA_ID } from '../components/DeliveryChallanPrint';
import { buildDeliveryChallanPrintData } from './deliveryChallanHelpers';
import { downloadPDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

async function waitForRender() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 300));
}

export async function generateChallanPDF(
  challan: ChallanRecord,
  order: Order | undefined,
  parties: PartyMaster[] = [],
  dispatches: DispatchRecord[] = [],
  companyProfile?: CompanyProfileData,
) {
  const printData = buildDeliveryChallanPrintData(challan, order, parties, dispatches, companyProfile);
  const baseName = sanitizeFilename(challan.challanNo);

  const existing = document.getElementById(DELIVERY_CHALLAN_PRINT_AREA_ID);
  if (existing) {
    await downloadPDF(DELIVERY_CHALLAN_PRINT_AREA_ID, `Delivery_Challan_${baseName}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;width:210mm;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<DeliveryChallanPrint data={printData} />);
    await waitForRender();
    await downloadPDF(DELIVERY_CHALLAN_PRINT_AREA_ID, `Delivery_Challan_${baseName}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
