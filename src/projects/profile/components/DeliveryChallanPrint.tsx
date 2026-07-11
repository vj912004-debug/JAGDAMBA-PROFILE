import React from 'react';
import type { DeliveryChallanPrintData } from '../utils/deliveryChallanHelpers';
import { DELIVERY_CHALLAN_PRINT_STYLES } from './deliveryChallanPrintStyles';
import { SpecBoxSection } from './SpecBoxSection';

export const DELIVERY_CHALLAN_PRINT_AREA_ID = 'delivery-challan-print-area';

const CornerTr = () => (
  <svg className="corner-tr" viewBox="0 0 132 104" xmlns="http://www.w3.org/2000/svg">
    <polygon points="132,0 132,104 36,0" fill="#f1721c" />
    <polygon points="132,0 132,72 70,0" fill="#16245f" />
  </svg>
);

const LogoMark = () => (
  <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M55 12 h13 v50 a26 26 0 0 1 -26 26 a26 26 0 0 1 -26 -26 h13 a13 13 0 0 0 13 13 a13 13 0 0 0 13 -13 z" fill="#16245f" />
    <path d="M46 12 h26 a22 22 0 0 1 0 44 h-13 v-13 h13 a9 9 0 0 0 0 -18 h-13 z" fill="#f1721c" />
  </svg>
);

const HashBars = ({ tone }: { tone: 'o' | 'n' }) => (
  <div className={`hash ${tone}`}>
    {tone === 'o' ? (<><i /><i /><i /></>) : (<><i /><i /></>)}
  </div>
);

const TermsIcon = () => (
  <svg className="ic" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="2" fill="#fde6d3" />
    <rect x="9" y="2" width="6" height="3" rx="1" fill="#f1721c" />
    <path d="M8 9h8M8 12.5h8M8 16h5" stroke="#f1721c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PreparedIcon = () => (
  <svg className="si" viewBox="0 0 24 24" fill="#f1721c">
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0H5z" />
    <path d="M20.5 13.5l1.8 1.8-5.3 5.3-2.4.6.6-2.4 5.3-5.3z" />
  </svg>
);

