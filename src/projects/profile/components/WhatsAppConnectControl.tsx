import React, { useState, useEffect } from 'react';
import { MessageSquare, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from './Sidebar';
import { getWhatsAppApiUrl } from '../utils/whatsappApi';

interface WhatsAppConnectControlProps {
  pollWhenOpen?: boolean;
}

export const WhatsAppConnectControl: React.FC<WhatsAppConnectControlProps> = ({
  pollWhenOpen = true,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [waQr, setWaQr] = useState<string | null>(null);
  const [isWaLoading, setIsWaLoading] = useState(false);
  const [waStuck, setWaStuck] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(getWhatsAppApiUrl('/api/whatsapp/status'));
        const data = await res.json();
        setWaStatus(data.status);
        setWaStuck(Boolean(data.stuck));
        setWaError(data.lastError ?? null);
        if (data.status === 'QR_READY' || data.hasQr) {
          const qrRes = await fetch(getWhatsAppApiUrl('/api/whatsapp/qr'));
          const qrData = await qrRes.json();
          if (qrData.qr) setWaQr(qrData.qr);
        } else {
          setWaQr(null);
        }
      } catch {
        setWaStatus('DISCONNECTED');
        setWaStuck(false);
      }
    };

    fetchStatus();
    const intervalTime = pollWhenOpen && showModal ? 3000 : 10000;
    const interval = setInterval(fetchStatus, intervalTime);
    return () => clearInterval(interval);
  }, [showModal, pollWhenOpen]);

  const handleInit = async () => {
    setIsWaLoading(true);
    try {
      await fetch(getWhatsAppApiUrl('/api/whatsapp/init'), { method: 'POST' });
      toast.success('Initializing WhatsApp... please wait');
    } catch {
      toast.error('Failed to initialize WhatsApp');
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleReset = async () => {
    setIsWaLoading(true);
    try {
      await fetch(getWhatsAppApiUrl('/api/whatsapp/reset'), { method: 'POST' });
      setWaStatus('DISCONNECTED');
      setWaQr(null);
      setWaStuck(false);
      setWaError(null);
      toast.success('Session cleared. Click Connect WhatsApp to try again.');
    } catch {
      toast.error('Failed to reset WhatsApp session');
    } finally {
      setIsWaLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsWaLoading(true);
    try {
      await fetch(getWhatsAppApiUrl('/api/whatsapp/disconnect'), { method: 'POST' });
      toast.success('Disconnected from WhatsApp');
      setWaStatus('DISCONNECTED');
      setWaQr(null);
    } catch {
      toast.error('Failed to disconnect WhatsApp');
    } finally {
      setIsWaLoading(false);
    }
  };

  const statusLabel =
    waStatus === 'CONNECTED'
      ? 'Connected'
      : waStatus === 'QR_READY'
        ? 'Scan QR'
        : waStatus === 'INITIALIZING'
          ? 'Initializing...'
          : 'Disconnected';

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border shrink-0',
          waStatus === 'CONNECTED'
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
            : waStatus === 'QR_READY'
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 animate-pulse'
              : waStatus === 'INITIALIZING'
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 animate-pulse'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50',
        )}
      >
        <MessageSquare className="w-4 h-4" />
        WhatsApp: {statusLabel}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="bg-green-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  WhatsApp Web
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-green-100 text-sm mt-1">Connect WhatsApp to send purchase orders</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</p>
                  <p
                    className={cn(
                      'text-lg font-black mt-0.5',
                      waStatus === 'CONNECTED'
                        ? 'text-green-600 dark:text-green-400'
                        : waStatus === 'QR_READY'
                          ? 'text-amber-500'
                          : waStatus === 'INITIALIZING'
                            ? 'text-blue-500'
                            : 'text-slate-500 dark:text-slate-400',
                    )}
                  >
                    {waStatus}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',
                    waStatus === 'CONNECTED'
                      ? 'bg-green-500'
                      : waStatus === 'QR_READY'
                        ? 'bg-amber-500 animate-pulse'
                        : waStatus === 'INITIALIZING'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-slate-300 dark:bg-slate-700',
                  )}
                />
              </div>

              {waStatus === 'CONNECTED' ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    WhatsApp is ready. You can send POs from this page.
                  </p>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isWaLoading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {isWaLoading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                  </button>
                </div>
              ) : waStatus === 'QR_READY' && waQr ? (
                <div className="text-center space-y-4">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    Scan this QR code with WhatsApp on your phone
                  </p>
                  <div className="inline-block p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <img src={waQr} alt="WhatsApp QR" className="w-44 h-44" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isWaLoading}
                      className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-xs font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Connect WhatsApp to send purchase orders directly from Purchase Reports.
                  </p>
                  {waStatus === 'INITIALIZING' && (
                    <p className="text-xs text-blue-500">
                      Starting WhatsApp Web… this can take up to a minute.
                    </p>
                  )}
                  {waStuck && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Taking too long? The session may be stuck. Reset and try again.
                    </p>
                  )}
                  {waError && (
                    <p className="text-xs text-red-500">{waError}</p>
                  )}
                  <div className="flex gap-3">
                    {(waStuck || waStatus === 'INITIALIZING') && (
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={isWaLoading}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-xs font-bold disabled:opacity-50"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleInit}
                      disabled={isWaLoading || waStatus === 'INITIALIZING'}
                      className={cn(
                        'bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50',
                        waStuck || waStatus === 'INITIALIZING' ? 'flex-1' : 'w-full',
                      )}
                    >
                      {isWaLoading || waStatus === 'INITIALIZING' ? 'Initializing...' : 'Connect WhatsApp'}
                    </button>
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
