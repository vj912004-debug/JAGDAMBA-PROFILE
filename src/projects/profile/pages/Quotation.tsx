import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Printer, RotateCcw, FileText, User, Calendar, Hash, Search, List } from 'lucide-react';
import { useAppContext, type QuotationRecord, type QuotationItem, MATERIAL_GRADES } from '../store/AppContext';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';



export const Quotation: React.FC = () => {
  const { t, quotations, addQuotation, deleteQuotation } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  const [search, setSearch] = useState('');

  const [partyName, setPartyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [quoteNo, setQuoteNo] = useState(`QT-${Date.now().toString().slice(-6)}`);
  
  const [items, setItems] = useState<QuotationItem[]>([
    { id: '1', shape: 'Square', grade: 'IS 2062', thickness: 0, width: 0, length: 0, od: 0, id_dim: 0, nos: 1, weight: 0, rate: 0, odRate: 0, idRate: 0, amount: 0, remark: '' }
  ]);

  const [loadingCharges, setLoadingCharges] = useState(0);
  const [transportCharges, setTransportCharges] = useState(0);
  const [gstRate, setGstRate] = useState(18); // Default 18%

  const calculateWeight = (item: QuotationItem): number => {
    const shape = item.shape;
    const thickness = parseFloat(item.thickness as any) || 0;
    const width = parseFloat(item.width as any) || 0;
    const length = parseFloat(item.length as any) || 0;
    const od = parseFloat(item.od as any) || 0;
    const id_dim = parseFloat(item.id_dim as any) || 0;
    const nos = parseInt(item.nos as any) || 0;
    let weight = 0;
    
    if (shape === 'Square' || shape === 'CNC Profile') {
      weight = (thickness * width * length * nos * 8) / 1000000;
    } else if (shape === 'Ring') {
      weight = ((Math.pow(od, 2) - Math.pow(id_dim, 2)) * (Math.PI / 4) * thickness * nos * 8) / 1000000;
    }
    
    return parseFloat(weight.toFixed(3));
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(prev => prev.map((item: QuotationItem) => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Recalculate weight if dimensions change
        if (['shape', 'thickness', 'width', 'length', 'od', 'id_dim', 'nos'].includes(field)) {
          updated.weight = calculateWeight(updated);
        }
        
        // Recalculate amount if weight or rate changes
        if (['weight', 'rate', 'odRate', 'idRate', 'shape', 'thickness', 'width', 'length', 'od', 'id_dim', 'nos'].includes(field)) {
          if (updated.shape === 'Ring') {
            const odVal = parseFloat(updated.od as any) || 0;
            const idDimVal = parseFloat(updated.id_dim as any) || 0;
            const thicknessVal = parseFloat(updated.thickness as any) || 0;
            const nosVal = parseInt(updated.nos as any) || 0;
            const odRateVal = parseFloat(updated.odRate as any) || 0;
            const idRateVal = parseFloat(updated.idRate as any) || 0;

            // Formula: OD Amount = ((OD+5)*(OD+5)*0.7854 * thickness * 8 * OD_Rate) / 1000000
            // Formula: ID Amount = ((ID-10)*(ID-10)*0.7854 * thickness * 8 * ID_Rate) / 1000000
            const odA = ((odVal + 5) * (odVal + 5) * 0.7854 * thicknessVal * 8 * odRateVal) / 1000000;
            const idA = idDimVal > 10 ? (((idDimVal - 10) * (idDimVal - 10) * 0.7854 * thicknessVal * 8 * idRateVal) / 1000000) : 0;
            updated.amount = Math.ceil((odA - idA) * nosVal);
          } else {
            const weightVal = parseFloat(updated.weight as any) || 0;
            const rateVal = parseFloat(updated.rate as any) || 0;
            updated.amount = Math.ceil(weightVal * rateVal);
          }
        }
        
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems((prev: QuotationItem[]) => [
      ...prev,
      { id: Date.now().toString(), shape: 'Square', grade: 'IS 2062', thickness: 0, width: 0, length: 0, od: 0, id_dim: 0, nos: 1, weight: 0, rate: 0, odRate: 0, idRate: 0, amount: 0, remark: '' }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev: QuotationItem[]) => prev.filter((item: QuotationItem) => item.id !== id));
  };

  const totalAmount = useMemo(() => items.reduce((sum: number, item: QuotationItem) => sum + item.amount, 0), [items]);

  const handleReset = () => {
    setPartyName('');
    setContactPerson('');
    setMobileNo('');
    setAddress('');
    setDate(new Date().toISOString().split('T')[0]);
    setValidUntil(() => {
      const d = new Date();
      d.setDate(d.getDate() + 15);
      return d.toISOString().split('T')[0];
    });
    setQuoteNo(`QT-${Date.now().toString().slice(-6)}`);
    setItems([{ id: '1', shape: 'Square', grade: 'IS 2062', thickness: 0, width: 0, length: 0, od: 0, id_dim: 0, nos: 1, weight: 0, rate: 0, odRate: 0, idRate: 0, amount: 0, remark: '' }]);
    setLoadingCharges(0);
    setTransportCharges(0);
    setGstRate(18);
    toast.success('Quotation reset');
  };

  const handleSave = () => {
    if (!partyName) { toast.error('Enter party name'); return; }
    
    const grandTotal = Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100));
    
    const record: QuotationRecord = {
      id: Date.now().toString(),
      quoteNo,
      date,
      validUntil,
      partyName,
      contactPerson,
      mobileNo,
      address,
      items,
      loadingCharges,
      transportCharges,
      gstRate,
      totalAmount,
      grandTotal
    };
    
    addQuotation(record);
    toast.success('Quotation saved successfully');
    setViewMode('list');
  };

  const filteredQuotations = useMemo(() => {
    if (!search) return quotations;
    const q = search.toLowerCase();
    return quotations.filter((r: QuotationRecord) => 
      r.quoteNo.toLowerCase().includes(q) || 
      r.partyName.toLowerCase().includes(q) || 
      r.contactPerson.toLowerCase().includes(q) ||
      r.mobileNo.toLowerCase().includes(q)
    );
  }, [quotations, search]);

  const loadQuotation = (q: QuotationRecord) => {
    setQuoteNo(q.quoteNo);
    setDate(q.date);
    setValidUntil(q.validUntil);
    setPartyName(q.partyName);
    setContactPerson(q.contactPerson);
    setMobileNo(q.mobileNo);
    setAddress(q.address);
    setItems(q.items);
    setLoadingCharges(q.loadingCharges);
    setTransportCharges(q.transportCharges);
    setGstRate(q.gstRate);
    setViewMode('create');
    toast.success('Quotation loaded');
  };

  const handlePrint = () => {
    window.print();
  };

  if (viewMode === 'list') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 fade-in pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Saved Quotations</h1>
            <p className="text-sm text-slate-500">{quotations.length} records found</p>
          </div>
          <button onClick={() => setViewMode('create')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md">
            + New Quotation
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Quote No, Party, Mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-500">
                <th className="p-4">Quote No</th>
                <th className="p-4">Party Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuotations.map((q: QuotationRecord) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-4 font-mono font-bold text-blue-600">{q.quoteNo}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{q.partyName}</p>
                    <p className="text-[10px] text-slate-400">{q.mobileNo}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{q.date}</td>
                  <td className="p-4 text-sm text-slate-600">{q.items.length} Nos</td>
                  <td className="p-4 font-bold text-slate-800">₹{q.grandTotal.toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => loadQuotation(q)} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold transition-all">Edit</button>
                    <button onClick={() => deleteQuotation(q.id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition-all">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">No quotations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 fade-in pb-20 print:p-0 print:max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" />
            {t('quotation')} Module
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Quick weight & cost estimation for customers</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setViewMode('list')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all">
            <List className="w-4 h-4" /> Saved Quotes
          </button>
          <button onClick={handleReset} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md">
            Save
          </button>
          <button onClick={handlePrint} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Party Details */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Quote Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quote Number</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="text" value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" placeholder="Durgesh" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Person</label>
                  <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" placeholder="Vraj Patel" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile No</label>
                  <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" placeholder="7359604778" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Address</label>
                <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" placeholder="Vadodara, Gujarat" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valid Until</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition" />
              </div>
            </div>
          </div>


          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold opacity-80 uppercase tracking-wider">Summary</h3>
                <p className="text-xs font-medium opacity-60">Total estimation</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs opacity-70">Sub Total</span>
                <span className="text-sm font-bold">₹ {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs opacity-70">Total Charges</span>
                <span className="text-sm font-bold">₹ {(loadingCharges + transportCharges).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs opacity-70">GST ({gstRate}%)</span>
                <span className="text-sm font-bold">₹ {Math.ceil((totalAmount + loadingCharges + transportCharges) * gstRate / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end border-t border-white/10 pt-3">
                <span className="text-xs opacity-70 font-bold uppercase tracking-wider">Grand Total</span>
                <span className="text-2xl font-black">₹ {Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Calculation Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none">
            {/* Print Header */}
            <div className="hidden print:block p-8 border-b-2 border-slate-200 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-blue-600">JAGDAMBA PROFILE</h1>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Quotation / Proforma Invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">Quote #: {quoteNo}</p>
                  <p className="text-sm font-medium text-slate-500">Date: {date}</p>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">To:</p>
                <p className="text-lg font-bold text-slate-800 whitespace-pre-wrap">{partyName || 'Valued Customer'}</p>
              </div>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
                Items & Shapes
              </h2>
              <button onClick={addItem} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Add New Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 print:bg-white print:border-b-2 print:border-slate-300">
                    <th className="p-4">Shape</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Thk</th>
                    <th className="p-4">Dimensions (mm)</th>
                    <th className="p-4">Nos</th>
                    <th className="p-4">Weight (Kg)</th>
                    <th className="p-4 min-w-[160px]">Rate</th>
                    <th className="p-4 text-blue-600">Rate / Nos</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center w-10 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                  {items.map((item: QuotationItem) => (
                    <tr key={item.id} className="group hover:bg-blue-50/20 transition-all">
                      <td className="p-3">
                        <select 
                          value={item.shape} 
                          onChange={(e) => updateItem(item.id, 'shape', e.target.value)} 
                          className="bg-transparent border-transparent focus:ring-0 text-sm font-bold text-slate-700 outline-none print:appearance-none"
                        >
                          <option value="Square">Square / Rect</option>
                          <option value="Ring">Ring / Circle</option>
                        </select>
                      </td>
                      <td className="p-3 min-w-[150px]">
                        <EditableSelect
                          value={item.grade}
                          onChange={(v) => updateItem(item.id, 'grade', v)}
                          options={MATERIAL_GRADES}
                          placeholder="Select Grade"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="p-3 w-24">
                        <input type="number" value={item.thickness ?? ''} onChange={(e) => updateItem(item.id, 'thickness', e.target.value)} className="w-full bg-transparent border-transparent focus:ring-0 text-sm font-bold text-blue-600" placeholder="0" />
                      </td>
                      <td className="p-3 w-72 min-w-[240px]">
                        {item.shape === 'Ring' ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">OD</span>
                              <input type="number" value={item.od ?? ''} onChange={(e) => updateItem(item.id, 'od', e.target.value)} className="w-24 bg-slate-50 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none print:bg-transparent print:font-bold" placeholder="OD" />
                            </div>
                            <span className="text-slate-300 mt-3">x</span>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">ID</span>
                              <input type="number" value={item.id_dim ?? ''} onChange={(e) => updateItem(item.id, 'id_dim', e.target.value)} className="w-24 bg-slate-50 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none print:bg-transparent print:font-bold" placeholder="ID" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input type="number" value={item.length ?? ''} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-24 bg-slate-50 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none print:bg-transparent print:font-bold" placeholder="L" />
                            <span className="text-slate-300">x</span>
                            <input type="number" value={item.width ?? ''} onChange={(e) => updateItem(item.id, 'width', e.target.value)} className="w-24 bg-slate-50 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none print:bg-transparent print:font-bold" placeholder="W" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 w-20">
                        <input type="number" value={item.nos ?? ''} onChange={(e) => updateItem(item.id, 'nos', e.target.value)} className="w-full bg-transparent border-transparent focus:ring-0 text-sm font-medium" placeholder="1" />
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-semibold text-slate-700">{item.weight} Kg</span>
                      </td>
                      <td className="p-3 w-44 min-w-[160px]">
                        {item.shape === 'Ring' ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400 w-5 uppercase">OD</span>
                              <input 
                                type="number" 
                                value={item.odRate ?? ''} 
                                onChange={(e) => updateItem(item.id, 'odRate', e.target.value)} 
                                className="w-full bg-blue-50/50 border border-blue-100 rounded px-2 py-0.5 text-xs font-bold text-blue-700 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500" 
                                placeholder="OD Rate" 
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-slate-400 w-5 uppercase">ID</span>
                              <input 
                                type="number" 
                                value={item.idRate ?? ''} 
                                onChange={(e) => updateItem(item.id, 'idRate', e.target.value)} 
                                className="w-full bg-amber-50/50 border border-amber-100 rounded px-2 py-0.5 text-xs font-bold text-amber-700 outline-none focus:bg-white focus:ring-1 focus:ring-amber-500" 
                                placeholder="ID Rate" 
                              />
                            </div>
                          </div>
                        ) : (
                          <input type="number" value={item.rate ?? ''} onChange={(e) => updateItem(item.id, 'rate', e.target.value)} className="w-full bg-transparent border-transparent focus:ring-0 text-sm font-bold text-emerald-600" placeholder="0.00" />
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-bold text-blue-700">₹{(item.amount / (item.nos || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-bold text-slate-800">₹{item.amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3 text-center print:hidden">
                        <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 print:bg-white text-slate-800">
                  <tr className="border-t border-slate-200">
                    <td colSpan={8} className="p-3 text-right text-[10px] font-bold uppercase text-slate-400">Sub Total</td>
                    <td className="p-3 text-right font-bold">₹ {totalAmount.toLocaleString()}</td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr>
                    <td colSpan={8} className="p-2 text-right text-[10px] font-bold uppercase text-slate-400">Loading & Unloading Charges</td>
                    <td className="p-2 text-right">
                      <input 
                        type="number" 
                        value={loadingCharges || ''} 
                        onChange={(e) => setLoadingCharges(parseFloat(e.target.value) || 0)} 
                        className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-right text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none print:border-none print:p-0 print:w-auto" 
                        placeholder="0"
                      />
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr>
                    <td colSpan={8} className="p-2 text-right text-[10px] font-bold uppercase text-slate-400">Transport Charges</td>
                    <td className="p-2 text-right">
                      <input 
                        type="number" 
                        value={transportCharges || ''} 
                        onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)} 
                        className="w-24 bg-white border border-slate-200 rounded px-2 py-1 text-right text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none print:border-none print:p-0 print:w-auto" 
                        placeholder="0"
                      />
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr>
                    <td colSpan={8} className="p-2 text-right text-[10px] font-bold uppercase text-slate-400 align-middle">
                      GST 
                      <select 
                        value={gstRate} 
                        onChange={(e) => setGstRate(parseInt(e.target.value))} 
                        className="ml-2 bg-transparent border-none text-[10px] font-bold focus:ring-0 outline-none cursor-pointer print:appearance-none"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>
                    </td>
                    <td className="p-2 text-right font-bold text-slate-600">₹ {Math.ceil((totalAmount + loadingCharges + transportCharges) * gstRate / 100).toLocaleString()}</td>
                    <td className="print:hidden"></td>
                  </tr>
                  <tr className="bg-blue-50/50 print:bg-white">
                    <td colSpan={8} className="p-4 text-right text-xs font-black uppercase text-blue-600 tracking-wider">Grand Total Amount</td>
                    <td className="p-4 text-right text-xl font-black text-slate-900 border-t-2 border-blue-600">
                      ₹ {Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100)).toLocaleString()}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div id="quotation-print-area" className="hidden print:block fixed inset-0 bg-white p-0 m-0 z-[9999] overflow-visible">
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: A4; margin: 15mm 15mm; }
          body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 10pt; line-height: 1.4; }
          .print-utility { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
          .print-utility td { font-size: 8pt; color: #333; padding: 2px 0; }
          .print-header-box { text-align: center; border: 1px solid #000; padding: 10px; margin-bottom: 15px; margin-top: 5px; }
          .print-company-name { font-size: 22pt; font-weight: bold; letter-spacing: 1px; margin: 0 0 4px 0; }
          .print-company-mfg { font-size: 9.5pt; font-weight: normal; margin: 0 0 6px 0; }
          .print-company-address { font-size: 9.5pt; margin: 0 0 4px 0; }
          .print-company-contact { font-size: 9pt; margin: 0; }
          .print-doc-banner { text-align: center; font-weight: bold; font-size: 13pt; border: 1px solid #000; padding: 5px; background-color: #f2f2f2; margin-bottom: 15px; letter-spacing: 0.5px; }
          .print-info-grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .print-info-grid td { width: 50%; vertical-align: top; }
          .print-inner-info { width: 100%; border-collapse: collapse; border: 1px solid #000; }
          .print-inner-info td { padding: 6px 8px; font-size: 9.5pt; border-bottom: 1px solid #eee; }
          .print-label { font-weight: bold; width: 35%; }
          .print-data-grid { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px; }
          .print-data-grid th { border: 1px solid #000; background-color: #f2f2f2; padding: 8px 6px; font-weight: bold; font-size: 9.5pt; text-align: left; }
          .print-data-grid td { border: 1px solid #000; padding: 8px 6px; font-size: 9.5pt; vertical-align: top; }
          .print-summary-wrapper { width: 100%; margin-bottom: 25px; overflow: hidden; }
          .print-summary-block { width: 40%; float: right; border-collapse: collapse; border: 1px solid #000; }
          .print-summary-block td { padding: 5px 8px; font-size: 9.5pt; border-bottom: 1px solid #ddd; text-align: right; }
          .print-grand-total { background-color: #f9f9f9; font-weight: bold; font-size: 10.5pt; border-top: 1px solid #000; }
          .print-remarks-box { width: 100%; border: 1px solid #000; padding: 8px; font-size: 9pt; margin-bottom: 60px; background-color: #fafafa; }
          .print-sigs { width: 100%; border-collapse: collapse; margin-top: 40px; }
          .print-sigs td { width: 50%; text-align: center; font-size: 10pt; vertical-align: bottom; }
          .print-sig-line { margin-top: 55px; font-weight: bold; border-top: 1px dashed #000; display: inline-block; width: 200px; padding-top: 5px; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
        `}} />

        <table className="print-utility">
          <tbody>
            <tr>
              <td>SINCE 2002W</td>
              <td className="text-right font-bold">GSTIN: 24AJGPP9863R1Z5</td>
            </tr>
          </tbody>
        </table>

        <div className="print-header-box">
          <div className="print-company-name">JAGDAMBA PROFILE</div>
          <div className="print-company-mfg">Mfg.: M.S. & S.S., C.N.C. Profile Cutting Traders & Steel</div>
          <div className="print-company-address">Office: 504/1, GIDC, Industrial Estate, Makarpura, Vadodara - 390010.</div>
          <div className="print-company-contact">Ph: 9824917250, 9824025001, 8799617250, 8799617251 | Email: jagdambaprofile@gmail.com</div>
        </div>

        <div className="print-doc-banner">QUOTATION ACKNOWLEDGEMENT</div>

        <table className="print-info-grid">
          <tbody>
            <tr>
              <td style={{ paddingRight: '10px' }}>
                <table className="print-inner-info">
                  <tbody>
                    <tr><td className="print-label">Customer:</td><td>{partyName || '-'}</td></tr>
                    <tr><td className="print-label">Contact Person:</td><td>{contactPerson || '-'}</td></tr>
                    <tr><td className="print-label">Mobile No.:</td><td>{mobileNo || '-'}</td></tr>
                    <tr><td className="print-label">Address:</td><td>{address || '-'}</td></tr>
                  </tbody>
                </table>
              </td>
              <td style={{ paddingLeft: '10px' }}>
                <table className="print-inner-info">
                  <tbody>
                    <tr><td className="print-label">Quotation No.:</td><td className="font-bold">{quoteNo}</td></tr>
                    <tr><td className="print-label">Quotation Date:</td><td>{date}</td></tr>
                    <tr><td className="print-label">Valid Until:</td><td>{validUntil}</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="print-data-grid">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '6%' }}>Sr.</th>
              <th style={{ width: '26%' }}>Description of Material</th>
              <th style={{ width: '10%' }}>Grade</th>
              <th className="text-center" style={{ width: '8%' }}>Thk</th>
              <th className="text-center" style={{ width: '10%' }}>Qty</th>
              <th className="text-center" style={{ width: '12%' }}>Weight</th>
              <th className="text-right" style={{ width: '14%' }}>Rate / Nos</th>
              <th className="text-right" style={{ width: '14%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: QuotationItem, idx: number) => (
              <tr key={item.id}>
                <td className="text-center">{idx + 1}</td>
                <td>
                  <strong>{item.shape}</strong>
                  <br />
                  <small style={{ color: '#555' }}>
                    {item.shape === 'Ring' 
                      ? `Dimensions: OD: ${item.od} × ID: ${item.id_dim} mm`
                      : `Dimensions: ${item.length} × ${item.width} mm`
                    }
                  </small>
                </td>
                <td>{item.grade}</td>
                <td className="text-center">{item.thickness}</td>
                <td className="text-center">{item.nos} Nos</td>
                <td className="text-center">{item.weight} Kg</td>
                <td className="text-right">₹{(item.amount / (item.nos || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="text-right font-bold">₹{item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-summary-wrapper">
          <table className="print-summary-block">
            <tbody>
              <tr><td className="text-right font-bold">Sub Total:</td><td>₹{totalAmount.toLocaleString()}</td></tr>
              <tr><td className="text-right font-bold">Loading / Unloading:</td><td>₹{loadingCharges.toLocaleString()}</td></tr>
              <tr><td className="text-right font-bold">Transport Charges:</td><td>₹{transportCharges.toLocaleString()}</td></tr>
              <tr><td className="text-right font-bold">GST ({gstRate}%):</td><td>₹{Math.ceil((totalAmount + loadingCharges + transportCharges) * gstRate / 100).toLocaleString()}</td></tr>
              <tr className="print-grand-total">
                <td className="text-right uppercase">Grand Total:</td>
                <td className="font-bold">₹{Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="print-remarks-box">
          <div className="font-bold mb-1">Remarks:</div>
          No special instructions. Rates are processed according to the technical profile parameters provided.
        </div>

        <table className="print-sigs">
          <tbody>
            <tr>
              <td><div className="print-sig-line">Customer Signature</div></td>
              <td>
                <div>For, <strong>JAGDAMBA PROFILE</strong></div>
                <div className="print-sig-line" style={{ marginTop: '40px' }}>Authorized Signatory</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
