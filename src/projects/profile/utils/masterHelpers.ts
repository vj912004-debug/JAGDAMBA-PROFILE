import type { PartyMaster, PurchaseOrder } from '../store/AppContext';

export function isSupplierParty(party: Pick<PartyMaster, 'category'>): boolean {
  const cat = (party.category || '').trim();
  return cat === 'Supplier' || cat === 'Both';
}

export function filterSupplierParties(parties: PartyMaster[]): PartyMaster[] {
  return parties
    .filter(isSupplierParty)
    .sort((a, b) => a.partyName.localeCompare(b.partyName));
}

export interface SupplierLedgerRow {
  id: string;
  date: string;
  part: string;
  debit: string;
  credit: string;
  bal: string;
}

const fmtLedgerAmt = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const parseLedgerDate = (s: string) => {
  if (!s) return 0;
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    return new Date(+y, +m - 1, +d).getTime();
  }
  return new Date(s).getTime();
};

export function buildSupplierLedgerRows(
  supplierName: string,
  purchaseOrders: PurchaseOrder[],
): SupplierLedgerRow[] {
  const nameUpper = supplierName.trim().toUpperCase();
  const pos = purchaseOrders
    .filter(po => po.supplierName.trim().toUpperCase() === nameUpper)
    .sort((a, b) => parseLedgerDate(a.date) - parseLedgerDate(b.date));

  let balance = 0;
  const rows: SupplierLedgerRow[] = [{
    id: 'opening',
    date: pos[0]?.date || '',
    part: 'Opening Balance',
    debit: '-',
    credit: '-',
    bal: fmtLedgerAmt(balance),
  }];

  for (const po of pos) {
    balance += po.totalAmount;
    rows.push({
      id: po.id,
      date: po.date,
      part: `${po.poNumber} Purchase`,
      debit: fmtLedgerAmt(po.totalAmount),
      credit: '-',
      bal: fmtLedgerAmt(balance),
    });
  }

  return rows;
}

export function nextMasterCode(prefix: string, existing: { code?: string }[], pad = 3): string {
  const nums = existing.map(r => {
    const m = (r.code || '').match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

/** Active grade names from Grade Master; falls back to built-in list if master is empty. */
export function getActiveGradeOptions(
  grades: { name: string; status: string }[],
  fallback: readonly string[],
): string[] {
  const active = grades
    .filter(g => g.status === 'Active')
    .map(g => g.name.trim())
    .filter(Boolean);
  return active.length ? active : [...fallback];
}

/** Grade options for PO: party-linked grades first, else master + PO history. */
export function getPartyPoGradeOptions(
  gradeMaster: { name: string; status: string }[],
  partyGrades: string[] | undefined,
  purchaseOrders: { supplierName: string; items: { grade: string }[] }[],
  supplierName: string,
  fallback: readonly string[],
): string[] {
  const allActive = getActiveGradeOptions(gradeMaster, fallback);

  if (partyGrades?.length) {
    const activeUpper = new Set(allActive.map(g => g.toUpperCase()));
    return partyGrades
      .map(g => g.trim())
      .filter(Boolean)
      .map(g => {
        const match = allActive.find(a => a.toUpperCase() === g.toUpperCase());
        return match ?? g.toUpperCase();
      })
      .filter((g, i, arr) => arr.findIndex(x => x.toUpperCase() === g.toUpperCase()) === i);
  }

  if (!supplierName.trim()) return allActive;

  const supplierUpper = supplierName.trim().toUpperCase();
  const used = new Set<string>();
  for (const po of purchaseOrders) {
    if (po.supplierName.trim().toUpperCase() !== supplierUpper) continue;
    for (const item of po.items) {
      const g = item.grade?.trim();
      if (g) used.add(g.toUpperCase());
    }
  }
  if (used.size === 0) return allActive;

  const byUpper = new Map(allActive.map(g => [g.toUpperCase(), g]));
  const preferred: string[] = [];
  for (const u of used) {
    const match = byUpper.get(u);
    if (match && !preferred.includes(match)) preferred.push(match);
  }
  const rest = allActive.filter(g => !preferred.includes(g));
  return [...preferred, ...rest];
}
