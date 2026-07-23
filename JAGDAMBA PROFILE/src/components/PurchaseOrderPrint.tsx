import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';

const ROW_COUNT = 8;

const fmt = (n: number) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = iso.includes('-') ? new Date(iso + 'T12:00:00') : null;
  if (d && !Number.isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return iso;
};

const cell = (v: string | number | undefined) => (v === 0 || v === '0' ? v : v || '');

function splitAddress(raw: string): [string, string, string] {
  const text = raw.replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
  if (!text) return ['', '', ''];
  const parts = text.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [parts[0] || '', '', ''];
  if (parts.length === 2) return [parts[0], parts[1], ''];
  if (parts.length === 3) return [parts[0], parts[1], parts[2]];
  const q = Math.ceil(parts.length / 3);
  return [
    parts.slice(0, q).join(', '),
    parts.slice(q, q * 2).join(', '),
    parts.slice(q * 2).join(', '),
  ];
}

/* ─── Inline SVG Icons (no Font Awesome needed for print) ─── */
const Icon = {
  Location: () => (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 256a64 64 0 1 0 0-128 64 64 0 1 0 0 128z" /></svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64c0 247.4 200.6 448 448 448c18-1.7 33.8-12.1 38.5-29.3l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 297.7 214.3 262.3 144 192l53.9-40.7c13.7-11.1 18.4-30 11.6-46.3l-40-96z" /></svg>
  ),
  Envelope: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" /></svg>
  ),
  User: () => (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden><path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM32 480c0-70.7 57.3-128 128-128h128c70.7 0 128 57.3 128 128v16H32V480z" /></svg>
  ),
  Clipboard: () => (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden><path d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z" /></svg>
  ),
  Crosshairs: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M256 0c17.7 0 32 14.3 32 32v42.7C380.7 79.4 432.6 131.3 437.3 224H480c17.7 0 32 14.3 32 32s-14.3 32-32 32h-42.7C432.6 380.7 380.7 432.6 288 437.3V480c0 17.7-14.3 32-32 32s-32-14.3-32-32v-42.7C131.3 432.6 79.4 380.7 74.7 288H32c-17.7 0-32-14.3-32-32s14.3-32 32-32h42.7C79.4 131.3 131.3 79.4 224 74.7V32c0-17.7 14.3-32 32-32zm0 128a128 128 0 1 0 0 256 128 128 0 1 0 0-256zm0 80a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" /></svg>
  ),
  FileContract: () => (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V160H256c-17.7 0-32-14.3-32-32V0H64zM256 0V128H384L256 0zM80 256h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H80c-8.8 0-16-7.2-16-16s7.2-16 16-16zm54.2 64c-7.4 0-13.5 6.1-13.5 13.5 0 4.3 2 8.2 5.5 10.7l16 12c4.3 3.2 10.2 2.3 13.4-2l18.1-24.1c3.2-4.3 2.3-10.2-2-13.4l-26.2-19.6c-2.5-1.9-5.6-2.9-8.7-2.9H134.2z" /></svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 640 512" fill="currentColor" aria-hidden><path d="M48 0C21.5 0 0 21.5 0 48V368c0 26.5 21.5 48 48 48H64c0 53 43 96 96 96s96-43 96-96H384c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V288 256 224 192l-64-128H384V48c0-26.5-21.5-48-48-48H48zM416 256V192h76.2l32 64H416zM160 464a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm368-48a48 48 0 1 1-96 0 48 48 0 1 1 96 0z" /></svg>
  ),
  IdCard: () => (
    <svg viewBox="0 0 576 512" fill="currentColor" aria-hidden><path d="M0 128C0 92.7 28.7 64 64 64H512c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM176 288a64 64 0 1 0 0-128 64 64 0 1 0 0 128zm-32 32c-44.2 0-80 35.8-80 80c0 8.8 7.2 16 16 16H272c8.8 0 16-7.2 16-16c0-44.2-35.8-80-80-80H144zM352 176H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H352c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H352c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H352c-8.8 0-16-7.2-16-16s7.2-16 16-16z" /></svg>
  ),
  Weight: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M224 96a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm122.8 0c-3.1-44.3-40.2-79.6-85.3-79.6H250.5c-45.1 0-82.2 35.3-85.3 79.6C95.6 108.8 48 166.2 48 234.7V464c0 26.5 21.5 48 48 48H416c26.5 0 48-21.5 48-48V234.7c0-68.5-47.6-125.9-117.2-138.7z" /></svg>
  ),
  TruckRamp: () => (
    <svg viewBox="0 0 640 512" fill="currentColor" aria-hidden><path d="M640 0V400c0 61.9-50.1 112-112 112c-61 0-110.5-48.7-112-109.3L48 528c-13.3 0-24-10.7-24-24s10.7-24 24-24H416V192H64c-35.3 0-64-28.7-64-64s28.7-64 64-64H576c35.3 0 64 28.7 64 64V0H640zM576 464a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" /></svg>
  ),
  TruckFast: () => (
    <svg viewBox="0 0 640 512" fill="currentColor" aria-hidden><path d="M112 0C85.5 0 64 21.5 64 48V96H16c-8.8 0-16 7.2-16 16s7.2 16 16 16H64V192H16c-8.8 0-16 7.2-16 16s7.2 16 16 16H64v64H16c-8.8 0-16 7.2-16 16s7.2 16 16 16H64v64c0 26.5 21.5 48 48 48h32c0 53 43 96 96 96s96-43 96-96H384c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V288 256 224 192l-64-128H448V48c0-26.5-21.5-48-48-48H112zM544 256V192h52.2l32 64H544zM208 464a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm272 0a48 48 0 1 1 0-96 48 48 0 1 1 0 96z" /></svg>
  ),
  Calculator: () => (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden><path d="M64 0C28.7 0 0 28.7 0 64V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zM96 96H288c17.7 0 32 14.3 32 32v32c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V128c0-17.7 14.3-32 32-32zm32 160a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zM224 256a32 32 0 1 1 0 64 32 32 0 1 1 0-64zm64 32a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm32 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM192 352a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
  ),
  Percent: () => (
    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden><path d="M374.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-320 320c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l320-320zM128 128a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zM384 384a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z" /></svg>
  ),
  PenNib: () => (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden><path d="M368.4 18.3L345.8 39.8l1.6 1.6-32 32 1.4 1.4 15.1 15.1 1.4 1.4 32-32 1.6 1.6 21.5-22.6c3.1-3.1 3.1-8.2 0-11.3L379.7 18.3c-3.1-3.1-8.2-3.1-11.3 0zM287.6 78.6L22.9 343.1l-4 120 120-4L358.4 134.4 287.6 78.6z" /></svg>
  ),
};

