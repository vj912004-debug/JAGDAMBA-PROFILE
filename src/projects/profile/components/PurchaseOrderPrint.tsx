import React from 'react';
import type { PurchaseOrder } from '../store/AppContext';
import { LOGO2_BASE64 } from '../utils/logo2Base64';

interface PurchaseOrderPrintProps {
  po: PurchaseOrder;
}

const formatNum = (n: number) => (n ? n.toLocaleString('en-IN') : '');

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return dateStr;
};

const FieldRow: React.FC<{ label: string; value?: string; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="po-field-row">
    <span className="po-field-label">{label}</span>
    {children ?? <span className="po-field-value">{value || ''}</span>}
  </div>
);

export const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ po }) => {
  const items = po.items || [];
  const emptyRowsCount = Math.max(0, 10 - items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const basicAmount = po.totalAmount || 0;
  const gstAmount = Math.round(basicAmount * 0.18);
  const finalAmount = basicAmount + gstAmount;

  return (
    <div className="bg-white p-0 mx-auto text-black font-sans shadow-lg print:shadow-none w-[210mm] min-h-[297mm]" id="po-print-area">
      <style>{`
        @page { size: A4 portrait; margin: 5mm; }
        #po-print-area {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          margin: 0 auto;
          padding: 8px;
          background: #fff;
          width: 210mm;
          min-height: 297mm;
          box-sizing: border-box;
          color: #000;
        }
        #po-print-area * { box-sizing: border-box; }

        .po-sheet {
          border: 1px solid #000;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .po-header {
          display: flex;
          align-items: flex-start;
          padding: 10px 12px 8px;
          border-bottom: 1px solid #000;
          position: relative;
        }
        .po-logo-col {
          width: 72px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 12px;
        }
        .po-logo { width: 62px; height: auto; }
        .po-logo-caption {
          font-size: 7.5px;
          font-weight: bold;
          font-style: italic;
          text-align: center;
          margin-top: 2px;
        }
        .po-header-center { flex: 1; text-align: center; padding-top: 2px; }
        .po-company-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          font-weight: bold;
          color: #00AEEF;
          margin-bottom: 4px;
          line-height: 1.1;
        }
        .po-company-addr {
          font-size: 11px;
          color: #D97E26;
          line-height: 1.45;
        }
        .po-company-gst {
          font-size: 11px;
          color: #D97E26;
        }
        .po-email-right {
          position: absolute;
          top: 10px;
          right: 12px;
          font-size: 11px;
          color: #000;
        }

        /* ── Section bars ── */
        .po-bar {
          background: #000;
          color: #fff !important;
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          padding: 6px 8px;
          border-bottom: 1px solid #000;
          letter-spacing: 0.3px;
        }

        /* ── Two stacked columns (Supplier | PO Details) ── */
        .po-two-cols {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .po-col {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .po-col:first-child { border-right: 1px solid #000; }
        .po-col-bar {
          background: #000;
          color: #fff !important;
          text-align: center;
          font-weight: bold;
          font-size: 11px;
          padding: 5px 8px;
          border-bottom: 1px solid #000;
        }
        .po-field-row {
          display: flex;
          align-items: flex-end;
          border-bottom: 1px solid #000;
          min-height: 28px;
          padding: 4px 8px;
          font-size: 11px;
        }
        .po-col .po-field-row:last-child { border-bottom: none; }
        .po-field-label {
          font-weight: bold;
          white-space: nowrap;
          margin-right: 4px;
        }
        .po-field-value {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 15px;
          padding: 0 4px 1px;
          font-weight: bold;
          line-height: 15px;
        }
        .po-ut-row .po-field-value { flex: 1; }
        .po-ut-row .po-tc-label {
          font-weight: bold;
          margin: 0 4px 0 10px;
          white-space: nowrap;
        }
        .po-ut-row .po-tc-value {
          width: 60px;
          border-bottom: 1px solid #000;
          min-height: 15px;
        }

        /* ── Transport ── */
        .po-transport {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-bottom: 1px solid #000;
        }
        .po-transport-cell {
          display: flex;
          align-items: flex-end;
          padding: 6px 8px;
          font-size: 11px;
          border-right: 1px solid #000;
          min-height: 30px;
        }
        .po-transport-cell:last-child { border-right: none; }
        .po-transport-cell .po-field-label { margin-right: 4px; }
        .po-transport-cell .po-field-value { flex: 1; }

        /* ── Items table ── */
        .po-table {
          width: 100%;
          border-collapse: collapse;
        }
        .po-table th, .po-table td {
          border: 1px solid #000;
          text-align: center;
          font-size: 11px;
          padding: 4px 3px;
        }
        .po-table th {
          background: #000 !important;
          color: #fff !important;
          font-weight: bold;
          padding: 5px 3px;
        }
        .po-table th:first-child, .po-table td:first-child { border-left: none; }
        .po-table th:last-child, .po-table td:last-child { border-right: none; }
        .po-table .data td { height: 23px; }
        .po-table .total-kg-cell {
          font-weight: bold;
          vertical-align: middle;
          text-align: center;
        }
        .po-table .amt-label {
          font-weight: bold;
          text-align: left;
          padding-left: 6px;
        }
        .po-table .amt-val {
          font-weight: bold;
          text-align: right;
          padding-right: 6px;
        }

        /* ── Note ── */
        .po-note-block {
          border-bottom: 1px solid #000;
          padding: 6px 8px 10px;
          font-size: 11px;
          min-height: 34px;
        }
        .po-note-block b { margin-right: 6px; }

        /* ── Terms ── */
        .po-terms {
          padding: 7px 10px 8px 22px;
          font-size: 10.5px;
          line-height: 1.55;
          border-bottom: 1px solid #000;
        }
        .po-terms ol { margin: 0; padding: 0; list-style-position: outside; }
        .po-terms li { margin-bottom: 1px; }

        /* ── Signatures (labels at TOP per template) ── */
        .po-sigs {
          display: grid;
          grid-template-columns: 1fr 1fr 1.35fr;
          min-height: 85px;
        }
        .po-sig {
          border-right: 1px solid #000;
          padding: 8px 10px;
          font-weight: bold;
          font-size: 11px;
          display: flex;
          flex-direction: column;
        }
        .po-sig:last-child { border-right: none; }
        .po-sig-right {
          align-items: flex-end;
          justify-content: space-between;
        }
        .po-sig-blue { color: #00AEEF !important; }
      `}</style>

      <div className="po-sheet">
        {/* Header */}
        <div className="po-header">
          <div className="po-logo-col">
            <img src={LOGO2_BASE64} alt="Jagdamba Profile" className="po-logo" />
            <div className="po-logo-caption">Jagdamba Profile</div>
          </div>
          <div className="po-header-center">
            <div className="po-company-name">Jagdamba Profile</div>
            <div className="po-company-addr">504/1A, GIDC Makarpura, Vadodara - 390010.</div>
            <div className="po-company-gst">
              GST No: 24AJGPP9863R1Z5&nbsp;&nbsp;&nbsp;&nbsp;Mo: 9824917250, 9824025001, 8799617254
            </div>
          </div>
          <div className="po-email-right">Email: jagdambaprofile@gmail.com</div>
        </div>

        <div className="po-bar">PURCHASE ORDER</div>

        {/* Supplier | PO Details — stacked columns */}
        <div className="po-two-cols">
          <div className="po-col">
            <div className="po-col-bar">SUPPLIER DETAILS</div>
            <FieldRow label="Party Name :" value={po.supplierName} />
            <FieldRow label="Address :" value={po.supplierAddress} />
            <FieldRow label="GST Number :" value={po.supplierGST} />
            <FieldRow label="Mobile Number :" value={po.supplierMobile} />
            <FieldRow label="Email ID :" value={po.supplierEmail} />
          </div>
          <div className="po-col">
            <div className="po-col-bar">PURCHASE ORDER DETAILS</div>
            <FieldRow label="PO No :" value={po.poNumber} />
            <FieldRow label="PO Date :" value={formatDate(po.date)} />
            <FieldRow label="Payment Terms :" value={po.paymentTerms} />
            <FieldRow label="Make :" value={po.make} />
            <div className="po-field-row po-ut-row">
              <span className="po-field-label">UT Level :</span>
              <span className="po-field-value">{po.utLevel || ''}</span>
              <span className="po-tc-label">TC</span>
              <span className="po-tc-value">{po.tc || ''}</span>
            </div>
          </div>
        </div>

        <div className="po-bar">VEHICLE TRANSPORT DETAILS</div>
        <div className="po-transport">
          <div className="po-transport-cell">
            <span className="po-field-label">Vehicle Number :</span>
            <span className="po-field-value">{po.transportNumber || ''}</span>
          </div>
          <div className="po-transport-cell">
            <span className="po-field-label">Driver Mobile No :</span>
            <span className="po-field-value">{po.driverMobile || ''}</span>
          </div>
          <div className="po-transport-cell">
            <span className="po-field-label">Transport Name :</span>
            <span className="po-field-value">{po.transportName || ''}</span>
          </div>
        </div>

        <table className="po-table">
          <thead>
            <tr>
              <th style={{ width: '5%' }}>Sr No</th>
              <th style={{ width: '13%' }}>Grade</th>
              <th style={{ width: '10%' }}>Thickness</th>
              <th style={{ width: '10%' }}>Width</th>
              <th style={{ width: '10%' }}>Length</th>
              <th style={{ width: '8%' }}>Nos</th>
              <th style={{ width: '10%' }}>Kg</th>
              <th style={{ width: '12%' }}>Rate</th>
              <th style={{ width: '12%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="data">
                <td>{idx + 1}</td>
                <td>{item.grade || ''}</td>
                <td>{item.thickness || ''}</td>
                <td>{item.width || ''}</td>
                <td>{item.length || ''}</td>
                <td>{item.nos || ''}</td>
                <td>{item.kg ? formatNum(item.kg) : ''}</td>
                <td>{item.rate ? formatNum(item.rate) : ''}</td>
                <td>{item.amount ? formatNum(item.amount) : ''}</td>
              </tr>
            ))}
            {emptyRows.map((_, idx) => (
              <tr key={`e-${idx}`} className="data">
                <td></td><td></td><td></td><td></td><td></td>
                <td></td><td></td><td></td><td></td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} rowSpan={3} className="total-kg-cell">TOTAL KG</td>
              <td rowSpan={3}>{po.totalKg ? formatNum(po.totalKg) : ''}</td>
              <td className="amt-label">BASIC AMOUNT</td>
              <td className="amt-val">{basicAmount ? formatNum(basicAmount) : ''}</td>
            </tr>
            <tr>
              <td className="amt-label">GST @ 18%</td>
              <td className="amt-val">{gstAmount ? formatNum(gstAmount) : ''}</td>
            </tr>
            <tr>
              <td className="amt-label">FINAL AMOUNT</td>
              <td className="amt-val">{finalAmount ? formatNum(finalAmount) : ''}</td>
            </tr>
          </tbody>
        </table>

        <div className="po-bar">COMMERCIAL / QUALITY DETAILS</div>
        <div className="po-note-block">
          <b>Note</b>{po.note || ''}
        </div>

        <div className="po-bar">GENERAL TERMS AND CONDITIONS</div>
        <div className="po-terms">
          <ol>
            <li>Material should be supplied strictly as per above size, grade and specification.</li>
            <li>Test Certificate / MTC report wherever applicable.</li>
            <li>Material should be free from heavy rust, lamination, oil, paint and major surface defects.</li>
            <li>Final weight, rate and payment will be as per mutually agreed terms.</li>
            <li>Delivery schedule and transport details must be confirmed before dispatch.</li>
          </ol>
        </div>

        <div className="po-sigs">
          <div className="po-sig">Prepared By</div>
          <div className="po-sig">Checked By</div>
          <div className="po-sig po-sig-right">
            <span className="po-sig-blue">For Jagdamba Profile</span>
            <span className="po-sig-blue">Authorized Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
