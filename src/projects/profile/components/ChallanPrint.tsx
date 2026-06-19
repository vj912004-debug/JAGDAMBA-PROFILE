import React, { useState } from 'react';
import { useAppContext, type ChallanRecord, type Order } from '../store/AppContext';
import {
  buildChallanPrintData,
  ChallanDuplicatePrintView,
  ChallanOriginalPrintView,
  ChallanPrintStyles,
} from './ChallanPrintViews';

interface ChallanPrintProps {
  challan: ChallanRecord;
  order?: Order;
}

export const ChallanPrint: React.FC<ChallanPrintProps> = ({ challan, order }) => {
  const { dispatches, parties } = useAppContext();
  const printData = buildChallanPrintData(challan, order, parties, dispatches);
  const [printMode, setPrintMode] = useState<'both' | 'original'>('both');

  const handlePrint = (mode: 'both' | 'original') => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="flex flex-col items-center w-full pb-10 bg-gray-100 min-h-screen">
      <div className="no-print flex gap-4 my-6">
        <button
          onClick={() => handlePrint('original')}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow-md hover:bg-blue-700 font-bold transition-colors cursor-pointer"
        >
          Print Original Only
        </button>
        <button
          onClick={() => handlePrint('both')}
          className="bg-amber-500 text-white px-6 py-2 rounded shadow-md hover:bg-amber-600 font-bold transition-colors cursor-pointer"
        >
          Print Original & Duplicate
        </button>
      </div>

      <div id="challan-print-area" className="challan-print-root flex flex-col items-center">
        <ChallanPrintStyles />
        <ChallanOriginalPrintView {...printData} />
        <div className={`cut-line ${printMode === 'original' ? 'print-hide-duplicate' : ''}`} />
        <ChallanDuplicatePrintView
          {...printData}
          className={printMode === 'original' ? 'print-hide-duplicate' : ''}
        />
      </div>
    </div>
  );
};
