import React from 'react';
import type { QuotationRecord } from '../store/AppContext';
import type { PartyMaster } from '../store/AppContext';
import { amountInWords } from '../utils/amountInWords';

export const PLATE_QUOTATION_PRINT_AREA_ID = 'plate-quotation-print-area';

const MIN_ROWS = 5;

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date();
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB').replace(/\//g, '-');
};

const cell = (v: string | number | undefined) => (v === 0 || v === '0' ? v : v || '');

export interface PlateQuotationPrintData {
  quoteNo: string;
  date: string;
  partyName: string;
  address: string;
  addressLine2?: string;
  mobileNo: string;
  email: string;
  gstNo: string;
  utLevel: string;
  validityLabel: string;
  paymentTerms: string;
  loadingChargeNote: string;
  transportChargeNote: string;
  salesPerson: string;
  items: QuotationRecord['items'];
  totalNos: number;
  totalKg: number;
  totalAmount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
}

export function buildPlateQuotationPrintData(
  q: QuotationRecord,
  parties: PartyMaster[] = [],
): PlateQuotationPrintData {
  const party = parties.find(p => p.partyName === q.partyName);
  const addr = q.address || party?.address || party?.deliveryAddress || '';
  const parts = addr.split(/\n|, /).map(s => s.trim()).filter(Boolean);
  const totalNos = q.items.reduce((s, i) => s + (parseInt(String(i.nos), 10) || 0), 0);
  const totalKg = parseFloat(q.items.reduce((s, i) => s + (i.weight || 0), 0).toFixed(2));
  const gstAmount = parseFloat((q.totalAmount * q.gstRate / 100).toFixed(2));

  return {
    quoteNo: q.quoteNo,
    date: q.date,
    partyName: q.partyName,
    address: parts[0] || '',
    addressLine2: parts.slice(1).join(', '),
    mobileNo: q.mobileNo || party?.mobileNumber || party?.mobile2 || '',
    email: party?.email || '',
    gstNo: party?.gstNumber || '',
    utLevel: q.utLevel || '',
    validityLabel: `${q.validityDays ?? 7} Days`,
    paymentTerms: q.paymentTerms || '',
    loadingChargeNote: q.loadingChargeNote || '',
    transportChargeNote: q.transportChargeNote || '',
    salesPerson: q.salesPerson || '',
    items: q.items,
    totalNos,
    totalKg,
    totalAmount: q.totalAmount,
    gstRate: q.gstRate,
    gstAmount,
    grandTotal: q.grandTotal,
  };
}

