export interface ErpStoredData {
  orders: unknown[];
  plates: unknown[];
  usages: unknown[];
  dispatches: unknown[];
  challans: unknown[];
  purchaseOrders: unknown[];
  purchaseReceipts: unknown[];
  tcRecords: unknown[];
  quotations: unknown[];
  cncQuotations: unknown[];
  logs: unknown[];
  parties: unknown[];
}

const ERP_VERSION = 'v4_seeded';

async function parseJsonResponse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return body;
}

export async function fetchErpData(): Promise<{ data: ErpStoredData | null; version: string | null }> {
  const res = await fetch('/api/erp/data');
  const body = await parseJsonResponse(res);
  return {
    data: body.data ?? null,
    version: body.version ?? null,
  };
}

export async function saveErpData(data: ErpStoredData, version = ERP_VERSION): Promise<void> {
  const res = await fetch('/api/erp/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, version }),
  });
  await parseJsonResponse(res);
}

export { ERP_VERSION };
