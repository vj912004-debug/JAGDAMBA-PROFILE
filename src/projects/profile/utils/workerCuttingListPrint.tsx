import { createRoot } from 'react-dom/client';
import {
  WorkerCuttingListPrint,
  WORKER_CUTTING_LIST_PRINT_AREA_ID,
} from '../components/WorkerCuttingListPrint';
import type { WorkerCuttingListPrintData } from './workerCuttingListHelpers';
import { downloadSinglePagePDF } from './pdfGenerator';

export async function printWorkerCuttingList(data: WorkerCuttingListPrintData) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;width:210mm;';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<WorkerCuttingListPrint data={data} />);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 200));

  try {
    window.print();
  } finally {
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(host);
    }, 500);
  }
}

export async function downloadWorkerCuttingListPDF(data: WorkerCuttingListPrintData) {
  const filename = `Worker_Cutting_List_${data.workerName.replace(/\s+/g, '_')}`;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;width:210mm;';
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(<WorkerCuttingListPrint data={data} />);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((r) => setTimeout(r, 300));

  try {
    await downloadSinglePagePDF(WORKER_CUTTING_LIST_PRINT_AREA_ID, filename);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
