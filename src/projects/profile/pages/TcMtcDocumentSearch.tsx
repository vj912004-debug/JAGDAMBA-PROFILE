import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, RotateCcw, Filter, FileText, Download, Eye, Printer,
  FileSpreadsheet, FlaskConical, Image, CheckCircle2, X, Hourglass,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext, type TCRecord, MATERIAL_GRADES } from '../store/AppContext';
import type { AnmsMtcRecord } from '../utils/anmsMtcHelpers';
import { cn } from '../components/Sidebar';
import { ErpEntryPage, ErpListPagination, paginateRows } from '../components/ErpPageShell';
import { generateTCPDFBase64 } from '../utils/pdfGenerator';
import { downloadAnmsMtcPdf } from '../utils/anmsMtcDownload';
import { exportToExcel } from '../utils/excel';
import { upper } from '../utils/textCase';

const MAKES = ['AM/NS INDIA', 'JINDAL ODISHA', 'JINDAL RAIGHAD', 'SELL RSP', 'SELL', 'TATA', 'JSW', 'POSCO', 'CHINA'] as const;

type TcStatus = 'Active' | 'Expired' | 'Expiry Soon';

type SearchRow =
  | { kind: 'TC'; record: TCRecord }
  | { kind: 'MTC'; record: AnmsMtcRecord };

const getTcStatus = (tcDate: string): TcStatus => {
  const date = new Date(tcDate);
  if (Number.isNaN(date.getTime())) return 'Active';
  const expiry = new Date(date);
  expiry.setFullYear(expiry.getFullYear() + 2);
  const daysUntilExpiry = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiry Soon';
  return 'Active';
};

const statusRowClass = (status: TcStatus | 'MTC') => {
  if (status === 'Expired') return 'row-expired';
  if (status === 'Expiry Soon') return 'row-expiry-soon';
  return '';
};

const statusDotClass = (status: TcStatus | 'MTC') => {
  if (status === 'Expired') return 'expired';
  if (status === 'Expiry Soon') return 'soon';
  if (status === 'MTC') return 'soon';
  return 'active';
};

const inDateRange = (value: string, from: string, to: string) => {
  if (!value) return !from && !to;
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
};

const emptyFilters = () => ({
  heatNumber: '',
  plateNumber: '',
  tcNumber: '',
  tcDateFrom: '',
  tcDateTo: '',
  partyName: '',
  grade: '',
  thickness: '',
  make: '',
  tcStatus: '' as '' | TcStatus,
});

function rowHeat(row: SearchRow): string {
  if (row.kind === 'TC') return row.record.heatNumber;
  return row.record.heatAnalysis.find(h => h.heatNo.trim())?.heatNo || '';
}

function rowPlate(row: SearchRow): string {
  return row.kind === 'TC' ? row.record.plateNumber : '—';
}

function rowTcNo(row: SearchRow): string {
  return row.kind === 'TC' ? row.record.tcNumber : row.record.testCertificateNo;
}

function rowTcDate(row: SearchRow): string {
  return row.kind === 'TC' ? row.record.tcDate : row.record.testCertificateDate;
}

function rowParty(row: SearchRow): string {
  if (row.kind === 'TC') return row.record.supplierName || row.record.make || '';
  return row.record.customerTo?.split('\n')[0] || row.record.supplierManufacturer || '';
}

function rowGrade(row: SearchRow): string {
  if (row.kind === 'TC') return row.record.grade;
  return row.record.internalGrade || '';
}

function rowThickness(row: SearchRow): string {
  if (row.kind === 'TC') return row.record.thickness;
  return row.record.mechanicalProperties[0]?.thk || '';
}

function rowMake(row: SearchRow): string {
  return row.kind === 'TC' ? (row.record.make || '') : (row.record.make || '');
}

function rowWeight(row: SearchRow): string {
  return row.kind === 'TC' ? (row.record.plateWeight || '') : '—';
}

function rowStatus(row: SearchRow): TcStatus | 'MTC' {
  if (row.kind === 'MTC') return 'MTC';
  return getTcStatus(rowTcDate(row));
}

