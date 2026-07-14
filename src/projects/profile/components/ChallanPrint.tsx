import React from 'react';
import { useAppContext, type ChallanRecord, type Order } from '../store/AppContext';
import { DeliveryChallanPrint } from './DeliveryChallanPrint';
import { buildDeliveryChallanPrintData } from '../utils/deliveryChallanHelpers';

interface ChallanPrintProps {
  challan: ChallanRecord;
  order?: Order;
}

export const ChallanPrint: React.FC<ChallanPrintProps> = ({ challan, order }) => {
  const { dispatches, parties, companyProfile } = useAppContext();
  const printData = buildDeliveryChallanPrintData(challan, order, parties, dispatches, companyProfile);

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="flex flex-col items-center w-full pb-10 bg-gray-100 min-h-screen">
      <div className="no-print flex gap-4 my-6">
        <button
          type="button"
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow-md hover:bg-blue-700 font-bold transition-colors cursor-pointer"
        >
          Print Delivery Challan
        </button>
      </div>

      <div id="challan-print-area" className="flex flex-col items-center">
        <DeliveryChallanPrint data={printData} />
      </div>
    </div>
  );
};
