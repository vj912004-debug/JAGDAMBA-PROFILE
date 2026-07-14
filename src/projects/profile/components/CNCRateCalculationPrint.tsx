import React from 'react';
import {
  CNC_PRINT_STYLES, CNCPrintBanner, CNCPrintFooter, CNCPrintHeader, fmtNum,
} from './cncPrintShared';

export const CNC_RATE_CALC_PRINT_AREA_ID = 'cnc-rate-calc-print-area';

export interface CNCRateCalcPrintData {
  inquiryNo: string;
  inquiryDate: string;
  partyName: string;
  partyAddress?: string;
  partyMobile?: string;
  partyContact?: string;
  partyEmail?: string;
  partyGst?: string;
  drawingNo: string;
  partNo: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  plateNos: string;
  finishGoodNos: string;
  finishGoodWeight: string;
  cuttingMtr: string;
  piercingNos: string;
  burningLossMM: string;
  plateRate: string;
  scrapRate: string;
  labourRate: string;
  piercingRate: string;
  remarks: string;
  plateWeight: number;
  burningLossWeight: number;
  scrapWeight: number;
  scrapAmount: number;
  plateAmount: number;
  labourAmount: number;
  piercingAmount: number;
  finalCost: number;
  ratePerKg: number;
  ratePerNos: number;
  userName?: string;
}

