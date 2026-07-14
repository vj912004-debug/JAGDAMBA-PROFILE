import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, Save, RotateCcw, Printer, X, Download,
  FileText, Search, MessageSquare, Pencil, Paperclip, ClipboardList, Users,
} from 'lucide-react';
import {
  useAppContext, CUTTING_TYPES, MATERIAL_GRADES,
  UNIT_TYPES, BRANCHES, type Order, type OrderLineItem
} from '../store/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { OrderEntryPrint } from '../components/OrderEntryPrint';
import { SalesOrderPrint } from '../components/SalesOrderPrint';
import { generateOrderEntryPDF } from '../utils/pdfGenerator';
import { generateSalesOrderPDF } from '../utils/salesOrderDownload';
import { EditableSelect } from '../components/EditableSelect';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { NumericInput, parseNum } from '../components/NumericInput';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import {
  ErpEntryPage, ErpEntryToolbar, ErpFormGrid3, ErpMaterialSection, ErpOrderSummaryBar, ErpAttachBtn,
  ErpMockupTitleBar, ErpDetailPanel, ErpAutoField,
} from '../components/ErpPageShell';

const emptyLine = (): OrderLineItem => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  cuttingType: 'CNC Profile',
  materialType: 'MS',
  materialGrade: 'IS 2062 E250',
  thickness: '',
  plateSize: '',
  length: '',
  width: '',
  innerDiameter: '',
  outerDiameter: '',
  drawingNumber: '',
  partName: '',
  quantity: 1,
  totalWeight: 0,
  completedQty: 0,
  dispatchedQty: 0,
  unitType: 'Nos',
  rate: 0,
  amount: 0,
  scrapBelongsTo: 'Our Company',
  specialInstructions: '',
  fileName: null,
  assignedWorker: '',
  itemStatus: 'Pending',
});

const ROUND_CUTS = ['circle', 'ring'];
const normCutType = (type: string) => CUTTING_TYPES.find(t => t.toLowerCase() === type.toLowerCase()) ?? type;
const isRoundCut = (type: string) => ROUND_CUTS.includes(type.trim().toLowerCase());

function calcWeight(line: OrderLineItem): number {
  const t = parseFloat(String(line.thickness).replace(/[^\d.]/g, '')) || 0;
  const qty = parseFloat(String(line.quantity).replace(/[^\d.]/g, '')) || 0;
  if (!t || !qty) return 0;

  if (isRoundCut(line.cuttingType)) {
    const od = parseFloat(String(line.outerDiameter)) || 0;
    const id = parseFloat(String(line.innerDiameter)) || 0;
    if (od) {
      const area = id ? (Math.PI * (od * od - id * id) / 4) : (Math.PI * od * od / 4);
      return Math.round((area * t * 7.85 / 1_000_000) * qty * 100) / 100;
    }
    return 0;
  }

  const l = parseFloat(String(line.length)) || 0;
  const w = parseFloat(String(line.width)) || 0;
  if (l && w) return Math.round((l * w * t * 7.85 / 1_000_000) * qty * 100) / 100;

  const ps = String(line.plateSize).split(/x/i);
  if (ps.length === 2) {
    const pl = parseFloat(ps[0]) || 0;
    const pw = parseFloat(ps[1]) || 0;
    if (pl && pw) return Math.round((pl * pw * t * 7.85 / 1_000_000) * qty * 100) / 100;
  }
  return Number(line.totalWeight) || 0;
}

function calcAmount(line: OrderLineItem, weight: number): number {
  if (line.unitType === 'Kg') return Math.ceil(weight * Number(line.rate || 0));
  return Math.ceil(Number(line.quantity || 0) * Number(line.rate || 0));
}

const inp = 'tc-mgmt-input';
const lbl = 'tc-mgmt-label';

const MAX_ATTACH = 5 * 1024 * 1024;

