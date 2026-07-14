import React from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, X } from 'lucide-react';
import type { PoCompanyBrand } from '../components/purchaseOrderPrintData';

interface PoBrandPickerDialogProps {
  title: string;
  onPick: (brand: PoCompanyBrand | null) => void;
}

const PoBrandPickerDialog: React.FC<PoBrandPickerDialogProps> = ({ title, onPick }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    onClick={() => onPick(null)}
  >
    <div
      className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{title}</h3>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
          Select which purchase order format you would like to download:
        </p>
        <button
          type="button"
          onClick={() => onPick('jagdamba')}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-[#03134A]/20 bg-white dark:bg-slate-800 hover:border-[#03134A] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#03134A] text-white shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-[#03134A] dark:text-blue-200">Jagdamba Profile</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Standard Jagdamba Profile PO format</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onPick('shree')}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-orange-200 dark:border-orange-900/40 bg-white dark:bg-slate-800 hover:border-[#d17524] hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d17524] text-white shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-[#064b63] dark:text-orange-200">Shree Jagdamba Steel Profile</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Shree Jagdamba Steel Profiles PO format</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="w-full py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export function promptPoBrandChoice(
  title = 'Download Purchase Order',
): Promise<PoCompanyBrand | null> {
  return new Promise((resolve) => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    const finish = (brand: PoCompanyBrand | null) => {
      root.unmount();
      document.body.removeChild(host);
      resolve(brand);
    };

    root.render(<PoBrandPickerDialog title={title} onPick={finish} />);
  });
}
