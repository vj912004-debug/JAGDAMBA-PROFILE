import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MasterForm } from '../components/MasterForm';
import { MasterSavedList } from '../components/MasterSavedList';
import { useAppContext, type GradeMasterRecord } from '../store/AppContext';
import { nextMasterCode } from '../utils/masterHelpers';
import toast from 'react-hot-toast';

const blank = (code: string) => ({
  id: '',
  code,
  name: '',
  density: '7850',
  standard: 'IS',
  description: '',
  status: 'Active',
});

export const GradeMaster: React.FC = () => {
  const location = useLocation();
  const { grades, addGrade, updateGrade, deleteGrade } = useAppContext();
  const nextCode = useMemo(() => nextMasterCode('GR-', grades, 2), [grades]);
  const [f, setF] = useState(() => blank(nextCode));
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const handleNew = () => {
    setF(blank(nextMasterCode('GR-', grades, 2)));
    toast('New grade form');
  };

  const load = (g: GradeMasterRecord) => {
    setF({
      id: g.id,
      code: g.code,
      name: g.name,
      density: g.density,
      standard: g.standard,
      description: g.description,
      status: g.status,
    });
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = grades.find(g => g.id === masterId);
    if (found) load(found);
  }, [location.state, grades]);

  const handleSave = async () => {
    if (!f.name.trim()) {
      toast.error('Grade Name is required');
      return;
    }
    const payload = {
      code: f.code,
      name: f.name.trim().toUpperCase(),
      density: f.density,
      standard: f.standard,
      description: f.description.trim(),
      status: f.status,
    };
    try {
      if (f.id) {
        await updateGrade({ id: f.id, ...payload });
        toast.success('Grade updated');
      } else {
        const created = await addGrade(payload);
        setF(prev => ({ ...prev, id: created.id }));
        toast.success('Grade saved');
      }
    } catch {
      toast.error('Grade saved locally but server sync failed — try Save again');
    }
  };

  const handleDelete = async () => {
    if (!f.id) {
      toast.error('Load a grade from Master Saved Data first');
      return;
    }
    if (!confirm(`Delete grade "${f.name}"?`)) return;
    try {
      await deleteGrade(f.id);
      handleNew();
      toast.success('Grade deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  return (
    <MasterForm
      detailsTitle="Grade Master Details"
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
      fields={[
        { label: 'Grade Code', value: f.code, readOnly: true },
        { label: 'Grade Name', value: f.name, onChange: set('name'), required: true },
        { label: 'Density (kg/m3)', value: f.density, onChange: set('density'), type: 'number' },
        { label: 'Standard', value: f.standard, onChange: set('standard'), type: 'select', options: ['IS', 'ASTM', 'EN', 'SA', 'DIN', 'JIS'] },
        { label: 'Description', value: f.description, onChange: set('description'), type: 'textarea' },
        { label: 'Status', value: f.status, onChange: set('status'), type: 'select', options: ['Active', 'Inactive'] },
      ]}
      listPanel={
        <MasterSavedList
          title="Saved Grades"
          rows={grades}
          getId={r => r.id}
          selectedId={f.id}
          onSelect={load}
          searchAccessor={r => `${r.code} ${r.name} ${r.standard}`}
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Grade Name', render: r => r.name },
            { header: 'Standard', render: r => r.standard },
            { header: 'Density', render: r => r.density },
            { header: 'Status', render: r => r.status },
            { header: 'Description', render: r => r.description || '—' },
          ]}
        />
      }
    />
  );
};
