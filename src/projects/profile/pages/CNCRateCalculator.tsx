import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ClipboardList, Calculator, Save, Printer, FileDown, MessageSquare,
  RotateCcw, X, Plus, Settings, Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MATERIAL_GRADES, useAppContext } from '../store/AppContext';
import type { PartyMaster } from '../store/AppContext';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { EditableSelect } from '../components/EditableSelect';
import { NumericInput, parseNum } from '../components/NumericInput';
import { CNCRateCalculationPrint, type CNCRateCalcPrintData } from '../components/CNCRateCalculationPrint';
import { generateCNCRateCalculationPDF, getCNCRateCalculationPdfBase64 } from '../utils/cncRateCalculationDownload';
import { sendWhatsAppMedia, buildWhatsAppCNCRateMessage } from '../utils/whatsappApi';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { ErpHotkeyLabel } from '../components/ErpHotkeyLabel';

const getBurningLossMM = (thk: number): number => {
  if (thk <= 12) return 3;
  if (thk <= 35) return 4;
  if (thk <= 100) return 6;
  if (thk <= 150) return 8;
  return 10;
};

const fmtNum = (n: number, dec = 2) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtINR = (n: number) => `₹ ${fmtNum(n)}`;

const getFinancialYear = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = m >= 3 ? y : y - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
};

const nextInquiryNo = () => {
  const fy = getFinancialYear(new Date().toISOString().split('T')[0]);
  const [a, b] = fy.split('-');
  const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
  return `JP${a.slice(-2)}/${b}/${seq}`;
};

const emptyForm = () => ({
  partyName: '',
  drawingNo: '',
  partNo: '',
  grade: 'C45',
  thickness: '',
  width: '',
  length: '',
  plateNos: '1',
  finishGoodNos: '1',
  finishGoodWeight: '',
  cuttingMtr: '',
  piercingNos: '',
  burningLossMM: '3',
  plateRate: '',
  scrapRate: '',
  labourRate: '',
  piercingRate: '',
  remarks: '',
});

const UnitInput: React.FC<{
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  info?: boolean;
}> = ({ label, value, onChange, unit, info }) => (
  <div>
    <label className="cnc-calc-label">
      {label} {info && <Info className="inline w-3 h-3 text-slate-400 ml-0.5" title="Burning loss factor (mm) — auto from thickness" />}
    </label>
    <div className="cnc-calc-unit-wrap">
      <NumericInput value={value} onChange={onChange}
        className="cnc-calc-input cnc-calc-input-unit" />
      <span className="cnc-calc-unit">{unit}</span>
    </div>
  </div>
);

const CalcRow: React.FC<{ label: string; value: string; accent?: 'blue' | 'red' | 'green' | 'total' }> = ({ label, value, accent }) => (
  <div className={accent === 'total' ? 'cnc-calc-total-row' : 'cnc-calc-calc-row'}>
    <span className="cnc-calc-calc-label">{label}</span>
    <span className={
      accent === 'blue' ? 'cnc-calc-val-blue' :
      accent === 'red' ? 'cnc-calc-val-red' :
      accent === 'green' ? 'cnc-calc-val-green' :
      accent === 'total' ? 'cnc-calc-val-total' : 'cnc-calc-val'
    }>{value}</span>
  </div>
);

