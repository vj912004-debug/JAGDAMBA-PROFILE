import React from 'react';
import type { CNCQuotationRecord } from '../store/AppContext';
import { amountInWords } from '../utils/amountInWords';
import { CNC_QUOTATION_PRINT_STYLES } from './cncQuotationPrintStyles';
import { SpecBoxSection } from './SpecBoxSection';
import { inferItemTypeFromName, type SpecDetails } from '../config/itemTypeConfig';

export const CNC_QUOTATION_PRINT_AREA_ID = 'cnc-quotation-print-area';

const fmtNum = (n: number, dec = 2) =>
  (isFinite(n) ? n : 0).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB').replace(/\//g, '-');
};

const MIN_ROWS = 6;

const FrameSVG = () => (
  <svg className="frameSVG" viewBox="0 0 210 297" preserveAspectRatio="none">
    <rect x="3" y="3" width="204" height="291" rx="5" fill="none" stroke="#16216e" strokeWidth="0.6" />
    <rect x="5" y="5" width="200" height="287" rx="4" fill="none" stroke="#16216e" strokeWidth="2.4" />
    <path d="M6.5 6.5 L19 6.5 L6.5 19 Z" fill="#f15a24" />
    <path d="M203.5 6.5 L191 6.5 L203.5 19 Z" fill="#f15a24" />
    <path d="M6.5 290.5 L19 290.5 L6.5 278 Z" fill="#f15a24" />
    <path d="M203.5 290.5 L191 290.5 L203.5 278 Z" fill="#f15a24" />
    <path d="M20 9 L190 9 L201 20 L201 277 L190 288 L20 288 L9 277 L9 20 Z" fill="none" stroke="#f15a24" strokeWidth="0.7" />
  </svg>
);

const MachineSVG = () => (
  <svg className="machine" viewBox="0 0 150 110" xmlns="http://www.w3.org/2000/svg">
    <path d="M72 24 L92 24 L92 88" fill="none" stroke="#16216e" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="42" y="17" width="30" height="15" rx="3" fill="#16216e" />
    <rect x="51" y="32" width="12" height="9" rx="1.5" fill="#16216e" />
    <rect x="49" y="41" width="16" height="2.6" fill="#16216e" />
    <path d="M52 43.6 L64 43.6 L61 54 L55 54 Z" fill="#16216e" />
    <path d="M55 54 L61 54 L59.2 59 L56.8 59 Z" fill="#16216e" />
    <path d="M57.4 59 L58.6 59 L58 63 Z" fill="#16216e" />
    <g stroke="#f15a24" strokeWidth="1.7" strokeLinecap="round">
      <line x1="58" y1="70" x2="58" y2="56" /><line x1="58" y1="70" x2="58" y2="84" />
      <line x1="58" y1="70" x2="44" y2="70" /><line x1="58" y1="70" x2="72" y2="70" />
      <line x1="58" y1="70" x2="48" y2="60" /><line x1="58" y1="70" x2="68" y2="60" />
      <line x1="58" y1="70" x2="48" y2="80" /><line x1="58" y1="70" x2="68" y2="80" />
      <line x1="58" y1="70" x2="51" y2="57" /><line x1="58" y1="70" x2="65" y2="57" />
      <line x1="58" y1="70" x2="45" y2="64" /><line x1="58" y1="70" x2="71" y2="64" />
      <line x1="58" y1="70" x2="45" y2="76" /><line x1="58" y1="70" x2="71" y2="76" />
      <line x1="58" y1="70" x2="52" y2="82" /><line x1="58" y1="70" x2="64" y2="82" />
    </g>
    <circle cx="58" cy="70" r="5.5" fill="#e8401a" />
    <circle cx="58" cy="70" r="2.6" fill="#ffb38a" />
    <path d="M16 88 L92 70 L126 84 L50 102 Z" fill="#16216e" />
    <path d="M16 88 L50 102 L126 84 L126 88 L50 106 L16 92 Z" fill="#0b1240" />
    <g stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" opacity=".9">
      <line x1="40" y1="92" x2="45" y2="90.8" />
      <line x1="44" y1="96" x2="50" y2="94.6" />
      <line x1="68" y1="90" x2="73" y2="88.8" />
    </g>
    <g fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" opacity=".92">
      <path d="M96 90 L96 84 L118 78 L118 89 L102 93 L102 86 L112 83.6" />
    </g>
  </svg>
);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="inforow">
    <span className="icon">{icon}</span>
    <span className="lbl">{label}</span>
    <span className="colon">:</span>
    <span className="fill">{value}</span>
  </div>
);

const SigCell: React.FC<{ title: string; name?: string; date?: string }> = ({ title, name, date }) => (
  <div className="sigcell">
    <h4>{title}</h4>
    <div className="stampbox" />
    <div className="field"><span className="k">Name</span><span>:</span><span className="fl">{name || ''}</span></div>
    <div className="field"><span className="k">Date</span><span>:</span><span className="fl">{date || ''}</span></div>
  </div>
);

