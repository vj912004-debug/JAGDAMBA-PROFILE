import React from 'react';
import { FileSpreadsheet, Printer, X, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TransportReportShell: React.FC<{
  title: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  onExcel?: () => void;
  onPrint?: () => void;
  printId?: string;
}> = ({ title, children, filters, onExcel, onPrint, printId = 'transport-report-print' }) => {
  const navigate = useNavigate();
  return (
  <div className="jw-pending-page fade-in">
    <div className="jw-pending-topbar no-print">
      <div className="jw-pending-topbar-title">
        <Truck className="w-5 h-5" />
        {title}
      </div>
      <div className="jw-pending-topbar-actions">
        {onExcel && (
          <button type="button" onClick={onExcel} className="jw-pending-btn jw-pending-btn-green">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        )}
        <button
          type="button"
          onClick={onPrint ?? (() => window.print())}
          className="jw-pending-btn jw-pending-btn-white"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button type="button" onClick={() => navigate(-1)} className="jw-pending-btn jw-pending-btn-white">
          <X className="w-4 h-4" /> Close
        </button>
      </div>
    </div>

    {filters && <div className="jw-pending-filters no-print">{filters}</div>}

    <div className="jw-pending-report" id={printId}>
      {children}
    </div>

    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #${printId}, #${printId} * { visibility: visible !important; }
        #${printId} {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .no-print { display: none !important; }
      }
    `}</style>
  </div>
  );
};

export const TransportReportHead: React.FC<{
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  dateRange?: { from: string; to: string };
}> = ({ title, subtitle, right, dateRange }) => (
  <div className="jw-pending-report-head">
    <div className="flex-1" />
    <div className="text-center flex-[2]">
      <h2 className="jw-pending-report-title">{title}</h2>
      {subtitle && <p className="jw-pending-report-sub">{subtitle}</p>}
    </div>
    <div className="jw-pending-report-date flex-1 text-right">
      {right}
      {dateRange && (dateRange.from || dateRange.to) && (
        <div className="text-xs mt-1">
          From Date : {dateRange.from ? new Date(dateRange.from + 'T12:00:00').toLocaleDateString('en-GB') : '—'}
          {' '}To Date : {dateRange.to ? new Date(dateRange.to + 'T12:00:00').toLocaleDateString('en-GB') : '—'}
        </div>
      )}
    </div>
  </div>
);

export const TransportSearchButtons: React.FC<{ onSearch: () => void; onClear: () => void }> = ({ onSearch, onClear }) => (
  <div className="flex justify-center gap-3 mt-4">
    <button type="button" onClick={onSearch} className="jw-pending-show-btn">Search</button>
    <button type="button" onClick={onClear} className="jw-pending-clear-btn">Clear</button>
  </div>
);
