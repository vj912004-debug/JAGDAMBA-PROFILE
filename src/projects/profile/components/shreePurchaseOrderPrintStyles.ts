import {
  PO_PRINT_WIDTH_PX,
  PO_PRINT_HEIGHT_PX,
  PO_BODY_FIT_SCALE,
} from './purchaseOrderPrintStyles';

export const PO_SHREE_FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Oswald:wght@500;600&display=swap';

export function shreePoStylesFor(areaId: string) {
  return `
  #${areaId} {
    --sj-blue: #064b63;
    --sj-orange: #d17524;
    --sj-border: #aeb2b5;
    --sj-text: #222;
    --po-fit-scale: ${PO_BODY_FIT_SCALE};
    font-family: 'Roboto', sans-serif;
    color: var(--sj-text);
    width: ${PO_PRINT_WIDTH_PX}px;
    min-width: ${PO_PRINT_WIDTH_PX}px;
    max-width: ${PO_PRINT_WIDTH_PX}px;
    height: ${PO_PRINT_HEIGHT_PX}px;
    min-height: ${PO_PRINT_HEIGHT_PX}px;
    max-height: ${PO_PRINT_HEIGHT_PX}px;
    margin: 0 auto;
    padding: 0;
    background: #fff;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${areaId} *,
  #${areaId} *::before,
  #${areaId} *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #${areaId} .sj-po-sheet {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    background: #fff;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 14px 22px 10px;
  }

  #${areaId} .po-body-wrap {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  #${areaId} .sj-decor-line-wrap {
    overflow: hidden;
    height: 10px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  #${areaId} .sj-decor-line-wrap.bottom {
    margin-bottom: 0;
    margin-top: 14px;
  }

  #${areaId} .sj-decor-line {
    display: flex;
    width: 100%;
    height: 8px;
    transform: skewX(-45deg);
    transform-origin: left center;
  }
  #${areaId} .sj-decor-line .sj-band-blue { background: var(--sj-blue); flex: 4; margin-right: 5px; }
  #${areaId} .sj-decor-line .sj-band-orange { background: var(--sj-orange); flex: 1; margin-right: 5px; }
  #${areaId} .sj-decor-line .sj-band-blue-short { background: var(--sj-blue); flex: 0.5; }

  #${areaId} .sj-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
    z-index: 2;
  }

  #${areaId} .sj-company-title h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 28px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.15;
    margin: 0;
    font-weight: 600;
  }
  #${areaId} .sj-company-title .sj-title-blue { color: var(--sj-blue); }
  #${areaId} .sj-company-title .sj-title-orange { color: var(--sj-orange); }

  #${areaId} .sj-po-badge-wrap { text-align: center; flex-shrink: 0; }
  #${areaId} .sj-po-badge {
    border: 2px solid var(--sj-blue);
    padding: 6px 16px;
    font-family: 'Oswald', sans-serif;
    color: var(--sj-blue);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 1px;
    border-radius: 8px;
    white-space: nowrap;
  }
  #${areaId} .sj-badge-dots {
    color: var(--sj-blue);
    font-size: 14px;
    line-height: 1;
    margin: 2px 0;
    letter-spacing: 2px;
  }

  #${areaId} .sj-contact-info { font-size: 11px; margin-bottom: 8px; }
  #${areaId} .sj-contact-row {
    display: flex;
    align-items: center;
    margin-bottom: 3px;
    flex-wrap: wrap;
    gap: 2px 8px;
  }
  #${areaId} .sj-contact-row .icon {
    color: var(--sj-blue);
    width: 16px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  #${areaId} .sj-contact-row .icon svg { width: 12px; height: 12px; fill: currentColor; }
  #${areaId} .sj-gst-no { margin-left: 28px; }

  #${areaId} .sj-divider {
    border-top: 1px solid var(--sj-blue);
    position: relative;
    margin: 10px 0 28px;
    display: flex;
    justify-content: center;
  }
  #${areaId} .sj-divider-dots {
    position: absolute;
    top: -7px;
    background: #fff;
    padding: 0 8px;
    display: flex;
    gap: 4px;
  }
  #${areaId} .sj-divider-dots span {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }
  #${areaId} .sj-divider-dots span:nth-child(1) { background: var(--sj-orange); }
  #${areaId} .sj-divider-dots span:nth-child(2) { background: var(--sj-blue); }
  #${areaId} .sj-divider-dots span:nth-child(3) { background: var(--sj-orange); }

  #${areaId} .sj-two-column {
    display: flex;
    gap: 14px;
    margin-bottom: 12px;
  }
  #${areaId} .sj-column {
    flex: 1;
    border: 1px solid var(--sj-border);
    border-radius: 12px;
    padding: 22px 12px 8px;
    position: relative;
  }

  #${areaId} .sj-header-wrapper {
    position: absolute;
    top: -16px;
    left: 14px;
    display: flex;
    align-items: center;
  }
  #${areaId} .sj-section-icon {
    background: #fff;
    border: 2px solid var(--sj-blue);
    color: var(--sj-blue);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }
  #${areaId} .sj-section-icon svg { width: 14px; height: 14px; fill: currentColor; }
  #${areaId} .sj-section-header {
    background: var(--sj-blue);
    color: #fff;
    padding: 5px 16px 5px 20px;
    font-weight: 600;
    font-size: 11px;
    margin-left: -12px;
    z-index: 1;
    box-shadow: 2px 2px 0 var(--sj-orange);
    clip-path: polygon(0 0, 95% 0, 100% 100%, 0% 100%);
    white-space: nowrap;
  }

  #${areaId} .sj-form-group {
    display: flex;
    margin-top: 6px;
    font-size: 11px;
    align-items: center;
    min-height: 18px;
  }
  #${areaId} .sj-form-group.address { align-items: flex-start; }
  #${areaId} .sj-form-label { width: 88px; font-weight: 500; flex-shrink: 0; }
  #${areaId} .sj-form-colon { width: 12px; flex-shrink: 0; }
  #${areaId} .sj-form-input {
    flex: 1;
    border-bottom: 1px solid var(--sj-border);
    min-height: 16px;
    line-height: 16px;
  }
  #${areaId} .sj-form-input.multiline {
    min-height: 48px;
    border-bottom: none;
    background: repeating-linear-gradient(to bottom, transparent, transparent 15px, var(--sj-border) 16px);
  }

  #${areaId} .sj-table-wrap {
    border-radius: 8px;
    border: 1px solid var(--sj-border);
    overflow: hidden;
    margin-bottom: 12px;
  }
  #${areaId} .sj-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  #${areaId} .sj-table th {
    background: var(--sj-blue);
    color: #fff;
    font-weight: 500;
    font-size: 10px;
    padding: 6px 3px;
    border: 1px solid #053b4e;
    text-align: center;
  }
  #${areaId} .sj-table td {
    border: 1px solid var(--sj-border);
    height: 20px;
    text-align: center;
    font-size: 10px;
    font-weight: 500;
  }

  #${areaId} .sj-bottom-details {
    display: flex;
    gap: 14px;
    margin-bottom: 10px;
  }
  #${areaId} .sj-left-details {
    flex: 1;
    border: 1px solid var(--sj-border);
    border-radius: 12px;
    padding: 10px;
  }
  #${areaId} .sj-right-details {
    flex: 1;
    border: 1px solid var(--sj-border);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  #${areaId} .sj-detail-row {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    font-size: 10px;
  }
  #${areaId} .sj-icon-box {
    background: var(--sj-blue);
    color: #fff;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    flex-shrink: 0;
  }
  #${areaId} .sj-icon-box svg { width: 10px; height: 10px; fill: currentColor; }
  #${areaId} .sj-detail-label { width: 96px; font-weight: 500; flex-shrink: 0; }
  #${areaId} .sj-detail-input {
    flex: 1;
    border-bottom: 1px solid var(--sj-border);
    min-height: 14px;
  }

  #${areaId} .sj-charge-row {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    border-bottom: 1px solid var(--sj-border);
    font-size: 10px;
  }
  #${areaId} .sj-charge-row:last-of-type { border-bottom: none; }
  #${areaId} .sj-charge-label { flex: 1; font-weight: 500; }
  #${areaId} .sj-charge-value {
    width: 80px;
    border-left: 1px solid var(--sj-border);
    min-height: 18px;
    padding-left: 6px;
    text-align: right;
  }

  #${areaId} .sj-final-amount {
    display: flex;
    background: var(--sj-blue);
    color: #fff;
    margin-top: auto;
  }
  #${areaId} .sj-final-label {
    flex: 1;
    padding: 7px 10px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    letter-spacing: 1px;
  }
  #${areaId} .sj-final-currency {
    background: var(--sj-orange);
    width: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
  }

  #${areaId} .sj-terms { margin-bottom: 8px; }
  #${areaId} .sj-terms-header-wrap {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  #${areaId} .sj-terms-header {
    background: var(--sj-blue);
    color: #fff;
    padding: 5px 16px 5px 20px;
    font-weight: 600;
    font-size: 10px;
    clip-path: polygon(0 0, 95% 0, 100% 100%, 0% 100%);
    margin-left: -12px;
    z-index: 1;
  }
  #${areaId} .sj-terms-grid {
    display: flex;
    gap: 14px;
    font-size: 9px;
    font-weight: 600;
  }
  #${areaId} .sj-terms-col { flex: 1; }
  #${areaId} .sj-terms-col ol { padding-left: 14px; margin: 0; }
  #${areaId} .sj-terms-col li { margin-bottom: 2px; }

  #${areaId} .sj-signatures {
    display: flex;
    gap: 14px;
    margin-top: 12px;
  }
  #${areaId} .sj-sig-box {
    flex: 1;
    border: 1px solid var(--sj-border);
    border-radius: 8px;
    padding: 20px 12px 8px;
    position: relative;
    min-height: 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  #${areaId} .sj-sig-icon {
    position: absolute;
    left: 14px;
    top: -14px;
    background: var(--sj-blue);
    color: #fff;
    border-radius: 5px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 3px #fff;
  }
  #${areaId} .sj-sig-icon svg { width: 12px; height: 12px; fill: currentColor; }
  #${areaId} .sj-sig-title {
    color: var(--sj-blue);
    font-size: 10px;
    font-weight: 600;
    padding-left: 22px;
  }
  #${areaId} .sj-sig-line {
    display: flex;
    align-items: flex-end;
    font-size: 9px;
    color: #555;
    padding-left: 22px;
  }
  #${areaId} .sj-sig-line span {
    border-bottom: 1px solid var(--sj-text);
    flex: 1;
    margin-left: 8px;
    min-height: 1px;
  }
`;
}
