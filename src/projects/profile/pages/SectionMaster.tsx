import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MasterForm } from '../components/MasterForm';
import { MasterSavedList } from '../components/MasterSavedList';
import { useAppContext, type SectionMasterRecord, type SectionWeightMode } from '../store/AppContext';
import { SECTION_CATEGORIES } from '../utils/sectionMasterSeed';
import { weightModeLabel } from '../utils/sectionWeight';
import { nextMasterCode } from '../utils/masterHelpers';
import toast from 'react-hot-toast';

type SectionForm = {
  id: string;
  code: string;
  category: string;
  size: string;
  kgPerMeter: string;
  weightMode: SectionWeightMode;
  status: string;
};

const blank = (code: string): SectionForm => ({
  id: '',
  code,
  category: SECTION_CATEGORIES[0],
  size: '',
  kgPerMeter: '',
  weightMode: 'per_meter',
  status: 'Active',
});

export const SectionMaster: React.FC = () => {
  const location = useLocation();
  const { sections, addSection, updateSection, deleteSection } = useAppContext();
  const nextCode = useMemo(() => nextMasterCode('SEC-', sections, 3), [sections]);
  const [f, setF] = useState<SectionForm>(() => blank(nextCode));
  const set = (k: keyof SectionForm) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const isFormulaMode = f.weightMode === 'pipe' || f.weightMode === 'plate';

  const setCategory = (category: string) => {
    if (category === 'Pipe') {
      setF(p => ({ ...p, category, weightMode: 'pipe', kgPerMeter: '', size: p.size || 'OD × Thickness × Length' }));
      return;
    }
    if (category === 'Plate / Sheet') {
      setF(p => ({ ...p, category, weightMode: 'plate', kgPerMeter: '', size: p.size || 'Thickness × Width × Length' }));
      return;
    }
    setF(p => ({
      ...p,
      category,
      weightMode: 'per_meter',
    }));
  };

  const handleNew = () => {
    setF(blank(nextMasterCode('SEC-', sections, 3)));
    toast('New section form');
  };

  const load = (section: SectionMasterRecord) => {
    setF({
      id: section.id,
      code: section.code,
      category: section.category,
      size: section.size,
      kgPerMeter: section.kgPerMeter,
      weightMode: section.weightMode,
      status: section.status,
    });
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = sections.find(s => s.id === masterId);
    if (found) load(found);
  }, [location.state, sections]);

  const handleSave = async () => {
    if (!f.category.trim() || !f.size.trim()) {
      toast.error('Category and Size are required');
      return;
    }
    if (!isFormulaMode && !f.kgPerMeter.trim()) {
      toast.error('Kg/Mtr is required for standard sections');
      return;
    }
    const payload = {
      code: f.code,
      category: f.category.trim(),
      size: f.size.trim(),
      kgPerMeter: isFormulaMode ? '' : f.kgPerMeter.trim(),
      weightMode: f.weightMode,
      status: f.status,
    };
    try {
      if (f.id) {
        await updateSection({ id: f.id, ...payload });
        toast.success('Section updated');
      } else {
        const created = await addSection(payload);
        setF(prev => ({ ...prev, id: created.id }));
        toast.success('Section saved');
      }
    } catch {
      toast.error('Section saved locally but server sync failed — try Save again');
    }
  };

  const handleDelete = async () => {
    if (!f.id) {
      toast.error('Load a section from Master Saved Data first');
      return;
    }
    if (!confirm(`Delete section "${f.category} ${f.size}"?`)) return;
    try {
      await deleteSection(f.id);
      handleNew();
      toast.success('Section deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  return (
    <MasterForm
      detailsTitle="Section Master (Standard Kg/Meter)"
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
      fields={[
        { label: 'Section Code', value: f.code, readOnly: true },
        { label: 'Category', value: f.category, onChange: setCategory, type: 'select', required: true, options: [...SECTION_CATEGORIES] },
        { label: 'Size / Dimension', value: f.size, onChange: set('size'), required: true, placeholder: 'e.g. 50×50×5 or 10 mm' },
        {
          label: 'Weight Mode',
          value: weightModeLabel(f.weightMode),
          readOnly: true,
        },
        {
          label: 'Kg/Mtr',
          value: isFormulaMode ? 'Auto (Formula)' : f.kgPerMeter,
          onChange: set('kgPerMeter'),
          type: 'number',
          readOnly: isFormulaMode,
          placeholder: '0.000',
        },
        { label: 'Status', value: f.status, onChange: set('status'), type: 'select', options: ['Active', 'Inactive'] },
      ]}
      listPanel={
        <MasterSavedList
          title="Saved Sections"
          rows={sections}
          getId={r => r.id}
          selectedId={f.id}
          onSelect={load}
          searchAccessor={r => `${r.code} ${r.category} ${r.size} ${r.kgPerMeter}`}
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Category', render: r => r.category },
            { header: 'Size', render: r => r.size },
            { header: 'Kg/Mtr', render: r => r.weightMode === 'per_meter' ? r.kgPerMeter : 'Formula' },
            { header: 'Weight Mode', render: r => r.weightMode === 'per_meter' ? 'Standard' : r.weightMode === 'pipe' ? 'Pipe' : 'Plate' },
            { header: 'Status', render: r => r.status },
          ]}
        />
      }
    />
  );
};
