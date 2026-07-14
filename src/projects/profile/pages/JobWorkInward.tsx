import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, ClipboardList, Grid3x3, HardHat, StickyNote, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import {
  JobWorkTitleBar, JobWorkSection, LabourDetailsGrid, JobWorkFooter,
  jwInput, jwLabel, req, MobileField, AddRowBtn,
} from '../components/JobWorkFormParts';
import { useAppContext, MATERIAL_GRADES, type PartyMaster } from '../store/AppContext';
import {
  emptyMaterialRow, emptyLabour, fmtKg3, hydrateMaterialRow, labourAmount,
  nextJobWorkNo, type JobWorkInwardRecord, type JobWorkMaterialRow,
} from '../utils/jobWorkHelpers';

export const JobWorkInward: React.FC = () => {
  const { jobWorkInwards, setJobWorkInwards, jobWorkOutwards, persistErpNow } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [inwardNo, setInwardNo] = useState(() =>
    nextJobWorkNo('IN', jobWorkInwards.map(r => r.inwardNo), today));
  const [inwardDate, setInwardDate] = useState(today);
  const [againstOutwardNo, setAgainstOutwardNo] = useState('');
  const [outwardDate, setOutwardDate] = useState('');
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<JobWorkMaterialRow[]>([
    emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(),
  ]);
  const [labour, setLabour] = useState(emptyLabour());

  const selectedOutward = useMemo(
    () => jobWorkOutwards.find(o => o.outwardNo === againstOutwardNo),
    [jobWorkOutwards, againstOutwardNo],
  );

  useEffect(() => {
    if (!selectedOutward) return;
    setOutwardDate(selectedOutward.outwardDate);
    if (!partyName) {
      setPartyName(selectedOutward.partyName);
      setAddress(selectedOutward.address);
      setMobileNo(selectedOutward.mobileNo);
    }
  }, [selectedOutward, partyName]);

  const updateRow = (id: string, field: keyof JobWorkMaterialRow, value: unknown) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } as JobWorkMaterialRow : r)));
  };

  const totalReceivedKg = useMemo(() => rows.reduce((s, r) => s + parseNum(r.receivedKg), 0), [rows]);

  const handleSelectParty = (party: PartyMaster) => {
    setPartyName(party.partyName);
    setAddress(party.address || '');
    setMobileNo(party.mobileNumber || '');
  };

  const resetForm = useCallback(() => {
    const d = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setInwardNo(nextJobWorkNo('IN', jobWorkInwards.map(r => r.inwardNo), d));
    setInwardDate(d);
    setAgainstOutwardNo('');
    setOutwardDate('');
    setPartyName('');
    setAddress('');
    setMobileNo('');
    setVehicleNo('');
    setNote('');
    setRows([emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow(), emptyMaterialRow()]);
    setLabour(emptyLabour());
  }, [jobWorkInwards]);

  const loadRecord = (rec: JobWorkInwardRecord) => {
    setEditingId(rec.id);
    setInwardNo(rec.inwardNo);
    setInwardDate(rec.inwardDate);
    setAgainstOutwardNo(rec.againstOutwardNo);
    setOutwardDate(rec.outwardDate);
    setPartyName(rec.partyName);
    setAddress(rec.address);
    setMobileNo(rec.mobileNo);
    setVehicleNo(rec.vehicleNo);
    setNote(rec.note);
    setRows(rec.rows.length ? [...rec.rows] : [emptyMaterialRow()]);
    setLabour(rec.labour);
    setShowSearch(false);
    toast.success(`Loaded ${rec.inwardNo}`);
  };

  const handleSave = async () => {
    if (!partyName.trim()) { toast.error('Enter party name'); return; }
    if (!againstOutwardNo) { toast.error('Select against outward no'); return; }
    const filled = rows.filter(r => r.grade && parseNum(r.receivedKg) > 0);
    if (filled.length === 0) { toast.error('Add at least one material return row'); return; }

    const record: JobWorkInwardRecord = {
      id: editingId || Date.now().toString(),
      inwardNo,
      inwardDate,
      againstOutwardNo,
      outwardDate: outwardDate || selectedOutward?.outwardDate || '',
      partyName: partyName.trim(),
      address: address.trim(),
      mobileNo: mobileNo.trim(),
      vehicleNo: vehicleNo.trim(),
      note: note.trim(),
      rows: filled,
      labour,
      totalReceivedKg: parseFloat(totalReceivedKg.toFixed(3)),
      totalLabour: labourAmount(labour),
    };

    const next = editingId
      ? jobWorkInwards.map(r => r.id === record.id ? record : r)
      : [record, ...jobWorkInwards];

    setJobWorkInwards(next);
    try {
      await persistErpNow({ jobWorkInwards: next });
      toast.success(`Job Work Inward ${inwardNo} saved`);
      setEditingId(record.id);
      if (!editingId) {
        setInwardNo(nextJobWorkNo('IN', next.map(r => r.inwardNo), inwardDate));
      }
    } catch {
      toast.error('Saved locally but server sync failed');
    }
  };

  const handleDelete = async () => {
    if (!editingId) { toast.error('Select a record to delete'); return; }
    if (!window.confirm('Delete this inward record?')) return;
    const next = jobWorkInwards.filter(r => r.id !== editingId);
    setJobWorkInwards(next);
    try {
      await persistErpNow({ jobWorkInwards: next });
      toast.success('Record deleted');
      resetForm();
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  return (
    <div className="jw-page fade-in print:hidden">
      <JobWorkTitleBar title="Job Work Inward (Material Return)" />

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
              <label className={jwLabel}>Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter Address"
                rows={3}
                className={`${jwInput} resize-none`}
              />
            </div>
            <div>
              <label className={jwLabel}>Mobile No.</label>
              <MobileField value={mobileNo} onChange={setMobileNo} />
            </div>
          </div>
        </JobWorkSection>

        <JobWorkSection icon={ClipboardList} title="Inward Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={jwLabel}>Inward No. {req}</label>
              <input value={inwardNo} readOnly className={`${jwInput} bg-slate-50 font-mono font-bold`} />
            </div>
            <div>
              <label className={jwLabel}>Inward Date {req}</label>
              <input type="date" value={inwardDate} onChange={e => setInwardDate(e.target.value)} className={jwInput} />
            </div>
            <div>
              <label className={jwLabel}>Against Outward No. {req}</label>
              <div className="flex gap-1">
                <select value={againstOutwardNo} onChange={e => setAgainstOutwardNo(e.target.value)} className={jwInput}>
                  <option value="">Select Outward No</option>
                  {jobWorkOutwards.map(o => (
                    <option key={o.id} value={o.outwardNo}>{o.outwardNo} — {o.partyName}</option>
                  ))}
                </select>
                <button type="button" className="jw-icon-btn" title="Search outward">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className={jwLabel}>Outward Date</label>
              <input type="date" value={outwardDate} readOnly className={`${jwInput} bg-slate-50`} />
            </div>
            <div className="sm:col-span-2">
              <label className={jwLabel}>Vehicle No.</label>
              <input value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="Enter Vehicle No." className={jwInput} />
            </div>
          </div>
        </JobWorkSection>
      </div>

      <JobWorkSection icon={Grid3x3} title="Material Return Details">
        <div className="overflow-x-auto">
          <table className="jw-table w-full">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Grade {req}</th>
                <th>Thickness (mm)</th>
                <th>Width (mm)</th>
                <th>Length (mm)</th>
                <th>Nos</th>
                <th>Received KG {req}</th>
                <th>Remark</th>
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
                  <td><NumericInput value={r.receivedKg} onChange={v => updateRow(r.id, 'receivedKg', v)} className={`${jwInput} text-right`} /></td>
                  <td><input value={r.remark} onChange={e => updateRow(r.id, 'remark', e.target.value)} placeholder="Enter Remark" className={jwInput} /></td>
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
                <td colSpan={6} className="text-right font-extrabold">TOTAL RECEIVED KG :</td>
                <td colSpan={3} className="text-right font-black text-brand-blue">{fmtKg3(totalReceivedKg)}</td>
              </tr>
            </tfoot>
          </table>
          <AddRowBtn onClick={() => setRows(prev => [...prev, emptyMaterialRow()])} />
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
          <div className="jw-panel-head">Saved Inward Records</div>
          <div className="overflow-x-auto">
            <table className="jw-table w-full">
              <thead>
                <tr>
                  <th>Inward No</th>
                  <th>Date</th>
                  <th>Against Outward</th>
                  <th>Received KG</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobWorkInwards.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-slate-400 italic py-4">No records</td></tr>
                ) : jobWorkInwards.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono font-bold">{r.inwardNo}</td>
                    <td>{r.inwardDate}</td>
                    <td>{r.againstOutwardNo}</td>
                    <td className="text-right">{fmtKg3(r.totalReceivedKg)}</td>
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
        onPrint={() => window.print()}
        onSearch={() => setShowSearch(s => !s)}
        onWhatsApp={() => toast('WhatsApp / PDF coming soon')}
        onClear={() => { resetForm(); toast('Form cleared'); }}
      />
    </div>
  );
};