const PLATE_QUOTATION_PRINT_STYLES = `
  :root{
    --navy:#16266e;--navy2:#1b2a6b;--orange:#f15a22;--orange2:#f47b2a;
    --blue-light:#e8f0fb;--cream:#fdeede;--line:#cfd9ea;--ink:#23314f;--mut:#3a4763;
  }
  .pq-print-root{width:210mm;height:297mm;background:#fff;overflow:hidden;display:flex;flex-direction:column;
    font-family:"Segoe UI",Arial,Helvetica,sans-serif;color:var(--ink);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;margin:0;padding:0;}
  .pq-print-root *{box-sizing:border-box;margin:0;padding:0;}
  .pq-print-sheet{position:relative;width:100%;height:100%;background:#fff;overflow:hidden;display:flex;flex-direction:column;}
  .pq-print-topbar{height:12px;background:var(--orange);position:relative;flex-shrink:0;}
  .pq-print-topbar::after{content:"";position:absolute;right:0;top:0;height:12px;width:230px;background:var(--navy);clip-path:polygon(40px 0,100% 0,100% 100%,0 100%);}
  .pq-print-header{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 24px 4px;}
  .pq-print-brand .nm{font-size:40px;font-weight:800;letter-spacing:.5px;line-height:.95;}
  .pq-print-brand .nm .o{color:var(--orange);}
  .pq-print-brand .nm .n{color:var(--navy);}
  .pq-print-brand .sub{display:flex;align-items:center;gap:10px;margin-top:7px;}
  .pq-print-brand .sub b{font-size:19px;font-weight:800;letter-spacing:3px;color:var(--navy);}
  .pq-print-brand .sub .dash{height:3px;width:30px;background:var(--orange);}
  .pq-print-qbadge{position:relative;display:flex;align-items:center;height:62px;}
  .pq-print-qbadge .sl{width:9px;height:62px;background:var(--orange);transform:skewX(-20deg);margin-right:5px;}
  .pq-print-qbadge .sl2{width:9px;height:62px;background:var(--orange);transform:skewX(-20deg);margin-right:12px;}
  .pq-print-qbadge .box{background:var(--navy);color:#fff;font-size:30px;font-weight:800;letter-spacing:2px;padding:14px 26px 14px 34px;clip-path:polygon(22px 0,100% 0,100% 100%,0 100%);}
  .pq-print-info{border:1.4px solid var(--line);border-radius:12px;margin:4px 24px 0;display:flex;padding:9px 4px;}
  .pq-print-icol{flex:1;padding:0 16px;}
  .pq-print-icol.l{border-right:1.4px solid var(--line);}
  .pq-print-irow{display:flex;align-items:center;gap:10px;margin-bottom:7px;}
  .pq-print-irow:last-child{margin-bottom:0;}
  .pq-print-ico{width:24px;flex-shrink:0;display:flex;justify-content:center;}
  .pq-print-ilbl{width:150px;flex-shrink:0;font-size:13.5px;font-weight:700;color:var(--ink);}
  .pq-print-icol.l .pq-print-ilbl{width:118px;}
  .pq-print-icolon{width:8px;flex-shrink:0;font-weight:700;}
  .pq-print-ival{flex:1;border-bottom:1.4px solid var(--navy);height:15px;font-size:12px;line-height:15px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
  .pq-print-iextra{margin-left:44px;border-bottom:1.4px solid var(--navy);height:15px;margin-bottom:7px;font-size:12px;line-height:15px;}
  .pq-print-gsticon{width:22px;height:16px;background:var(--orange);color:#fff;font-size:9px;font-weight:800;border-radius:3px;display:flex;align-items:center;justify-content:center;}
  .pq-print-mdwrap{display:flex;align-items:center;gap:0;margin:8px 24px 0;}
  .pq-print-mdline{flex:1;height:2.5px;background:var(--orange);}
  .pq-print-mdband{position:relative;background:var(--navy);color:#fff;font-size:17px;font-weight:800;letter-spacing:1px;padding:8px 40px;border-radius:18px;white-space:nowrap;}
  .pq-print-mdband::before,.pq-print-mdband::after{content:"";position:absolute;top:50%;transform:translateY(-50%);width:14px;height:22px;background:var(--orange);}
  .pq-print-mdband::before{left:-7px;clip-path:polygon(0 0,100% 50%,0 100%);}
  .pq-print-mdband::after{right:-7px;clip-path:polygon(100% 0,0 50%,100% 100%);}
  .pq-print-pad{padding:0 24px;}
  .pq-print-tbl{width:100%;border-collapse:collapse;margin-top:8px;border:1.4px solid var(--navy);}
  .pq-print-tbl th{background:var(--navy);color:#fff;font-size:11px;font-weight:700;text-align:center;padding:5px 3px;line-height:1.1;border-right:1px solid #34468f;}
  .pq-print-tbl th:last-child{border-right:none;}
  .pq-print-tbl td{border:1px solid var(--line);height:31px;text-align:center;font-size:11px;font-weight:700;color:var(--navy);}
  .pq-print-tbl .total-lbl{background:var(--blue-light);text-align:center;font-size:13px;font-weight:800;color:var(--navy);letter-spacing:1px;height:26px;}
  .pq-print-tbl .total-cell{background:var(--blue-light);}
  .pq-print-note{font-size:11px;color:var(--mut);margin:5px 24px 0;}
  .pq-print-note b{color:var(--navy);}
  .pq-print-bottom{display:flex;gap:16px;margin:6px 24px 0;flex:1;align-items:stretch;min-height:0;}
  .pq-print-bcol{flex:1;display:flex;flex-direction:column;min-width:0;}
  .pq-print-sechead{display:flex;align-items:center;gap:9px;background:var(--orange);color:#fff;font-size:13.5px;font-weight:800;letter-spacing:.5px;padding:6px 12px;border-radius:6px 6px 0 0;}
  .pq-print-sechead svg{flex-shrink:0;}
  .pq-print-sumbody{border:1.4px solid var(--line);border-top:none;border-radius:0 0 6px 6px;padding:9px 14px;}
  .pq-print-sline{display:flex;align-items:flex-end;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:8px;}
  .pq-print-sline .l{width:148px;flex-shrink:0;}
  .pq-print-sline .c{width:8px;}
  .pq-print-sline .v{flex:1;border-bottom:1.3px solid var(--navy);height:15px;margin-left:4px;font-size:12px;line-height:15px;}
  .pq-print-finalbar{display:flex;align-items:center;background:var(--navy);color:#fff;border-radius:5px;padding:9px 12px;margin-top:3px;}
  .pq-print-finalbar .l{font-size:14.5px;font-weight:800;flex-shrink:0;}
  .pq-print-finalbar .c{margin:0 6px;}
  .pq-print-finalbar .v{flex:1;border-bottom:1.4px solid #fff;height:15px;font-size:12px;line-height:15px;}
  .pq-print-words{border:1.4px solid var(--line);border-radius:8px;background:var(--blue-light);padding:8px 12px;margin-top:9px;}
  .pq-print-words .wh{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:var(--navy);margin-bottom:7px;}
  .pq-print-wline{border-bottom:1.2px solid #aab8d4;height:14px;margin-bottom:9px;font-size:11px;line-height:14px;color:var(--ink);}
  .pq-print-wline:last-child{margin-bottom:2px;}
  .pq-print-sales{display:flex;align-items:center;gap:9px;border:1.4px solid var(--line);border-radius:8px;padding:8px 12px;margin-top:8px;font-size:13px;font-weight:700;color:var(--ink);}
  .pq-print-sales .v{flex:1;border-bottom:1.3px solid var(--navy);height:15px;font-size:12px;line-height:15px;}
  .pq-print-termsbody{border:1.4px solid var(--line);border-top:none;border-radius:0 0 6px 6px;padding:9px 12px;flex:1;display:flex;flex-direction:column;min-height:0;}
  .pq-print-term{display:flex;gap:8px;margin-bottom:4px;font-size:10.3px;line-height:1.26;color:var(--ink);}
  .pq-print-tnum{width:15px;height:15px;border-radius:50%;background:var(--navy);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
  .pq-print-signfor{text-align:right;margin-top:auto;padding-top:8px;font-size:13px;font-weight:700;color:var(--navy);}
  .pq-print-signline{border-top:1.3px solid var(--navy);width:66%;margin:14px 0 4px auto;}
  .pq-print-siglabel{text-align:right;font-size:12.5px;font-weight:800;color:var(--navy);}
  .pq-print-footer{position:relative;background:var(--orange);margin-top:7px;padding:9px 22px 9px 30px;display:flex;justify-content:space-between;align-items:center;color:#fff;flex-shrink:0;}
  .pq-print-footer::before{content:"";position:absolute;left:0;top:0;bottom:0;width:60px;background:var(--navy);clip-path:polygon(0 0,100% 0,0 100%);}
  .pq-print-fitem{display:flex;align-items:center;gap:8px;font-size:11px;line-height:1.3;font-weight:600;}
  .pq-print-fic{width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .pq-print-fic.gst{font-size:8px;font-weight:800;}
`;

