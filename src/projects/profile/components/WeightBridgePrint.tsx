import React from 'react';
import type { WeightBridgePrintData } from '../utils/weightBridgeHelpers';
import { fmtKgSlip, fmtRs } from '../utils/weightBridgeHelpers';
import {
  WEIGHBRIDGE_ADDRESS,
  WEIGHBRIDGE_TITLE,
  WEIGHT_BRIDGE_PRINT_STYLES,
} from './weightBridgePrintStyles';

export const WEIGHT_BRIDGE_PRINT_AREA_ID = 'weight-bridge-print-area';

const HOLE_COUNT = 26;
const MAROON = '#6d1220';

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB');
};

const fmtVehicleSlip = (vehicleNo: string) =>
  vehicleNo.trim().toUpperCase().replace(/\s+/g, '');

const DmVal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (children === '' || children === null || children === undefined) return null;
  return <span className="dm-val"> {children}</span>;
};

const Sprockets: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
  <div className={`sprockets ${side}`}>
    {Array.from({ length: HOLE_COUNT }, (_, i) => (
      <div key={i} className="hole" />
    ))}
  </div>
);

const BannerSvg = () => (
  <div className="banner">
    <svg viewBox="0 0 1000 70" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={WEIGHBRIDGE_TITLE}>
      <rect x="0" y="0" width="1000" height="70" rx="20" fill={MAROON} />
      <text
        x="500"
        y="50"
        textAnchor="middle"
        textLength="930"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="46"
        fill="#ffffff"
      >
        {WEIGHBRIDGE_TITLE}
      </text>
    </svg>
  </div>
);

const TruckSvg = () => (
  <div className="truck">
    <svg viewBox="0 0 200 92" xmlns="http://www.w3.org/2000/svg" fill="none" stroke={MAROON} strokeWidth="4">
      <rect x="58" y="14" width="128" height="48" rx="2" />
      <line x1="58" y1="26" x2="186" y2="26" />
      <line x1="58" y1="38" x2="186" y2="38" />
      <line x1="58" y1="50" x2="186" y2="50" />
      <line x1="78" y1="14" x2="78" y2="62" />
      <line x1="100" y1="14" x2="100" y2="62" />
      <line x1="122" y1="14" x2="122" y2="62" />
      <line x1="144" y1="14" x2="144" y2="62" />
      <line x1="166" y1="14" x2="166" y2="62" />
      <path d="M58 62 V30 H40 L24 30 L12 44 V62 Z" />
      <rect x="26" y="34" width="16" height="13" rx="1" />
      <line x1="12" y1="62" x2="186" y2="62" />
      <circle cx="30" cy="70" r="9" />
      <circle cx="30" cy="70" r="3" fill={MAROON} />
      <circle cx="92" cy="70" r="9" />
      <circle cx="92" cy="70" r="3" fill={MAROON} />
      <circle cx="116" cy="70" r="9" />
      <circle cx="116" cy="70" r="3" fill={MAROON} />
      <circle cx="150" cy="70" r="9" />
      <circle cx="150" cy="70" r="3" fill={MAROON} />
      <circle cx="174" cy="70" r="9" />
      <circle cx="174" cy="70" r="3" fill={MAROON} />
    </svg>
  </div>
);

const NoticeBlock = () => (
  <div className="box notice">
    <div className="tag guj">સૂચના :</div>
    <div className="notice-cols">
      <div>(1) વાજન કરની વખતે પાર્ટીઓ પોતાના જવાબદાર માણસને ગાડી સાથે મોકલવી</div>
      <div className="nmid">(3) ગાડીની અંદર શું માલ છે તે તપાસવામાં આવતી નથી.</div>
      <div>(2) વજન સહી ગયા પછી અમારી કોઈપણ જવાબદારી હોતી નથી.</div>
      <div className="nmid">(4) ગાડીની ખાલી તથા ભરેલું વજન 24 કલાકની અંદર કરાવી લેવું.</div>
    </div>
  </div>
);

