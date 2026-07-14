import React from 'react';
import { Save, Edit2, Trash2, Printer, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { NumericInput } from './NumericInput';
import { ErpEntryPage, ErpEntryToolbar, ErpMockupTitleBar } from './ErpPageShell';

export interface MasterField {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'password';
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}

interface MasterFormProps {
  detailsTitle: string;
  pageTitle?: string;
  pageIcon?: React.ReactNode;
  fields: MasterField[];
  onSave?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onNew?: () => void;
  listPanel?: React.ReactNode;
}

export const MasterForm: React.FC<MasterFormProps> = ({ detailsTitle, pageTitle, pageIcon, fields, onSave, onEdit, onDelete, onPrint, onNew, listPanel }) => {
  const inp = 'tc-mgmt-input';
  const readOnly = 'tc-mgmt-input bg-slate-100 dark:bg-slate-800 text-slate-600 font-mono';

  return (
    <ErpEntryPage>
      {pageTitle && <ErpMockupTitleBar title={pageTitle} icon={pageIcon} />}

      <ErpEntryToolbar
        buttons={[
          { label: 'Save', tone: 'green', icon: <Save className="w-4 h-4" />, hotkey: 'save', onClick: onSave ?? (() => toast.success('Saved')) },
          ...(onNew ? [{ label: 'New', tone: 'blue' as const, icon: <Plus className="w-4 h-4" />, hotkey: 'new' as const, onClick: onNew }] : []),
          { label: 'Edit', tone: 'orange', icon: <Edit2 className="w-4 h-4" />, onClick: onEdit ?? (() => toast('Edit mode')) },
          { label: 'Delete', tone: 'red', icon: <Trash2 className="w-4 h-4" />, onClick: onDelete ?? (() => toast('Deleted')) },
          { label: 'Print', tone: 'purple', icon: <Printer className="w-4 h-4" />, hotkey: 'print', onClick: onPrint ?? (() => window.print()) },
        ]}
      />

      <div className="tc-mgmt-panel">
        <div className="tc-mgmt-panel-head">{detailsTitle}</div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
          {fields.map((f, i) => (
            <div key={i}>
              <label className="tc-mgmt-label">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
              {f.type === 'select' ? (
                <select value={f.value} onChange={e => f.onChange?.(e.target.value)} disabled={f.readOnly} className={f.readOnly ? readOnly : inp}>
                  {(f.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea value={f.value} onChange={e => f.onChange?.(e.target.value)} readOnly={f.readOnly} rows={3} placeholder={f.placeholder} className={f.readOnly ? readOnly : inp} />
              ) : f.type === 'number' ? (
                <NumericInput value={f.value} onChange={v => f.onChange?.(v)} readOnly={f.readOnly} placeholder={f.placeholder} className={f.readOnly ? readOnly : inp} />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={f.value}
                  onChange={e => f.onChange?.(e.target.value)}
                  readOnly={f.readOnly}
                  placeholder={f.placeholder}
                  className={f.readOnly ? readOnly : inp}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {listPanel}
    </ErpEntryPage>
  );
};
