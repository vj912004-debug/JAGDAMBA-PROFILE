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

/** Transactional collections — used to detect empty / wipe payloads (excludes seeded catalogs). */
export const ERP_CRITICAL_KEYS = [
  'parties',
  'purchaseOrders',
  'purchaseReceipts',
  'orders',
  'tcRecords',
  'challans',
  'dispatches',
  'plates',
  'quotations',
  'cncQuotations',
  'ringQuotations',
  'jobWorkOutwards',
  'jobWorkInwards',
  'weighbridgeEntries',
  'rejectMaterialReturns',
  'anmsMtcRecords',
] as const;

/** All array collections protected from empty overwrite on the client. */
export const ERP_PROTECTED_ARRAY_KEYS = [
  ...ERP_CRITICAL_KEYS,
  'usages',
  'transportBills',
  'logs',
  'grades',
  'items',
  'sections',
  'workers',
  'transports',
  'cuttingAllocations',
  'cncRateCalculations',
] as const;

export function erpCriticalWeight(data: Partial<ErpStoredData> | null | undefined): number {
  if (!data || typeof data !== 'object') return 0;
  return ERP_CRITICAL_KEYS.reduce((sum, key) => {
    const rows = (data as Record<string, unknown>)[key];
    return sum + (Array.isArray(rows) ? rows.length : 0);
  }, 0);
}

export function isSparseErpData(data: ErpStoredData | null | undefined): boolean {
  return erpCriticalWeight(data) === 0;
}

/** Never let empty arrays in `incoming` erase non-empty arrays from `base`. */
export function protectErpArrays<T extends Partial<ErpStoredData>>(
  base: T | null | undefined,
  incoming: T,
): T {
  if (!base) return incoming;
  const out = { ...incoming } as T;
  for (const key of ERP_PROTECTED_ARRAY_KEYS) {
    const prev = (base as Record<string, unknown>)[key];
    const next = (incoming as Record<string, unknown>)[key];
    if (Array.isArray(prev) && prev.length > 0 && Array.isArray(next) && next.length === 0) {
      (out as Record<string, unknown>)[key] = prev;
    }
  }
  return out;
}

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
    // Local empty DB must not hide live data during development
    if (import.meta.env.DEV && isSparseErpData(result.data)) {
      try {
        const live = await fetchErpFromUrl(LIVE_ERP_URL);
        if (!isSparseErpData(live.data)) return { ...live, source: 'live' };
      } catch {
        // keep local result
      }
    }
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
