import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PurchaseOrder } from '../store/AppContext';
import { getPurchaseOrderPdfBase64 } from '../utils/pdfGenerator';
import { sendWhatsAppMedia, buildWhatsAppPOMessage } from '../utils/whatsappApi';
import { poFileName } from '../utils/poNumber';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import { ErpHotkeyLabel } from './ErpHotkeyLabel';

interface PoToolbarActionsProps {
  purchaseOrder?: PurchaseOrder | null;
  requireSelection?: boolean;
}

export const PoToolbarActions: React.FC<PoToolbarActionsProps> = ({
  purchaseOrder,
  requireSelection = true,
}) => {
  const [activePo, setActivePo] = useState<PurchaseOrder | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [emailData, setEmailData] = useState({ to: '', subject: '', message: '' });
  const [poPdfForSend, setPoPdfForSend] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const ensurePo = (): PurchaseOrder | null => {
    if (!purchaseOrder) {
      if (requireSelection) toast.error('Select a purchase order first');
      return null;
    }
    return purchaseOrder;
  };

  const preparePo = (po: PurchaseOrder) => {
    setActivePo(po);
    setPoPdfForSend(null);
    setWhatsAppData({
      number: po.supplierMobile?.trim() || '',
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
    setEmailData({
      to: po.supplierEmail?.trim() || '',
      subject: `Purchase Order ${po.poNumber} - Jagdamba Profile`,
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
  };

  const openWhatsApp = () => {
    const po = ensurePo();
    if (!po) return;
    preparePo(po);
    setShowWhatsAppModal(true);
  };

  const openEmail = () => {
    const po = ensurePo();
    if (!po) return;
    preparePo(po);
    setShowEmailModal(true);
  };

  useEffect(() => {
    if (!showWhatsAppModal && !showEmailModal) return;
    if (!activePo) return;
    void getPurchaseOrderPdfBase64(activePo).then(pdf => {
      if (pdf) setPoPdfForSend(pdf);
    });
  }, [showWhatsAppModal, showEmailModal, activePo]);

  const sendWhatsAppPO = async () => {
    if (!activePo) return;
    if (!whatsAppData.number.trim()) {
      toast.error('WhatsApp number is required');
      return;
    }
    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(activePo));
    if (!pdf) {
      toast.error('Failed to generate PO PDF');
      return;
    }

    setIsSendingWhatsApp(true);
    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: whatsAppData.number,
        mediaData: pdf,
        fileName: poFileName(activePo.poNumber),
        caption: whatsAppData.message,
      });
      toast.success('PO sent on WhatsApp!', { id: loadingToast });
      setShowWhatsAppModal(false);
    } catch (err: unknown) {
      toast.error(`WhatsApp Error: ${(err as Error).message}`, { id: loadingToast });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const sendEmailPO = async () => {
    if (!activePo) return;
    if (!emailData.to.trim()) {
      toast.error('Recipient email is required');
      return;
    }
    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(activePo));
    if (!pdf) {
      toast.error('Failed to generate PO PDF');
      return;
    }

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
          fileName: poFileName(activePo.poNumber),
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('PO email sent!', { id: loadingToast });
        setShowEmailModal(false);
      } else {
        throw new Error(result.message);
      }
    } catch (err: unknown) {
      toast.error(`Email failed: ${(err as Error).message}`, { id: loadingToast });
    }
  };

  const handleWhatsAppEnter = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || isSendingWhatsApp) return;
    e.preventDefault();
    void sendWhatsAppPO();
  };

  return (
    <>
      <button type="button" {...erpHotkeyProps('whatsapp')} onClick={openWhatsApp} className="erp-btn erp-btn-green">
        <MessageSquare className="w-4 h-4" /> WhatsApp PO <ErpHotkeyLabel action="whatsapp" />
      </button>
      <button type="button" onClick={openEmail} className="erp-btn erp-btn-teal">
        <Mail className="w-4 h-4" /> Email PO
      </button>

      {showWhatsAppModal && activePo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-green-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2"><MessageSquare className="w-5 h-5" /> WhatsApp PO</h3>
              <button type="button" onClick={() => setShowWhatsAppModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="tc-mgmt-label">WhatsApp Number</label>
                <input
                  value={whatsAppData.number}
                  onChange={e => setWhatsAppData({ ...whatsAppData, number: e.target.value })}
                  onKeyDown={handleWhatsAppEnter}
                  className="tc-mgmt-input no-uppercase"
                  placeholder="91XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="tc-mgmt-label">Message</label>
                <textarea
                  rows={3}
                  value={whatsAppData.message}
                  onChange={e => setWhatsAppData({ ...whatsAppData, message: e.target.value })}
                  onKeyDown={handleWhatsAppEnter}
                  className="tc-mgmt-input"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="erp-btn erp-btn-ghost flex-1">Cancel</button>
                <button type="button" onClick={() => void sendWhatsAppPO()} disabled={isSendingWhatsApp} className="erp-btn erp-btn-green flex-1">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && activePo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-teal-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2"><Mail className="w-5 h-5" /> Email PO</h3>
              <button type="button" onClick={() => setShowEmailModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="tc-mgmt-label">Email To</label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={e => setEmailData({ ...emailData, to: e.target.value })}
                  className="tc-mgmt-input no-uppercase"
                />
              </div>
              <div>
                <label className="tc-mgmt-label">Subject</label>
                <input value={emailData.subject} onChange={e => setEmailData({ ...emailData, subject: e.target.value })} className="tc-mgmt-input" />
              </div>
              <div>
                <label className="tc-mgmt-label">Message</label>
                <textarea rows={3} value={emailData.message} onChange={e => setEmailData({ ...emailData, message: e.target.value })} className="tc-mgmt-input" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEmailModal(false)} className="erp-btn erp-btn-ghost flex-1">Cancel</button>
                <button type="button" onClick={() => void sendEmailPO()} className="erp-btn erp-btn-teal flex-1">Send Email</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
