export const CNC_QUOTATION_PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=Dancing+Script:wght@500;600;700&display=swap');
  :root{--navy:#16216e;--navy-d:#0b1240;--orange:#f15a24;--line:#c4cadd;--grey:#3a3f55;}
  .cnc-q-print{width:210mm;height:297mm;max-width:210mm;overflow:hidden;margin:0;padding:0;
    font-family:'Archivo',Arial,Helvetica,sans-serif;color:var(--navy);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;background:#fff;}
  .cnc-q-print *{margin:0;padding:0;box-sizing:border-box;}
  .cnc-q-print .page{position:relative;width:210mm;height:297mm;background:#fff;overflow:hidden;}
  .cnc-q-print .frameSVG{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;}
  .cnc-q-print .content{position:absolute;inset:0;padding:9mm 11mm 16mm;display:flex;flex-direction:column;z-index:2;overflow:hidden;}
  .cnc-q-print .header{display:flex;justify-content:space-between;align-items:flex-start;padding-left:9mm;}
  .cnc-q-print .brand{flex:1;}
  .cnc-q-print .brand h1{font-weight:800;font-size:47px;letter-spacing:0;line-height:.9;color:var(--navy);white-space:nowrap;}
  .cnc-q-print .tagline{display:flex;align-items:center;gap:9px;margin-top:4px;white-space:nowrap;}
  .cnc-q-print .tagline .dot{width:8px;height:8px;background:var(--orange);transform:rotate(45deg);}
  .cnc-q-print .tagline .ln{height:2.6px;width:30px;background:var(--orange);}
  .cnc-q-print .tagline span.txt{color:var(--orange);font-weight:800;font-size:18.5px;letter-spacing:2.2px;}
  .cnc-q-print .machine{width:138px;height:96px;margin-top:-4px;margin-right:-2px;flex:none;}
  .cnc-q-print .contact{display:flex;align-items:center;gap:5px;flex-wrap:nowrap;padding:0 3mm;margin-top:7px;font-size:8.6px;font-weight:600;color:var(--navy);white-space:nowrap;justify-content:space-between;}
  .cnc-q-print .contact .item{display:flex;align-items:center;gap:3px;}
  .cnc-q-print .contact .ic{width:11.5px;height:11.5px;flex:none;}
  .cnc-q-print .contact .sep{color:var(--line);}
  .cnc-q-print .contact .gstin b{color:var(--navy);font-weight:800;}
  .cnc-q-print .hr-orange{height:2px;background:var(--orange);margin-top:6px;border-radius:2px;}
  .cnc-q-print .titlebar{display:flex;align-items:center;gap:9px;margin:9px 0;}
  .cnc-q-print .deco{display:flex;align-items:center;gap:7px;}
  .cnc-q-print .deco .d{width:9px;height:9px;background:var(--orange);transform:rotate(45deg);flex:none;}
  .cnc-q-print .deco .l{height:2.6px;background:var(--orange);}
  .cnc-q-print .deco.left .l{width:38px;}
  .cnc-q-print .deco.right{flex:1;}
  .cnc-q-print .deco.right .l{flex:1;}
  .cnc-q-print .ribbon{display:flex;align-items:stretch;height:44px;}
  .cnc-q-print .ribbon .cap{width:9px;background:var(--orange);transform:skewX(-15deg);margin:0 2.5px;}
  .cnc-q-print .banner{background:var(--navy);color:#fff;display:flex;align-items:center;padding:0 32px;transform:skewX(-15deg);}
  .cnc-q-print .banner span{display:inline-block;transform:skewX(15deg);font-weight:800;font-size:22px;letter-spacing:.6px;white-space:nowrap;}
  .cnc-q-print .infobox{border:0.5mm solid var(--navy);border-radius:4mm;padding:9px 15px;display:flex;gap:14px;}
  .cnc-q-print .infocol{flex:1;display:flex;flex-direction:column;gap:9px;}
  .cnc-q-print .divider{width:0.5mm;background:var(--navy);align-self:stretch;}
  .cnc-q-print .inforow{display:flex;align-items:flex-end;gap:9px;min-height:26px;}
  .cnc-q-print .icon{width:26px;height:26px;flex:none;background:var(--orange);border-radius:5px;display:flex;align-items:center;justify-content:center;margin-bottom:1px;}
  .cnc-q-print .icon svg{width:15px;height:15px;}
  .cnc-q-print .inforow .lbl{font-weight:700;font-size:13px;color:var(--navy);width:94px;flex:none;line-height:1.15;padding-bottom:5px;}
  .cnc-q-print .inforow .colon{font-weight:700;color:var(--navy);padding-bottom:5px;line-height:1.15;}
  .cnc-q-print .inforow .fill{flex:1;min-height:20px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;font-size:11px;font-weight:700;line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding-bottom:1px;}
  .cnc-q-print .inforow .fill::after{content:'';display:block;width:100%;border-bottom:1.5px solid var(--navy);flex-shrink:0;}
  .cnc-q-print table{width:100%;border-collapse:separate;border-spacing:0;margin-top:9px;border:0.5mm solid var(--navy);border-radius:3mm;overflow:hidden;table-layout:fixed;}
  .cnc-q-print thead th{background:var(--navy);color:#fff;font-weight:700;font-size:11px;line-height:1.1;padding:7px 3px;border-right:1px solid #34409a;text-align:center;vertical-align:middle;}
  .cnc-q-print thead th:last-child{border-right:none;}
  .cnc-q-print tbody td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);height:31px;font-size:10.5px;font-weight:600;text-align:center;padding:2px 4px;vertical-align:middle;}
  .cnc-q-print tbody td:last-child{border-right:none;}
  .cnc-q-print tbody tr:last-child td{border-bottom:none;}
  .cnc-q-print .totals-area{display:flex;gap:14px;margin-top:8px;align-items:flex-start;}
  .cnc-q-print .left-tot{flex:1;display:flex;flex-direction:column;gap:10px;}
  .cnc-q-print .total-nos{border:0.5mm solid var(--orange);border-radius:3mm;padding:9px 13px;display:flex;align-items:center;gap:9px;}
  .cnc-q-print .total-nos b{font-weight:700;font-size:14px;}
  .cnc-q-print .total-nos .fill{flex:1;min-height:18px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;font-size:11px;font-weight:700;line-height:1.2;padding-bottom:1px;}
  .cnc-q-print .total-nos .fill::after{content:'';display:block;width:100%;border-bottom:1.5px solid var(--navy);}
  .cnc-q-print .words{border:0.5mm solid var(--orange);border-radius:3mm;padding:9px 13px;}
  .cnc-q-print .words b{font-weight:700;font-size:14px;}
  .cnc-q-print .words .ln{min-height:15px;margin-top:8px;font-size:11px;font-weight:600;line-height:1.35;padding-bottom:4px;border-bottom:1.5px solid var(--navy);}
  .cnc-q-print .right-tot{width:46%;border:0.5mm solid var(--navy);border-radius:3mm;overflow:hidden;flex:none;}
  .cnc-q-print .right-tot .row{display:flex;justify-content:space-between;align-items:center;padding:9px 15px;font-weight:700;font-size:15px;border-bottom:0.4mm solid var(--navy);}
  .cnc-q-print .right-tot .grand{background:var(--navy);color:#fff;border-bottom:none;padding:11px 15px;font-size:18px;font-weight:800;}
  .cnc-q-print .mid{display:flex;justify-content:space-between;margin-top:8px;}
  .cnc-q-print .terms{max-width:62%;}
  .cnc-q-print .terms h3{color:var(--orange);font-weight:800;font-size:14px;letter-spacing:.4px;margin-bottom:5px;}
  .cnc-q-print .terms ol{list-style:none;}
  .cnc-q-print .terms li{font-size:10px;color:var(--grey);margin-bottom:1px;display:flex;gap:6px;}
  .cnc-q-print .terms li .n{font-weight:600;width:14px;flex:none;}
  .cnc-q-print .terms li b{color:var(--navy);font-weight:700;}
  .cnc-q-print .sign-right{text-align:center;min-width:235px;padding-top:2px;}
  .cnc-q-print .sign-right .forco{color:var(--navy);font-weight:800;font-size:15px;}
  .cnc-q-print .sign-right .sline{border-bottom:1.6px solid var(--navy);height:32px;margin:0 8px;}
  .cnc-q-print .sign-right .scap{font-size:12.5px;font-weight:600;margin-top:5px;}
  .cnc-q-print .sigbox{margin-top:6px;border:0.5mm solid var(--navy);border-radius:3mm;display:flex;flex-shrink:0;}
  .cnc-q-print .sigcell{flex:1;padding:6px 10px 7px;text-align:center;border-right:0.4mm solid var(--navy);}
  .cnc-q-print .sigcell:last-child{border-right:none;}
  .cnc-q-print .sigcell h4{color:var(--navy);font-weight:800;font-size:11.5px;letter-spacing:.5px;margin-bottom:5px;}
  .cnc-q-print .sigcell .stampbox{border:0.5mm solid var(--orange);border-radius:4px;height:24px;width:110px;margin:0 auto 7px;}
  .cnc-q-print .sigcell .field{display:flex;align-items:flex-end;gap:6px;font-size:10.5px;font-weight:600;margin-bottom:4px;}
  .cnc-q-print .sigcell .field .fl{flex:1;min-height:16px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;font-size:10.5px;text-align:left;line-height:1.2;padding-bottom:1px;}
  .cnc-q-print .sigcell .field .fl::after{content:'';display:block;width:100%;border-bottom:1.3px solid var(--navy);}
  .cnc-q-print .sigcell .field .k{width:34px;text-align:left;padding-bottom:4px;}
  .cnc-q-print .footer{margin-top:auto;display:flex;align-items:center;justify-content:center;gap:14px;padding:6px 0 2mm;flex-shrink:0;line-height:1;}
  .cnc-q-print .footer .d{width:8px;height:8px;background:var(--orange);transform:rotate(45deg);flex:none;}
  .cnc-q-print .footer .l{height:2.2px;flex:1;max-width:155px;background:var(--orange);}
  .cnc-q-print .footer .ty{font-family:'Dancing Script','Segoe Script','Brush Script MT',cursive;font-weight:700;font-style:italic;font-size:24px;line-height:1.1;color:var(--navy);white-space:nowrap;}
  @media print{
    @page{size:A4;margin:0;}
    .cnc-q-print{position:absolute!important;left:0!important;top:0!important;width:210mm!important;height:297mm!important;}
  }
`;
