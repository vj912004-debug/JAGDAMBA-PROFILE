import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListView } from '../components/ListView';
import { useAppContext } from '../store/AppContext';
import toast from 'react-hot-toast';
import { fmtDate, fmtKg, stockReportFromPlates } from '../utils/erpListHelpers';
import { generateJobWorkOutwardPDF } from '../utils/jobWorkOutwardDownload';

export const StockSummary: React.FC = () => {
  const { plates } = useAppContext();
  const nav = useNavigate();

  const rows = useMemo(() => plates.map(p => ({
    id: p.id,
    grade: p.grade,
    thk: p.thickness,
    size: p.size,
    nos: 1,
    wt: fmtKg(p.weight || p.initialWeight),
    loc: p.source === 'Customer' ? 'Customer' : 'Yard',
  })), [plates]);

  return (
    <ListView title="Stock Summary" rows={rows} getId={r => r.id} onNew={() => nav('/plate-tracking')}
      onDelete={() => toast('Manage plates on Plate Tracking page')}
      columns={[
        { header: 'Plate ID', render: r => <span className="font-semibold">{r.id}</span> },
        { header: 'Grade', render: r => r.grade },
        { header: 'Thickness (mm)', render: r => r.thk, align: 'center' },
        { header: 'Size', render: r => r.size, align: 'center' },
        { header: 'Stock Nos', render: r => r.nos, align: 'center' },
        { header: 'Stock Weight (Kg)', render: r => r.wt, align: 'right' },
        { header: 'Location', render: r => r.loc, align: 'center' },
      ]} />
  );
};

export const JobWorkInwardList: React.FC = () => {
  const nav = useNavigate();
  const { jobWorkInwards } = useAppContext();

  const rows = useMemo(() => jobWorkInwards.map(r => ({
    id: r.id,
    no: r.inwardNo,
    date: fmtDate(r.inwardDate),
    party: r.partyName,
    outward: r.againstOutwardNo,
    wt: fmtKg(r.totalReceivedKg),
  })), [jobWorkInwards]);

  return (
    <ListView title="Job Work Inward" rows={rows} getId={r => r.id} onNew={() => nav('/job-work-inward')}
      onDelete={() => toast('Manage records from Job Work Inward entry')}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Inward No', render: r => <span className="font-semibold">{r.no}</span> },
        { header: 'Date', render: r => r.date },
        { header: 'Party', render: r => r.party },
        { header: 'Against Outward', render: r => r.outward },
        { header: 'Received KG', render: r => r.wt, align: 'right' },
      ]} />
  );
};

export const JobWorkOutwardList: React.FC = () => {
  const nav = useNavigate();
  const { jobWorkOutwards, user } = useAppContext();

  const rows = useMemo(() => jobWorkOutwards.map(r => ({
    id: r.id,
    no: r.outwardNo,
    date: fmtDate(r.outwardDate),
    party: r.partyName,
    cutting: r.partyCuttingName || '-',
    wt: fmtKg(r.totalActualKg),
    record: r,
  })), [jobWorkOutwards]);

  const handleDownload = async (row: typeof rows[number]) => {
    toast.loading('Generating PDF...', { id: 'jw-out-list-pdf' });
    try {
      await generateJobWorkOutwardPDF(row.record, user?.displayName || user?.username);
      toast.success(`PDF downloaded: ${row.no}`, { id: 'jw-out-list-pdf' });
    } catch {
      toast.error('PDF generation failed', { id: 'jw-out-list-pdf' });
    }
  };

  return (
    <ListView title="Job Work Outward" rows={rows} getId={r => r.id} onNew={() => nav('/job-work-outward')}
      onDelete={() => toast('Manage records from Job Work Outward entry')}
      onDownload={(row) => { void handleDownload(row); }}
      downloadLabel={r => r.no.replace(/\//g, '_')}
      dateAccessor={r => r.date}
      columns={[
        { header: 'Outward No', render: r => <span className="font-semibold">{r.no}</span> },
        { header: 'Date', render: r => r.date },
        { header: 'Party', render: r => r.party },
        { header: 'Cutting Party', render: r => r.cutting },
        { header: 'Actual KG', render: r => r.wt, align: 'right' },
      ]} />
  );
};

export const StockReports: React.FC = () => {
  const { plates, usages } = useAppContext();
  const rows = useMemo(() => stockReportFromPlates(plates, usages), [plates, usages]);

  return (
    <ListView title="Stock Reports" rows={rows} getId={r => r.id}
      columns={[
        { header: 'Grade', render: r => <span className="font-semibold">{r.grade}</span> },
        { header: 'Inward (Kg)', render: r => r.inward, align: 'right' },
        { header: 'Outward (Kg)', render: r => r.outward, align: 'right' },
        { header: 'Balance (Kg)', render: r => <span className="font-semibold">{r.close}</span>, align: 'right' },
      ]} />
  );
};