function hasTcPdf(record: TCRecord) {
  return Boolean(record.pdfData);
}

export const TcMtcDocumentSearch: React.FC = () => {
  const { tcRecords, anmsMtcRecords } = useAppContext();

  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewRow, setPreviewRow] = useState<SearchRow | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  const allRows = useMemo<SearchRow[]>(() => {
    const tc: SearchRow[] = tcRecords.map(r => ({ kind: 'TC', record: r }));
    const mtc: SearchRow[] = anmsMtcRecords.map(r => ({ kind: 'MTC', record: r }));
    return [...tc, ...mtc].sort((a, b) => rowTcDate(b).localeCompare(rowTcDate(a)));
  }, [tcRecords, anmsMtcRecords]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const heat = rowHeat(row);
      const plate = rowPlate(row);
      const tcNo = rowTcNo(row);
      const tcDate = rowTcDate(row);
      const party = rowParty(row);
      const grade = rowGrade(row);
      const thickness = rowThickness(row);
      const make = rowMake(row);
      const status = rowStatus(row);

      return (
        (appliedFilters.heatNumber === '' || heat.toLowerCase().includes(appliedFilters.heatNumber.toLowerCase())) &&
        (appliedFilters.plateNumber === '' || plate.toLowerCase().includes(appliedFilters.plateNumber.toLowerCase())) &&
        (appliedFilters.tcNumber === '' || tcNo.toLowerCase().includes(appliedFilters.tcNumber.toLowerCase())) &&
        inDateRange(tcDate, appliedFilters.tcDateFrom, appliedFilters.tcDateTo) &&
        (appliedFilters.partyName === '' || party.toLowerCase().includes(appliedFilters.partyName.toLowerCase())) &&
        (appliedFilters.grade === '' || grade.toLowerCase().includes(appliedFilters.grade.toLowerCase())) &&
        (appliedFilters.thickness === '' || thickness.toLowerCase().includes(appliedFilters.thickness.toLowerCase())) &&
        (appliedFilters.make === '' || make.toLowerCase().includes(appliedFilters.make.toLowerCase())) &&
        (appliedFilters.tcStatus === '' || (row.kind === 'TC' && status === appliedFilters.tcStatus))
      );
    });
  }, [allRows, appliedFilters]);

  const pagedRows = useMemo(
    () => paginateRows(filteredRows, page, pageSize),
    [filteredRows, page, pageSize],
  );

  const stats = useMemo(() => {
    const tcStatuses = tcRecords.map(r => getTcStatus(r.tcDate));
    return {
      total: tcRecords.length + anmsMtcRecords.length,
      active: tcStatuses.filter(s => s === 'Active').length,
      expired: tcStatuses.filter(s => s === 'Expired').length,
      expirySoon: tcStatuses.filter(s => s === 'Expiry Soon').length,
    };
  }, [tcRecords, anmsMtcRecords]);

  const filterOptions = useMemo(() => ({
    parties: ['', ...Array.from(new Set([
      ...tcRecords.map(r => r.supplierName || r.make || ''),
      ...anmsMtcRecords.map(r => r.customerTo?.split('\n')[0] || r.supplierManufacturer || ''),
    ].filter(Boolean))).sort()],
    grades: ['', ...Array.from(new Set([
      ...tcRecords.map(r => r.grade),
      ...anmsMtcRecords.map(r => r.internalGrade),
    ].filter(Boolean))).sort()],
    thicknesses: ['', ...Array.from(new Set(tcRecords.map(r => r.thickness).filter(Boolean))).sort()],
    makes: ['', ...MAKES.filter(m => tcRecords.some(r => r.make === m) || anmsMtcRecords.some(r => r.make === m))],
  }), [tcRecords, anmsMtcRecords]);

  const applySearch = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const resetFilters = () => {
    const empty = emptyFilters();
    setDraftFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const downloadTc = (record: TCRecord) => {
    const data = record.pdfData || generateTCPDFBase64(record);
    const a = document.createElement('a');
    a.href = data;
    a.download = record.pdfName || `TC_${record.heatNumber}.pdf`;
    a.click();
  };

  const printTc = (record: TCRecord) => {
    const data = record.pdfData || generateTCPDFBase64(record);
    const w = window.open('');
    if (!w) {
      toast.error('Pop-up blocked — allow pop-ups to print');
      return;
    }
    w.document.write(`<iframe src="${data}" style="width:100%;height:100%;border:none" onload="this.contentWindow.print()"></iframe>`);
    w.document.title = record.pdfName || `TC_${record.heatNumber}`;
  };

  const downloadMtc = async (record: AnmsMtcRecord) => {
    const loading = toast.loading('Generating MTC PDF...');
    try {
      await downloadAnmsMtcPdf(record);
      toast.success('MTC downloaded', { id: loading });
    } catch (err) {
      toast.error((err as Error).message || 'Failed to generate MTC PDF', { id: loading });
    }
  };

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.error('No records to export');
      return;
    }
    exportToExcel(
      filteredRows.map((row, i) => ({
        'Sr No': i + 1,
        'TC No.': rowTcNo(row),
        'TC Date': rowTcDate(row),
        'Party Name': rowParty(row),
        'Grade': rowGrade(row),
        'Thickness (mm)': rowThickness(row),
        'Plate No.': rowPlate(row),
        'Heat No.': rowHeat(row),
        'Make': rowMake(row),
        'Weight (KG)': rowWeight(row),
        'Status': rowStatus(row),
      })),
      'TC Document List',
      `TC_Search_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success('Exported to Excel');
  };

  const previewTc = previewRow?.kind === 'TC' ? previewRow.record : null;

  return (
    <>
      <ErpEntryPage>
        <div className="tc-dash-page">
          {/* Summary cards */}
          <div className="tc-dash-stat-row">
            <div className="tc-dash-stat-card">
              <div className="tc-dash-stat-icon blue"><FileText className="w-5 h-5" /></div>
              <div>
                <div className="tc-dash-stat-label blue">Total TC</div>
                <div className="tc-dash-stat-value">{stats.total.toLocaleString('en-IN')}</div>
                <div className="tc-dash-stat-sub">Total Documents</div>
              </div>
            </div>
            <div className="tc-dash-stat-card">
              <div className="tc-dash-stat-icon green"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <div className="tc-dash-stat-label green">Active TC</div>
                <div className="tc-dash-stat-value">{stats.active.toLocaleString('en-IN')}</div>
                <div className="tc-dash-stat-sub">Valid (Within 2 Years)</div>
              </div>
            </div>
            <div className="tc-dash-stat-card">
              <div className="tc-dash-stat-icon red"><X className="w-5 h-5" /></div>
              <div>
                <div className="tc-dash-stat-label red">Expired TC</div>
                <div className="tc-dash-stat-value">{stats.expired.toLocaleString('en-IN')}</div>
                <div className="tc-dash-stat-sub">Older Than 2 Years</div>
              </div>
            </div>
            <div className="tc-dash-stat-card">
              <div className="tc-dash-stat-icon purple"><Hourglass className="w-5 h-5" /></div>
              <div>
                <div className="tc-dash-stat-label purple">Expiry Soon</div>
                <div className="tc-dash-stat-value">{stats.expirySoon.toLocaleString('en-IN')}</div>
                <div className="tc-dash-stat-sub">Will Expire in 30 Days</div>
              </div>
            </div>
          </div>

          {/* Search filters */}
          <div className="tc-dash-filter-card">
            <div className="tc-dash-filter-head"><Filter className="w-3.5 h-3.5" /> Search Filters</div>
            <div className="tc-dash-filter-body">
              <div className="tc-dash-filter-row">
                <div>
                  <label className="tc-mgmt-label">Party Name</label>
                  <select
                    value={draftFilters.partyName}
                    onChange={e => setDraftFilters({ ...draftFilters, partyName: e.target.value })}
                    className="tc-mgmt-input"
                  >
                    <option value="">All Parties</option>
                    {filterOptions.parties.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tc-mgmt-label">Grade</label>
                  <select
                    value={draftFilters.grade}
                    onChange={e => setDraftFilters({ ...draftFilters, grade: upper(e.target.value) })}
                    className="tc-mgmt-input"
                  >
                    <option value="">All Grades</option>
                    {filterOptions.grades.filter(Boolean).map(g => <option key={g} value={g}>{g}</option>)}
                    {MATERIAL_GRADES.filter(g => !filterOptions.grades.includes(g)).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tc-mgmt-label">Thickness (mm)</label>
                  <select
                    value={draftFilters.thickness}
                    onChange={e => setDraftFilters({ ...draftFilters, thickness: e.target.value })}
                    className="tc-mgmt-input"
                  >
                    <option value="">All Thickness</option>
                    {filterOptions.thicknesses.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tc-mgmt-label">Make</label>
                  <select
                    value={draftFilters.make}
                    onChange={e => setDraftFilters({ ...draftFilters, make: upper(e.target.value) })}
                    className="tc-mgmt-input"
                  >
                    <option value="">All Makes</option>
                    {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="tc-mgmt-label">TC Status</label>
                  <select
                    value={draftFilters.tcStatus}
                    onChange={e => setDraftFilters({ ...draftFilters, tcStatus: e.target.value as '' | TcStatus })}
                    className="tc-mgmt-input"
                  >
                    <option value="">All TC</option>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Expiry Soon">Expiry Soon</option>
                  </select>
                </div>
                <div>
                  <label className="tc-mgmt-label">TC No.</label>
                  <input
                    type="text"
                    placeholder="Enter TC No."
                    value={draftFilters.tcNumber}
                    onChange={e => setDraftFilters({ ...draftFilters, tcNumber: upper(e.target.value) })}
                    className="tc-mgmt-input"
                  />
                </div>
              </div>
              <div className="tc-dash-filter-row">
                <div>
                  <label className="tc-mgmt-label">Plate No.</label>
                  <input
                    type="text"
                    placeholder="Enter Plate No."
                    value={draftFilters.plateNumber}
                    onChange={e => setDraftFilters({ ...draftFilters, plateNumber: upper(e.target.value) })}
                    className="tc-mgmt-input"
                  />
                </div>
                <div>
                  <label className="tc-mgmt-label">Heat No.</label>
                  <input
                    type="text"
                    placeholder="Enter Heat No."
                    value={draftFilters.heatNumber}
                    onChange={e => setDraftFilters({ ...draftFilters, heatNumber: upper(e.target.value) })}
                    className="tc-mgmt-input"
                  />
                </div>
                <div>
                  <label className="tc-mgmt-label">Date From</label>
                  <input
                    type="date"
                    value={draftFilters.tcDateFrom}
                    onChange={e => setDraftFilters({ ...draftFilters, tcDateFrom: e.target.value })}
                    className="tc-mgmt-input"
                  />
                </div>
                <div>
                  <label className="tc-mgmt-label">Date To</label>
                  <input
                    type="date"
                    value={draftFilters.tcDateTo}
                    onChange={e => setDraftFilters({ ...draftFilters, tcDateTo: e.target.value })}
                    className="tc-mgmt-input"
                  />
                </div>
                <div className="tc-dash-filter-actions">
                  <button type="button" onClick={applySearch} className="erp-entry-btn erp-entry-btn-blue">
                    <Search className="w-4 h-4" /> Search
                  </button>
                  <button type="button" onClick={resetFilters} className="erp-entry-btn erp-entry-btn-outline-orange">
                    <RotateCcw className="w-4 h-4" /> Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TC Document List */}
          <div className="tc-doc-panel">
            <div className="tc-doc-list-head">
              <div className="tc-doc-list-title">
                <FileText className="w-4 h-4" />
                TC Document List
                <span className="tc-doc-record-badge">Total Records : {filteredRows.length.toLocaleString('en-IN')}</span>
              </div>
              <button type="button" onClick={handleExport} className="tc-doc-export-btn">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export To Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="tc-doc-table w-full min-w-[1100px]">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>TC No.</th>
                    <th>TC Date</th>
                    <th>Party Name</th>
                    <th>Grade</th>
                    <th>Thickness (mm)</th>
                    <th>Plate No.</th>
                    <th>Heat No.</th>
                    <th>Make</th>
                    <th>Weight (KG)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, idx) => {
                    const status = rowStatus(row);
                    const srNo = (page - 1) * pageSize + idx + 1;
                    const rowKey = `${row.kind}-${row.record.id}`;
                    return (
                      <tr
                        key={rowKey}
                        className={cn(statusRowClass(status), previewRow?.record.id === row.record.id && 'ring-2 ring-inset ring-brand-blue')}
                      >
                        <td className="text-center">{srNo}</td>
                        <td className="font-bold text-brand-blue">{rowTcNo(row) || '—'}</td>
                        <td>{rowTcDate(row) || '—'}</td>
                        <td>{rowParty(row) || '—'}</td>
                        <td>{rowGrade(row) || '—'}</td>
                        <td className="text-center">{rowThickness(row) || '—'}</td>
                        <td>{rowPlate(row)}</td>
                        <td className="font-semibold">{rowHeat(row) || '—'}</td>
                        <td>{rowMake(row) || '—'}</td>
                        <td className="text-right">{rowWeight(row) || '—'}</td>
                        <td>
                          <span className={`tc-status-text ${statusDotClass(status)}`}>
                            <span className={`tc-status-dot ${statusDotClass(status)}`} />
                            {status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              title="View"
                              onClick={() => setPreviewRow(row)}
                              className="tc-doc-action-btn"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Download"
                              onClick={() => row.kind === 'TC' ? downloadTc(row.record) : void downloadMtc(row.record)}
                              className="tc-doc-action-btn"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Print"
                              onClick={() => row.kind === 'TC' ? printTc(row.record) : void downloadMtc(row.record)}
                              className="tc-doc-action-btn text-purple-600"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                title="More"
                                onClick={e => { e.stopPropagation(); setMenuOpenId(menuOpenId === rowKey ? null : rowKey); }}
                                className="tc-doc-action-btn"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                              {menuOpenId === rowKey && (
                                <div className="tc-more-menu" onClick={e => e.stopPropagation()}>
                                  <button type="button" onClick={() => { setPreviewRow(row); setMenuOpenId(null); }}>View Documents</button>
                                  {row.kind === 'TC' ? (
                                    <Link to="/tc-management" className="block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                                      Open in TC Management
                                    </Link>
                                  ) : (
                                    <Link to="/mill-test-certificate-anms" className="block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                                      Open MTC Entry
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pagedRows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center py-10 text-slate-400 italic">No TC records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <ErpListPagination
              page={page}
              pageSize={pageSize}
              total={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={s => { setPageSize(s); setPage(1); }}
              navLabels="text"
              activeTone="orange"
              showVersion={false}
              className="tc-doc-pagination"
              perPageSuffix="per page"
            />

            <div className="tc-doc-legend">
              <span><span className="tc-status-dot active" /> Active TC (Within 2 Years)</span>
              <span><span className="tc-status-dot expired" /> Expired TC (Older Than 2 Years)</span>
              <span><span className="tc-status-dot soon" /> Expiry Soon (Will Expire in 30 Days)</span>
            </div>
          </div>
        </div>
      </ErpEntryPage>

      {previewRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {previewRow.kind === 'TC' ? 'TC Document' : 'MTC Document'} — {rowTcNo(previewRow)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Heat {rowHeat(previewRow)} · {rowTcDate(previewRow)} · {rowParty(previewRow)}
                </p>
              </div>
              <button type="button" onClick={() => setPreviewRow(null)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {previewRow.kind === 'TC' && previewTc && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-slate-500">Grade</span><p className="font-semibold">{previewTc.grade || '—'}</p></div>
                    <div><span className="text-slate-500">Plate No</span><p className="font-semibold">{previewTc.plateNumber}</p></div>
                    <div><span className="text-slate-500">PO No</span><p className="font-semibold">{previewTc.purchaseOrderNumber || '—'}</p></div>
                    <div><span className="text-slate-500">SO No</span><p className="font-semibold">{previewTc.salesOrderNumber || '—'}</p></div>
                  </div>
                  <div className="tc-linked-docs-grid">
                    <DocPreviewCard title="TC PDF" icon={FileText} fileName={previewTc.pdfName} dataUrl={previewTc.pdfData} />
                    <DocPreviewCard title="Plate Photo" icon={Image} fileName={previewTc.platePhotoName} dataUrl={previewTc.platePhotoData} />
                    <DocPreviewCard title="UT Report" icon={FlaskConical} fileName={previewTc.labReportName} dataUrl={previewTc.labReportData} />
                    <DocPreviewCard title="Heat Marking" icon={Image} fileName={previewTc.heatMarkingPhotoName} dataUrl={previewTc.heatMarkingPhotoData} />
                  </div>
                  {!hasTcPdf(previewTc) && !previewTc.platePhotoData && !previewTc.labReportData && !previewTc.heatMarkingPhotoData && (
                    <p className="text-sm text-slate-500 italic">No uploaded files — TC PDF will be auto-generated on download.</p>
                  )}
                </>
              )}

              {previewRow.kind === 'MTC' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-slate-500">Sale Order</span><p className="font-semibold">{previewRow.record.saleOrderNo || '—'}</p></div>
                    <div><span className="text-slate-500">Product</span><p className="font-semibold">{previewRow.record.productType || '—'}</p></div>
                    <div><span className="text-slate-500">Specification</span><p className="font-semibold">{previewRow.record.specification || '—'}</p></div>
                    <div><span className="text-slate-500">Supplier</span><p className="font-semibold">{previewRow.record.supplierManufacturer || '—'}</p></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="tc-mgmt-table w-full text-xs">
                      <thead>
                        <tr><th>Heat No</th><th>C</th><th>Mn</th><th>S</th><th>P</th><th>Si</th></tr>
                      </thead>
                      <tbody>
                        {previewRow.record.heatAnalysis.map(h => (
                          <tr key={h.id}>
                            <td className="font-bold">{h.heatNo}</td>
                            <td>{h.c}</td><td>{h.mn}</td><td>{h.s}</td><td>{h.p}</td><td>{h.si}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {previewRow.kind === 'TC' ? (
                <>
                  <button type="button" onClick={() => downloadTc(previewRow.record)} className="erp-entry-btn erp-entry-btn-blue text-xs py-2">
                    <Download className="w-3.5 h-3.5" /> Download TC
                  </button>
                  <button type="button" onClick={() => printTc(previewRow.record)} className="erp-entry-btn erp-entry-btn-outline-orange text-xs py-2">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => void downloadMtc(previewRow.record)} className="erp-entry-btn erp-entry-btn-blue text-xs py-2">
                  <Download className="w-3.5 h-3.5" /> Download MTC PDF
                </button>
              )}
              <button type="button" onClick={() => setPreviewRow(null)} className="erp-entry-btn erp-entry-btn-ghost text-xs py-2 ml-auto">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DocPreviewCard: React.FC<{
  title: string;
  icon: React.ElementType;
  fileName?: string;
  dataUrl?: string;
}> = ({ title, icon: Icon, fileName, dataUrl }) => (
  <div className="tc-linked-doc-card">
    <div className="tc-linked-doc-card-head">
      <Icon className="w-3.5 h-3.5 text-[#F9520B]" />
      {title}
    </div>
    <div className="tc-linked-doc-thumb">
      {dataUrl?.startsWith('data:image') ? (
        <img src={dataUrl} alt={title} />
      ) : (
        <Icon className="w-8 h-8 text-slate-300" />
      )}
    </div>
    <div className="tc-linked-doc-meta">{fileName || 'No file linked'}</div>
    <div className="tc-linked-doc-actions">
      {dataUrl && (
        <a href={dataUrl} target="_blank" rel="noreferrer" className="tc-doc-action-btn" title="View">
          <Eye className="w-3.5 h-3.5" />
        </a>
      )}
      {dataUrl && (
        <a href={dataUrl} download={fileName || 'document'} className="tc-doc-action-btn" title="Download">
          <Download className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  </div>
);
