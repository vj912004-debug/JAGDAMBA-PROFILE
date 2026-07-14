import React, { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2, ClipboardList, FileText, Plus, Printer, RotateCcw, Save, Scale, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import {
  ErpEntryPage, ErpEntryToolbar, ErpIconStatCards, ErpMockupTitleBar,
} from '../components/ErpPageShell';
import { useAppContext, MATERIAL_GRADES } from '../store/AppContext';
import { upper } from '../utils/textCase';
import {
  fmtDisplayDate,
  fmtKg,
  nextRMREntryNumberFromExisting,
  type DebitNoteStatus,
  type RejectMaterialReturnRecord,
} from '../utils/rejectMaterialReturnHelpers';

type FormState = {
  entryNo: string;
  entryDate: string;
  partyName: string;
  itemGrade: string;
  nos: string;
  kg: string;
  debitNoteStatus: DebitNoteStatus;
  billNo: string;
  billDate: string;
  partyChallanNo: string;
  sizeDetail: string;
  remark: string;
};

const blankForm = (entries: RejectMaterialReturnRecord[], date: string): FormState => ({
  entryNo: nextRMREntryNumberFromExisting(entries, new Date(date)),
  entryDate: date,
  partyName: '',
  itemGrade: '',
  nos: '',
  kg: '',
  debitNoteStatus: 'Pending',
  billNo: '',
  billDate: '',
  partyChallanNo: '',
  sizeDetail: '',
  remark: '',
});

const sizeDetailPreview = (text: string) =>
  text.replace(/\n/g, ' | ').replace(/\s+/g, ' ').trim();

export const RejectMaterialReturnEntry: React.FC = () => {
  const {
    rejectMaterialReturns,
    setRejectMaterialReturns,
    grades,
    role,
    persistErpNow,
  } = useAppContext();

  const today = new Date().toISOString().split('T')[0];
  const canEdit = role === 'Admin' || role === 'Office Entry';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [form, setForm] = useState(() => blankForm(rejectMaterialReturns, today));
  const set = (key: keyof FormState) => (value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const gradeOptions = useMemo(() => {
    const fromMaster = grades.map(g => g.name);
    return Array.from(new Set([...fromMaster, ...MATERIAL_GRADES])).sort();
  }, [grades]);

  const sortedEntries = useMemo(
    () => [...rejectMaterialReturns].sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1)),
    [rejectMaterialReturns],
  );

  const summary = useMemo(() => {
    const totalKg = rejectMaterialReturns.reduce((s, r) => s + (r.kg || 0), 0);
    const pending = rejectMaterialReturns.filter(r => r.debitNoteStatus === 'Pending').length;
    const received = rejectMaterialReturns.filter(r => r.debitNoteStatus === 'Received').length;
    return {
      totalEntries: rejectMaterialReturns.length,
      totalKg,
      pendingDebit: pending,
      receivedDebit: received,
    };
  }, [rejectMaterialReturns]);

  const resetForm = useCallback(() => {
    const d = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setSelectedRowId(null);
    setForm(blankForm(rejectMaterialReturns, d));
  }, [rejectMaterialReturns]);

  const loadRecord = (rec: RejectMaterialReturnRecord) => {
    setEditingId(rec.id);
    setSelectedRowId(rec.id);
    setForm({
      entryNo: rec.entryNo,
      entryDate: rec.entryDate,
      partyName: rec.partyName,
      itemGrade: rec.itemGrade,
      nos: rec.nos > 0 ? String(rec.nos) : '',
      kg: rec.kg > 0 ? String(rec.kg) : '',
      debitNoteStatus: rec.debitNoteStatus,
      billNo: rec.billNo,
      billDate: rec.billDate,
      partyChallanNo: rec.partyChallanNo,
      sizeDetail: rec.sizeDetail,
      remark: rec.remark,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = () => {
    if (!form.entryDate) { toast.error('Entry Date is required'); return false; }
    if (!form.entryNo.trim()) { toast.error('Entry No is required'); return false; }
    if (!form.partyName.trim()) { toast.error('Party Name is required'); return false; }
    if (!form.sizeDetail.trim()) { toast.error('Size / Material Detail is required'); return false; }
    const nos = parseNum(form.nos);
    const kg = parseNum(form.kg);
    if (nos <= 0 && kg <= 0) { toast.error('Enter Nos or Kg'); return false; }
    return true;
  };

  const buildRecord = (): RejectMaterialReturnRecord => ({
    id: editingId || Date.now().toString(),
    entryNo: form.entryNo.trim(),
    entryDate: form.entryDate,
    partyName: form.partyName.trim(),
    itemGrade: form.itemGrade.trim(),
    nos: parseNum(form.nos),
    kg: parseNum(form.kg),
    debitNoteStatus: form.debitNoteStatus,
    billNo: upper(form.billNo.trim()),
    billDate: form.billDate,
    partyChallanNo: upper(form.partyChallanNo.trim()),
    sizeDetail: form.sizeDetail.trim(),
    remark: form.remark.trim(),
    savedAt: new Date().toISOString(),
  });

  const handleSave = async (andPrint = false) => {
    if (!canEdit) { toast.error('You do not have permission to save'); return; }
    if (!validate()) return;

    const record = buildRecord();
    const next = editingId
      ? rejectMaterialReturns.map(r => r.id === editingId ? record : r)
      : [record, ...rejectMaterialReturns];

    setRejectMaterialReturns(next);
    try {
      await persistErpNow({ rejectMaterialReturns: next });
      toast.success(editingId ? 'Entry updated' : 'Entry saved');
      if (andPrint) {
        setTimeout(() => window.print(), 150);
      } else {
        resetForm();
      }
    } catch {
      toast.error('Saved locally but server sync failed');
    }
  };

  return (
    <ErpEntryPage className="pb-28">
      <div className="no-print">
        <ErpMockupTitleBar
          title="Reject Material Return Entry"
          icon={<ClipboardList className="w-4 h-4" />}
          actions={
            <>
              <button type="button" onClick={resetForm} className="erp-entry-btn erp-entry-btn-blue text-[10px] py-1">
                <Plus className="w-3.5 h-3.5" /> New Entry
              </button>
              <button type="button" onClick={() => window.print()} className="erp-entry-btn erp-entry-btn-blue text-[10px] py-1">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </>
          }
        />

        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 font-medium">
            Only Admin or Office Entry role can save reject material return entries.
          </div>
        )}

        <div className="tc-mgmt-panel">
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              <div>
                <label className="tc-mgmt-label">Entry Date *</label>
                <input type="date" value={form.entryDate} onChange={e => set('entryDate')(e.target.value)} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Entry No *</label>
                <input value={form.entryNo} onChange={e => set('entryNo')(upper(e.target.value))} className="tc-mgmt-input font-mono" />
              </div>
              <div className="col-span-2">
                <label className="tc-mgmt-label">Party Name *</label>
                <PartyAutocomplete
                  value={form.partyName}
                  onChange={set('partyName')}
                  onSelectParty={p => set('partyName')(p.partyName)}
                  placeholder="Select party"
                />
              </div>
              <div>
                <label className="tc-mgmt-label">Item / Grade</label>
                <select value={form.itemGrade} onChange={e => set('itemGrade')(e.target.value)} className="tc-mgmt-input">
                  <option value="">Select</option>
                  {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="tc-mgmt-label">Nos</label>
                <NumericInput value={form.nos} onChange={set('nos')} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Kg</label>
                <NumericInput value={form.kg} onChange={set('kg')} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Debit Note Status</label>
                <select
                  value={form.debitNoteStatus}
                  onChange={e => set('debitNoteStatus')(e.target.value as DebitNoteStatus)}
                  className="tc-mgmt-input"
                >
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="tc-mgmt-label">Bill No</label>
                <input value={form.billNo} onChange={e => set('billNo')(upper(e.target.value))} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Bill Date</label>
                <input type="date" value={form.billDate} onChange={e => set('billDate')(e.target.value)} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Party Challan No</label>
                <input value={form.partyChallanNo} onChange={e => set('partyChallanNo')(upper(e.target.value))} className="tc-mgmt-input" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="tc-mgmt-label">Size / Material Detail *</label>
                <textarea
                  value={form.sizeDetail}
                  onChange={e => set('sizeDetail')(e.target.value)}
                  rows={6}
                  className="tc-mgmt-input resize-y font-mono text-xs leading-relaxed"
                  placeholder={'Thk: 10 mm\nWidth: 1500 mm\nLength: 6000 mm\nHeat No:\nPlate No:\nDrawing No:\nReason:'}
                />
              </div>
              <div>
                <label className="tc-mgmt-label">Remark</label>
                <textarea
                  value={form.remark}
                  onChange={e => set('remark')(e.target.value)}
                  rows={6}
                  className="tc-mgmt-input resize-y"
                  placeholder="Remark"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head">Reject Material Return Register</div>
          <div className="overflow-x-auto">
            <table className="w-full erp-report-table text-xs">
              <thead>
                <tr>
                  <th>Entry No</th>
                  <th>Entry Date</th>
                  <th>Party Name</th>
                  <th>Item / Grade</th>
                  <th>Bill No</th>
                  <th>Bill Date</th>
                  <th>Party Challan No</th>
                  <th>Size / Material Detail</th>
                  <th className="text-right">Nos</th>
                  <th className="text-right">Kg</th>
                  <th>Debit Note Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-10 text-slate-400 italic">
                      No reject material return entries yet
                    </td>
                  </tr>
                ) : sortedEntries.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => loadRecord(row)}
                    className={selectedRowId === row.id ? 'bg-blue-50/70 cursor-pointer' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                  >
                    <td className="font-semibold text-brand-blue whitespace-nowrap">{row.entryNo}</td>
                    <td className="whitespace-nowrap">{fmtDisplayDate(row.entryDate)}</td>
                    <td>{row.partyName}</td>
                    <td>{row.itemGrade || '—'}</td>
                    <td>{row.billNo || '—'}</td>
                    <td className="whitespace-nowrap">{row.billDate ? fmtDisplayDate(row.billDate) : '—'}</td>
                    <td>{row.partyChallanNo || '—'}</td>
                    <td className="max-w-[220px] text-[10px] leading-snug">{sizeDetailPreview(row.sizeDetail)}</td>
                    <td className="text-right">{row.nos || '—'}</td>
                    <td className="text-right font-semibold">{row.kg > 0 ? fmtKg(row.kg) : '—'}</td>
                    <td>
                      <span className={row.debitNoteStatus === 'Received' ? 'erp-billed-badge' : 'erp-pending-badge'}>
                        {row.debitNoteStatus}
                      </span>
                    </td>
                    <td className="max-w-[160px] truncate">{row.remark || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tc-mgmt-panel">
          <div className="p-3 space-y-4">
            <ErpIconStatCards
              items={[
                { icon: FileText, label: 'Total Entries', value: String(summary.totalEntries), ring: 'ring-blue' },
                { icon: Scale, label: 'Total Kg', value: fmtKg(summary.totalKg), ring: 'ring-green' },
                { icon: RotateCcw, label: 'Pending Debit Note', value: String(summary.pendingDebit), ring: 'ring-orange' },
                { icon: CheckCircle2, label: 'Received Debit Note', value: String(summary.receivedDebit), ring: 'ring-green' },
              ]}
            />
            <ErpEntryToolbar
              buttons={[
                {
                  label: 'SAVE',
                  onClick: () => handleSave(false),
                  tone: 'blue',
                  icon: <Save className="w-4 h-4" />,
                  hotkey: 'save',
                  disabled: !canEdit,
                },
                {
                  label: 'SAVE & PRINT',
                  onClick: () => handleSave(true),
                  tone: 'green',
                  icon: <Printer className="w-4 h-4" />,
                  disabled: !canEdit,
                },
                {
                  label: 'CANCEL',
                  onClick: resetForm,
                  tone: 'ghost',
                  icon: <X className="w-4 h-4" />,
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="hidden print:block p-6 text-sm">
        <h1 className="text-lg font-extrabold uppercase mb-4">Reject Material Return Entry</h1>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
          <div><strong>Entry No:</strong> {form.entryNo}</div>
          <div><strong>Entry Date:</strong> {fmtDisplayDate(form.entryDate)}</div>
          <div><strong>Party:</strong> {form.partyName}</div>
          <div><strong>Item / Grade:</strong> {form.itemGrade || '—'}</div>
          <div><strong>Bill No:</strong> {form.billNo || '—'}</div>
          <div><strong>Bill Date:</strong> {form.billDate ? fmtDisplayDate(form.billDate) : '—'}</div>
          <div><strong>Party Challan No:</strong> {form.partyChallanNo || '—'}</div>
          <div><strong>Debit Note:</strong> {form.debitNoteStatus}</div>
          <div><strong>Nos:</strong> {form.nos || '—'}</div>
          <div><strong>Kg:</strong> {form.kg ? fmtKg(parseNum(form.kg)) : '—'}</div>
        </div>
        <div className="mb-3">
          <strong>Size / Material Detail</strong>
          <pre className="whitespace-pre-wrap font-sans mt-1 border p-2 rounded">{form.sizeDetail}</pre>
        </div>
        {form.remark && (
          <div>
            <strong>Remark</strong>
            <p className="mt-1">{form.remark}</p>
          </div>
        )}
      </div>
    </ErpEntryPage>
  );
};
