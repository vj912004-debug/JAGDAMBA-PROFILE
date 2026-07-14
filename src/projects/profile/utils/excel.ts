import * as XLSX from 'xlsx';

export const exportToExcel = <T extends Record<string, unknown>>(
  data: T[],
  sheetName = 'Data',
  filename = 'export.xlsx'
) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};

export const importFromExcel = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export function getExcelCell(row: Record<string, unknown>, ...keys: string[]): string {
  return getExcelCellByAliases(row, keys);
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_\-/.]/g, '');
}

function cellToString(val: unknown): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') {
    if (Number.isInteger(val) && Math.abs(val) >= 1e9) {
      return String(Math.round(val));
    }
    return String(val);
  }
  return String(val).trim();
}

export function getExcelCellByAliases(row: Record<string, unknown>, aliases: string[]): string {
  const entries = Object.entries(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    for (const [key, val] of entries) {
      if (normalizeHeader(key) === normalizedAlias) {
        const text = cellToString(val);
        if (text) return text;
      }
    }
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (normalizedAlias.length < 4) continue;
    for (const [key, val] of entries) {
      const normalizedKey = normalizeHeader(key);
      if (normalizedKey.includes(normalizedAlias) || normalizedAlias.includes(normalizedKey)) {
        const text = cellToString(val);
        if (text) return text;
      }
    }
  }

  return '';
}
