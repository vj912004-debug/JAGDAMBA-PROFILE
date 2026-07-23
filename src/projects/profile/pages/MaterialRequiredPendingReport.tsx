import React, { useState, useMemo } from 'react';
import { Home, FileSpreadsheet, Printer, Search, RotateCcw, CheckSquare, ClipboardList, CheckCircle, Scale, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface MRItem {
  id: string;
  requiredNo: string;
  date: string;
  partyName: string;
  item: string;
  grade: string;
  make: string;
  size: string;
  thickness: string;
  width: string;
  length: string;
  nos: number;
  kg: number;
  deliveryLocation: string;
  status: 'PENDING' | 'COMPLETE';
}

const INITIAL_MOCK_DATA: MRItem[] = [
  { id: '1', requiredNo: 'MR-240525-002', date: '2024-05-23', partyName: 'Jay Ambe Construction', item: 'MS Plate', grade: 'E250', make: 'Jindal', size: '2500 x 12000', thickness: '20', width: '2500', length: '12000', nos: 5, kg: 3930.000, deliveryLocation: 'Makarpura', status: 'PENDING' },
  { id: '2', requiredNo: 'MR-240525-002', date: '2024-05-23', partyName: 'Patel Furnish & Forging Pvt Ltd', item: 'HR Plate', grade: 'E350', make: 'Sail', size: '2000 x 10000', thickness: '12', width: '2000', length: '10000', nos: 12, kg: 2260.000, deliveryLocation: 'Laser Cutting', status: 'PENDING' },
  { id: '3', requiredNo: 'MR-240525-004', date: '2024-05-20', partyName: 'Voith Hydro Ltd', item: 'MS Plate', grade: 'E250', make: 'Jindal', size: '3000 x 12000', thickness: '25', width: '3000', length: '12000', nos: 6, kg: 5655.000, deliveryLocation: 'Por', status: 'PENDING' },
  { id: '4', requiredNo: 'MR-240520-001', date: '2024-05-18', partyName: 'ABC Corp', item: 'MS Plate', grade: 'E250', make: 'Jindal', size: '2500 x 10000', thickness: '10', width: '2500', length: '10000', nos: 4, kg: 2000.000, deliveryLocation: 'Makarpura', status: 'COMPLETE' },
  { id: '5', requiredNo: 'MR-240519-005', date: '2024-05-17', partyName: 'XYZ Engineering', item: 'HR Plate', grade: 'E350', make: 'Essar', size: '2000 x 8000', thickness: '15', width: '2000', length: '8000', nos: 3, kg: 1500.000, deliveryLocation: 'Laser Cutting', status: 'COMPLETE' },
];

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

export const MaterialRequiredPendingReport: React.FC = () => {
  const [data, setData] = useState<MRItem[]>(INITIAL_MOCK_DATA);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETE' | 'ALL'>('PENDING');
  
  const [fromDate, setFromDate] = useState('2024-05-01');
  const [toDate, setToDate] = useState('2024-05-24');
  const [partyName, setPartyName] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (fromDate && item.date < fromDate) return false;
      if (toDate && item.date > toDate) return false;
      if (partyName && item.partyName !== partyName) return false;
      if (deliveryLocation && item.deliveryLocation !== deliveryLocation) return false;
      return true;
    });
  }, [data, fromDate, toDate, partyName, deliveryLocation]);

  const displayData = useMemo(() => {
    if (activeTab === 'ALL') return filteredData;
    return filteredData.filter(item => item.status === activeTab);
  }, [filteredData, activeTab]);

  // Metrics
  const totalItemsCount = data.length;
  const pendingItemsCount = data.filter(d => d.status === 'PENDING').length;
  const completedItemsCount = data.filter(d => d.status === 'COMPLETE').length;

  const totalRequiredNos = data.reduce((sum, d) => sum + d.nos, 0);
  const totalRequiredKg = data.reduce((sum, d) => sum + d.kg, 0);
  const pendingNos = data.filter(d => d.status === 'PENDING').reduce((sum, d) => sum + d.nos, 0);
  const pendingKg = data.filter(d => d.status === 'PENDING').reduce((sum, d) => sum + d.kg, 0);

  const parties = Array.from(new Set(data.map(d => d.partyName)));
  const locations = Array.from(new Set(data.map(d => d.deliveryLocation)));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(displayData.filter(d => d.status === 'PENDING').map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleUpdateOrdered = () => {
    if (selectedIds.size === 0) {
      toast.error('Please tick items to update.');
      return;
    }
    const updated = data.map(item => 
      selectedIds.has(item.id) ? { ...item, status: 'COMPLETE' as const } : item
    );
    setData(updated);
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} items marked as Ordered (Complete).`);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setPartyName('');
    setDeliveryLocation('');
  };

  const kgFmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="flex bg-white items-stretch">
        <Link to="/" className="bg-[#f0851d] text-white flex items-center justify-center px-6 hover:bg-[#d47012] transition-colors">
          <Home className="w-6 h-6" />
        </Link>
        <div className="bg-[#19459b] text-white flex-1 flex items-center px-4 py-3">
          <h1 className="text-xl font-bold uppercase tracking-wide">MATERIAL REQUIRED PENDING REPORT</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white">
          <button onClick={handleUpdateOrdered} className="flex items-center gap-2 bg-[#f0851d] hover:bg-[#d47012] text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors">
            <CheckSquare className="w-4 h-4" /> Update (Ticked as Ordered)
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#0d6efd] hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button className="flex items-center gap-2 bg-[#198754] hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        
        {/* Tabs */}
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveTab('PENDING'); setSelectedIds(new Set()); }}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-[15px] border-2 transition-all shadow-sm",
              activeTab === 'PENDING' ? "bg-[#19459b] border-[#19459b] text-white ring-2 ring-orange-400 ring-offset-2" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <div className={activeTab !== 'PENDING' ? "text-[#19459b]" : ""}><Scale className="w-5 h-5" /></div>
            Pending Items ({pendingItemsCount})
          </button>
          
          <button 
            onClick={() => { setActiveTab('COMPLETE'); setSelectedIds(new Set()); }}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-[15px] border-2 transition-all shadow-sm",
              activeTab === 'COMPLETE' ? "bg-[#198754] border-[#198754] text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <div className={activeTab !== 'COMPLETE' ? "text-[#198754]" : ""}><CheckCircle className="w-5 h-5" /></div>
            Completed Items ({completedItemsCount})
          </button>

          <button 
            onClick={() => { setActiveTab('ALL'); setSelectedIds(new Set()); }}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-bold text-[15px] border-2 transition-all shadow-sm",
              activeTab === 'ALL' ? "bg-gray-700 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            )}
          >
            <div className={activeTab !== 'ALL' ? "text-gray-500" : ""}><ClipboardList className="w-5 h-5" /></div>
            All Items ({totalItemsCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end justify-between gap-4 py-2">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-40">
              <label className="block text-xs font-semibold text-[#f0851d] mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-[#f0851d] mb-1">To Date</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-[#f0851d] mb-1">Party Name</label>
              <select value={partyName} onChange={e => setPartyName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm">
                <option value="">All</option>
                {parties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-[#f0851d] mb-1">Delivery Location</label>
              <select value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm">
                <option value="">All</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-[#0d6efd] text-white px-5 py-1.5 rounded font-semibold text-sm hover:bg-blue-700">
              <Search className="w-4 h-4" /> Search
            </button>
            <button onClick={handleReset} className="flex items-center gap-2 bg-[#f0851d] text-white px-5 py-1.5 rounded font-semibold text-sm hover:bg-orange-600">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="bg-[#f2f8ff] border border-[#d6e8ff] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#0d6efd] mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-[11px] font-bold">Total Items</span>
            </div>
            <div className="text-xl font-bold text-[#19459b]">{totalItemsCount}</div>
          </div>
          
          <div className="bg-[#fff7f0] border border-[#ffe0cc] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#f0851d] mb-1">
              <ClipboardList className="w-4 h-4" />
              <span className="text-[11px] font-bold">Total Required Nos</span>
            </div>
            <div className="text-xl font-bold text-[#000]">{totalRequiredNos}</div>
          </div>

          <div className="bg-[#f2f8ff] border border-[#d6e8ff] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#0d6efd] mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-[11px] font-bold">Total Required Kg</span>
            </div>
            <div className="text-xl font-bold text-[#19459b]">{kgFmt(totalRequiredKg)}</div>
          </div>

          <div className="bg-[#fff7f0] border border-[#ffe0cc] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#f0851d] mb-1">
              <Scale className="w-4 h-4" />
              <span className="text-[11px] font-bold">Pending Items</span>
            </div>
            <div className="text-xl font-bold text-[#000]">{pendingItemsCount}</div>
          </div>

          <div className="bg-[#f2f8ff] border border-[#d6e8ff] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#0d6efd] mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[11px] font-bold">Pending Nos</span>
            </div>
            <div className="text-xl font-bold text-[#19459b]">{pendingNos}</div>
          </div>

          <div className="bg-[#fff7f0] border border-[#ffe0cc] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#f0851d] mb-1">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-[11px] font-bold">Pending Kg</span>
            </div>
            <div className="text-xl font-bold text-[#000]">{kgFmt(pendingKg)}</div>
          </div>

          <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3 rounded flex flex-col justify-center shadow-sm">
            <div className="flex items-center gap-2 text-[#198754] mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[11px] font-bold">Completed Items</span>
            </div>
            <div className="text-xl font-bold text-[#198754]">{completedItemsCount}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden flex-1 flex flex-col shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#19459b] text-white">
                <tr>
                  <th className="px-2 py-2 text-center border-r border-[#153a83] w-16">
                    Tick<br/><span className="text-[10px]">(Material<br/>Mangavvu)</span><br/>
                    {activeTab === 'PENDING' && (
                      <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === displayData.length} className="mt-1 accent-[#f0851d]" />
                    )}
                  </th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83] w-12">Sr.<br/>No.</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Required No.</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Date</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Party Name</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Item</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Grade</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Make</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Size</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Thickness<br/>(mm)</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Width<br/>(mm)</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Length<br/>(mm)</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Nos</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Kg</th>
                  <th className="px-2 py-2 text-center border-r border-[#153a83]">Delivery<br/>Location</th>
                  <th className="px-2 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayData.length === 0 ? (
                  <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-500">No records found.</td></tr>
                ) : displayData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-2 py-3 text-center border-r border-gray-100">
                      {row.status === 'PENDING' ? (
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(row.id)} 
                          onChange={(e) => handleSelect(row.id, e.target.checked)} 
                          className="w-4 h-4 accent-[#f0851d]" 
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{idx + 1}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100 font-medium">{row.requiredNo}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{fmtDate(row.date)}</td>
                    <td className="px-2 py-3 border-r border-gray-100 font-medium">{row.partyName}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.item}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.grade}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.make}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.size}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.thickness}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.width}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.length}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.nos}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{kgFmt(row.kg)}</td>
                    <td className="px-2 py-3 text-center border-r border-gray-100">{row.deliveryLocation}</td>
                    <td className="px-2 py-3 text-center font-bold">
                      {row.status === 'PENDING' ? (
                        <span className="bg-[#f0851d] text-white px-2 py-1 rounded-sm shadow-sm text-[10px]">PENDING</span>
                      ) : (
                        <span className="bg-[#198754] text-white px-2 py-1 rounded-sm shadow-sm text-[10px]">COMPLETE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4 text-xs flex flex-col gap-3">
          <p className="text-gray-700">
            <strong className="text-[#f0851d]">Note:</strong> Click the "Completed Items ({completedItemsCount})" button above to view completed items.<br/>
            Currently, you are viewing <span className="lowercase">{activeTab}</span> items only.
          </p>
          <div className="flex items-center gap-4 bg-white p-3 rounded shadow-sm border border-gray-100 self-start">
            <strong className="text-gray-800">Status Legend :</strong>
            <div className="flex items-center gap-2">
              <span className="bg-[#198754] text-white px-2 py-1 rounded-sm shadow-sm text-[10px] font-bold">COMPLETE</span>
              <span className="text-gray-600">= Ordered (Removed from Pending)</span>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className="bg-[#f0851d] text-white px-2 py-1 rounded-sm shadow-sm text-[10px] font-bold">PENDING</span>
              <span className="text-gray-600">= Still Pending (Need to be Ordered)</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#19459b] text-white py-2 px-6 rounded shadow-md text-sm font-semibold flex items-center justify-center gap-6 -mx-4 -mb-4">
          <span>Total Records : {totalItemsCount}</span>
          <span className="text-[#f0851d]">|</span>
          <span className="text-[#f0851d]">Pending : {pendingItemsCount}</span>
          <span className="text-gray-400">|</span>
          <span className="text-[#20c997]">Completed : {completedItemsCount}</span>
        </div>
      </div>
    </div>
  );
};