const TermsBlock = () => (
  <div className="box terms">
    <div className="vlabel">
      T<br />E<br />R<br />M<br />S
    </div>
    <div className="terms-list">
      <ol>
        <li>RECORD WILL NOT BE AVAILABLE AFTER ONE MONTH.</li>
        <li>VEHICLE NO. &amp; MATERIAL IS WRITTEN ACCORDING TO DRIVAL.</li>
        <li>ONCE THE VEHICLE IS REMOVED FROM PLATFORM WE ARE NOT RESPONSIBLE.</li>
        <li>ALL DISPUTES SUBJECT TO MUMBAI JURISDICTION.</li>
        <li>&quot;M&quot; MANUALLY DECLARED BY THE DRIVER / PARTY.</li>
      </ol>
    </div>
    <div className="sign">Operator&apos;s Signature</div>
  </div>
);

const WeighBridgeSlip: React.FC<{ data: WeightBridgePrintData; cutBorder?: boolean }> = ({
  data,
  cutBorder,
}) => (
  <div className={`slip${cutBorder ? ' cutborder' : ''}`}>
    {cutBorder && <span className="scissor">&#9986;</span>}
    <div className="jsr">
      <span className="guj">જય શ્રી રામ</span>
    </div>
    <BannerSvg />
    <div className="address">{WEIGHBRIDGE_ADDRESS}</div>
    <div className="subhead">
      <TruckSvg />
      <div className="govt">
        <div className="top guj">ગુજરાત સરકાર દ્વારા માન્યતા પ્રાપ્ત</div>
        <div className="bot">ELECTRONIC COMPUTERISED WEIGHBRIDGE</div>
      </div>
      <div className="hours">
        <b>24 HOURS</b>
        <span>SERVICE</span>
      </div>
    </div>
    <div className="box fields">
      <div className="frow">
        <div className="cell">
          SERIAL NO. :<DmVal>{data.serialNo}</DmVal>
        </div>
        <div className="cell">
          COPY NO. :<DmVal>{data.copyNo}</DmVal>
        </div>
        <div className="cell">
          VEHICLE NO. :<DmVal>{fmtVehicleSlip(data.vehicleNo)}</DmVal>
        </div>
      </div>
      <div className="frow">
        <div className="cell">
          SUPPLIER :<DmVal>{data.supplierName}</DmVal>
        </div>
        <div />
        <div />
      </div>
      <div className="frow">
        <div className="cell">
          GROSS :<DmVal>{fmtKgSlip(data.grossWeightKg)}</DmVal>
        </div>
        <div className="cell">
          KG. DATE :<DmVal>{fmtDate(data.grossDate)}</DmVal>
        </div>
        <div className="cell">
          TIME :<DmVal>{data.grossTime}</DmVal>
        </div>
      </div>
      <div className="frow">
        <div className="cell">
          TARE :<DmVal>{fmtKgSlip(data.tareWeightKg)}</DmVal>
        </div>
        <div className="cell">
          KG. DATE :<DmVal>{fmtDate(data.tareDate)}</DmVal>
        </div>
        <div className="cell">
          TIME :<DmVal>{data.tareTime}</DmVal>
        </div>
      </div>
      <div className="frow">
        <div className="cell">
          NETT :<DmVal>{fmtKgSlip(data.netWeightKg)}</DmVal>
        </div>
        <div className="cell">
          KG. DATE :<DmVal>{fmtDate(data.tareDate || data.grossDate)}</DmVal>
        </div>
        <div className="cell">
          TIME :<DmVal>{data.tareTime || data.grossTime}</DmVal>
        </div>
      </div>
      <div className="frow">
        <div />
        <div />
        <div className="cell">
          CHARGES (RS.) :<DmVal>{data.charges > 0 ? fmtRs(data.charges) : ''}</DmVal>
        </div>
      </div>
    </div>
    <NoticeBlock />
    <TermsBlock />
  </div>
);

export const WeightBridgePrint: React.FC<{
  data: WeightBridgePrintData;
  printAreaId?: string;
  copies?: number;
}> = ({ data, printAreaId = WEIGHT_BRIDGE_PRINT_AREA_ID, copies = 3 }) => {
  const ticketCopies = Array.from({ length: copies }, (_, i) => ({
    ...data,
    copyNo: String(i + 1),
  }));

  return (
    <div id={printAreaId} className="wb-print">
      <style>{WEIGHT_BRIDGE_PRINT_STYLES}</style>
      <div className="sheet">
        <Sprockets side="left" />
        <Sprockets side="right" />
        {ticketCopies.map((copyData, i) => (
          <WeighBridgeSlip
            key={i}
            data={copyData}
            cutBorder={i < ticketCopies.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
