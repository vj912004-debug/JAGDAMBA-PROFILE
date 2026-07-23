import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MasterForm } from '../components/MasterForm';
import { MasterSavedList } from '../components/MasterSavedList';
import { useAppContext, MATERIAL_GRADES, type ItemMasterRecord } from '../store/AppContext';
import { ITEM_MASTER_TYPES } from '../utils/itemMasterSeed';
import { nextMasterCode } from '../utils/masterHelpers';
import toast from 'react-hot-toast';

const blank = (code: string) => ({
  id: '',
  code,
  name: '',
  type: 'Plate',
  grade: MATERIAL_GRADES[0],
  unit: 'Kg',
  hsn: '',
});

export const ItemMaster: React.FC = () => {
  const location = useLocation();
  const { items, grades, addItem, updateItem, deleteItem } = useAppContext();
  const gradeOptions = useMemo(() => {
    const fromMaster = grades.filter(g => g.status === 'Active').map(g => g.name);
    return fromMaster.length ? fromMaster : MATERIAL_GRADES;
  }, [grades]);
  const nextCode = useMemo(() => nextMasterCode('ITM-', items, 4), [items]);
  const [f, setF] = useState(() => blank(nextCode));
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const handleNew = () => {
    setF(blank(nextMasterCode('ITM-', items, 4)));
    toast('New item form');
  };

  const load = (item: ItemMasterRecord) => {
    setF({
      id: item.id,
      code: item.code,
      name: item.name,
      type: item.type,
      grade: item.grade,
      unit: item.unit,
      hsn: item.hsn,
    });
  };

  useEffect(() => {
    const masterId = (location.state as { masterId?: string } | null)?.masterId;
    if (!masterId) return;
    const found = items.find(i => i.id === masterId);
    if (found) load(found);
  }, [location.state, items]);

  const handleSave = async () => {
    if (!f.name.trim()) {
      toast.error('Item Name is required');
      return;
    }
    const payload = {
      code: f.code,
      name: f.name.trim().toUpperCase(),
      type: f.type,
      grade: f.grade,
      unit: f.unit,
      hsn: f.hsn.trim(),
    };
    try {
      if (f.id) {
        await updateItem({ id: f.id, ...payload });
        toast.success('Item updated');
      } else {
        const created = await addItem(payload);
        setF(prev => ({ ...prev, id: created.id }));
        toast.success('Item saved');
      }
    } catch {
      toast.error('Item saved locally but server sync failed — try Save again');
    }
  };

  const handleDelete = async () => {
    if (!f.id) {
      toast.error('Load an item from Master Saved Data first');
      return;
    }
    if (!confirm(`Delete item "${f.name}"?`)) return;
    try {
      await deleteItem(f.id);
      handleNew();
      toast.success('Item deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  };

  return (
    <MasterForm
      detailsTitle="Item Master Details"
      onSave={handleSave}
      onDelete={handleDelete}
      onNew={handleNew}
      fields={[
        { label: 'Item Code', value: f.code, readOnly: true },
        { label: 'Item Name', value: f.name, onChange: set('name'), required: true },
        { label: 'Item Type', value: f.type, onChange: set('type'), type: 'select', required: true, options: [...ITEM_MASTER_TYPES] },
        { label: 'Grade', value: f.grade, onChange: set('grade'), type: 'select', options: gradeOptions },
        { label: 'Unit', value: f.unit, onChange: set('unit'), type: 'select', required: true, options: ['Kg', 'Nos', 'Mtr', 'Sq.Ft'] },
        { label: 'HSN Code', value: f.hsn, onChange: set('hsn') },
      ]}
      listPanel={
        <MasterSavedList
          title="Saved Items"
          rows={items}
          getId={r => r.id}
          selectedId={f.id}
          onSelect={load}
          searchAccessor={r => `${r.code} ${r.name} ${r.type} ${r.grade}`}
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Item Name', render: r => r.name },
            { header: 'Type', render: r => r.type },
            { header: 'Grade', render: r => r.grade },
            { header: 'Unit', render: r => r.unit },
            { header: 'HSN', render: r => r.hsn || '—' },
          ]}
        />
      }
    />
  );
};
