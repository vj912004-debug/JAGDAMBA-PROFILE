import React, { useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { ListView } from '../components/ListView';

import { useAppContext } from '../store/AppContext';

import toast from 'react-hot-toast';

import { fmtDate, productionReportFromAllocations } from '../utils/erpListHelpers';



export const CuttingAllocationList: React.FC = () => {

  const nav = useNavigate();

  const { cuttingAllocations, setCuttingAllocations, persistErpNow } = useAppContext();



  const rows = useMemo(() => cuttingAllocations.map(a => ({

    id: a.id,

    no: a.entryNo,

    date: fmtDate(a.entryDate),

    order: a.orderNo,

    party: a.partyName,

    items: a.rows.filter(r => r.karigar && r.nos > 0).length,

    nos: a.rows.reduce((s, r) => s + (r.nos || 0), 0),

  })), [cuttingAllocations]);



  return (

    <ListView title="Cutting Allocation List" rows={rows} getId={r => r.id} onNew={() => nav('/cutting-allocation')}

      onDelete={async (row) => {

        if (!window.confirm(`Delete allocation ${row.no}?`)) return;

        const next = cuttingAllocations.filter(a => a.id !== row.id);

        setCuttingAllocations(next);

        try {

          await persistErpNow({ cuttingAllocations: next });

          toast.success('Deleted');

        } catch {

          toast.error('Deleted locally but server sync failed');

        }

      }}

      dateAccessor={r => r.date}

      columns={[

        { header: 'Entry No', render: r => <span className="font-semibold">{r.no}</span> },

        { header: 'Date', render: r => r.date },

        { header: 'Order No', render: r => r.order },

        { header: 'Party', render: r => r.party },

        { header: 'Total Items', render: r => r.items, align: 'center' },

        { header: 'Total Nos', render: r => r.nos, align: 'center' },

      ]} />

  );

};



export const ProductionReports: React.FC = () => {

  const { cuttingAllocations } = useAppContext();

  const rows = useMemo(() => productionReportFromAllocations(cuttingAllocations), [cuttingAllocations]);



  return (

    <ListView title="Production Reports" rows={rows} getId={r => r.id}

      columns={[

        { header: 'Karigar', render: r => <span className="font-semibold">{r.karigar}</span> },

        { header: 'Allocated Nos', render: r => r.alloc, align: 'center' },

        { header: 'Completed Nos', render: r => r.done, align: 'center' },

        { header: 'Pending Nos', render: r => r.pend, align: 'center' },

        { header: 'Efficiency', render: r => <span className="font-semibold text-green-600">{r.eff}</span>, align: 'center' },

      ]} />

  );

};

