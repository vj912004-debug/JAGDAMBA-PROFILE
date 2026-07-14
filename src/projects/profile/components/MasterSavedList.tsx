import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export interface MasterSavedColumn<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface MasterSavedListProps<T> {
  title: string;
  rows: T[];
  columns: MasterSavedColumn<T>[];
  getId: (row: T) => string;
  selectedId?: string | null;
  onSelect: (row: T) => void;
  searchAccessor?: (row: T) => string;
  emptyText?: string;
}

export function MasterSavedList<T>({
  title,
  rows,
  columns,
  getId,
  selectedId,
  onSelect,
  searchAccessor,
  emptyText = 'No saved records yet. Fill the form above and click Save.',
}: MasterSavedListProps<T>) {
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      const hay = (searchAccessor ? searchAccessor(r) : JSON.stringify(r)).toLowerCase();
      return hay.includes(q);
    });
  }, [rows, keyword, searchAccessor]);

  return (
    <div className="erp-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-brand-blue uppercase tracking-wide">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {rows.length} record(s)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search saved records..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
            <tr>
              {columns.map(col => (
                <th key={col.header} className={`px-3 py-2.5 text-left font-semibold ${col.className ?? ''}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">{emptyText}</td>
              </tr>
            ) : (
              filtered.map(row => {
                const id = getId(row);
                const selected = selectedId === id;
                return (
                  <tr
                    key={id}
                    onClick={() => onSelect(row)}
                    className={`border-t border-slate-200 dark:border-slate-700 cursor-pointer transition-colors ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {columns.map(col => (
                      <td key={col.header} className={`px-3 py-2.5 ${col.className ?? ''}`}>{col.render(row)}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
