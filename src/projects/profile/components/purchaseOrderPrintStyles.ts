export const PO_PRINT_AREA_ID = 'po-print-area';
export const PO_PDF_CAPTURE_ID = 'po-pdf-capture-area';
export const PO_BLANK_PRINT_AREA_ID = 'po-blank-print-area';
export const PO_PRINT_WIDTH_PX = Math.round((210 * 96) / 25.4);
export const PO_PRINT_HEIGHT_PX = Math.round((297 * 96) / 25.4);
/** Inner sheet — 194mm × 281mm at 96dpi */
export const PO_SHEET_WIDTH_PX = Math.round((194 * 96) / 25.4);
export const PO_SHEET_HEIGHT_PX = Math.round((281 * 96) / 25.4);
export const PO_SHEET_MARGIN_PX = Math.round((7.5 * 96) / 25.4);
export const PO_SHEET_PAD_X_PX = Math.round((10 * 96) / 25.4);
export const PO_SHEET_PAD_TOP_PX = Math.round((8 * 96) / 25.4);
export const PO_SHEET_PAD_BOTTOM_PX = Math.round((9 * 96) / 25.4);
export const PO_EDGE_BAND_PX = 10;
export const PO_BODY_PAD_TOP_PX = 24;
export const PO_BODY_PAD_X_PX = 32;
export const PO_BODY_PAD_BOTTOM_PX = 10;
/** Max scale for one-page fit; larger base fonts, auto-shrink when needed */
export const PO_BODY_FIT_SCALE = 0.98;

export const PO_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap';

/** Legacy — PO v3 uses inline SVG icons */
export const PO_FA_LINK =
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';