const TERMS_LEFT = [
  'Goods to be supplied as per specification mentioned.',
  'GST Extra as applicable.',
  'Delivery subject to material availability.',
  'Payment Terms as mutually agreed.',
];

const TERMS_RIGHT = [
  'Material once cut / supplied will not be taken back.',
  'Please mention our Purchase Order No. on all documents.',
  'Test Certificate & Inspection report must be provided with material.',
  'Transport & unloading arrangement shall be as per above terms.',
];

/* ─── Styles (embedded for print independence) ─── */
const PO_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap');

  #po-print-area {
    --po-dark-blue: #14214d;
    --po-orange: #ff5700;
    --po-light-border: #a1abc2;
    --po-text: #000000;
    font-family: 'Roboto', sans-serif;
    color: var(--po-text);
    background: transparent;
    display: block;
    width: 210mm;
    min-width: 210mm;
    max-width: 210mm;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #po-print-area *,
  #po-print-area *::before,
  #po-print-area *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  #po-print-area .po-v2-page {
    width: 100%;
    min-height: 297mm;
    background: #ffffff;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  #po-print-area .po-v2-stripes {
    height: 12px;
    width: 100%;
    flex-shrink: 0;
    background: repeating-linear-gradient(
      45deg,
      var(--po-dark-blue),
      var(--po-dark-blue) 20px,
      #fff 20px,
      #fff 25px,
      var(--po-orange) 25px,
      var(--po-orange) 45px,
      #fff 45px,
      #fff 50px
    );
  }

  #po-print-area .po-v2-content {
    padding: 20px 25px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  #po-print-area .po-v2-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    width: 100%;
  }

  #po-print-area .po-v2-company-title {
    font-family: 'Oswald', sans-serif;
    font-size: 46px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1;
    transform: scaleY(1.1);
    transform-origin: bottom left;
  }

  #po-print-area .po-v2-company-title .blue { color: var(--po-dark-blue); }
  #po-print-area .po-v2-company-title .orange { color: var(--po-orange); }

  #po-print-area .po-v2-po-badge {
    border: 2px solid var(--po-dark-blue);
    border-radius: 8px;
    padding: 2px 20px;
    position: relative;
    margin-top: 10px;
    flex-shrink: 0;
  }

  #po-print-area .po-v2-po-badge::before,
  #po-print-area .po-v2-po-badge::after {
    content: '•••';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 22px;
    letter-spacing: 3px;
    line-height: 0;
    color: var(--po-dark-blue);
  }
  #po-print-area .po-v2-po-badge::before { top: -5px; }
  #po-print-area .po-v2-po-badge::after { bottom: -1px; }

  #po-print-area .po-v2-po-badge h1 {
    font-family: 'Oswald', sans-serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--po-dark-blue);
    margin: 0;
    padding: 8px 0;
    letter-spacing: 0.5px;
  }

  #po-print-area .po-v2-company-info {
    font-size: 13.5px;
    line-height: 1.7;
    margin-bottom: 15px;
    margin-top: 5px;
    width: 100%;
  }

  #po-print-area .po-v2-info-line {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  #po-print-area .po-v2-info-line svg {
    color: var(--po-dark-blue);
    width: 20px;
    height: 16px;
    flex-shrink: 0;
    margin-right: 10px;
  }

  #po-print-area .po-v2-info-line strong { font-weight: 500; }

  #po-print-area .po-v2-divider {
    border-top: 1px solid var(--po-dark-blue);
    position: relative;
    margin: 15px 0 20px 0;
    width: 100%;
  }

  #po-print-area .po-v2-divider-dots {
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 0 10px;
    display: flex;
    gap: 5px;
  }

  #po-print-area .po-v2-divider-dots span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
  }

  #po-print-area .po-v2-dot-blue { background-color: var(--po-dark-blue); }
  #po-print-area .po-v2-dot-orange { background-color: var(--po-orange); }

  #po-print-area .po-v2-form-row {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 15px;
    width: 100%;
  }

  #po-print-area .po-v2-box {
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    flex: 1;
    overflow: hidden;
    position: relative;
    padding-bottom: 10px;
    min-width: 0;
  }

  #po-print-area .po-v2-box-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  #po-print-area .po-v2-box-icon {
    border: 1px solid var(--po-dark-blue);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--po-dark-blue);
    margin: 10px;
    background: #fff;
    z-index: 2;
    flex-shrink: 0;
  }
  #po-print-area .po-v2-box-icon svg {
    width: 20px;
    height: 20px;
    color: var(--po-dark-blue);
  }

  #po-print-area .po-v2-box-title {
    font-family: 'Oswald', sans-serif;
    font-size: 16px;
    letter-spacing: 0.5px;
    background: var(--po-dark-blue);
    height: 32px;
    display: flex;
    align-items: center;
    color: #fff;
    font-weight: 500;
    padding-left: 30px;
    padding-right: 35px;
    clip-path: polygon(0 0, 100% 0, 92% 100%, 0% 100%);
    position: relative;
    margin-left: -20px;
    min-width: 210px;
    border-right: 6px solid var(--po-orange);
    flex: 1;
  }

  #po-print-area .po-v2-form-group {
    display: flex;
    align-items: flex-start;
    padding: 0 15px;
    margin-bottom: 10px;
    font-size: 13.5px;
  }

  #po-print-area .po-v2-form-group label {
    width: 105px;
    font-weight: 500;
    flex-shrink: 0;
    text-transform: none;
  }

  #po-print-area .po-v2-colon {
    margin-right: 10px;
    font-weight: 500;
    flex-shrink: 0;
  }

  #po-print-area .po-v2-form-input {
    flex: 1;
    border-bottom: 1px solid var(--po-text);
    min-height: 18px;
    word-break: break-word;
  }

  #po-print-area .po-v2-multi-line {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }
  #po-print-area .po-v2-multi-line .po-v2-form-input {
    width: 100%;
  }

  /* Items Table */
  #po-print-area .po-v2-items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--po-dark-blue);
    table-layout: fixed;
  }
  #po-print-area .po-v2-items-table th,
  #po-print-area .po-v2-items-table td {
    border: 1px solid var(--po-light-border);
    text-align: center;
    padding: 8px 4px;
    font-size: 13px;
  }
  #po-print-area .po-v2-items-table th {
    background-color: var(--po-dark-blue);
    color: white;
    font-weight: 500;
    border-color: #2a3d75;
    padding: 10px 4px;
  }
  #po-print-area .po-v2-items-table tbody tr {
    height: 28px;
  }
  #po-print-area .po-v2-items-table tbody tr td:first-child {
    font-weight: bold;
  }

  /* Bottom Row */
  #po-print-area .po-v2-bottom-row {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    width: 100%;
  }

  #po-print-area .po-v2-bottom-left {
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    flex: 1;
    padding: 12px 10px;
    min-width: 0;
  }
  #po-print-area .po-v2-bottom-left .po-v2-form-group {
    align-items: center;
    margin-bottom: 14px;
    padding: 0;
  }
  #po-print-area .po-v2-bottom-left .po-v2-detail-icon {
    width: 26px;
    height: 26px;
    background: var(--po-dark-blue);
    color: #fff;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
  }
  #po-print-area .po-v2-bottom-left .po-v2-detail-icon svg {
    width: 13px;
    height: 13px;
    color: #fff;
  }
  #po-print-area .po-v2-bottom-left label {
    width: 125px;
    text-transform: none;
  }

  #po-print-area .po-v2-bottom-right {
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  #po-print-area .po-v2-calc-row {
    display: flex;
    border-bottom: 1px solid var(--po-light-border);
    font-size: 13.5px;
  }
  #po-print-area .po-v2-calc-label {
    flex: 1;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    border-right: 1px solid var(--po-light-border);
    font-weight: 500;
  }
  #po-print-area .po-v2-calc-label svg {
    width: 22px;
    height: 15px;
    color: var(--po-dark-blue);
    margin-right: 8px;
    flex-shrink: 0;
  }
  #po-print-area .po-v2-calc-value {
    width: 130px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-weight: 500;
    flex-shrink: 0;
  }

  #po-print-area .po-v2-final-row {
    display: flex;
    background: var(--po-dark-blue);
    color: #fff;
    margin-top: auto;
  }
  #po-print-area .po-v2-final-label {
    flex: 1;
    padding: 10px;
    text-align: center;
    font-family: 'Oswald', sans-serif;
    font-size: 20px;
    letter-spacing: 1px;
    font-weight: 500;
  }
  #po-print-area .po-v2-final-value {
    width: 130px;
    background: var(--po-orange);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    flex-shrink: 0;
  }

  /* Terms */
  #po-print-area .po-v2-terms-box {
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    margin-bottom: 15px;
    overflow: hidden;
    flex-shrink: 0;
    width: 100%;
  }
  #po-print-area .po-v2-terms-header {
    display: flex;
    align-items: center;
  }
  #po-print-area .po-v2-terms-icon {
    color: var(--po-dark-blue);
    width: 22px;
    height: 22px;
    margin: 10px 10px 10px 15px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #po-print-area .po-v2-terms-icon svg {
    width: 22px;
    height: 22px;
    color: var(--po-dark-blue);
  }
  #po-print-area .po-v2-terms-title {
    font-family: 'Oswald', sans-serif;
    background: var(--po-dark-blue);
    color: #fff;
    padding: 6px 35px 6px 15px;
    font-weight: 500;
    font-size: 16px;
    letter-spacing: 0.5px;
    clip-path: polygon(0 0, 100% 0, 92% 100%, 0% 100%);
    border-right: 6px solid var(--po-orange);
    flex: 1;
  }
  #po-print-area .po-v2-terms-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 10px 15px 15px 15px;
    font-size: 12px;
    font-weight: 600;
    gap: 10px;
  }
  #po-print-area .po-v2-terms-content ol {
    padding-left: 15px;
    margin: 0;
  }
  #po-print-area .po-v2-terms-content li {
    margin-bottom: 6px;
    padding-left: 5px;
  }

  /* Signatures */
  #po-print-area .po-v2-signatures {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 10px;
    flex-shrink: 0;
    width: 100%;
  }
  #po-print-area .po-v2-sig-box {
    border: 1px solid var(--po-dark-blue);
    border-radius: 8px;
    flex: 1;
    padding: 15px;
    display: flex;
    align-items: flex-end;
    position: relative;
    height: 85px;
    min-width: 0;
  }
  #po-print-area .po-v2-sig-icon {
    position: absolute;
    top: 15px;
    left: 15px;
    background: var(--po-dark-blue);
    color: white;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  #po-print-area .po-v2-sig-icon svg {
    width: 13px;
    height: 13px;
    color: #fff;
  }
  #po-print-area .po-v2-sig-text {
    margin-left: 45px;
    width: 100%;
  }
  #po-print-area .po-v2-sig-for {
    color: var(--po-dark-blue);
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 25px;
  }
  #po-print-area .po-v2-sig-line {
    display: flex;
    font-size: 12px;
    align-items: flex-end;
    font-weight: 500;
  }
  #po-print-area .po-v2-sig-line span {
    white-space: nowrap;
  }
  #po-print-area .po-v2-sig-line .line {
    border-bottom: 1px solid var(--po-text);
    flex: 1;
    margin-left: 10px;
  }

  /* Print Rules */
  @page {
    size: A4;
    margin: 0;
  }
  @media print {
    #po-print-area {
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    #po-print-area .po-v2-page {
      box-shadow: none !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      page-break-after: always;
    }
  }
  @media screen {
    #po-print-area .po-v2-page {
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
  }
