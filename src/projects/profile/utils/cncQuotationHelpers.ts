import type { CNCQuotationRecord } from '../store/AppContext';

export function getCNCInquiryNo(q: CNCQuotationRecord): string {
  return q.inquiryNo || q.quoteNo;
}

export function getCNCQuotationStatus(q: CNCQuotationRecord): 'Pending' | 'Order Received' {
  return q.status || (q.poNo ? 'Order Received' : 'Pending');
}

export function getCNCDaysPending(q: CNCQuotationRecord, today = new Date()): number {
  if (getCNCQuotationStatus(q) === 'Order Received') return 0;
  const d = new Date(q.date);
  if (isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((today.getTime() - d.getTime()) / 86400000));
}

export function getCNCOrderQty(q: CNCQuotationRecord): number {
  if (q.orderQty != null && q.orderQty > 0) return q.orderQty;
  return q.items.reduce((s, i) => s + (Number(i.partOfNos) || 0), 0);
}

export function fmtCNCDate(s: string) {
  if (!s) return '-';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split('-');
    return `${d}-${m}-${y}`;
  }
  return s;
}

export function toCNCISODate(s: string) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}

const inrFmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const cncInr = inrFmt;
