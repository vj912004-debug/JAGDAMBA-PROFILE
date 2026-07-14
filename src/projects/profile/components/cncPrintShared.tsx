import React from 'react';

export const CNC_PRINT_STYLES = `
  :root{
    --navy:#14246b;--blue:#1d5fc6;--blue-light:#dbe7fb;
    --orange:#f7941d;--green:#1a8a2e;--line:#a7bbdd;--ink:#1b2a4a;
  }
  .cnc-print-root{width:210mm;height:297mm;max-width:210mm;overflow:hidden;margin:0;padding:0;
    font-family:"Segoe UI",Arial,Helvetica,sans-serif;color:var(--ink);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;}
  .cnc-print-sheet{
    width:100%;height:100%;max-width:100%;
    background:#fff;border:2.5px solid var(--navy);
    padding:2.5px;overflow:hidden;
    display:flex;flex-direction:column;
    box-sizing:border-box;
  }
  .cnc-print-inner{
    border:1.5px solid var(--blue);
    flex:1;display:flex;flex-direction:column;
    padding:5px 8px 0;min-height:0;min-width:0;overflow:hidden;
    box-sizing:border-box;
  }
  .cnc-print-header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:3px;}
  .cnc-print-brand{display:flex;align-items:center;gap:9px;flex:1;min-width:0;}
  .cnc-print-logo{width:58px;height:58px;flex-shrink:0;}
  .cnc-print-name{font-size:26px;font-weight:800;letter-spacing:.4px;color:var(--navy);line-height:1;white-space:nowrap;}
  .cnc-print-tag{font-size:11.5px;font-weight:800;letter-spacing:1.4px;color:var(--orange);border-bottom:2px solid var(--orange);padding-bottom:2px;display:inline-block;margin-top:4px;white-space:nowrap;}
  .cnc-print-meta{width:34%;max-width:34%;flex-shrink:0;}
  .cnc-print-meta-row{display:flex;align-items:flex-end;gap:4px;font-size:11px;font-weight:700;color:var(--navy);white-space:nowrap;line-height:1.2;}
  .cnc-print-meta-row .lbl{flex-shrink:0;}
  .cnc-print-meta-row .line{flex:1;border-bottom:1.2px solid var(--ink);min-width:24px;padding-bottom:1px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;}
  .cnc-print-meta-top{display:flex;gap:8px;margin-bottom:6px;}
  .cnc-print-meta-top .cnc-print-meta-row{flex:1;}
  .cnc-print-titlewrap{display:flex;align-items:center;gap:5px;margin:2px 0 6px;}
  .cnc-print-chev{display:flex;gap:3px;flex-shrink:0;}
  .cnc-print-chev i{display:block;width:10px;height:22px;}
  .cnc-print-chev.left i{transform:skewX(-22deg);}
  .cnc-print-chev.right i{transform:skewX(22deg);}
  .cnc-print-chev .o{background:var(--orange);}.cnc-print-chev .b{background:var(--blue);}
  .cnc-print-banner{flex:1;background:var(--blue);color:#fff;text-align:center;font-size:22px;font-weight:800;letter-spacing:.4px;padding:8px 0;
    clip-path:polygon(0 0,100% 0,calc(100% - 17px) 50%,100% 100%,0 100%,17px 50%);}
  .cnc-print-party-box{border:1.4px solid var(--blue);border-radius:9px;display:flex;margin-bottom:6px;overflow:hidden;min-width:0;}
  .cnc-print-inquiry-col{width:32%;min-width:0;flex-shrink:0;border-right:1.4px solid var(--blue);display:flex;}
  .cnc-print-inquiry-cell{flex:1;padding:9px 8px;}
  .cnc-print-inquiry-cell:first-child{border-right:1.4px solid var(--blue);}
  .cnc-print-field-head{display:block;font-size:10.5px;font-weight:800;color:var(--navy);margin-bottom:8px;white-space:nowrap;}
  .cnc-print-field-head svg{vertical-align:-2px;margin-right:4px;}
  .cnc-print-field-box{border:1.5px solid var(--line);border-radius:6px;height:34px;display:flex;align-items:center;padding:0 8px;font-size:11.5px;font-weight:700;color:var(--ink);overflow:hidden;}
  .cnc-print-party-col{flex:1;min-width:0;padding:9px 10px;}
  .cnc-print-party-head{display:block;font-size:13px;font-weight:800;color:var(--navy);margin-bottom:8px;white-space:nowrap;}
  .cnc-print-party-head svg{vertical-align:-3px;margin-right:6px;}
  .cnc-print-pline{display:flex;align-items:flex-end;font-size:13.5px;font-weight:700;color:var(--navy);}
  .cnc-print-pline .lbl{flex-shrink:0;white-space:nowrap;}
  .cnc-print-pline .colon{width:18px;padding-left:5px;flex-shrink:0;}
  .cnc-print-pline .val{flex:1;border-bottom:1.3px dotted #9fb0cf;min-height:15px;margin-left:3px;font-size:12px;}
  .cnc-print-prow-full{margin-bottom:9px;}.cnc-print-prow-full .lbl{width:84px;}
  .cnc-print-pgrid{display:flex;gap:14px;margin-bottom:9px;}
  .cnc-print-pgrid:last-child{margin-bottom:0;}
  .cnc-print-pgrid .cnc-print-pline{flex:1;}.cnc-print-pgrid .lbl{width:108px;}
  .cnc-print-cols{display:grid;grid-template-columns:1fr 0.97fr 1.15fr;gap:5px;margin-bottom:6px;min-width:0;}
  .cnc-print-panel{border:1px solid var(--line);border-radius:7px;overflow:hidden;display:flex;flex-direction:column;min-width:0;}
  .cnc-print-panel-head{background:var(--blue);color:#fff;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;padding:6px 8px;white-space:nowrap;overflow:hidden;}
  .cnc-print-panel-head .ico{width:17px;height:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cnc-print-mat-row{display:flex;border-bottom:1px solid var(--line);flex:1;}
  .cnc-print-mat-row:last-child{border-bottom:none;}
  .cnc-print-mat-lbl{flex:1;padding:0 8px;font-size:11px;font-weight:700;color:var(--ink);border-right:1px solid var(--line);display:flex;align-items:center;white-space:nowrap;min-height:24px;}
  .cnc-print-mat-fill{width:36%;display:flex;align-items:center;padding:0 8px;font-size:11.5px;font-weight:700;color:var(--ink);}
  .cnc-print-rate-table{width:100%;height:100%;border-collapse:collapse;table-layout:fixed;}
  .cnc-print-rate-table th{background:var(--blue-light);color:var(--navy);font-size:12.5px;font-weight:800;height:40px;padding:0 6px;border-bottom:1px solid var(--line);}
  .cnc-print-rate-table th:first-child{border-right:1px solid var(--line);width:63%;}
  .cnc-print-rate-table td{border-bottom:1px solid var(--line);vertical-align:middle;padding:0 8px;font-size:11.5px;font-weight:700;text-align:center;}
  .cnc-print-rate-table tr:last-child td{border-bottom:none;}
  .cnc-print-rate-table .rp{padding:0 9px;font-size:11.5px;font-weight:700;color:var(--ink);border-right:1px solid var(--line);white-space:nowrap;text-align:left;}
  .cnc-print-calc-body{padding:2px 5px;display:flex;flex-direction:column;height:100%;min-width:0;}
  .cnc-print-calc-row{display:flex;align-items:center;gap:4px;flex:1;border-bottom:1px solid #e7edf6;min-width:0;}
  .cnc-print-calc-row:last-child{border-bottom:none;}
  .cnc-print-calc-label{flex:1;min-width:0;font-size:10px;font-weight:800;color:var(--navy);line-height:1.15;overflow:hidden;}
  .cnc-print-calc-label .sub{display:block;font-size:8.5px;font-weight:700;color:#6b7896;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cnc-print-calc-label.green{color:var(--green);}
  .cnc-print-calc-val{width:58px;height:22px;border:1.4px solid var(--line);border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:flex-end;padding:0 4px;font-size:10px;font-weight:700;}
  .cnc-print-calc-unit{width:14px;font-size:10px;font-weight:800;color:var(--navy);flex-shrink:0;text-align:right;}
  .cnc-print-final{border:1px solid var(--line);border-radius:7px;overflow:hidden;margin-bottom:6px;}
  .cnc-print-final-head{background:var(--blue);color:#fff;text-align:center;font-size:15px;font-weight:800;padding:8px 0;display:flex;align-items:center;justify-content:center;gap:7px;}
  .cnc-print-final-grid{display:flex;}
  .cnc-print-final-cell{flex:1;min-width:0;padding:9px 8px 10px;text-align:center;border-right:1px solid var(--line);}
  .cnc-print-final-cell:last-child{border-right:none;}
  .cnc-print-final-title{display:flex;align-items:center;justify-content:center;gap:4px;font-size:11px;font-weight:800;color:var(--navy);margin-bottom:8px;white-space:nowrap;}
  .cnc-print-coin{width:24px;height:24px;border-radius:50%;color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cnc-print-coin.blue{background:var(--blue);}.cnc-print-coin.orange{background:var(--orange);}
  .cnc-print-final-box{border:1.5px solid var(--blue);border-radius:7px;height:36px;border-bottom:3px solid var(--orange);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:var(--navy);}
  .cnc-print-remarks{margin-bottom:6px;}
  .cnc-print-rhead{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;color:var(--navy);margin-bottom:6px;}
  .cnc-print-rline{border-bottom:1px solid #c3cfe3;min-height:26px;margin-bottom:8px;font-size:11px;padding:2px 0 4px;line-height:1.3;color:var(--ink);}
  .cnc-print-signoff{display:flex;gap:6px;margin-bottom:0;min-width:0;}
  .cnc-print-sign-table{flex:1;border:1px solid var(--line);border-radius:7px;overflow:hidden;display:flex;}
  .cnc-print-sign-cell{flex:1;border-right:1px solid var(--line);}
  .cnc-print-sign-cell:last-child{border-right:none;}
  .cnc-print-sign-cap{background:var(--blue-light);color:var(--navy);text-align:center;font-size:12px;font-weight:800;padding:8px 4px;border-bottom:1px solid var(--line);}
  .cnc-print-sign-body{padding:22px 10px 8px;}
  .cnc-print-sign-date{font-size:11.5px;font-weight:700;color:var(--ink);white-space:nowrap;}
  .cnc-print-sign-date .dl{display:inline-block;width:80px;border-bottom:1px solid var(--ink);}
  .cnc-print-stamp{width:26%;min-width:0;flex-shrink:0;border:1px solid var(--line);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--navy);letter-spacing:.4px;padding:0 4px;}
  .cnc-print-footer{position:relative;background:var(--blue);margin:6px -8px 0;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;color:#fff;overflow:hidden;flex-shrink:0;gap:6px;}
  .cnc-print-fitem{display:flex;align-items:center;gap:6px;font-size:10px;line-height:1.32;font-weight:600;min-width:0;flex:1;}
  .cnc-print-fico{width:29px;height:29px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .cnc-print-footer::before{content:"";position:absolute;right:0;bottom:0;width:100px;height:34px;background:var(--orange);clip-path:polygon(40px 100%,100% 0,100% 100%);}
  .cnc-print-footer::after{content:"";position:absolute;right:0;bottom:0;width:62px;height:20px;background:var(--navy);clip-path:polygon(34px 100%,100% 0,100% 100%);z-index:1;}
  .cnc-print-quote-table{width:100%;border-collapse:collapse;border:1px solid var(--line);margin-bottom:9px;font-size:10px;}
  .cnc-print-quote-table th{background:var(--blue-light);color:var(--navy);font-weight:800;padding:6px 4px;border:1px solid var(--line);text-align:center;}
  .cnc-print-quote-table td{border:1px solid var(--line);padding:5px 4px;text-align:center;font-weight:600;vertical-align:middle;}
  .cnc-print-quote-summary{display:flex;justify-content:flex-end;margin-bottom:9px;}
  .cnc-print-quote-summary table{border:1px solid var(--line);border-collapse:collapse;font-size:11px;}
  .cnc-print-quote-summary td{padding:5px 10px;border-bottom:1px solid var(--line);}
  .cnc-print-quote-summary tr:last-child td{border-bottom:none;font-weight:800;background:var(--blue-light);}
  @media print{
    @page cnc-print{size:A4 portrait;margin:0;}
    .cnc-print-root{
      page:cnc-print;
      position:absolute!important;left:0!important;top:0!important;
      width:210mm!important;height:297mm!important;max-width:210mm!important;
      overflow:hidden!important;margin:0!important;padding:0!important;
    }
  }
`;