`;

/* ─── Sub-Components ─── */

const FormRow = ({ label, value }: { label: string; value: string }) => (
  <div className="po-v2-form-group">
    <label>{label}</label>
    <span className="po-v2-colon">:</span>
    <div className="po-v2-form-input">{value || '\u00A0'}</div>
  </div>
);

const DetailRow = ({ icon: Ico, label, value }: { icon: React.FC; label: string; value: string }) => (
  <div className="po-v2-form-group">
    <span className="po-v2-detail-icon"><Ico /></span>
    <label>{label}</label>
    <span className="po-v2-colon">:</span>
    <div className="po-v2-form-input">{value || '\u00A0'}</div>
  </div>
);

/* ─── Main Component ─── */

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const items = po.items || [];
  const rows = Array.from({ length: Math.max(ROW_COUNT, items.length) }, (_, i) => items[i] ?? null);

  const [addr1, addr2, addr3] = splitAddress(po.supplierAddress || '');
  const tcText = po.tc || '';

  const totalKg = po.totalKg || 0;
  const subTotal = po.totalAmount || 0;
  const gstRate = 18;
  const gstAmount = Math.round(subTotal * gstRate / 100 * 100) / 100;
  const grandTotal = Math.round((subTotal + gstAmount) * 100) / 100;

  return (
    <div id="po-print-area">
      <style>{PO_STYLES}</style>
      <div className="po-v2-page">
        <div className="po-v2-stripes" />

        <div className="po-v2-content">
          {/* Header */}
          <div className="po-v2-header">
            <div className="po-v2-company-title">
              <span className="blue">JAGDAMBA</span>{' '}
              <span className="orange">PROFILE</span>
            </div>
            <div className="po-v2-po-badge">
              <h1>PURCHASE ORDER</h1>
            </div>
          </div>

          {/* Company Info */}
          <div className="po-v2-company-info">
            <div className="po-v2-info-line">
              <Icon.Location />
              <span>504/1A GIDC, Makarpura, Vadodara - 390010, Gujarat</span>
            </div>
            <div className="po-v2-info-line">
              <Icon.Phone />
              <span><strong>Mo. :</strong> 9824025001, 9824917250</span>
            </div>
            <div className="po-v2-info-line">
              <Icon.Envelope />
              <span>
                <strong>E-mail :</strong> jagdambaprofile@gmail.com &nbsp;&nbsp;|&nbsp;&nbsp;
                <strong>GST No. :</strong> 24AJGPP9863R1Z5
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="po-v2-divider">
            <div className="po-v2-divider-dots">
              <span className="po-v2-dot-blue" />
              <span className="po-v2-dot-orange" />
              <span className="po-v2-dot-blue" />
            </div>
          </div>

          {/* Supplier & PO Details */}
          <div className="po-v2-form-row">
            <div className="po-v2-box">
              <div className="po-v2-box-header">
                <div className="po-v2-box-icon"><Icon.User /></div>
                <div className="po-v2-box-title">SUPPLIER DETAIL</div>
              </div>
              <FormRow label="Supplier" value={po.supplierName} />
              <div className="po-v2-form-group">
                <label>Address</label>
                <span className="po-v2-colon">:</span>
                <div className="po-v2-multi-line">
                  <div className="po-v2-form-input">{addr1 || '\u00A0'}</div>
                  <div className="po-v2-form-input">{addr2 || '\u00A0'}</div>
                  <div className="po-v2-form-input">{addr3 || '\u00A0'}</div>
                </div>
              </div>
              <div className="po-v2-form-group" style={{ marginTop: 15 }}>
                <label>Mobile No.</label>
                <span className="po-v2-colon">:</span>
                <div className="po-v2-form-input">{po.supplierMobile || '\u00A0'}</div>
              </div>
            </div>

            <div className="po-v2-box">
              <div className="po-v2-box-header">
                <div className="po-v2-box-icon"><Icon.Clipboard /></div>
                <div className="po-v2-box-title">PURCHASE ORDER DETAIL</div>
              </div>
              <FormRow label="PO No." value={po.poNumber} />
              <FormRow label="PO Date" value={fmtDate(po.date)} />
              <FormRow label="Delivery Date" value="" />
              <FormRow label="Payment Terms" value={po.paymentTerms || ''} />
              <FormRow label="Transport Mode" value={po.transportName || ''} />
              <FormRow label="Destination" value={po.deliveryAddress || po.location || ''} />
            </div>
          </div>

          {/* Items Table */}
          <table className="po-v2-items-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>Sr.<br />No.</th>
                <th style={{ width: '25%' }}>Grade</th>
                <th style={{ width: '10%' }}>Thickness<br />(MM)</th>
                <th style={{ width: '10%' }}>Width<br />(MM)</th>
                <th style={{ width: '10%' }}>Length<br />(MM)</th>
                <th style={{ width: '10%' }}>Nos</th>
                <th style={{ width: '10%' }}>Kg</th>
                <th style={{ width: '10%' }}>Rate<br />(Rs.)</th>
                <th style={{ width: '10%' }}>Amount<br />(Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item?.grade || ''}</td>
                  <td>{item ? cell(item.thickness) : ''}</td>
                  <td>{item ? cell(item.width) : ''}</td>
                  <td>{item ? cell(item.length) : ''}</td>
                  <td>{item ? cell(item.nos) : ''}</td>
                  <td>{item ? fmt(item.kg) : ''}</td>
                  <td>{item ? fmt(item.rate) : ''}</td>
                  <td>{item ? fmt(item.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Row */}
          <div className="po-v2-bottom-row">
            <div className="po-v2-bottom-left">
              <DetailRow icon={Icon.Shield} label="Make" value={po.make || ''} />
              <DetailRow icon={Icon.Crosshairs} label="UT Level" value={po.utLevel || ''} />
              <DetailRow icon={Icon.FileContract} label="Test Certificate" value={tcText} />
              <DetailRow icon={Icon.Truck} label="Transport Name" value={po.transportName || ''} />
              <DetailRow icon={Icon.IdCard} label="Vehicle No." value={po.transportNumber || ''} />
            </div>

            <div className="po-v2-bottom-right">
              <div className="po-v2-calc-row">
                <div className="po-v2-calc-label"><Icon.Weight /> Total Kg</div>
                <div className="po-v2-calc-value">{fmt(totalKg)}</div>
              </div>
              <div className="po-v2-calc-row">
                <div className="po-v2-calc-label"><Icon.TruckRamp /> Loading Charge</div>
                <div className="po-v2-calc-value"></div>
              </div>
              <div className="po-v2-calc-row">
                <div className="po-v2-calc-label"><Icon.TruckFast /> Transport Charge</div>
                <div className="po-v2-calc-value"></div>
              </div>
              <div className="po-v2-calc-row">
                <div className="po-v2-calc-label"><Icon.Calculator /> Sub Total</div>
                <div className="po-v2-calc-value">{fmt(subTotal)}</div>
              </div>
              <div className="po-v2-calc-row">
                <div className="po-v2-calc-label"><Icon.Percent /> GST ({gstRate}%)</div>
                <div className="po-v2-calc-value">{fmt(gstAmount)}</div>
              </div>
              <div className="po-v2-final-row">
                <div className="po-v2-final-label">FINAL AMOUNT</div>
                <div className="po-v2-final-value">
                  {grandTotal ? <>₹ {fmt(grandTotal)}</> : '₹'}
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="po-v2-terms-box">
            <div className="po-v2-terms-header">
              <span className="po-v2-terms-icon"><Icon.Clipboard /></span>
              <div className="po-v2-terms-title">TERMS &amp; CONDITIONS :</div>
            </div>
            <div className="po-v2-terms-content">
              <ol>
                {TERMS_LEFT.map(t => <li key={t}>{t}</li>)}
              </ol>
              <ol start={5}>
                {TERMS_RIGHT.map(t => <li key={t}>{t}</li>)}
              </ol>
            </div>
          </div>

          {/* Signatures */}
          <div className="po-v2-signatures">
            <div className="po-v2-sig-box">
              <div className="po-v2-sig-icon"><Icon.PenNib /></div>
              <div className="po-v2-sig-text">
                <div className="po-v2-sig-for">For JAGDAMBA PROFILE</div>
                <div className="po-v2-sig-line">
                  <span>Authorized Signatory</span>
                  <div className="line" />
                </div>
              </div>
            </div>
            <div className="po-v2-sig-box">
              <div className="po-v2-sig-icon"><Icon.PenNib /></div>
              <div className="po-v2-sig-text">
                <div className="po-v2-sig-for">For Supplier</div>
                <div className="po-v2-sig-line">
                  <span>Supplier Sign &amp; Seal</span>
                  <div className="line" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="po-v2-stripes" />
      </div>
    </div>
  );
};
