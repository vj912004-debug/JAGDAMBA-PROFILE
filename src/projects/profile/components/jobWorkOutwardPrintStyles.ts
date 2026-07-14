export const JOB_WORK_OUTWARD_PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap');

  .jw-out-print {
    --navy:#1b3a8f;
    --navy-d:#16297a;
    --navy-ink:#16235a;
    --orange:#f47c20;
    --box-border:#c3cdec;
    --grid:#aebbe6;
    --field:#111827;
    --ink:#1f2436;
    width:210mm;
    height:297mm;
    max-width:210mm;
    overflow:hidden;
    margin:0;
    padding:0;
    font-family:'Montserrat',Arial,Helvetica,sans-serif;
    color:var(--ink);
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    box-sizing:border-box;
    background:#fff;
  }
  .jw-out-print *{box-sizing:border-box;margin:0;padding:0;}
  .jw-out-print .page{
    position:relative;width:210mm;height:297mm;background:#fff;
    border:2px solid var(--navy);border-radius:16px;overflow:hidden;padding:8mm 9mm 16mm;
  }
  .jw-out-print .wave-top{position:absolute;top:-2px;right:-2px;width:67%;pointer-events:none;}
  .jw-out-print .sq-tl{position:absolute;top:4px;left:4px;width:47px;height:47px;z-index:3;pointer-events:none;}
  .jw-out-print .sq-bl{position:absolute;bottom:4px;left:4px;width:47px;height:47px;z-index:3;pointer-events:none;}
  .jw-out-print .sq-br{position:absolute;bottom:4px;right:4px;width:47px;height:47px;z-index:3;pointer-events:none;}
  .jw-out-print .content{position:relative;z-index:2;}
  .jw-out-print .header{display:flex;align-items:flex-start;}
  .jw-out-print .brand-col{width:40%;padding-right:10px;}
  .jw-out-print .logo-row{display:flex;align-items:center;gap:12px;margin-bottom:2px;}
  .jw-out-print .logo-mark{width:62px;height:60px;flex:none;}
  .jw-out-print .logo-words{line-height:1;}
  .jw-out-print .logo-words .jag{font-weight:800;font-size:33px;letter-spacing:.5px;color:var(--navy);}
  .jw-out-print .logo-words .profile{display:flex;align-items:center;gap:6px;margin-top:3px;padding-left:2px;}
  .jw-out-print .logo-words .profile .dash{height:3px;width:18px;background:var(--orange);border-radius:2px;}
  .jw-out-print .logo-words .profile .txt{font-weight:700;font-size:15.5px;letter-spacing:7px;color:var(--orange);}
  .jw-out-print .contact{margin-top:14px;}
  .jw-out-print .contact .line{display:flex;align-items:center;gap:11px;margin:7px 0;}
  .jw-out-print .contact .ic{width:17px;height:17px;flex:none;color:var(--navy);}
  .jw-out-print .contact .tx{font-size:12.3px;font-weight:600;color:var(--navy-ink);letter-spacing:.2px;}
  .jw-out-print .head-divider{width:2px;align-self:stretch;background:#d7ddef;margin:4px 22px 0 6px;}
  .jw-out-print .title-col{flex:1;padding-top:30px;}
  .jw-out-print .title-col h1{font-weight:900;color:var(--navy);line-height:1.1;letter-spacing:-.6px;font-size:25.5px;}
  .jw-out-print .title-col h1 .l2{display:block;white-space:nowrap;}
  .jw-out-print .tab-wrap{display:flex;align-items:center;margin-bottom:10px;}
  .jw-out-print .tab{background:var(--navy);color:#fff;font-weight:700;font-size:13px;letter-spacing:.4px;padding:6px 16px;border-radius:6px;white-space:nowrap;}
  .jw-out-print .tab-line{height:2px;background:var(--orange);flex:1;margin-left:8px;border-radius:2px;}
  .jw-out-print .detail-row{display:flex;gap:18px;margin-top:11px;}
  .jw-out-print .det-box{border:1.5px solid var(--box-border);border-radius:12px;padding:14px 18px 18px;}
  .jw-out-print .party{width:43.5%;}
  .jw-out-print .outward{flex:1;}
  .jw-out-print .field{display:flex;align-items:flex-start;margin:10px 0;}
  .jw-out-print .field .lbl{font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;}
  .jw-out-print .party .field .lbl{width:92px;}
  .jw-out-print .outward .field .lbl{width:108px;}
  .jw-out-print .field .colon{font-weight:700;margin:0 10px 0 0;}
  .jw-out-print .field .ul{flex:1;border-bottom:1px solid var(--field);min-height:15px;font-size:13px;font-weight:600;padding-bottom:1px;line-height:1.2;}
  .jw-out-print .field.tall{margin-bottom:0;}
  .jw-out-print .ul-extra{border-bottom:1px solid var(--field);height:15px;margin:11px 0 11px 102px;font-size:12px;font-weight:600;line-height:15px;}
  .jw-out-print .party-spacer{height:10px;}
  .jw-out-print .section{margin-top:11px;}
  .jw-out-print table{width:100%;border-collapse:collapse;}
  .jw-out-print .mat{border:1.5px solid var(--grid);border-radius:10px;overflow:hidden;}
  .jw-out-print .mat th{background:var(--navy);color:#fff;font-size:12px;font-weight:700;padding:11px 4px;line-height:1.15;border-right:1px solid #3a55a8;text-align:center;}
  .jw-out-print .mat th:last-child{border-right:none;}
  .jw-out-print .mat td{border:1px solid var(--grid);height:39px;text-align:center;font-size:13px;font-weight:700;color:var(--ink);}
  .jw-out-print .mat td:first-child,.jw-out-print .mat th:first-child{border-left:none;}
  .jw-out-print .mat td:last-child,.jw-out-print .mat th:last-child{border-right:none;}
  .jw-out-print .mat tr:last-child td{border-bottom:none;}
  .jw-out-print .mat .sr{width:8%;}
  .jw-out-print .mat .grade{width:18%;}
  .jw-out-print .mat .total-cell{text-align:left;padding-left:14px;font-size:13.5px;font-weight:700;}
  .jw-out-print .note-line{border:1.5px solid var(--box-border);border-radius:10px;padding:9px 16px;margin-top:10px;font-size:13px;font-weight:600;color:var(--ink);}
  .jw-out-print .note-line b{color:var(--orange);font-weight:700;}
  .jw-out-print .bottom-row{display:flex;gap:18px;margin-top:11px;}
  .jw-out-print .labour{width:46%;}
  .jw-out-print .note-col{flex:1;}
  .jw-out-print .lab-table{border:1.5px solid var(--grid);border-radius:10px;overflow:hidden;}
  .jw-out-print .lab-table th{color:var(--navy);font-size:12.5px;font-weight:700;padding:9px 6px;border:1px solid var(--grid);text-align:center;background:#fff;}
  .jw-out-print .lab-table th:first-child{border-left:none;}
  .jw-out-print .lab-table th:last-child{border-right:none;}
  .jw-out-print .lab-table td{border:1px solid var(--grid);padding:7px 8px;font-size:12.5px;font-weight:700;color:var(--ink);height:38px;text-align:center;}
  .jw-out-print .lab-table td:first-child{border-left:none;text-align:left;}
  .jw-out-print .lab-table td:last-child{border-right:none;}
  .jw-out-print .lab-table tr:last-child td{border-bottom:none;}
  .jw-out-print .inp{
    display:block;width:100%;height:24px;border:1.3px solid var(--box-border);
    border-radius:6px;background:#fff;
  }
  .jw-out-print .total-lab{text-align:right;font-weight:700;font-size:13px;color:var(--ink);}
  .jw-out-print .note-card{border:1.5px solid var(--box-border);border-radius:10px;padding:14px 16px 16px;height:100%;}
  .jw-out-print .note-card .rm{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:12px;}
  .jw-out-print .note-card .rl{border-bottom:1px solid var(--field);height:16px;margin:11px 0;font-size:12px;font-weight:600;line-height:16px;}
  .jw-out-print .footer{margin-top:14px;}
  .jw-out-print .frow{display:flex;gap:36px;margin:8px 0;}
  .jw-out-print .fcell{flex:1;display:flex;align-items:flex-end;}
  .jw-out-print .fcell .fl{font-size:12.5px;font-weight:700;color:var(--ink);white-space:nowrap;}
  .jw-out-print .fcell .fc{font-weight:700;margin:0 8px;}
  .jw-out-print .fcell .fu{flex:1;border-bottom:1px solid var(--field);height:14px;font-size:12px;font-weight:600;line-height:14px;}

  @media print{
    @page{size:A4;margin:0;}
    .jw-out-print{background:#fff;}
    .jw-out-print .page{margin:0;border-radius:0;border:2px solid var(--navy);box-shadow:none;width:210mm;height:297mm;}
  }
`;