export const JagdambaLogo: React.FC = () => (
  <svg className="cnc-print-logo" viewBox="0 0 100 100">
    <g fill="#f7941d">
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(deg => (
        <rect key={deg} x="44.5" y="1" width="11" height="17" rx="3" transform={`rotate(${deg} 50 50)`} />
      ))}
    </g>
    <circle cx="50" cy="50" r="35" fill="#f7941d" />
    <path d="M50 15 a35 35 0 0 1 0 70 z" fill="#14246b" />
    <circle cx="50" cy="50" r="25" fill="#fff" />
    <text x="41" y="61" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="30" fill="#f7941d">J</text>
    <text x="59" y="61" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="30" fill="#14246b">P</text>
  </svg>
);

export const CNCPrintFooter: React.FC = () => (
  <div className="cnc-print-footer">
    <div className="cnc-print-fitem">
      <span className="cnc-print-fico">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" /></svg>
      </span>
      <span>504/1A, GIDC Makarpura,<br />Vadodara – 390010,<br />Gujarat, India.</span>
    </div>
    <div className="cnc-print-fitem">
      <span className="cnc-print-fico">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M2 4h20v16H2V4zm10 7L4 6.5V6l8 5 8-5v.5L12 11z" /></svg>
      </span>
      <span>jagdambaprofile@gmail.com</span>
    </div>
    <div className="cnc-print-fitem">
      <span className="cnc-print-fico">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.24 1l-2.22 2.3z" /></svg>
      </span>
      <span>+91 9824917250<br />+91 9824025001</span>
    </div>
  </div>
);

