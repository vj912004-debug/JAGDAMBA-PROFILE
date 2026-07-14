import React, { useCallback, useMemo, useState } from 'react';
import {
  FileSpreadsheet, FileText, Printer, RotateCcw, Save, Search, Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { WeightBridgePrint } from '../components/WeightBridgePrint';
import { NumericInput, parseNum } from '../components/NumericInput';
import { useAppContext } from '../store/AppContext';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { exportToExcel } from '../utils/excel';
import { upper } from '../utils/textCase';
import {
  calcNetWeightKg,
  fmtKg,
  fmtRs,
  nextCopyNo,
  nextSerialNo,
  normalizeWeighbridgeRecord,
  type WeighbridgeRecord,
  type WeightBridgePrintData,
} from '../utils/weightBridgeHelpers';

const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmtDisplayDate = (iso: string) => {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB');
};

type FormState = {
  serialNo: string;
  copyNo: string;
  vehicleNo: string;
  supplierName: string;
  entryDate: string;
  operatorName: string;
  grossWeightKg: string;
  grossDate: string;
  grossTime: string;
  tareWeightKg: string;
  tareDate: string;
  tareTime: string;
  charges: string;
  remark: string;
};

const blankForm = (entries: WeighbridgeRecord[], date: string): FormState => ({
  serialNo: nextSerialNo(entries),
  copyNo: nextCopyNo(entries),
  vehicleNo: '',
  supplierName: '',
  entryDate: date,
  operatorName: '',
  grossWeightKg: '',
  grossDate: date,
  grossTime: nowTime(),
  tareWeightKg: '',
  tareDate: date,
  tareTime: '',
  charges: '',
  remark: '',
});

const WbLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`wb-field-label ${className}`.trim()}>{children}</span>
);

const WbSearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  list?: string;
  uppercase?: boolean;
}> = ({ value, onChange, list, uppercase }) => (
  <div className="wb-input-wrap">
    <input
      list={list}
      value={value}
      onChange={e => onChange(uppercase ? upper(e.target.value) : e.target.value)}
      className={`wb-input ${uppercase ? 'uppercase' : ''}`}
    />
    <Search className="wb-input-icon" />
  </div>
);

const WbDateInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <input type="date" value={value} onChange={e => onChange(e.target.value)} className="wb-input wb-input-date" />
);

const WbTimeInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <input type="time" value={value} onChange={e => onChange(e.target.value)} className="wb-input wb-input-time" />
);