export const OrderEntry: React.FC = () => {
  const { addOrder, nextOrderNo, role, branch, parties, addParty, orders, persistErpNow } = useAppContext();
  const navigate = useNavigate();
  const orderNo = useMemo(() => nextOrderNo(), [nextOrderNo]);

  const orderDate = new Date().toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState('');
  const [partyName, setPartyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState(branch !== 'All' ? branch : '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [transportationCharges, setTransportationCharges] = useState<number>(0);
  const [loadingUnloadingCharges, setLoadingUnloadingCharges] = useState<number>(0);
  const [gstType, setGstType] = useState('GST 18%');
  const [customerPONo, setCustomerPONo] = useState('');
  const [customerPODate, setCustomerPODate] = useState('');
  const [tc, setTc] = useState<'Yes' | 'No'>('No');
  const [ut, setUt] = useState<'Yes' | 'No'>('No');
  const partyPoInputRef = useRef<HTMLInputElement>(null);
  const drawingInputRef = useRef<HTMLInputElement>(null);
  const [drawingLineId, setDrawingLineId] = useState<string | null>(null);
  const [partyPoFile, setPartyPoFile] = useState<string | null>(null);
  const [partyAddress, setPartyAddress] = useState('');

  const [lines, setLines] = useState<OrderLineItem[]>([emptyLine()]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const handleSelectParty = (party: any) => {
    setPartyName(party.partyName);
    if (party.contactPerson) setContactPerson(party.contactPerson);
    if (party.mobileNumber) setMobileNumber(party.mobileNumber);
    if (party.deliveryAddress) setDeliveryAddress(party.deliveryAddress);
    if (party.address) setPartyAddress(party.address);
    if (party.location) setLocation(party.location);
    if (party.paymentTerms) setPaymentTerms(party.paymentTerms);
    toast.success('Details auto-filled from Party Master', { icon: '✨' });
  };

  const addLine = () => {
    setLines(prev => [...prev, emptyLine()]);
    toast.success('Row added');
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const pickDrawing = (lineId: string) => {
    setDrawingLineId(lineId);
    drawingInputRef.current?.click();
  };

  const handleDrawingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !drawingLineId) { e.target.value = ''; return; }
    if (file.size > MAX_ATTACH) { toast.error('Max 5 MB'); e.target.value = ''; return; }
    setLines(prev => prev.map(l => l.id === drawingLineId ? { ...l, fileName: file.name } : l));
    toast.success(`Drawing attached: ${file.name}`);
    e.target.value = '';
    setDrawingLineId(null);
  };

  const handlePartyPoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACH) { toast.error('Max 5 MB'); e.target.value = ''; return; }
    setPartyPoFile(file.name);
    toast.success(`Party PO attached: ${file.name}`);
    e.target.value = '';
  };

  const updateLine = (id: string, field: keyof OrderLineItem, value: string | number) => {
    const preserveCase: (keyof OrderLineItem)[] = ['cuttingType', 'materialType', 'unitType', 'scrapBelongsTo', 'itemStatus', 'fileName'];
    const numericFields = new Set(['thickness', 'length', 'width', 'outerDiameter', 'innerDiameter', 'quantity', 'rate', 'totalWeight', 'plateSize']);
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      const finalValue = typeof value === 'string' && !preserveCase.includes(field) && !numericFields.has(field)
        ? value.toUpperCase()
        : value;
      const updated = { ...l, [field]: finalValue };

      if (field === 'cuttingType') {
        const match = CUTTING_TYPES.find(t => t.toLowerCase() === String(finalValue).toLowerCase());
        if (match) updated.cuttingType = match;
        if (isRoundCut(String(updated.cuttingType))) {
          updated.length = '';
          updated.width = '';
        } else {
          updated.outerDiameter = '';
          updated.innerDiameter = '';
        }
      }

      const weightFields = ['quantity', 'totalWeight', 'rate', 'unitType', 'thickness', 'length', 'width', 'outerDiameter', 'innerDiameter', 'plateSize', 'cuttingType'];
      if (weightFields.includes(field)) {
        const w = updated.unitType === 'Kg' ? Number(updated.totalWeight || updated.quantity || 0) : calcWeight(updated);
        updated.totalWeight = w;
        updated.amount = calcAmount(updated, w);
      }
      return updated;
    }));
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
  const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalWeight = lines.reduce((sum, l) => sum + (l.totalWeight || 0), 0);
  const gstRate = parseInt(gstType.match(/(\d+)/)?.[1] || '18', 10);
  const taxable = totalAmount + transportationCharges + loadingUnloadingCharges;
  const gstAmount = Math.round(taxable * gstRate / 100 * 100) / 100;
  const grandTotal = taxable + gstAmount;

  const fmtNow = () => {
    const d = new Date();
    return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleSave = async () => {
    if (!partyName.trim()) { toast.error('Party Name is required'); return; }
    if (!deliveryDate) { toast.error('Delivery Date is required'); return; }
    if (lines.some(l => !l.thickness)) { toast.error('Please enter thickness for all items'); return; }
    if (!location) { toast.error('Please select a Location / Branch'); return; }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNo, orderDate, deliveryDate,
      partyName: partyName.trim().toUpperCase(),
      contactPerson: contactPerson.trim().toUpperCase(),
      mobileNumber: mobileNumber.trim(),
      location: location.toUpperCase(),
      deliveryAddress: deliveryAddress.trim().toUpperCase(),
      handledBy: 'SYSTEM',
      remark: remark.trim().toUpperCase(),
      stage: 'Order Received', urgent, deliveryOption, paymentTerms, termsAndConditions, gstType,
      transportationCharges, loadingUnloadingCharges,
      customerPONo: customerPONo.trim().toUpperCase(), customerPODate, tc, ut,
      items: lines.map(l => ({
        ...l,
        totalWeight: l.unitType === 'Kg' ? Number(l.totalWeight || l.quantity) : calcWeight(l),
        amount: l.unitType === 'Kg'
          ? Math.ceil((l.totalWeight || 0) * l.rate)
          : Math.ceil(l.quantity * l.rate),
      })),
      createdAt: new Date().toISOString(),
    };

    const partyNameUpper = partyName.trim().toUpperCase();
    let nextParties = parties;
    if (!parties.find(p => p.partyName === partyNameUpper)) {
      const created = await addParty({
        partyName: partyNameUpper,
        contactPerson: contactPerson.trim().toUpperCase(),
        mobileNumber: mobileNumber.trim(),
        location, deliveryAddress: deliveryAddress.trim().toUpperCase(),
        paymentTerms: paymentTerms.trim().toUpperCase(),
      });
      if (created) nextParties = [...parties, created];
    }

    addOrder(newOrder);
    try {
      await persistErpNow({
        orders: [newOrder, ...orders],
        ...(nextParties !== parties ? { parties: nextParties } : {}),
      });
      setCurrentOrder(newOrder);
      setShowReceiptModal(true);
      toast.success(`Order ${orderNo} saved successfully!`, { icon: '✅' });
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
    }
  };

  const handleReset = () => {
    const first = emptyLine();
    setPartyName(''); setContactPerson(''); setMobileNumber('');
    setLocation(''); setDeliveryAddress(''); setRemark('');
    setDeliveryDate(''); setUrgent(false);
    setDeliveryOption(''); setPaymentTerms(''); setTermsAndConditions('');
    setGstType('GST 18%'); setTransportationCharges(0); setLoadingUnloadingCharges(0);
    setCustomerPONo(''); setCustomerPODate(''); setTc('No'); setUt('No');
    setPartyPoFile(null);
    setPartyAddress('');
    setLines([first]);
    toast('Form cleared', { icon: '🔄' });
  };

  const canCreate = role === 'Admin' || role === 'Office Entry';

  const toolbarButtons = [
    { label: 'Save', tone: 'green' as const, icon: <Save className="w-4 h-4" />, hotkey: 'save' as const, onClick: handleSave, disabled: !canCreate },
    { label: 'Edit', tone: 'blue' as const, icon: <Pencil className="w-4 h-4" />, onClick: () => toast('Load order from Order List to edit') },
    { label: 'Delete', tone: 'red' as const, icon: <Trash2 className="w-4 h-4" />, onClick: () => toast.error('Open saved order from Order List to delete') },
    { label: 'Print', tone: 'purple' as const, icon: <Printer className="w-4 h-4" />, hotkey: 'print' as const, onClick: () => currentOrder ? window.print() : toast.error('Save order first') },
    { label: 'Search', tone: 'navy' as const, icon: <Search className="w-4 h-4" />, onClick: () => navigate('/order-list') },
    { label: 'WhatsApp / PDF', tone: 'teal' as const, icon: <MessageSquare className="w-4 h-4" />, hotkey: 'whatsapp' as const, onClick: () => toast('Save order then use print / PDF from list') },
    { label: 'Clear', tone: 'ghost' as const, icon: <RotateCcw className="w-4 h-4" />, hotkey: 'new' as const, onClick: handleReset },
  ];

  return (
    <ErpEntryPage>
      <input ref={partyPoInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls" onChange={handlePartyPoFile} />
      <input ref={drawingInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf" onChange={handleDrawingFile} />

      <ErpMockupTitleBar title="Sales Order Entry" icon={<ClipboardList className="w-4 h-4" />} />

      {!canCreate && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800 font-medium">
          Only Admin or Office Entry can create orders. Current role: <strong>{role}</strong>
        </div>
      )}

      <ErpFormGrid3>
        <ErpDetailPanel title="Order Details" icon={<ClipboardList className="w-3.5 h-3.5" />}>
          <ErpAutoField label="Internal Order No." value={orderNo} />
          <ErpAutoField label="Internal Date" value={fmtNow()} />
          <div><label className={lbl}>Customer PO No.</label><input value={customerPONo} onChange={e => setCustomerPONo(e.target.value.toUpperCase())} className={inp} /></div>
          <div><label className={lbl}>Customer PO Date</label><input type="date" value={customerPODate} onChange={e => setCustomerPODate(e.target.value)} className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Party PO Attach</label><ErpAttachBtn label="Attach File" fileName={partyPoFile} onClick={() => partyPoInputRef.current?.click()} /></div>
            <div><label className={lbl}>Drawing Attach</label><ErpAttachBtn label="Attach File" fileName={lines.find(l => l.fileName)?.fileName} onClick={() => lines[0] && pickDrawing(lines[0].id)} /></div>
          </div>
          <div><label className={lbl}>Delivery Date *</label><input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={inp} /></div>
          <div><label className={lbl}>Location / Branch *</label><EditableSelect value={location} onChange={setLocation} options={BRANCHES} placeholder="Select" className={inp} /></div>
        </ErpDetailPanel>

        <ErpDetailPanel title="Party Details" icon={<Users className="w-3.5 h-3.5" />}>
          <div><label className={lbl}>Party Name *</label><PartyAutocomplete value={partyName} onChange={setPartyName} onSelectParty={handleSelectParty} placeholder="Search party..." className={inp} /></div>
          <div><label className={lbl}>Party Address *</label><textarea value={partyAddress} onChange={e => setPartyAddress(e.target.value.toUpperCase())} rows={2} className={inp} placeholder="Party address from master" /></div>
          <div><label className={lbl}>Mobile No. *</label><input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className={`${inp} no-uppercase`} /></div>
          <div><label className={lbl}>Delivery Address *</label><textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value.toUpperCase())} rows={2} className={inp} /></div>
          <div><label className={lbl}>Contact Person</label><input value={contactPerson} onChange={e => setContactPerson(e.target.value.toUpperCase())} className={inp} /></div>
        </ErpDetailPanel>

        <ErpDetailPanel title="Terms Details" icon={<FileText className="w-3.5 h-3.5" />} variant="green">
          <div><label className={lbl}>Payment Term *</label>
            <EditableSelect value={paymentTerms} onChange={v => setPaymentTerms(v.toUpperCase())}
              options={['100% ADVANCE', '50% ADVANCE', 'PDC', 'CHEQUE', 'IMMEDIATE', '15 DAYS', '30 DAYS', '45 DAYS', '60 DAYS', '90 DAYS']}
              placeholder="Select" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Transport Charge (₹)</label><NumericInput value={transportationCharges} onChange={v => setTransportationCharges(parseNum(v))} className={inp} /></div>
            <div><label className={lbl}>Loading Charge (₹)</label><NumericInput value={loadingUnloadingCharges} onChange={v => setLoadingUnloadingCharges(parseNum(v))} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Test Certificate</label>
              <select value={tc} onChange={e => setTc(e.target.value as 'Yes' | 'No')} className={inp}><option value="Yes">Yes</option><option value="No">No</option></select>
            </div>
            <div><label className={lbl}>UT Level</label>
              <select value={ut} onChange={e => setUt(e.target.value as 'Yes' | 'No')} className={inp}><option value="Yes">Yes</option><option value="No">No</option></select>
            </div>
          </div>
          <div><label className={lbl}>Note</label><textarea value={remark} onChange={e => setRemark(e.target.value.toUpperCase())} rows={2} className={inp} /></div>
        </ErpDetailPanel>
      </ErpFormGrid3>

      <ErpMaterialSection
        title="Material Entry"
        actions={
          <button type="button" onClick={addLine} className="erp-btn erp-btn-orange text-[10px] py-1 px-2">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        }
      >
        <table className="tc-mgmt-table w-full min-w-[1100px]">
          <thead>
            <tr>
              <th>Sr</th><th>Cutting Type</th><th>Material Grade</th><th>Drawing No.</th><th>Part Name</th>
              <th>Thk</th><th>W / OD</th><th>L / ID</th><th>Unit</th><th>Qty</th><th>Weight</th><th>Rate</th><th>Drawing</th><th></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={line.id}>
                <td>{idx + 1}</td>
                <td><EditableSelect value={normCutType(line.cuttingType)} onChange={v => updateLine(line.id, 'cuttingType', v)} options={CUTTING_TYPES} className={`${inp} !py-1 text-[10px] min-w-[90px]`} /></td>
                <td><EditableSelect value={line.materialGrade} onChange={v => updateLine(line.id, 'materialGrade', v)} options={MATERIAL_GRADES} className={`${inp} !py-1 text-[10px] min-w-[80px]`} /></td>
                <td><input value={line.drawingNumber} onChange={e => updateLine(line.id, 'drawingNumber', e.target.value)} className={`${inp} !py-1 text-[10px] w-20`} /></td>
                <td><input value={line.partName} onChange={e => updateLine(line.id, 'partName', e.target.value)} className={`${inp} !py-1 text-[10px] min-w-[80px]`} /></td>
                <td><NumericInput value={line.thickness} onChange={v => updateLine(line.id, 'thickness', v)} className={`${inp} !py-1 text-[10px] w-14`} /></td>
                <td>
                  {isRoundCut(line.cuttingType)
                    ? <NumericInput value={line.outerDiameter || ''} onChange={v => updateLine(line.id, 'outerDiameter', v)} className={`${inp} !py-1 text-[10px] w-14`} />
                    : <NumericInput value={line.width || ''} onChange={v => updateLine(line.id, 'width', v)} className={`${inp} !py-1 text-[10px] w-14`} />}
                </td>
                <td>
                  {isRoundCut(line.cuttingType)
                    ? <NumericInput value={line.innerDiameter || ''} onChange={v => updateLine(line.id, 'innerDiameter', v)} className={`${inp} !py-1 text-[10px] w-14`} />
                    : <NumericInput value={line.length || ''} onChange={v => updateLine(line.id, 'length', v)} className={`${inp} !py-1 text-[10px] w-14`} />}
                </td>
                <td><EditableSelect value={line.unitType} onChange={v => updateLine(line.id, 'unitType', v)} options={UNIT_TYPES} className={`${inp} !py-1 text-[10px] w-16`} /></td>
                <td><NumericInput value={line.quantity} onChange={v => updateLine(line.id, 'quantity', v)} className={`${inp} !py-1 text-[10px] w-12`} /></td>
                <td className="font-semibold">{(line.totalWeight || 0).toFixed(3)}</td>
                <td><NumericInput value={line.rate} onChange={v => updateLine(line.id, 'rate', v)} className={`${inp} !py-1 text-[10px] w-16`} /></td>
                <td>
                  <button type="button" onClick={() => pickDrawing(line.id)} className="text-[10px] text-brand-blue font-bold hover:underline flex items-center gap-0.5">
                    <Paperclip className="w-3 h-3" />{line.fileName ? line.fileName.slice(0, 8) : 'Attach'}
                  </button>
                </td>
                <td><button type="button" onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="text-red-500 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </ErpMaterialSection>

      <ErpOrderSummaryBar
        items={[
          { label: 'Total Qty', value: totalQty.toFixed(2) },
          { label: 'Total Weight (KG)', value: totalWeight.toFixed(3) },
          { label: 'Transport (₹)', value: transportationCharges.toFixed(2) },
          { label: 'Loading (₹)', value: loadingUnloadingCharges.toFixed(2) },
          { label: `GST ${gstRate}%`, value: gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) },
        ]}
        grandTotal={grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      />

      <ErpEntryToolbar buttons={toolbarButtons} />

      {showReceiptModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand-blue" /> Order Entry Print
              </h2>
              <button onClick={() => { setShowReceiptModal(false); navigate('/production-list'); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">1. Order Acknowledgement</h3>
                  <div id="printable-receipt" className="p-4 border rounded-xl bg-slate-50/30"><OrderEntryPrint order={currentOrder} /></div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">2. Sales Order (Full Format)</h3>
                  <div id="sales-order-receipt" className="p-4 border rounded-xl bg-slate-50/30"><SalesOrderPrint order={currentOrder} /></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              <button onClick={() => { setShowReceiptModal(false); navigate('/production-status'); }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl">Close & Continue</button>
              <button onClick={() => currentOrder && generateSalesOrderPDF(currentOrder, parties)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"><Download className="w-4 h-4" /> Download Sales Order</button>
              <button onClick={() => currentOrder && generateOrderEntryPDF(currentOrder)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"><Download className="w-4 h-4" /> Download Acknowledgement</button>
              <button {...erpHotkeyProps('print')} onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark rounded-xl"><Printer className="w-4 h-4" /> Print Preview</button>
            </div>
          </div>
        </div>
      )}
    </ErpEntryPage>
  );
};
