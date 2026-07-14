import React from 'react';
import type { JobWorkOutwardRecord } from '../utils/jobWorkHelpers';
import { emptyMaterialRow, fmtAmt, fmtKg3, labourAmount } from '../utils/jobWorkHelpers';
import { parseNum } from './NumericInput';
import { JOB_WORK_OUTWARD_PRINT_STYLES } from './jobWorkOutwardPrintStyles';

export const JOB_WORK_OUTWARD_PRINT_AREA_ID = 'jw-outward-print-area';

const MIN_ROWS = 5;

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB').replace(/\//g, '-');
};

const fmtCell = (n: number, dec = 0) => {
  if (!n) return '';
  return dec > 0
    ? n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : String(n);
};

const WaveTop = () => (
  <svg className="wave-top" viewBox="0 0 660 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M110 26 C 250 -2, 430 -2, 660 0 L660 19 C 430 23, 268 31, 150 47 C 138 40, 124 32, 110 26 Z" fill="#16297a" />
    <path d="M150 47 C 268 31, 430 23, 660 19 L660 41 C 440 47, 292 55, 176 67 C 168 60, 159 53, 150 47 Z" fill="#f47c20" />
  </svg>
);

const CornerSquares = () => (
  <>
    <svg className="sq-bl" viewBox="0 0 47 47" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="36" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="23" y="36" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="36" y="36" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="10" y="23" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="10" y="10" width="9" height="9" rx="1.3" fill="#16297a" />
    </svg>
    <svg className="sq-br" viewBox="0 0 47 47" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="36" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="23" y="36" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="10" y="36" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="36" y="23" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="36" y="10" width="9" height="9" rx="1.3" fill="#16297a" />
    </svg>
    <svg className="sq-tl" viewBox="0 0 47 47" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="23" y="10" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="36" y="10" width="9" height="9" rx="1.3" fill="#16297a" />
      <rect x="10" y="23" width="9" height="9" rx="1.3" fill="#f47c20" />
      <rect x="10" y="36" width="9" height="9" rx="1.3" fill="#16297a" />
    </svg>
  </>
);

const LogoMark = () => (
  <svg className="logo-mark" viewBox="0 0 100 96" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 6 H44 V58 C44 76 32 88 14 88 C9 88 5 87 2 85 L2 70 C5 72 8 73 11 73 C18 73 22 69 22 60 V22 H14 Z" fill="#16297a" />
    <path d="M40 6 H70 C84 6 94 16 94 31 C94 46 84 56 70 56 H58 V82 H40 Z M58 22 V40 H68 C74 40 78 36 78 31 C78 26 74 22 68 22 Z" fill="#f47c20" />
  </svg>
);

const LabCell: React.FC<{ value: string }> = ({ value }) =>
  value ? <span>{value}</span> : <span className="inp" />;

const FieldLine: React.FC<{ label: string; value?: string; party?: boolean }> = ({ label, value }) => (
  <div className="field">
    <span className="lbl">{label}</span>
    <span className="colon">:</span>
    <span className="ul">{value || '\u00A0'}</span>
  </div>
);

