import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Upload, File, Save, RotateCcw, Printer, X, Download } from 'lucide-react';
import { useAppContext, CUTTING_TYPES, MATERIAL_TYPES, MATERIAL_GRADES, EMPLOYEES, UNIT_TYPES, BRANCHES, type Order, type OrderLineItem } from '../store/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { OrderEntryPrint } from '../components/OrderEntryPrint';
import { SalesOrderPrint } from '../components/SalesOrderPrint';
import { generateOrderEntryPDF, generateSalesOrderPDF } from '../utils/pdfGenerator';
import { EditableSelect } from '../components/EditableSelect';
import { PartyAutocomplete } from '../components/PartyAutocomplete';

const emptyLine = (): OrderLineItem => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  cuttingType: 'CNC Profile',
  materialType: 'MS',
  materialGrade: '',
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

export const OrderEntry: React.FC = () => {
  const { t, addOrder, nextOrderNo, role, branch, parties, addParty } = useAppContext();
  const navigate = useNavigate();

  const orderNo = useMemo(() => nextOrderNo(), [nextOrderNo]);

  // Basic Details
  const orderDate = new Date().toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState('');
  const [partyName, setPartyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [location, setLocation] = useState(branch !== 'All' ? branch : '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [remark, setRemark] = useState('');
  const [handledBy, setHandledBy] = useState('');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectParty = (party: any) => {
    setPartyName(party.partyName);
    if (party.contactPerson) setContactPerson(party.contactPerson);
    if (party.mobileNumber) setMobileNumber(party.mobileNumber);
    if (party.deliveryAddress) setDeliveryAddress(party.deliveryAddress);
    if (party.location) setLocation(party.location);
    if (party.paymentTerms) setPaymentTerms(party.paymentTerms);
    toast.success('Details auto-filled from Party Master', { icon: '✨' });
  };

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const handleBasicDetailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      if (lines.length > 0) {
        // Simple CSV parsing: Party Name, Contact Person, Mobile, Location, Delivery Address, Remark
        const data = lines[0].split(',').map(s => s.trim());
        if (data[0]) setPartyName(data[0]);
        if (data[1]) setContactPerson(data[1]);
        if (data[2]) setMobileNumber(data[2]);
        if (data[3]) setLocation(data[3]);
        if (data[4]) setDeliveryAddress(data[4]);
        if (data[5]) setRemark(data[5]);
        
        toast.success('Basic details auto-filled from file');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Line Items
  const [lines, setLines] = useState<OrderLineItem[]>([emptyLine()]);

  const addLine = () => {
    setLines(prev => [...prev, emptyLine()]);
    toast.success('Item line added');
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(prev => prev.filter(l => l.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof OrderLineItem, value: string | number) => {
    setLines(prev => prev.map(l => {
      if (l.id !== id) return l;
      let finalValue = value;
      // Auto-capitalize strings
      if (typeof value === 'string' && ['materialGrade', 'thickness', 'plateSize', 'length', 'width', 'innerDiameter', 'outerDiameter', 'drawingNumber', 'partName', 'specialInstructions'].includes(field)) {
        finalValue = value.toUpperCase();
      }
      const updated = { ...l, [field]: finalValue };
      
      // Auto-calculate amount
      if (['quantity', 'totalWeight', 'rate', 'unitType'].includes(field)) {
        if (updated.unitType === 'Kg') {
          updated.amount = Math.ceil(Number(updated.totalWeight || 0) * Number(updated.rate || 0));
        } else {
          updated.amount = Math.ceil(Number(updated.quantity || 0) * Number(updated.rate || 0));
        }
      }
      return updated;
    }));
  };

  const handleFileUpload = (id: string) => {
    const fakeFileName = `drawing_${Math.floor(Math.random() * 10000)}.dxf`;
    setLines(prev => prev.map(l => l.id === id ? { ...l, fileName: fakeFileName } : l));
    toast.success(`File "${fakeFileName}" attached`);
  };

  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
  const totalQty = lines.reduce((sum, l) => sum + l.quantity, 0);

  const handleSave = () => {
    if (!partyName.trim()) { toast.error('Party Name is required'); return; }
    if (!deliveryDate) { toast.error('Delivery Date is required'); return; }
    if (lines.some(l => !l.thickness)) { toast.error('Please enter thickness for all items'); return; }
    if (!location) { toast.error('Please select a Location / Branch'); return; }

    const newOrder: Order = {
      id: Date.now().toString(),
      orderNo,
      orderDate,
      deliveryDate,
      partyName: partyName.trim(),
      contactPerson: contactPerson.trim(),
      mobileNumber: mobileNumber.trim(),
      location,
      deliveryAddress: deliveryAddress.trim(),
      handledBy: handledBy || 'System',
      remark: remark.trim(),
      stage: 'Order Received',
      urgent,
      deliveryOption,
      paymentTerms,
      termsAndConditions,
      gstType,
      transportationCharges,
      loadingUnloadingCharges,
      customerPONo: customerPONo.trim(),
      customerPODate,
      tc,
      ut,
      items: lines.map(l => ({ 
        ...l, 
        amount: l.unitType === 'Kg' ? Math.ceil((l.totalWeight || 0) * l.rate) : Math.ceil(l.quantity * l.rate) 
      })),
      createdAt: new Date().toISOString(),
    };

    // Auto-save new party in Master if it doesn't exist
    const partyNameUpper = partyName.trim().toUpperCase();
    const exactMatch = parties.find(p => p.partyName === partyNameUpper);
    if (!exactMatch) {
      addParty({
        partyName: partyNameUpper,
        contactPerson: contactPerson.trim().toUpperCase(),
        mobileNumber: mobileNumber.trim(),
        location,
        deliveryAddress: deliveryAddress.trim().toUpperCase(),
        paymentTerms: paymentTerms.trim().toUpperCase()
      });
    }

    addOrder(newOrder);
    setCurrentOrder(newOrder);
    setShowReceiptModal(true);
    toast.success(`Order ${orderNo} saved successfully!`, { icon: '✅' });
  };

  const handleReset = () => {
    setPartyName(''); setContactPerson(''); setMobileNumber('');
    setLocation(''); setDeliveryAddress(''); setRemark('');
    setDeliveryDate(''); setUrgent(false);
    setDeliveryOption(''); setPaymentTerms(''); setTermsAndConditions('');
    setGstType('GST 18%');
    setTransportationCharges(0); setLoadingUnloadingCharges(0);
    setCustomerPONo(''); setCustomerPODate('');
    setTc('No'); setUt('No');
    setLines([emptyLine()]);
    toast('Form cleared', { icon: '🔄' });
  };

  const canCreate = role === 'Admin' || role === 'Office Entry';

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('orderEntry')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create new cutting job order • <span className="font-semibold text-blue-600">{orderNo}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-50">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!canCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Save PO
          </button>
        </div>
      </div>

      {!canCreate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
          ⚠️ Only Admin or Office Entry role can create orders. Current role: <strong>{role}</strong>
        </div>
      )}

      {/* Basic Details */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
          Basic Details
          <div className="ml-auto flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleBasicDetailUpload} 
              className="hidden" 
              accept=".csv,.txt"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-blue-100"
              title="Upload CSV to auto-fill details (Format: Party, Contact, Mobile, Location, Address, Remark)"
            >
              <Upload className="w-3.5 h-3.5" /> Auto-fill Details
            </button>
          </div>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Internal Order No</label>
            <input type="text" className="w-full bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-sm font-mono" value={orderNo} readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Customer PO No</label>
            <input type="text" value={customerPONo} onChange={(e) => setCustomerPONo(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="PO-12345" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Customer PO Date</label>
            <input type="date" value={customerPODate} onChange={(e) => setCustomerPODate(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>Party Name *</span>
              {partyName && parties.some(p => p.partyName === partyName) && (
                <span className="text-[10px] text-blue-500 font-bold lowercase normal-case tracking-normal">✨ Linked to Master</span>
              )}
            </label>
            <PartyAutocomplete 
              value={partyName} 
              onChange={setPartyName} 
              onSelectParty={handleSelectParty} 
              placeholder="Search or Create Party (Tally Style)"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Contact Person</label>
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Person name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Delivery Date *</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Location / Branch *</label>
            <EditableSelect 
              value={location} 
              onChange={(v) => setLocation(v)} 
              options={BRANCHES} 
              placeholder="Select Branch"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500" />
              <span className="text-sm font-semibold text-red-600">🔥 Urgent Order</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Delivery Address</label>
            <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Full delivery address" />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Handled By</label>
            <EditableSelect 
              value={handledBy} 
              onChange={(v) => setHandledBy(v)} 
              options={EMPLOYEES} 
              placeholder="Select Employee"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Remark</label>
            <input type="text" value={remark} onChange={(e) => setRemark(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Any special remarks..." />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Payment Terms</label>
            <EditableSelect 
              value={paymentTerms} 
              onChange={(v) => setPaymentTerms(v.toUpperCase())} 
              options={['100% ADVANCE', '50% ADVANCE', 'PDC', 'CHEQUE', 'IMMEDIATE', '15 DAYS', '30 DAYS', '45 DAYS', '60 DAYS', '90 DAYS']} 
              placeholder="Select Payment Terms"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">GST Option (Default)</label>
            <EditableSelect 
              value={gstType} 
              onChange={(v) => setGstType(v.toUpperCase())} 
              options={['GST 18%', 'GST 12%', 'GST 5%', 'GST 0%', 'IGST 18%', 'IGST 12%']} 
              placeholder="Select GST Type"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Transportation Charges (₹)</label>
            <input type="number" value={transportationCharges || ''} onChange={(e) => setTransportationCharges(Number(e.target.value))} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Loading & Unloading Charges (₹)</label>
            <input type="number" value={loadingUnloadingCharges || ''} onChange={(e) => setLoadingUnloadingCharges(Number(e.target.value))} className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="0" />
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Test Certificate (TC)</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTc('Yes')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                  tc === 'Yes'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setTc('No')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                  tc === 'No'
                    ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                No
              </button>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Ultrasonic Test (UT)</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUt('Yes')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                  ut === 'Yes'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setUt('No')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                  ut === 'No'
                    ? 'bg-slate-700 border-slate-700 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                No
              </button>
            </div>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Terms & Conditions</label>
            <textarea 
              value={termsAndConditions} 
              onChange={(e) => setTermsAndConditions(e.target.value.toUpperCase())} 
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition h-20 uppercase" 
              placeholder="Enter terms and conditions here..."
            />
          </div>
        </div>
      </div>

      {/* Job Line Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50/60">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block"></span>
            Job Specifications ({lines.length} item{lines.length > 1 ? 's' : ''})
          </h2>
          <button onClick={addLine} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-blue-100">
            <Plus className="w-4 h-4" /> {t('addItem')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Cutting Type</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Material</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Grade</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Thickness</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Dimensions</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Drawing No</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Part Name</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Unit</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Qty (Nos)</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Weight (Kg)</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Rate (₹)</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Amount (₹)</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">Scrap</th>
                <th className="p-2.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">File</th>
                <th className="p-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line) => (
                <tr key={line.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-1.5">
                    <EditableSelect 
                      value={line.cuttingType} 
                      onChange={(v) => updateLine(line.id, 'cuttingType', v)} 
                      options={CUTTING_TYPES}
                      className="w-28 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="p-1.5">
                    <EditableSelect 
                      value={line.materialType} 
                      onChange={(v) => updateLine(line.id, 'materialType', v)} 
                      options={MATERIAL_TYPES}
                      className="w-20 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="p-1.5">
                    <EditableSelect 
                      value={line.materialGrade} 
                      onChange={(v) => updateLine(line.id, 'materialGrade', v)} 
                      options={MATERIAL_GRADES}
                      placeholder="Select Grade"
                      className="w-32 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="p-1.5">
                    <input type="text" value={line.thickness} onChange={(e) => updateLine(line.id, 'thickness', e.target.value)} placeholder="10mm" className="w-16 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                  </td>
                  <td className="p-1.5">
                    {['Square', 'CNC Profile', 'Plate'].includes(line.cuttingType) ? (
                      <div className="flex gap-1 w-24">
                        <input type="text" value={line.length || ''} onChange={(e) => updateLine(line.id, 'length', e.target.value)} placeholder="L" className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" value={line.width || ''} onChange={(e) => updateLine(line.id, 'width', e.target.value)} placeholder="W" className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    ) : ['Circle', 'Ring'].includes(line.cuttingType) ? (
                      <div className="flex gap-1 w-24">
                        <input type="text" value={line.outerDiameter || ''} onChange={(e) => updateLine(line.id, 'outerDiameter', e.target.value)} placeholder="OD" className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="text" value={line.innerDiameter || ''} onChange={(e) => updateLine(line.id, 'innerDiameter', e.target.value)} placeholder="ID" className="w-1/2 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    ) : (
                      <input type="text" value={line.plateSize} onChange={(e) => updateLine(line.id, 'plateSize', e.target.value)} placeholder="1250x2500" className="w-24 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                    )}
                  </td>
                  <td className="p-1.5">
                    <input type="text" value={line.drawingNumber} onChange={(e) => updateLine(line.id, 'drawingNumber', e.target.value)} placeholder="DRW-..." className="w-22 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                  </td>
                  <td className="p-1.5">
                    <input type="text" value={line.partName} onChange={(e) => updateLine(line.id, 'partName', e.target.value)} placeholder="Part" className="w-22 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                  </td>
                  <td className="p-1.5">
                    <EditableSelect 
                      value={line.unitType} 
                      onChange={(v) => updateLine(line.id, 'unitType', v as any)} 
                      options={UNIT_TYPES}
                      className="w-18 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="p-1.5">
                     <input 
                       type="number" 
                       min="0" 
                       value={line.quantity || ''} 
                       onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))} 
                       className="w-16 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                     />
                   </td>
                   <td className="p-1.5">
                     <input 
                       type="number" 
                       min="0" 
                       value={line.totalWeight || ''} 
                       onChange={(e) => updateLine(line.id, 'totalWeight', Number(e.target.value))} 
                       disabled={line.unitType !== 'Kg'}
                       className={`w-16 border rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                         line.unitType === 'Kg' ? "bg-white border-blue-200 text-blue-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                       }`}
                       placeholder={line.unitType === 'Kg' ? "Weight" : "-"}
                     />
                   </td>
                   <td className="p-1.5">
                     <input type="number" min="0" value={line.rate || ''} onChange={(e) => updateLine(line.id, 'rate', Number(e.target.value))} className="w-18 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                   </td>
                   <td className="p-1.5">
                     <span className={`text-xs font-bold px-2 py-1.5 rounded-lg inline-block min-w-[70px] text-right shadow-sm ${
                       line.unitType === 'Kg' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                     }`}>
                       ₹{line.amount.toLocaleString()}
                     </span>
                   </td>
                  <td className="p-1.5">
                    <EditableSelect 
                      value={line.scrapBelongsTo} 
                      onChange={(v) => updateLine(line.id, 'scrapBelongsTo', v as any)} 
                      options={['Our Company', 'Customer']}
                      displayTransform={(o) => o === 'Our Company' ? 'Ours' : 'Customer'}
                      className="w-22 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </td>
                  <td className="p-1.5">
                    {line.fileName ? (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-1 rounded-lg border border-emerald-100 w-max">
                        <File className="w-3 h-3" />
                        <span className="text-[10px] font-medium truncate max-w-[50px]" title={line.fileName}>{line.fileName}</span>
                      </div>
                    ) : (
                      <button onClick={() => handleFileUpload(line.id)} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-1.5 py-1 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors text-[10px] font-medium w-max">
                        <Upload className="w-3 h-3" /> File
                      </button>
                    )}
                  </td>
                  <td className="p-1.5">
                    <button onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-6 text-sm">
            <div><span className="text-slate-500">Total Items:</span> <strong className="text-slate-800">{lines.length}</strong></div>
            <div><span className="text-slate-500">Total Qty:</span> <strong className="text-slate-800">{totalQty}</strong></div>
          </div>
          <div className="text-right">
            <span className="text-sm text-slate-500">Total Amount: </span>
            <span className="text-lg font-bold text-blue-700">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                Order Entry Print
              </h2>
              <button 
                onClick={() => {
                  setShowReceiptModal(false);
                  navigate('/production-list');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">1. Order Acknowledgement</h3>
                  <div id="printable-receipt" className="p-4 border rounded-xl bg-slate-50/30">
                    <OrderEntryPrint order={currentOrder} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b pb-2">2. Sales Order (Full Format)</h3>
                  <div id="sales-order-receipt" className="p-4 border rounded-xl bg-slate-50/30">
                    <SalesOrderPrint order={currentOrder} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
              <button 
                onClick={() => {
                  setShowReceiptModal(false);
                  navigate('/production-status');
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors"
              >
                Close & Continue
              </button>
              <button 
                onClick={() => {
                  if (currentOrder) generateSalesOrderPDF(currentOrder);
                }} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Sales Order
              </button>
              <button 
                onClick={() => {
                  if (currentOrder) generateOrderEntryPDF(currentOrder);
                }} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Acknowledgement
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
