import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MasterForm } from '../components/MasterForm';
import { useAppContext, type WorkerMasterRecord } from '../store/AppContext';
import { nextMasterCode } from '../utils/masterHelpers';
import toast from 'react-hot-toast';

const blank = (code: string) => ({
  id: '',
  code,
  name: '',
  mobile: '',
  skill: 'CNC',
  rate: '',
  status: 'Active',
});

export const WorkerMaster: React.FC = () => {
  const location = useLocation();
  const { workers, addWorker, updateWorker, deleteWorker } = useAppContext();
  const nextCode = useMemo(() => nextMasterCode('WK-', workers, 3), [workers]);
  const [f, setF] = useState(() => blank(nextCode));
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const handleNew = () => {
    setF(blank(nextMasterCode('WK-', workers, 3)));
    toast('New worker form');
  };

  const load = (w: WorkerMasterRecord) => {
    setF({
      id: w.id,
      code: w.code,
      name: w.name,
      mobile: w.mobile,
      skill: w.skill,
      rate: w.rate,
      status: w.status,
    });
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = workers.find(w => w.id === masterId);
    if (found) load(found);
  }, [location.state, workers]);

  const handleSave = async () => {
    if (!f.name.trim() || !f.mobile.trim()) {
      toast.error('Karigar Name & Mobile are required');
      return;
    }
    const payload = {
      code: f.code,
      name: f.name.trim().toUpperCase(),
      mobile: f.mobile.trim(),
      skill: f.skill,
      rate: f.rate,
      status: f.status,
    };
    try {
      if (f.id) {
        await updateWorker({ id: f.id, ...payload });
        toast.success('Worker updated');
      } else {
        const created = await addWorker(payload);
        setF(prev => ({ ...prev, id: created.id }));
        toast.success('Worker saved');
      }
    } catch {
      toast.error('Worker saved locally but server sync failed — try Save again');
    }
  };

  const handleDelete = async () => {
    if (!f.id) {
      toast.error('Load a worker from Master Saved Data first');
      return;
    }
    if (!confirm(`Delete worker "${f.name}"?`)) return;
    try {
      await deleteWorker(f.id);
      handleNew();
      toast.success('Worker deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  return (
    <MasterForm
      detailsTitle="Worker Master Details"
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
      fields={[
        { label: 'Worker Code', value: f.code, readOnly: true },
        { label: 'Karigar Name', value: f.name, onChange: set('name'), required: true },
        { label: 'Mobile No', value: f.mobile, onChange: set('mobile'), required: true },
        { label: 'Skill', value: f.skill, onChange: set('skill'), type: 'select', options: ['CNC', 'Cutting', 'Welding', 'Grinding', 'Helper'] },
        { label: 'Daily Rate (Nos)', value: f.rate, onChange: set('rate'), type: 'number' },
        { label: 'Status', value: f.status, onChange: set('status'), type: 'select', options: ['Active', 'Inactive'] },
      ]}
    />
  );
};
