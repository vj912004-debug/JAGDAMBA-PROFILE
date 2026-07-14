/** Indian financial year label, e.g. FY 2026–27 → "26-27" */
export function getIndianFinancialYearLabel(date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  const yy = (n: number) => String(n % 100).padStart(2, '0');
  return `${yy(startYear)}-${yy(endYear)}`;
}

function isSameFinancialYear(poFy: string, currentFy: string): boolean {
  if (poFy === currentFy) return true;
  // Earlier build used "20-27" for FY 2026–27
  return poFy === '20-27' && currentFy === '26-27';
}

export function formatPONumber(sequence: number, date = new Date()): string {
  const fy = getIndianFinancialYearLabel(date);
  return `PO-JP/${fy}/${String(sequence).padStart(3, '0')}`;
}

export function parsePONumberSequence(poNumber: string): { fy: string; sequence: number } | null {
  const match = poNumber.match(/^PO-JP\/(\d{2}-\d{2})\/(\d+)$/i);
  if (!match) return null;
  return { fy: match[1], sequence: parseInt(match[2], 10) };
}

export function nextPONumberFromExisting(
  purchaseOrders: { poNumber: string }[],
  date = new Date(),
): string {
  const fy = getIndianFinancialYearLabel(date);
  const prefix = `PO-JP/${fy}/`;

  const maxNum = purchaseOrders.reduce((max, p) => {
    const parsed = parsePONumberSequence(p.poNumber);
    if (parsed && isSameFinancialYear(parsed.fy, fy)) {
      return Math.max(max, parsed.sequence);
    }

    // Legacy: PO-JP-2026-001
    const legacy = p.poNumber.match(/^PO-JP-(\d{4})-(\d+)$/);
    if (legacy) {
      const legacyYear = parseInt(legacy[1], 10);
      const month = date.getMonth() + 1;
      const calendarYear = date.getFullYear();
      const inSamePeriod =
        legacyYear === calendarYear || (month < 4 && legacyYear === calendarYear - 1);
      if (inSamePeriod) {
        return Math.max(max, parseInt(legacy[2], 10));
      }
    }

    return max;
  }, 0);

  return formatPONumber(maxNum + 1, date);
}

/** Filesystem-safe PO filename for WhatsApp/email attachments */
export function poFileName(poNumber: string): string {
  return `${poNumber.replace(/\//g, '-')}.pdf`;
}

/** Basename for PDF download (downloadPDF adds .pdf extension) */
export function poDownloadName(poNumber: string): string {
  return poNumber.replace(/\//g, '-');
}
