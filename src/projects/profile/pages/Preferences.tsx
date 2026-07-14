import React, { useState, useEffect, useRef } from 'react';

import { MasterForm } from '../components/MasterForm';

import { useAppContext, DEFAULT_ERP_PREFERENCES } from '../store/AppContext';

import toast from 'react-hot-toast';



export const Preferences: React.FC = () => {

  const { preferences, setPreferences, persistErpNow } = useAppContext();

  const [f, setF] = useState(preferences || DEFAULT_ERP_PREFERENCES);

  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);



  useEffect(() => {

    setF(preferences || DEFAULT_ERP_PREFERENCES);

  }, [preferences]);



  const handleSave = async () => {

    setPreferences(f);

    try {

      await persistErpNow({ preferences: f });

      toast.success('Preferences saved');

    } catch {

      toast.error('Saved locally but server sync failed — retry Save');

    }

  };

  // ── Backup: Export ──────────────────────────────────────────────
  const handleExport = () => {
    try {
      const raw = localStorage.getItem('jagdamba_erp_data');
      if (!raw) { toast.error('No local data found to export'); return; }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jagdamba_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  // ── Backup: Import ──────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid backup file');
      // Write directly to localStorage then persist to server
      localStorage.setItem('jagdamba_erp_data', text);
      await persistErpNow(parsed);
      toast.success('Backup restored! Reloading…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Import failed: ${msg}`);
    } finally {
      setImporting(false);
      if (importRef.current) importRef.current.value = '';
    }
  };



  return (
    <div className="space-y-6">
      <MasterForm

        detailsTitle="Preferences Details"

        onSave={() => void handleSave()}

        fields={[

          { label: 'Financial Year', value: f.fy, onChange: set('fy'), type: 'select', options: ['2024-2025', '2025-2026', '2026-2027', '2027-2028'] },

          { label: 'Currency', value: f.currency, onChange: set('currency'), type: 'select', options: ['INR - Indian Rupee', 'USD - US Dollar', 'EUR - Euro'] },

          { label: 'Default GST %', value: f.gst, onChange: set('gst'), type: 'select', options: ['0%', '5%', '12%', '18%', '28%'] },

          { label: 'Date Format', value: f.dateFmt, onChange: set('dateFmt'), type: 'select', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },

          { label: 'Decimal Places', value: f.decimals, onChange: set('decimals'), type: 'select', options: ['0', '1', '2', '3'] },

          { label: 'Invoice Prefix', value: f.prefix, onChange: set('prefix') },

        ]}

      />

      {/* ── Database Backup & Restore ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-800">Database Backup &amp; Restore</h3>
          <p className="text-sm text-slate-500 mt-1">
            Export your full ERP data as a JSON file, or import a backup to restore lost data.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Export */}
          <button
            id="export-backup-btn"
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup
          </button>

          {/* Import */}
          <label
            id="import-backup-label"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shadow transition-colors cursor-pointer ${
              importing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {importing ? 'Importing…' : 'Import Backup'}
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              disabled={importing}
              onChange={handleImportFile}
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Importing a backup will <strong>overwrite all current data</strong> and reload the page. Make sure you are importing the correct file.
        </p>
      </div>
    </div>
  );

};


