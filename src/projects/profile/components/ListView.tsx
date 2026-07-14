import React, { useMemo, useState } from 'react';
import { Plus, Search, FileSpreadsheet, FileDown, Trash2, RotateCcw, Download, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PurchaseOrder } from '../store/AppContext';
import { PoToolbarActions } from './PoToolbarActions';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { ErpHotkeyLabel } from './ErpHotkeyLabel';
import { cellText, downloadListRow } from '../utils/listExport';

export interface ListColumn<T> {
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface ListViewProps<T> {
  title: string;
  columns: ListColumn<T>[];
  rows: T[];
  getId: (row: T) => string;
  onNew?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  /** Per-row download; defaults to PDF export of that row */
  onDownload?: (row: T, index: number) => void;
  /** Filename label for default row download */
  downloadLabel?: (row: T) => string;
  showRowDownload?: boolean;
  /** keys used for keyword search; defaults to scanning all stringified values */
  searchAccessor?: (row: T) => string;
  /** field used for the From/To date filter (expects yyyy-mm-dd or dd/mm/yyyy) */
  dateAccessor?: (row: T) => string;
  showFilters?: boolean;
  emptyText?: string;
  /** When set, enables row selection and WhatsApp PO / Email PO toolbar buttons */
  poActions?: {
    resolvePurchaseOrder: (row: T) => PurchaseOrder | null | undefined;
  };
  /** Called when a row is clicked (e.g. open PO preview) */
  onRowClick?: (row: T) => void;
  /** Extra buttons rendered after the default toolbar actions */
  extraToolbar?: React.ReactNode;
}

const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export function ListView<T>({
  title, columns, rows, getId, onNew, onEdit, onDelete, onDownload, downloadLabel, showRowDownload = true,
  searchAccessor, dateAccessor, showFilters = true, emptyText = 'No records found', poActions, onRowClick,
  extraToolbar,
}: ListViewProps<T>) {
  const showActions = showRowDownload || !!onDelete || !!onEdit;
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState({ fromDate: '', toDate: '', keyword: '' });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const parse = (s: string) => {
    if (!s) return 0;
    if (s.includes('/')) { const [d, m, y] = s.split('/'); return new Date(+y, +m - 1, +d).getTime(); }
    return new Date(s).getTime();
  };

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (applied.keyword) {
        const hay = (searchAccessor ? searchAccessor(r) : JSON.stringify(r)).toLowerCase();
        if (!hay.includes(applied.keyword.toLowerCase())) return false;
      }
      if (dateAccessor && (applied.fromDate || applied.toDate)) {
        const d = parse(dateAccessor(r));
        if (applied.fromDate && d < parse(applied.fromDate)) return false;
        if (applied.toDate && d > parse(applied.toDate)) return false;
      }
      return true;
    });
  }, [rows, applied, searchAccessor, dateAccessor]);

  const selectedPo = useMemo(() => {
    if (!poActions || !selectedRowId) return null;
    const row = filtered.find(r => getId(r) === selectedRowId);
    return row ? poActions.resolvePurchaseOrder(row) ?? null : null;
  }, [poActions, selectedRowId, filtered, getId]);

  const doSearch = () => setApplied({ fromDate, toDate, keyword });
  const doReset = () => {
    setFromDate(''); setToDate(''); setKeyword('');
    setApplied({ fromDate: '', toDate: '', keyword: '' });
    setSelectedRowId(null);
  };

  const handleRowDownload = (row: T, idx: number) => {
    if (onDownload) {
      onDownload(row, idx);
      return;
    }
    downloadListRow({ title, columns, row, rowIndex: idx, getLabel: downloadLabel });
    toast.success('PDF downloaded');
  };

  const exportCsv = () => {
    const header = columns.map(c => `"${c.header}"`).join(',');
    const body = filtered.map((r, i) => columns.map(c => {
      const text = cellText(c.render(r, i));
      return `"${text.replace(/"/g, '""')}"`;
    }).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="max-w-[1300px] mx-auto space-y-4 fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        <button {...erpHotkeyProps('new')} onClick={onNew ?? (() => toast('New record'))} className="erp-btn erp-btn-green"><Plus className="w-4 h-4" /> New <ErpHotkeyLabel action="new" /></button>
        <button onClick={doSearch} className="erp-btn erp-btn-primary"><Search className="w-4 h-4" /> Search</button>
        <button onClick={exportCsv} className="erp-btn erp-btn-navy"><FileSpreadsheet className="w-4 h-4" /> Export Excel</button>
        <button {...erpHotkeyProps('pdf')} onClick={() => window.print()} className="erp-btn erp-btn-purple"><FileDown className="w-4 h-4" /> PDF Download <ErpHotkeyLabel action="pdf" /></button>
        {poActions && <PoToolbarActions purchaseOrder={selectedPo} />}
        {extraToolbar}
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="erp-card p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1">
              <label className="field-label mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="field-label mb-1">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1">
              <label className="field-label mb-1">Party / Keyword</label>
              <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search..."
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={doSearch} className="erp-btn erp-btn-primary"><Search className="w-4 h-4" /> Search</button>
              <button onClick={doReset} className="erp-btn erp-btn-ghost"><RotateCcw className="w-4 h-4" /> Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="erp-card">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-bold text-brand-blue uppercase tracking-wide">{title}</h2>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-brand-navy text-white">
                <th className="px-3 py-2.5 text-left font-bold text-xs first:rounded-tl-lg">Sr</th>
                {columns.map((c, i) => (
                  <th key={i} className={`px-3 py-2.5 font-bold text-xs ${alignCls[c.align ?? 'left']}`}>{c.header}</th>
                ))}
                {showActions && <th className="px-3 py-2.5 text-center font-bold text-xs rounded-tr-lg">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.length + (showActions ? 2 : 1)} className="px-3 py-10 text-center text-slate-400 italic">{emptyText}</td></tr>
              ) : filtered.map((row, idx) => (
                <tr
                  key={getId(row)}
                  onClick={() => {
                    if (poActions) setSelectedRowId(getId(row));
                    onRowClick?.(row);
                  }}
                  className={`odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 ${
                    poActions && selectedRowId === getId(row) ? 'ring-2 ring-inset ring-brand-blue bg-blue-50/60 dark:bg-blue-900/20' : ''
                  } ${poActions || onRowClick ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                  {columns.map((c, i) => (
                    <td key={i} className={`px-3 py-2.5 text-slate-700 dark:text-slate-200 ${alignCls[c.align ?? 'left']} ${c.className ?? ''}`}>{c.render(row, idx)}</td>
                  ))}
                  {showActions && (
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        {showRowDownload && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleRowDownload(row, idx); }}
                            title="Download PDF"
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onEdit(row); }}
                            title="Edit this record"
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); onDelete(row); }}
                            title="Delete this record"
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
