import React from 'react';
import { ErpHotkeyLabel } from './ErpHotkeyLabel';
import { erpHotkeyProps, type ErpHotkeyAction } from '../utils/erpHotkeys';

/** Full-width entry screen wrapper (Sales Order, PO, etc.) */
export const ErpEntryPage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`erp-entry-page fade-in ${className}`.trim()}>{children}</div>
);

export type ErpToolbarBtn = {
  label: string;
  onClick: () => void;
  tone?: 'green' | 'blue' | 'red' | 'purple' | 'navy' | 'teal' | 'ghost' | 'orange';
  icon?: React.ReactNode;
  hotkey?: ErpHotkeyAction;
  disabled?: boolean;
};

/** Colored action toolbar row matching mockup (SAVE F5, PRINT F8, …) */
export const ErpEntryToolbar: React.FC<{ buttons: ErpToolbarBtn[] }> = ({ buttons }) => (
  <div className="erp-entry-toolbar">
    {buttons.map((btn) => {
      const toneClass = {
        green: 'erp-entry-btn-green',
        blue: 'erp-entry-btn-blue',
        red: 'erp-entry-btn-red',
        purple: 'erp-entry-btn-purple',
        navy: 'erp-entry-btn-navy',
        teal: 'erp-entry-btn-teal',
        orange: 'erp-entry-btn-orange',
        ghost: 'erp-entry-btn-ghost',
      }[btn.tone || 'navy'];
      const hotkeyProps = btn.hotkey ? erpHotkeyProps(btn.hotkey) : {};
      return (
        <button
          key={btn.label}
          type="button"
          onClick={btn.onClick}
          disabled={btn.disabled}
          className={`erp-entry-btn ${toneClass}`}
          {...hotkeyProps}
        >
          {btn.icon}
          <span>{btn.label}</span>
          {btn.hotkey && <ErpHotkeyLabel action={btn.hotkey} />}
        </button>
      );
    })}
  </div>
);

/** Three-column form grid: Order Details | Party | Terms */
export const ErpFormGrid3: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="erp-form-grid-3">{children}</div>
);

/** Attach file chip button */
export const ErpAttachBtn: React.FC<{ label: string; fileName?: string | null; onClick: () => void }> = ({ label, fileName, onClick }) => (
  <button type="button" onClick={onClick} className="erp-attach-btn">
    📎 {fileName ? fileName : label}
  </button>
);

/** Material entry table wrapper */
export const ErpMaterialSection: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode }> = ({ title, actions, children }) => (
  <div className="tc-mgmt-panel">
    <div className="tc-mgmt-panel-head flex flex-wrap items-center justify-between gap-2">
      <span>{title}</span>
      {actions}
    </div>
    <div className="p-2 overflow-x-auto">{children}</div>
  </div>
);

/** Order summary footer bar with grand total */
export const ErpOrderSummaryBar: React.FC<{
  items: { label: string; value: string }[];
  grandTotal: string;
}> = ({ items, grandTotal }) => (
  <div className="erp-order-summary-bar">
    <div className="erp-order-summary-metrics">
      {items.map(item => (
        <div key={item.label} className="erp-order-summary-metric">
          <span className="erp-order-summary-label">{item.label}</span>
          <span className="erp-order-summary-value">{item.value}</span>
        </div>
      ))}
    </div>
    <div className="erp-order-grand-total">
      <span className="erp-order-grand-label">Grand Total (₹)</span>
      <span className="erp-order-grand-value">{grandTotal}</span>
    </div>
  </div>
);

/** Shared page header for ERP entry screens (TC, PO, GRN, Quotation). */
export const ErpPageHeader: React.FC<{ title: string; subtitle?: string; extra?: React.ReactNode }> = ({ title, subtitle, extra }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 shadow-sm">
    <div>
      <h1 className="text-lg sm:text-xl font-extrabold text-brand-navy dark:text-slate-100 uppercase tracking-wide">{title}</h1>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    {extra}
  </div>
);

