import React, { useState } from 'react';
import { Box, Download, Mail, MessageSquare, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PurchaseOrder } from '../store/AppContext';
import { PurchaseOrderPrint, PO_PRINT_WIDTH_PX } from './PurchaseOrderPrint';
import { downloadPurchaseOrderPDF, getPurchaseOrderPdfBase64 } from '../utils/pdfGenerator';
import { openEmailPO } from '../utils/purchaseOrderSend';
import { openPurchaseOrderPrintWindow } from '../utils/purchaseOrderPrintWindow';
import { sendWhatsAppMedia, buildWhatsAppPOMessage } from '../utils/whatsappApi';
import { poFileName } from '../utils/poNumber';

interface PurchaseOrderPreviewModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onEdit?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderPreviewModal: React.FC<PurchaseOrderPreviewModalProps> = ({ po, onClose, onEdit }) => {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState({ number: '', message: '' });
  const [poPdfForSend, setPoPdfForSend] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  const openWhatsApp = async () => {
    setWhatsAppData({
      number: po.supplierMobile?.trim() || '',
      message: buildWhatsAppPOMessage(po.supplierName, po.poNumber),
    });
    const pdf = await getPurchaseOrderPdfBase64(po);
    setPoPdfForSend(pdf || null);
    if (!pdf) toast.error('Failed to generate PO PDF');
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppPO = async () => {
    if (!whatsAppData.number.trim()) {
      toast.error('WhatsApp number is required');
      return;
    }
    const pdf = poPdfForSend || (await getPurchaseOrderPdfBase64(po));
    if (!pdf) {
      toast.error('PO PDF not ready — try again');
      return;
    }
    setIsSendingWhatsApp(true);
    const loadingToast = toast.loading('Sending WhatsApp...');
    try {
      await sendWhatsAppMedia({
        number: whatsAppData.number,
        mediaData: pdf,
        fileName: poFileName(po.poNumber),
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

  const printPo = () => {
    if (!openPurchaseOrderPrintWindow(`Purchase Order - ${po.poNumber}`)) {
      toast.error('Print area not ready — try again');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-t-3xl">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Box className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Purchase Order Preview — {po.poNumber}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(po)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  <Pencil className="w-4 h-4" /> Edit PO
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await downloadPurchaseOrderPDF(po);
                  if (ok) toast.success('PO PDF downloaded');
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button type="button" onClick={printPo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md">
                Print PO
              </button>
              <button type="button" onClick={() => openEmailPO(po)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md">
                <Mail className="w-4 h-4" /> Email PO
              </button>
              <button type="button" onClick={() => void openWhatsApp()} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md">
                <MessageSquare className="w-4 h-4" /> WhatsApp PO
              </button>
              <button type="button" onClick={() => { setShowWhatsAppModal(false); onClose(); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="grow overflow-auto p-4 sm:p-8 bg-slate-200 dark:bg-slate-700/50">
            <div className="mx-auto shrink-0" style={{ width: PO_PRINT_WIDTH_PX, minWidth: PO_PRINT_WIDTH_PX }}>
              <PurchaseOrderPrint po={po} previewMode />
            </div>
          </div>
        </div>
      </div>

      {showWhatsAppModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-green-600 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" /> WhatsApp PO
                </h3>
                <p className="text-green-100 text-sm mt-1">{po.poNumber}</p>
              </div>
              <button type="button" onClick={() => setShowWhatsAppModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="field-label mb-1">WhatsApp Number *</label>
                <input
                  type="text"
                  value={whatsAppData.number}
                  onChange={(e) => setWhatsAppData({ ...whatsAppData, number: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isSendingWhatsApp) {
                      e.preventDefault();
                      void sendWhatsAppPO();
                    }
                  }}
                  placeholder="e.g. 98XXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-green-500 outline-none no-uppercase"
                />
              </div>
              <div>
                <label className="field-label mb-1">Message Caption</label>
                <textarea
                  rows={4}
                  value={whatsAppData.message}
                  onChange={(e) => setWhatsAppData({ ...whatsAppData, message: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void sendWhatsAppPO()}
                  disabled={isSendingWhatsApp}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSendingWhatsApp ? 'Sending...' : 'Send WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
