import React, { useState, useMemo, useCallback } from 'react';
import { User, ClipboardList, Grid3x3, HardHat, StickyNote, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { JobWorkOutwardPrint } from '../components/JobWorkOutwardPrint';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import {
  JobWorkTitleBar, JobWorkSection, LabourDetailsGrid, JobWorkFooter,
  jwInput, jwLabel, req, MobileField, AddRowBtn,
} from '../components/JobWorkFormParts';
import { useAppContext, MATERIAL_GRADES, type PartyMaster } from '../store/AppContext';
import {
  emptyMaterialRow, emptyLabour, fmtKg3,
  hydrateMaterialRow, labourAmount, nextJobWorkNo,
  type JobWorkMaterialRow, type JobWorkOutwardRecord,
} from '../utils/jobWorkHelpers';
import { generateJobWorkOutwardPDF, getJobWorkOutwardPdfBase64 } from '../utils/jobWorkOutwardDownload';
import { sendWhatsAppMedia } from '../utils/whatsappApi';

export const JobWorkOutward: React.FC = () => {
  const { jobWorkOutwards, setJobWorkOutwards, parties, workers, persistErpNow, user } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [outwardNo, setOutwardNo] = useState(() =>
    nextJobWorkNo('OUT', jobWorkOutwards.map(r => r.outwardNo), today));
  const [outwardDate, setOutwardDate] = useState(today);
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [partyCuttingName, setPartyCuttingName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<JobWorkMaterialRow[]>([
    emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(),
  ]);
  const [labour, setLabour] = useState(emptyLabour());

  const cuttingOptions = useMemo(() => {
    const names = new Set<string>();
    workers.forEach(w => w.name && names.add(w.name));
    parties.forEach(p => p.partyName && names.add(p.partyName));
    return Array.from(names).sort();
  }, [workers, parties]);

  const updateRow = (id: string, field: keyof JobWorkMaterialRow, value: unknown) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value } as JobWorkMaterialRow;
      return hydrateMaterialRow(updated);
    }));
  };

  const totalCalcKg = useMemo(() => rows.reduce((s, r) => s + parseNum(r.calculatedKg), 0), [rows]);
  const totalActualKg = useMemo(() => rows.reduce((s, r) => s + parseNum(r.actualKg), 0), [rows]);
  const totalLabour = labourAmount(labour);

  const handleSelectParty = (party: PartyMaster) => {
    setPartyName(party.partyName);
    setAddress(party.address || '');
    setMobileNo(party.mobileNumber || '');
  };

  const resetForm = useCallback(() => {
    const d = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setOutwardNo(nextJobWorkNo('OUT', jobWorkOutwards.map(r => r.outwardNo), d));
    setOutwardDate(d);
    setPartyName('');
    setAddress('');
    setMobileNo('');
    setPartyCuttingName('');
    setVehicleNo('');
    setNote('');
    setRows([emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow()]);
    setLabour(emptyLabour());
  }, [jobWorkOutwards]);

  const loadRecord = (rec: JobWorkOutwardRecord) => {
    setEditingId(rec.id);
    setOutwardNo(rec.outwardNo);
    setOutwardDate(rec.outwardDate);
    setPartyName(rec.partyName);
    setAddress(rec.address);
    setMobileNo(rec.mobileNo);
    setPartyCuttingName(rec.partyCuttingName);
    setVehicleNo(rec.vehicleNo);
    setNote(rec.note);
    setRows(rec.rows.length ? rec.rows.map(hydrateMaterialRow) : [emptyMaterialRow()]);
    setLabour(rec.labour);
    setShowSearch(false);
    toast.success(`Loaded ${rec.outwardNo}`);
  };

  const handleSave = async () => {
    if (!partyName.trim()) { toast.error('Enter party name'); return; }
    const filled = rows.filter(r => r.grade && (parseNum(r.actualKg) > 0 || parseNum(r.calculatedKg) > 0));
    if (filled.length === 0) { toast.error('Add at least one material row'); return; }

    const record: JobWorkOutwardRecord = {
      id: editingId || Date.now().toString(),
      outwardNo,
      outwardDate,
      partyName: partyName.trim(),
      address: address.trim(),
      mobileNo: mobileNo.trim(),
      partyCuttingName: partyCuttingName.trim(),
      vehicleNo: vehicleNo.trim(),
      note: note.trim(),
      rows: filled.map(hydrateMaterialRow),
      labour,
      totalCalculatedKg: parseFloat(totalCalcKg.toFixed(3)),
      totalActualKg: parseFloat(totalActualKg.toFixed(3)),
      totalLabour,
    };

    const next = editingId
      ? jobWorkOutwards.map(r => r.id === record.id ? record : r)
      : [record, ...jobWorkOutwards];

    setJobWorkOutwards(next);
    try {
      await persistErpNow({ jobWorkOutwards: next });
      toast.success(`Job Work Outward ${outwardNo} saved`);
      setEditingId(record.id);
      if (!editingId) {
        setOutwardNo(nextJobWorkNo('OUT', next.map(r => r.outwardNo), outwardDate));
      }
    } catch {
      toast.error('Saved locally but server sync failed');
    }
  };

  const handleDelete = async () => {
    if (!editingId) { toast.error('Select a record to delete'); return; }
    if (!window.confirm('Delete this outward record?')) return;
    const next = jobWorkOutwards.filter(r => r.id !== editingId);
    setJobWorkOutwards(next);
    try {
      await persistErpNow({ jobWorkOutwards: next });
      toast.success('Record deleted');
      resetForm();
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  const buildCurrentRecord = useCallback((): JobWorkOutwardRecord => {
    const filled = rows.filter(r => r.grade && (parseNum(r.actualKg) > 0 || parseNum(r.calculatedKg) > 0));
    return {
      id: editingId || 'draft',
      outwardNo,
      outwardDate,
      partyName: partyName.trim(),
      address: address.trim(),
      mobileNo: mobileNo.trim(),
      partyCuttingName: partyCuttingName.trim(),
      vehicleNo: vehicleNo.trim(),
      note: note.trim(),
      rows: filled.length ? filled.map(hydrateMaterialRow) : rows.map(hydrateMaterialRow),
      labour,
      totalCalculatedKg: parseFloat(totalCalcKg.toFixed(3)),
      totalActualKg: parseFloat(totalActualKg.toFixed(3)),
      totalLabour,
    };
  }, [
    editingId, outwardNo, outwardDate, partyName, address, mobileNo, partyCuttingName,
    vehicleNo, note, rows, labour, totalCalcKg, totalActualKg, totalLabour,
  ]);

  const handlePrint = () => {
    if (!partyName.trim()) { toast.error('Enter party name before printing'); return; }
    window.print();
  };

  const handlePdf = async () => {
    if (!partyName.trim()) { toast.error('Enter party name before download'); return; }
    const record = buildCurrentRecord();
    const userName = user?.displayName || user?.username;
    toast.loading('Generating PDF...', { id: 'jw-out-pdf' });
    try {
      await generateJobWorkOutwardPDF(record, userName);
      toast.success(`PDF downloaded: ${outwardNo}`, { id: 'jw-out-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'jw-out-pdf' });
    }
  };

  const handleWhatsApp = async () => {
    if (!partyName.trim()) { toast.error('Enter party name'); return; }
    const record = buildCurrentRecord();
    const userName = user?.displayName || user?.username;

    if (!mobileNo.trim()) {
      await handlePdf();
      return;
    }

    toast.loading('Sending WhatsApp...', { id: 'jw-out-wa' });
    try {
      const pdfBase64 = await getJobWorkOutwardPdfBase64(record, userName);
      if (!pdfBase64) throw new Error('PDF generation failed');
      await sendWhatsAppMedia({
        number: mobileNo.trim(),
        mediaData: pdfBase64,
        fileName: `JobWork_Outward_${outwardNo.replace(/\//g, '_')}.pdf`,
        caption: `Job Work Material Outward Challan\nOutward No: ${outwardNo}\nParty: ${partyName.trim()}`,
      });
      toast.success('WhatsApp sent', { id: 'jw-out-wa' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'WhatsApp send failed', { id: 'jw-out-wa' });
    }
  };

  return (
    <>
    <div className="jw-page fade-in print:hidden">
      <JobWorkTitleBar title="Job Work Outward" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <JobWorkSection icon={User} title="Party Details">
          <div className="space-y-3">
            <div>
              <label className={jwLabel}>Party Name {req}</label>
              <PartyAutocomplete
                value={partyName}
                onChange={setPartyName}
                onSelectParty={handleSelectParty}
                placeholder="Select / Enter Party Name"
                className={jwInput}
              />
            </div>
            <div>
              <label className={jwLabel}>Address {req}</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter Address"
                rows={3}
                className={`${jwInput} resize-none`}
              />
            </div>
            <div>
              <label className={jwLabel}>Mobile No. {req}</label>
              <MobileField value={mobileNo} onChange={setMobileNo} />
            </div>
          </div>
        </JobWorkSection>

        <JobWorkSection icon={ClipboardList} title="Outward Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={jwLabel}>Outward No. {req}</label>
              <input value={outwardNo} readOnly className={`${jwInput} bg-slate-50 font-mono font-bold`} />
            </div>
            <div>
              <label className={jwLabel}>Outward Date {req}</label>
              <input type="date" value={outwardDate} onChange={e => setOutwardDate(e.target.value)} className={jwInput} />
            </div>
            <div className="sm:col-span-2">
              <label className={jwLabel}>Party Cutting Name</label>
              <select value={partyCuttingName} onChange={e => setPartyCuttingName(e.target.value)} className={jwInput}>
                <option value="">Select / Enter Party Cutting Name</option>
                {cuttingOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={jwLabel}>Vehicle No.</label>
              <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Enter Vehicle No." className={jwInput} />
            </div>
          </div>
        </JobWorkSection>
      </div>

      <JobWorkSection icon={Grid3x3} title="Material Entry">
        <div className="overflow-x-auto">
          <table className="jw-table w-full">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Grade {req}</th>
                <th>Thickness (mm) {req}</th>
                <th>Width (mm) {req}</th>
                <th>Length (mm) {req}</th>
                <th>Nos</th>
                <th>Calculated KG (Auto)</th>
                <th>Actual KG {req}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>
                    <select value={r.grade} onChange={e => updateRow(r.id, 'grade', e.target.value)} className={jwInput}>
                      <option value="">Select Grade</option>
                      {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </td>
                  <td><NumericInput value={r.thickness} onChange={v => updateRow(r.id, 'thickness', v)} className={`${jwInput} text-right`} /></td>
                  <td><NumericInput value={r.width} onChange={v => updateRow(r.id, 'width', v)} className={`${jwInput} text-right`} /></td>
                  <td><NumericInput value={r.length} onChange={v => updateRow(r.id, 'length', v)} className={`${jwInput} text-right`} /></td>
                  <td><NumericInput value={r.nos} onChange={v => updateRow(r.id, 'nos', v)} className={`${jwInput} text-right`} /></td>
                  <td className="text-right font-bold text-brand-blue">{fmtKg3(r.calculatedKg)}</td>
                  <td><NumericInput value={r.actualKg} onChange={v => updateRow(r.id, 'actualKg', v)} className={`${jwInput} text-right`} /></td>
                  <td>
                    <button type="button" onClick={() => setRows(prev => prev.length > 1 ? prev.filter(x => x.id !== r.id) : prev)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="text-right font-extrabold">TOTAL :</td>
                <td className="text-right font-black text-brand-blue">{fmtKg3(totalCalcKg)}</td>
                <td className="text-right font-black text-brand-blue">{fmtKg3(totalActualKg)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          <AddRowBtn onClick={() => setRows(prev => [...prev, emptyMaterialRow()])} />
          <div className="jw-formula-note mt-3">
            Calculated KG Formula : Thickness × Width × Length × Nos × 8 / 10,00,000
          </div>
        </div>
      </JobWorkSection>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <JobWorkSection icon={HardHat} title="Labour Details">
          <LabourDetailsGrid labour={labour} onChange={(f, v) => setLabour(prev => ({ ...prev, [f]: v }))} />
        </JobWorkSection>
        <JobWorkSection icon={StickyNote} title="Note">
          <label className={jwLabel}>Note / Remark</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Enter Note / Remark"
            rows={6}
            className={`${jwInput} resize-none min-h-[8rem]`}
          />
        </JobWorkSection>
      </div>

      {showSearch && (
        <div className="jw-panel">
          <div className="jw-panel-head">Saved Outward Records</div>
          <div className="overflow-x-auto">
            <table className="jw-table w-full">
              <thead>
                <tr>
                  <th>Outward No</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Actual KG</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobWorkOutwards.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-slate-400 italic py-4">No records</td></tr>
                ) : jobWorkOutwards.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono font-bold">{r.outwardNo}</td>
                    <td>{r.outwardDate}</td>
                    <td>{r.partyName}</td>
                    <td className="text-right">{fmtKg3(r.totalActualKg)}</td>
                    <td>
                      <button type="button" onClick={() => loadRecord(r)} className="text-brand-blue font-bold text-xs hover:underline">Load</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <JobWorkFooter
        onSave={() => void handleSave()}
        onEdit={() => setShowSearch(true)}
        onDelete={() => void handleDelete()}
        onPrint={handlePrint}
        onPdf={() => void handlePdf()}
        onSearch={() => setShowSearch(s => !s)}
        onWhatsApp={() => void handleWhatsApp()}
        onClear={() => { resetForm(); toast('Form cleared'); }}
      />
    </div>

    <div className="hidden print:block">
      <JobWorkOutwardPrint
        record={buildCurrentRecord()}
        userName={user?.displayName || user?.username}
      />
    </div>
    </>
  );
};
