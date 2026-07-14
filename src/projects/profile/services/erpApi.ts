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
  ringQuotations: unknown[];
  transportBills: unknown[];
  logs: unknown[];
  parties: unknown[];
  grades: unknown[];
  items: unknown[];
  sections: unknown[];
  workers: unknown[];
  transports: unknown[];
  companyProfile?: unknown;
  preferences?: unknown;
  cuttingAllocations?: unknown[];
  cncRateCalculations?: unknown[];
  jobWorkOutwards?: unknown[];
  jobWorkInwards?: unknown[];
  weighbridgeEntries?: unknown[];
  rejectMaterialReturns?: unknown[];
  anmsMtcRecords?: unknown[];
}

const ERP_VERSION = 'v5_item_catalog';
const LIVE_ERP_URL = 'https://jagdambaprofile.tech/api/erp/data';

async function parseJsonResponse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  return body;
}

async function fetchErpFromUrl(url: string) {
  const res = await fetch(url);
  const body = await parseJsonResponse(res);
  return {
    data: (body.data ?? null) as ErpStoredData | null,
    version: (body.version ?? null) as string | null,
  };
}

export async function fetchErpData(): Promise<{ data: ErpStoredData | null; version: string | null; source?: 'local' | 'live' }> {
  try {
    const result = await fetchErpFromUrl('/api/erp/data');
    return { ...result, source: 'local' };
  } catch (localError) {
    if (import.meta.env.DEV) {
      try {
        const live = await fetchErpFromUrl(LIVE_ERP_URL);
        if (live.data) return { ...live, source: 'live' };
      } catch {
        // live fallback failed too
      }
    }
    throw localError;
  }
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