const CheckedIcon = () => (
  <svg className="si" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="2" fill="#fde6d3" />
    <rect x="9" y="2" width="6" height="3" rx="1" fill="#f1721c" />
    <path d="M8.5 11l2 2 4-4.5" stroke="#f1721c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M8 16.5h8" stroke="#f1721c" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ReceivedIcon = () => (
  <svg className="si" viewBox="0 0 24 24" fill="#f1721c">
    <path d="M3 13l3-7h9l3 4h3v6h-2a2.5 2.5 0 0 1-5 0H9.9a2.5 2.5 0 0 1-5 0H3v-3zm13-3h2.2l-1.5-2H16v2z" />
    <circle cx="7.5" cy="17" r="1.6" fill="#16245f" />
    <circle cx="16.5" cy="17" r="1.6" fill="#16245f" />
  </svg>
);

export const DeliveryChallanPrint: React.FC<{
  data: DeliveryChallanPrintData;
  printAreaId?: string;
}> = ({ data, printAreaId = DELIVERY_CHALLAN_PRINT_AREA_ID }) => (
  <div id={printAreaId} className="dc-print">
    <style>{DELIVERY_CHALLAN_PRINT_STYLES}</style>

    <div className="header">
      <CornerTr />
      <div className="head-grid">
        <div className="h-brand">
          <div className="row1">
            <LogoMark />
            <div className="wm">
              <div className="l1">JAGDAMBA</div>
              <div className="l2">PROFILE</div>
            </div>
          </div>
          <div className="iso">AN ISO 9001:2015 CERTIFIED COMPANY</div>
        </div>

        <div className="vline" />

        <div className="h-contact">
          <div className="cl">
            <svg viewBox="0 0 24 24" fill="#f1721c"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
            <span>504/1A, GIDC Makarpura,<br />Vadodara - 390010, Gujarat, India</span>
          </div>
          <div className="cl">
            <svg viewBox="0 0 24 24" fill="#f1721c"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z" /></svg>
            <span>8799617251 / 8799617252</span>
          </div>
          <div className="cl">
            <svg viewBox="0 0 24 24" fill="#f1721c"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
            <span>jagdambaprofile@gmail.com</span>
          </div>
          <div className="cl">
            <svg viewBox="0 0 24 24" fill="#f1721c"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8zM12 4c.8 1.1 1.4 2.5 1.8 4h-3.6c.4-1.5 1-2.9 1.8-4zM4.3 14a8 8 0 0 1 0-4h2.9a16 16 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.4 1.3 3.4A8 8 0 0 1 5.1 16zM7.6 8H5.1a8 8 0 0 1 3.8-3.4C8.4 5.6 7.9 6.8 7.6 8zM12 20c-.8-1.1-1.4-2.5-1.8-4h3.6c-.4 1.5-1 2.9-1.8 4zm2.2-6H9.8a14 14 0 0 1 0-4h4.4a14 14 0 0 1 0 4zm.6 5.4c.5-1 1-2.2 1.3-3.4h2.5a8 8 0 0 1-3.8 3.4zM16.8 14a16 16 0 0 0 0-4h2.9a8 8 0 0 1 0 4h-2.9z" /></svg>
            <span>www.jagdambaprofile.com</span>
          </div>
        </div>

        <div className="vline" />

        <div className="h-gst">
          <div className="lbl">GST No.</div>
          <div className="val">{data.gstNo}</div>
        </div>
      </div>
      <div className="head-rule" />
    </div>

    <div className="title-band">
      <div className="tl" />
      <HashBars tone="n" />
      <HashBars tone="o" />
      <h1>DELIVERY CHALLAN</h1>
      <HashBars tone="o" />
      <HashBars tone="n" />
      <div className="tl" />
    </div>

    <div className="pad">
      <div className="cards">
        <div className="card challan">
          <div className="ch">CHALLAN DETAILS</div>
          <div className="cb">
            <div className="grid2">
              <div className="f a"><span className="k">Challan No.</span><span className="c">:</span><span className="v">{data.challanNo}</span></div>
              <div className="f b"><span className="k">Challan Date</span><span className="c">:</span><span className="v">{data.challanDate}</span></div>
              <div className="f a"><span className="k">Vehicle No.</span><span className="c">:</span><span className="v">{data.vehicleNo || '—'}</span></div>
              <div className="f b"><span className="k">Driver Name</span><span className="c">:</span><span className="v">{data.driverName || '—'}</span></div>
              <div className="f a"><span className="k">Driver Mobile No.</span><span className="c">:</span><span className="v">{data.driverMobile || '—'}</span></div>
              <div className="f b"><span className="k">SO No.</span><span className="c">:</span><span className="v">{data.soNo || '—'}</span></div>
            </div>
          </div>
        </div>

        <div className="card party">
          <div className="ch">PARTY DETAILS</div>
          <div className="cb">
            <div className="prow"><span className="k">Party Name</span><span className="c">:</span><span className="v">{data.partyName}</span></div>
            <div className="prow">
              <span className="k">Delivery Address</span><span className="c">:</span>
              <span className="v wrap">{data.deliveryAddress || '—'}</span>
            </div>
            <div className="prow"><span className="k">Party PO No.</span><span className="c">:</span><span className="v">{data.partyPONo || '—'}</span></div>
            <div className="prow"><span className="k">Party PO Date</span><span className="c">:</span><span className="v">{data.partyPODate || '—'}</span></div>
          </div>
        </div>
      </div>


      {/* ── Dynamic Material Spec Box — renders only when an item type is detected —— */}
      {data.itemTypeKey && data.specDetails && (
        <SpecBoxSection
          itemTypeKey={data.itemTypeKey}
          details={data.specDetails}
        />
      )}

      <div className="mat-head">MATERIAL DETAILS</div>
      <table>
        <colgroup>
          <col className="c1" /><col className="c2" /><col className="c3" /><col className="c4" />
          <col className="c5" /><col className="c6" /><col className="c7" /><col className="c8" /><col className="c9" />
        </colgroup>
        <thead className="cols">
          <tr>
            <th>Sr No.</th>
            <th>Item Name</th>
            <th>Grade</th>
            <th>Thickness<br />(mm)</th>
            <th>Width / OD<br />(mm)</th>
            <th>Length / ID<br />(mm)</th>
            <th>Nos</th>
            <th>Actual Weight<br />(KG)</th>
            <th>Rate<br />(₹/KG)</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={`${i}-${r.item}`}>
              <td className="sr">{i + 1}</td>
              <td className="l">{r.item}</td>
              <td>{r.grade}</td>
              <td>{r.thickness}</td>
              <td>{r.width}</td>
              <td>{r.length}</td>
              <td>{r.nos}</td>
              <td>{r.actualWeight}</td>
              <td>{r.rate}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mid">
        <div className="remark">
          <div className="rt">REMARK / NOTE :</div>
          {data.remark ? <div className="rb">{data.remark}</div> : null}
        </div>
        <div className="totals">
          <div className="tr"><div className="tk">Total Nos</div><div className="tv">{data.totalNos}</div></div>
          <div className="tr"><div className="tk">Total Weight (KG)</div><div className="tv">{data.totalKg}</div></div>
          <div className="tr"><div className="tk">Loading Charge</div><div className="tv">{data.loadingCharge}</div></div>
          <div className="tr"><div className="tk">Transport Charge</div><div className="tv">{data.transportCharge}</div></div>
        </div>
      </div>

      <div className="foot-grid">
        <div className="terms">
          <div className="th">
            <TermsIcon />
            <div className="tt">TERMS &amp; CONDITIONS :</div>
          </div>
          <ol>
            <li>Material received in good condition.</li>
            <li>Any shortage or damage should be reported immediately.</li>
            <li>Subject to Vadodara Jurisdiction.</li>
          </ol>
        </div>

        <div className="sign">
          <PreparedIcon />
          <div className="sl">Prepared By</div>
          <div className="line">( Sign &amp; Stamp )</div>
        </div>

        <div className="sign">
          <CheckedIcon />
          <div className="sl">Checked By</div>
          <div className="line">( Sign &amp; Stamp )</div>
        </div>

        <div className="sign">
          <ReceivedIcon />
          <div className="sl">Received By</div>
          <div className="line">( Sign &amp; Stamp )</div>
        </div>
      </div>
    </div>

    <div className="footer">
      <div className="fl">THANK YOU FOR YOUR BUSINESS !</div>
      <div className="fr">QUALITY PRODUCTS, ON TIME DELIVERY</div>
    </div>
  </div>
);
