import React from 'react';
import {
  Save, Edit, Trash2, Printer, FileDown, Search, MessageSquare, RotateCcw, Phone, Plus,
} from 'lucide-react';
import { ErpHotkeyLabel } from './ErpHotkeyLabel';
import { erpHotkeyProps } from '../utils/erpHotkeys';
import type { JobWorkLabour } from '../utils/jobWorkHelpers';
import { labourAmount, fmtAmt } from '../utils/jobWorkHelpers';
import { NumericInput, parseNum } from './NumericInput';

export const JobWorkTitleBar: React.FC<{ title: string }> = ({ title }) => (
  <div className="jw-title-bar">{title}</div>
);

export const JobWorkSection: React.FC<{
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon: Icon, title, children, className = '' }) => (
  <div className={`jw-panel ${className}`}>
    <div className="jw-panel-head">
      <Icon className="w-4 h-4 shrink-0" />
      <span>{title}</span>
    </div>
    <div className="jw-panel-body">{children}</div>
  </div>
);

export const jwInput = 'jw-input';
export const jwLabel = 'jw-label';
export const req = <span className="text-red-500">*</span>;

export const LabourDetailsGrid: React.FC<{
  labour: JobWorkLabour;
  onChange: (field: keyof JobWorkLabour, value: number) => void;
}> = ({ labour, onChange }) => {
  const total = labourAmount(labour);
  const mtrAmt = parseNum(labour.mtrQty) * parseNum(labour.mtrRate);
  const pierceAmt = parseNum(labour.pcsQty) * parseNum(labour.piercingRate);

  return (
    <div className="overflow-x-auto">
      <table className="jw-table w-full">
        <thead>
          <tr>
            <th>Labour Type</th>
            <th>Mtr / Pcs</th>
            <th>Rate (₹)</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-semibold">Labour Mtr.</td>
            <td>
              <div className="flex items-center gap-1">
                <NumericInput value={labour.mtrQty} onChange={v => onChange('mtrQty', v)} className={`${jwInput} w-20 text-right`} />
                <span className="text-xs text-slate-500">Mtr</span>
              </div>
            </td>
            <td><NumericInput value={labour.mtrRate} onChange={v => onChange('mtrRate', v)} className={`${jwInput} text-right`} /></td>
            <td className="text-right font-bold">{fmtAmt(mtrAmt)}</td>
          </tr>
          <tr>
            <td className="font-semibold">Labour Piercing</td>
            <td>
              <div className="flex items-center gap-1">
                <NumericInput value={labour.pcsQty} onChange={v => onChange('pcsQty', v)} className={`${jwInput} w-20 text-right`} />
                <span className="text-xs text-slate-500">Pcs</span>
              </div>
            </td>
            <td><NumericInput value={labour.piercingRate} onChange={v => onChange('piercingRate', v)} className={`${jwInput} text-right`} /></td>
            <td className="text-right font-bold">{fmtAmt(pierceAmt)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="text-right font-extrabold uppercase text-xs">Total Labour (₹)</td>
            <td className="text-right font-black text-brand-blue">{fmtAmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export const JobWorkFooter: React.FC<{
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onPdf?: () => void;
  onSearch: () => void;
  onWhatsApp: () => void;
  onClear: () => void;
}> = ({ onSave, onEdit, onDelete, onPrint, onPdf, onSearch, onWhatsApp, onClear }) => (
  <div className="jw-footer-actions">
    <button type="button" {...erpHotkeyProps('save')} onClick={onSave} className="jw-foot-btn jw-foot-save">
      <Save className="w-4 h-4" /> Save <ErpHotkeyLabel action="save" />
    </button>
    <button type="button" onClick={onEdit} className="jw-foot-btn jw-foot-edit">
      <Edit className="w-4 h-4" /> Edit <span className="erp-hotkey-label">(F6)</span>
    </button>
    <button type="button" onClick={onDelete} className="jw-foot-btn jw-foot-delete">
      <Trash2 className="w-4 h-4" /> Delete <span className="erp-hotkey-label">(F7)</span>
    </button>
    <button type="button" {...erpHotkeyProps('print')} onClick={onPrint} className="jw-foot-btn jw-foot-print">
      <Printer className="w-4 h-4" /> Print <ErpHotkeyLabel action="print" />
    </button>
    {onPdf && (
      <button type="button" {...erpHotkeyProps('pdf')} onClick={onPdf} className="jw-foot-btn jw-foot-pdf">
        <FileDown className="w-4 h-4" /> PDF <ErpHotkeyLabel action="pdf" />
      </button>
    )}
    <button type="button" onClick={onSearch} className="jw-foot-btn jw-foot-search">
      <Search className="w-4 h-4" /> Search <span className="erp-hotkey-label">(F9)</span>
    </button>
    <button type="button" onClick={onWhatsApp} className="jw-foot-btn jw-foot-wa">
      <MessageSquare className="w-4 h-4" /> WhatsApp / PDF
    </button>
    <button type="button" onClick={onClear} className="jw-foot-btn jw-foot-clear">
      <RotateCcw className="w-4 h-4" /> Clear <span className="erp-hotkey-label">(F12)</span>
    </button>
  </div>
);

export const MobileField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="relative">
    <input
      type="tel"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Enter Mobile No."
      className={jwInput}
    />
    <Phone className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);

export const AddRowBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} className="jw-add-row">
    <Plus className="w-4 h-4" /> Add Row
  </button>
);