const nowMeta = () => {
  const d = new Date();
  return {
    date: d.toLocaleDateString('en-GB').replace(/\//g, '-'),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const CNCRateCalculationPrint: React.FC<{ data: CNCRateCalcPrintData }> = ({ data }) => {
  const { date, time } = nowMeta();
  const user = data.userName || 'Admin';

  return (
    <div id={CNC_RATE_CALC_PRINT_AREA_ID} className="cnc-print-root" style={{ background: '#fff' }}>
      <style>{CNC_PRINT_STYLES}</style>
      <div className="cnc-print-sheet">
        <div className="cnc-print-inner">
          <CNCPrintHeader date={date} time={time} user={user} />
          <CNCPrintBanner title="CNC RATE CALCULATION REPORT" />

          <div className="cnc-print-party-box">
            <div className="cnc-print-inquiry-col">
              <div className="cnc-print-inquiry-cell">
                <div className="cnc-print-field-head">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#14246b"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                  INQUIRY NO.
                </div>
                <div className="cnc-print-field-box">{data.inquiryNo}</div>
              </div>
              <div className="cnc-print-inquiry-cell">
                <div className="cnc-print-field-head">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#14246b"><path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm12 7v10H5V9h14z" /></svg>
                  INQUIRY DATE
                </div>
                <div className="cnc-print-field-box">{data.inquiryDate}</div>
              </div>
            </div>
            <div className="cnc-print-party-col">
              <div className="cnc-print-party-head">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#14246b"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z" /></svg>
                PARTY DETAILS
              </div>
              <div className="cnc-print-pline cnc-print-prow-full"><span className="lbl">Party Name</span><span className="colon">:</span><span className="val">{data.partyName}</span></div>
              <div className="cnc-print-pline cnc-print-prow-full"><span className="lbl">Address</span><span className="colon">:</span><span className="val">{data.partyAddress || ''}</span></div>
              <div className="cnc-print-pgrid">
                <div className="cnc-print-pline"><span className="lbl">Mobile No.</span><span className="colon">:</span><span className="val">{data.partyMobile || ''}</span></div>
                <div className="cnc-print-pline"><span className="lbl">Contact Person</span><span className="colon">:</span><span className="val">{data.partyContact || ''}</span></div>
              </div>
              <div className="cnc-print-pgrid">
                <div className="cnc-print-pline"><span className="lbl">Email ID</span><span className="colon">:</span><span className="val">{data.partyEmail || ''}</span></div>
                <div className="cnc-print-pline"><span className="lbl">GST No.</span><span className="colon">:</span><span className="val">{data.partyGst || ''}</span></div>
              </div>
            </div>
          </div>

          <div className="cnc-print-cols">
            <div className="cnc-print-panel">
              <div className="cnc-print-panel-head">
                <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 2L3 6.5v11L12 22l9-4.5v-11L12 2z" /><path d="M3 6.5L12 11l9-4.5M12 11v11" /></svg></span>
                MATERIAL DETAILS
              </div>
              {[
                ['Drawing No.', data.drawingNo],
                ['Part No.', data.partNo],
                ['Grade', data.grade],
                ['Thickness (MM)', data.thickness],
                ['Width (MM)', data.width],
                ['Length (MM)', data.length],
                ['Plate Nos', data.plateNos],
                ['Finish Good Nos', data.finishGoodNos],
                ['Cutting Meter (Mtr)', data.cuttingMtr],
                ['Piercing Nos', data.piercingNos],
                ['Burning Loss (MM)', data.burningLossMM],
                ['Finish Good Weight (KG)', data.finishGoodWeight],
              ].map(([lbl, val]) => (
                <div key={lbl} className="cnc-print-mat-row">
                  <div className="cnc-print-mat-lbl">{lbl}</div>
                  <div className="cnc-print-mat-fill">{val}</div>
                </div>
              ))}
            </div>

            <div className="cnc-print-panel">
              <div className="cnc-print-panel-head">
                <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6 4h12v2h-4.3c.5.5.9 1.2 1.1 2H18v2h-3.2c-.4 2.3-2.4 4-4.8 4h-.3l5.3 5H12l-5-5v-2h3c1.3 0 2.4-.8 2.8-2H6V9h6.8C12.4 7.8 11.3 7 10 7H6V4z" /></svg></span>
                RATE &amp; CHARGES
              </div>
              <table className="cnc-print-rate-table">
                <tbody>
                  <tr><th>Particulars</th><th>Rate</th></tr>
                  <tr><td className="rp">Plate Rate (₹/Kg)</td><td>{data.plateRate}</td></tr>
                  <tr><td className="rp">Scrap Rate (₹/Kg)</td><td>{data.scrapRate}</td></tr>
                  <tr><td className="rp">Labour Rate (₹/Mtr)</td><td>{data.labourRate}</td></tr>
                  <tr><td className="rp">Piercing Rate (₹/Nos)</td><td>{data.piercingRate}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="cnc-print-panel">
              <div className="cnc-print-panel-head">
                <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v3h10V5H7zm0 5v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM7 14v2h2v-2H7zm4 0v2h2v-2h-2zm4 0v5h2v-5h-2zM7 18v2h2v-2H7zm4 0v2h2v-2h-2z" /></svg></span>
                CALCULATION SUMMARY
              </div>
              <div className="cnc-print-calc-body">
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">1.&nbsp; Plate Weight</div><div className="cnc-print-calc-val">{fmtNum(data.plateWeight)}</div><div className="cnc-print-calc-unit">Kg</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">2.&nbsp; Burning Loss Weight</div><div className="cnc-print-calc-val">{fmtNum(data.burningLossWeight)}</div><div className="cnc-print-calc-unit">Kg</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">3.&nbsp; Scrap Weight</div><div className="cnc-print-calc-val">{fmtNum(data.scrapWeight)}</div><div className="cnc-print-calc-unit">Kg</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">4.&nbsp; Scrap Amount<span className="sub">(@ ₹ {data.scrapRate || '0'} /Kg)</span></div><div className="cnc-print-calc-val">{fmtNum(data.scrapAmount)}</div><div className="cnc-print-calc-unit">₹</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label green">5.&nbsp; Finish Good Weight</div><div className="cnc-print-calc-val">{data.finishGoodWeight || fmtNum(0)}</div><div className="cnc-print-calc-unit">Kg</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">6.&nbsp; Plate Amount<span className="sub">(@ ₹ {data.plateRate || '0'} /Kg)</span></div><div className="cnc-print-calc-val">{fmtNum(data.plateAmount)}</div><div className="cnc-print-calc-unit">₹</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">7.&nbsp; Labour Amount<span className="sub">(@ ₹ {data.labourRate || '0'} /Mtr)</span></div><div className="cnc-print-calc-val">{fmtNum(data.labourAmount)}</div><div className="cnc-print-calc-unit">₹</div></div>
                <div className="cnc-print-calc-row"><div className="cnc-print-calc-label">8.&nbsp; Piercing Amount<span className="sub">(@ ₹ {data.piercingRate || '0'} /Nos)</span></div><div className="cnc-print-calc-val">{fmtNum(data.piercingAmount)}</div><div className="cnc-print-calc-unit">₹</div></div>
              </div>
            </div>
          </div>

          <div className="cnc-print-final">
            <div className="cnc-print-final-head">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M3 3h2v18H3V3zm4 9h3v9H7v-9zm5-5h3v14h-3V7zm5 3h3v11h-3V10z" /></svg>
              FINAL COST SUMMARY
            </div>
            <div className="cnc-print-final-grid">
              <div className="cnc-print-final-cell">
                <div className="cnc-print-final-title"><span className="cnc-print-coin blue">₹</span> FINAL COST</div>
                <div className="cnc-print-final-box">₹ {fmtNum(data.finalCost)}</div>
              </div>
              <div className="cnc-print-final-cell">
                <div className="cnc-print-final-title"><span className="cnc-print-coin orange">₹</span> RATE PER KG</div>
                <div className="cnc-print-final-box">₹ {fmtNum(data.ratePerKg)}</div>
              </div>
              <div className="cnc-print-final-cell">
                <div className="cnc-print-final-title"><span className="cnc-print-coin orange">#</span> RATE PER NOS</div>
                <div className="cnc-print-final-box">₹ {fmtNum(data.ratePerNos)}</div>
              </div>
            </div>
          </div>

          <div className="cnc-print-remarks">
            <div className="cnc-print-rhead">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#14246b"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
              REMARKS / NOTES
            </div>
            <div className="cnc-print-rline">{data.remarks}</div>
            <div className="cnc-print-rline" aria-hidden="true">&nbsp;</div>
          </div>

          <div className="cnc-print-signoff">
            <div className="cnc-print-sign-table">
              {['PREPARED BY', 'CHECKED BY', 'APPROVED BY'].map(cap => (
                <div key={cap} className="cnc-print-sign-cell">
                  <div className="cnc-print-sign-cap">{cap}</div>
                  <div className="cnc-print-sign-body"><div className="cnc-print-sign-date">DATE : <span className="dl" /></div></div>
                </div>
              ))}
            </div>
            <div className="cnc-print-stamp">COMPANY STAMP</div>
          </div>

          <CNCPrintFooter />
        </div>
      </div>
    </div>
  );
};
