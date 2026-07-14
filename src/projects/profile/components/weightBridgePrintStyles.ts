export const WEIGHT_BRIDGE_PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DotGothic16&family=Noto+Sans+Gujarati:wght@400;700&display=swap');

  .wb-print {
    --maroon: #6d1220;
    --dot-matrix: 'DotGothic16', 'Courier New', Courier, monospace;
    --dm-size: 3.5mm;
  }

  .wb-print * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .wb-print {
    background: #e9e9e9;
    font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
    color: var(--maroon);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .wb-print .sheet {
    width: 200mm;
    height: 300mm;
    margin: 5mm auto;
    background: #fff;
    position: relative;
  }

  .wb-print .sprockets {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 11mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    padding: 3mm 0;
    z-index: 2;
  }

  .wb-print .sprockets.left { left: 0; }
  .wb-print .sprockets.right { right: 0; }

  .wb-print .hole {
    width: 3.1mm;
    height: 3.1mm;
    border: 0.3mm solid #8a8a8a;
    border-radius: 50%;
    background: #fff;
  }

  .wb-print .slip {
    width: 200mm;
    height: 100mm;
    padding: 2mm 11mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .wb-print .cutborder {
    border-bottom: 0.4mm dashed #555;
  }

  .wb-print .scissor {
    position: absolute;
    left: 12mm;
    bottom: 0.4mm;
    transform: scaleX(-1);
    color: #222;
    font-size: 8.5pt;
    background: #fff;
    padding: 0 1mm;
    z-index: 3;
  }

  .wb-print .guj {
    font-family: 'Noto Sans Gujarati', 'Shruti', 'Nirmala UI', Arial, sans-serif;
  }

  .wb-print .jsr {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2.5mm;
    font-weight: 700;
    font-size: 7pt;
    margin-bottom: 0.4mm;
  }

  .wb-print .jsr::before,
  .wb-print .jsr::after {
    content: '';
    height: 0.4mm;
    width: 22mm;
    background: var(--maroon);
  }

  .wb-print .banner {
    display: block;
    width: 100%;
  }

  .wb-print .banner svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .wb-print .address {
    text-align: center;
    font-weight: 700;
    font-size: 7.3pt;
    margin: 0.5mm 0;
  }

  .wb-print .subhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2.5mm;
    margin-bottom: 0.7mm;
  }

  .wb-print .truck {
    flex: 0 0 auto;
    width: 29mm;
  }

  .wb-print .truck svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .wb-print .govt {
    flex: 1 1 auto;
    text-align: center;
  }

  .wb-print .govt .top {
    background: var(--maroon);
    color: #fff;
    border-radius: 5mm;
    padding: 0.8mm 3mm;
    font-weight: 700;
    font-size: 9pt;
    white-space: nowrap;
    line-height: 1;
  }

  .wb-print .govt .bot {
    color: var(--maroon);
    font-weight: 700;
    font-size: 8.5pt;
    white-space: nowrap;
    letter-spacing: 0.12mm;
    margin-top: 0.5mm;
  }

  .wb-print .hours {
    flex: 0 0 auto;
    width: 25mm;
    height: 11.5mm;
    background: var(--maroon);
    color: #fff;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1.05;
  }

  .wb-print .hours b { font-size: 9.5pt; }
  .wb-print .hours span { font-size: 8.2pt; font-weight: 700; letter-spacing: 0.2mm; }

  .wb-print .box {
    border: 0.6mm solid var(--maroon);
    border-radius: 3.5mm;
  }

  .wb-print .fields {
    padding: 1.2mm 5mm 1.3mm;
    margin-bottom: 0.8mm;
  }

  .wb-print .frow {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    column-gap: 4mm;
    font-weight: 700;
    font-size: 8.5pt;
    line-height: 1;
  }

  .wb-print .frow + .frow { margin-top: 0.95mm; }
  .wb-print .frow .cell { white-space: nowrap; }

  .wb-print .dm-val {
    font-family: var(--dot-matrix);
    font-size: var(--dm-size);
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  .wb-print .notice {
    display: flex;
    align-items: stretch;
    padding: 0.8mm 4mm;
    margin-bottom: 0.8mm;
    gap: 2.5mm;
  }

  .wb-print .tag {
    background: var(--maroon);
    color: #fff;
    border-radius: 2.4mm;
    font-weight: 700;
    font-size: 8pt;
    padding: 0.7mm 2.6mm;
    display: flex;
    align-items: center;
    align-self: flex-start;
    white-space: nowrap;
  }

  .wb-print .notice-cols {
    flex: 1 1 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 5mm;
    row-gap: 0.8mm;
    align-items: center;
    font-weight: 700;
    font-size: 6.9pt;
    line-height: 1.08;
  }

  .wb-print .nmid {
    border-left: 0.4mm solid var(--maroon);
    padding-left: 4mm;
  }

  .wb-print .terms {
    display: flex;
    align-items: stretch;
    padding: 0.8mm 4mm;
    gap: 2.5mm;
    position: relative;
  }

  .wb-print .vlabel {
    background: var(--maroon);
    color: #fff;
    border-radius: 1.5mm;
    width: 4.6mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 7pt;
    line-height: 1.18;
    padding: 0.6mm 0;
  }

  .wb-print .terms-list {
    flex: 1 1 auto;
    font-weight: 700;
    font-size: 6.6pt;
    line-height: 1.24;
    white-space: nowrap;
  }

  .wb-print .terms-list ol {
    list-style: none;
    counter-reset: t;
  }

  .wb-print .terms-list li {
    counter-increment: t;
    padding-left: 4.6mm;
    position: relative;
  }

  .wb-print .terms-list li::before {
    content: counter(t) '.';
    position: absolute;
    left: 0;
  }

  .wb-print .sign {
    position: absolute;
    right: 5mm;
    bottom: 1.4mm;
    font-weight: 700;
    font-size: 9.5pt;
    white-space: nowrap;
  }

  @media print {
    html, body { background: #fff; }
    .wb-print { background: #fff; }
    .wb-print .sheet { margin: 0 auto; }
    @page { size: 200mm 300mm; margin: 0; }
    .wb-print .dm-val { font-size: 3.5mm; }
  }
`;

export const WEIGHBRIDGE_TITLE = 'SHREE NEELKANTH WEIGH BRIDGE';
export const WEIGHBRIDGE_ADDRESS = 'OPP. GANGESHWAR HIGH SCHOOL, SINGARWA-KANBHA ROAD, KANBHA, AHMEDABAD.';
