import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, Printer, RotateCcw, User, Ruler, Scissors, Search, List } from 'lucide-react';
import { useAppContext, type CNCQuotationRecord, MATERIAL_GRADES } from '../store/AppContext';
import toast from 'react-hot-toast';
import { EditableSelect } from '../components/EditableSelect';

interface CNCItem {
  id: string;
  shape: 'CNC Profile' | 'Square';
  drawingNo: string;
  grade: string;
  thickness: number;
  width: number;
  length: number;
  plateNos: number;
  plateRate: number;
  partOfNos: number;
  finishGoodWeight: number;
  mtr: number;
  piercing: number;
  piercingType: 'Full' | 'Half' | 'Manual';
  burningLossFactor: number;
  scrapRate: number;
  meterFactor: number;
  piercingRate: number;
  amount: number;
  finalRate: number;
  plateWeight: number;
}

export const CNCQuotation: React.FC = () => {
  const { cncQuotations, addCNCQuotation, deleteCNCQuotation } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'create' | 'list'>('create');
  const [search, setSearch] = useState('');

  const [partyName, setPartyName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quoteNo, setQuoteNo] = useState(`CNC-${Date.now().toString().slice(-6)}`);
  
  const getBurningLossFactor = (thk: number): number => {
    if (thk <= 12) return 3;
    if (thk <= 35) return 4;
    if (thk <= 100) return 6;
    if (thk <= 150) return 8;
    return 10;
  };

  const [items, setItems] = useState<CNCItem[]>([
    { 
      id: '1', shape: 'CNC Profile', drawingNo: '', grade: 'IS 2062', thickness: 0, width: 0, length: 0, 
      plateNos: 1, plateRate: 0, partOfNos: 1, finishGoodWeight: 0, mtr: 0, 
      piercing: 0, piercingType: 'Full', burningLossFactor: 3, scrapRate: 0, meterFactor: 1.5, piercingRate: 0, amount: 0, finalRate: 0, plateWeight: 0
    }
  ]);

  const [loadingCharges, setLoadingCharges] = useState(0);
  const [transportCharges, setTransportCharges] = useState(0);
  const [gstRate, setGstRate] = useState(18);

  const calculateItem = (item: CNCItem): { finalRate: number, amount: number, plateWeight: number } => {
    const thickness = parseFloat(item.thickness as any) || 0;
    const width = parseFloat(item.width as any) || 0;
    const length = parseFloat(item.length as any) || 0;
    const plateRate = parseFloat(item.plateRate as any) || 0;
    const plateNos = parseInt(item.plateNos as any) || 0;
    const partOfNos = parseInt(item.partOfNos as any) || 0;
    const finishGoodWeight = parseFloat(item.finishGoodWeight as any) || 0;
    const mtr = parseFloat(item.mtr as any) || 0;
    const burningLossFactor = parseFloat(item.burningLossFactor as any) || 0;
    const scrapRate = parseFloat(item.scrapRate as any) || 0;
    const meterFactor = parseFloat(item.meterFactor as any) || 0;
    const piercing = parseInt(item.piercing as any) || 0;
    const piercingRate = parseFloat(item.piercingRate as any) || 0;

    const plateWeight = (thickness * width * length * 8) / 1000000;
    
    if (item.shape === 'Square') {
      // Normal Quotation Square Formula: Weight * Rate
      const totalAmount = plateWeight * plateRate * plateNos;
      const finalRatePerPart = partOfNos > 0 ? (plateWeight * plateRate) / partOfNos : 0;
      
      return {
        finalRate: Math.ceil(finalRatePerPart),
        amount: Math.ceil(totalAmount),
        plateWeight: parseFloat(plateWeight.toFixed(3))
      };
    }

    // CNC Profile Calculation
    const plateCost = plateWeight * plateRate;
    
    // Burning Loss: (Mtr * Thickness * Burning Loss Factor * Density) / 1000 (Density = 8)
    const burningLoss = (mtr * thickness * burningLossFactor * 8) / 1000;
    
    // Final Scrap Weight: Plate Weight - FG Weight - Burning Loss
    const scrapWeight = Math.max(0, plateWeight - finishGoodWeight - burningLoss);
    // Round scrap amount to 0 decimals as per user's Excel (11770.88 -> 11771)
    const scrapCredit = Math.round(scrapWeight * scrapRate);
    
    // New CNC Labour Formula: (Thickness * Meter Factor * Mtr) + (Piercing Qty * Piercing Rate)
    const effectiveMeterRate = thickness * meterFactor;
    
    let effectivePiercingRate = 0;
    if (item.piercingType === 'Full') {
      effectivePiercingRate = thickness;
    } else if (item.piercingType === 'Half') {
      effectivePiercingRate = thickness / 2;
    } else {
      effectivePiercingRate = piercingRate;
    }

    const cuttingCost = Math.round((mtr * effectiveMeterRate) + (piercing * effectivePiercingRate));
    
    const totalCostPerPlate = plateCost + cuttingCost - scrapCredit;
    const finalRatePerPart = partOfNos > 0 ? totalCostPerPlate / partOfNos : 0;
    const totalAmount = totalCostPerPlate * plateNos;

    return {
      finalRate: Math.ceil(finalRatePerPart),
      amount: Math.ceil(totalAmount), // Match user's 70122
      plateWeight: parseFloat(plateWeight.toFixed(3))
    };
  };

  const updateItem = (id: string, field: keyof CNCItem, value: any) => {
    setItems(prev => prev.map((item: CNCItem) => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        
        // Auto-update burning loss factor when thickness changes
        if (field === 'thickness') {
          updated.burningLossFactor = getBurningLossFactor(parseFloat(value) || 0);
        }

        const { finalRate, amount, plateWeight } = calculateItem(updated);
        updated.finalRate = finalRate;
        updated.amount = amount;
        updated.plateWeight = plateWeight;
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems((prev: CNCItem[]) => [
      ...prev,
      { 
        id: Date.now().toString(), shape: 'CNC Profile', drawingNo: '', grade: 'IS 2062', thickness: 0, width: 0, length: 0, 
        plateNos: 1, plateRate: 0, partOfNos: 1, finishGoodWeight: 0, mtr: 0, 
        piercing: 0, piercingType: 'Full', burningLossFactor: 3, scrapRate: 0, meterFactor: 1.5, piercingRate: 0, amount: 0, finalRate: 0, plateWeight: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev: CNCItem[]) => prev.filter((item: CNCItem) => item.id !== id));
  };

  const totalAmount = useMemo(() => items.reduce((sum: number, item: CNCItem) => sum + item.amount, 0), [items]);

  const handleReset = () => {
    setPartyName('');
    setMobileNo('');
    setDate(new Date().toISOString().split('T')[0]);
    setQuoteNo(`CNC-${Date.now().toString().slice(-6)}`);
    setItems([{ 
      id: '1', shape: 'CNC Profile', drawingNo: '', grade: 'IS 2062', thickness: 0, width: 0, length: 0, 
      plateNos: 1, plateRate: 0, partOfNos: 1, finishGoodWeight: 0, mtr: 0, 
      piercing: 0, piercingType: 'Full', burningLossFactor: 3, scrapRate: 0, meterFactor: 1.5, piercingRate: 0, amount: 0, finalRate: 0, plateWeight: 0
    }]);
    setLoadingCharges(0);
    setTransportCharges(0);
    setGstRate(18);
    toast.success('CNC Quotation reset');
  };

  const handleSave = () => {
    if (!partyName) { toast.error('Enter party name'); return; }
    
    const grandTotal = Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100));
    
    const record: CNCQuotationRecord = {
      id: Date.now().toString(),
      quoteNo,
      date,
      partyName,
      mobileNo,
      items,
      loadingCharges,
      transportCharges,
      gstRate,
      totalAmount,
      grandTotal
    };
    
    addCNCQuotation(record);
    toast.success('CNC Quotation saved successfully');
    setViewMode('list');
  };

  const filteredQuotations = useMemo(() => {
    if (!search) return cncQuotations;
    const q = search.toLowerCase();
    return cncQuotations.filter((r: CNCQuotationRecord) => 
      r.quoteNo.toLowerCase().includes(q) || 
      r.partyName.toLowerCase().includes(q) || 
      r.mobileNo.toLowerCase().includes(q)
    );
  }, [cncQuotations, search]);

  const loadQuotation = (q: CNCQuotationRecord) => {
    setQuoteNo(q.quoteNo);
    setDate(q.date);
    setPartyName(q.partyName);
    setMobileNo(q.mobileNo);
    setItems(q.items);
    setLoadingCharges(q.loadingCharges);
    setTransportCharges(q.transportCharges);
    setGstRate(q.gstRate);
    setViewMode('create');
    toast.success('CNC Quotation loaded');
  };

  if (viewMode === 'list') {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 fade-in pb-20 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Saved CNC Quotations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{cncQuotations.length} records found</p>
          </div>
          <button onClick={() => setViewMode('create')} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md">
            + New CNC Quote
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Quote No, Party, Mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">
                <th className="p-4">Quote No</th>
                <th className="p-4">Party Name</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuotations.map((q: CNCQuotationRecord) => (
                <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-all">
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{q.quoteNo}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{q.partyName}</p>
                    <p className="text-[10px] text-slate-400">{q.mobileNo}</p>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{q.date}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{q.items.length} Parts</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-100">₹{q.grandTotal.toLocaleString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => loadQuotation(q)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-bold transition-all">Edit</button>
                    <button onClick={() => deleteCNCQuotation(q.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-bold transition-all">Delete</button>
                  </td>
                </tr>
              ))}
              {filteredQuotations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 italic">No CNC quotations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto space-y-6 fade-in pb-20 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden px-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Scissors className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            CNC Quotation Module
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Specialized pricing for CNC Profile cutting</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:bg-slate-700 transition-all">
            <List className="w-4 h-4" /> Saved Quotes
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-800/50 transition-all">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md">
            Save
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
            <Printer className="w-4 h-4" /> Print Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 px-4">
        {/* Sidebar: Details */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Customer Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Customer Name</label>
                <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="Party Name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Contact / Mobile</label>
                <input type="text" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder="7359604778" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quotation No</label>
                <input type="text" value={quoteNo} onChange={(e) => setQuoteNo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white dark:bg-slate-900/10 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Summary</h3>
                <p className="text-[10px] opacity-60">Final CNC Quote</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Sub Total</span>
                <span className="font-bold">₹ {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-4">
                <span className="opacity-60 font-bold uppercase">Grand Total</span>
                <span className="text-xl font-black text-blue-400">₹ {Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-x-auto print:border-none">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50/50 print:hidden">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Material & Cutting Parameters
              </h2>
              <button onClick={addItem} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                <Plus className="w-4 h-4" /> Add New Part
              </button>
            </div>

            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-black">
                  <th className="p-3 border-r w-12 text-center text-sm font-bold">Sr</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[160px]">Shape / Drawing</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[280px]">Plate Details</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[110px]">Plate Weight (Kg)</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[160px]">Plate Rate / Nos</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[100px]">Part of Nos</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[160px]">FG Total Weight (Kg)</th>
                  <th className="p-3 border-r text-sm font-bold text-blue-600 dark:text-blue-400 min-w-[280px]">Cutting</th>
                  <th className="p-3 border-r text-sm font-bold min-w-[280px]">Scrap Rate</th>
                  <th className="p-3 border-r text-sm font-bold text-emerald-600 dark:text-emerald-400 min-w-[120px]">Final Rate</th>
                  <th className="p-3 text-right text-sm font-bold min-w-[120px]">Amount</th>
                  <th className="p-3 w-10 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: CNCItem, idx: number) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-all text-xs border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3 border-r text-center font-black text-slate-500 dark:text-slate-400 text-sm">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r">
                      <select 
                        value={item.shape} 
                        onChange={(e) => updateItem(item.id, 'shape', e.target.value)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-transparent outline-none mb-1 cursor-pointer"
                      >
                        <option value="CNC Profile">CNC Profile</option>
                      </select>
                      <input type="text" value={item.drawingNo} onChange={(e) => updateItem(item.id, 'drawingNo', e.target.value)} className="w-full bg-transparent font-bold outline-none" placeholder="DRW-001" />
                    </td>
                    <td className="p-3 border-r">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <input type="number" value={item.length ?? ''} onChange={(e) => updateItem(item.id, 'length', e.target.value)} className="w-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold" placeholder="L" />
                          <span className="text-slate-400 font-bold">x</span>
                          <input type="number" value={item.width ?? ''} onChange={(e) => updateItem(item.id, 'width', e.target.value)} className="w-20 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold" placeholder="W" />
                          <span className="text-slate-400 font-bold">x</span>
                          <input type="number" value={item.thickness ?? ''} onChange={(e) => updateItem(item.id, 'thickness', e.target.value)} className="w-16 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-black rounded px-2 py-1 text-sm" placeholder="T" />
                        </div>
                        <EditableSelect 
                          value={item.grade} 
                          onChange={(v) => updateItem(item.id, 'grade', v)} 
                          options={MATERIAL_GRADES}
                          placeholder="GRADE"
                          className="w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-[10px] uppercase font-bold text-slate-700 dark:text-slate-200 outline-none"
                        />
                      </div>
                    </td>
                    <td className="p-3 border-r font-black text-slate-800 dark:text-slate-100 text-sm">
                      {item.plateWeight.toFixed(3)}
                    </td>
                    <td className="p-3 border-r">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">QTY</span>
                          <input type="number" value={item.plateNos ?? ''} onChange={(e) => updateItem(item.id, 'plateNos', e.target.value)} className="w-16 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-slate-400">RATE</span>
                          <input type="number" value={item.plateRate ?? ''} onChange={(e) => updateItem(item.id, 'plateRate', e.target.value)} className="w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded px-1.5 py-0.5" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r">
                      <input type="number" value={item.partOfNos ?? ''} onChange={(e) => updateItem(item.id, 'partOfNos', e.target.value)} className="w-16 bg-blue-50/50 rounded px-2 py-1 font-bold text-center" placeholder="1" />
                    </td>
                    <td className="p-3 border-r">
                      {item.shape === 'Square' ? (
                        <span className="text-slate-400 font-medium italic">Included in Square</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <input type="number" value={item.finishGoodWeight ?? ''} onChange={(e) => updateItem(item.id, 'finishGoodWeight', e.target.value)} className="w-24 bg-slate-50 dark:bg-slate-800/50 rounded px-2 py-1 font-bold text-right" placeholder="0.00" />
                          <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-1">
                            <div className="flex justify-between">
                              <span>Per Part:</span>
                              <span className="text-slate-700 dark:text-slate-200">{(item.partOfNos > 0 ? item.finishGoodWeight / item.partOfNos : 0).toFixed(2)} Kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rate/Kg:</span>
                              <span className="text-blue-700 dark:text-blue-300">₹{(item.finishGoodWeight > 0 ? (item.finalRate * item.partOfNos) / item.finishGoodWeight : 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-r">
                      {item.shape === 'Square' ? (
                        <span className="text-slate-500 dark:text-slate-400 font-medium italic text-center block">-</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 uppercase">MTR</span>
                            <input type="number" value={item.mtr ?? ''} onChange={(e) => updateItem(item.id, 'mtr', e.target.value)} className="w-24 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded px-2 py-1 text-sm font-bold" />
                            <div className="flex flex-col ml-1">
                              <span className="text-xs font-black text-slate-500 dark:text-slate-400">FACTOR</span>
                              <input type="number" value={item.meterFactor ?? ''} onChange={(e) => updateItem(item.id, 'meterFactor', e.target.value)} className="w-14 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-xs font-bold" />
                            </div>
                          </div>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 uppercase">PIER QTY</span>
                              <input type="number" value={item.piercing ?? ''} onChange={(e) => updateItem(item.id, 'piercing', e.target.value)} className="w-24 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded px-2 py-1 text-sm font-bold" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-black text-slate-500 dark:text-slate-400 w-12 uppercase">TYPE</span>
                              <select 
                                value={item.piercingType} 
                                onChange={(e) => updateItem(item.id, 'piercingType', e.target.value)}
                                className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-black rounded px-1 py-1"
                              >
                                <option value="Full">Full (Thk)</option>
                                <option value="Half">Half (Thk/2)</option>
                                <option value="Manual">Manual</option>
                              </select>
                            </div>
                            {item.piercingType === 'Manual' && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-black text-slate-500 dark:text-slate-400 w-12 uppercase">RATE</span>
                                <input type="number" value={item.piercingRate ?? ''} onChange={(e) => updateItem(item.id, 'piercingRate', e.target.value)} className="w-24 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 text-sm font-bold text-amber-700" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 font-bold">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Labour:</span>
                            <span className="text-blue-700 dark:text-blue-300 text-sm font-bold">₹{Math.round((item.mtr * (item.thickness * item.meterFactor)) + (item.piercing * (item.piercingType === 'Full' ? item.thickness : item.piercingType === 'Half' ? item.thickness / 2 : item.piercingRate))).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-r">
                      {item.shape === 'Square' ? (
                        <span className="text-slate-500 dark:text-slate-400 font-medium italic text-center block">-</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-14 uppercase">Scrap Rate</span>
                            <input type="number" value={item.scrapRate ?? ''} onChange={(e) => updateItem(item.id, 'scrapRate', e.target.value)} className="w-24 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 font-black text-amber-700 text-sm" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-14 uppercase">Loss Factor</span>
                            <input type="number" value={item.burningLossFactor ?? ''} onChange={(e) => updateItem(item.id, 'burningLossFactor', e.target.value)} className="w-24 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 font-black text-slate-700 dark:text-slate-200 text-sm" />
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-1">
                            <div className="flex justify-between">
                              <span>Loss:</span>
                              <span className="text-red-500">{( (item.mtr * item.thickness * item.burningLossFactor * 8) / 1000 ).toFixed(2)} Kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Scrap Wt:</span>
                              <span className="text-amber-600">{( Math.max(0, item.plateWeight - item.finishGoodWeight - ((item.mtr * item.thickness * item.burningLossFactor * 8) / 1000)) ).toFixed(2)} Kg</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1 mt-1 font-bold">
                              <span>Scrap Amt:</span>
                              <span className="text-amber-700 font-bold">₹{Math.round(Math.max(0, item.plateWeight - item.finishGoodWeight - ((item.mtr * item.thickness * item.burningLossFactor * 8) / 1000)) * item.scrapRate).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-r bg-emerald-50 dark:bg-emerald-900/30/30">
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">₹{item.finalRate.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Per Part</p>
                    </td>
                    <td className="p-3 text-right font-black">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-center print:hidden">
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="p-2 text-slate-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 dark:bg-red-900/30 rounded-xl transition-all shadow-sm group"
                        title="Remove Item"
                      >
                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan={9} className="p-3 text-right text-xs uppercase text-slate-400">Loading & Unloading</td>
                  <td colSpan={2} className="p-3 text-right">
                    <input type="number" value={loadingCharges || ''} onChange={(e) => setLoadingCharges(parseFloat(e.target.value) || 0)} className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-right" />
                  </td>
                  <td className="print:hidden"></td>
                </tr>
                <tr>
                  <td colSpan={9} className="p-3 text-right text-xs uppercase text-slate-400">Transport Charges</td>
                  <td colSpan={2} className="p-3 text-right">
                    <input type="number" value={transportCharges || ''} onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)} className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-right" />
                  </td>
                  <td className="print:hidden"></td>
                </tr>
                <tr>
                  <td colSpan={9} className="p-3 text-right text-xs uppercase text-slate-400">GST Rate (%)</td>
                  <td colSpan={2} className="p-3 text-right">
                    <select value={gstRate} onChange={(e) => setGstRate(parseInt(e.target.value))} className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1">
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </td>
                  <td className="print:hidden"></td>
                </tr>
                <tr className="bg-blue-600 text-white">
                  <td colSpan={9} className="p-4 text-right text-xs uppercase tracking-widest font-black">Grand Total Amount</td>
                  <td colSpan={2} className="p-4 text-right text-xl font-black">
                    ₹{Math.ceil((totalAmount + loadingCharges + transportCharges) * (1 + gstRate / 100)).toLocaleString()}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Formal Print Format for CNC */}
      <div id="cnc-quotation-print-area" className="hidden print:block fixed inset-0 bg-white dark:bg-slate-900 p-0 m-0 z-[9999] overflow-visible">
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: A4 landscape; margin: 10mm 10mm; }
          body { font-family: Arial, sans-serif; color: #000; background: #fff; font-size: 9pt; line-height: 1.3; }
          .print-utility { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
          .print-utility td { font-size: 8pt; color: #333; padding: 2px 0; }
          .print-header-box { text-align: center; border: 1px solid #000; padding: 8px; margin-bottom: 12px; margin-top: 5px; }
          .print-company-name { font-size: 20pt; font-weight: bold; letter-spacing: 1px; margin: 0 0 2px 0; }
          .print-company-mfg { font-size: 9pt; font-weight: normal; margin: 0 0 4px 0; }
          .print-company-address { font-size: 9pt; margin: 0 0 2px 0; }
          .print-doc-banner { text-align: center; font-weight: bold; font-size: 12pt; border: 1px solid #000; padding: 4px; background-color: #f2f2f2; margin-bottom: 12px; }
          .print-info-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .print-info-grid td { width: 50%; vertical-align: top; }
          .print-inner-info { width: 100%; border-collapse: collapse; border: 1px solid #000; }
          .print-inner-info td { padding: 4px 6px; font-size: 9pt; border-bottom: 1px solid #eee; }
          .print-label { font-weight: bold; width: 30%; }
          .print-data-grid { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 12px; }
          .print-data-grid th { border: 1px solid #000; background-color: #f2f2f2; padding: 6px 4px; font-weight: bold; font-size: 8.5pt; text-align: center; }
          .print-data-grid td { border: 1px solid #000; padding: 6px 4px; font-size: 8.5pt; vertical-align: middle; }
          .print-summary-wrapper { width: 100%; margin-bottom: 20px; overflow: hidden; }
          .print-summary-block { width: 35%; float: right; border-collapse: collapse; border: 1px solid #000; }
          .print-summary-block td { padding: 4px 6px; font-size: 9pt; border-bottom: 1px solid #ddd; text-align: right; }
          .print-grand-total { background-color: #f9f9f9; font-weight: bold; font-size: 10pt; border-top: 1px solid #000; }
          .print-remarks-box { width: 100%; border: 1px solid #000; padding: 6px; font-size: 8.5pt; margin-bottom: 40px; background-color: #fafafa; }
          .print-sigs { width: 100%; border-collapse: collapse; margin-top: 30px; }
          .print-sigs td { width: 50%; text-align: center; font-size: 9.5pt; vertical-align: bottom; }
          .print-sig-line { margin-top: 45px; font-weight: bold; border-top: 1px dashed #000; display: inline-block; width: 180px; padding-top: 4px; }
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
        </div>

        <div className="print-doc-banner">CNC PROFILE CUTTING QUOTATION</div>

        <table className="print-info-grid">
          <tbody>
            <tr>
              <td style={{ paddingRight: '10px' }}>
                <table className="print-inner-info">
                  <tbody>
                    <tr><td className="print-label">Customer:</td><td>{partyName || '-'}</td></tr>
                    <tr><td className="print-label">Mobile No.:</td><td>{mobileNo || '-'}</td></tr>
                  </tbody>
                </table>
              </td>
              <td style={{ paddingLeft: '10px' }}>
                <table className="print-inner-info">
                  <tbody>
                    <tr><td className="print-label">Quote No.:</td><td className="font-bold">{quoteNo}</td></tr>
                    <tr><td className="print-label">Quote Date:</td><td>{date}</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="print-data-grid">
          <thead>
            <tr>
              <th>Sr</th>
              <th>Shape / Drawing</th>
              <th>Details (L x W x T)</th>
              <th>Plate Wt</th>
              <th>Nos</th>
              <th>Rate/Kg</th>
              <th>FG Total Wt</th>
              <th>Scrap</th>
              <th className="text-right">Final Rate</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: CNCItem, idx: number) => (
              <tr key={item.id}>
                <td className="text-center">{idx + 1}</td>
                <td className="text-center font-bold">{item.shape} {item.drawingNo && `(${item.drawingNo})`}</td>
                <td className="text-center">{item.length}x{item.width}x{item.thickness} ({item.grade})</td>
                <td className="text-center">{item.plateWeight} Kg</td>
                <td className="text-center">{item.plateNos}</td>
                <td className="text-center">₹{item.plateRate}</td>
                <td className="text-center">{item.shape === 'Square' ? '-' : `${item.finishGoodWeight} Kg`}</td>
                <td className="text-center">{item.shape === 'Square' ? '-' : `₹${item.scrapRate}`}</td>
                <td className="text-right font-bold">₹{item.finalRate}</td>
                <td className="text-right font-bold">₹{item.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-summary-wrapper">
          <table className="print-summary-block">
            <tbody>
              <tr><td className="text-right font-bold">Sub Total:</td><td>₹{totalAmount.toLocaleString()}</td></tr>
              <tr><td className="text-right font-bold">Charges:</td><td>₹{(loadingCharges + transportCharges).toLocaleString()}</td></tr>
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
          Rates are processed according to the technical profile parameters provided.
        </div>

        <table className="print-sigs">
          <tbody>
            <tr>
              <td><div className="print-sig-line">Customer Signature</div></td>
              <td>
                <div>For, <strong>JAGDAMBA PROFILE</strong></div>
                <div className="print-sig-line">Authorized Signatory</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