export const JobWorkOutwardPrint: React.FC<{
  record: JobWorkOutwardRecord;
  userName?: string;
  printAreaId?: string;
}> = ({ record, userName, printAreaId = JOB_WORK_OUTWARD_PRINT_AREA_ID }) => {
  const rows = [...record.rows];
  while (rows.length < MIN_ROWS) rows.push(emptyMaterialRow());

  const totalNos = record.rows.reduce((s, r) => s + parseNum(r.nos), 0);
  const totalActualKg = record.totalActualKg || record.rows.reduce((s, r) => s + parseNum(r.actualKg), 0);
  const labour = record.labour;
  const mtrAmt = parseNum(labour.mtrQty) * parseNum(labour.mtrRate);
  const pierceAmt = parseNum(labour.pcsQty) * parseNum(labour.piercingRate);
  const totalLab = record.totalLabour || labourAmount(labour);

  const addressLines = (record.address || '').split(/\r?\n/).filter(Boolean);
  const noteLines = (record.note || '').split(/\r?\n/).filter(Boolean);
  while (noteLines.length < 4) noteLines.push('');

  return (
    <div id={printAreaId} className="jw-out-print">
      <style>{JOB_WORK_OUTWARD_PRINT_STYLES}</style>
      <div className="page">
        <WaveTop />
        <CornerSquares />

        <div className="content">
          <div className="header">
            <div className="brand-col">
              <div className="logo-row">
                <LogoMark />
                <div className="logo-words">
                  <div className="jag">JAGDAMBA</div>
                  <div className="profile">
                    <span className="dash" />
                    <span className="txt">PROFILE</span>
                    <span className="dash" />
                  </div>
                </div>
              </div>
              <div className="contact">
                <div className="line">
                  <svg className="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
                  <span className="tx">504/1A GIDC MAKARPURA, VADODARA</span>
                </div>
                <div className="line">
                  <svg className="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z" /></svg>
                  <span className="tx">8799617251 / 8799617252</span>
                </div>
                <div className="line">
                  <svg className="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4v.4l8 5 8-5V8l-8 5-8-5z" /></svg>
                  <span className="tx">jagdambaprofile@gmail.com</span>
                </div>
              </div>
            </div>

            <div className="head-divider" />

            <div className="title-col">
              <h1>JOB WORK<span className="l2">MATERIAL OUT WORD CHALLAN</span></h1>
            </div>
          </div>

          <div className="detail-row">
            <div className="det-box party">
              <div className="tab-wrap"><span className="tab">PARTY DETAILS</span><span className="tab-line" /></div>
              <FieldLine label="Party Name" value={record.partyName} party />
              <FieldLine label="Address" value={addressLines[0] || record.address} party />
              <div className="ul-extra">{addressLines[1] || '\u00A0'}</div>
              <div className="ul-extra">{addressLines[2] || '\u00A0'}</div>
              <FieldLine label="Mobile No." value={record.mobileNo} party />
            </div>

            <div className="det-box outward">
              <div className="tab-wrap"><span className="tab">OUTWARD DETAILS</span><span className="tab-line" /></div>
              <div className="field" style={{ marginTop: 14 }}>
                <span className="lbl">Outward No.</span><span className="colon">:</span>
                <span className="ul">{record.outwardNo}</span>
              </div>
              <div className="field" style={{ margin: '22px 0' }}>
                <span className="lbl">Outward Date</span><span className="colon">:</span>
                <span className="ul">{fmtDate(record.outwardDate)}</span>
              </div>
              <div className="field" style={{ margin: '22px 0 4px' }}>
                <span className="lbl">Vehicle No.</span><span className="colon">:</span>
                <span className="ul">{record.vehicleNo}</span>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="tab-wrap"><span className="tab">MATERIAL ENTRY</span><span className="tab-line" /></div>
            <table className="mat">
              <thead>
                <tr>
                  <th className="sr">Sr No</th>
                  <th className="grade">Grade</th>
                  <th>Thickness<br />(mm)</th>
                  <th>Width<br />(mm)</th>
                  <th>Length<br />(mm)</th>
                  <th>Nos</th>
                  <th>Actual KG</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, MIN_ROWS).map((row, i) => (
                  <tr key={row.id || i}>
                    <td>{i + 1}</td>
                    <td>{row.grade}</td>
                    <td>{fmtCell(parseNum(row.thickness))}</td>
                    <td>{fmtCell(parseNum(row.width))}</td>
                    <td>{fmtCell(parseNum(row.length))}</td>
                    <td>{fmtCell(parseNum(row.nos))}</td>
                    <td>{parseNum(row.actualKg) ? fmtKg3(parseNum(row.actualKg)) : ''}</td>
                    <td>{row.remark || ''}</td>
                  </tr>
                ))}
                <tr>
                  <td className="total-cell" colSpan={5}>Total Nos</td>
                  <td>{totalNos || ''}</td>
                  <td>{totalActualKg ? fmtKg3(totalActualKg) : ''}</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div className="note-line"><b>Note</b> : Actual KG to be filled at the time of delivery.</div>
          </div>

          <div className="bottom-row">
            <div className="labour">
              <div className="tab-wrap"><span className="tab">LABOUR DETAILS</span><span className="tab-line" /></div>
              <table className="lab-table">
                <thead>
                  <tr><th>Labour Type</th><th>Mtr / Pcs</th><th>Rate (₹)</th><th>Amount (₹)</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Labour Mtr.</td>
                    <td><LabCell value={parseNum(labour.mtrQty) ? fmtCell(parseNum(labour.mtrQty), 2) : ''} /></td>
                    <td><LabCell value={parseNum(labour.mtrRate) ? fmtAmt(parseNum(labour.mtrRate)) : ''} /></td>
                    <td><LabCell value={mtrAmt ? fmtAmt(mtrAmt) : ''} /></td>
                  </tr>
                  <tr>
                    <td>Labour Pirsing</td>
                    <td><LabCell value={parseNum(labour.pcsQty) ? fmtCell(parseNum(labour.pcsQty), 2) : ''} /></td>
                    <td><LabCell value={parseNum(labour.piercingRate) ? fmtAmt(parseNum(labour.piercingRate)) : ''} /></td>
                    <td><LabCell value={pierceAmt ? fmtAmt(pierceAmt) : ''} /></td>
                  </tr>
                  <tr>
                    <td className="total-lab" colSpan={3}>TOTAL LABOUR (₹)</td>
                    <td><LabCell value={totalLab ? fmtAmt(totalLab) : ''} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="note-col">
              <div className="tab-wrap"><span className="tab">NOTE</span><span className="tab-line" /></div>
              <div className="note-card">
                <div className="rm">Note / Remark :</div>
                {noteLines.slice(0, 4).map((line, i) => (
                  <div key={i} className="rl">{line || '\u00A0'}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="footer">
            <div className="frow">
              <div className="fcell"><span className="fl">Prepared By</span><span className="fc">:</span><span className="fu">{userName || ''}</span></div>
              <div className="fcell"><span className="fl">Authorised By</span><span className="fc">:</span><span className="fu" /></div>
            </div>
            <div className="frow">
              <div className="fcell"><span className="fl">Checked By</span><span className="fc">:</span><span className="fu" /></div>
              <div className="fcell"><span className="fl">Date</span><span className="fc">:</span><span className="fu">{fmtDate(record.outwardDate)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
