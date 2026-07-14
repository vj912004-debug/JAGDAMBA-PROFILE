import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useAppContext, type CNCQuotationRecord } from '../store/AppContext';
import { ErpPageHeader, ErpNumberedSection } from '../components/ErpPageShell';
import { NumericInput, parseNum } from '../components/NumericInput';
import { upper } from '../utils/textCase';
import { getCNCInquiryNo, getCNCOrderQty, fmtCNCDate, cncInr } from '../utils/cncQuotationHelpers';
import toast from 'react-hot-toast';

const labelRow = (label: string, value: React.ReactNode) => (
  <div className="grid grid-cols-[140px_12px_1fr] gap-1 items-center text-sm py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="font-bold text-slate-600 dark:text-slate-400">{label}</span>
    <span className="text-slate-400">:</span>
    <span className="font-semibold text-brand-navy dark:text-slate-100">{value}</span>
  </div>
);

export const ConvertCNCQuotationToOrder: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { cncQuotations, updateCNCQuotation, persistErpNow } = useAppContext();

  const quotation = useMemo(() => cncQuotations.find(q => q.id === id) ?? null, [cncQuotations, id]);

  const [poNo, setPoNo] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderQty, setOrderQty] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remark, setRemark] = useState('Order received.');

  useEffect(() => {
    if (!quotation) return;
    setPoNo(quotation.poNo || '');
    setPoDate(quotation.poDate?.slice(0, 10) || new Date().toISOString().split('T')[0]);
    setOrderQty(String((quotation.orderQty ?? getCNCOrderQty(quotation)) || ''));
    setDeliveryDate(quotation.deliveryDate?.slice(0, 10) || '');
    setRemark(quotation.orderRemark || 'Order received.');
  }, [quotation]);

  const handleSave = async () => {
    if (!quotation) return;
    if (!poNo.trim()) { toast.error('Enter PO No.'); return; }
    if (!poDate) { toast.error('Enter PO Date'); return; }
    const qty = parseNum(orderQty);
    if (qty <= 0) { toast.error('Enter Order Qty / Nos'); return; }

    const updated: CNCQuotationRecord = {
      ...quotation,
      status: 'Order Received',
      poNo: poNo.trim(),
      poDate,
      orderQty: qty,
      deliveryDate: deliveryDate || undefined,
      orderRemark: remark.trim(),
    };

    updateCNCQuotation(updated);
    try {
      await persistErpNow({
        cncQuotations: cncQuotations.map(q => q.id === updated.id ? updated : q),
      });
      toast.success('Order saved successfully');
      navigate('/pending-cnc-quotation');
    } catch {
      toast.error('Saved locally — server sync failed');
      navigate('/pending-cnc-quotation');
    }
  };

  if (!id || !quotation) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center space-y-4">
        <p className="text-slate-500">Quotation not found.</p>
        <button type="button" onClick={() => navigate('/pending-cnc-quotation')} className="erp-btn erp-btn-navy">Back to Pending List</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-4 fade-in pb-8">
      <ErpPageHeader title="Convert Quotation to Order" />

      <ErpNumberedSection number={1} title="QUOTATION DETAILS">
        <div className="max-w-xl">
          {labelRow('Inquiry No', getCNCInquiryNo(quotation))}
          {labelRow('Party Name', quotation.partyName)}
          {labelRow('Inquiry Date', fmtCNCDate(quotation.date))}
          {labelRow('Amount (₹)', cncInr(quotation.grandTotal))}
        </div>
      </ErpNumberedSection>

      <ErpNumberedSection number={2} title="ORDER DETAILS" headClass="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <div>
            <label className="tc-mgmt-label">PO No *</label>
            <input value={poNo} onChange={e => setPoNo(upper(e.target.value))} className="tc-mgmt-input" placeholder="PO/26-27/045" />
          </div>
          <div>
            <label className="tc-mgmt-label">PO Date *</label>
            <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className="tc-mgmt-input" />
          </div>
          <div>
            <label className="tc-mgmt-label">Order Qty / Nos *</label>
            <NumericInput value={orderQty} onChange={setOrderQty} className="tc-mgmt-input" placeholder="110" />
          </div>
          <div>
            <label className="tc-mgmt-label">Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="tc-mgmt-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="tc-mgmt-label">Remark</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3} className="tc-mgmt-input resize-y" />
          </div>
        </div>
      </ErpNumberedSection>

      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={handleSave} className="erp-btn erp-btn-green min-w-[160px] justify-center"><Save className="w-4 h-4" /> Save Order</button>
        <button type="button" onClick={() => navigate('/pending-cnc-quotation')} className="erp-btn erp-btn-ghost min-w-[140px] justify-center bg-slate-800 text-white border-slate-800 hover:bg-slate-700"><X className="w-4 h-4" /> Cancel</button>
      </div>
    </div>
  );
};
