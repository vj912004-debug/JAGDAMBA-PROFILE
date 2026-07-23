import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext, type TCRecord, MATERIAL_GRADES } from '../store/AppContext';
import { 
  Plus, Search, 
  Send, CheckCircle2, 
  Trash2, Edit3, X,
  Download, MessageSquare, Mail,
  Eye, RotateCcw, FileSpreadsheet, Image, FlaskConical, FileText,
  Filter, Printer, MoreVertical, Hourglass, ClipboardList, Package, Layers, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../components/Sidebar';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import { PoToolbarActions } from '../components/PoToolbarActions';
import { NumericInput } from '../components/NumericInput';
import { generateTCPDFBase64, getPurchaseOrderPdfBase64 } from '../utils/pdfGenerator';
import { upper } from '../utils/textCase';
import type { PurchaseOrder, PartyMaster } from '../store/AppContext';
import { getWhatsAppApiUrl, sendWhatsAppMedia, buildWhatsAppPOMessage } from '../utils/whatsappApi';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { ErpEntryPage, ErpListPagination, paginateRows } from '../components/ErpPageShell';
import { poFileName } from '../utils/poNumber';
import { exportToExcel } from '../utils/excel';

const MAKES = ['AM/NS INDIA', 'JINDAL ODISHA', 'JINDAL RAIGHAD', 'SELL RSP', 'SELL', 'TATA', 'JSW', 'POSCO', 'CHINA'] as const;

type TcStatus = 'Active' | 'Expired' | 'Expiry Soon';

const getTcStatus = (tcDate: string): TcStatus => {
  const date = new Date(tcDate);
  if (Number.isNaN(date.getTime())) return 'Active';
  const expiry = new Date(date);
  expiry.setFullYear(expiry.getFullYear() + 2);
  const daysUntilExpiry = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiry Soon';
  return 'Active';
};

const statusRowClass = (status: TcStatus) => {
  if (status === 'Expired') return 'row-expired';
  if (status === 'Expiry Soon') return 'row-expiry-soon';
  return '';
};

const statusDotClass = (status: TcStatus) => {
  if (status === 'Expired') return 'expired';
  if (status === 'Expiry Soon') return 'soon';
  return 'active';
};

const emptyForm = (): Partial<TCRecord> => ({
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
  supplierName: '',
  nos: '1',
  emailStatus: 'Not Sent',
  dispatchHistory: [],
});

export const TCManagement: React.FC = () => {
  const { tcRecords, addTCRecord, updateTCRecord, deleteTCRecord, purchaseOrders, persistErpNow } = useAppContext();
  
  const [selectedTC, setSelectedTC] = useState<TCRecord | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showMailModal, setShowMailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showGlobalEmailModal, setShowGlobalEmailModal] = useState(false);
  const [mailData, setMailData] = useState({ to: '', subject: '', message: '' });
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [showPoMailModal, setShowPoMailModal] = useState(false);
  const [showPoWhatsAppModal, setShowPoWhatsAppModal] = useState(false);
  const [poMailData, setPoMailData] = useState({ to: '', subject: '', message: '' });
  const [poWhatsAppData, setPoWhatsAppData] = useState({ number: '', message: '' });
  const [poForSend, setPoForSend] = useState<PurchaseOrder | null>(null);
  const [poPdfForSend, setPoPdfForSend] = useState<string | null>(null);
  
  // WhatsApp Connection State
  const [waStatus, setWaStatus] = useState<string>('DISCONNECTED');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [isWaLoading, setIsWaLoading] = useState(false);

  // Email Connection State
  const [emailStatus, setEmailStatus] = useState<string>('NOT_CONFIGURED');
  const [emailConfig, setEmailConfig] = useState<{ user?: string; host?: string; port?: string | number }>({});
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Advanced Search Filters
  const emptyFilters = () => ({
    heatNumber: '',
    plateNumber: '',
    tcNumber: '',
    tcDateFrom: '',
    tcDateTo: '',
    partyName: '',
    grade: '',
    thickness: '',
    make: '',
    tcStatus: '' as '' | TcStatus,
  });

  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const [formData, setFormData] = useState<Partial<TCRecord>>(emptyForm());

  const inDateRange = (value: string, from: string, to: string) => {
    if (!value) return !from && !to;
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
  };

  const filteredRecords = useMemo(() => {
    return tcRecords.filter(record => {
      const party = record.supplierName || record.make || '';
      const status = getTcStatus(record.tcDate);

      return (
        (appliedFilters.heatNumber === '' || record.heatNumber.toLowerCase().includes(appliedFilters.heatNumber.toLowerCase())) &&
        (appliedFilters.plateNumber === '' || record.plateNumber.toLowerCase().includes(appliedFilters.plateNumber.toLowerCase())) &&
        (appliedFilters.tcNumber === '' || record.tcNumber.toLowerCase().includes(appliedFilters.tcNumber.toLowerCase())) &&
        inDateRange(record.tcDate, appliedFilters.tcDateFrom, appliedFilters.tcDateTo) &&
        (appliedFilters.partyName === '' || party.toLowerCase().includes(appliedFilters.partyName.toLowerCase())) &&
        (appliedFilters.grade === '' || record.grade.toLowerCase().includes(appliedFilters.grade.toLowerCase())) &&
        (appliedFilters.thickness === '' || record.thickness.toLowerCase().includes(appliedFilters.thickness.toLowerCase())) &&
        (appliedFilters.make === '' || record.make.toLowerCase().includes(appliedFilters.make.toLowerCase())) &&
        (appliedFilters.tcStatus === '' || status === appliedFilters.tcStatus)
      );
    });
  }, [tcRecords, appliedFilters]);

  const pagedRecords = useMemo(
    () => paginateRows(filteredRecords, page, pageSize),
    [filteredRecords, page, pageSize],
  );

  const filterOptions = useMemo(() => ({
    parties: ['', ...Array.from(new Set(tcRecords.map(r => r.supplierName || r.make || '').filter(Boolean))).sort()],
    grades: ['', ...Array.from(new Set(tcRecords.map(r => r.grade).filter(Boolean))).sort()],
    thicknesses: ['', ...Array.from(new Set(tcRecords.map(r => r.thickness).filter(Boolean))).sort()],
    makes: ['', ...MAKES.filter(m => tcRecords.some(r => r.make === m))],
  }), [tcRecords]);

  const stats = useMemo(() => {
    const statuses = tcRecords.map(r => getTcStatus(r.tcDate));
    return {
      total: tcRecords.length,
      active: statuses.filter(s => s === 'Active').length,
      expired: statuses.filter(s => s === 'Expired').length,
      expirySoon: statuses.filter(s => s === 'Expiry Soon').length,
    };
  }, [tcRecords]);


  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

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

  useEffect(() => {
    if (selectedTC) return;
    if (formData.heatNumber || formData.plateNumber) {
      const duplicateHeat = tcRecords.find((r) => r.heatNumber === formData.heatNumber);
      const duplicatePlate = tcRecords.find((r) => r.plateNumber === formData.plateNumber);
      
      if (duplicateHeat || duplicatePlate) {
        toast.error(
          `Duplicate detected! ${duplicateHeat ? 'Heat No ' + formData.heatNumber : ''} ${duplicatePlate ? 'Plate No ' + formData.plateNumber : ''} already exists.`,
          { id: 'duplicate-alert', duration: 4000 }
        );
      }
    }
  }, [formData.heatNumber, formData.plateNumber, selectedTC, tcRecords]);

  useEffect(() => {
    if (!formData.purchaseOrderNumber?.trim()) return;
    const po = purchaseOrders.find(
      p => p.poNumber.toUpperCase() === formData.purchaseOrderNumber!.trim().toUpperCase()
    );
    if (!po) return;
    setFormData(prev => ({
      ...prev,
      supplierName: prev.supplierName || po.supplierName,
      purchaseOrderDate: prev.purchaseOrderDate || po.date,
    }));
  }, [formData.purchaseOrderNumber, purchaseOrders]);

  const linkedPo = useMemo(() => {
    if (!formData.purchaseOrderNumber?.trim()) return null;
    return purchaseOrders.find(
      p => p.poNumber.toUpperCase() === formData.purchaseOrderNumber!.trim().toUpperCase()
    ) ?? null;
  }, [formData.purchaseOrderNumber, purchaseOrders]);

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
    const intervalTime = showWhatsAppModal ? 3000 : 10000;
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [showWhatsAppModal]);

  // Poll Email Configuration Status
  useEffect(() => {
    const fetchEmailStatus = async () => {
      try {
        const res = await fetch('/api/mail/status');
        const data = await res.json();
        setEmailStatus(data.status);
        if (data.user) {
          setEmailConfig({ user: data.user, host: data.host, port: data.port });
        }
      } catch (e) {
        console.error('Failed to fetch email status', e);
      }
    };

    fetchEmailStatus();
    const intervalTime = showGlobalEmailModal ? 5000 : 15000;
    const interval = setInterval(fetchEmailStatus, intervalTime);
    return () => clearInterval(interval);
  }, [showGlobalEmailModal]);

  useEffect(() => {
    if (!showGlobalEmailModal) return;

    const checkAndVerify = async () => {
      try {
        const res = await fetch('/api/mail/status');
        const data = await res.json();
        setEmailStatus(data.status);
        if (data.user) {
          setEmailConfig({ user: data.user, host: data.host, port: data.port });
        }
        if (data.status !== 'NOT_CONFIGURED') {
          await handleEmailVerify(true);
        }
      } catch (e) {
        console.error('Failed to check email on modal open', e);
      }
    };

    checkAndVerify();
  }, [showGlobalEmailModal]);

  const handleEmailVerify = async (silent = false) => {
    setIsEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch('/api/mail/verify', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setEmailStatus('CONNECTED');
        setEmailConfig({ user: data.user, host: data.host, port: data.port });
        if (!silent) toast.success('Email server connected');
      } else {
        setEmailStatus(data.status || 'ERROR');
        setEmailError(data.message || 'Failed to verify email connection');
        if (data.user) {
          setEmailConfig({ user: data.user, host: data.host, port: data.port });
        }
        if (!silent) toast.error(data.message || 'Failed to verify email connection');
      }
    } catch (error) {
      setEmailStatus('ERROR');
      setEmailError('Failed to reach email server');
      if (!silent) toast.error('Failed to reach email server');
    } finally {
      setIsEmailLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTC) {
      toast.error('Use Update to save changes to the selected record, or Clear for a new entry');
      return;
    }
    if (!formData.heatNumber || !formData.plateNumber || !formData.tcNumber) {
      toast.error('Required fields: Heat No, Plate No, TC No');
      return;
    }

    const newRecord: TCRecord = {
      ...(formData as TCRecord),
      id: `TC-${Date.now()}`,
      dispatchHistory: [],
    };

    addTCRecord(newRecord);
    setSelectedTC(newRecord);
    setFormData(newRecord);
    try {
      await persistErpNow({ tcRecords: [newRecord, ...tcRecords] });
      toast.success('New TC Record added');
    } catch {
      toast.success('TC Record added locally — server sync failed, use Update to retry');
    }
  };

  const handleSelectSupplier = (party: PartyMaster) => {
    setFormData(prev => ({ ...prev, supplierName: party.partyName }));
    toast.success('Supplier filled from Party Master', { icon: '✨' });
  };

  const handleNew = () => {
    openNewEntry();
    toast.success('Ready for new TC entry');
  };

  const handleClear = () => {
    setSelectedTC(null);
    setFormData(emptyForm());
  };

  const closeEntryModal = () => {
    setShowEntryModal(false);
    setMenuOpenId(null);
  };

  const printTcRecord = (record: TCRecord) => {
    const data = record.pdfData || generateTCPDFBase64(record);
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Pop-up blocked — allow pop-ups to print');
      return;
    }
    w.document.write(`<iframe src="${data}" style="width:100%;height:100%;border:0" onload="this.contentWindow.print()"></iframe>`);
    w.document.title = record.pdfName || `TC_${record.heatNumber}`;
  };

  const handleUpdate = async () => {
    if (!selectedTC) {
      toast.error('Select a record from the list to update');
      return;
    }
    if (!formData.heatNumber || !formData.plateNumber || !formData.tcNumber) {
      toast.error('Required fields: Heat No, Plate No, TC No');
      return;
    }

    const updated: TCRecord = {
      ...selectedTC,
      ...(formData as TCRecord),
      id: selectedTC.id,
      dispatchHistory: selectedTC.dispatchHistory ?? [],
    };
    updateTCRecord(updated);
    setSelectedTC(updated);
    setFormData(updated);
    try {
      await persistErpNow({
        tcRecords: tcRecords.map(r => r.id === updated.id ? updated : r),
      });
      toast.success('TC Record updated');
    } catch {
      toast.success('TC updated locally — server sync failed, retry Update');
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedTC) {
      toast.error('Select a record from the list to delete');
      return;
    }
    handleDelete(selectedTC.id);
    handleClear();
  };

  const resetFilters = () => {
    const cleared = emptyFilters();
    setDraftFilters(cleared);
    setAppliedFilters(cleared);
    setPage(1);
  };

  const applySearch = () => {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }
    exportToExcel(
      filteredRecords.map((r, i) => ({
        'Sr No': i + 1,
        'TC No.': r.tcNumber,
        'TC Date': r.tcDate,
        'Party Name': r.supplierName || r.make,
        'Grade': r.grade,
        'Thickness (mm)': r.thickness,
        'Plate No.': r.plateNumber,
        'Heat No.': r.heatNumber,
        'Make': r.make,
        'Weight (KG)': r.plateWeight,
        'Status': getTcStatus(r.tcDate),
      })),
      'TC Document List',
      `TC_List_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success('Exported to Excel');
  };

  const attachFile = (field: keyof TCRecord, nameField: keyof TCRecord) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error('File too large (max 8 MB). Use a smaller PDF or image.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error('Failed to read file');
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        toast.error('Failed to read file');
        return;
      }
      setFormData(prev => ({ ...prev, [field]: result, [nameField]: file.name }));
      if (selectedTC) {
        const updated: TCRecord = {
          ...selectedTC,
          [field]: result,
          [nameField]: file.name,
          id: selectedTC.id,
          dispatchHistory: selectedTC.dispatchHistory ?? [],
        };
        updateTCRecord(updated);
        setSelectedTC(updated);
        setFormData(updated);
        persistErpNow({
          tcRecords: tcRecords.map(r => r.id === updated.id ? updated : r),
        }).catch(() => toast.error('Attachment saved locally — server sync failed'));
      }
      toast.success(`${file.name} attached${selectedTC ? ' and saved' : ''}`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const loadRecord = (record: TCRecord) => {
    setSelectedTC(record);
    setFormData(record);
    setShowEntryModal(true);
    setMenuOpenId(null);
  };

  const openNewEntry = () => {
    setSelectedTC(null);
    setFormData(emptyForm());
    setShowEntryModal(true);
    setMenuOpenId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const next = tcRecords.filter(r => r.id !== id);
    deleteTCRecord(id);
    if (selectedTC?.id === id) {
      setSelectedTC(null);
      setFormData(emptyForm());
    }
    try {
      await persistErpNow({ tcRecords: next });
      toast.success('Record deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
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

    let tcDataToSend = formData.pdfData || selectedTC.pdfData;
    if (!tcDataToSend) {
      tcDataToSend = generateTCPDFBase64({ ...selectedTC, ...formData } as TCRecord);
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
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
    setShowPoMailModal(true);
  };

  const handleWhatsAppPO = (record: TCRecord) => {
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
    setPoWhatsAppData({
      number: po.supplierMobile || '',
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
    setShowPoWhatsAppModal(true);
  };

  const sendPoWhatsApp = async () => {
    if (!poForSend) return;
    if (!poWhatsAppData.number.trim()) {
      toast.error('WhatsApp number is required');
      return;
    }
    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(poForSend));
    if (!pdf) {
      toast.error('Failed to generate PO PDF');
      return;
    }
    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: poWhatsAppData.number,
        mediaData: pdf,
        fileName: poFileName(poForSend.poNumber),
        caption: poWhatsAppData.message,
      });
      toast.success('PO sent on WhatsApp!', { id: loadingToast });
      setShowPoWhatsAppModal(false);
      setPoForSend(null);
      setPoPdfForSend(null);
    } catch (err: unknown) {
      toast.error(`WhatsApp Error: ${(err as Error).message}`, { id: loadingToast });
    }
  };

  useEffect(() => {
    if ((!showPoMailModal && !showPoWhatsAppModal) || !poForSend) return;
    void (async () => {
      const pdf = await getPurchaseOrderPdfBase64(poForSend);
      if (pdf) setPoPdfForSend(pdf);
    })();
  }, [showPoMailModal, showPoWhatsAppModal, poForSend]);

  const sendPoEmail = async () => {
    if (!poForSend) return;
    if (!poMailData.to.trim()) {
      toast.error('Recipient email is required');
      return;
    }

    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(poForSend));
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
          fileName: poFileName(poForSend.poNumber),
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

    let tcDataToSend = formData.pdfData || selectedTC.pdfData;
    if (!tcDataToSend) {
      tcDataToSend = generateTCPDFBase64({ ...selectedTC, ...formData } as TCRecord);
    }

    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: whatsAppData.number,
        mediaData: tcDataToSend,
        fileName: selectedTC.pdfName || `TC_${selectedTC.heatNumber || 'Generated'}.pdf`,
        caption: whatsAppData.message,
      });
      toast.success('WhatsApp message sent!', { id: loadingToast });
      setShowWhatsAppModal(false);
    } catch (err: any) {
      toast.error(`WhatsApp Error: ${err.message}`, { id: loadingToast });
    }
  };

  const handleWhatsAppEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    sendWhatsApp();
  };

  const entryForm = (
    <form onSubmit={handleSubmit} className="tc-entry-form">
      <div className="tc-entry-shell">
        <div className="tc-entry-main">
          <div className="tc-mgmt-panel">
            <div className="tc-section-head"><ClipboardList /> TC Entry</div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="tc-mgmt-label">TC No. *</label>
                <input type="text" required value={formData.tcNumber || ''} onChange={e => setFormData({ ...formData, tcNumber: upper(e.target.value) })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">TC Date</label>
                <input type="date" value={formData.tcDate || ''} onChange={e => setFormData({ ...formData, tcDate: e.target.value })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Party Name</label>
                <PartyAutocomplete
                  value={formData.supplierName || ''}
                  onChange={(val) => setFormData({ ...formData, supplierName: val })}
                  onSelectParty={handleSelectSupplier}
                  placeholder="Select party..."
                  className="tc-mgmt-input pl-9"
                />
              </div>
              <div>
                <label className="tc-mgmt-label">Sales Order No.</label>
                <input type="text" value={formData.salesOrderNumber || ''} onChange={e => setFormData({ ...formData, salesOrderNumber: upper(e.target.value) })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Invoice No.</label>
                <input type="text" value={formData.supplierInvoiceNumber || ''} onChange={e => setFormData({ ...formData, supplierInvoiceNumber: upper(e.target.value) })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Purchase Order No</label>
                <input type="text" value={formData.purchaseOrderNumber || ''} onChange={e => setFormData({ ...formData, purchaseOrderNumber: upper(e.target.value) })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">PO Date</label>
                <input type="date" value={formData.purchaseOrderDate || ''} onChange={e => setFormData({ ...formData, purchaseOrderDate: e.target.value })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Make</label>
                <select value={formData.make || ''} onChange={e => setFormData({ ...formData, make: upper(e.target.value) })} className="tc-mgmt-input">
                  <option value="">Select</option>
                  {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="tc-mgmt-panel">
            <div className="tc-section-head"><Package /> Material Details</div>
            <div className="overflow-x-auto">
              <table className="tc-mgmt-table w-full min-w-[900px]">
                <thead>
                  <tr>
                    <th>Sr No</th>
                    <th>Grade</th>
                    <th>Thickness (mm)</th>
                    <th>Width (mm)</th>
                    <th>Length (mm)</th>
                    <th>Nos</th>
                    <th>Heat No.</th>
                    <th>Plate No.</th>
                    <th>Make</th>
                    <th>TC No.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold">1</td>
                    <td>
                      <select value={formData.grade || ''} onChange={e => setFormData({ ...formData, grade: upper(e.target.value) })} className="tc-mgmt-input text-xs py-1">
                        <option value="">—</option>
                        {MATERIAL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td><NumericInput value={formData.thickness || ''} onChange={v => setFormData({ ...formData, thickness: v })} className="tc-mgmt-input text-xs py-1 text-center" /></td>
                    <td><NumericInput value={formData.width || ''} onChange={v => setFormData({ ...formData, width: v })} className="tc-mgmt-input text-xs py-1 text-center" /></td>
                    <td><NumericInput value={formData.length || ''} onChange={v => setFormData({ ...formData, length: v })} className="tc-mgmt-input text-xs py-1 text-center" /></td>
                    <td><NumericInput value={formData.nos || '1'} onChange={v => setFormData({ ...formData, nos: v })} className="tc-mgmt-input text-xs py-1 text-center" /></td>
                    <td><input type="text" required value={formData.heatNumber || ''} onChange={e => setFormData({ ...formData, heatNumber: upper(e.target.value) })} className="tc-mgmt-input text-xs py-1" /></td>
                    <td><input type="text" required value={formData.plateNumber || ''} onChange={e => setFormData({ ...formData, plateNumber: upper(e.target.value) })} className="tc-mgmt-input text-xs py-1" /></td>
                    <td>{formData.make || '—'}</td>
                    <td>{formData.tcNumber || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="tc-material-total">Total Nos : {formData.nos || '1'}</div>
          </div>

          <div className="tc-mgmt-panel">
            <div className="tc-section-head"><Layers /> Linked Documents Preview</div>
            <div className="tc-linked-docs-grid">
              <LinkedDocCard title="TC PDF" icon={FileText} fileName={formData.pdfName} dataUrl={formData.pdfData} />
              <LinkedDocCard title="Plate Photo" icon={Image} fileName={formData.platePhotoName} dataUrl={formData.platePhotoData} />
              <LinkedDocCard title="UT Report" icon={FlaskConical} fileName={formData.labReportName} dataUrl={formData.labReportData} />
              <LinkedDocCard title="Lab Report" icon={Image} fileName={formData.heatMarkingPhotoName} dataUrl={formData.heatMarkingPhotoData} />
            </div>
          </div>
        </div>

        <aside className="tc-entry-upload-col">
          <div className="tc-upload-sidebar">
            <div className="tc-upload-sidebar-head"><Upload className="w-4 h-4" /> Document Upload</div>
            <div className="tc-upload-sidebar-body">
              <TcUploadBox label="TC PDF" icon={FileText} fileName={formData.pdfName} onChange={attachFile('pdfData', 'pdfName')} accept=".pdf,image/*" />
              <TcUploadBox label="Plate Photo" icon={Image} fileName={formData.platePhotoName} onChange={attachFile('platePhotoData', 'platePhotoName')} accept="image/*" />
              <TcUploadBox label="UT Report" icon={FlaskConical} fileName={formData.labReportName} onChange={attachFile('labReportData', 'labReportName')} accept=".pdf,image/*" />
              <TcUploadBox label="Lab Report" icon={Image} fileName={formData.heatMarkingPhotoName} onChange={attachFile('heatMarkingPhotoData', 'heatMarkingPhotoName')} accept="image/*,.pdf" />
            </div>
          </div>
        </aside>
      </div>

      <div className="tc-entry-action-bar">
        <button type="submit" {...erpHotkeyProps('save')} className="tc-action-btn tc-action-btn-navy"><CheckCircle2 className="w-4 h-4" /> Save</button>
        <button type="button" onClick={handleUpdate} className="tc-action-btn tc-action-btn-orange"><Edit3 className="w-4 h-4" /> Update</button>
        <button type="button" onClick={handleDeleteSelected} className="tc-action-btn tc-action-btn-red"><Trash2 className="w-4 h-4" /> Delete</button>
        <button type="button" onClick={handleClear} className="tc-action-btn tc-action-btn-outline"><RotateCcw className="w-4 h-4" /> Clear</button>
        <button
          type="button"
          onClick={() => selectedTC && printTcRecord(selectedTC)}
          disabled={!selectedTC}
          className="tc-action-btn tc-action-btn-outline"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
        <button
          type="button"
          onClick={() => selectedTC && handleResendEmail(selectedTC)}
          disabled={!selectedTC}
          className="tc-action-btn tc-action-btn-outline"
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          type="button"
          onClick={() => selectedTC && handleWhatsAppTC(selectedTC)}
          disabled={!selectedTC}
          className="tc-action-btn tc-action-btn-wa"
        >
          <MessageSquare className="w-4 h-4" /> WhatsApp
        </button>
        <button type="button" {...erpHotkeyProps('new')} onClick={handleNew} className="tc-action-btn tc-action-btn-outline"><Plus className="w-4 h-4" /> New</button>
        <PoToolbarActions purchaseOrder={linkedPo} requireSelection={false} />
      </div>
    </form>
  );

  return (
    <>
    <ErpEntryPage>
    <div className="tc-dash-page">
      {/* Summary cards */}
      <div className="tc-dash-stat-row">
        <div className="tc-dash-stat-card">
          <div className="tc-dash-stat-icon blue"><FileText className="w-5 h-5" /></div>
          <div>
            <div className="tc-dash-stat-label blue">Total TC</div>
            <div className="tc-dash-stat-value">{stats.total.toLocaleString('en-IN')}</div>
            <div className="tc-dash-stat-sub">Total Documents</div>
          </div>
        </div>
        <div className="tc-dash-stat-card">
          <div className="tc-dash-stat-icon green"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <div className="tc-dash-stat-label green">Active TC</div>
            <div className="tc-dash-stat-value">{stats.active.toLocaleString('en-IN')}</div>
            <div className="tc-dash-stat-sub">Valid (Within 2 Years)</div>
          </div>
        </div>
        <div className="tc-dash-stat-card">
          <div className="tc-dash-stat-icon red"><X className="w-5 h-5" /></div>
          <div>
            <div className="tc-dash-stat-label red">Expired TC</div>
            <div className="tc-dash-stat-value">{stats.expired.toLocaleString('en-IN')}</div>
            <div className="tc-dash-stat-sub">Older Than 2 Years</div>
          </div>
        </div>
        <div className="tc-dash-stat-card">
          <div className="tc-dash-stat-icon purple"><Hourglass className="w-5 h-5" /></div>
          <div>
            <div className="tc-dash-stat-label purple">Expiry Soon</div>
            <div className="tc-dash-stat-value">{stats.expirySoon.toLocaleString('en-IN')}</div>
            <div className="tc-dash-stat-sub">Will Expire in 30 Days</div>
          </div>
        </div>
      </div>

      {/* Search filters */}
      <div className="tc-dash-filter-card">
        <div className="tc-dash-filter-head"><Filter className="w-3.5 h-3.5" /> Search Filters</div>
        <div className="tc-dash-filter-body">
          <div className="tc-dash-filter-row">
            <div>
              <label className="tc-mgmt-label">Party Name</label>
              <select value={draftFilters.partyName} onChange={e => setDraftFilters({ ...draftFilters, partyName: e.target.value })} className="tc-mgmt-input">
                <option value="">Select</option>
                {filterOptions.parties.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="tc-mgmt-label">Grade</label>
              <select value={draftFilters.grade} onChange={e => setDraftFilters({ ...draftFilters, grade: upper(e.target.value) })} className="tc-mgmt-input">
                <option value="">Select</option>
                {filterOptions.grades.filter(Boolean).map(g => <option key={g} value={g}>{g}</option>)}
                {MATERIAL_GRADES.filter(g => !filterOptions.grades.includes(g)).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="tc-mgmt-label">Thickness (mm)</label>
              <select value={draftFilters.thickness} onChange={e => setDraftFilters({ ...draftFilters, thickness: e.target.value })} className="tc-mgmt-input">
                <option value="">Select</option>
                {filterOptions.thicknesses.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="tc-mgmt-label">Make</label>
              <select value={draftFilters.make} onChange={e => setDraftFilters({ ...draftFilters, make: upper(e.target.value) })} className="tc-mgmt-input">
                <option value="">Select</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="tc-mgmt-label">TC Status</label>
              <select value={draftFilters.tcStatus} onChange={e => setDraftFilters({ ...draftFilters, tcStatus: e.target.value as '' | TcStatus })} className="tc-mgmt-input">
                <option value="">Select</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Expiry Soon">Expiry Soon</option>
              </select>
            </div>
            <div>
              <label className="tc-mgmt-label">TC No.</label>
              <input type="text" value={draftFilters.tcNumber} onChange={e => setDraftFilters({ ...draftFilters, tcNumber: upper(e.target.value) })} className="tc-mgmt-input" />
            </div>
          </div>
          <div className="tc-dash-filter-row">
            <div>
              <label className="tc-mgmt-label">Plate No.</label>
              <input type="text" value={draftFilters.plateNumber} onChange={e => setDraftFilters({ ...draftFilters, plateNumber: upper(e.target.value) })} className="tc-mgmt-input" />
            </div>
            <div>
              <label className="tc-mgmt-label">Heat No.</label>
              <input type="text" value={draftFilters.heatNumber} onChange={e => setDraftFilters({ ...draftFilters, heatNumber: upper(e.target.value) })} className="tc-mgmt-input" />
            </div>
            <div>
              <label className="tc-mgmt-label">Date From</label>
              <input type="date" value={draftFilters.tcDateFrom} onChange={e => setDraftFilters({ ...draftFilters, tcDateFrom: e.target.value })} className="tc-mgmt-input" />
            </div>
            <div>
              <label className="tc-mgmt-label">Date To</label>
              <input type="date" value={draftFilters.tcDateTo} onChange={e => setDraftFilters({ ...draftFilters, tcDateTo: e.target.value })} className="tc-mgmt-input" />
            </div>
            <div className="tc-dash-filter-actions">
              <button type="button" onClick={applySearch} className="erp-entry-btn erp-entry-btn-blue"><Search className="w-4 h-4" /> Search</button>
              <button type="button" onClick={resetFilters} className="erp-entry-btn erp-entry-btn-outline-orange"><RotateCcw className="w-4 h-4" /> Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* TC Document List */}
      <div className="tc-doc-panel">
        <div className="tc-doc-list-head">
          <div className="tc-doc-list-title">
            <FileText className="w-4 h-4" />
            TC Document List
            <span className="tc-doc-record-badge">Total Records : {filteredRecords.length.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={openNewEntry} className="tc-doc-export-btn"><Plus className="w-3.5 h-3.5" /> New TC</button>
            <button type="button" onClick={handleExport} className="tc-doc-export-btn"><FileSpreadsheet className="w-3.5 h-3.5" /> Export To Excel</button>
            <button
              type="button"
              onClick={() => setShowGlobalEmailModal(true)}
              className={cn(
                'tc-doc-export-btn',
                emailStatus === 'CONNECTED' ? 'text-green-700' : emailStatus === 'ERROR' ? 'text-red-600' : ''
              )}
            >
              <Mail className="w-3.5 h-3.5" />
              {emailStatus === 'CONNECTED' ? 'Email OK' : 'Email'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tc-doc-table w-full min-w-[1100px]">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>TC No.</th>
                <th>TC Date</th>
                <th>Party Name</th>
                <th>Grade</th>
                <th>Thickness (mm)</th>
                <th>Plate No.</th>
                <th>Heat No.</th>
                <th>Make</th>
                <th>Weight (KG)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((record, idx) => {
                const status = getTcStatus(record.tcDate);
                const srNo = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={record.id} className={cn(statusRowClass(status), selectedTC?.id === record.id && 'ring-2 ring-inset ring-brand-blue')}>
                    <td className="text-center">{srNo}</td>
                    <td className="font-bold text-brand-blue">{record.tcNumber}</td>
                    <td>{record.tcDate}</td>
                    <td>{record.supplierName || '—'}</td>
                    <td>{record.grade || '—'}</td>
                    <td className="text-center">{record.thickness || '—'}</td>
                    <td>{record.plateNumber}</td>
                    <td className="font-semibold">{record.heatNumber}</td>
                    <td>{record.make || '—'}</td>
                    <td className="text-right">{record.plateWeight || '—'}</td>
                    <td>
                      <span className={`tc-status-text ${statusDotClass(status)}`}>
                        <span className={`tc-status-dot ${statusDotClass(status)}`} />
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-0.5">
                        <button type="button" title="View" onClick={() => loadRecord(record)} className="tc-doc-action-btn"><Eye className="w-3.5 h-3.5" /></button>
                        <button type="button" title="Download" onClick={() => {
                          const data = record.pdfData || generateTCPDFBase64(record);
                          const a = document.createElement('a');
                          a.href = data;
                          a.download = record.pdfName || `TC_${record.heatNumber}.pdf`;
                          a.click();
                        }} className="tc-doc-action-btn"><Download className="w-3.5 h-3.5" /></button>
                        <button type="button" title="Print" onClick={() => printTcRecord(record)} className="tc-doc-action-btn"><Printer className="w-3.5 h-3.5" /></button>
                        <div className="relative">
                          <button type="button" title="More" onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === record.id ? null : record.id); }} className="tc-doc-action-btn"><MoreVertical className="w-3.5 h-3.5" /></button>
                          {menuOpenId === record.id && (
                            <div className="tc-more-menu" onClick={e => e.stopPropagation()}>
                              <button type="button" onClick={() => loadRecord(record)}>Edit TC</button>
                              <button type="button" onClick={() => { handleWhatsAppTC(record); setMenuOpenId(null); }}>WhatsApp TC</button>
                              <button type="button" onClick={() => { handleResendEmail(record); setMenuOpenId(null); }}>Email TC</button>
                              {record.purchaseOrderNumber && (
                                <>
                                  <button type="button" onClick={() => { handleWhatsAppPO(record); setMenuOpenId(null); }}>WhatsApp PO</button>
                                  <button type="button" onClick={() => { handleEmailPO(record); setMenuOpenId(null); }}>Email PO</button>
                                </>
                              )}
                              <button type="button" onClick={() => { void handleDelete(record.id); setMenuOpenId(null); }} className="text-red-600">Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pagedRecords.length === 0 && (
                <tr><td colSpan={12} className="text-center py-10 text-slate-400 italic">No TC records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <ErpListPagination
          page={page}
          pageSize={pageSize}
          total={filteredRecords.length}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
          navLabels="text"
          activeTone="orange"
          showVersion={false}
          className="tc-doc-pagination"
          perPageSuffix="per page"
        />

        <div className="tc-doc-legend">
          <span><span className="tc-status-dot active" /> Active TC (Within 2 Years)</span>
          <span><span className="tc-status-dot expired" /> Expired TC (Older Than 2 Years)</span>
          <span><span className="tc-status-dot soon" /> Expiry Soon (Will Expire in 30 Days)</span>
        </div>
      </div>
    </div>
    </ErpEntryPage>

    {showEntryModal && (
      <div className="tc-entry-modal" onClick={closeEntryModal}>
        <div className="tc-entry-modal-panel max-w-[1400px]" onClick={e => e.stopPropagation()}>
          <div className="tc-entry-modal-head">
            <span className="tc-entry-modal-title">TC / MTC Document Management System</span>
            <button type="button" onClick={closeEntryModal} className="p-1.5 rounded-full hover:bg-white/10 text-white"><X className="w-5 h-5" /></button>
          </div>
          {entryForm}
        </div>
      </div>
    )}

    <div style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, opacity: 0.01, pointerEvents: 'none', width: '210mm' }}>
    </div>

    {/* WhatsApp PO Modal */}
    {showPoWhatsAppModal && poForSend && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden slide-up">
          <div className="bg-green-600 p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <MessageSquare className="w-8 h-8" />
                WhatsApp Purchase Order
              </h3>
              <button onClick={() => { setShowPoWhatsAppModal(false); setPoForSend(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-green-100 text-sm font-medium">PO {poForSend.poNumber} • TC Heat: {selectedTC?.heatNumber}</p>
          </div>
          <div className="p-8 space-y-4">
            <div>
              <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number *</label>
              <input
                type="text"
                value={poWhatsAppData.number}
                onChange={(e) => setPoWhatsAppData({ ...poWhatsAppData, number: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none no-uppercase"
                placeholder="91XXXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-2xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
              <textarea
                rows={5}
                value={poWhatsAppData.message}
                onChange={(e) => setPoWhatsAppData({ ...poWhatsAppData, message: upper(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowPoWhatsAppModal(false); setPoForSend(null); }}
                className="flex-1 py-4 rounded-2xl text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void sendPoWhatsApp()}
                className="flex-1 py-4 rounded-2xl text-sm font-black bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                Send PO on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

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
                      onKeyDown={handleWhatsAppEnter}
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
                      onKeyDown={handleWhatsAppEnter}
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

    {/* Global Email Connection Modal */}
    {showGlobalEmailModal && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden slide-up border border-slate-100 dark:border-slate-800 transition-colors">
          <div className="bg-blue-600 p-8 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Mail className="w-8 h-8" />
                Email Service
              </h3>
              <button onClick={() => setShowGlobalEmailModal(false)} className="p-2 hover:bg-white dark:bg-slate-900/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-blue-100 text-sm font-medium mt-1">SMTP configuration for sending TC and PO emails</p>
          </div>

          <div className="p-8 space-y-6 bg-white dark:bg-slate-900 transition-colors">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="meta-10">Connection Status</p>
                <p className={cn(
                  "text-lg font-black mt-0.5",
                  emailStatus === 'CONNECTED' ? "text-green-600 dark:text-green-400" :
                  emailStatus === 'CONFIGURED' ? "text-blue-500" :
                  emailStatus === 'ERROR' ? "text-red-500" : "text-slate-500 dark:text-slate-400"
                )}>
                  {isEmailLoading ? 'CHECKING...' : emailStatus.replace('_', ' ')}
                </p>
              </div>
              <div className={cn(
                "w-3.5 h-3.5 rounded-full",
                emailStatus === 'CONNECTED' ? "bg-green-500 shadow-lg shadow-green-200" :
                emailStatus === 'CONFIGURED' ? "bg-blue-500" :
                emailStatus === 'ERROR' ? "bg-red-500" :
                isEmailLoading ? "bg-blue-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
              )}></div>
            </div>

            {emailStatus === 'NOT_CONFIGURED' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Email Not Configured</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Add SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS) to the server environment to enable email sending.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="meta-10">From Address</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{emailConfig.user || '-'}</p>
                  </div>
                  <div>
                    <p className="meta-10">SMTP Host</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                      {emailConfig.host || '-'}:{emailConfig.port || 587}
                    </p>
                  </div>
                </div>

                {emailStatus === 'CONNECTED' ? (
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Email is Connected</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        SMTP is ready to send Test Certificates and Purchase Orders.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    {emailError && (
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl px-4 py-3">
                        {emailError}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {emailStatus === 'ERROR'
                        ? 'SMTP credentials are set but the server could not connect. Check your settings and try again.'
                        : 'Test the SMTP connection before sending certificates.'}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEmailVerify()}
                    disabled={isEmailLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isEmailLoading ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={() => setShowGlobalEmailModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl text-sm font-bold transition-all"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};


const TcUploadBox: React.FC<{
  label: string;
  icon: React.ElementType;
  fileName?: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, icon: Icon, fileName, accept, onChange }) => (
  <label className={cn('tc-dash-upload-zone', fileName && 'has-file')}>
    <div className="tc-dash-upload-icon"><Icon className="w-5 h-5" /></div>
    <p className="tc-dash-upload-title">{label}</p>
    <p className="tc-dash-upload-hint">Drag &amp; Drop {label} Here or</p>
    <span className="tc-dash-upload-browse">Browse File</span>
    {fileName && <span className="tc-dash-upload-check">✓</span>}
    <input type="file" accept={accept} className="hidden" onChange={onChange} />
  </label>
);

const LinkedDocCard: React.FC<{
  title: string;
  icon: React.ElementType;
  fileName?: string;
  dataUrl?: string;
}> = ({ title, icon: Icon, fileName, dataUrl }) => (
  <div className="tc-linked-doc-card">
    <div className="tc-linked-doc-card-head">
      <Icon className="w-3.5 h-3.5 text-[#F9520B]" />
      {title}
    </div>
    <div className="tc-linked-doc-thumb">
      {dataUrl?.startsWith('data:image') ? (
        <img src={dataUrl} alt={title} />
      ) : (
        <Icon className="w-8 h-8 text-slate-300" />
      )}
    </div>
    <div className="tc-linked-doc-meta">{fileName || 'No file linked'}</div>
    <div className="tc-linked-doc-actions">
      {dataUrl && (
        <a href={dataUrl} target="_blank" rel="noreferrer" className="tc-doc-action-btn" title="View">
          <Eye className="w-3.5 h-3.5" />
        </a>
      )}
      {dataUrl && (
        <a href={dataUrl} download={fileName || 'document'} className="tc-doc-action-btn" title="Download">
          <Download className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  </div>
);
