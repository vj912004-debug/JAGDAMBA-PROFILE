export const WORKER_CUTTING_LIST_PRINT_STYLES = `
  .wcl-print {
    --navy:#1b2a4a;
    --orange:#ec7a2c;
    --ink:#1c1c1c;
    --line:#9aa0a8;
    --line-dark:#3a3f47;
    width:210mm;
    min-height:297mm;
    margin:0 auto;
    background:#fff;
    padding:11mm 10mm 9mm;
    position:relative;
    overflow:hidden;
    font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;
    color:var(--ink);
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    box-sizing:border-box;
  }
  .wcl-print *{ margin:0;padding:0;box-sizing:border-box; }
  .wcl-print .top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding-bottom:10px;}
  .wcl-print .brand{display:flex;align-items:center;gap:10px;padding-top:6px;flex:0 0 auto;}
  .wcl-print .logo{width:56px;height:56px;flex:0 0 auto;}
  .wcl-print .name{line-height:1;}
  .wcl-print .name .b1{font-size:21px;font-weight:800;letter-spacing:.5px;color:var(--navy);}
  .wcl-print .name .b2{font-size:12px;font-weight:700;letter-spacing:5px;color:var(--orange);margin-top:5px;padding-left:2px;}
  .wcl-print .title{text-align:center;padding:8px 18px 0;flex:1 1 auto;min-width:0;}
  .wcl-print .title h1{font-size:24px;font-weight:800;letter-spacing:0;color:#111;line-height:1.05;white-space:nowrap;}
  .wcl-print .title .sub{font-size:14px;color:#222;margin-top:6px;}
  .wcl-print .meta{border:1.5px solid var(--ink);border-radius:4px;padding:7px 10px;min-width:166px;flex:0 0 auto;font-size:11.5px;}
  .wcl-print .meta .row{display:flex;align-items:baseline;padding:2.5px 0;}
  .wcl-print .meta .row .k{width:70px;font-weight:700;color:#222;}
  .wcl-print .meta .row .c{width:9px;color:#222;}
  .wcl-print .meta .row .v{color:#222;white-space:nowrap;}
  .wcl-print .info{display:flex;border:1.5px solid var(--ink);border-radius:5px;margin-top:4px;}
  .wcl-print .info .col{flex:1;padding:12px 16px;}
  .wcl-print .info .col.left{border-right:1.5px solid var(--ink);flex:0 0 44%;}
  .wcl-print .info .line{display:flex;align-items:baseline;padding:6px 0;font-size:14px;}
  .wcl-print .info .line .k{font-weight:700;}
  .wcl-print .info .col.left .line .k{width:128px;}
  .wcl-print .info .col.right .line .k{width:118px;}
  .wcl-print .info .line .c{width:14px;}
  .wcl-print .info .col.right .line .k.pri{width:auto;margin-left:30px;padding-left:20px;}
  .wcl-print .info .inline{display:flex;align-items:baseline;}
  .wcl-print table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px;}
  .wcl-print thead th{border:1px solid var(--line-dark);padding:12px 6px;font-weight:700;color:#111;line-height:1.25;vertical-align:middle;}
  .wcl-print tbody td{border:1px solid var(--line);padding:9px 8px;text-align:center;color:#1d1d1d;white-space:nowrap;}
  .wcl-print tbody td.item,.wcl-print tbody td.party{text-align:left;padding-left:14px;}
  .wcl-print col.c-sr{width:9%;}
  .wcl-print col.c-item{width:17%;}
  .wcl-print col.c-grade{width:11%;}
  .wcl-print col.c-th{width:12%;}
  .wcl-print col.c-w{width:11%;}
  .wcl-print col.c-l{width:11%;}
  .wcl-print col.c-nos{width:8%;}
  .wcl-print col.c-party{width:21%;}
  .wcl-print tfoot td{border:1px solid var(--line);padding:11px 8px;font-weight:700;color:#111;}
  .wcl-print tfoot .label{text-align:right;padding-right:30px;}
  .wcl-print tfoot .total{text-align:center;}
  .wcl-print .note{border:1.5px solid var(--ink);border-radius:5px;margin-top:16px;padding:12px 16px;font-size:13.5px;line-height:1.7;}
  .wcl-print .note .head{font-weight:700;margin-bottom:2px;}
  .wcl-print .sign{display:flex;justify-content:space-between;margin-top:34px;padding:0 8px;font-size:14px;}
  .wcl-print .sign .block{width:230px;text-align:center;}
  .wcl-print .sign .block .lbl{margin-bottom:34px;}
  .wcl-print .sign .block .ln{border-top:1px solid #333;}
  .wcl-print .thanks{text-align:center;font-weight:700;font-size:15px;margin-top:-22px;letter-spacing:1px;}
  @media print{
    .wcl-print{margin:0;width:auto;min-height:auto;padding:8mm;}
  }
`;
