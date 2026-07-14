import React from 'react';

export const RING_QUOTATION_PRINT_AREA_ID = 'ring-quotation-print-area';

export interface RingQuotationPrintItem {
  grade: string;
  od: string;
  id: string;
  nos: string;
  odWeight: number;
  idLessWeight: number;
  ratePerNos: number;
  amount: number;
}

export interface RingQuotationPrintData {
  partyName: string;
  address: string;
  addressLine2?: string;
  gstNo: string;
  email: string;
  phone: string;
  quoteNo: string;
  date: string;
  inquiryNo: string;
  items: RingQuotationPrintItem[];
  totalNos: number;
  totalAmount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
}

const ROW_COUNT = 15;

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateParts = (iso: string) => {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date();
  if (Number.isNaN(d.getTime())) return { dd: '', mm: '', yyyy: '' };
  return {
    dd: String(d.getDate()).padStart(2, '0'),
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    yyyy: String(d.getFullYear()),
  };
};

const RING_QUOTATION_PRINT_STYLES = `
  :root{
    --navy:#14246b;--navy2:#1b2a6b;--blue:#1d5fc6;--blue-light:#d5e6fb;
    --orange:#f26722;--orange2:#f7941d;--cream:#fce4cf;--line:#c9d4e6;--ink:#1b2540;
  }
  .rq-print-root{width:210mm;height:297mm;background:#fff;overflow:hidden;display:flex;flex-direction:column;
    font-family:"Segoe UI",Arial,Helvetica,sans-serif;color:var(--ink);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;margin:0;padding:0;}
  .rq-print-root *{box-sizing:border-box;margin:0;padding:0;}
  .rq-print-sheet{position:relative;width:100%;height:100%;background:#fff;overflow:hidden;display:flex;flex-direction:column;}
  .rq-print-frame{position:absolute;inset:7px;border:2.6px solid var(--navy);border-radius:0;pointer-events:none;z-index:1;}
  .rq-print-frame-in{position:absolute;inset:12px;border:1.2px solid var(--orange);border-radius:0;pointer-events:none;z-index:1;}
  .rq-print-corner{position:absolute;width:62px;height:62px;z-index:2;}
  .rq-print-corner.tl{top:7px;left:7px;}
  .rq-print-corner.br{bottom:7px;right:7px;transform:rotate(180deg);}
  .rq-print-content{position:relative;z-index:3;flex:1;display:flex;flex-direction:column;padding:8px 26px 14px;min-height:0;}
  .rq-print-title{text-align:center;font-size:52px;font-weight:800;letter-spacing:.5px;color:var(--navy);line-height:.98;margin-top:13px;}
  .rq-print-subwrap{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:4px;}
  .rq-print-subwrap .ln{height:3px;width:54px;background:var(--navy);position:relative;}
  .rq-print-subwrap .ln.l::after,.rq-print-subwrap .ln.r::before{content:"";position:absolute;top:-3.5px;width:10px;height:10px;background:var(--orange);transform:rotate(45deg);}
  .rq-print-subwrap .ln.l::after{right:-9px;}
  .rq-print-subwrap .ln.r::before{left:-9px;}
  .rq-print-subtitle{font-size:33px;font-weight:800;letter-spacing:2px;color:var(--orange);}
  .rq-print-hr-orange{height:2px;background:var(--orange);margin:9px 0 10px;border-radius:2px;}
  .rq-print-contact{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:11px;}
  .rq-print-citem{display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;color:var(--ink);line-height:1.25;}
  .rq-print-cic{width:30px;height:30px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .rq-print-party{position:relative;border:1.6px solid var(--navy);border-radius:10px;display:flex;padding:14px 20px;margin-bottom:12px;}
  .rq-print-pcol{flex:1;}
  .rq-print-pcol.left{padding-right:26px;}
  .rq-print-pcol.right{padding-left:34px;display:flex;flex-direction:column;justify-content:center;gap:2px;}
  .rq-print-divider{width:0;border-left:2px solid var(--orange);margin:2px 0;position:relative;}
  .rq-print-divider::before,.rq-print-divider::after{content:"";position:absolute;left:-6px;width:11px;height:11px;background:var(--orange);transform:rotate(45deg);}
  .rq-print-divider::before{top:-3px;}.rq-print-divider::after{bottom:-3px;}
  .rq-print-pline{display:flex;align-items:flex-end;font-size:15px;font-weight:700;color:var(--navy);margin-bottom:13px;}
  .rq-print-pline:last-child{margin-bottom:0;}
  .rq-print-pline .lbl{width:108px;flex-shrink:0;white-space:nowrap;}
  .rq-print-pline .lbl.org{color:var(--orange);width:auto;}
  .rq-print-pline .colon{width:14px;flex-shrink:0;}
  .rq-print-pline .val{flex:1;border-bottom:1.3px solid var(--navy);min-height:16px;margin-left:3px;font-size:13px;line-height:1.2;padding-bottom:1px;}
  .rq-print-pextra{margin-left:122px;border-bottom:1.3px solid var(--navy);height:16px;margin-bottom:13px;font-size:13px;line-height:16px;}
  .rq-print-date-line{display:flex;align-items:flex-end;gap:6px;font-size:15px;font-weight:700;color:var(--navy);}
  .rq-print-date-line .seg{display:inline-block;border-bottom:1.3px solid var(--navy);min-height:16px;font-size:13px;line-height:16px;text-align:center;}
  .rq-print-rq-no .lbl{color:var(--orange);}
  .rq-print-tbl{width:100%;border-collapse:collapse;border:1.6px solid var(--navy);}
  .rq-print-tbl th{background:var(--navy);color:#fff;font-size:11px;font-weight:800;text-align:center;padding:7px 3px;border-right:1px solid #3a4a8c;line-height:1.05;border-bottom:2.5px solid var(--orange);}
  .rq-print-tbl th small{font-weight:700;font-size:10.5px;}
  .rq-print-tbl th:last-child{border-right:none;}
  .rq-print-tbl td{border:1px solid var(--line);text-align:center;font-size:11px;font-weight:700;color:var(--navy);}
  .rq-print-tbl tbody tr{height:22px;}
  .rq-print-tbl td.sr{background:#fff;width:9%;}
  .rq-print-tbl tbody tr:nth-child(even) td{background:#f3f7fd;}
  .rq-print-bottom{display:flex;gap:16px;margin-top:11px;flex:1;align-items:flex-start;}
  .rq-print-bleft{width:50%;display:flex;flex-direction:column;}
  .rq-print-bright{width:50%;}
  .rq-print-totalnos{display:flex;align-items:stretch;margin-bottom:11px;}
  .rq-print-totalnos .lab{background:var(--navy);color:#fff;font-size:14px;font-weight:800;letter-spacing:.5px;padding:10px 16px;border-radius:4px 0 0 4px;display:flex;align-items:center;white-space:nowrap;}
  .rq-print-totalnos .box{flex:1;border:1.5px solid var(--navy);border-left:none;border-radius:0 4px 4px 0;display:flex;align-items:center;padding:0 12px;font-size:14px;font-weight:800;color:var(--navy);}
  .rq-print-notecap{display:inline-block;background:var(--navy);color:#fff;font-size:12px;font-weight:800;letter-spacing:.5px;padding:5px 12px;border-radius:3px;margin-bottom:-9px;margin-left:2px;position:relative;z-index:2;}
  .rq-print-notebox{border:1.5px solid var(--orange);border-radius:9px;padding:15px 14px 11px;}
  .rq-print-notebox ul{list-style:none;}
  .rq-print-notebox li{display:flex;align-items:flex-start;gap:9px;font-size:12.5px;font-weight:600;color:var(--ink);margin-bottom:8px;}
  .rq-print-notebox li:last-child{margin-bottom:0;}
  .rq-print-notebox li::before{content:"❖";color:var(--orange);font-size:11px;line-height:1.3;flex-shrink:0;}
  .rq-print-summary{border-collapse:collapse;width:100%;margin-bottom:14px;}
  .rq-print-summary td{border:1.5px solid var(--navy);padding:9px 12px;font-size:14px;font-weight:800;}
  .rq-print-summary .lab{text-align:center;color:var(--navy);}
  .rq-print-summary .r1 .lab{background:var(--blue-light);}
  .rq-print-summary .r2 .lab{background:var(--cream);}
  .rq-print-summary .r3 .lab{background:var(--navy);color:#fff;}
  .rq-print-summary .amt{width:96px;color:var(--navy);text-align:right;}
  .rq-print-signfor{text-align:right;font-size:15px;font-weight:700;color:var(--navy);margin-bottom:42px;}
  .rq-print-signfor b{font-weight:800;}
  .rq-print-signline{border-top:1.4px solid var(--navy);width:78%;margin-left:auto;}
  .rq-print-signlabel{text-align:center;font-size:13.5px;font-weight:800;color:var(--navy);margin-top:5px;padding-right:14px;}
`;

