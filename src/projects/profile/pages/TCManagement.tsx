import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, type TCRecord, MATERIAL_GRADES } from '../store/AppContext';
import { 
  FileSearch, Plus, Search, Filter, History, 
  Send, CheckCircle2, 
  Printer, Trash2, Edit3, X, Calendar,
  Hash, Layers, Ruler, Weight, Factory, ClipboardList, Download, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../components/Sidebar';
import { generateTCPDFBase64 } from '../utils/pdfGenerator';

export const TCManagement: React.FC = () => {
  const { t, tcRecords, addTCRecord, updateTCRecord, deleteTCRecord } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTC, setSelectedTC] = useState<TCRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [mailData, setMailData] = useState({ to: '', subject: '', message: '' });
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  
  // Advanced Search Filters
  const [filters, setFilters] = useState({
    heatNumber: '',
    plateNumber: '',
    tcNumber: '',
    salesOrderNumber: '',
    partyName: '',
    grade: '',
    thickness: '',
    make: '',
    invoiceNumber: ''
  });

  // Form State
  const [formData, setFormData] = useState<Partial<TCRecord>>({
    heatNumber: '',
    plateNumber: '',
    tcNumber: '',
    tcDate: new Date().toISOString().split('T')[0],
    salesOrderNumber: '',
    salesOrderDate: '',
    purchaseOrderNumber: '',
    purchaseOrderDate: '',
    supplierInvoiceNumber: '',
    supplierInvoiceDate: '',
    grnNumber: '',
    grade: '',
    thickness: '',
    width: '',
    length: '',
    plateWeight: '',
    make: '',
    standard: '',
    batchNumber: '',
    remarks: '',
    emailStatus: 'Not Sent',
    dispatchHistory: []
  });

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return tcRecords.filter(record => {
      const matchSearch = searchQuery === '' || 
        record.heatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.tcNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchFilters = 
        (filters.heatNumber === '' || record.heatNumber.toLowerCase().includes(filters.heatNumber.toLowerCase())) &&
        (filters.plateNumber === '' || record.plateNumber.toLowerCase().includes(filters.plateNumber.toLowerCase())) &&
        (filters.tcNumber === '' || record.tcNumber.toLowerCase().includes(filters.tcNumber.toLowerCase())) &&
        (filters.salesOrderNumber === '' || record.salesOrderNumber.toLowerCase().includes(filters.salesOrderNumber.toLowerCase())) &&
        (filters.grade === '' || record.grade.toLowerCase().includes(filters.grade.toLowerCase())) &&
        (filters.thickness === '' || record.thickness.toLowerCase().includes(filters.thickness.toLowerCase())) &&
        (filters.make === '' || record.make.toLowerCase().includes(filters.make.toLowerCase())) &&
        (filters.invoiceNumber === '' || record.supplierInvoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase()));

      return matchSearch && matchFilters;
    });
  }, [tcRecords, searchQuery, filters]);


  // Auto-weight Calculation
  useEffect(() => {
    if (formData.thickness && formData.width && formData.length) {
      const thk = parseFloat(formData.thickness as string) || 0;
      const w = parseFloat(formData.width as string) || 0;
      const l = parseFloat(formData.length as string) || 0;
      
      if (thk > 0 && w > 0 && l > 0) {
        const weight = (thk * w * l * 8) / 1000000;
        setFormData(prev => ({ ...prev, plateWeight: weight.toFixed(3).toString() }));
      }
    }
  }, [formData.thickness, formData.width, formData.length]);

  // Duplicate Check
  useEffect(() => {
    if (isAdding && (formData.heatNumber || formData.plateNumber)) {
      const duplicateHeat = tcRecords.find(r => r.heatNumber === formData.heatNumber);
      const duplicatePlate = tcRecords.find(r => r.plateNumber === formData.plateNumber);
      
      if (duplicateHeat || duplicatePlate) {
        toast.error(
          `Duplicate detected! ${duplicateHeat ? 'Heat No ' + formData.heatNumber : ''} ${duplicatePlate ? 'Plate No ' + formData.plateNumber : ''} already exists.`,
          { id: 'duplicate-alert', duration: 4000 }
        );
      }
    }
  }, [formData.heatNumber, formData.plateNumber, isAdding, tcRecords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.heatNumber || !formData.plateNumber || !formData.tcNumber) {
      toast.error('Required fields: Heat No, Plate No, TC No');
      return;
    }

    const newRecord: TCRecord = {
      ...formData as TCRecord,
      id: selectedTC ? selectedTC.id : `TC-${Date.now()}`,
      dispatchHistory: selectedTC ? selectedTC.dispatchHistory : []
    };

    if (selectedTC) {
      updateTCRecord(newRecord);
      toast.success('TC Record updated');
    } else {
      addTCRecord(newRecord);
      toast.success('New TC Record added');
    }
    
    setIsAdding(false);
    setSelectedTC(null);
    setFormData({
      heatNumber: '',
      plateNumber: '',
      tcNumber: '',
      tcDate: new Date().toISOString().split('T')[0],
      emailStatus: 'Not Sent',
      dispatchHistory: []
    });
  };

  const handleSelectRecord = (record: TCRecord) => {
    setSelectedTC(record);
    setIsAdding(false);
  };

  const handleEdit = (record: TCRecord) => {
    setSelectedTC(record);
    setFormData(record);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteTCRecord(id);
      toast.success('Record deleted');
    }
  };

  const handleResendEmail = (record: TCRecord) => {
    setMailData({
      to: '',
      subject: `Test Certificate - Heat No: ${record.heatNumber} (Plate: ${record.plateNumber})`,
      message: `Dear Client,\n\nPlease find the attached Test Certificate for Heat No: ${record.heatNumber}.\n\nRegards,\nJagdamba Steel`
    });
    setSelectedTC(record);
    setShowMailModal(true);
  };

  const sendEmail = async () => {
    if (!selectedTC) return;

    if (!mailData.to) {
      toast.error('Recipient email is required');
      return;
    }

    let tcDataToSend = selectedTC.pdfData;
    if (!tcDataToSend) {
      tcDataToSend = generateTCPDFBase64(selectedTC);
    }

    const loadingToast = toast.loading('Sending email...');
    try {
      const response = await fetch('http://localhost:5000/api/mail/send-tc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: mailData.to,
          subject: mailData.subject,
          message: mailData.message,
          tcData: tcDataToSend,
          fileName: selectedTC.pdfName || `TC_${selectedTC.heatNumber || 'Generated'}.pdf`
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Email sent successfully!', { id: loadingToast });
        setShowMailModal(false);
        updateTCRecord({ ...selectedTC, emailStatus: 'Sent' });
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`Failed to send email: ${err.message}`, { id: loadingToast });
    }
  };

  const handleWhatsAppTC = (record: TCRecord) => {
    setWhatsAppData({
      number: '',
      message: `*Test Certificate*\n\n*Heat No:* ${record.heatNumber}\n*Plate No:* ${record.plateNumber}\n*Grade:* ${record.grade}\n*Thickness:* ${record.thickness}\n\nPlease find the attached TC document.`
    });
    setSelectedTC(record);
    setShowWhatsAppModal(true);
  };

  const sendWhatsApp = async () => {
    if (!selectedTC) return;

    if (!whatsAppData.number) {
      toast.error('WhatsApp number is required');
      return;
    }

    let tcDataToSend = selectedTC.pdfData;
    if (!tcDataToSend) {
      tcDataToSend = generateTCPDFBase64(selectedTC);
    }

    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      const response = await fetch('http://localhost:5001/api/whatsapp/send-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: whatsAppData.number,
          mediaData: tcDataToSend,
          fileName: selectedTC.pdfName || `TC_${selectedTC.heatNumber || 'Generated'}.pdf`,
          caption: whatsAppData.message
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('WhatsApp message sent!', { id: loadingToast });
        setShowWhatsAppModal(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`WhatsApp Error: ${err.message}`, { id: loadingToast });
    }
  };

  return (
    <>
    <div className="max-w-[1600px] mx-auto p-4 space-y-6 fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-blue-600" />
            {t('tcManagement')}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage Test Certificates & Material History</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end px-4 border-r border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Certificates</span>
            <span className="text-xl font-black text-slate-800">{tcRecords.length}</span>
          </div>
          <button 
            onClick={() => { setIsAdding(true); setSelectedTC(null); setFormData({ ...formData, id: '', heatNumber: '', plateNumber: '', tcNumber: '' }); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New TC
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Heat / Plate / TC..."
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
            
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                showAdvancedSearch ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              )}
            >
              <Filter className="w-4 h-4" />
              Advanced Search Filters
            </button>

            {showAdvancedSearch && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 slide-down">
                {Object.keys(filters).map((key) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                    {key === 'grade' ? (
                      <select 
                        value={(filters as any)[key]}
                        onChange={(e) => setFilters({...filters, [key]: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">All Grades</option>
                        {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : key === 'make' ? (
                      <select 
                        value={(filters as any)[key]}
                        onChange={(e) => setFilters({...filters, [key]: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">All Makes</option>
                        <option value="AM/NS INDIA">AM/NS INDIA</option>
                        <option value="JINDAL ODISHA">JINDAL ODISHA</option>
                        <option value="JINDAL RAIGHAD">JINDAL RAIGHAD</option>
                        <option value="SELL RSP">SELL RSP</option>
                        <option value="SELL">SELL</option>
                        <option value="TATA">TATA</option>
                        <option value="JSW">JSW</option>
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={(filters as any)[key]}
                        onChange={(e) => setFilters({...filters, [key]: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      />
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setFilters({ heatNumber: '', plateNumber: '', tcNumber: '', salesOrderNumber: '', partyName: '', grade: '', thickness: '', make: '', invoiceNumber: '' })}
                  className="col-span-2 text-[10px] font-bold text-red-500 uppercase py-2 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Results ({filteredRecords.length})</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {filteredRecords.map(record => (
                <div 
                  key={record.id}
                  onClick={() => handleSelectRecord(record)}
                  className={cn(
                    "p-4 hover:bg-blue-50/30 cursor-pointer transition-all group",
                    selectedTC?.id === record.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{record.heatNumber}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{record.grade}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {record.plateNumber}</span>
                    <span className="flex items-center gap-1"><FileSearch className="w-3 h-3" /> {record.tcNumber}</span>
                  </div>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="font-bold">No records found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form or History */}
        <div className="lg:col-span-8 space-y-6">
          {isAdding ? (
            <div className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden slide-up">
              <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedTC ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    {selectedTC ? 'Edit Test Certificate' : 'New TC Master Entry'}
                  </h2>
                  <p className="text-blue-100 text-xs mt-1">All fields marked with * are essential for tracking</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Field Groups */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Core Tracking
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Heat Number *</label>
                        <input type="text" required value={formData.heatNumber} onChange={e => setFormData({...formData, heatNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. H12345" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plate Number *</label>
                        <input type="text" required value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. P9876" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TC Number *</label>
                        <input type="text" required value={formData.tcNumber} onChange={e => setFormData({...formData, tcNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. TC-2026-001" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TC Date</label>
                        <input type="date" value={formData.tcDate} onChange={e => setFormData({...formData, tcDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Orders Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Order & Invoice
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sales Order No</label>
                          <input type="text" value={formData.salesOrderNumber} onChange={e => setFormData({...formData, salesOrderNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SO Date</label>
                          <input type="date" value={formData.salesOrderDate} onChange={e => setFormData({...formData, salesOrderDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Purchase Order No</label>
                          <input type="text" value={formData.purchaseOrderNumber} onChange={e => setFormData({...formData, purchaseOrderNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PO Date</label>
                          <input type="date" value={formData.purchaseOrderDate} onChange={e => setFormData({...formData, purchaseOrderDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier Inv No</label>
                          <input type="text" value={formData.supplierInvoiceNumber} onChange={e => setFormData({...formData, supplierInvoiceNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inv Date</label>
                          <input type="date" value={formData.supplierInvoiceDate} onChange={e => setFormData({...formData, supplierInvoiceDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GRN Number</label>
                        <input type="text" value={formData.grnNumber} onChange={e => setFormData({...formData, grnNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Technical Specs
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grade</label>
                          <select 
                            value={formData.grade} 
                            onChange={e => setFormData({...formData, grade: e.target.value})} 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select Grade</option>
                            {MATERIAL_GRADES.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thickness</label>
                          <input type="text" value={formData.thickness} onChange={e => setFormData({...formData, thickness: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 10mm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Width (mm)</label>
                          <input type="text" value={formData.width} onChange={e => setFormData({...formData, width: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Length (mm)</label>
                          <input type="text" value={formData.length} onChange={e => setFormData({...formData, length: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plate Wt (Kg)</label>
                          <input type="text" value={formData.plateWeight} onChange={e => setFormData({...formData, plateWeight: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Make / Company</label>
                          <select 
                            value={formData.make} 
                            onChange={e => setFormData({...formData, make: e.target.value})} 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
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
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard / Specification</label>
                        <input type="text" value={formData.standard} onChange={e => setFormData({...formData, standard: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. ASTM A36" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="pt-6 border-t border-slate-50">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Printer className="w-4 h-4" /> Attachments
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                      <Download className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2" />
                      <span className="text-sm font-bold text-slate-600">
                        {formData.pdfName ? formData.pdfName : 'Upload TC PDF or Photo'}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">Accepts PDF, JPG, PNG</span>
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              setFormData({
                                ...formData,
                                pdfData: result,
                                pdfName: file.name
                              });
                              toast.success(`${file.type.startsWith('image/') ? 'Photo' : 'PDF'} attached successfully`);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {formData.pdfData && (
                      <div className="flex flex-col gap-2">
                        {formData.pdfData.startsWith('data:image/') ? (
                          <img src={formData.pdfData} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              const win = window.open();
                              win?.document.write(`<iframe src="${formData.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }}
                            className="p-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-colors"
                          >
                            Preview PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                  <button type="submit" className="px-10 py-3 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                    {selectedTC ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {selectedTC ? 'Update Record' : 'Save TC Master'}
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTC ? (
            <div className="space-y-6 slide-up">
              {/* Detailed View */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <FileSearch className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">TC Record: {selectedTC.tcNumber}</h2>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                        <History className="w-3 h-3 text-blue-600" />
                        Heat: {selectedTC.heatNumber} • Plate: {selectedTC.plateNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTC.pdfData && (
                      <button 
                        onClick={() => {
                          const win = window.open();
                          win?.document.write(`<iframe src="${selectedTC.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                      >
                        <FileSearch className="w-4 h-4" />
                        View Attachment
                      </button>
                    )}
                    <button 
                      onClick={() => handleResendEmail(selectedTC)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      Mail TC
                    </button>
                    <button 
                      onClick={() => handleWhatsAppTC(selectedTC)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-100 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp TC
                    </button>
                    <button onClick={() => handleEdit(selectedTC)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Edit Record"><Edit3 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(selectedTC.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Record"><Trash2 className="w-5 h-5" /></button>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors" title="Print TC"><Printer className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <DetailCard icon={Layers} label="Material Grade" value={selectedTC.grade} />
                  <DetailCard icon={Ruler} label="Thickness" value={selectedTC.thickness} />
                  <DetailCard icon={Weight} label="Plate Weight" value={`${selectedTC.plateWeight} Kg`} />
                  <DetailCard icon={Factory} label="Make / Company" value={selectedTC.make} />
                  <DetailCard icon={Calendar} label="TC Date" value={selectedTC.tcDate} />
                  <DetailCard icon={Hash} label="Sales Order" value={selectedTC.salesOrderNumber || '-'} />
                  <DetailCard icon={Hash} label="Supplier Inv" value={selectedTC.supplierInvoiceNumber || '-'} />
                  <DetailCard icon={CheckCircle2} label="Email Status" value={selectedTC.emailStatus} variant={selectedTC.emailStatus === 'Sent' ? 'success' : 'warning'} />
                </div>
              </div>

              {/* History Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Dispatch History & Tracking
                  </h3>
                  <button 
                    onClick={() => handleResendEmail(selectedTC)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Resend Email to All
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="px-6 py-4">Party Name</th>
                        <th className="px-6 py-4">Date of Dispatch</th>
                        <th className="px-6 py-4">SO Number</th>
                        <th className="px-6 py-4">TC Number</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedTC.dispatchHistory.map((history, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">{history.partyName}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{history.dispatchDate}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700">{history.salesOrderNumber}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{history.tcNumber}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                              history.emailStatus === 'Sent' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {history.emailStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleResendEmail(selectedTC)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                            >
                              Resend
                            </button>
                          </td>
                        </tr>
                      ))}
                      {selectedTC.dispatchHistory.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">No dispatch history recorded for this certificate</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100 text-center border-dashed border-2 border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FileSearch className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Select a Certificate</h3>
              <p className="text-slate-500 max-w-xs mt-2">Choose a TC from the left sidebar to view its complete specifications and history.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
              >
                <Plus className="w-4 h-4" /> Or create a new one
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Email Modal */}
    {showMailModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-emerald-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Send className="w-8 h-8" />
                Mail Certificate
              </h3>
              <button onClick={() => setShowMailModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Sending TC for Heat: {selectedTC?.heatNumber}</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipient Email *</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={mailData.to}
                    onChange={e => setMailData({...mailData, to: e.target.value})}
                    placeholder="client@example.com"
                    className="w-full bg-slate-50 border-none rounded-2xl pl-4 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                <input 
                  type="text" 
                  value={mailData.subject}
                  onChange={e => setMailData({...mailData, subject: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                <textarea 
                  rows={4}
                  value={mailData.message}
                  onChange={e => setMailData({...mailData, message: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-emerald-900 truncate">{selectedTC?.pdfName || `Generated_TC_${selectedTC?.heatNumber}.pdf`}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{selectedTC?.pdfData ? 'Ready as Attachment' : 'Auto-Generated Attachment'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowMailModal(false)}
                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={sendEmail}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* WhatsApp Modal */}
    {showWhatsAppModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-green-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                WhatsApp TC
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-green-100 text-sm font-medium">Sending TC to WhatsApp: {selectedTC?.heatNumber}</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number *</label>
                <input 
                  type="text" 
                  required
                  value={whatsAppData.number}
                  onChange={e => setWhatsAppData({...whatsAppData, number: e.target.value})}
                  placeholder="e.g. 98XXXXXXXX"
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Message Caption</label>
                <textarea 
                  rows={5}
                  value={whatsAppData.message}
                  onChange={e => setWhatsAppData({...whatsAppData, message: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-green-900 truncate">{selectedTC?.pdfName || `Generated_TC_${selectedTC?.heatNumber}.pdf`}</p>
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">{selectedTC?.pdfData ? 'Ready for WhatsApp' : 'Auto-Generated Attachment'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={sendWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

const DetailCard: React.FC<{ icon: any, label: string, value: string, variant?: 'default' | 'success' | 'warning' }> = ({ icon: Icon, label, value, variant = 'default' }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2 text-slate-400">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <p className={cn(
      "text-sm font-black",
      variant === 'success' ? "text-emerald-600" : variant === 'warning' ? "text-amber-600" : "text-slate-800"
    )}>
      {value || '-'}
    </p>
  </div>
);
