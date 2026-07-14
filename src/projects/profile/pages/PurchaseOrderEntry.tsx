import React, { useState, useMemo, useEffect } from 'react';
import { Save, Plus, Trash2, MessageSquare, X, Printer, Mail, Pencil, FileText, Package, List } from 'lucide-react';
import { useAppContext, type PurchaseOrder, type POItem, MATERIAL_GRADES, BRANCHES } from '../store/AppContext';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { downloadPurchaseOrderPDF, getPurchaseOrderPdfBase64 } from '../utils/pdfGenerator';
import { PurchaseOrderPrint, PO_PRINT_AREA_ID, type PurchaseOrderPrintExtras } from '../components/PurchaseOrderPrint';
import { EditableSelect } from '../components/EditableSelect';
import { PartyAutocomplete } from '../components/PartyAutocomplete';
import type { PartyMaster } from '../store/AppContext';
import { upper } from '../utils/textCase';
import { sendWhatsAppMedia, buildWhatsAppPOMessage } from '../utils/whatsappApi';
import { poFileName } from '../utils/poNumber';
import { NumericInput, parseNum } from '../components/NumericInput';
import { getPartyPoGradeOptions } from '../utils/masterHelpers';

const MAKES = ['SAIL', 'JINDAL', 'TATA', 'AMNS', 'ESSAR', 'BHUSHAN', 'VIZAG', 'RINL', 'JSW', 'LLOYDS', 'POSCO', 'CHINA'] as const;
const GST_OPTIONS = ['GST 0%', 'GST 5%', 'GST 12%', 'GST 18%', 'GST 28%'] as const;
const TRANSPORT_PAYMENT_OPTIONS = ['TO PAY', 'PAID', 'EX-WORKS', 'FOR VADODARA', 'TO BE BORNE BY US', 'TO BE BORNE BY SUPPLIER'];
const LOADING_OPTIONS = ['FREE', 'EXTRA', 'INCLUDED', 'BY SUPPLIER', 'BY OUR SCOPE'];

const INSPECTION_OPTIONS = ['Third Party', 'Customer', 'Our Inspection', 'No Inspection', 'Other'];
const TC_OPTIONS = ['Yes', 'No', 'If Available'];
const UT_LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Not Required'];
const RATE_BASIS_OPTIONS = ['Per Kg', 'Per Ton', 'Per Nos', 'Per Set', 'Per Piece'];

const DEFAULT_TERMS = `1. Material should be as per our requirement & specification.
2. Delivery should be within agreed time schedule.
3. Test certificate (TC) must accompany the material.
4. Payment will be made as per agreed payment terms.
5. Subject to Vadodara jurisdiction only.`;

const createEmptyPOItem = (): POItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  itemMasterId: '',
  itemName: '',
  grade: '',
  thickness: '',
  width: '',
  length: '',
  nos: 0,
  kg: 0,
  rate: 0,
  amount: 0,
  heatNo: '',
  actualWeight: 0,
  make: '',
  sizeSection: '',
  rateBasis: 'Per Kg',
});

const hasItemContent = (item: POItem) =>
  Boolean(item.grade.trim() || item.thickness || item.width || item.length || item.nos || item.kg || item.rate || item.sizeSection);

const isRowReadyForNext = (item: POItem) =>
  Boolean(item.grade.trim() && (String(item.thickness).trim() || String(item.sizeSection).trim()) && String(item.length).trim());

const parseGstRate = (gstType: string) => {
  const m = gstType.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 18;
};