const CornerSvg = () => (
  <svg viewBox="0 0 100 100" width="62" height="62">
    <polygon points="0,0 100,0 0,100" fill="#f26722" />
    <polygon points="0,0 72,0 0,72" fill="#14246b" />
  </svg>
);

export const RingQuotationPrint: React.FC<{ data: RingQuotationPrintData }> = ({ data }) => {
  const { dd, mm, yyyy } = fmtDateParts(data.date);
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => data.items[i] ?? null);

  return (
    <div id={RING_QUOTATION_PRINT_AREA_ID} className="rq-print-root">
      <style>{RING_QUOTATION_PRINT_STYLES}</style>
      <div className="rq-print-sheet">
        <div className="rq-print-frame" />
        <div className="rq-print-frame-in" />
        <div className="rq-print-corner tl"><CornerSvg /></div>
        <div className="rq-print-corner br"><CornerSvg /></div>

        <div className="rq-print-content">
          <div className="rq-print-title">JAGDAMBA PROFILE</div>
          <div className="rq-print-subwrap">
            <span className="ln l" />
            <span className="rq-print-subtitle">RING QUOTATION</span>
            <span className="ln r" />
          </div>
          <div className="rq-print-hr-orange" />

          <div className="rq-print-contact">
            <div className="rq-print-citem">
              <span className="rq-print-cic">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg>
              </span>
              <span>504/1A, GIDC Makarpura,<br />Vadodara – 390010, Gujarat, India</span>
            </div>
            <div className="rq-print-citem">
              <span className="rq-print-cic">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M2 4h20v16H2V4zm10 7L4 6.5V6l8 5 8-5v.5L12 11z" /></svg>
              </span>
              <span>jagdambaprofile@gmail.com</span>
            </div>
            <div className="rq-print-citem">
              <span className="rq-print-cic">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.24 1l-2.22 2.3z" /></svg>
              </span>
              <span>9824025001 / 9824917250</span>
            </div>
          </div>

          <div className="rq-print-party">
            <div className="rq-print-pcol left">
              <div className="rq-print-pline"><span className="lbl">Party Name</span><span className="colon">:</span><span className="val">{data.partyName}</span></div>
              <div className="rq-print-pline"><span className="lbl">Address</span><span className="colon">:</span><span className="val">{data.address}</span></div>
              <div className="rq-print-pextra">{data.addressLine2 || ''}</div>
              <div className="rq-print-pextra" />
              <div className="rq-print-pline"><span className="lbl">GST No.</span><span className="colon">:</span><span className="val">{data.gstNo}</span></div>
              <div className="rq-print-pline"><span className="lbl">Email ID</span><span className="colon">:</span><span className="val">{data.email}</span></div>
              <div className="rq-print-pline"><span className="lbl">Phone No.</span><span className="colon">:</span><span className="val">{data.phone}</span></div>
            </div>
            <div className="rq-print-divider" />
            <div className="rq-print-pcol right">
              <div className="rq-print-pline rq-print-rq-no"><span className="lbl org">Ring Quotation No.</span><span className="colon">:</span><span className="val">{data.quoteNo}</span></div>
              <div className="rq-print-pline">
                <span className="lbl">Date</span><span className="colon">:</span>
                <span className="rq-print-date-line">
                  <span className="seg" style={{ width: 42 }}>{dd}</span>/
                  <span className="seg" style={{ width: 42 }}>{mm}</span>/
                  <span className="seg" style={{ width: 70 }}>{yyyy}</span>
                </span>
              </div>
              <div className="rq-print-pline"><span className="lbl">Inquiry No.</span><span className="colon">:</span><span className="val">{data.inquiryNo}</span></div>
            </div>
          </div>

          <table className="rq-print-tbl">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Sr.</th>
                <th style={{ width: '10%' }}>Grade</th>
                <th style={{ width: '9%' }}>OD<br /><small>(mm)</small></th>
                <th style={{ width: '9%' }}>ID<br /><small>(mm)</small></th>
                <th style={{ width: '10%' }}>OD Wt<br /><small>(kg)</small></th>
                <th style={{ width: '10%' }}>ID Less Wt<br /><small>(kg)</small></th>
                <th style={{ width: '8%' }}>Nos</th>
                <th style={{ width: '14%' }}>Per Nos Rate (₹)</th>
                <th style={{ width: '14%' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={i}>
                  <td className="sr">{i + 1}</td>
                  <td>{item?.grade || ''}</td>
                  <td>{item?.od || ''}</td>
                  <td>{item?.id || ''}</td>
                  <td>{item ? fmt(item.odWeight) : ''}</td>
                  <td>{item ? fmt(item.idLessWeight) : ''}</td>
                  <td>{item?.nos || ''}</td>
                  <td>{item ? fmt(item.ratePerNos) : ''}</td>
                  <td>{item ? fmt(item.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rq-print-bottom">
            <div className="rq-print-bleft">
              <div className="rq-print-totalnos">
                <div className="lab">TOTAL NOS</div>
                <div className="box">{data.totalNos || ''}</div>
              </div>
              <div className="rq-print-notecap">NOTE :</div>
              <div className="rq-print-notebox">
                <ul>
                  <li>GST Extra as applicable.</li>
                  <li>Delivery subject to material availability.</li>
                  <li>Payment Terms as mutually agreed.</li>
                  <li>Material once cut will not be taken back.</li>
                  <li>Prices are subject to change without prior notice.</li>
                </ul>
              </div>
            </div>
            <div className="rq-print-bright">
              <table className="rq-print-summary">
                <tbody>
                  <tr className="r1"><td className="lab">AMOUNT TOTAL</td><td className="amt">₹ {fmt(data.totalAmount)}</td></tr>
                  <tr className="r2"><td className="lab">GST ({data.gstRate}%)</td><td className="amt">₹ {fmt(data.gstAmount)}</td></tr>
                  <tr className="r3"><td className="lab">FINAL AMOUNT</td><td className="amt">₹ {fmt(data.grandTotal)}</td></tr>
                </tbody>
              </table>
              <div className="rq-print-signfor">For <b>JAGDAMBA PROFILE</b></div>
              <div className="rq-print-signline" />
              <div className="rq-print-signlabel">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