const TERMS = [
  'Payment must be made on or before the due date. Interest @ 24% per annum (2% per month) will be charged on overdue payments.',
  'Any material quality issue, damage, shortage, or discrepancy must be reported within 7 days from the date of receipt. After 7 days, no claim shall be entertained and no responsibility shall remain on our part.',
  'Delivery schedules are tentative. Delivery may be delayed due to transport issues, vehicle breakdown, strikes, natural calamities, or circumstances beyond our control.',
  'Thickness tolerance shall be as per applicable mill/manufacturing standards and relevant specifications.',
  'Weight variation up to 5 Kg per metric ton shall be acceptable and binding.',
  'In case any material fails during testing, the buyer shall arrange re-testing at their own cost before any further claim is considered.',
  'Material once cut, processed, or consumed shall not be accepted for return or replacement.',
  'Goods supplied shall be deemed accepted unless otherwise notified in writing within the stipulated period.',
  'All disputes are subject to Vadodara jurisdiction only.',
];

export const PlateQuotationPrint: React.FC<{ data: PlateQuotationPrintData }> = ({ data }) => {
  const rowCount = Math.max(MIN_ROWS, data.items.length);
  const rows = Array.from({ length: rowCount }, (_, i) => data.items[i] ?? null);
  const words = amountInWords(data.grandTotal);
  const mid = Math.ceil(words.length / 2);
  const wordsLine1 = words.slice(0, mid);
  const wordsLine2 = words.slice(mid);

  return (
    <div id={PLATE_QUOTATION_PRINT_AREA_ID} className="pq-print-root">
      <style>{PLATE_QUOTATION_PRINT_STYLES}</style>
      <div className="pq-print-sheet">
        <div className="pq-print-topbar" />

        <div className="pq-print-header">
          <div className="pq-print-brand">
            <div className="nm"><span className="o">JAGDAMBA</span> <span className="n">PROFILE</span></div>
            <div className="sub"><span className="dash" /><b>STEEL STOCKHOLDER</b><span className="dash" /></div>
          </div>
          <div className="pq-print-qbadge">
            <span className="sl" /><span className="sl2" />
            <span className="box">QUOTATION</span>
          </div>
        </div>

        <div className="pq-print-info">
          <div className="pq-print-icol l">
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#f15a22"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z" /></svg></span>
              <span className="pq-print-ilbl">Quotation No.</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.quoteNo}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#f15a22"><path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14z" /></svg></span>
              <span className="pq-print-ilbl">Quotation Date</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{fmtDate(data.date)}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#f15a22"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" /></svg></span>
              <span className="pq-print-ilbl">Party Name</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.partyName}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#f15a22"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg></span>
              <span className="pq-print-ilbl">Party Address</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.address}</span>
            </div>
            <div className="pq-print-iextra">{data.addressLine2 || ''}</div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#f15a22"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.24 1l-2.22 2.3z" /></svg></span>
              <span className="pq-print-ilbl">Mobile No.</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.mobileNo}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f15a22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></svg></span>
              <span className="pq-print-ilbl">Email</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.email}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><span className="pq-print-gsticon">GST</span></span>
              <span className="pq-print-ilbl">GST No.</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.gstNo}</span>
            </div>
          </div>
          <div className="pq-print-icol r">
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#16266e"><path d="M4 13h3v8H4v-8zm6-6h3v14h-3V7zm6 3h3v11h-3V10z" /></svg></span>
              <span className="pq-print-ilbl">UT Level</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.utLevel}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#16266e"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5 3 .75-1.23L12.5 11.5V7z" /></svg></span>
              <span className="pq-print-ilbl">Validity of Quotation</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.validityLabel}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#16266e"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4H4V6h16v2zm0 4H4v6h16v-6z" /></svg></span>
              <span className="pq-print-ilbl">Payment Terms</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.paymentTerms}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#16266e"><path d="M3 6h11v8H3V6zm12 3h3l3 3v2h-2a2 2 0 01-4 0h-1V9zM6 16a2 2 0 104 0 2 2 0 00-4 0z" /></svg></span>
              <span className="pq-print-ilbl">Loading Charge</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.loadingChargeNote}</span>
            </div>
            <div className="pq-print-irow">
              <span className="pq-print-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="#16266e"><path d="M3 6h11v8H3V6zm12 3h3l3 3v2h-2a2 2 0 01-4 0h-1V9zM6 16a2 2 0 104 0 2 2 0 00-4 0z" /></svg></span>
              <span className="pq-print-ilbl">Transport Charge</span><span className="pq-print-icolon">:</span><span className="pq-print-ival">{data.transportChargeNote}</span>
            </div>
          </div>
        </div>

        <div className="pq-print-mdwrap"><span className="pq-print-mdline" /><span className="pq-print-mdband">MATERIAL DETAILS</span><span className="pq-print-mdline" /></div>

        <div className="pq-print-pad">
          <table className="pq-print-tbl">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Sr.<br />No.</th>
                <th style={{ width: '11%' }}>Grade</th>
                <th style={{ width: '10%' }}>Make</th>
                <th style={{ width: '9%' }}>Thickness<br />(mm)</th>
                <th style={{ width: '8%' }}>Width<br />(mm)</th>
                <th style={{ width: '9%' }}>Length<br />(mm)</th>
                <th style={{ width: '7%' }}>Nos</th>
                <th style={{ width: '8%' }}>Kg</th>
                <th style={{ width: '11%' }}>Rate (₹/Kg)</th>
                <th style={{ width: '12%' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={i}>
                  <td>{item ? i + 1 : ''}</td>
                  <td>{item?.grade || ''}</td>
                  <td>{item?.make || ''}</td>
                  <td>{item ? cell(item.thickness) : ''}</td>
                  <td>{item ? cell(item.width) : ''}</td>
                  <td>{item ? cell(item.length) : ''}</td>
                  <td>{item ? cell(item.nos) : ''}</td>
                  <td>{item ? fmt(item.weight) : ''}</td>
                  <td>{item ? fmt(item.rate) : ''}</td>
                  <td>{item ? fmt(item.amount) : ''}</td>
                </tr>
              ))}
              <tr>
                <td className="total-lbl" colSpan={6}>TOTAL</td>
                <td className="total-cell">{data.totalNos || ''}</td>
                <td className="total-cell">{fmt(data.totalKg)}</td>
                <td className="total-cell" />
                <td className="total-cell">{fmt(data.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pq-print-note"><b>Note :</b>&nbsp; Kg is calculated as per Thickness, Width, Length &amp; Nos.</div>

        <div className="pq-print-bottom">
          <div className="pq-print-bcol">
            <div className="pq-print-sechead">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v3h10V5H7zm0 5v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM7 14v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v5h2v-5h-2z" /></svg>
              AMOUNT SUMMARY
            </div>
            <div className="pq-print-sumbody">
              <div className="pq-print-sline"><span className="l">Total Nos</span><span className="c">:</span><span className="v">{data.totalNos}</span></div>
              <div className="pq-print-sline"><span className="l">Total Kg</span><span className="c">:</span><span className="v">{fmt(data.totalKg)}</span></div>
              <div className="pq-print-sline"><span className="l">Amount (Before GST)</span><span className="c">:</span><span className="v">{fmt(data.totalAmount)}</span></div>
              <div className="pq-print-sline" style={{ marginBottom: 6 }}><span className="l">GST @ {data.gstRate}%</span><span className="c">:</span><span className="v">{fmt(data.gstAmount)}</span></div>
              <div className="pq-print-finalbar"><span className="l">FINAL AMOUNT (₹)</span><span className="c">:</span><span className="v">{fmt(data.grandTotal)}</span></div>
            </div>
            <div className="pq-print-words">
              <div className="wh">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16266e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></svg>
                Amount in Words
              </div>
              <div className="pq-print-wline">{wordsLine1}</div>
              <div className="pq-print-wline">{wordsLine2}</div>
            </div>
            <div className="pq-print-sales">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#16266e"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" /></svg>
              Sales Person <span className="c">:</span><span className="v">{data.salesPerson}</span>
            </div>
          </div>

          <div className="pq-print-bcol">
            <div className="pq-print-sechead">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" /></svg>
              TERMS &amp; CONDITIONS
            </div>
            <div className="pq-print-termsbody">
              {TERMS.map((t, i) => (
                <div key={i} className="pq-print-term"><span className="pq-print-tnum">{i + 1}</span><span>{t}</span></div>
              ))}
              <div className="pq-print-signfor">For Jagdamba Profile</div>
              <div className="pq-print-signline" />
              <div className="pq-print-siglabel">Authorized Signatory</div>
            </div>
          </div>
        </div>

        <div className="pq-print-footer">
          <div className="pq-print-fitem">
            <span className="pq-print-fic"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg></span>
            <span>504/A1, GIDC Makarpura,<br />Vadodara – 390010</span>
          </div>
          <div className="pq-print-fitem">
            <span className="pq-print-fic gst">GST</span>
            <span>GST No.:<br />24AJGPP9863R1Z5</span>
          </div>
          <div className="pq-print-fitem">
            <span className="pq-print-fic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></svg></span>
            <span>E-mail:<br />jagdambaprofile@gmail.com</span>
          </div>
          <div className="pq-print-fitem">
            <span className="pq-print-fic"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.24 1l-2.22 2.3z" /></svg></span>
            <span>Phone:<br />9824025001, 9824917250</span>
          </div>
        </div>
      </div>
    </div>
  );
};