export const CNCPrintHeader: React.FC<{ date: string; time: string; user: string }> = ({ date, time, user }) => (
  <div className="cnc-print-header">
    <div className="cnc-print-brand">
      <JagdambaLogo />
      <div>
        <div className="cnc-print-name">JAGDAMBA PROFILE</div>
        <div className="cnc-print-tag">CNC PROFILE CUTTING SOLUTIONS</div>
      </div>
    </div>
    <div className="cnc-print-meta">
      <div className="cnc-print-meta-top">
        <div className="cnc-print-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d5fc6"><path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14z" /></svg>
          <span className="lbl">Date :</span><span className="line">{date}</span>
        </div>
        <div className="cnc-print-meta-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d5fc6"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5 3 .75-1.23L12.5 11.5V7z" /></svg>
          <span className="lbl">Time :</span><span className="line">{time}</span>
        </div>
      </div>
      <div className="cnc-print-meta-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d5fc6"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" /></svg>
        <span className="lbl">User :</span><span className="line">{user}</span>
      </div>
    </div>
  </div>
);

export const CNCPrintBanner: React.FC<{ title: string }> = ({ title }) => (
  <div className="cnc-print-titlewrap">
    <div className="cnc-print-chev left"><i className="o" /><i className="b" /></div>
    <div className="cnc-print-banner">{title}</div>
    <div className="cnc-print-chev right"><i className="b" /><i className="o" /></div>
  </div>
);

export const fmtNum = (n: number, dec = 2) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
