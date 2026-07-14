import React from 'react';
import type { AnmsHeatAnalysis, AnmsMechanicalProperty, AnmsMtcRecord } from '../utils/anmsMtcHelpers';
import { fmtQtyNet, sumQtyNet } from '../utils/anmsMtcHelpers';
import { AnmsIsiMark } from './AnmsIsiMark';
import { ANMS_MTC_PRINT_AREA_ID, ANMS_MTC_PRINT_STYLES } from './anmsMtcPrintStyles';

const fmtPrintDate = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const heatCells = (h: AnmsHeatAnalysis) => [
  h.heatNo, h.c, h.mn, h.s, h.p, h.si, h.al, h.cr, h.cu, h.ni, h.ti, h.v, h.nb, h.mo, h.n, h.mae, h.ce,
];

const mechCells = (m: AnmsMechanicalProperty) => [
  m.itemNo, m.batchId, m.thk, m.wid, m.qtyNet, m.ys, m.uts, m.el, m.bend,
];

const emptyHeat = (): AnmsHeatAnalysis => ({
  id: 'empty', heatNo: '', c: '', mn: '', s: '', p: '', si: '', al: '', cr: '', cu: '',
  ni: '', ti: '', v: '', nb: '', mo: '', n: '', mae: '', ce: '',
});

const emptyMech = (id: string): AnmsMechanicalProperty => ({
  id, heatNo: '', itemNo: '', batchId: '', thk: '', wid: '', qtyNet: '', ys: '', uts: '', el: '', bend: '',
});

const heatLabel = (rows: AnmsHeatAnalysis[]) => {
  const nos = rows.map(h => h.heatNo.trim()).filter(Boolean);
  return nos.length ? nos.join(', ') : '';
};