/** Jagdamba Profile PO — Poppins navy/orange sheet, A4 one-page fit */
export const PO_PRINT_STYLES = `
  #${PO_PRINT_AREA_ID} {
    --blue-primary: #0076df;
    --orange-primary: #ff5500;
    --blue-light: #e6f2ff;
    --orange-light: #fff0e6;
    --text-dark: #000000;
    --border-color: #0076df;
    --grid-border: #a2c6ec;
    font-family: 'Roboto', sans-serif;
    color: var(--text-dark);
    width: ${PO_PRINT_WIDTH_PX}px;
    min-width: ${PO_PRINT_WIDTH_PX}px;
    max-width: ${PO_PRINT_WIDTH_PX}px;
    height: ${PO_PRINT_HEIGHT_PX}px;
    min-height: ${PO_PRINT_HEIGHT_PX}px;
    max-height: ${PO_PRINT_HEIGHT_PX}px;
    margin: 0 auto;
    background-color: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${PO_PRINT_AREA_ID} *,
  #${PO_PRINT_AREA_ID} *::before,
  #${PO_PRINT_AREA_ID} *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${PO_PRINT_AREA_ID} .page-container {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    padding: 25px;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  /* --- Header Section --- */
  #${PO_PRINT_AREA_ID} .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5px;
  }

  #${PO_PRINT_AREA_ID} .company-logo-zone {
    width: 55%;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .company-title-main {
    font-size: 42px;
    font-weight: 900;
    color: var(--blue-primary) !important;
    line-height: 1;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .company-title-sub {
    font-size: 38px;
    font-weight: 900;
    color: var(--orange-primary) !important;
    line-height: 1;
    margin-bottom: 8px;
  }

  #${PO_PRINT_AREA_ID} .company-tagline {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-dark) !important;
    word-spacing: 1px;
  }

  #${PO_PRINT_AREA_ID} .company-contact-zone {
    width: 45%;
    border-left: 2px solid var(--blue-primary) !important;
    padding-left: 15px;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .right-header-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--blue-primary) !important;
    margin-bottom: 5px;
  }

  #${PO_PRINT_AREA_ID} .contact-row {
    font-size: 12px;
    margin-bottom: 5px;
    color: var(--text-dark) !important;
  }
  
  #${PO_PRINT_AREA_ID} .contact-row strong {
    display: inline-block;
    width: 65px;
  }

  #${PO_PRINT_AREA_ID} .contact-row span.label-box {
    background-color: var(--blue-primary) !important;
    color: white !important;
    font-size: 9px;
    padding: 1px 3px;
    border-radius: 2px;
    font-weight: bold;
    margin-right: 5px;
  }

  /* --- Purchase Order Banner Row --- */
  #${PO_PRINT_AREA_ID} .po-title-bar {
    position: relative;
    text-align: center;
    margin: 15px 0;
  }

  #${PO_PRINT_AREA_ID} .po-title-bar::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 2px;
    background-color: var(--orange-primary) !important;
    z-index: 1;
  }

  #${PO_PRINT_AREA_ID} .po-title-box {
    position: relative;
    display: inline-block;
    background: white !important;
    padding: 0 15px;
    z-index: 2;
  }

  #${PO_PRINT_AREA_ID} .po-title-text {
    border: 2px solid var(--blue-primary) !important;
    color: var(--blue-primary) !important;
    font-size: 22px;
    font-weight: 900;
    padding: 4px 30px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .supplier-badge {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    border: 1px solid var(--orange-primary) !important;
    color: var(--orange-primary) !important;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    background: white !important;
    z-index: 2;
    border-radius: 4px;
  }

  /* --- Meta Info Bar (PO No & Date) --- */
  #${PO_PRINT_AREA_ID} .meta-info-bar {
    border: 2px solid #b0b0b0 !important;
    border-radius: 6px;
    padding: 6px 15px;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 12px;
  }

  /* --- Details Blocks (3 Columns) --- */
  #${PO_PRINT_AREA_ID} .details-grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr 1.1fr;
    gap: 12px;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .details-card {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    background: #fff !important;
  }

  #${PO_PRINT_AREA_ID} .details-card.orange-theme {
    border-color: var(--orange-primary) !important;
  }

  #${PO_PRINT_AREA_ID} .card-header {
    background-color: var(--blue-primary) !important;
    color: white !important;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    padding: 5px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .card-header.orange-bg {
    background-color: var(--orange-primary) !important;
  }

  #${PO_PRINT_AREA_ID} .card-body {
    padding: 10px 8px;
    font-size: 11px;
    line-height: 1.5;
  }

  #${PO_PRINT_AREA_ID} .info-table {
    width: 100%;
    border-collapse: collapse;
  }

  #${PO_PRINT_AREA_ID} .info-table td {
    padding: 4px 2px;
    vertical-align: top;
  }

  #${PO_PRINT_AREA_ID} .info-table td.lbl {
    font-weight: 500;
    color: #333 !important;
    width: 95px;
  }
  
  #${PO_PRINT_AREA_ID} .info-table td.cln {
    width: 10px;
    text-align: center;
  }

  #${PO_PRINT_AREA_ID} .info-table td.val {
    font-weight: 700;
    color: #000 !important;
  }

  /* Transport sub-block within right column */
  #${PO_PRINT_AREA_ID} .transport-block {
    margin-top: 10px;
    border-top: 1.5px solid var(--blue-primary) !important;
  }

  /* --- Item Details Table --- */
  #${PO_PRINT_AREA_ID} .items-section {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .items-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
    font-size: 10px;
  }

  #${PO_PRINT_AREA_ID} .items-table th {
    background-color: var(--blue-primary) !important;
    color: white !important;
    font-weight: 700;
    padding: 6px 3px;
    border: 1px solid #ffffff !important;
    font-size: 9.5px;
  }

  #${PO_PRINT_AREA_ID} .items-table td {
    border: 1px solid var(--grid-border) !important;
    padding: 4px 4px;
    height: 24px;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .items-table tr.blank-row td {
    color: transparent !important;
  }

  /* Table Summary Row */
  #${PO_PRINT_AREA_ID} .table-summary-bar {
    background-color: var(--blue-light) !important;
    border-top: 1.5px solid var(--blue-primary) !important;
    padding: 6px 10px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 700;
    color: var(--blue-primary) !important;
  }

  /* --- Bottom Section (Terms & Summary) --- */
  #${PO_PRINT_AREA_ID} .bottom-grid {
    display: grid;
    grid-template-columns: 1.35fr 1.1fr;
    gap: 15px;
    margin-bottom: 15px;
  }

  #${PO_PRINT_AREA_ID} .terms-box {
    border: 1.5px solid var(--orange-primary) !important;
    border-radius: 6px;
    overflow: hidden;
  }

  #${PO_PRINT_AREA_ID} .terms-header {
    background-color: var(--orange-primary) !important;
    color: white !important;
    padding: 6px 10px;
    font-weight: 700;
    font-size: 13px;
  }

  #${PO_PRINT_AREA_ID} .terms-body {
    padding: 8px;
    font-size: 10.5px;
    line-height: 1.4;
    font-weight: 500;
  }

  #${PO_PRINT_AREA_ID} .terms-list {
    list-style: none;
    margin-bottom: 8px;
    margin-top: 0;
    padding-left: 0;
  }

  #${PO_PRINT_AREA_ID} .terms-list li {
    margin-bottom: 3px;
    position: relative;
    padding-left: 15px;
  }

  #${PO_PRINT_AREA_ID} .terms-list li::before {
    content: attr(data-num);
    position: absolute;
    left: 0;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .note-box {
    background-color: var(--orange-light) !important;
    border-radius: 4px;
    padding: 6px;
    font-size: 10px;
  }
  #${PO_PRINT_AREA_ID} .note-box span.note-lbl {
    color: var(--orange-primary) !important;
    font-weight: 700;
  }

  /* Financial Summary Box */
  #${PO_PRINT_AREA_ID} .financial-box {
    border: 1.5px solid var(--blue-primary) !important;
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  #${PO_PRINT_AREA_ID} .financial-header {
    background-color: var(--blue-primary) !important;
    color: white !important;
    padding: 6px 10px;
    font-weight: 700;
    font-size: 13px;
  }

  #${PO_PRINT_AREA_ID} .financial-rows {
    padding: 5px 10px;
  }

  #${PO_PRINT_AREA_ID} .fin-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    padding: 5px 0;
    font-weight: 700;
  }

  #${PO_PRINT_AREA_ID} .fin-row .lbl { width: 50%; }
  #${PO_PRINT_AREA_ID} .fin-row .cln { width: 10%; text-align: center; }
  #${PO_PRINT_AREA_ID} .fin-row .val { width: 40%; text-align: right; }

  #${PO_PRINT_AREA_ID} .grand-total-bar {
    background-color: var(--blue-primary) !important;
    color: white !important;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    font-size: 16px;
    font-weight: 700;
  }

  /* --- Acknowledgement Section --- */
  #${PO_PRINT_AREA_ID} .ack-section {
    margin-top: 10px;
  }

  #${PO_PRINT_AREA_ID} .ack-banner {
    position: relative;
    text-align: center;
    margin-bottom: 12px;
  }

  #${PO_PRINT_AREA_ID} .ack-banner::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1px;
    border-top: 1.5px dashed var(--blue-primary) !important;
    z-index: 1;
  }

  #${PO_PRINT_AREA_ID} .ack-badge {
    position: relative;
    display: inline-block;
    background-color: var(--orange-primary) !important;
    color: white !important;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 20px;
    z-index: 2;
    border-radius: 2px;
    letter-spacing: 0.5px;
  }

  #${PO_PRINT_AREA_ID} .ack-body {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.6;
    padding: 0 5px;
  }

  #${PO_PRINT_AREA_ID} .ack-left {
    width: 50%;
  }

  #${PO_PRINT_AREA_ID} .ack-right {
    width: 45%;
    text-align: left;
  }
  
  #${PO_PRINT_AREA_ID} .sign-line {
    margin-top: 15px;
    border-bottom: 1px solid #000 !important;
    display: inline-block;
    width: 180px;
  }

  /* --- Bottom Footer Bar --- */
  #${PO_PRINT_AREA_ID} .footer-bar {
    margin-top: auto;
    background: linear-gradient(to right, var(--orange-primary) 45%, var(--blue-primary) 45%) !important;
    color: white !important;
    display: flex;
    justify-content: space-between;
    padding: 6px 15px;
    font-size: 12px;
    font-weight: 700;
    border-radius: 2px;
  }

  #${PO_PRINT_AREA_ID} .footer-left {
    width: 40%;
  }

  #${PO_PRINT_AREA_ID} .footer-right {
    width: 60%;
    display: flex;
    justify-content: space-around;
  }

  #${PO_PRINT_AREA_ID} .footer-right span::before {
    content: "●";
    margin-right: 5px;
    color: var(--orange-primary) !important;
  }

  #${PO_PDF_CAPTURE_ID} {
    width: ${PO_PRINT_WIDTH_PX}px !important;
    min-width: ${PO_PRINT_WIDTH_PX}px !important;
    max-width: ${PO_PRINT_WIDTH_PX}px !important;
    height: ${PO_PRINT_HEIGHT_PX}px !important;
    min-height: ${PO_PRINT_HEIGHT_PX}px !important;
    max-height: ${PO_PRINT_HEIGHT_PX}px !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  #${PO_PDF_CAPTURE_ID} .page-container {
    width: 100% !important;
    height: 100% !important;
    min-height: 100% !important;
    max-height: 100% !important;
    margin: 0 !important;
    padding: 25px !important;
    border-radius: 0 !important;
    box-sizing: border-box !important;
  }

  @page po-print-page {
    size: A4;
    margin: 0;
  }

  @media print {
    #${PO_PRINT_AREA_ID} {
      page: po-print-page;
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    #${PO_PRINT_AREA_ID} .page-container {
      width: 100% !important;
      height: 100% !important;
      min-height: 297mm !important;
      max-height: 297mm !important;
      margin: 0 !important;
      padding: 25px !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      page-break-after: avoid;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    #${PO_PRINT_AREA_ID} .footer-bar {
      margin-top: auto !important;
    }
  }
`;
