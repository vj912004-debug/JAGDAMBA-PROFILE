import React from 'react';
import type { WorkerCuttingListPrintData } from '../utils/workerCuttingListHelpers';
import { WORKER_CUTTING_LIST_PRINT_STYLES } from './workerCuttingListPrintStyles';

export const WORKER_CUTTING_LIST_PRINT_AREA_ID = 'worker-cutting-list-print-area';

const LogoMark = () => (
  <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M55 12 h13 v50 a26 26 0 0 1 -26 26 a26 26 0 0 1 -26 -26 h13 a13 13 0 0 0 13 13 a13 13 0 0 0 13 -13 z" fill="#1b2a4a" />
    <path d="M46 12 h26 a22 22 0 0 1 0 44 h-13 v-13 h13 a9 9 0 0 0 0 -18 h-13 z" fill="#ec7a2c" />
  </svg>
);

export const WorkerCuttingListPrint: React.FC<{
  data: WorkerCuttingListPrintData;
  printAreaId?: string;
}> = ({ data, printAreaId = WORKER_CUTTING_LIST_PRINT_AREA_ID }) => {
  const now = new Date();
  const printDate = now.toLocaleDateString('en-GB');
  const printTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const totalNos = data.rows.reduce((s, r) => s + r.nos, 0);

  return (
    <div id={printAreaId} className="wcl-print">
      <style>{WORKER_CUTTING_LIST_PRINT_STYLES}</style>

      <div className="top">
        <div className="brand">
          <LogoMark />
          <div className="name">
            <div className="b1">JAGDAMBA</div>
            <div className="b2">PROFILE</div>
          </div>
        </div>

        <div className="title">
          <h1>WORKER CUTTING LIST</h1>
          <div className="sub">(Cutting Work Allocation)</div>
        </div>

        <div className="meta">
          <div className="row"><span className="k">Print Date</span><span className="c">:</span><span className="v">{printDate}</span></div>
          <div className="row"><span className="k">Print Time</span><span className="c">:</span><span className="v">{printTime}</span></div>
          <div className="row"><span className="k">Page No.</span><span className="c">:</span><span className="v">1 / 1</span></div>
        </div>
      </div>

      <div className="info">
        <div className="col left">
          <div className="line"><span className="k">Allocation No.</span><span className="c">:</span><span className="v">{data.allocationNo}</span></div>
          <div className="line"><span className="k">Allocation Date</span><span className="c">:</span><span className="v">{data.allocationDate}</span></div>
        </div>
        <div className="col right">
          <div className="line"><span className="k">Worker Name</span><span className="c">:</span><span className="v">{data.workerName}</span></div>
          <div className="line">
            <span className="inline"><span className="k">Machine No.</span><span className="c">:</span><span className="v">{data.machineNo}</span></span>
            <span className="k pri">Priority</span><span className="c">:</span><span className="v">{data.priority}</span>
          </div>
        </div>
      </div>

      <table>
        <colgroup>
          <col className="c-sr" /><col className="c-item" /><col className="c-grade" /><col className="c-th" />
          <col className="c-w" /><col className="c-l" /><col className="c-nos" /><col className="c-party" />
        </colgroup>
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Item</th>
            <th>Grade</th>
            <th>Thickness<br />(mm)</th>
            <th>Width<br />(mm)</th>
            <th>Length<br />(mm)</th>
            <th>Nos</th>
            <th>Party Name</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={`${i}-${r.item}-${r.party}`}>
              <td>{i + 1}</td>
              <td className="item">{r.item}</td>
              <td>{r.grade}</td>
              <td>{r.thickness}</td>
              <td>{r.width}</td>
              <td>{r.length}</td>
              <td>{r.nos}</td>
              <td className="party">{r.party}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="label" colSpan={6}>Total Nos</td>
            <td className="total">{totalNos}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div className="note">
        <div className="head">Note :</div>
        <div>1.&nbsp; All dimensions are in MM.</div>
        <div>2.&nbsp; Please verify material grade and thickness before cutting.</div>
      </div>

      <div className="sign">
        <div className="block">
          <div className="lbl">Worker Signature</div>
          <div className="ln"></div>
        </div>
        <div className="block">
          <div className="lbl">Checked By</div>
          <div className="ln"></div>
        </div>
      </div>

      <div className="thanks">**&nbsp; Thank You&nbsp; **</div>
    </div>
  );
};
