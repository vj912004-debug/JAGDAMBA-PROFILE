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
import { generateTCPDFBase64, getPdfBase64 } from '../utils/pdfGenerator';
import { upper } from '../utils/textCase';
import { PurchaseOrderPrint } from '../components/PurchaseOrderPrint';
import type { PurchaseOrder } from '../store/AppContext';

export const TCManagement: React.FC = () => {
  const { t, tcRecords, addTCRecord, updateTCRecord, deleteTCRecord, purchaseOrders } = useAppContext();
  
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTC, setSelectedTC] = useState<TCRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showGlobalWAModal, setShowGlobalWAModal] = useState(false);
  const [mailData, setMailData] = useState({ to: '', subject: '', message: '' });
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [showPoMailModal, setShowPoMailModal] = useState(false);
  const [poMailData, setPoMailData] = useState({ to: '', subject: '', message: '' });
  const [poForSend, setPoForSend] = useState<PurchaseOrder | null>(null);
  const [poPdfForSend, setPoPdfForSend] = useState<string | null>(null);
  
  // WhatsApp Connection State
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [isWaLoading, setIsWaLoading] = useState(false);

  const getWhatsAppApiUrl = (path: string) => {
    const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : '';
    return `${base}${path}`;
  };
  
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

  // Poll WhatsApp Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(getWhatsAppApiUrl('/api/whatsapp/status'));
        const data = await res.json();
        setWaStatus(data.status);
        if (data.status === 'QR_READY') {
          const qrRes = await fetch(getWhatsAppApiUrl('/api/whatsapp/qr'));
          const qrData = await qrRes.json();
          if (qrData.qr) setWaQr(qrData.qr);
        } else {
          setWaQr(null);
        }
      } catch (e) {
        console.error('Failed to fetch WA status', e);
      }
    };

    fetchStatus(); // immediate check
    
    // Poll fast (3s) if any modal is open, otherwise slower (10s)
    const intervalTime = (showWhatsAppModal || showGlobalWAModal) ? 3000 : 10000;
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [showWhatsAppModal, showGlobalWAModal]);

  const handleWaInit = async () => {
    setIsWaLoading(true);
    try {
      await fetch(getWhatsAppApiUrl('/api/whatsapp/init'), { method: 'POST' });
      toast.success('Initializing WhatsApp... please wait');
    } catch (error) {
      toast.error('Failed to initialize WhatsApp');
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleWaDisconnect = async () => {
    setIsWaLoading(true);
    try {
      await fetch(getWhatsAppApiUrl('/api/whatsapp/disconnect'), { method: 'POST' });
      toast.success('Disconnected from WhatsApp');
      setWaStatus('DISCONNECTED');
      setWaQr(null);
    } catch (error) {
      toast.error('Failed to disconnect WhatsApp');
    } finally {
      setIsWaLoading(false);
    }
  };

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
      const response = await fetch('/api/mail/send-tc', {
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

  const handleEmailPO = (record: TCRecord) => {
    if (!record.purchaseOrderNumber?.trim()) {
      toast.error('No Purchase Order linked to this TC');
      return;
    }
    const po = purchaseOrders.find(
      (p) => p.poNumber.toUpperCase() === record.purchaseOrderNumber!.trim().toUpperCase()
    );
    if (!po) {
      toast.error(`Purchase Order ${record.purchaseOrderNumber} not found`);
      return;
    }
    setSelectedTC(record);
    setPoForSend(po);
    setPoPdfForSend(null);
    setPoMailData({
      to: po.supplierEmail || '',
      subject: `Purchase Order ${po.poNumber} - Jagdamba Steel`,
      message: `Dear ${po.supplierName},\n\nPlease find attached Purchase Order ${po.poNumber}.\n\nRegards,\nJagdamba Steel`,
    });
    setShowPoMailModal(true);
  };

  useEffect(() => {
    if (!showPoMailModal || !poForSend) return;
    const timer = setTimeout(async () => {
      const pdf = await getPdfBase64('tc-po-print-area');
      if (pdf) setPoPdfForSend(pdf);
    }, 500);
    return () => clearTimeout(timer);
  }, [showPoMailModal, poForSend]);

  const sendPoEmail = async () => {
    if (!poForSend) return;
    if (!poMailData.to.trim()) {
      toast.error('Recipient email is required');
      return;
    }

    let pdf = poPdfForSend;
    if (!pdf) {
      pdf = await getPdfBase64('tc-po-print-area');
    }
    if (!pdf) {
      toast.error('Failed to generate PO PDF');
      return;
    }

    const loadingToast = toast.loading('Sending PO email...');
    try {
      const response = await fetch('/api/mail/send-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: poMailData.to,
          subject: poMailData.subject,
          message: poMailData.message,
          poData: pdf,
          fileName: `PO_${poForSend.poNumber}.pdf`,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('PO email sent successfully!', { id: loadingToast });
        setShowPoMailModal(false);
        setPoForSend(null);
        setPoPdfForSend(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      toast.error(`Failed to send PO email: ${err.message}`, { id: loadingToast });
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
      const response = await fetch(getWhatsAppApiUrl('/api/whatsapp/send-media'), {
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <FileSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="bg-linear-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
              {t('tcManagement')}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage Test Certificates & Material History</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* WhatsApp Connection Control */}
          <button 
            onClick={() => setShowGlobalWAModal(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 border",
              waStatus === 'CONNECTED' 
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30" 
                : waStatus === 'QR_READY'
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 animate-pulse"
                : waStatus === 'INITIALIZING'
                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 animate-pulse"
                : "bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/50"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp: {waStatus === 'CONNECTED' ? 'Connected' : waStatus === 'QR_READY' ? 'Scan QR' : waStatus === 'INITIALIZING' ? 'Initializing...' : 'Disconnected'}
          </button>

          <div className="flex flex-col items-end px-4 border-r border-slate-100 dark:border-slate-800">
            <span className="meta-10">Total Certificates</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{tcRecords.length}</span>
          </div>
          
          <button 
            onClick={() => { setIsAdding(true); setSelectedTC(null); setFormData({ ...formData, id: '', heatNumber: '', plateNumber: '', tcNumber: '' }); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New TC
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Heat / Plate / TC..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
            </div>
            
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all",
                showAdvancedSearch ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "bg-slate-50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Filter className="w-4 h-4" />
              Advanced Search Filters
            </button>

            {showAdvancedSearch && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 slide-down">
                {Object.keys(filters).map((key) => (
                  <div key={key}>
                    <label className="field-label mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                    {key === 'grade' ? (
                      <select 
                        value={(filters as any)[key]}
                        onChange={(e) => setFilters({...filters, [key]: upper(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      >
                        <option value="">All Grades</option>
                        {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : key === 'make' ? (
                      <select 
                        value={(filters as any)[key]}
                        onChange={(e) => setFilters({...filters, [key]: upper(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
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
                        onChange={(e) => setFilters({...filters, [key]: upper(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                      />
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setFilters({ heatNumber: '', plateNumber: '', tcNumber: '', salesOrderNumber: '', partyName: '', grade: '', thickness: '', make: '', invoiceNumber: '' })}
                  className="col-span-2 text-2xs font-bold text-red-500 uppercase py-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[500px]">
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Results ({filteredRecords.length})</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {filteredRecords.map(record => (
                <div 
                  key={record.id}
                  onClick={() => handleSelectRecord(record)}
                  className={cn(
                    "p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/30 cursor-pointer transition-all group",
                    selectedTC?.id === record.id ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{record.heatNumber}</span>
                    <span className="text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">{record.grade}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-blue-100 dark:border-blue-800 overflow-hidden slide-up">
              <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedTC ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    {selectedTC ? 'Edit Test Certificate' : 'New TC Master Entry'}
                  </h2>
                  <p className="text-blue-100 text-xs mt-1">All fields marked with * are essential for tracking</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-white dark:bg-slate-900/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Field Groups */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Core Tracking
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="field-label mb-1">Heat Number *</label>
                        <input type="text" required value={formData.heatNumber} onChange={e => setFormData({...formData, heatNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. H12345" />
                      </div>
                      <div>
                        <label className="field-label mb-1">Plate Number *</label>
                        <input type="text" required value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. P9876" />
                      </div>
                      <div>
                        <label className="field-label mb-1">TC Number *</label>
                        <input type="text" required value={formData.tcNumber} onChange={e => setFormData({...formData, tcNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. TC-2026-001" />
                      </div>
                      <div>
                        <label className="field-label mb-1">TC Date</label>
                        <input type="date" value={formData.tcDate} onChange={e => setFormData({...formData, tcDate: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Orders Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Order & Invoice
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Sales Order No</label>
                          <input type="text" value={formData.salesOrderNumber} onChange={e => setFormData({...formData, salesOrderNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="field-label mb-1">SO Date</label>
                          <input type="date" value={formData.salesOrderDate} onChange={e => setFormData({...formData, salesOrderDate: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Purchase Order No</label>
                          <input type="text" value={formData.purchaseOrderNumber} onChange={e => setFormData({...formData, purchaseOrderNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="field-label mb-1">PO Date</label>
                          <input type="date" value={formData.purchaseOrderDate} onChange={e => setFormData({...formData, purchaseOrderDate: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Supplier Inv No</label>
                          <input type="text" value={formData.supplierInvoiceNumber} onChange={e => setFormData({...formData, supplierInvoiceNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="field-label mb-1">Inv Date</label>
                          <input type="date" value={formData.supplierInvoiceDate} onChange={e => setFormData({...formData, supplierInvoiceDate: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="field-label mb-1">GRN Number</label>
                        <input type="text" value={formData.grnNumber} onChange={e => setFormData({...formData, grnNumber: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Technical Specs
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Grade</label>
                          <select 
                            value={formData.grade} 
                            onChange={e => setFormData({...formData, grade: upper(e.target.value)})} 
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="">Select Grade</option>
                            {MATERIAL_GRADES.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="field-label mb-1">Thickness</label>
                          <input type="text" value={formData.thickness} onChange={e => setFormData({...formData, thickness: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 10mm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Width (mm)</label>
                          <input type="text" value={formData.width} onChange={e => setFormData({...formData, width: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="field-label mb-1">Length (mm)</label>
                          <input type="text" value={formData.length} onChange={e => setFormData({...formData, length: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="field-label mb-1">Plate Wt (Kg)</label>
                          <input type="text" value={formData.plateWeight} onChange={e => setFormData({...formData, plateWeight: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                          <label className="field-label mb-1">Make / Company</label>
                          <select 
                            value={formData.make} 
                            onChange={e => setFormData({...formData, make: upper(e.target.value)})} 
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <label className="field-label mb-1">Standard / Specification</label>
                        <input type="text" value={formData.standard} onChange={e => setFormData({...formData, standard: upper(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. ASTM A36" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="pt-6 border-t border-slate-50">
                  <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Printer className="w-4 h-4" /> Attachments
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer group">
                      <Download className="w-8 h-8 text-slate-300 group-hover:text-blue-500 mb-2" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
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
                          <img src={formData.pdfData} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" />
                        ) : (
                          <button 
                            type="button"
                            onClick={() => {
                              const win = window.open();
                              win?.document.write(`<iframe src="${formData.pdfData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                            }}
                            className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Preview PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-8 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">Cancel</button>
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <FileSearch className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">TC Record: {selectedTC.tcNumber}</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                        <History className="w-3 h-3 text-blue-600 dark:text-blue-400" />
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
                        className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
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
                    {selectedTC.purchaseOrderNumber && (
                      <button 
                        onClick={() => handleEmailPO(selectedTC)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        Email PO
                      </button>
                    )}
                    <button 
                      onClick={() => handleWhatsAppTC(selectedTC)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-green-100 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp TC
                    </button>
                    <button onClick={() => handleEdit(selectedTC)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors" title="Edit Record"><Edit3 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(selectedTC.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors" title="Delete Record"><Trash2 className="w-5 h-5" /></button>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors" title="Print TC"><Printer className="w-5 h-5" /></button>
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Dispatch History & Tracking
                  </h3>
                  <button 
                    onClick={() => handleResendEmail(selectedTC)}
                    className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-4 py-2 rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Resend Email to All
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-2xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
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
                        <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 text-sm">{history.partyName}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{history.dispatchDate}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-200">{history.salesOrderNumber}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">{history.tcNumber}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-3xs font-black uppercase tracking-tighter",
                              history.emailStatus === 'Sent' ? "bg-emerald-100 text-emerald-700 dark:text-emerald-400" : "bg-amber-100 text-amber-700"
                            )}>
                              {history.emailStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleResendEmail(selectedTC)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold"
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
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm text-center border-dashed border-2 border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <FileSearch className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Select a Certificate</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2">Choose a TC from the left sidebar to view its complete specifications and history.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
              >
                <Plus className="w-4 h-4" /> Or create a new one
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, opacity: 0.01, pointerEvents: 'none', width: '210mm' }}>
      {poForSend && <PurchaseOrderPrint po={poForSend} printAreaId="tc-po-print-area" />}
    </div>

    {/* Email PO Modal */}
    {showPoMailModal && poForSend && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-indigo-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Send className="w-8 h-8" />
                Email Purchase Order
              </h3>
              <button onClick={() => { setShowPoMailModal(false); setPoForSend(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-indigo-100 text-sm font-medium">PO {poForSend.poNumber} • TC Heat: {selectedTC?.heatNumber}</p>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipient Email *</label>
              <input
                type="email"
                value={poMailData.to}
                onChange={(e) => setPoMailData({ ...poMailData, to: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none no-uppercase"
                placeholder="supplier@example.com"
              />
            </div>
            <div>
              <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
              <input
                type="text"
                value={poMailData.subject}
                onChange={(e) => setPoMailData({ ...poMailData, subject: upper(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
              <textarea
                rows={5}
                value={poMailData.message}
                onChange={(e) => setPoMailData({ ...poMailData, message: upper(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowPoMailModal(false); setPoForSend(null); }}
                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendPoEmail}
                className="flex-1 py-4 rounded-2xl text-sm font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                Send PO Email
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Email Modal */}
    {showMailModal && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-emerald-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Send className="w-8 h-8" />
                Mail Certificate
              </h3>
              <button onClick={() => setShowMailModal(false)} className="p-2 hover:bg-white dark:bg-slate-900/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Sending TC for Heat: {selectedTC?.heatNumber}</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Recipient Email *</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={mailData.to}
                    onChange={e => setMailData({...mailData, to: e.target.value})}
                    placeholder="client@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-4 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                <input 
                  type="text" 
                  value={mailData.subject}
                  onChange={e => setMailData({...mailData, subject: upper(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                <textarea 
                  rows={4}
                  value={mailData.message}
                  onChange={e => setMailData({...mailData, message: upper(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-emerald-900 truncate">{selectedTC?.pdfName || `Generated_TC_${selectedTC?.heatNumber}.pdf`}</p>
                  <p className="text-2xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{selectedTC?.pdfData ? 'Ready as Attachment' : 'Auto-Generated Attachment'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowMailModal(false)}
                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-green-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                WhatsApp TC
              </h3>
              <div className="flex items-center gap-2">
                {waStatus === 'CONNECTED' && (
                  <button 
                    onClick={handleWaDisconnect} 
                    disabled={isWaLoading} 
                    className="text-xs font-bold text-red-100 hover:text-white bg-red-600/50 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {isWaLoading ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                )}
                <button onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-white dark:bg-slate-900/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium">Sending TC to WhatsApp: {selectedTC?.heatNumber}</p>
          </div>
          
          <div className="p-8 space-y-6">
            {waStatus === 'CONNECTED' ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number *</label>
                    <input 
                      type="text" 
                      required
                      value={whatsAppData.number}
                      onChange={e => setWhatsAppData({...whatsAppData, number: e.target.value})}
                      placeholder="e.g. 98XXXXXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message Caption</label>
                    <textarea 
                      rows={5}
                      value={whatsAppData.message}
                      onChange={e => setWhatsAppData({...whatsAppData, message: upper(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Download className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-green-900 truncate">{selectedTC?.pdfName || `Generated_TC_${selectedTC?.heatNumber}.pdf`}</p>
                      <p className="text-2xs text-green-600 font-bold uppercase tracking-wider">{selectedTC?.pdfData ? 'Ready for WhatsApp' : 'Auto-Generated Attachment'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowWhatsAppModal(false)}
                    className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
              </>
            ) : waStatus === 'QR_READY' && waQr ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-4">Scan this QR code with your WhatsApp to connect</p>
                <div className="inline-block p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <img src={waQr} alt="WhatsApp QR" className="w-48 h-48" />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">WhatsApp Disconnected</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">You need to connect your WhatsApp account before sending certificates.</p>
                <button 
                  onClick={handleWaInit} 
                  disabled={isWaLoading || waStatus === 'INITIALIZING'}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {(isWaLoading || waStatus === 'INITIALIZING') ? 'Initializing... please wait' : 'Initialize WhatsApp'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Global WhatsApp Connection Modal */}
    {showGlobalWAModal && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden slide-up border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="bg-green-600 p-8 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                WhatsApp Web
              </h3>
              <button onClick={() => setShowGlobalWAModal(false)} className="p-2 hover:bg-white dark:bg-slate-900/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-green-100 text-sm font-medium mt-1">Connect or Disconnect WhatsApp Web Service</p>
          </div>
          
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="meta-10">Connection Status</p>
                <p className={cn(
                  "text-lg font-black mt-0.5",
                  waStatus === 'CONNECTED' ? "text-green-600 dark:text-green-400" :
                  waStatus === 'QR_READY' ? "text-amber-500" :
                  waStatus === 'INITIALIZING' ? "text-blue-500" : "text-slate-500 dark:text-slate-400"
                )}>
                  {waStatus}
                </p>
              </div>
              <div className={cn(
                "w-3.5 h-3.5 rounded-full",
                waStatus === 'CONNECTED' ? "bg-green-500 shadow-lg shadow-green-200" :
                waStatus === 'QR_READY' ? "bg-amber-500 animate-pulse" :
                waStatus === 'INITIALIZING' ? "bg-blue-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
              )}></div>
            </div>

            {waStatus === 'CONNECTED' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">WhatsApp is Connected</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your account is ready to send certificates and messages.</p>
                </div>
                <button 
                  onClick={handleWaDisconnect} 
                  disabled={isWaLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                  {isWaLoading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                </button>
              </div>
            ) : waStatus === 'QR_READY' && waQr ? (
              <div className="text-center space-y-4">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Scan this QR code with WhatsApp Web on your phone:</p>
                <div className="inline-block p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mx-auto">
                  <img src={waQr} alt="WhatsApp QR" className="w-48 h-48" />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleWaDisconnect} 
                    disabled={isWaLoading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset/Disconnect
                  </button>
                  <button 
                    onClick={() => setShowGlobalWAModal(false)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">WhatsApp is Disconnected</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Initialize the client to generate a connection QR code.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleWaInit} 
                    disabled={isWaLoading || waStatus === 'INITIALIZING'}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                  >
                    {(isWaLoading || waStatus === 'INITIALIZING') ? 'Initializing...' : 'Connect WhatsApp'}
                  </button>
                  {(waStatus === 'INITIALIZING' || isWaLoading) && (
                    <button 
                      onClick={handleWaDisconnect}
                      className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-4 rounded-2xl text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
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
      <span className="text-2xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    <p className={cn(
      "text-sm font-black",
      variant === 'success' ? "text-emerald-600 dark:text-emerald-400" : variant === 'warning' ? "text-amber-600" : "text-slate-800 dark:text-slate-100"
    )}>
      {value || '-'}
    </p>
  </div>
);
