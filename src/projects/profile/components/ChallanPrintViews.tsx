import type { FC } from 'react';

export {
  buildDeliveryChallanPrintData as buildChallanPrintData,
  type DeliveryChallanPrintData as ChallanPrintViewProps,
  type DeliveryChallanPrintRow,
} from '../utils/deliveryChallanHelpers';

export {
  DeliveryChallanPrint,
  DELIVERY_CHALLAN_PRINT_AREA_ID,
} from './DeliveryChallanPrint';

/** @deprecated Use DELIVERY_CHALLAN_PRINT_AREA_ID */
export { DELIVERY_CHALLAN_PRINT_AREA_ID as CHALLAN_ORIGINAL_PRINT_ID } from './DeliveryChallanPrint';
/** @deprecated Duplicate copy removed — same id as original */
export { DELIVERY_CHALLAN_PRINT_AREA_ID as CHALLAN_DUPLICATE_PRINT_ID } from './DeliveryChallanPrint';

export { DeliveryChallanPrint as ChallanOriginalPrintView } from './DeliveryChallanPrint';
/** @deprecated Duplicate layout removed */
export { DeliveryChallanPrint as ChallanDuplicatePrintView } from './DeliveryChallanPrint';

export const ChallanPrintStyles: FC = () => null;