export const CNCQuotationPrint: React.FC<{ quote: CNCQuotationRecord; userName?: string }> = ({ quote, userName }) => {
  const quoteDate = fmtDate(quote.date);
  const inquiryNo = quote.inquiryNo || quote.quoteNo;
  const inquiryDate = quoteDate;
  const subTotal = quote.totalAmount + quote.loadingCharges + quote.transportCharges;
  const gstAmount = Math.ceil(subTotal * quote.gstRate / 100);
  const grandTotal = quote.grandTotal || Math.ceil(subTotal * (1 + quote.gstRate / 100));
  const totalNos = quote.items.reduce((sum, item) => sum + (item.partOfNos || item.plateNos || 0), 0);
  const words = amountInWords(grandTotal);

  // ── Resolve spec box from the first quotation item ──
  const firstCncItem = quote.items[0];
  const rawCncItemName = firstCncItem?.grade?.trim() || quote.partyName || '';
  const cncDetectedConfig = inferItemTypeFromName(rawCncItemName);
  const cncSpecDetails: SpecDetails | undefined = firstCncItem
    ? {
        grade:     firstCncItem.grade     || '',
        thickness: firstCncItem.thickness || '',
        width:     firstCncItem.width     || '',
        length:    firstCncItem.length    || '',
        weight:    firstCncItem.finishGoodWeight || '',
      }
    : undefined;

  const tableRows = [...quote.items];
  while (tableRows.length < MIN_ROWS) {
    tableRows.push({
      id: `empty-${tableRows.length}`,
      shape: 'CNC Profile',
      drawingNo: '',
      grade: '',
      thickness: 0,
      width: 0,
      length: 0,
      plateNos: 0,
      plateRate: 0,
      partOfNos: 0,
      finishGoodWeight: 0,
      mtr: 0,
      piercing: 0,
      piercingType: 'Full',
      burningLossFactor: 0,
      scrapRate: 0,
      meterFactor: 0,
      piercingRate: 0,
      amount: 0,
      finalRate: 0,
      plateWeight: 0,
    });
  }

  const docIcon = (
    <svg viewBox="0 0 24 24"><rect x="5" y="3" width="12" height="18" rx="2" fill="#fff" /><rect x="8" y="8" width="6" height="1.5" fill="#f15a24" /><rect x="8" y="11.5" width="6" height="1.5" fill="#f15a24" /><path d="M14 14 l4 -4 l2 2 l-4 4 l-2.6 .6 z" fill="#f15a24" stroke="#fff" strokeWidth=".6" /></svg>
  );
  const partyIcon = (
    <svg viewBox="0 0 24 24"><circle cx="10" cy="8" r="3.4" fill="#fff" /><path d="M4 20c0-3.7 2.8-5.8 6-5.8s6 2.1 6 5.8z" fill="#fff" /><path d="M16 6 l3.5 0 M17.5 4.5 l0 3" stroke="#fff" strokeWidth="1.4" /></svg>
  );
  const searchIcon = (
    <svg viewBox="0 0 24 24"><rect x="5" y="3" width="12" height="18" rx="2" fill="#fff" /><circle cx="12" cy="11" r="3" fill="none" stroke="#f15a24" strokeWidth="1.6" /><line x1="14.2" y1="13.2" x2="17" y2="16" stroke="#f15a24" strokeWidth="1.8" /></svg>
  );
  const calIcon = (
    <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" fill="#fff" /><rect x="4" y="5" width="16" height="4" fill="#f15a24" /><line x1="8" y1="3" x2="8" y2="7" stroke="#fff" strokeWidth="1.8" /><line x1="16" y1="3" x2="16" y2="7" stroke="#fff" strokeWidth="1.8" /><g fill="#f15a24"><rect x="7" y="11" width="2" height="2" /><rect x="11" y="11" width="2" height="2" /><rect x="15" y="11" width="2" height="2" /><rect x="7" y="15" width="2" height="2" /><rect x="11" y="15" width="2" height="2" /><rect x="15" y="15" width="2" height="2" /></g></svg>
  );

  return (
    <div id={CNC_QUOTATION_PRINT_AREA_ID} className="cnc-q-print">
      <style>{CNC_QUOTATION_PRINT_STYLES}</style>
      <div className="page">
        <FrameSVG />
        <div className="content">
          <div className="header">
            <div className="brand">
              <h1>JAGDAMBA PROFILE</h1>
              <div className="tagline">
                <span className="dot" /><span className="ln" />
                <span className="txt">CNC PROFILE CUTTING SOLUTIONS</span>
                <span className="ln" /><span className="dot" />
              </div>
            </div>
            <MachineSVG />
          </div>

          <div className="contact">
            <div className="item">
              <svg className="ic" viewBox="0 0 24 24"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#f15a24" /><circle cx="12" cy="9" r="2.5" fill="#fff" /></svg>
              <span>504/1A, GIDC Makarpura, Vadodara - 390010, Gujarat, India</span>
            </div>
            <span className="sep">|</span>
            <div className="item">
              <svg className="ic" viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1l-2.2 2.3z" fill="#f15a24" /></svg>
              <span>9824025001&nbsp;|&nbsp;9824917250</span>
            </div>
            <span className="sep">|</span>
            <div className="item">
              <svg className="ic" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2" fill="#f15a24" /><path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="#fff" strokeWidth="1.6" /></svg>
              <span>jagdambaprofile@gmail.com</span>
            </div>
            <span className="sep">|</span>
            <div className="item gstin"><b>GSTIN&nbsp;:&nbsp;24AJGPP9863R1Z5</b></div>
          </div>
          <div className="hr-orange" />

          <div className="titlebar">
            <div className="deco left"><span className="d" /><span className="l" /></div>
            <div className="ribbon">
              <span className="cap" />
              <div className="banner"><span>CNC PROFILE CUTTING QUOTATION</span></div>
              <span className="cap" />
            </div>
            <div className="deco right"><span className="l" /><span className="d" /></div>
          </div>

          {/* ── Dynamic spec box: renders when grade matches a known material type ── */}
          {cncDetectedConfig && cncSpecDetails && (
            <SpecBoxSection
              itemTypeKey={cncDetectedConfig.key}
              details={cncSpecDetails}
            />
          )}

          <div className="infobox">
            <div className="infocol">
              <InfoRow icon={docIcon} label="Quotation No." value={quote.quoteNo} />
              <InfoRow icon={partyIcon} label="Party Name" value={quote.partyName} />
              <InfoRow icon={searchIcon} label="Inquiry No." value={inquiryNo} />
            </div>
            <div className="divider" />
            <div className="infocol">
              <InfoRow icon={calIcon} label="Date" value={quoteDate} />
              <InfoRow icon={calIcon} label="Inquiry Date" value={inquiryDate} />
              <InfoRow icon={calIcon} label="Validity" value="2 Days" />
            </div>
          </div>

          <table>
            <colgroup>
              <col style={{ width: '7%' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '11.5%' }} />
              <col style={{ width: '11.5%' }} />
              <col style={{ width: '11.5%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14.5%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Sr<br />No.</th>
                <th>Drawing No. /<br />Part No.</th>
                <th>Thickness<br />(mm)</th>
                <th>Length<br />(mm)</th>
                <th>Width<br />(mm)</th>
                <th>Nos<br />(Qty)</th>
                <th>Final Rate<br />Per Nos (₹)</th>
                <th>Total Amount<br />(₹)</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{quote.items[idx] ? idx + 1 : ''}</td>
                  <td>{item.drawingNo || ''}</td>
                  <td>{item.thickness ? fmtNum(item.thickness, 0) : ''}</td>
                  <td>{item.length ? fmtNum(item.length, 0) : ''}</td>
                  <td>{item.width ? fmtNum(item.width, 0) : ''}</td>
                  <td>{item.partOfNos || item.plateNos || ''}</td>
                  <td>{item.finalRate ? fmtNum(item.finalRate) : ''}</td>
                  <td>{item.amount ? fmtNum(item.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-area">
            <div className="left-tot">
              <div className="total-nos">
                <b>Total Nos (Qty) :</b>
                <span className="fill">{totalNos || ''}</span>
              </div>
              <div className="words">
                <b>Amount in Words :</b>
                <div className="ln">{words}</div>
              </div>
            </div>
            <div className="right-tot">
              <div className="row"><span>Sub Total (₹)</span><span>{fmtNum(subTotal)}</span></div>
              <div className="row"><span>GST @ {quote.gstRate}%</span><span>{fmtNum(gstAmount)}</span></div>
              <div className="row grand"><span>Grand Total (₹)</span><span>{fmtNum(grandTotal)}</span></div>
            </div>
          </div>

          <div className="mid">
            <div className="terms">
              <h3>TERMS &amp; CONDITIONS :</h3>
              <ol>
                <li><span className="n">1.</span>GST Extra as Applicable.</li>
                <li><span className="n">2.</span>Quotation Validity : <b>2&nbsp;Days.</b></li>
                <li><span className="n">3.</span>Transportation Extra.</li>
                <li><span className="n">4.</span>Material and Cutting as per Drawing.</li>
                <li><span className="n">5.</span>Payment Terms : Advance / As Per Mutual Agreement.</li>
                <li><span className="n">6.</span>Rates are subject to change without prior notice.</li>
                <li><span className="n">7.</span>Any dispute subject to Vadodara Jurisdiction only.</li>
              </ol>
            </div>
            <div className="sign-right">
              <div className="forco">For JAGDAMBA PROFILE</div>
              <div className="sline" />
              <div className="scap">Authorized Signatory</div>
            </div>
          </div>

          <div className="sigbox">
            <SigCell title="PREPARED BY" name={userName || 'Admin'} date={quoteDate} />
            <SigCell title="CHECKED BY" />
            <SigCell title="AUTHORIZED SIGNATORY" />
          </div>

          <div className="footer">
            <span className="d" /><span className="l" />
            <span className="ty">Thank You&nbsp;&nbsp;For Your Inquiry!</span>
            <span className="l" /><span className="d" />
          </div>
        </div>
      </div>
    </div>
  );
};