export const PurchaseOrderEntry: React.FC = () => {
  const {
    nextPONo,
    purchaseOrders,
    setPurchaseOrders,
    role,
    parties,
    addParty,
    persistErpNow,
    grades,
    plates,
    usages,
    items: itemMasterList,
    transports,
    user
  } = useAppContext();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const existingPo = editId ? purchaseOrders.find(po => po.id === editId) : undefined;
  const [draftPoNumber, setDraftPoNumber] = useState(() => nextPONo());
  const poNumber = existingPo?.poNumber ?? draftPoNumber;

  // Supplier Details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierGST, setSupplierGST] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierMobile, setSupplierMobile] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Delivery Details
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [transportName, setTransportName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [note, setNote] = useState('');
  const [remark, setRemark] = useState('');

  // Payment & Other Details
  const [paymentTerms, setPaymentTerms] = useState('');
  const [inspection, setInspection] = useState('');
  const [tc, setTc] = useState('');
  const [utLevel, setUtLevel] = useState('');

  // Transport & Loading
  const [transport, setTransport] = useState('');
  const [loading, setLoading] = useState('');

  // Additional fields
  const [customer, setCustomer] = useState('');
  const [location, setLocation] = useState(''); // Legacy / dispatch location
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [gstType, setGstType] = useState('GST 18%');
  const [roundOff, setRoundOff] = useState(0);
  const [stockCheck, setStockCheck] = useState(false);
  const [itemMtc, setItemMtc] = useState<Record<string, string>>({});
  const [items, setItems] = useState<POItem[]>([createEmptyPOItem()]);

  const selectedSupplier = useMemo(
    () => parties.find(p => p.partyName.trim().toUpperCase() === supplierName.trim().toUpperCase()),
    [parties, supplierName],
  );

  const gradeOptions = useMemo(() => {
    const base = getPartyPoGradeOptions(
      grades,
      selectedSupplier?.grades,
      purchaseOrders,
      supplierName,
      MATERIAL_GRADES,
    );
    const seen = new Set(base.map(g => g.toUpperCase()));
    const extras = items
      .map(i => i.grade.trim())
      .filter(g => g && !seen.has(g.toUpperCase()));
    return extras.length ? [...base, ...extras] : base;
  }, [grades, selectedSupplier, purchaseOrders, supplierName, items]);

  const itemMasterOptions = useMemo(
    () => [...itemMasterList].sort((a, b) => a.name.localeCompare(b.name)),
    [itemMasterList],
  );

  const applyItemMaster = (rowId: string, masterId: string) => {
    if (!masterId) {
      setItems(prev => prev.map(item => item.id === rowId
        ? { ...item, itemMasterId: '', itemName: '' }
        : item));
      return;
    }
    const master = itemMasterList.find(i => i.id === masterId);
    if (!master) return;
    setItems(prev => prev.map(item => {
      if (item.id !== rowId) return item;
      return {
        ...item,
        itemMasterId: master.id,
        itemName: master.name,
        grade: master.grade?.trim() ? master.grade : item.grade,
      };
    }));
    toast.success(`Item: ${master.name}`, { icon: '📦' });
  };

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });
  const [poPdfForSend, setPoPdfForSend] = useState<string | null>(null);
  const [pendingWhatsApp, setPendingWhatsApp] = useState(false);
  const [poForSend, setPoForSend] = useState<PurchaseOrder | null>(null);
  const [stockModal, setStockModal] = useState<{
    grade: string;
    thickness: string;
    width: string;
    length: string;
    plateNos: number;
    plateKg: number;
  } | null>(null);

  // Filter out empty rows when summing / saving
  const filledItems = useMemo(() => items.filter(hasItemContent), [items]);
  const totalWeight = useMemo(() => filledItems.reduce((sum, item) => sum + item.kg, 0), [filledItems]);

  // Dynamic Total Amount based on Rate Basis
  const totalAmount = useMemo(() => {
    return filledItems.reduce((sum, item) => {
      const kgVal = parseNum(item.kg);
      const nosVal = parseNum(item.nos);
      const rateVal = parseNum(item.rate);
      const basis = item.rateBasis || 'Per Kg';

      let itemAmt = 0;
      if (basis === 'Per Kg') {
        itemAmt = kgVal * rateVal;
      } else if (basis === 'Per Ton') {
        itemAmt = (kgVal / 1000) * rateVal;
      } else {
        itemAmt = nosVal * rateVal;
      }
      return sum + Math.ceil(itemAmt);
    }, 0);
  }, [filledItems]);

  const gstRate = parseGstRate(gstType);
  const gstAmount = Math.round(totalAmount * gstRate / 100 * 100) / 100;

  // Auto calculate roundOff to nearest integer
  const computedRoundOff = useMemo(() => {
    const rawTotal = totalAmount + gstAmount;
    const rounded = Math.round(rawTotal);
    return parseFloat((rounded - rawTotal).toFixed(2));
  }, [totalAmount, gstAmount]);

  // If user hasn't edited roundOff manually, use the auto computed value
  const finalRoundOff = roundOff !== 0 ? roundOff : computedRoundOff;
  const grandTotal = Math.round((totalAmount + gstAmount + finalRoundOff) * 100) / 100;

  const buildPOExtras = (): PurchaseOrderPrintExtras => ({
    contactPerson: contactPerson.trim(),
    deliveryTerms: transportName.trim(),
    inspection: inspection.trim(),
    gstRate,
    roundOff: finalRoundOff,
  });

  const buildPOForPreview = (): PurchaseOrder | null => {
    if (!supplierName.trim()) return null;
    const previewItems = filledItems.length ? filledItems : items.filter(hasItemContent);
    if (!previewItems.length) return null;
    return {
      id: editId || 'preview',
      poNumber,
      date,
      supplierName: upper(supplierName.trim()),
      supplierAddress: upper(supplierAddress.trim()),
      supplierGST: upper(supplierGST.trim()),
      supplierEmail: supplierEmail.trim(),
      supplierMobile: supplierMobile.trim(),
      deliveryAddress: upper(deliveryLocation.trim() || location.trim()),
      deliveryLocation: upper(deliveryLocation.trim()),
      transportName: upper(transportName.trim()),
      paymentTerms: upper(paymentTerms.trim()),
      make: upper(items[0]?.make || ''),
      utLevel: upper(utLevel.trim()),
      tc: upper(tc.trim()),
      note: upper([note.trim(), remark.trim() ? `REMARK: ${remark.trim()}` : ''].filter(Boolean).join('\n')),
      customer: upper(customer.trim()),
      location: upper(location.trim()),
      inspection: upper(inspection.trim()),
      loading: upper(loading.trim()),
      transport: upper(transport.trim()),
      items: previewItems.map(i => ({
        ...i,
        amount: Math.ceil(
          i.rateBasis === 'Per Kg' ? i.kg * i.rate :
          i.rateBasis === 'Per Ton' ? (i.kg / 1000) * i.rate :
          i.nos * i.rate
        )
      })),
      totalKg: previewItems.reduce((sum, item) => sum + item.kg, 0),
      totalAmount,
      status: editId ? (purchaseOrders.find(p => p.id === editId)?.status || 'Pending') : 'Pending',
    };
  };


  const handleSelectParty = (party: PartyMaster) => {
    setSupplierName(party.partyName);
    if (party.contactPerson) setContactPerson(party.contactPerson);
    if (party.deliveryAddress) setSupplierAddress(party.deliveryAddress);
    if (party.gstNumber) setSupplierGST(party.gstNumber);
    if (party.email) setSupplierEmail(party.email);
    if (party.mobileNumber) setSupplierMobile(party.mobileNumber);
    if (party.paymentTerms) setPaymentTerms(party.paymentTerms);
    const msg = party.grades?.length
      ? `Supplier loaded — ${party.grades.length} grade(s) ready for PO`
      : 'Supplier filled from Party Master';
    toast.success(msg, { icon: '✨' });
  };

  const handleSelectCustomer = (party: PartyMaster) => {
    setCustomer(party.partyName);
    if (party.location) setLocation(party.location);
    toast.success('Customer filled from Party Master', { icon: '✨' });
  };

  const handleAddItem = () => setItems(prev => [...prev, createEmptyPOItem()]);

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      setItems([createEmptyPOItem()]);
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
    setItemMtc(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateItem = (id: string, field: keyof POItem, value: unknown) => {
    const numericFields = new Set(['thickness', 'width', 'length', 'nos', 'kg', 'rate']);
    const normalized =
      typeof value === 'string' && !numericFields.has(field as string) ? upper(value) : value;
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, [field]: normalized } as POItem;

        // Autocalculate weight if plate details are modified
        if (['thickness', 'width', 'length', 'nos'].includes(field as string)) {
          const thk = parseNum(updatedItem.thickness);
          const w = parseNum(updatedItem.width);
          const l = parseNum(updatedItem.length);
          const n = parseNum(updatedItem.nos);
          if (thk && w && l && n) {
            updatedItem.kg = (thk * w * l * n * 8) / 1000000;
          }
        }

        // Recalculate amount based on selected Rate Basis
        const basis = updatedItem.rateBasis || 'Per Kg';
        const kgVal = parseNum(updatedItem.kg);
        const nosVal = parseNum(updatedItem.nos);
        const rateVal = parseNum(updatedItem.rate);

        if (basis === 'Per Kg') {
          updatedItem.amount = Math.ceil(kgVal * rateVal);
        } else if (basis === 'Per Ton') {
          updatedItem.amount = Math.ceil((kgVal / 1000) * rateVal);
        } else {
          updatedItem.amount = Math.ceil(nosVal * rateVal);
        }

        return updatedItem;
      });
      return updated;
    });
  };

  const maybeAddRowOnBlur = (id: string) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index !== prev.length - 1) return prev;
      if (!isRowReadyForNext(prev[index])) return prev;
      return [...prev, createEmptyPOItem()];
    });
  };

  const normStock = (s: string) => s.trim().toUpperCase();

  const handleCheckStock = (item: POItem) => {
    if (!item.grade.trim()) {
      toast.error('Select grade first');
      return;
    }
    let plateNos = 0;
    let plateKg = 0;
    for (const plate of plates) {
      if (normStock(plate.grade) !== normStock(item.grade)) continue;
      if (item.thickness && plate.thickness && normStock(String(plate.thickness)) !== normStock(String(item.thickness))) continue;
      const used = usages
        .filter(u => u.plateId === plate.id)
        .reduce((sum, u) => sum + u.usedWeight + u.scrapQuantity, 0);
      const balance = Math.max(0, (plate.weight || plate.initialWeight) - used);
      if (balance <= 0) continue;
      plateNos += 1;
      plateKg += balance;
    }
    setStockModal({
      grade: item.grade.trim(),
      thickness: String(item.thickness || '-'),
      width: String(item.width || '-'),
      length: String(item.length || '-'),
      plateNos,
      plateKg,
    });
  };

  const buildPOFromForm = (): PurchaseOrder | null => {
    if (!supplierName.trim()) { toast.error('Supplier Name is required'); return null; }
    if (filledItems.length === 0) {
      toast.error('Add at least one item with grade and weight');
      return null;
    }
    const noteCombined = [note.trim(), terms.trim() ? `TERMS:\n${terms.trim()}` : ''].filter(Boolean).join('\n\n');

    return {
      id: editId || Date.now().toString(),
      poNumber,
      date,
      supplierName: upper(supplierName.trim()),
      supplierAddress: upper(supplierAddress.trim()),
      supplierGST: upper(supplierGST.trim()),
      supplierEmail: supplierEmail.trim(),
      supplierMobile: supplierMobile.trim(),
      deliveryAddress: upper(deliveryLocation.trim() || location.trim()),
      deliveryLocation: upper(deliveryLocation.trim()),
      transportName: upper(transportName.trim()),
      paymentTerms: upper(paymentTerms.trim()),
      make: upper(items[0]?.make || ''),
      utLevel: upper(utLevel.trim()),
      tc: upper(tc.trim()),
      note: upper(noteCombined),
      customer: upper(customer.trim()),
      location: upper(location.trim()),
      inspection: upper(inspection.trim()),
      loading: upper(loading.trim()),
      transport: upper(transport.trim()),
      items: filledItems.map(i => ({
        ...i,
        amount: Math.ceil(
          i.rateBasis === 'Per Kg' ? i.kg * i.rate :
          i.rateBasis === 'Per Ton' ? (i.kg / 1000) * i.rate :
          i.nos * i.rate
        )
      })),
      totalKg: filledItems.reduce((sum, item) => sum + item.kg, 0),
      totalAmount,
      status: editId ? (purchaseOrders.find(p => p.id === editId)?.status || 'Pending') : 'Pending',
    };
  };

  const handleSave = async (downloadAfterSave = false) => {
    const newPO = buildPOFromForm();
    if (!newPO) return;

    const partyNameUpper = supplierName.trim().toUpperCase();
    let nextParties = parties;
    if (!parties.find(p => p.partyName === partyNameUpper)) {
      const created = await addParty({
        partyName: partyNameUpper,
        contactPerson: contactPerson.trim().toUpperCase(),
        mobileNumber: supplierMobile.trim(),
        location: location || '',
        deliveryAddress: supplierAddress.trim().toUpperCase(),
        paymentTerms: paymentTerms.trim().toUpperCase(),
        gstNumber: supplierGST.trim().toUpperCase(),
        email: supplierEmail.trim(),
      });
      if (created) nextParties = [...parties, created];
    }

    const nextPOs = editId
      ? purchaseOrders.map(po => po.id === editId ? newPO : po)
      : [...purchaseOrders, newPO];

    if (editId) {
      setPurchaseOrders(prev => prev.map(po => po.id === editId ? newPO : po));
      toast.success(`Purchase Order ${poNumber} updated!`, { icon: '🛍️' });
    } else {
      setPurchaseOrders(prev => [...prev, newPO]);
      toast.success(`Purchase Order ${poNumber} saved!`, { icon: '🛍️' });
    }

    try {
      await persistErpNow({
        purchaseOrders: nextPOs,
        ...(nextParties !== parties ? { parties: nextParties } : {}),
      });
    } catch {
      toast.error('Saved locally but server sync failed — retry Save');
      return;
    }

    if (!editId) {
      navigate(`/purchase-order?edit=${newPO.id}`, { replace: true });
      toast('You can edit this PO anytime from Purchase Reports', { icon: '📋', duration: 4000 });
    }

    if (downloadAfterSave) {
      void downloadPurchaseOrderPDF(newPO, buildPOExtras()).then((ok) => {
        if (ok) toast.success('PO PDF downloaded');
      });
    }
  };

  const handleNew = () => {
    navigate('/purchase-order');
    setDraftPoNumber(nextPONo());
    setSupplierName(''); setSupplierAddress(''); setSupplierGST(''); setSupplierEmail('');
    setSupplierMobile(''); setContactPerson(''); setDeliveryLocation(''); setTransportName('');
    setLocation(''); setPaymentTerms(''); setUtLevel(''); setTc('');
    setNote(''); setRemark(''); setCustomer(''); setTerms(DEFAULT_TERMS); setGstType('GST 18%');
    setRoundOff(0); setInspection(''); setStockCheck(false); setItemMtc({});
    setTransport(''); setLoading('');
    setItems([createEmptyPOItem()]);
    toast('New PO form ready');
  };

  const handleDelete = async () => {
    if (!editId) { toast.error('Open a saved PO to delete (from Purchase Reports)'); return; }
    if (!confirm('Delete this purchase order?')) return;
    const next = purchaseOrders.filter(p => p.id !== editId);
    setPurchaseOrders(next);
    try {
      await persistErpNow({ purchaseOrders: next });
      toast.success('Purchase order deleted');
      navigate('/purchase-reports');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  const handlePrint = async () => {
    const po = buildPOFromForm();
    if (!po) return;
    const ok = await downloadPurchaseOrderPDF(po, buildPOExtras());
    if (ok) toast.success('PO PDF generated');
  };

  const prepareSend = (po: PurchaseOrder) => {
    setPoForSend(po);
    setPoPdfForSend(null);
    setWhatsAppData({
      number: po.supplierMobile || '',
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
    setEmailData({
      to: po.supplierEmail || '',
      subject: `Purchase Order ${po.poNumber} - Jagdamba Profile`,
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
  };

  const handleWhatsAppPO = () => {
    const po = buildPOFromForm();
    if (!po) return;
    prepareSend(po);
    setPendingWhatsApp(true);
  };

  const handleEmailPO = () => {
    const po = buildPOFromForm();
    if (!po) return;
    prepareSend(po);
    setShowEmailModal(true);
  };

  useEffect(() => {
    if (!pendingWhatsApp || !poForSend) return;
    void (async () => {
      const pdf = await getPurchaseOrderPdfBase64(poForSend, buildPOExtras());
      if (!pdf) { toast.error('Failed to generate PO PDF'); setPendingWhatsApp(false); return; }
      setPoPdfForSend(pdf);
      setShowWhatsAppModal(true);
      setPendingWhatsApp(false);
    })();
  }, [pendingWhatsApp, poForSend]);

  useEffect(() => {
    if (!showEmailModal || !poForSend) return;
    void getPurchaseOrderPdfBase64(poForSend, buildPOExtras()).then(pdf => { if (pdf) setPoPdfForSend(pdf); });
  }, [showEmailModal, poForSend]);

  const sendWhatsAppPO = async () => {
    if (!whatsAppData.number.trim() || !poPdfForSend) { toast.error('Number and PDF required'); return; }
    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: whatsAppData.number,
        mediaData: poPdfForSend,
        fileName: poFileName(poNumber),
        caption: whatsAppData.message,
      });
      toast.success('PO sent on WhatsApp!', { id: loadingToast });
      setShowWhatsAppModal(false);
    } catch (err: unknown) {
      toast.error(`WhatsApp Error: ${(err as Error).message}`, { id: loadingToast });
    }
  };

  const sendEmailPO = async () => {
    if (!poForSend || !emailData.to.trim()) { toast.error('Recipient email required'); return; }
    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(poForSend, buildPOExtras()));
    if (!pdf) { toast.error('Failed to generate PO PDF'); return; }
    const loadingToast = toast.loading('Sending email...');
    try {
      const response = await fetch('/api/mail/send-po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          poData: pdf,
          fileName: poFileName(poForSend.poNumber),
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('PO email sent!', { id: loadingToast });
        setShowEmailModal(false);
      } else throw new Error(result.message);
    } catch (err: unknown) {
      toast.error(`Email failed: ${(err as Error).message}`, { id: loadingToast });
    }
  };

  // Keyboard Hotkeys implementation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 - New PO
      if (e.key === 'F2') {
        e.preventDefault();
        handleNew();
      }
      // F3 - Save
      if (e.key === 'F3') {
        e.preventDefault();
        handleSave(false);
      }
      // F4 - Print
      if (e.key === 'F4') {
        e.preventDefault();
        handlePrint();
      }
      // F6 - Add Item (F6) - allow even if focused in input
      if (e.key === 'F6') {
        e.preventDefault();
        handleAddItem();
      }
      // Escape - Close PO (navigates back to purchase reports)
      if (e.key === 'Escape' && !showWhatsAppModal && !showEmailModal && !stockModal) {
        e.preventDefault();
        navigate('/purchase-reports');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, supplierName, date, showWhatsAppModal, showEmailModal, stockModal]);

  // Load PO values for editing
  useEffect(() => {
    if (!editId) return;
    const existing = purchaseOrders.find(po => po.id === editId);
    if (!existing) return;
    setDate(existing.date);
    setSupplierName(existing.supplierName);
    setSupplierAddress(existing.supplierAddress || '');
    setSupplierGST(existing.supplierGST || '');
    setSupplierEmail(existing.supplierEmail || '');
    setSupplierMobile(existing.supplierMobile || '');
    setDeliveryLocation(existing.deliveryLocation || existing.deliveryAddress || '');
    setTransportName(existing.transportName || '');
    setPaymentTerms(existing.paymentTerms || '');
    setUtLevel(existing.utLevel || '');
    setTc(existing.tc || '');
    setNote(existing.note || '');
    setCustomer(existing.customer || '');
    setLocation(existing.location || '');
    setInspection(existing.inspection || '');
    setLoading(existing.loading || '');
    setTransport(existing.transport || '');

    const loaded = existing.items.map(item => ({ ...item }));
    const last = loaded[loaded.length - 1];
    setItems(last && hasItemContent(last) ? [...loaded, createEmptyPOItem()] : loaded.length ? loaded : [createEmptyPOItem()]);
  }, [editId, purchaseOrders]);

  const canCreate = role === 'Admin' || role === 'Office Entry';
  const isEditing = Boolean(existingPo);

  // Dynamic lists from other masters
  const transportOptions = useMemo(() => {
    const list = transports.map(t => t.name.trim().toUpperCase()).filter(Boolean);
    return Array.from(new Set([...list, ...TRANSPORT_PAYMENT_OPTIONS]));
  }, [transports]);

  return (
    <div className="max-w-[1680px] mx-auto p-4 space-y-4 fade-in pb-12 min-w-0 select-none text-slate-800 dark:text-slate-100">
      
      {/* Hidden print element */}
      {buildPOForPreview() && (
        <div className="hidden print:block">
          <PurchaseOrderPrint po={buildPOForPreview()!} extras={buildPOExtras()} printAreaId={PO_PRINT_AREA_ID} />
        </div>
      )}

      {/* ── TOP HEADER BAR (Navy Blue, matching Reference Image) ──────────────────── */}
      <div className="bg-[#0b387c] text-white rounded-lg shadow-md px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-0 z-30">
        
        {/* Title Block */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg flex items-center justify-center shadow">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-white leading-tight">
              Purchase Order Entry
            </h1>
            <p className="text-[10px] text-blue-100 font-medium">
              {isEditing ? `Editing Saved PO: ${poNumber}` : 'Create & Manage Supplier Purchase Orders'}
            </p>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            onClick={handleEmailPO}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004b93] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all border border-blue-600/30"
          >
            <Mail className="w-3.5 h-3.5" /> Email PO
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={!canCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004b93] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all border border-blue-600/30"
          >
            <FileText className="w-3.5 h-3.5" /> PDF PO
          </button>

          <button
            type="button"
            onClick={handleWhatsAppPO}
            disabled={!canCreate || pendingWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold shadow-sm transition-all border border-green-500/30"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp PO
          </button>

          <button
            type="button"
            onClick={() => navigate('/purchase-reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004b93] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm transition-all border border-blue-600/30"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit PO
          </button>

          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> + New PO <span className="opacity-70 font-semibold">(F2)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={!canCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d2e61] hover:bg-blue-900 text-white rounded text-xs font-bold shadow-sm transition-all border border-blue-800/30"
          >
            <Save className="w-3.5 h-3.5" /> Save <span className="opacity-70 font-semibold">(F3)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d2e61] hover:bg-blue-900 text-white rounded text-xs font-bold shadow-sm transition-all border border-blue-800/30"
          >
            <Printer className="w-3.5 h-3.5" /> Print <span className="opacity-70 font-semibold">(F4)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/purchase-reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#dc2626] hover:bg-red-700 text-white rounded text-xs font-bold shadow-sm transition-all"
          >
            <X className="w-3.5 h-3.5" /> Close <span className="opacity-70 font-semibold">(Esc)</span>
          </button>
        </div>
      </div>

      {/* ── 3-COLUMN FORM DETAILS (Supplier, Delivery, Payment) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Column 1: SUPPLIER DETAILS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span className="text-[#0b387c] text-sm">👤</span>
            <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
              Supplier Details
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">PO No. <span className="text-red-500">*</span></label>
              <input readOnly value={poNumber} className="w-full bg-[#f8fafc] dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-blue-700 dark:text-blue-400 font-mono font-bold focus:outline-none" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">PO Date <span className="text-red-500">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2 relative">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Supplier Name <span className="text-red-500">*</span></label>
              <div className="w-full">
                <PartyAutocomplete value={supplierName} onChange={setSupplierName} onSelectParty={handleSelectParty} placeholder="Search supplier..." className="!py-1.5 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Contact Person</label>
              <input type="text" value={contactPerson} onChange={e => setContactPerson(upper(e.target.value))} placeholder="Enter Contact Person" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Mobile No.</label>
              <input type="text" value={supplierMobile} onChange={e => setSupplierMobile(e.target.value)} placeholder="Enter Mobile Number" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none no-uppercase" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-start gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">GST No.</label>
              <input type="text" value={supplierGST} onChange={e => setSupplierGST(upper(e.target.value))} placeholder="Enter GST Number" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-start gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Email ID</label>
              <input type="email" value={supplierEmail} onChange={e => setSupplierEmail(e.target.value)} placeholder="Enter Email Address" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none no-uppercase" />
            </div>
          </div>
        </div>

        {/* Column 2: DELIVERY DETAILS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <span className="text-[#0b387c] text-sm">🚚</span>
            <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
              Delivery Details
            </span>
          </div>

          <div className="p-4 space-y-3.5 flex-1">
            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Delivery Location <span className="text-red-500">*</span></label>
              <EditableSelect value={deliveryLocation} onChange={setDeliveryLocation} options={BRANCHES} placeholder="Enter Delivery Location" className="w-full !py-1.5 text-xs" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Transport Name <span className="text-red-500">*</span></label>
              <EditableSelect value={transportName} onChange={setTransportName} options={transportOptions} placeholder="Select Transport" className="w-full !py-1.5 text-xs" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Driver Mobile No.</label>
              <input type="text" value={driverMobile} onChange={e => setDriverMobile(e.target.value)} placeholder="Enter Driver Mobile Number" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none no-uppercase" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-start gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Note</label>
              <textarea rows={2} value={note} onChange={e => setNote(upper(e.target.value))} placeholder="Enter Note" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none" />
            </div>

            <div className="grid grid-cols-[130px_1fr] items-start gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Remark</label>
              <textarea rows={2} value={remark} onChange={e => setRemark(upper(e.target.value))} placeholder="Enter Remark" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Column 3: PAYMENT & OTHER DETAILS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[#0b387c] text-sm">📋</span>
              <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
                Payment &amp; Other Details
              </span>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Payment Terms <span className="text-red-500">*</span></label>
                <EditableSelect value={paymentTerms} onChange={setPaymentTerms} options={['IMMEDIATE', 'CHEQUE ON DELIVERY', '15 DAYS CREDIT', '30 DAYS CREDIT', '45 DAYS CREDIT', '60 DAYS CREDIT', 'PDC', '100% ADVANCE']} placeholder="Select Payment Terms" className="w-full !py-1.5 text-xs" />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Inspection</label>
                <EditableSelect value={inspection} onChange={setInspection} options={INSPECTION_OPTIONS} placeholder="Select Inspection" className="w-full !py-1.5 text-xs" />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Test Certificate</label>
                <EditableSelect value={tc} onChange={setTc} options={TC_OPTIONS} placeholder="Select Test Certificate" className="w-full !py-1.5 text-xs" />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">UT Level</label>
                <EditableSelect value={utLevel} onChange={setUtLevel} options={UT_LEVEL_OPTIONS} placeholder="Select UT Level" className="w-full !py-1.5 text-xs" />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-2 relative">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Customer</label>
                <div className="w-full">
                  <PartyAutocomplete value={customer} onChange={setCustomer} onSelectParty={handleSelectCustomer} placeholder="Search customer..." className="!py-1.5 text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 pl-[130px]">
                <input
                  type="checkbox"
                  id="stockCheck"
                  checked={stockCheck}
                  onChange={e => setStockCheck(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="stockCheck" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Stock Check (Before Purchase)
                </label>
              </div>
            </div>
          </div>

          {/* Sub Section: Transport & Loading */}
          <div className="border-t border-slate-200 dark:border-slate-800">
            <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[#0b387c] text-sm">🚛</span>
              <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
                Transport &amp; Loading
              </span>
            </div>

            <div className="p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Transport <span className="text-red-500">*</span></label>
                <EditableSelect value={transport} onChange={setTransport} options={TRANSPORT_PAYMENT_OPTIONS} placeholder="Select Transport" className="w-full !py-1.5 text-xs" />
              </div>

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading <span className="text-red-500">*</span></label>
                <EditableSelect value={loading} onChange={setLoading} options={LOADING_OPTIONS} placeholder="Select Loading" className="w-full !py-1.5 text-xs" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── ITEM DETAILS PANEL ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
        
        {/* Dark Blue Header Bar */}
        <div className="bg-[#0b387c] text-white px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-2">
            📦 Item Details
          </span>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f9520b] hover:bg-orange-600 text-white rounded text-xs font-black shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item <span className="opacity-75 font-semibold text-[10px] ml-1">(F6)</span>
          </button>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1280px]">
            <thead>
              <tr className="bg-[#0b387c] text-white border-b border-blue-900 text-center select-none">
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-10 font-bold">SR NO.</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 min-w-[160px] font-bold">ITEM</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 min-w-[120px] font-bold">GRADE</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 min-w-[110px] font-bold">MAKE</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 min-w-[120px] font-bold">SIZE / SECTION</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-24 font-bold">THICK (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-24 font-bold">WIDTH (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-24 font-bold">LENGTH (MM)</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-16 font-bold">NOS</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-28 font-bold">WEIGHT (KG)</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-24 font-bold">RATE (₹)</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-28 font-bold">RATE BASIS</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-16 font-bold text-center">MTC</th>
                <th className="px-2 py-2.5 border-r border-blue-900/40 w-32 font-bold text-right pr-4">AMOUNT (₹)</th>
                <th className="px-2 py-2.5 w-12 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => {
                const isItemFilled = hasItemContent(item);
                const kgVal = parseNum(item.kg);
                const nosVal = parseNum(item.nos);
                const rateVal = parseNum(item.rate);
                const basis = item.rateBasis || 'Per Kg';

                let calculatedAmount = 0;
                if (basis === 'Per Kg') {
                  calculatedAmount = kgVal * rateVal;
                } else if (basis === 'Per Ton') {
                  calculatedAmount = (kgVal / 1000) * rateVal;
                } else {
                  calculatedAmount = nosVal * rateVal;
                }
                const displayAmount = Math.ceil(calculatedAmount);

                return (
                  <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40'}`}>
                    
                    {/* SR NO */}
                    <td className="px-2 py-2 text-center text-slate-500 font-bold border-r border-slate-100 dark:border-slate-800 select-none">
                      {idx + 1}
                    </td>

                    {/* ITEM */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 min-w-[160px]">
                      <div className="flex items-center gap-1">
                        <select
                          value={item.itemMasterId || ''}
                          onChange={e => applyItemMaster(item.id, e.target.value)}
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Select Item</option>
                          {itemMasterOptions.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => navigate('/item-master')}
                          title="Item Master"
                          className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center hover:bg-blue-200 shrink-0"
                        >
                          <List className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* GRADE */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 min-w-[120px]">
                      <EditableSelect
                        value={item.grade}
                        onChange={v => updateItem(item.id, 'grade', v)}
                        options={gradeOptions}
                        placeholder="Select Grade"
                        className="w-full !bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded !px-2 !py-1 text-xs"
                      />
                    </td>

                    {/* MAKE */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 min-w-[110px]">
                      <select
                        value={item.make || ''}
                        onChange={e => updateItem(item.id, 'make', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">Select Make</option>
                        {MAKES.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>

                    {/* SIZE / SECTION */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 min-w-[120px]">
                      <input
                        type="text"
                        value={item.sizeSection || ''}
                        onChange={e => updateItem(item.id, 'sizeSection', e.target.value)}
                        placeholder="Size / Section"
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-center"
                      />
                    </td>

                    {/* THICKNESS */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-24">
                      <NumericInput
                        value={item.thickness}
                        onChange={v => updateItem(item.id, 'thickness', v)}
                        onBlur={() => maybeAddRowOnBlur(item.id)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs text-center"
                      />
                    </td>

                    {/* WIDTH */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-24">
                      <NumericInput
                        value={item.width}
                        onChange={v => updateItem(item.id, 'width', v)}
                        onBlur={() => maybeAddRowOnBlur(item.id)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs text-center"
                      />
                    </td>

                    {/* LENGTH */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-24">
                      <NumericInput
                        value={item.length}
                        onChange={v => updateItem(item.id, 'length', v)}
                        onBlur={() => maybeAddRowOnBlur(item.id)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs text-center"
                      />
                    </td>

                    {/* NOS */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-16">
                      <NumericInput
                        value={item.nos}
                        onChange={v => updateItem(item.id, 'nos', v)}
                        onBlur={() => maybeAddRowOnBlur(item.id)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs text-center font-semibold"
                      />
                    </td>

                    {/* WEIGHT */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-28">
                      <div className="flex items-center gap-1.5 w-full">
                        <NumericInput
                          value={item.kg}
                          onChange={v => updateItem(item.id, 'kg', v)}
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 text-right"
                        />
                        <button
                          type="button"
                          onClick={() => handleCheckStock(item)}
                          title="Check Yard Stock"
                          className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-200 shrink-0"
                        >
                          <Package className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* RATE */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-24">
                      <NumericInput
                        value={item.rate}
                        onChange={v => updateItem(item.id, 'rate', v)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs font-semibold text-right"
                      />
                    </td>

                    {/* RATE BASIS */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-28">
                      <select
                        value={item.rateBasis || 'Per Kg'}
                        onChange={e => updateItem(item.id, 'rateBasis', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        {RATE_BASIS_OPTIONS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>

                    {/* MTC */}
                    <td className="p-1 border-r border-slate-100 dark:border-slate-800 w-16">
                      <select
                        value={itemMtc[item.id] || 'No'}
                        onChange={e => setItemMtc(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-800 w-32 text-right font-black text-slate-800 dark:text-slate-200 pr-4 select-none">
                      {isItemFilled && displayAmount > 0 ? `₹ ${displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>

                    {/* ACTION */}
                    <td className="px-2 py-2 text-center w-12">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-all"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>

            {/* Bottom aggregate metrics footer inside table */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-t-2 border-blue-900/60 font-extrabold text-xs text-[#0b387c] dark:text-blue-300">
                <td colSpan={6} className="px-4 py-2.5 text-left select-none font-bold">
                  Total Items : <span className="text-slate-800 dark:text-slate-200 ml-1">{filledItems.length}</span>
                </td>
                <td colSpan={3} className="text-right select-none font-bold"></td>
                <td className="px-3 py-2.5 text-right font-black">
                  Total Weight : <span className="text-slate-800 dark:text-slate-200 ml-1">{totalWeight.toLocaleString('en-IN', { minimumFractionDigits: 2 })} KG</span>
                </td>
                <td colSpan={2} className="text-right"></td>
                <td className="px-4 py-2.5 text-right font-black text-sm pr-4 select-none">
                  Total Amount : <span className="text-slate-800 dark:text-slate-200 ml-1">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── LOWER GRID (Terms & Conditions, Other/Attachments, Financial Summary) ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Side: TERMS & CONDITIONS + ATTACHMENTS */}
        <div className="space-y-4">
          
          {/* Terms & Conditions Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[#0b387c] text-sm">📋</span>
              <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
                Terms &amp; Conditions
              </span>
            </div>
            <div className="p-4">
              <textarea
                rows={5}
                value={terms}
                onChange={e => setTerms(e.target.value)}
                className="w-full bg-[#f8fafc] dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded p-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter terms and conditions..."
              />
            </div>
          </div>



        </div>

        {/* Right Side: TAX SUMMARY & FINAL AMOUNT */}
        <div className="space-y-4">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between h-full">
            <div className="bg-[#f0f4f9] dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[#0b387c] text-sm">💰</span>
              <span className="text-xs font-extrabold text-[#0b387c] dark:text-blue-400 uppercase tracking-wider">
                Financial Summary
              </span>
            </div>

            <div className="p-4 space-y-3 flex-1 justify-center flex flex-col">
              
              {/* Total Before Tax */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Before Tax</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* GST Selection & Amount */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">GST Rate</span>
                  <select
                    value={gstType}
                    onChange={e => setGstType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 text-2xs font-bold focus:outline-none"
                  >
                    {GST_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Round Off Input */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Round Off</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-400">₹</span>
                  <NumericInput
                    value={roundOff === 0 ? computedRoundOff : roundOff}
                    onChange={v => setRoundOff(parseNum(v))}
                    className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-xs text-right font-semibold"
                  />
                  {roundOff !== 0 && (
                    <button
                      type="button"
                      onClick={() => setRoundOff(0)}
                      className="text-2xs text-blue-500 hover:underline font-bold"
                      title="Reset to Auto Roundoff"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Saved PO option (Only visible when editing and has role perm) */}
              {isEditing && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={!canCreate}
                    className="flex items-center gap-1 text-red-500 hover:text-red-700 font-bold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete this Purchase Order
                  </button>
                </div>
              )}

              {/* GRAND TOTAL Banner (Orange background, white text, matching Reference Image) */}
              <div className="mt-4 bg-[#f9520b] text-white rounded-lg px-4 py-4 flex items-center justify-between shadow-md">
                <span className="text-sm font-black uppercase tracking-wider">
                  Grand Total
                </span>
                <span className="text-2xl font-black font-mono">
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ── FOOTER STATS & AUDIT LOG BAR (Matching Reference Image) ──────────────────── */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-2xs text-slate-500 dark:text-slate-400 shadow-sm">
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="text-slate-700 dark:text-slate-300 uppercase">Note :</strong> 1. Weight calculated as per standard.
          </span>
          <span>
            2. All dimensions are in MM.
          </span>
          <span>
            3. Weight tolerance ± 5% acceptable.
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span>Created By : <strong>{user?.displayName || 'ADMIN'}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold font-mono">
            {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
          </span>
        </div>

      </div>

      {/* ── POPUP MODALS (Stock Check, WhatsApp, Email) ──────────────────── */}

      {/* Stock Check Modal */}
      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center select-none">
              <h3 className="font-extrabold flex items-center gap-2 text-sm">
                <Package className="w-4.5 h-4.5" /> Stock Balance Check
              </h3>
              <button type="button" onClick={() => setStockModal(null)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
                <div><span className="text-slate-400 font-bold uppercase text-[9px]">Grade</span><p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{stockModal.grade}</p></div>
                <div><span className="text-slate-400 font-bold uppercase text-[9px]">Thickness</span><p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{stockModal.thickness} mm</p></div>
                <div><span className="text-slate-400 font-bold uppercase text-[9px]">Width</span><p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{stockModal.width} mm</p></div>
                <div><span className="text-slate-400 font-bold uppercase text-[9px]">Length</span><p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{stockModal.length} mm</p></div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900/60 p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 tracking-wider mb-0.5">Available Stock in Yard</p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                  {stockModal.plateNos} Plates
                </p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stockModal.plateKg.toLocaleString('en-IN', { maximumFractionDigits: 2 })} KG
                </p>
                {stockModal.plateNos === 0 && (
                  <p className="text-2xs text-slate-500 mt-2">No matching plates found in stock master.</p>
                )}
              </div>

              <button type="button" onClick={() => setStockModal(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-extrabold flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Share PO via WhatsApp</h3>
              <button type="button" onClick={() => setShowWhatsAppModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">WhatsApp Number</label>
                <input value={whatsAppData.number} onChange={e => setWhatsAppData({ ...whatsAppData, number: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-sm focus:outline-none no-uppercase" placeholder="e.g. 919876543210" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Message Caption</label>
                <textarea rows={4} value={whatsAppData.message} onChange={e => setWhatsAppData({ ...whatsAppData, message: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-xs focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                <button type="button" onClick={sendWhatsAppPO} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors">Send PO PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-teal-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-extrabold flex items-center gap-2"><Mail className="w-5 h-5" /> Email PO Document</h3>
              <button type="button" onClick={() => setShowEmailModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">To Address</label>
                <input type="email" value={emailData.to} onChange={e => setEmailData({ ...emailData, to: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-sm focus:outline-none no-uppercase" placeholder="supplier@example.com" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Subject</label>
                <input value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 block">Email Body Message</label>
                <textarea rows={4} value={emailData.message} onChange={e => setEmailData({ ...emailData, message: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2.5 text-xs focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEmailModal(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                <button type="button" onClick={sendEmailPO} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition-colors">Send Email</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media print style overrides */}
      <style>{`
        @page po-print-page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body * { visibility: hidden !important; }
          #${PO_PRINT_AREA_ID}, #${PO_PRINT_AREA_ID} * { visibility: visible !important; }
          #${PO_PRINT_AREA_ID} {
            page: po-print-page;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            min-height: 297mm !important;
            max-height: none !important;
            overflow: visible !important;
            z-index: 99999 !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};