export const CNCRateCalculator: React.FC = () => {
  const navigate = useNavigate();
  const { parties, user, cncRateCalculations, setCNCRateCalculations, persistErpNow } = useAppContext();
  const today = new Date().toISOString().split('T')[0];

  const [inquiryDate, setInquiryDate] = useState(today);
  const [inquiryNo, setInquiryNo] = useState(nextInquiryNo);
  const [form, setForm] = useState(emptyForm);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [pdfForSend, setPdfForSend] = useState<string | null>(null);
  const [pendingWhatsApp, setPendingWhatsApp] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const set = (field: keyof ReturnType<typeof emptyForm>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setThickness = (value: string) => {
    setForm(prev => ({
      ...prev,
      thickness: value,
      burningLossMM: String(getBurningLossMM(parseNum(value))),
    }));
  };

  const calc = useMemo(() => {
    const t = parseNum(form.thickness);
    const w = parseNum(form.width);
    const l = parseNum(form.length);
    const plateNos = parseNum(form.plateNos);
    const fgWeight = parseNum(form.finishGoodWeight);
    const fgNos = parseNum(form.finishGoodNos);
    const mtr = parseNum(form.cuttingMtr);
    const piercingNos = parseNum(form.piercingNos);
    const burnMM = parseNum(form.burningLossMM);
    const plateRate = parseNum(form.plateRate);
    const scrapRate = parseNum(form.scrapRate);
    const labourRate = parseNum(form.labourRate);
    const piercingRate = parseNum(form.piercingRate);

    const plateWeightPer = (t * w * l * 8) / 1_000_000;
    const plateWeight = plateWeightPer * plateNos;
    const burningLossWeight = (mtr * t * burnMM * 8) / 1000;
    const scrapWeight = Math.max(0, plateWeight - fgWeight - burningLossWeight);
    const scrapAmount = scrapWeight * scrapRate;
    const plateAmount = plateWeight * plateRate;
    const labourAmount = mtr * labourRate;
    const piercingAmount = piercingNos * piercingRate;
    const finalCost = plateAmount - scrapAmount + labourAmount + piercingAmount;
    const ratePerKg = fgWeight > 0 ? finalCost / fgWeight : 0;
    const ratePerNos = fgNos > 0 ? finalCost / fgNos : 0;

    return {
      plateWeight, burningLossWeight, scrapWeight, scrapAmount, plateAmount,
      labourAmount, piercingAmount, finalCost, ratePerKg, ratePerNos,
      plateRate, scrapRate, labourRate, piercingRate,
    };
  }, [form]);

  const handleSelectParty = (party: PartyMaster) => {
    set('partyName', party.partyName);
    toast.success('Party selected from Party Master', { icon: '✨' });
  };

  const handleNew = useCallback(() => {
    setForm(emptyForm());
    setInquiryNo(nextInquiryNo());
    setInquiryDate(today);
    toast('New CNC rate entry');
  }, [today]);

  const handleSave = useCallback(async () => {
    if (!form.partyName.trim()) { toast.error('Party Name is required'); return; }
    const record = {
      id: Date.now().toString(),
      inquiryNo,
      inquiryDate,
      partyName: form.partyName.trim(),
      form: { ...form },
      savedAt: new Date().toISOString(),
    };
    const next = [record, ...cncRateCalculations];
    setCNCRateCalculations(next);
    try {
      await persistErpNow({ cncRateCalculations: next });
      toast.success('CNC rate saved');
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  }, [form, inquiryNo, inquiryDate, cncRateCalculations, setCNCRateCalculations, persistErpNow]);

  const handleCancel = useCallback(() => navigate(-1), [navigate]);

  const party = parties.find(p => p.partyName === form.partyName);

  const printData = useMemo((): CNCRateCalcPrintData => ({
    inquiryNo,
    inquiryDate: new Date(inquiryDate + 'T12:00:00').toLocaleDateString('en-GB').replace(/\//g, '-'),
    partyName: form.partyName,
    partyAddress: party?.address || party?.deliveryAddress || party?.location || '',
    partyMobile: party?.mobileNumber || party?.mobile2 || '',
    partyContact: party?.contactPerson || '',
    partyEmail: party?.email || '',
    partyGst: party?.gstNumber || '',
    drawingNo: form.drawingNo,
    partNo: form.partNo,
    grade: form.grade,
    thickness: form.thickness,
    width: form.width,
    length: form.length,
    plateNos: form.plateNos,
    finishGoodNos: form.finishGoodNos,
    finishGoodWeight: form.finishGoodWeight,
    cuttingMtr: form.cuttingMtr,
    piercingNos: form.piercingNos,
    burningLossMM: form.burningLossMM,
    plateRate: form.plateRate,
    scrapRate: form.scrapRate,
    labourRate: form.labourRate,
    piercingRate: form.piercingRate,
    remarks: form.remarks,
    plateWeight: calc.plateWeight,
    burningLossWeight: calc.burningLossWeight,
    scrapWeight: calc.scrapWeight,
    scrapAmount: calc.scrapAmount,
    plateAmount: calc.plateAmount,
    labourAmount: calc.labourAmount,
    piercingAmount: calc.piercingAmount,
    finalCost: calc.finalCost,
    ratePerKg: calc.ratePerKg,
    ratePerNos: calc.ratePerNos,
    userName: user?.displayName || user?.username,
  }), [inquiryNo, inquiryDate, form, party, calc, user]);

  const handlePrint = useCallback(() => window.print(), []);

  const handlePdf = useCallback(async () => {
    toast.loading('Generating PDF...', { id: 'cnc-rate-pdf' });
    try {
      await generateCNCRateCalculationPDF(printData);
      toast.success('PDF downloaded', { id: 'cnc-rate-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'cnc-rate-pdf' });
    }
  }, [printData]);

  const handleWhatsApp = useCallback(() => {
    if (!form.partyName.trim()) {
      toast.error('Party Name is required');
      return;
    }
    setWhatsAppData({
      number: (party?.mobileNumber || party?.mobile2 || '').trim(),
      message: buildWhatsAppCNCRateMessage(form.partyName.trim(), inquiryNo),
    });
    setPendingWhatsApp(true);
  }, [form.partyName, party, inquiryNo]);

  useEffect(() => {
    if (!pendingWhatsApp) return;
    void (async () => {
      const loadingToast = toast.loading('Preparing PDF for WhatsApp...');
      try {
        const pdf = await getCNCRateCalculationPdfBase64(printData);
        if (!pdf) {
          toast.error('Failed to generate PDF', { id: loadingToast });
          return;
        }
        setPdfForSend(pdf);
        setShowWhatsAppModal(true);
        toast.dismiss(loadingToast);
      } catch {
        toast.error('Failed to generate PDF', { id: loadingToast });
      } finally {
        setPendingWhatsApp(false);
      }
    })();
  }, [pendingWhatsApp, printData]);

  const sendWhatsApp = async () => {
    if (!whatsAppData.number.trim()) {
      toast.error('WhatsApp number is required');
      return;
    }
    if (!pdfForSend) {
      toast.error('PDF not ready — try again');
      return;
    }

    setIsSendingWhatsApp(true);
    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: whatsAppData.number,
        mediaData: pdfForSend,
        fileName: `CNC_Rate_${inquiryNo.replace(/[\\/:*?"<>|]/g, '_')}.pdf`,
        caption: whatsAppData.message,
      });
      toast.success('CNC rate sent on WhatsApp!', { id: loadingToast });
      setShowWhatsAppModal(false);
    } catch (err: unknown) {
      toast.error(`WhatsApp Error: ${(err as Error).message}`, { id: loadingToast });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleWhatsAppEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || isSendingWhatsApp) return;
    e.preventDefault();
    void sendWhatsApp();
  };

  const fy = getFinancialYear(inquiryDate);
  const req = <span className="text-red-500">*</span>;

  return (
    <>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #cnc-rate-calc-print-area, #cnc-rate-calc-print-area * { visibility: visible !important; }
        #cnc-rate-calc-print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 210mm !important;
          height: 297mm !important;
          max-width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          z-index: 99999 !important;
        }
      }
    `}</style>
    <div className="cnc-calc-page fade-in max-w-[1500px] mx-auto space-y-3 pb-4 print:hidden">
      {/* Inquiry bar */}
      <div className="cnc-calc-inquiry-bar">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="cnc-calc-inquiry-label">Inquiry No. (Auto)</label>
            <input readOnly value={inquiryNo} className="cnc-calc-inquiry-input font-mono font-bold" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="cnc-calc-inquiry-label">Inquiry Date (Auto)</label>
            <input readOnly value={new Date(inquiryDate + 'T12:00:00').toLocaleDateString('en-GB').replace(/\//g, '-')}
              className="cnc-calc-inquiry-input font-mono font-bold" />
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3">
        {/* LEFT — Entry Details */}
        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Entry Details
          </div>
          <div className="p-3 space-y-3">
            {/* Party */}
            <div>
              <label className="cnc-calc-label">Party Name {req}</label>
              <div className="flex gap-1.5">
                <div className="flex-1 min-w-0">
                  <PartyAutocomplete
                    value={form.partyName}
                    onChange={v => set('partyName', v)}
                    onSelectParty={handleSelectParty}
                    placeholder="Select party..."
                    className="cnc-calc-input !pl-9"
                  />
                </div>
                <button type="button" onClick={() => navigate('/party-master')}
                  className="cnc-calc-add-btn" title="Add Party">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawing & Part */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="cnc-calc-label">Drawing No.</label>
                <input value={form.drawingNo} onChange={e => set('drawingNo', e.target.value)}
                  className="cnc-calc-input" placeholder="Circle" />
              </div>
              <div>
                <label className="cnc-calc-label">&amp; Part No.</label>
                <input value={form.partNo} onChange={e => set('partNo', e.target.value)}
                  className="cnc-calc-input" placeholder="Circle" />
              </div>
            </div>

            {/* Grade */}
            <div>
              <label className="cnc-calc-label">Grade {req}</label>
              <EditableSelect
                value={form.grade}
                onChange={v => set('grade', v)}
                options={['C45', ...MATERIAL_GRADES]}
                placeholder="Select grade"
                className="cnc-calc-input"
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-3">
              <UnitInput label={<>Thickness (MM) {req}</>} value={form.thickness} onChange={setThickness} unit="mm" />
              <UnitInput label={<>Width (MM) {req}</>} value={form.width} onChange={v => set('width', v)} unit="mm" />
              <UnitInput label={<>Length (MM) {req}</>} value={form.length} onChange={v => set('length', v)} unit="mm" />
            </div>

            {/* Quantities */}
            <div className="grid grid-cols-3 gap-3">
              <UnitInput label={<>Plate Nos {req}</>} value={form.plateNos} onChange={v => set('plateNos', v)} unit="Nos" />
              <UnitInput label={<>Finish Good Nos {req}</>} value={form.finishGoodNos} onChange={v => set('finishGoodNos', v)} unit="Nos" />
              <UnitInput label={<>Finish Good Weight (KG) {req}</>} value={form.finishGoodWeight} onChange={v => set('finishGoodWeight', v)} unit="Kg" />
            </div>

            {/* Process */}
            <div className="grid grid-cols-3 gap-3">
              <UnitInput label={<>Cutting Mtr (Mtr) {req}</>} value={form.cuttingMtr} onChange={v => set('cuttingMtr', v)} unit="Mtr" />
              <UnitInput label={<>Piercing Nos {req}</>} value={form.piercingNos} onChange={v => set('piercingNos', v)} unit="Nos" />
              <UnitInput label={<>Burning Loss (MM) {req}</>} value={form.burningLossMM} onChange={v => set('burningLossMM', v)} unit="mm" info />
            </div>

            {/* Rates sub-section */}
            <div className="cnc-calc-rates-head">
              <Settings className="w-3.5 h-3.5" /> Rates &amp; Charges (Entry)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <UnitInput label={<>Plate Rate (₹/Kg) {req}</>} value={form.plateRate} onChange={v => set('plateRate', v)} unit="₹/Kg" />
              <UnitInput label={<>Scrap Rate (₹/Kg) {req}</>} value={form.scrapRate} onChange={v => set('scrapRate', v)} unit="₹/Kg" />
              <UnitInput label={<>Labour Rate (₹/Mtr) {req}</>} value={form.labourRate} onChange={v => set('labourRate', v)} unit="₹/Mtr" />
              <UnitInput label={<>Piercing Rate (₹/Nos) {req}</>} value={form.piercingRate} onChange={v => set('piercingRate', v)} unit="₹/Nos" />
            </div>

            {/* Remarks */}
            <div>
              <label className="cnc-calc-label">Remarks / Notes</label>
              <textarea rows={3} value={form.remarks} onChange={e => set('remarks', e.target.value)}
                className="cnc-calc-input resize-none" placeholder="Enter remarks..." />
            </div>
          </div>
        </div>

        {/* RIGHT — Auto Calculation */}
        <div className="tc-mgmt-panel">
          <div className="tc-mgmt-panel-head green flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Auto Calculation (Live)
          </div>
          <div className="p-3 space-y-0">
            <CalcRow label="Plate Weight" value={`${fmtNum(calc.plateWeight)} Kg`} />
            <CalcRow label="Burning Loss Weight" value={`${fmtNum(calc.burningLossWeight)} Kg`} />
            <CalcRow label="Scrap Weight" value={`${fmtNum(calc.scrapWeight)} Kg`} accent="blue" />
            <CalcRow label={`Scrap Amount (@ ₹ ${fmtNum(calc.scrapRate)} /Kg)`} value={fmtINR(calc.scrapAmount)} accent="red" />
            <CalcRow label="Finish Good Weight" value={`${fmtNum(parseNum(form.finishGoodWeight))} Kg`} accent="green" />
            <CalcRow label={`Plate Amount (@ ₹ ${fmtNum(calc.plateRate)} /Kg)`} value={fmtINR(calc.plateAmount)} />
            <CalcRow label={`Labour Amount (@ ₹ ${fmtNum(calc.labourRate)} /Mtr)`} value={fmtINR(calc.labourAmount)} />
            <CalcRow label={`Piercing Amount (@ ₹ ${fmtNum(calc.piercingRate)} /Nos)`} value={fmtINR(calc.piercingAmount)} />
            <CalcRow label="Final Cost (Total)" value={fmtINR(calc.finalCost)} accent="total" />
            <CalcRow label="Rate Per Kg" value={`₹ ${fmtNum(calc.ratePerKg)} /Kg`} />
            <CalcRow label="Rate Per Nos" value={`₹ ${fmtNum(calc.ratePerNos)} /Nos`} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="cnc-calc-actions">
        <button type="button" {...erpHotkeyProps('save')} onClick={handleSave} className="cnc-calc-btn cnc-calc-btn-save">
          <Save className="w-5 h-5" /> SAVE <ErpHotkeyLabel action="save" />
        </button>
        <button type="button" {...erpHotkeyProps('print')} onClick={handlePrint} className="cnc-calc-btn cnc-calc-btn-print">
          <Printer className="w-5 h-5" /> PRINT <ErpHotkeyLabel action="print" />
        </button>
        <button type="button" {...erpHotkeyProps('pdf')} onClick={() => void handlePdf()} className="cnc-calc-btn cnc-calc-btn-pdf">
          <FileDown className="w-5 h-5" /> PDF <ErpHotkeyLabel action="pdf" />
        </button>
        <button type="button" {...erpHotkeyProps('whatsapp')} onClick={handleWhatsApp} disabled={pendingWhatsApp} className="cnc-calc-btn cnc-calc-btn-wa">
          <MessageSquare className="w-5 h-5" /> WHATSAPP <ErpHotkeyLabel action="whatsapp" />
        </button>
        <button type="button" {...erpHotkeyProps('new')} onClick={handleNew} className="cnc-calc-btn cnc-calc-btn-new">
          <RotateCcw className="w-5 h-5" /> NEW <ErpHotkeyLabel action="new" />
        </button>
        <button type="button" {...erpHotkeyProps('cancel')} onClick={handleCancel} className="cnc-calc-btn cnc-calc-btn-cancel">
          <X className="w-5 h-5" /> CANCEL <ErpHotkeyLabel action="cancel" />
        </button>
      </div>

      {/* Footer */}
      <div className="cnc-calc-footer">
        <span>Company : <strong>JAGDAMBA PROFILE</strong></span>
        <span>Financial Year : <strong>{fy}</strong></span>
        <span className="flex items-center gap-1.5">
          Software By : <strong>AAGAM SOFTWARE</strong>
          <span className="w-5 h-5 rounded bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">A</span>
        </span>
      </div>
    </div>

    <div className="hidden print:block">
      <CNCRateCalculationPrint data={printData} />
    </div>

    {showWhatsAppModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-green-600 p-5 text-white flex justify-between items-center">
            <h3 className="font-black flex items-center gap-2"><MessageSquare className="w-5 h-5" /> WhatsApp CNC Rate</h3>
            <button type="button" onClick={() => setShowWhatsAppModal(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="tc-mgmt-label">WhatsApp Number</label>
              <input
                value={whatsAppData.number}
                onChange={e => setWhatsAppData({ ...whatsAppData, number: e.target.value })}
                onKeyDown={handleWhatsAppEnter}
                className="tc-mgmt-input no-uppercase"
                placeholder="91XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="tc-mgmt-label">Message</label>
              <textarea
                rows={4}
                value={whatsAppData.message}
                onChange={e => setWhatsAppData({ ...whatsAppData, message: e.target.value })}
                onKeyDown={handleWhatsAppEnter}
                className="tc-mgmt-input"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowWhatsAppModal(false)} className="erp-btn erp-btn-ghost flex-1">Cancel</button>
              <button type="button" onClick={() => void sendWhatsApp()} disabled={isSendingWhatsApp} className="erp-btn erp-btn-green flex-1">Send</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