export const ErpSidePanel: React.FC<{ title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, children, footer }) => (
  <div className="tc-mgmt-panel xl:sticky xl:top-4">
    <div className="tc-mgmt-panel-head">{title}</div>
    <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">{children}</div>
    {footer && <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800">{footer}</div>}
  </div>
);

/** Top-right action cluster (Export Excel, Print, etc.) */
export const ErpScreenActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-wrap justify-end gap-2">{children}</div>
);

/** Numbered section card matching mockup layout (1. PENDING ORDERS, etc.) */
export const ErpNumberedSection: React.FC<{
  number: number | string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  headClass?: 'default' | 'green';
}> = ({ number, title, subtitle, actions, children, headClass = 'default' }) => (
  <div className="tc-mgmt-panel">
    <div className={`tc-mgmt-panel-head flex flex-wrap items-center justify-between gap-2 ${headClass === 'green' ? 'green' : ''}`}>
      <span>
        {number}. {title}
        {subtitle && <span className="normal-case font-semibold opacity-90 ml-1">({subtitle})</span>}
      </span>
      {actions}
    </div>
    <div className="p-3 min-w-0 overflow-hidden">{children}</div>
  </div>
);

/** Row of summary metric boxes (GRN entry footer) */
export const ErpSummaryTiles: React.FC<{
  items: { label: string; value: string | number; tone?: 'blue' | 'green' | 'orange' | 'default' }[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  layout?: 'grid' | 'stack';
}> = ({ items, columns, layout = 'grid' }) => {
  if (layout === 'stack') {
    return (
      <div className="erp-summary-tiles erp-summary-tiles-stack">
        {items.map((item) => (
          <div key={item.label} className="erp-summary-tile">
            <div className="erp-summary-tile-label">{item.label}</div>
            <div className={`erp-summary-tile-value tone-${item.tone || 'default'}`}>{item.value}</div>
          </div>
        ))}
      </div>
    );
  }

  const cols = columns
    ?? (items.length <= 2 ? 2 : items.length <= 3 ? 3 : 6);

  return (
    <div
      className="erp-summary-tiles"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.label} className="erp-summary-tile">
          <div className="erp-summary-tile-label">{item.label}</div>
          <div className={`erp-summary-tile-value tone-${item.tone || 'default'}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

/** Footer stat cards (PO Pending, Stock Register) */
export const ErpStatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  ring?: string;
}> = ({ icon: Icon, label, value, sub, ring = 'bg-brand-blue' }) => (
  <div className="erp-stat-card">
    <div className={`erp-stat-card-icon ${ring}`}><Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /></div>
    <div className="erp-stat-card-body">
      <div className="erp-stat-card-label">{label}</div>
      <div className="erp-stat-card-value">{value}</div>
      {sub && <div className="erp-stat-card-sub">{sub}</div>}
    </div>
  </div>
);

/** Blue info note banner */
export const ErpInfoNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="erp-info-note">{children}</div>
);

/** Table title bar inside erp-card */
export const ErpTableCaption: React.FC<{ title: string; meta?: React.ReactNode }> = ({ title, meta }) => (
  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
    <h3 className="text-sm font-extrabold text-brand-blue dark:text-blue-300">{title}</h3>
    {meta}
  </div>
);

/** Navy mockup window title bar (SALES ORDER ENTRY, DESPATCH REPORT, etc.) */
export const ErpMockupTitleBar: React.FC<{
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, icon, subtitle, actions }) => (
  <div className="erp-mockup-title-bar">
    <div className="flex items-center gap-2 min-w-0">
      {icon && <span className="erp-mockup-title-icon">{icon}</span>}
      <div className="min-w-0">
        <h1 className="erp-mockup-title-text">{title}</h1>
        {subtitle && <p className="erp-mockup-subtitle">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
  </div>
);

/** Three-column detail panel with icon header (Order / Party / Terms) */
export const ErpDetailPanel: React.FC<{
  title: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'green';
  children: React.ReactNode;
}> = ({ title, icon, variant = 'default', children }) => (
  <div className="erp-detail-panel">
    <div className={`erp-detail-panel-head ${variant === 'green' ? 'green' : ''}`}>
      {icon && <span className="erp-detail-panel-icon">{icon}</span>}
      <span>{title}</span>
    </div>
    <div className="erp-detail-panel-body">{children}</div>
  </div>
);

/** Auto-label suffix for read-only fields */
export const ErpAutoField: React.FC<{ label: string; value: string; auto?: boolean }> = ({ label, value, auto = true }) => (
  <div>
    <label className="tc-mgmt-label">{label}</label>
    <div className="relative">
      <input readOnly value={value} className="tc-mgmt-input bg-slate-100 dark:bg-slate-800 font-mono pr-14" />
      {auto && <span className="erp-auto-tag">(Auto)</span>}
    </div>
  </div>
);

/** Centered report title block with date range */
export const ErpReportTitleBlock: React.FC<{ title: string; from?: string; to?: string; timestamp?: string }> = ({ title, from, to, timestamp }) => (
  <div className="erp-report-title-block">
    <h2 className="erp-report-title">{title}</h2>
    {(from || to) && <p className="erp-report-range">From {from || '—'} To {to || '—'}</p>}
    {timestamp && <p className="erp-report-timestamp">Date : {timestamp}</p>}
  </div>
);

/** Icon summary cards row (Despatch Report, Ready For Dispatch) */
export const ErpIconStatCards: React.FC<{
  items: { icon: React.ElementType; label: string; value: string; ring?: string }[];
}> = ({ items }) => (
  <div className="erp-icon-stat-row">
    {items.map(item => {
      const Icon = item.icon;
      return (
        <div key={item.label} className="erp-icon-stat-card">
          <div className={`erp-icon-stat-icon ${item.ring || 'ring-blue'}`}><Icon className="w-5 h-5" /></div>
          <div>
            <div className="erp-icon-stat-label">{item.label}</div>
            <div className="erp-icon-stat-value">{item.value}</div>
          </div>
        </div>
      );
    })}
  </div>
);

function buildPaginationPages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  if (page > 3) pages.push('ellipsis');
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (page < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

/** Table pagination footer matching mockup */
export const ErpListPagination: React.FC<{
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange?: (s: number) => void;
  navLabels?: 'symbols' | 'text';
  activeTone?: 'blue' | 'orange';
  showVersion?: boolean;
  className?: string;
  perPageSuffix?: string;
}> = ({
  page, pageSize, total, onPageChange, onPageSizeChange,
  navLabels = 'symbols', activeTone = 'blue', showVersion = true,
  className = 'erp-list-pagination', perPageSuffix = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = buildPaginationPages(page, totalPages);
  const activeClass = activeTone === 'orange' ? 'active-orange' : 'active';

  return (
    <div className={className}>
      <span className="text-[11px] text-slate-500">Showing {start} to {end} of {total.toLocaleString('en-IN')} entries</span>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(1)} className="erp-page-btn">{navLabels === 'text' ? 'First' : '«'}</button>
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="erp-page-btn">{navLabels === 'text' ? 'Prev' : '‹'}</button>
        {pages.map((p, i) => (
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[11px] text-slate-400">…</span>
          ) : (
            <button key={p} type="button" onClick={() => onPageChange(p)} className={`erp-page-btn ${p === page ? activeClass : ''}`}>{p}</button>
          )
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="erp-page-btn">{navLabels === 'text' ? 'Next' : '›'}</button>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} className="erp-page-btn">{navLabels === 'text' ? 'Last' : '»'}</button>
      </div>
      {onPageSizeChange ? (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))} className="tc-mgmt-input w-16 text-[11px] py-1">
            {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {perPageSuffix && <span>{perPageSuffix}</span>}
        </div>
      ) : showVersion ? (
        <span className="text-[10px] text-slate-400">V 1.0.0.0</span>
      ) : <span />}
    </div>
  );
};

/** Paginate array helper */
export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}