export const AnmsMtcPrint: React.FC<{ data: AnmsMtcRecord }> = ({ data }) => {
  const heatRows = data.heatAnalysis.length ? data.heatAnalysis : [emptyHeat()];
  const heatNos = heatLabel(heatRows);
  const mechRows = data.mechanicalProperties.filter(m =>
    m.itemNo || m.batchId || m.thk || m.wid || m.qtyNet || m.ys || m.uts || m.el || m.bend,
  );
  const mechHeatNos = [...new Set(
    mechRows.map(m => m.heatNo.trim()).filter(Boolean).length
      ? mechRows.map(m => m.heatNo.trim()).filter(Boolean)
      : heatRows.map(h => h.heatNo.trim()).filter(Boolean),
  )].join(', ');
  const paddedMech = [...mechRows];
  while (paddedMech.length < 2) paddedMech.push(emptyMech(`pad-${paddedMech.length}`));
  const totalQty = fmtQtyNet(sumQtyNet(mechRows));
  const tcNo = data.testCertificateNo || '';

  return (
    <div id={ANMS_MTC_PRINT_AREA_ID}>
      <style>{ANMS_MTC_PRINT_STYLES}</style>
      <div className="page">
        <div className="header">
          <div className="h-logo">
            <div className="amns">
              <div className="am">AM/NS</div>
              <div className="in">INDIA</div>
            </div>
          </div>
          <div className="h-mid">
            <div className="co">ArcelorMittal Nippon Steel India Pvt Ltd</div>
            <div className="sub">HAZIRA - 394270, DIST. SURAT, GUJARAT, INDIA</div>
            <div className="sub">CIN:U27100GJ1976FTC013787</div>
            <div className="mtc">MILL TEST CERTIFICATE</div>
            <div className="mtc2">FOR HOT ROLLED MEDIUM AND HIGH TENSILE STRUCTURAL STEEL</div>
          </div>
          <div className="h-isi">
            <div className="istop">IS: 2062</div>
            <AnmsIsiMark />
            <div className="isbot">CM/L: 0007090365</div>
          </div>
        </div>

        <div className="meta">
          <div className="meta-col meta-left">
            <div className="m-row"><span className="m-label">Test Certificate No.</span><span className="m-val">{data.testCertificateNo}</span></div>
            <div className="m-row"><span className="m-label">Sale Order No.</span><span className="m-val">{data.saleOrderNo}</span></div>
            <div className="m-row"><span className="m-label">Equivalent Specification</span><span className="m-val">{data.equivalentSpecification}</span></div>
            <div className="m-row"><span className="m-label">Specification</span><span className="m-val">{data.specification}</span></div>
            <div className="m-row"><span className="m-label">Invoice No.</span><span className="m-val">{data.invoiceNo}</span></div>
            <div className="m-row"><span className="m-label">Vehicle No.</span><span className="m-val">{data.vehicleNo}</span></div>
          </div>
          <div className="meta-col meta-mid">
            <div className="m-row"><span className="m-label">Test Certificate Date</span><span className="m-val">{fmtPrintDate(data.testCertificateDate)}</span></div>
            <div className="m-row"><span className="m-label">Sales Order Date</span><span className="m-val">{fmtPrintDate(data.salesOrderDate)}</span></div>
            <div className="m-row"><span className="m-label">Product Type</span><span className="m-val">{data.productType}</span></div>
            <div className="m-row"><span className="m-label">Internal Grade</span><span className="m-val">{data.internalGrade}</span></div>
            <div className="m-row" style={{ visibility: 'hidden' }}><span className="m-label">x</span></div>
            <div className="m-row" style={{ visibility: 'hidden' }}><span className="m-label">x</span></div>
          </div>
          <div className="meta-col meta-right">
            <div className="to">To,</div>
            {data.customerTo ? <div className="to-addr">{data.customerTo}</div> : null}
          </div>
        </div>

        <div className="certify">
          WE CERTIFY THAT THE MATERIAL DESCRIBED BELOW FULLY CONFORMS TO ABOVE SPECIFICATION CHEMICAL COMPOSITION AND MECHANICAL PROPERTIES OF THE PRODUCT, AS TESTED IN ACCORDANCE WITH THE SCHEME OF TESTING AND INSPECTION
          {' '}
          CONTAINED IN THE BIS CERTIFICATION MARKS LICENCE NO. CM/L :0007090365 ARE AS INDICATED BELOW AGAINST EACH ORDER NO. ETC.
        </div>

        <div className="bar">Heat Analysis (%) of {heatNos}</div>
        <div className="tbl-wrap">
          <table className="mtc-grid heat">
            <thead>
              <tr>
                <th className="c-heatno">Heat No</th>
                <th className="c-el">C</th><th className="c-el">MN</th><th className="c-el">S</th><th className="c-el">P</th>
                <th className="c-el">SI</th><th className="c-el">AL</th><th className="c-el">CR</th><th className="c-el">CU</th>
                <th className="c-el">NI</th><th className="c-el">TI</th><th className="c-el">V</th><th className="c-el">NB</th>
                <th className="c-el">MO</th><th className="c-el">N</th><th className="c-el">MAE</th><th className="c-el">CE</th>
              </tr>
            </thead>
            <tbody>
              {heatRows.map(h => (
                <tr key={h.id}>
                  {heatCells(h).map((cell, i) => (
                    <td key={i}>{cell || '\u00A0'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tbl-fill" />
        </div>

        <div className="bar">Mechanical Properties for Batches of Heat: {mechHeatNos}</div>
        <div className="tbl-wrap">
          <table className="mtc-grid mech">
            <thead>
              <tr>
                <th className="c-item">Item No</th>
                <th className="c-batch">Batch ID</th>
                <th className="c-num">Thk</th>
                <th className="c-num">Wid</th>
                <th className="c-num">Qty Net</th>
                <th className="c-num">YS</th>
                <th className="c-num">UTS</th>
                <th className="c-num">EL</th>
                <th className="c-num">BEND</th>
              </tr>
            </thead>
            <tbody>
              {paddedMech.map(row => (
                <tr key={row.id}>
                  {mechCells(row).map((cell, i) => (
                    <td key={i}>{cell || '\u00A0'}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="lbl-total">Total</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>{totalQty !== '0.000' ? totalQty : '\u00A0'}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
          <div className="tbl-fill" />
        </div>

        <div className="body-space">
          <div className="watermark"><span>AM/NS</span><span>INDIA</span></div>
        </div>

        <div className="notes-row">
          <div className="notes">
            Note 1) Test Certificate conforms to EN 10204-3.1<br />
            Note 2) PROCESS ROUTE: HBI/DRI/BF/COREX-&gt;EAF/CONARC-&gt;LF-&gt;CCM-&gt;HSM/CSP and Steel is Fully Al-Si Killed<br />
            Note 3) The material supplied conforms to the standard rolling &amp; weight tolerances.<br />
            Note 4) 1MPa=1N/mm2= 0.102Kgf/mm2.<br />
            Note 5) Material is free from Radioactive contamination.<br />
            Note 6) Carbon Equivalent:C+Mn/6+(Cr+Mo+V)/5+(Ni+Cu)/15.<br />
            Note 7) Material is certified with latest edition of specification unless and otherwise specified.
          </div>
          <div className="legend">
            <div>
              Legends: CE: Carbon Equivalent, MAE: Nb+Ti+V, YS: Yield Strength, UTS: Ultimate Tensile Strength, EL: %
              Elongation on G.L = 5.65*SQRT(AREA), Bend Diameter:2t, Bend Angle:180deg, Bend Direction:90deg, Sample
              Orientation:- Tensile:90deg,
            </div>
            <div className="units">
              Units of measurement: Thk/Wid/Len(MM), Qty Grs/Net(Quantity Gross/Net)(MT), YS(MPA), UTS(MPA), EL(%)
            </div>
          </div>
          <div className="desig">
            <div>Designation: <b>QUALITY MANAGER</b><br />AMNSI/QAC/0003/F</div>
          </div>
        </div>

        <div className="pagefoot">Page 1 of 1 for TC: {tcNo}</div>
      </div>
    </div>
  );
};
