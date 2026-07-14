import { createRoot } from 'react-dom/client';
import type { Order, PartyMaster } from '../store/AppContext';
import { SalesOrderPrintInner, SALES_ORDER_PRINT_AREA_ID } from '../components/SalesOrderPrint';
import { downloadPDF } from './pdfGenerator';

const sanitizeFilename = (name: string) =>
  name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');

export async function generateSalesOrderPDF(order: Order, parties: PartyMaster[] = []) {
  const existing = document.getElementById(SALES_ORDER_PRINT_AREA_ID);
  if (existing) {
    await downloadPDF(SALES_ORDER_PRINT_AREA_ID, `SalesOrder_${order.orderNo}`);
    return;
  }

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:#fff;';
  document.body.appendChild(host);

  const root = createRoot(host);
  try {
    root.render(<SalesOrderPrintInner order={order} parties={parties} />);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await new Promise((r) => setTimeout(r, 200));

    const printArea = document.getElementById(SALES_ORDER_PRINT_AREA_ID);
    if (!printArea) throw new Error('Sales order print area not found');

    await downloadPDF(SALES_ORDER_PRINT_AREA_ID, `SalesOrder_${sanitizeFilename(order.orderNo)}`);
  } finally {
    root.unmount();
    document.body.removeChild(host);
  }
}
