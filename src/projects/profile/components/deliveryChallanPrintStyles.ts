export const DELIVERY_CHALLAN_PRINT_STYLES = `
  .dc-print {
    --navy:#16245f;
    --navy2:#1d2a6b;
    --orange:#f1721c;
    --blue:#1f5fc4;
    --ink:#23262b;
    --soft:#d8dde4;
    --rowline:#e3e7ec;
    width:210mm;
    min-height:297mm;
    margin:0 auto;
    background:#fff;
    position:relative;
    overflow:hidden;
    border:3px solid var(--orange);
    font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;
    color:var(--ink);
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    box-sizing:border-box;
  }
  .dc-print *{ margin:0;padding:0;box-sizing:border-box; }
  .dc-print .pad{ padding:0 9mm; }
  .dc-print .header{ position:relative; padding:7mm 9mm 4mm; }
  .dc-print .corner-tr{ position:absolute; top:0; right:0; width:132px; height:104px; }
  .dc-print .head-grid{ display:flex; align-items:stretch; }
  .dc-print .h-brand{ flex:0 0 auto; padding-right:18px; }
  .dc-print .h-brand .row1{ display:flex; align-items:center; gap:13px; }
  .dc-print .h-brand .logo{ width:74px; height:74px; flex:0 0 auto; }
  .dc-print .h-brand .wm .l1{ font-size:34px; font-weight:800; color:var(--navy); letter-spacing:1px; line-height:1; }
  .dc-print .h-brand .wm .l2{ font-size:21px; font-weight:800; color:var(--orange); letter-spacing:9px; margin-top:4px; }
  .dc-print .h-brand .iso{ font-size:10.5px; font-weight:700; color:#2b2b2b; letter-spacing:2px; margin-top:9px; text-align:center; }
  .dc-print .vline{ width:1px; background:#cfd4da; margin:4px 0; flex:0 0 auto; }
  .dc-print .h-contact{ flex:1 1 auto; padding:6px 16px 0 18px; }
  .dc-print .h-contact .cl{ display:flex; align-items:flex-start; gap:11px; padding:5px 0; font-size:12.5px; color:#2a2d33; }
  .dc-print .h-contact .cl svg{ width:15px; height:15px; flex:0 0 auto; margin-top:1px; }
  .dc-print .h-contact .cl span{ line-height:1.35; }
  .dc-print .h-gst{ flex:0 0 auto; padding:14px 30px 0 18px; min-width:150px; }
  .dc-print .h-gst .lbl{ font-size:14px; font-weight:700; color:var(--orange); letter-spacing:.5px; }
  .dc-print .h-gst .val{ font-size:15px; font-weight:800; color:var(--navy); margin-top:7px; letter-spacing:.3px; white-space:nowrap; }
  .dc-print .head-rule{ height:3px; background:var(--navy); margin:3mm 0 0; }
  .dc-print .title-band{ display:flex; align-items:center; justify-content:center; gap:14px; padding:5mm 0 4mm; }
  .dc-print .title-band h1{ font-size:30px; font-weight:800; color:var(--navy); letter-spacing:1px; }
  .dc-print .tl{ height:3px; width:120px; background:var(--navy); }
  .dc-print .hash{ display:flex; gap:3px; }
  .dc-print .hash i{ display:block; width:5px; height:17px; transform:skewX(-20deg); }
  .dc-print .hash.o i{ background:var(--orange); }
  .dc-print .hash.n i{ background:var(--navy); }
  .dc-print .cards{ display:flex; gap:10px; }
  .dc-print .card{ border:1px solid var(--soft); border-radius:6px; overflow:hidden; }
  .dc-print .card.challan{ flex:1.04; }
  .dc-print .card.party{ flex:0.96; }
  .dc-print .card .ch{ background:var(--orange); color:#fff; font-size:13px; font-weight:700; letter-spacing:.5px; padding:8px 14px; }
  .dc-print .card .cb{ padding:6px 14px 10px; }
  .dc-print .grid2{ display:flex; flex-wrap:wrap; }
  .dc-print .grid2 .f{ display:flex; align-items:baseline; padding:9px 0; font-size:10.5px; white-space:nowrap; }
  .dc-print .grid2 .f.a{ width:56%; padding-right:10px; }
  .dc-print .grid2 .f.b{ width:44%; }
  .dc-print .grid2 .f .k{ color:#2c2f35; }
  .dc-print .grid2 .f .c{ width:12px; text-align:center; color:#2c2f35; }
  .dc-print .grid2 .f .v{ color:var(--blue); font-weight:700; }
  .dc-print .grid2 .f.a .k{ width:84px; }
  .dc-print .grid2 .f.b .k{ width:62px; }
  .dc-print .party .prow{ display:flex; align-items:baseline; padding:8.5px 0; font-size:10.5px; border-bottom:1px solid var(--rowline); }
  .dc-print .party .prow:last-child{ border-bottom:none; }
  .dc-print .party .prow .k{ width:102px; color:#2c2f35; flex:0 0 auto; }
  .dc-print .party .prow .c{ width:12px; color:#2c2f35; flex:0 0 auto; }
  .dc-print .party .prow .v{ color:var(--blue); font-weight:700; line-height:1.45; white-space:nowrap; }
  .dc-print .party .prow .v.wrap{ white-space:normal; }
  .dc-print .mat-head{ background:var(--navy); color:#fff; font-size:13px; font-weight:700; letter-spacing:.5px; padding:9px 14px; border-radius:6px 6px 0 0; margin-top:11px; }
  .dc-print table{ width:100%; border-collapse:collapse; font-size:12px; }
  .dc-print thead.cols th{ background:var(--navy2); color:#fff; font-weight:700; padding:9px 4px; line-height:1.25; border:1px solid #2c3a82; vertical-align:middle; }
  .dc-print tbody td{ border:1px solid var(--rowline); padding:9px 4px; text-align:center; color:#23262b; }
  .dc-print tbody td.l{ text-align:left; padding-left:14px; }
  .dc-print tbody tr:nth-child(even){ background:#f7f9fc; }
  .dc-print td.sr{ font-weight:700; }
  .dc-print col.c1{width:7%} .dc-print col.c2{width:16%} .dc-print col.c3{width:10%} .dc-print col.c4{width:11%}
  .dc-print col.c5{width:12%} .dc-print col.c6{width:12%} .dc-print col.c7{width:8%} .dc-print col.c8{width:13%} .dc-print col.c9{width:11%}
  .dc-print .mid{ display:flex; gap:10px; margin-top:11px; align-items:flex-start; }
  .dc-print .remark{ flex:1; border:1px solid var(--soft); border-radius:6px; min-height:128px; }
  .dc-print .remark .rt{ font-size:12.5px; font-weight:700; color:#2c2f35; padding:10px 12px 0; }
  .dc-print .remark .rb{ font-size:11.5px; color:#33363c; padding:6px 12px 10px; line-height:1.5; white-space:pre-wrap; }
  .dc-print .totals{ flex:0 0 46%; border:1px solid var(--soft); border-radius:6px; overflow:hidden; }
  .dc-print .totals .tr{ display:flex; border-bottom:1px solid var(--rowline); }
  .dc-print .totals .tr:last-child{ border-bottom:none; }
  .dc-print .totals .tr .tk{ flex:1; padding:11px 16px; font-size:13px; font-weight:700; color:#23262b; }
  .dc-print .totals .tr .tv{ flex:0 0 36%; padding:11px 16px; font-size:14px; font-weight:800; color:var(--blue); border-left:1px solid var(--rowline); }
  .dc-print .totals .tr:nth-child(odd){ background:#f7f9fc; }
  .dc-print .foot-grid{ display:flex; gap:10px; margin-top:11px; align-items:stretch; }
  .dc-print .terms{ flex:1.15; border:1px solid var(--soft); border-radius:6px; padding:0 14px 12px; position:relative; }
  .dc-print .terms .th{ display:flex; align-items:center; gap:8px; padding:11px 0 7px; }
  .dc-print .terms .th .ic{ width:24px; height:24px; flex:0 0 auto; }
  .dc-print .terms .th .tt{ font-size:12px; font-weight:700; color:var(--navy); letter-spacing:.3px; white-space:nowrap; }
  .dc-print .terms ol{ margin-left:4px; padding-left:14px; }
  .dc-print .terms li{ font-size:11.5px; color:#33363c; line-height:1.5; padding:2px 0; }
  .dc-print .sign{ flex:1; border:1px solid var(--soft); border-radius:6px; padding:12px 12px 10px; display:flex; flex-direction:column; align-items:center; }
  .dc-print .sign .si{ width:36px; height:36px; margin-bottom:4px; }
  .dc-print .sign .sl{ font-size:13px; font-weight:700; color:var(--orange); margin-bottom:38px; }
  .dc-print .sign .line{ width:100%; border-top:1px solid #9aa0a8; padding-top:5px; text-align:center; font-size:11px; color:#444; }
  .dc-print .footer{ display:flex; margin-top:12px; height:34px; }
  .dc-print .footer .fl{ flex:0 0 40%; background:var(--orange); color:#fff; font-size:13px; font-weight:800; letter-spacing:.5px; display:flex; align-items:center; padding-left:9mm; position:relative; }
  .dc-print .footer .fl:after{ content:""; position:absolute; right:-17px; top:0; bottom:0; width:34px; background:var(--orange); transform:skewX(-20deg); }
  .dc-print .footer .fr{ flex:1; background:var(--navy); color:#fff; font-size:13px; font-weight:800; letter-spacing:.5px; display:flex; align-items:center; justify-content:center; }
  @media print{
    .dc-print{ margin:0; width:auto; min-height:auto; border:none; }
  }
`;
