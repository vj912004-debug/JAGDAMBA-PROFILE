import React from 'react';
import { ListView } from '../components/ListView';
import toast from 'react-hot-toast';

export const Ledger: React.FC = () => {
  const rows = [
    { id: '1', date: '01/06/2026', acc: 'ABC Ltd.', part: 'Opening', debit: '-', credit: '-', bal: '45,680' },
    { id: '2', date: '18/06/2026', acc: 'ABC Ltd.', part: 'INV/2627/0091', debit: '2,18,087', credit: '-', bal: '2,63,767' },
    { id: '3', date: '18/06/2026', acc: 'ABC Ltd.', part: 'Receipt', debit: '-', credit: '2,00,000', bal: '63,767' },
  ];
  return (
    <ListView title="Ledger" rows={rows} getId={r => r.id} onNew={() => toast('New entry')} onDelete={() => toast.success('Deleted')}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Date', render: r => r.date },
        { header: 'Account', render: r => r.acc },
        { header: 'Particulars', render: r => r.part },
        { header: 'Debit (₹)', render: r => r.debit, align: 'right' },
        { header: 'Credit (₹)', render: r => r.credit, align: 'right' },
        { header: 'Balance (₹)', render: r => <span className="font-semibold">{r.bal}</span>, align: 'right' },
      ]} />
  );
};

export const Outstanding: React.FC = () => {
  const rows = [
    { id: '1', party: 'ABC Ltd.', inv: 3, out: '2,45,680', overdue: 12 },
    { id: '2', party: 'Galaxy Steel', inv: 1, out: '69,222', overdue: 4 },
  ];
  return (
    <ListView title="Outstanding" rows={rows} getId={r => r.id} onNew={() => toast('New entry')} onDelete={() => toast.success('Deleted')}
      columns={[
        { header: 'Party', render: r => <span className="font-semibold">{r.party}</span>, align: 'center' },
        { header: 'Invoices', render: r => r.inv, align: 'center' },
        { header: 'Outstanding (₹)', render: r => r.out, align: 'center' },
        { header: 'Overdue Days', render: r => r.overdue, align: 'center' },
      ]} />
  );
};

export const Payments: React.FC = () => {
  const rows = [
    { id: '1', date: '18/06/2026', party: 'ABC Ltd.', mode: 'NEFT', ref: 'UTR9981', amt: '2,00,000' },
    { id: '2', date: '15/06/2026', party: 'Jindal Steel', mode: 'RTGS', ref: 'UTR9962', amt: '2,00,000' },
  ];
  return (
    <ListView title="Payments" rows={rows} getId={r => r.id} onNew={() => toast('New payment')} onDelete={() => toast.success('Deleted')}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Date', render: r => r.date, align: 'center' },
        { header: 'Party / Supplier', render: r => r.party, align: 'center' },
        { header: 'Mode', render: r => r.mode, align: 'center' },
        { header: 'Reference', render: r => r.ref, align: 'center' },
        { header: 'Amount (₹)', render: r => <span className="font-semibold">{r.amt}</span>, align: 'center' },
      ]} />
  );
};