export const WeightBridge: React.FC = () => {
  const {
    weighbridgeEntries,
    setWeighbridgeEntries,
    purchaseReceipts,
    workers,
    persistErpNow,
    user,
  } = useAppContext();

  const today = new Date().toISOString().split('T')[0];
  const entries = useMemo(
    () => weighbridgeEntries.map(e => normalizeWeighbridgeRecord(e as unknown as Record<string, unknown>)),
    [weighbridgeEntries],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchSerial, setSearchSerial] = useState('');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState({ serial: '', vehicle: '', fromDate: '', toDate: '' });

  const [form, setForm] = useState(() => blankForm(entries, today));
  const set = (k: keyof FormState) => (v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const grossKg = parseNum(form.grossWeightKg);
  const tareKg = parseNum(form.tareWeightKg);
  const netKg = calcNetWeightKg(grossKg, tareKg);
  const charges = parseNum(form.charges);

  const buildPrintData = useCallback((): WeightBridgePrintData => ({
    serialNo: form.serialNo.trim(),
    copyNo: form.copyNo.trim(),
    vehicleNo: upper(form.vehicleNo.trim()),
    supplierName: form.supplierName.trim() || form.operatorName.trim(),
    entryDate: form.entryDate,
    operatorName: form.operatorName.trim(),
    grossWeightKg: grossKg,
    grossDate: form.grossDate,
    grossTime: form.grossTime,
    tareWeightKg: tareKg,
    tareDate: form.tareDate,
    tareTime: form.tareTime,
    netWeightKg: netKg,
    charges,
    remark: form.remark.trim(),
  }), [form, grossKg, tareKg, netKg, charges]);

  const validateEntry = () => {
    if (!form.vehicleNo.trim()) { toast.error('Enter vehicle number'); return false; }
    if (!form.serialNo.trim()) { toast.error('Enter serial number'); return false; }
    if (grossKg <= 0) { toast.error('Enter gross weight'); return false; }
    if (tareKg <= 0) { toast.error('Enter tare weight'); return false; }
    if (netKg <= 0) { toast.error('Net weight must be greater than 0'); return false; }
    return true;
  };

  const handlePrint = () => {
    if (!validateEntry()) return;
    window.print();
  };

  const operatorOptions = useMemo(() => {
    const names = new Set<string>();
    if (user?.displayName) names.add(user.displayName);
    workers.forEach(w => w.name && names.add(w.name));
    entries.forEach(e => e.operatorName && names.add(e.operatorName));
    return Array.from(names).sort();
  }, [workers, entries, user]);

  const vehicleOptions = useMemo(() =>
    Array.from(new Set([
      ...entries.map(e => e.vehicleNo),
      ...purchaseReceipts.map(r => r.vehicleNo).filter(Boolean) as string[],
    ])).sort(),
  [entries, purchaseReceipts]);

  const resetForm = useCallback(() => {
    const d = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setSelectedRowId(null);
    setForm(blankForm(entries, d));
  }, [entries]);

  const loadRecord = (rec: WeighbridgeRecord) => {
    setEditingId(rec.id);
    setSelectedRowId(rec.id);
    setForm({
      serialNo: rec.serialNo,
      copyNo: rec.copyNo,
      vehicleNo: rec.vehicleNo,
      supplierName: rec.supplierName,
      entryDate: rec.entryDate,
      operatorName: rec.operatorName,
      grossWeightKg: rec.grossWeightKg > 0 ? String(rec.grossWeightKg) : '',
      grossDate: rec.grossDate,
      grossTime: rec.grossTime,
      tareWeightKg: rec.tareWeightKg > 0 ? String(rec.tareWeightKg) : '',
      tareDate: rec.tareDate,
      tareTime: rec.tareTime,
      charges: rec.charges > 0 ? String(rec.charges) : '',
      remark: rec.remark,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (andPrint = false) => {
    if (!validateEntry()) return;

    const record: WeighbridgeRecord = {
      id: editingId || Date.now().toString(),
      serialNo: form.serialNo.trim(),
      copyNo: form.copyNo.trim(),
      vehicleNo: upper(form.vehicleNo.trim()),
      supplierName: form.supplierName.trim(),
      entryDate: form.entryDate,
      operatorName: form.operatorName.trim(),
      grossWeightKg: grossKg,
      grossDate: form.grossDate,
      grossTime: form.grossTime,
      tareWeightKg: tareKg,
      tareDate: form.tareDate,
      tareTime: form.tareTime || nowTime(),
      netWeightKg: netKg,
      charges,
      remark: form.remark.trim(),
      savedAt: new Date().toISOString(),
    };

    const next = editingId
      ? entries.map(e => e.id === editingId ? record : e)
      : [record, ...entries];

    setWeighbridgeEntries(next);
    try {
      await persistErpNow({ weighbridgeEntries: next });
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

  const handleSearch = () => {
    setApplied({
      serial: searchSerial.trim(),
      vehicle: searchVehicle.trim(),
      fromDate,
      toDate,
    });
  };

  const handleClear = () => {
    setSearchSerial('');
    setSearchVehicle('');
    setFromDate('');
    setToDate('');
    setApplied({ serial: '', vehicle: '', fromDate: '', toDate: '' });
  };

  const filtered = useMemo(() => {
    let rows = [...entries];
    if (applied.fromDate) rows = rows.filter(r => r.entryDate >= applied.fromDate);
    if (applied.toDate) rows = rows.filter(r => r.entryDate <= applied.toDate);
    if (applied.serial) {
      const q = applied.serial.toUpperCase();
      rows = rows.filter(r => r.serialNo.toUpperCase().includes(q));
    }
    if (applied.vehicle) {
      const q = applied.vehicle.toUpperCase();
      rows = rows.filter(r => r.vehicleNo.toUpperCase().includes(q));
    }
    return rows.sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1));
  }, [entries, applied]);

  const handleExcel = () => {
    if (filtered.length === 0) { toast.error('No records to export'); return; }
    exportToExcel(
      filtered.map((r, i) => ({
        'Sr.No.': i + 1,
        'Entry Date': fmtDisplayDate(r.entryDate),
        'Serial No.': r.serialNo,
        'Copy No.': r.copyNo,
        'Vehicle No.': r.vehicleNo,
        'Gross (KG)': r.grossWeightKg,
        'Tare (KG)': r.tareWeightKg,
        'Net (KG)': r.netWeightKg,
        'Charges (₹)': r.charges,
        Operator: r.operatorName,
      })),
      'Weight Bridge',
      `weight-bridge-${today}.xlsx`,
    );
    toast.success('Excel exported');
  };

  return (
    <>
      <div className="wb-page no-print">
        <div className="wb-actions">
          <button type="button" {...erpHotkeyProps('save')} onClick={() => handleSave(false)} className="wb-btn wb-btn-navy">
            <Save className="w-4 h-4" /> Save
          </button>
          <button type="button" onClick={() => handleSave(true)} className="wb-btn wb-btn-green">
            <Printer className="w-4 h-4" /> Save & Print
          </button>
          <button type="button" {...erpHotkeyProps('print')} onClick={handlePrint} className="wb-btn wb-btn-purple">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button type="button" onClick={resetForm} className="wb-btn wb-btn-light">
            <RotateCcw className="w-4 h-4" /> New
          </button>
        </div>

        {/* BASIC DETAILS */}
        <section className="wb-card">
          <div className="wb-section-head">
            <Truck className="w-4 h-4" />
            <span>BASIC DETAILS</span>
          </div>
          <div className="wb-section-body">
            <div className="wb-basic-grid">
              <div className="wb-field">
                <WbLabel>Serial No. :</WbLabel>
                <WbSearchInput value={form.serialNo} onChange={set('serialNo')} />
              </div>
              <div className="wb-field">
                <WbLabel>Copy No. :</WbLabel>
                <WbSearchInput value={form.copyNo} onChange={set('copyNo')} />
              </div>
              <div className="wb-field">
                <WbLabel>Vehicle No. :</WbLabel>
                <WbSearchInput value={form.vehicleNo} onChange={set('vehicleNo')} list="wb-vehicles" uppercase />
                <datalist id="wb-vehicles">{vehicleOptions.map(v => <option key={v} value={v} />)}</datalist>
              </div>
              <div className="wb-field">
                <WbLabel>Entry Date :</WbLabel>
                <WbDateInput value={form.entryDate} onChange={set('entryDate')} />
              </div>
              <div className="wb-field">
                <WbLabel>Operator Name :</WbLabel>
                <select value={form.operatorName} onChange={e => set('operatorName')(e.target.value)} className="wb-input wb-select">
                  <option value="">Select</option>
                  {operatorOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* WEIGHT DETAILS */}
        <section className="wb-card">
          <div className="wb-section-head">
            <Truck className="w-4 h-4" />
            <span>WEIGHT DETAILS</span>
          </div>
          <div className="wb-section-body">
            <div className="wb-weight-grid">
              <div className="wb-weight-panel">
                <div className="wb-weight-title gross">GROSS</div>
                <div className="wb-weight-fields">
                  <div className="wb-field">
                    <WbLabel>Gross Weight (KG) :</WbLabel>
                    <NumericInput value={form.grossWeightKg} onChange={set('grossWeightKg')} className="wb-input" />
                  </div>
                  <div className="wb-field">
                    <WbLabel>Date :</WbLabel>
                    <WbDateInput value={form.grossDate} onChange={set('grossDate')} />
                  </div>
                  <div className="wb-field">
                    <WbLabel>Time :</WbLabel>
                    <WbTimeInput value={form.grossTime} onChange={set('grossTime')} />
                  </div>
                </div>
              </div>
              <div className="wb-weight-panel">
                <div className="wb-weight-title tare">TARE</div>
                <div className="wb-weight-fields">
                  <div className="wb-field">
                    <WbLabel>Tare Weight (KG) :</WbLabel>
                    <NumericInput value={form.tareWeightKg} onChange={set('tareWeightKg')} className="wb-input" />
                  </div>
                  <div className="wb-field">
                    <WbLabel>Date :</WbLabel>
                    <WbDateInput value={form.tareDate} onChange={set('tareDate')} />
                  </div>
                  <div className="wb-field">
                    <WbLabel>Time :</WbLabel>
                    <WbTimeInput value={form.tareTime} onChange={set('tareTime')} />
                  </div>
                </div>
              </div>
            </div>
            <div className="wb-net-row">
              <WbLabel className="wb-net-label">NET WEIGHT (KG) :</WbLabel>
              <input readOnly value={netKg > 0 ? fmtKg(netKg) : ''} className="wb-net-value" />
              <span className="wb-net-note">( Auto Calculated )</span>
            </div>
          </div>
        </section>

        {/* OTHER DETAILS */}
        <section className="wb-card">
          <div className="wb-section-head">
            <FileText className="w-4 h-4" />
            <span>OTHER DETAILS</span>
          </div>
          <div className="wb-section-body">
            <div className="wb-other-grid">
              <div className="wb-field wb-charges-field">
                <WbLabel>Charges (₹) :</WbLabel>
                <NumericInput value={form.charges} onChange={set('charges')} className="wb-input" />
              </div>
              <div className="wb-field wb-remark-field">
                <WbLabel>Remark :</WbLabel>
                <input value={form.remark} onChange={e => set('remark')(e.target.value)} className="wb-input" />
              </div>
            </div>
          </div>
        </section>

        {/* RECENT ENTRIES + SEARCH */}
        <div className="wb-bottom-grid">
          <section className="wb-card wb-card-dark-head">
            <div className="wb-panel-head">RECENT ENTRIES</div>
            <div className="wb-table-wrap">
              <table className="wb-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Entry Date</th>
                    <th>Serial No.</th>
                    <th>Copy No.</th>
                    <th>Vehicle No.</th>
                    <th>Gross (KG)</th>
                    <th>Tare (KG)</th>
                    <th>Net (KG)</th>
                    <th>Charges (₹)</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="wb-empty">No entries found</td></tr>
                  ) : filtered.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => loadRecord(row)}
                      className={selectedRowId === row.id ? 'wb-row-selected' : idx % 2 === 0 ? 'wb-row-alt' : ''}
                    >
                      <td>{idx + 1}</td>
                      <td>{fmtDisplayDate(row.entryDate)}</td>
                      <td>{row.serialNo}</td>
                      <td>{row.copyNo}</td>
                      <td>{row.vehicleNo}</td>
                      <td>{fmtKg(row.grossWeightKg)}</td>
                      <td>{fmtKg(row.tareWeightKg)}</td>
                      <td>{fmtKg(row.netWeightKg)}</td>
                      <td>{row.charges > 0 ? fmtRs(row.charges) : ''}</td>
                      <td>{row.operatorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="wb-table-footer">Total Records : {filtered.length}</div>
          </section>

          <section className="wb-card wb-card-dark-head">
            <div className="wb-panel-head">SEARCH</div>
            <div className="wb-search-body">
              <div className="wb-search-dates">
                <div className="wb-search-field">
                  <label>From Date</label>
                  <WbDateInput value={fromDate} onChange={setFromDate} />
                </div>
                <div className="wb-search-field">
                  <label>To Date</label>
                  <WbDateInput value={toDate} onChange={setToDate} />
                </div>
              </div>
              <div className="wb-search-field">
                <label>Serial No.</label>
                <input value={searchSerial} onChange={e => setSearchSerial(e.target.value)} className="wb-input" />
              </div>
              <div className="wb-search-field">
                <label>Vehicle No.</label>
                <input value={searchVehicle} onChange={e => setSearchVehicle(upper(e.target.value))} className="wb-input uppercase" />
              </div>
              <div className="wb-search-actions">
                <button type="button" onClick={handleSearch} className="wb-btn wb-btn-navy">
                  <Search className="w-4 h-4" /> Search
                </button>
                <button type="button" onClick={handleClear} className="wb-btn wb-btn-orange">
                  <RotateCcw className="w-4 h-4" /> Clear
                </button>
                <button type="button" onClick={handleExcel} className="wb-btn wb-btn-green">
                  <FileSpreadsheet className="w-4 h-4" /> Excel
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="hidden print:block">
        <WeightBridgePrint data={buildPrintData()} />
      </div>
    </>
  );
};
