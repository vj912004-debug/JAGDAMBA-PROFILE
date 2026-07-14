import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, ExternalLink, Users, Layers, Package, HardHat, Truck, Ruler } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { MasterSavedList } from '../components/MasterSavedList';
import { ErpPageHeader } from '../components/ErpPageShell';

type Tab = 'parties' | 'grades' | 'items' | 'sections' | 'workers' | 'transport';

const TABS: { id: Tab; label: string; editPath: string; icon: React.ElementType }[] = [
  { id: 'parties', label: 'Parties', editPath: '/party-master', icon: Users },
  { id: 'grades', label: 'Grades', editPath: '/grade-master', icon: Layers },
  { id: 'items', label: 'Items', editPath: '/item-master', icon: Package },
  { id: 'sections', label: 'Sections', editPath: '/section-master', icon: Ruler },
  { id: 'workers', label: 'Workers', editPath: '/worker-master', icon: HardHat },
  { id: 'transport', label: 'Transport', editPath: '/transport-master', icon: Truck },
];

export const MasterDataList: React.FC = () => {
  const navigate = useNavigate();
  const { parties, grades, items, sections, workers, transports } = useAppContext();
  const [tab, setTab] = useState<Tab>('parties');

  const counts = useMemo(() => ({
    parties: parties.length,
    grades: grades.length,
    items: items.length,
    sections: sections.length,
    workers: workers.length,
    transport: transports.length,
  }), [parties.length, grades.length, items.length, sections.length, workers.length, transports.length]);

  const total = counts.parties + counts.grades + counts.items + counts.sections + counts.workers + counts.transport;
  const active = TABS.find(t => t.id === tab)!;

  const openRecord = (path: string, id: string) => {
    navigate(path, { state: { masterId: id } });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 fade-in">
      <ErpPageHeader
        title="Master Saved Data"
        subtitle="View all saved Party, Grade, Item, Section, Worker & Transport records in one place"
        extra={(
          <Link to={active.editPath} className="erp-btn erp-btn-navy inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> Add / Edit {active.label}
          </Link>
        )}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={Database} label="Total Records" value={String(total)} accent="text-brand-blue" />
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`erp-card p-3 text-left transition ring-2 ${
                tab === t.id ? 'ring-brand-blue bg-blue-50/50 dark:bg-blue-950/20' : 'ring-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${tab === t.id ? 'text-brand-blue' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.label}</span>
              </div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-100">{counts[t.id]}</p>
            </button>
          );
        })}
      </div>

      {tab === 'parties' && (
        <MasterSavedList
          title="Saved Parties"
          rows={parties}
          getId={r => r.id}
          onSelect={r => openRecord('/party-master', r.id)}
          searchAccessor={r => `${r.partyCode} ${r.partyName} ${r.mobileNumber} ${r.city} ${r.category}`}
          emptyText="No parties saved yet. Go to Party Master to add records."
          columns={[
            { header: 'Code', render: r => r.partyCode || '—' },
            { header: 'Party Name', render: r => r.partyName },
            { header: 'Contact', render: r => r.contactPerson || '—' },
            { header: 'Mobile', render: r => r.mobileNumber || '—' },
            { header: 'City', render: r => r.city || '—' },
            { header: 'Category', render: r => r.category || '—' },
            { header: 'GST', render: r => r.gstNumber || '—' },
          ]}
        />
      )}

      {tab === 'grades' && (
        <MasterSavedList
          title="Saved Grades"
          rows={grades}
          getId={r => r.id}
          onSelect={r => openRecord('/grade-master', r.id)}
          searchAccessor={r => `${r.code} ${r.name} ${r.standard}`}
          emptyText="No grades saved yet. Go to Grade Master to add records."
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Grade Name', render: r => r.name },
            { header: 'Standard', render: r => r.standard },
            { header: 'Density', render: r => r.density },
            { header: 'Status', render: r => r.status },
            { header: 'Description', render: r => r.description || '—' },
          ]}
        />
      )}

      {tab === 'items' && (
        <MasterSavedList
          title="Saved Items"
          rows={items}
          getId={r => r.id}
          onSelect={r => openRecord('/item-master', r.id)}
          searchAccessor={r => `${r.code} ${r.name} ${r.type} ${r.grade}`}
          emptyText="No items saved yet. Go to Item Master to add records."
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Item Name', render: r => r.name },
            { header: 'Type', render: r => r.type },
            { header: 'Grade', render: r => r.grade },
            { header: 'Unit', render: r => r.unit },
            { header: 'HSN', render: r => r.hsn || '—' },
          ]}
        />
      )}

      {tab === 'sections' && (
        <MasterSavedList
          title="Saved Sections"
          rows={sections}
          getId={r => r.id}
          onSelect={r => openRecord('/section-master', r.id)}
          searchAccessor={r => `${r.code} ${r.category} ${r.size} ${r.kgPerMeter}`}
          emptyText="No sections saved yet. Go to Section Master to add records."
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Category', render: r => r.category },
            { header: 'Size', render: r => r.size },
            { header: 'Kg/Mtr', render: r => r.weightMode === 'per_meter' ? r.kgPerMeter : 'Formula' },
            { header: 'Weight Mode', render: r => r.weightMode === 'per_meter' ? 'Standard' : r.weightMode === 'pipe' ? 'Pipe' : 'Plate' },
            { header: 'Status', render: r => r.status },
          ]}
        />
      )}

      {tab === 'workers' && (
        <MasterSavedList
          title="Saved Workers"
          rows={workers}
          getId={r => r.id}
          onSelect={r => openRecord('/worker-master', r.id)}
          searchAccessor={r => `${r.code} ${r.name} ${r.mobile} ${r.skill}`}
          emptyText="No workers saved yet. Go to Worker Master to add records."
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Name', render: r => r.name },
            { header: 'Mobile', render: r => r.mobile },
            { header: 'Skill', render: r => r.skill },
            { header: 'Rate', render: r => r.rate || '—' },
            { header: 'Status', render: r => r.status },
          ]}
        />
      )}

      {tab === 'transport' && (
        <MasterSavedList
          title="Saved Transport"
          rows={transports}
          getId={r => r.id}
          onSelect={r => openRecord('/transport-master', r.id)}
          searchAccessor={r => `${r.code} ${r.name} ${r.mobile} ${r.city}`}
          emptyText="No transport saved yet. Go to Transport Master to add records."
          columns={[
            { header: 'Code', render: r => r.code },
            { header: 'Name', render: r => r.name },
            { header: 'Contact', render: r => r.contact || '—' },
            { header: 'Mobile', render: r => r.mobile },
            { header: 'City', render: r => r.city || '—' },
            { header: 'GST', render: r => r.gst || '—' },
          ]}
        />
      )}

      <p className="text-center text-xs text-slate-500 pb-2">
        Click any row to open that record in its master form for editing.
      </p>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ElementType; label: string; value: string; accent: string }> = ({ icon: Icon, label, value, accent }) => (
  <div className="erp-card p-3 col-span-2 sm:col-span-1 lg:col-span-1">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${accent}`} />
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    </div>
    <p className={`text-xl font-black ${accent}`}>{value}</p>
  </div>
);
