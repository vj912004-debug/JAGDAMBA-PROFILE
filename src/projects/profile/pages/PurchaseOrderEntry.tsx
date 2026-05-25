import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, Save, RotateCcw, Plus, Trash2, Download } from 'lucide-react';
import { useAppContext, type PurchaseOrder, type POItem, MATERIAL_GRADES } from '../store/AppContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PurchaseOrderPrint } from '../components/PurchaseOrderPrint';
import { downloadPDF } from '../utils/pdfGenerator';
import { EditableSelect } from '../components/EditableSelect';
import { PartyAutocomplete } from '../components/PartyAutocomplete';

export const PurchaseOrderEntry: React.FC = () => {
  const { t, nextPONo, purchaseOrders, setPurchaseOrders, role, parties, addParty } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const poNumber = useMemo(() => {
    if (editId) {
      const existing = purchaseOrders.find(po => po.id === editId);
      if (existing) return existing.poNumber;
    }
    return nextPONo();
  }, [editId, nextPONo, purchaseOrders]);

  // Header State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierGST, setSupplierGST] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierMobile, setSupplierMobile] = useState('');
  
  // Delivery & Transport
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [transportName, setTransportName] = useState('');
  const [transportNumber, setTransportNumber] = useState('');
  
  // Commercial
  const [paymentTerms, setPaymentTerms] = useState('');
  const [make, setMake] = useState('');
  const [utLevel, setUtLevel] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customer, setCustomer] = useState('');
  const [location, setLocation] = useState('');

  // Items State
  const [items, setItems] = useState<POItem[]>([
    { id: '1', grade: '', thickness: '', width: '', length: '', nos: 0, kg: 0, rate: 0, amount: 0, heatNo: '', actualWeight: 0 }
  ]);

  const handleSelectParty = (party: any) => {
    setSupplierName(party.partyName);
    if (party.deliveryAddress) setSupplierAddress(party.deliveryAddress);
    if (party.gstNumber) setSupplierGST(party.gstNumber);
    if (party.email) setSupplierEmail(party.email);
    if (party.mobileNumber) setSupplierMobile(party.mobileNumber);
    if (party.paymentTerms) setPaymentTerms(party.paymentTerms);
    toast.success('Details auto-filled from Party Master', { icon: '✨' });
  };

  const [savedPO, setSavedPO] = useState<PurchaseOrder | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const totalKg = useMemo(() => items.reduce((sum, item) => sum + item.kg, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), grade: '', thickness: '', width: '', length: '', nos: 0, kg: 0, rate: 0, amount: 0, heatNo: '', actualWeight: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setItems([{ id: Date.now().toString(), grade: '', thickness: '', width: '', length: '', nos: 0, kg: 0, rate: 0, amount: 0, heatNo: '', actualWeight: 0 }]);
      toast('Item cleared', { icon: '🧹' });
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate weight (kg) if dimensions or nos changes
        if (['thickness', 'width', 'length', 'nos'].includes(field)) {
          const thk = parseFloat(updatedItem.thickness) || 0;
          const w = parseFloat(updatedItem.width) || 0;
          const l = parseFloat(updatedItem.length) || 0;
          const n = Number(updatedItem.nos) || 0;
          
          // Formula provided by user: thick * width * length * nos * 8 / 1000000
          updatedItem.kg = (thk * w * l * n * 8) / 1000000;
        }

        // Recalculate amount if kg or rate changes
        if (field === 'kg' || field === 'rate' || ['thickness', 'width', 'length', 'nos'].includes(field)) {
          updatedItem.amount = Math.ceil(Number(updatedItem.kg) * Number(updatedItem.rate));
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async (downloadAfterSave = false) => {
    if (!supplierName.trim()) { toast.error('Supplier Name is required'); return; }
    if (items.some(item => !item.grade.trim() || item.kg <= 0)) {
      toast.error('All items must have a grade and weight');
      return;
    }

    const newPO: PurchaseOrder = {
      id: editId || Date.now().toString(),
      poNumber,
      date,
      supplierName: supplierName.trim(),
      supplierAddress: supplierAddress.trim(),
      supplierGST: supplierGST.trim(),
      supplierEmail: supplierEmail.trim(),
      supplierMobile: supplierMobile.trim(),
      deliveryAddress: deliveryAddress.trim(),
      transportName: transportName.trim(),
      transportNumber: transportNumber.trim(),
      paymentTerms: paymentTerms.trim(),
      make: make.trim(),
      utLevel: utLevel.trim(),
      invoiceNo: invoiceNo.trim(),
      customer: customer.trim(),
      location: location.trim(),
      items,
      totalKg,
      totalAmount,
      status: editId ? (purchaseOrders.find(p => p.id === editId)?.status || 'Pending') : 'Pending'
    };

    // Auto-save new party in Master if it doesn't exist
    const partyNameUpper = supplierName.trim().toUpperCase();
    const exactMatch = parties.find(p => p.partyName === partyNameUpper);
    if (!exactMatch) {
      addParty({
        partyName: partyNameUpper,
        contactPerson: '',
        mobileNumber: supplierMobile.trim(),
        location: location || '',
        deliveryAddress: supplierAddress.trim().toUpperCase(),
        paymentTerms: paymentTerms.trim().toUpperCase(),
        gstNumber: supplierGST.trim().toUpperCase(),
        email: supplierEmail.trim()
      });
    }

    if (editId) {
      setPurchaseOrders(prev => prev.map(po => po.id === editId ? newPO : po));
      toast.success(`Purchase Order ${poNumber} updated successfully!`, { icon: '🛍️' });
    } else {
      setPurchaseOrders(prev => [...prev, newPO]);
      toast.success(`Purchase Order ${poNumber} saved!`, { icon: '🛍️' });
    }

    if (downloadAfterSave) {
      setSavedPO(newPO);
      setIsDownloading(true);
    } else {
      setTimeout(() => navigate('/purchase-reports'), 800);
    }
  };

  useEffect(() => {
    if (isDownloading && savedPO) {
      const timer = setTimeout(() => {
        downloadPDF('po-print-area', `PO_${savedPO.poNumber}`);
        setIsDownloading(false);
        setSavedPO(null);
        toast.success('Downloading PO PDF...');
        setTimeout(() => navigate('/purchase-reports'), 1000);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isDownloading, savedPO, navigate]);

  useEffect(() => {
    if (editId) {
      const existing = purchaseOrders.find(po => po.id === editId);
      if (existing) {
        setDate(existing.date);
        setSupplierName(existing.supplierName);
        setSupplierAddress(existing.supplierAddress || '');
        setSupplierGST(existing.supplierGST || '');
        setSupplierEmail(existing.supplierEmail || '');
        setSupplierMobile(existing.supplierMobile || '');
        setDeliveryAddress(existing.deliveryAddress || '');
        setTransportName(existing.transportName || '');
        setTransportNumber(existing.transportNumber || '');
        setPaymentTerms(existing.paymentTerms || '');
        setMake(existing.make || '');
        setUtLevel(existing.utLevel || '');
        setInvoiceNo(existing.invoiceNo || '');
        setCustomer(existing.customer || '');
        setLocation(existing.location || '');
        setItems(existing.items.map(item => ({ ...item })));
      }
    }
  }, [editId, purchaseOrders]);

  const handleReset = () => {
    setSupplierName('');
    setSupplierAddress('');
    setSupplierGST('');
    setSupplierEmail('');
    setSupplierMobile('');
    setDeliveryAddress('');
    setTransportName('');
    setTransportNumber('');
    setPaymentTerms('');
    setMake('');
    setUtLevel('');
    setInvoiceNo('');
    setCustomer('');
    setLocation('');
    setItems([{ id: '1', grade: '', thickness: '', width: '', length: '', nos: 0, kg: 0, rate: 0, amount: 0, heatNo: '', actualWeight: 0 }]);
    toast('Form cleared', { icon: '🔄' });
  };

  const canCreate = role === 'Admin' || role === 'Office Entry';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{editId ? 'Edit Purchase Order' : t('purchaseOrder')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{editId ? 'Modify existing purchase order' : 'Create new purchase order'} • <span className="font-semibold text-blue-600 dark:text-blue-400">{poNumber}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={!canCreate || isDownloading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Save & Download PO
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={!canCreate || isDownloading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Only
          </button>
        </div>
      </div>

      {!canCreate && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-200 font-medium">
          ⚠️ Only Admin or Office Entry role can create purchase orders.
        </div>
      )}

      {/* Hidden Print Area */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}>
        {savedPO && <PurchaseOrderPrint po={savedPO} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Supplier / Party Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Party Name *</span>
                  {supplierName && parties.some(p => p.partyName === supplierName) && (
                    <span className="text-[10px] text-blue-500 font-bold normal-case tracking-normal">✨ Linked to Master</span>
                  )}
                </label>
                <PartyAutocomplete 
                  value={supplierName} 
                  onChange={setSupplierName} 
                  onSelectParty={handleSelectParty} 
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Address</label>
                <textarea rows={2} value={supplierAddress} onChange={(e) => setSupplierAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition" placeholder="Supplier full address" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">GST Number</label>
                <input type="text" value={supplierGST} onChange={(e) => setSupplierGST(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition" placeholder="24XXXXX..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">E-mail ID</label>
                <input type="email" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition" placeholder="supplier@example.com" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">PO Items</h2>
              <button onClick={handleAddItem} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    <th className="p-3 border-b">Grade</th>
                    <th className="p-3 border-b">Thk</th>
                    <th className="p-3 border-b">Width</th>
                    <th className="p-3 border-b">Length</th>
                    <th className="p-3 border-b">Nos</th>
                    <th className="p-3 border-b">Kg (Theor.)</th>
                    <th className="p-3 border-b">Kg (Actual)</th>
                    <th className="p-3 border-b">Rate</th>
                    <th className="p-3 border-b">Amount</th>
                    <th className="p-3 border-b text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((item) => (
                    <tr key={item.id} className="group">
                      <td className="p-2 min-w-[150px]">
                        <EditableSelect
                          value={item.grade}
                          onChange={(v) => updateItem(item.id, 'grade', v)}
                          options={MATERIAL_GRADES}
                          placeholder="Select Grade"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-2 w-20">
                        <input type="text" value={item.thickness} onChange={(e) => updateItem(item.id, 'thickness', e.target.value)} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all" placeholder="10mm" />
                      </td>
                      <td className="p-2 w-20">
                        <input type="text" value={item.width} onChange={(e) => updateItem(item.id, 'width', e.target.value)} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all" placeholder="1250" />
                      </td>
                      <td className="p-2 w-20">
                        <input type="text" value={item.length} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all" placeholder="2500" />
                      </td>
                      <td className="p-2 w-16">
                        <input type="number" value={item.nos || ''} onChange={(e) => updateItem(item.id, 'nos', Number(e.target.value))} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all" placeholder="0" />
                      </td>
                      <td className="p-2 w-24">
                        <input type="number" step="0.001" value={item.kg || ''} onChange={(e) => updateItem(item.id, 'kg', Number(e.target.value))} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all font-semibold text-blue-600 dark:text-blue-400" placeholder="0.000" />
                      </td>
                      <td className="p-2 w-24">
                        <input type="number" step="0.001" value={item.actualWeight || ''} onChange={(e) => updateItem(item.id, 'actualWeight', Number(e.target.value))} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all font-semibold text-emerald-600 dark:text-emerald-400" placeholder="0.000" />
                      </td>
                      <td className="p-2 w-24">
                        <input type="number" value={item.rate || ''} onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))} className="w-full border-transparent bg-transparent group-hover:bg-white dark:bg-slate-900 group-hover:border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-sm transition-all" placeholder="0.00" />
                      </td>
                      <td className="p-2 w-28 text-right font-bold text-slate-700 dark:text-slate-200">
                        {item.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-red-900/30 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 dark:bg-slate-800/50">
                  <tr className="font-bold text-slate-800 dark:text-slate-100">
                    <td colSpan={5} className="p-4 text-right text-xs uppercase text-slate-500 dark:text-slate-400">Grand Total</td>
                    <td className="p-4 text-blue-600 dark:text-blue-400">{totalKg.toFixed(3)}</td>
                    <td className="p-4"></td>
                    <td className="p-4 text-right text-lg">₹{totalAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* PO Basic Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-widest border-b border-slate-50 pb-2">PO Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">PO Number</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" value={poNumber} readOnly />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Mobile Number</label>
                <input type="text" value={supplierMobile} onChange={(e) => setSupplierMobile(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" placeholder="Supplier contact" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Invoice No</label>
                <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" placeholder="INV-..." />
              </div>
            </div>
          </div>

          {/* Delivery & Transport */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-widest border-b border-slate-50 pb-2">Delivery & Transport</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Delivery Address</label>
                <textarea rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" placeholder="Ship to address" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Transport Name</label>
                <input type="text" value={transportName} onChange={(e) => setTransportName(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Transport No / Vehicle</label>
                <input type="text" value={transportNumber} onChange={(e) => setTransportNumber(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
          </div>

          {/* Commercial Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 uppercase tracking-widest border-b border-slate-50 pb-2">Commercial / Quality</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Payment Term</label>
                <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" placeholder="e.g. 30 Days" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Make</label>
                  <select 
                    value={make} 
                    onChange={(e) => setMake(e.target.value)} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition font-bold"
                  >
                    <option value="">Select Make</option>
                    <option value="AM/NS INDIA">AM/NS INDIA</option>
                    <option value="JINDAL ODISHA">JINDAL ODISHA</option>
                    <option value="JINDAL RAIGHAD">JINDAL RAIGHAD</option>
                    <option value="SELL RSP">SELL RSP</option>
                    <option value="SELL">SELL</option>
                    <option value="TATA">TATA</option>
                    <option value="JSW">JSW</option>
                    <option value="POSCO">POSCO</option>
                    <option value="CHINA">CHINA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">UT Level</label>
                  <input type="text" value={utLevel} onChange={(e) => setUtLevel(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" placeholder="e.g. Level 2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Customer</label>
                  <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

