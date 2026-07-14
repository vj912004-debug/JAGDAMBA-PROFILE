export const ANMS_MTC_PRINT_AREA_ID = 'anms-mtc-print-area';

/** Exact CSS from AM/NS India Mill Test Certificate HTML template */
export const ANMS_MTC_PRINT_STYLES = `
  #${ANMS_MTC_PRINT_AREA_ID} {
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    color: #000;
    background: #f0f0f0;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  #${ANMS_MTC_PRINT_AREA_ID} * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  #${ANMS_MTC_PRINT_AREA_ID} .page {
    width: 285mm;
    min-height: 198mm;
    margin: 8mm auto;
    background: #fff;
    border: 1.5px solid #000;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 14px rgba(0,0,0,.18);
  }

  #${ANMS_MTC_PRINT_AREA_ID} .header { display: flex; border-bottom: 1.5px solid #000; }
  #${ANMS_MTC_PRINT_AREA_ID} .h-logo {
    width: 200px; flex: 0 0 200px;
    border-right: 1.5px solid #000;
    display: flex; align-items: center; justify-content: center;
    padding: 6px;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .amns { line-height: 0.92; text-align: center; }
  #${ANMS_MTC_PRINT_AREA_ID} .amns .am { color: #e2231a; font-weight: 800; font-size: 30px; letter-spacing: .5px; }
  #${ANMS_MTC_PRINT_AREA_ID} .amns .in { color: #e2231a; font-weight: 800; font-size: 23px; letter-spacing: 1px; }

  #${ANMS_MTC_PRINT_AREA_ID} .h-mid {
    flex: 1 1 auto;
    text-align: center;
    padding: 6px 8px 5px;
    border-right: 1.5px solid #000;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .h-mid .co { font-weight: 700; font-size: 12px; }
  #${ANMS_MTC_PRINT_AREA_ID} .h-mid .sub { font-size: 8px; line-height: 1.45; }
  #${ANMS_MTC_PRINT_AREA_ID} .h-mid .mtc { font-weight: 700; font-size: 11px; margin-top: 1px; }
  #${ANMS_MTC_PRINT_AREA_ID} .h-mid .mtc2 { font-weight: 700; font-size: 8px; }

  #${ANMS_MTC_PRINT_AREA_ID} .h-isi {
    width: 170px; flex: 0 0 170px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; padding: 4px;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .h-isi .istop { font-size: 8px; font-weight: 700; }
  #${ANMS_MTC_PRINT_AREA_ID} .h-isi .isbot { font-size: 8px; font-weight: 700; }

  #${ANMS_MTC_PRINT_AREA_ID} .meta { display: flex; border-bottom: 1.5px solid #000; font-size: 9px; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-col { display: flex; flex-direction: column; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-left  { flex: 0 0 33%; border-right: 1.5px solid #000; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-mid   { flex: 1 1 auto; border-right: 1.5px solid #000; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-right { flex: 0 0 22%; padding: 5px 7px; }
  #${ANMS_MTC_PRINT_AREA_ID} .m-row { display: flex; min-height: 19px; align-items: center; padding: 2px 7px; }
  #${ANMS_MTC_PRINT_AREA_ID} .m-label { font-weight: 700; white-space: nowrap; }
  #${ANMS_MTC_PRINT_AREA_ID} .m-val { flex: 1; padding-left: 6px; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-right .to { font-weight: 700; }
  #${ANMS_MTC_PRINT_AREA_ID} .meta-right .to-addr { white-space: pre-wrap; line-height: 1.35; }

  #${ANMS_MTC_PRINT_AREA_ID} .certify {
    font-size: 7.5px; line-height: 1.45; padding: 4px 7px;
    border-bottom: 1.5px solid #000; text-align: justify;
  }

  #${ANMS_MTC_PRINT_AREA_ID} .bar {
    font-weight: 700; font-size: 9.5px;
    padding: 3px 7px; border-bottom: 1px solid #000;
  }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid { border-collapse: collapse; table-layout: fixed; display: table; }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid thead { display: table-header-group; }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid tbody { display: table-row-group; }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid tr { display: table-row; }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid th,
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid td {
    display: table-cell;
    border: 1px solid #000;
    border-top: none;
    font-size: 8px; height: 17px; text-align: center; vertical-align: middle;
    padding: 1px 2px;
  }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid th { font-weight: 700; }
  #${ANMS_MTC_PRINT_AREA_ID} .tbl-wrap { display: flex; border-bottom: 1.5px solid #000; }
  #${ANMS_MTC_PRINT_AREA_ID} .tbl-fill { flex: 1 1 auto; border-bottom: none; }

  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid.heat { width: 942px; flex: 0 0 auto; }
  #${ANMS_MTC_PRINT_AREA_ID} table.mtc-grid.mech { width: 680px; flex: 0 0 auto; }
  #${ANMS_MTC_PRINT_AREA_ID} .heat .c-heatno { width: 110px; }
  #${ANMS_MTC_PRINT_AREA_ID} .heat .c-el { width: 52px; }
  #${ANMS_MTC_PRINT_AREA_ID} .mech .c-item { width: 110px; }
  #${ANMS_MTC_PRINT_AREA_ID} .mech .c-batch { width: 150px; }
  #${ANMS_MTC_PRINT_AREA_ID} .mech .c-num { width: 60px; }
  #${ANMS_MTC_PRINT_AREA_ID} .mech td.lbl-total { font-weight: 700; }

  #${ANMS_MTC_PRINT_AREA_ID} .body-space { flex: 1 1 auto; min-height: 250px; position: relative; }
  #${ANMS_MTC_PRINT_AREA_ID} .watermark {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #ececec; font-weight: 800; line-height: 0.92;
    user-select: none; pointer-events: none;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .watermark span:first-child { font-size: 150px; letter-spacing: 4px; }
  #${ANMS_MTC_PRINT_AREA_ID} .watermark span:last-child { font-size: 150px; letter-spacing: 14px; }

  #${ANMS_MTC_PRINT_AREA_ID} .notes-row { display: flex; border-top: 1.5px solid #000; }
  #${ANMS_MTC_PRINT_AREA_ID} .notes {
    flex: 1 1 auto; padding: 5px 7px; font-size: 7px; line-height: 1.7;
    border-right: 1.5px solid #000;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .legend {
    flex: 0 0 30%; padding: 5px 7px; font-size: 7px; line-height: 1.45;
    border-right: 1.5px solid #000;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .legend .units { padding-top: 8px; }
  #${ANMS_MTC_PRINT_AREA_ID} .desig {
    flex: 0 0 16%; padding: 6px 7px;
    display: flex; align-items: flex-end; font-size: 8px;
  }
  #${ANMS_MTC_PRINT_AREA_ID} .desig b { font-weight: 700; }
  #${ANMS_MTC_PRINT_AREA_ID} .pagefoot { font-size: 8px; padding: 4px 7px; border-top: 1.5px solid #000; }

  @media print {
    @page { size: A4 landscape; margin: 6mm; }
    #${ANMS_MTC_PRINT_AREA_ID} { background: #fff; }
    #${ANMS_MTC_PRINT_AREA_ID} .page { margin: 0; border: 1.5px solid #000; box-shadow: none; }
  }
`;
