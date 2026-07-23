"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  fetchErpData,
  saveErpData,
  ERP_VERSION,
  erpCriticalWeight,
  isSparseErpData,
  protectErpArrays,
  type ErpStoredData,
} from '../services/erpApi';
import toast from 'react-hot-toast';
import { nextPONumberFromExisting } from '../utils/poNumber';
import type { JobWorkOutwardRecord, JobWorkInwardRecord } from '../utils/jobWorkHelpers';
import type { WeighbridgeRecord } from '../utils/weightBridgeHelpers';
import type { RejectMaterialReturnRecord } from '../utils/rejectMaterialReturnHelpers';
import type { AnmsMtcRecord } from '../utils/anmsMtcHelpers';
import { mergeItemCatalog, seedItems } from '../utils/itemMasterSeed';
import { mergeSectionCatalog, seedSections } from '../utils/sectionMasterSeed';
export type { AnmsMtcRecord, AnmsHeatAnalysis, AnmsMechanicalProperty } from '../utils/anmsMtcHelpers';

// ─── Enums & Types ────────────────────────────────────────────
export type Role = 'Admin' | 'Office Entry' | 'Production Supervisor' | 'Nesting Operator' | 'Dispatch' | 'Accounts User';
export type Language = 'English' | 'Gujarati';

export type Stage =
  | 'Order Received'
  | 'Drawing Received'
  | 'Nesting Pending'
  | 'Nesting Done'
  | 'Production Pending'
  | 'Cutting In Process'
  | 'Ready'
  | 'Dispatch Done'
  | 'Challan Done'
  | 'Payment Pending'
  | 'Payment Received';

export const ALL_STAGES: Stage[] = [
  'Order Received',
  'Drawing Received',
  'Nesting Pending',
  'Nesting Done',
  'Production Pending',
  'Cutting In Process',
  'Ready',
  'Dispatch Done',
  'Challan Done',
  'Payment Pending',
  'Payment Received',
];

export type CuttingType = 'CNC Profile' | 'Circle' | 'Square' | 'Ring' | 'Plate' | 'Laser' | 'Waterjet' | 'Scrap';
export const CUTTING_TYPES: CuttingType[] = ['CNC Profile', 'Circle', 'Square', 'Ring', 'Plate', 'Laser', 'Waterjet', 'Scrap'];

export type MaterialType = 'MS' | 'SS' | 'Alloy' | 'Other';
export const MATERIAL_TYPES: MaterialType[] = ['MS', 'SS', 'Alloy', 'Other'];

export type UnitType = 'Kg' | 'Nos' | 'Set' | 'Plate' | 'Piece' | 'Job' | 'Other';
export const UNIT_TYPES: UnitType[] = ['Kg', 'Nos', 'Set', 'Plate', 'Piece', 'Job', 'Other'];

export type ScrapOwner = 'Customer' | 'Our Company';
export type PlateSource = 'Customer' | 'Stock';

export const BRANCHES = [
  'HALOL',
  'MANJUSAR',
  'MAKARPURA',
  'WAGHODIA',
  'POR',
  'KARJAN',
  'BAMANGAM',
  'BHARUCH',
  'UMARGAM',
  'SURAT',
  'RAJKOT',
  'AHMEDABAD',
  'PALEJ',
  'MEHSANA',
  'JAMNAGAR',
  'DAHEJ',
  'OTHER',
];

export const MATERIAL_GRADES = [
  'IS 2062 E250',
  'IS 2062 E350',
  'SS 304',
  'SS 316',
  'SA 516 Gr 70',
  'SA 387 Gr 11',
  'Hardox 400',
  'Hardox 500',
  'Other'
];

export const EMPLOYEES = [
  'Vraj Patel',
  'Rahul Mehta',
  'Amit Patel',
  'Vijay Shah',
  'Deepak Joshi',
  'Suresh Kumar',
  'Other'
];

// ─── Data Interfaces ──────────────────────────────────────────

export interface OrderLineItem {
  id: string;
  cuttingType: CuttingType;
  materialType: MaterialType;
  materialGrade: string;
  thickness: string;
  plateSize: string;
  length?: string;
  width?: string;
  innerDiameter?: string;
  outerDiameter?: string;
  drawingNumber: string;
  partName: string;
  quantity: number;
  totalWeight?: number;
  completedQty: number;
  dispatchedQty: number;
  unitType: UnitType;
  rate: number;
  amount: number;
  scrapBelongsTo: ScrapOwner;
  specialInstructions: string;
  fileName: string | null;
  assignedWorker?: string;
  itemStatus?: 'Pending' | 'In Progress' | 'Completed';
  completedAt?: string;
}

export interface Order {
  id: string;
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  partyName: string;
  contactPerson: string;
  mobileNumber: string;
  location: string;
  deliveryAddress: string;
  handledBy: string;
  remark: string;
  stage: Stage;
  urgent: boolean;
  deliveryOption?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  gstType?: string;
  transportationCharges?: number;
  loadingUnloadingCharges?: number;
  customerPONo?: string;
  customerPODate?: string;
  tc?: 'Yes' | 'No';
  ut?: 'Yes' | 'No';
  items: OrderLineItem[];
  createdAt: string;
}

export interface Plate {
  id: string;
  grade: string;
  thickness: string;
  size: string;
  weight: number;
  heatNumber: string;
  source: PlateSource;
  initialWeight: number;
}

export interface Usage {
  id: string;
  plateId: string;
  orderId: string;
  orderNo: string;
  usedWeight: number;
  scrapQuantity: number;
  scrapOwner: ScrapOwner;
}

export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNo: string;
  partyName: string;
  readyQty: number;
  dispatchQty: number;
  dispatchDate: string;
  vehicleNo: string;
  deliveryNote: string;
  pendingQty: number;
  remark: string;
}

export interface ChallanRecord {
  id: string;
  challanNo: string;
  challanDate: string;
  orderNo: string;
  partyName: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  dueDate: string;
  status: 'Pending' | 'Done';
}

export interface POItem {
  id: string;
  itemMasterId?: string;
  itemName?: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  nos: number;
  kg: number;
  rate: number;
  amount: number;
  heatNo?: string;
  actualWeight?: number;
  make?: string;
  sizeSection?: string;
  rateBasis?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  supplierName: string;
  supplierAddress?: string;
  supplierGST?: string;
  supplierEmail?: string;
  supplierMobile?: string;
  deliveryAddress?: string;
  deliveryLocation?: string;
  transportName?: string;
  transportNumber?: string;
  driverMobile?: string;
  paymentTerms?: string;
  make?: string;
  utLevel?: string;
  tc?: string;
  note?: string;
  invoiceNo?: string;
  customer?: string;
  location?: string;
  inspection?: string;
  loading?: string;
  transport?: string;
  items: POItem[];
  totalKg: number;
  totalAmount: number;
  status: 'Pending' | 'Partial' | 'Complete';
  attachments?: POAttachment[];
}

export interface POAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}


export interface PurchaseReceipt {
  id: string;
  poId: string;
  receivedQty: number;
  date: string;
  remark?: string;
  billNo?: string;
  transporterName?: string;
  vehicleNo?: string;
  tcAvailable?: 'Yes' | 'No';
  items?: { itemId: string; receivedQty: number }[];
  grnNumber?: string;
  challanNo?: string;
  invoiceNo?: string;
  transportBillId?: string;
  
  // Inspection / Store Fields
  conditionOfGoods?: 'Accepted' | 'Rejected' | 'Partial';
  inspectedBy?: string;
  inspectionRemark?: string;
  
  // Accounts Fields
  invoiceStatus?: 'Pending' | 'Processed';
  invoiceProcessedBy?: string;
  invoiceProcessedDate?: string;
  invoiceAmount?: number;
}

export interface TransportBillRecord {
  id: string;
  billNo: string;
  billDate: string;
  transportName: string;
  vehicleNo: string;
  billAgainst: string;
  remark?: string;
  receiptIds: string[];
  totalWeightKg: number;
}

export interface CompanyProfileData {
  name: string;
  gst: string;
  pan: string;
  address: string;
  mobile: string;
  email: string;
}

export interface ErpPreferencesData {
  fy: string;
  currency: string;
  gst: string;
  dateFmt: string;
  decimals: string;
  prefix: string;
}

export interface CuttingAllocationRow {
  id: string;
  itemType: string;
  grade: string;
  thickness: string;
  widthOd: string;
  lengthId: string;
  drawingNo: string;
  nos: number;
  karigar: string;
  readyQty: number;
}

export interface CuttingAllocationRecord {
  id: string;
  entryNo: string;
  entryDate: string;
  orderNo: string;
  partyName: string;
  remark: string;
  rows: CuttingAllocationRow[];
}

export interface CNCRateCalculationRecord {
  id: string;
  inquiryNo: string;
  inquiryDate: string;
  partyName: string;
  form: Record<string, string>;
  savedAt: string;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfileData = {
  name: 'Jagdamba Profile',
  gst: '24ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  address: '',
  mobile: '9876543210',
  email: 'info@jagdambaprofile.com',
};

export const DEFAULT_ERP_PREFERENCES: ErpPreferencesData = {
  fy: '2026-2027',
  currency: 'INR - Indian Rupee',
  gst: '18%',
  dateFmt: 'DD/MM/YYYY',
  decimals: '2',
  prefix: 'INV/2627/',
};

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  details: string;
  type: 'info' | 'warning' | 'alert';
  orderNo?: string;
}

export interface DispatchHistoryItem {
  partyName: string;
  dispatchDate: string;
  salesOrderNumber: string;
  tcNumber: string;
  emailStatus: 'Sent' | 'Not Sent';
  resendHistory: string[];
}

export interface TCRecord {
  id: string;
  heatNumber: string;
  plateNumber: string;
  tcNumber: string;
  tcDate: string;
  salesOrderNumber: string;
  salesOrderDate: string;
  purchaseOrderNumber: string;
  purchaseOrderDate: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  grnNumber: string;
  grade: string;
  thickness: string;
  width: string;
  length: string;
  plateWeight: string;
  make: string;
  standard: string;
  batchNumber?: string;
  remarks: string;
  emailStatus: 'Sent' | 'Not Sent';
  pdfData?: string;
  pdfName?: string;
  platePhotoData?: string;
  platePhotoName?: string;
  heatMarkingPhotoData?: string;
  heatMarkingPhotoName?: string;
  labReportData?: string;
  labReportName?: string;
  supplierName?: string;
  nos?: string;
  dispatchHistory: DispatchHistoryItem[];
}

export interface QuotationItem {
  id: string;
  shape: 'Square' | 'Ring' | 'CNC Profile';
  grade: string;
  make?: string;
  thickness: number;
  width: number;
  length: number;
  od: number;
  id_dim: number;
  nos: number;
  weight: number;
  rate: number;
  odRate: number;
  idRate: number;
  amount: number;
  remark: string;
}

export interface QuotationRecord {
  id: string;
  quoteNo: string;
  date: string;
  validUntil: string;
  partyName: string;
  contactPerson: string;
  mobileNo: string;
  address: string;
  paymentTerms?: string;
  loadingChargeNote?: string;
  transportChargeNote?: string;
  validityDays?: number;
  utLevel?: string;
  salesPerson?: string;
  items: QuotationItem[];
  loadingCharges: number;
  transportCharges: number;
  gstRate: number;
  totalAmount: number;
  grandTotal: number;
}

export interface CNCItem {
  id: string;
  shape: 'CNC Profile' | 'Square';
  drawingNo: string;
  grade: string;
  thickness: number;
  width: number;
  length: number;
  plateNos: number;
  plateRate: number;
  partOfNos: number;
  finishGoodWeight: number;
  mtr: number;
  piercing: number;
  piercingType: 'Full' | 'Half' | 'Manual';
  burningLossFactor: number;
  scrapRate: number;
  meterFactor: number;
  piercingRate: number;
  amount: number;
  finalRate: number;
  plateWeight: number;
}

export interface CNCQuotationRecord {
  id: string;
  quoteNo: string;
  inquiryNo?: string;
  date: string;
  partyName: string;
  mobileNo: string;
  items: CNCItem[];
  loadingCharges: number;
  transportCharges: number;
  gstRate: number;
  totalAmount: number;
  grandTotal: number;
  status?: 'Pending' | 'Order Received';
  poNo?: string;
  poDate?: string;
  orderQty?: number;
  deliveryDate?: string;
  orderRemark?: string;
}

export interface RingQuotationItem {
  id: string;
  grade: string;
  thickness: string;
  od: string;
  id_: string;
  odRate: string;
  idRate: string;
  nos: string;
  ringWeight: number;
  ringRateKg: number;
  ringRateNos: number;
  amount: number;
}

export interface RingQuotationRecord {
  id: string;
  quoteNo: string;
  inquiryNo: string;
  date: string;
  partyName: string;
  partyAddress?: string;
  partyAddressLine2?: string;
  partyGst?: string;
  partyEmail?: string;
  partyPhone?: string;
  remark?: string;
  gstRate: number;
  items: RingQuotationItem[];
  totalNos: number;
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export interface PartyMaster {
  id: string;
  partyName: string;
  contactPerson: string;
  mobileNumber: string;
  location: string;
  deliveryAddress: string;
  paymentTerms?: string;
  gstNumber?: string;
  email?: string;
  address?: string;
  supplierAddress?: string;
  reference?: string;
  partyCode?: string;
  category?: string;
  mobile2?: string;
  whatsappNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  panNumber?: string;
  msmeNumber?: string;
  salesPerson?: string;
  followupPerson?: string;
  remark?: string;
  partyStatus?: string;
  /** Grades linked to this party — used in PO item grade dropdown when this supplier is selected */
  grades?: string[];
}

export interface GradeMasterRecord {
  id: string;
  code: string;
  name: string;
  density: string;
  standard: string;
  description: string;
  status: string;
}

export interface ItemMasterRecord {
  id: string;
  code: string;
  name: string;
  type: string;
  grade: string;
  unit: string;
  hsn: string;
}

export type SectionWeightMode = 'per_meter' | 'pipe' | 'plate';

export interface SectionMasterRecord {
  id: string;
  code: string;
  category: string;
  size: string;
  kgPerMeter: string;
  weightMode: SectionWeightMode;
  status: string;
}

export interface WorkerMasterRecord {
  id: string;
  code: string;
  name: string;
  mobile: string;
  skill: string;
  rate: string;
  status: string;
}

export interface TransportVehicle {
  id: string;
  vehicleNo: string;
  vehicleType: string;
  vehicleCapacity: string;
  driverName: string;
  driverMobileNo: string;
  altMobileNo: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TransportMasterRecord {
  id: string;
  code: string;
  name: string;
  contact: string;
  mobile: string;
  phone?: string;
  altMobile?: string;
  address?: string;
  gst: string;
  city: string;
  state?: string;
  pincode?: string;
  email?: string;
  vehicleCapacity?: string;
  vehicleType?: string;
  ratePerKg?: string;
  remark?: string;
  vehicles?: TransportVehicle[];
}

// ─── Context Type ─────────────────────────────────────────────

export interface User {
  username: string;
  role: Role;
  displayName: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  role: Role;
  language: Language;
  setLanguage: (lang: Language) => void;
  branch: string;
  setBranch: (b: string) => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  addOrder: (order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStage: (id: string, stage: Stage) => Promise<void>;
  updateItemStatus: (orderId: string, itemId: string, status: 'Pending' | 'In Progress' | 'Completed') => Promise<void>;
  updateItemCompletedQty: (orderId: string, itemId: string, qty: number) => Promise<void>;
  updateItemWorker: (orderId: string, itemId: string, workerName: string) => Promise<void>;
  dispatchItems: (orderId: string, itemDispatches: { itemId: string; qty: number }[], vehicleNo: string, remark: string) => Promise<void>;

  plates: Plate[];
  setPlates: React.Dispatch<React.SetStateAction<Plate[]>>;

  usages: Usage[];
  setUsages: React.Dispatch<React.SetStateAction<Usage[]>>;

  dispatches: DispatchRecord[];
  setDispatches: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;

  challans: ChallanRecord[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanRecord[]>>;

  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp' | 'user' | 'role'>) => void;

  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  purchaseReceipts: PurchaseReceipt[];
  setPurchaseReceipts: React.Dispatch<React.SetStateAction<PurchaseReceipt[]>>;

  tcRecords: TCRecord[];
  setTCRecords: React.Dispatch<React.SetStateAction<TCRecord[]>>;
  addTCRecord: (tc: TCRecord) => void;
  updateTCRecord: (tc: TCRecord) => void;
  deleteTCRecord: (id: string) => void;

  quotations: QuotationRecord[];
  setQuotations: React.Dispatch<React.SetStateAction<QuotationRecord[]>>;
  addQuotation: (q: QuotationRecord) => void;
  updateQuotation: (q: QuotationRecord) => void;
  deleteQuotation: (id: string) => void;

  cncQuotations: CNCQuotationRecord[];
  setCNCQuotations: React.Dispatch<React.SetStateAction<CNCQuotationRecord[]>>;
  addCNCQuotation: (q: CNCQuotationRecord) => void;
  updateCNCQuotation: (q: CNCQuotationRecord) => void;
  deleteCNCQuotation: (id: string) => void;

  ringQuotations: RingQuotationRecord[];
  setRingQuotations: React.Dispatch<React.SetStateAction<RingQuotationRecord[]>>;
  addRingQuotation: (q: RingQuotationRecord) => void;
  updateRingQuotation: (q: RingQuotationRecord) => void;
  deleteRingQuotation: (id: string) => void;

  transportBills: TransportBillRecord[];
  addTransportBill: (bill: TransportBillRecord) => void;

  companyProfile: CompanyProfileData;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfileData>>;
  preferences: ErpPreferencesData;
  setPreferences: React.Dispatch<React.SetStateAction<ErpPreferencesData>>;
  cuttingAllocations: CuttingAllocationRecord[];
  setCuttingAllocations: React.Dispatch<React.SetStateAction<CuttingAllocationRecord[]>>;
  cncRateCalculations: CNCRateCalculationRecord[];
  setCNCRateCalculations: React.Dispatch<React.SetStateAction<CNCRateCalculationRecord[]>>;
  jobWorkOutwards: JobWorkOutwardRecord[];
  setJobWorkOutwards: React.Dispatch<React.SetStateAction<JobWorkOutwardRecord[]>>;
  jobWorkInwards: JobWorkInwardRecord[];
  setJobWorkInwards: React.Dispatch<React.SetStateAction<JobWorkInwardRecord[]>>;
  weighbridgeEntries: WeighbridgeRecord[];
  setWeighbridgeEntries: React.Dispatch<React.SetStateAction<WeighbridgeRecord[]>>;

  rejectMaterialReturns: RejectMaterialReturnRecord[];
  setRejectMaterialReturns: React.Dispatch<React.SetStateAction<RejectMaterialReturnRecord[]>>;

  anmsMtcRecords: AnmsMtcRecord[];
  setAnmsMtcRecords: React.Dispatch<React.SetStateAction<AnmsMtcRecord[]>>;

  /** Immediately persist ERP data to browser cache and server (skip debounce) */
  persistErpNow: (override?: Partial<StoredData>) => Promise<void>;

  nextOrderNo: () => string;
  nextChallanNo: () => string;
  nextPONo: () => string;

  parties: PartyMaster[];
  setParties: React.Dispatch<React.SetStateAction<PartyMaster[]>>;
  addParty: (party: Omit<PartyMaster, 'id'>) => Promise<PartyMaster>;
  updateParty: (party: PartyMaster) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
  importParties: (rows: Omit<PartyMaster, 'id'>[]) => Promise<{ saved: number; skipped: number }>;

  grades: GradeMasterRecord[];
  addGrade: (grade: Omit<GradeMasterRecord, 'id'>) => Promise<GradeMasterRecord>;
  updateGrade: (grade: GradeMasterRecord) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;

  items: ItemMasterRecord[];
  addItem: (item: Omit<ItemMasterRecord, 'id'>) => Promise<ItemMasterRecord>;
  updateItem: (item: ItemMasterRecord) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  sections: SectionMasterRecord[];
  addSection: (section: Omit<SectionMasterRecord, 'id'>) => Promise<SectionMasterRecord>;
  updateSection: (section: SectionMasterRecord) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  workers: WorkerMasterRecord[];
  addWorker: (worker: Omit<WorkerMasterRecord, 'id'>) => Promise<WorkerMasterRecord>;
  updateWorker: (worker: WorkerMasterRecord) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  transports: TransportMasterRecord[];
  addTransport: (transport: Omit<TransportMasterRecord, 'id'>) => Promise<TransportMasterRecord>;
  updateTransport: (transport: TransportMasterRecord) => Promise<void>;
  deleteTransport: (id: string) => Promise<void>;
}

// ─── Translations ─────────────────────────────────────────────

const translations: Record<Language, Record<string, string>> = {
  English: {
    dashboard: 'Dashboard',
    orderEntry: 'Order Entry',
    productionStatus: 'Production Status',
    plateTracking: 'Plate Tracking',
    dispatch: 'Dispatch',
    challan: 'Challan',
    reports: 'Reports',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    addItem: 'Add Item',
    totalOrders: 'Total Orders',
    pendingJobs: 'Pending Jobs',
    readyForDispatch: 'Ready for Dispatch',
    urgentDeliveries: 'Urgent Deliveries',
    pendingChallans: 'Pending Challans',
    stockBalance: 'Stock Balance',
    orderReceived: 'Order Received',
    drawingReceived: 'Drawing Received',
    nestingPending: 'Nesting Pending',
    nestingDone: 'Nesting Done',
    productionPending: 'Production Pending',
    cuttingInProcess: 'Cutting In Process',
    ready: 'Ready',
    dispatchDone: 'Dispatch Done',
    challanDone: 'Challan Done',
    paymentPending: 'Payment Pending',
    paymentReceived: 'Payment Received',
    purchaseOrder: 'Purchase Order',
    materialReceipt: 'Material Receipt',
    materialReceiptReport: 'Material Receipt Report',
    materialPendingReport: 'Purchase Order Pending Report',
    ringRate: 'Ring Rate Entry',
    plateQuotation: 'Plate Quotation',
    cuttingAllocation: 'Cutting Allocation',
    workerCutting: 'Worker Cutting List',
    purchaseReports: 'Purchase Reports',
    pendingPurchase: 'Pending Purchase',
    supplierWise: 'Supplier Wise',
    itemWiseStock: 'Item Wise Stock',
    completedPurchase: 'Completed Purchase',
    poNumber: 'PO Number',
    supplierName: 'Supplier Name',
    materialGrade: 'Material Grade',
    orderedQty: 'Ordered Qty',
    receivedQty: 'Received Qty',
    pendingQty: 'Pending Qty',
    rate: 'Rate',
    status: 'Status',
    partyName: 'Party Name',
    orderNo: 'Order No',
    date: 'Date',
    productionList: 'Production List',
    assignedWorker: 'Assigned Worker',
    itemStatus: 'Item Status',
    markInProgress: 'Mark In Progress',
    markCompleted: 'Mark Completed',
    grnReport: 'GRN Report',
    alertCenter: 'Alert Center',
    activityFeed: 'Activity Feed',
    tcManagement: 'TC Management',
    heatNumber: 'Heat Number',
    plateNumber: 'Plate Number',
    tcNumber: 'TC Number',
    tcDate: 'TC Date',
    salesOrderNumber: 'Sales Order Number',
    salesOrderDate: 'Sales Order Date',
    purchaseOrderNumber: 'Purchase Order Number',
    purchaseOrderDate: 'Purchase Order Date',
    supplierInvoiceNumber: 'Supplier Invoice Number',
    supplierInvoiceDate: 'Supplier Invoice Date',
    grnNumber: 'GRN Number',
    grade: 'Grade',
    thickness: 'Thickness',
    width: 'Width',
    length: 'Length',
    plateWeight: 'Plate Weight',
    make: 'Make / Company',
    standard: 'Standard',
    batchNumber: 'Batch Number',
    remarks: 'Remarks',
    emailStatus: 'Email Status',
    dispatchHistory: 'Dispatch History',
    historyTracking: 'History Tracking',
    advancedSearch: 'Advanced Search',
    duplicateAlert: 'Duplicate Alert',
    quotation: 'Quotation',
    cncQuotation: 'CNC Quotation 2',
    partyMaster: 'Party Master',
  },
  Gujarati: {
    dashboard: 'ડેશબોર્ડ',
    orderEntry: 'ઓર્ડર એન્ટ્રી',
    productionStatus: 'ઉત્પાદન સ્થિતિ',
    plateTracking: 'પ્લેટ ટ્રેકિંગ',
    dispatch: 'ડિસ્પેચ',
    challan: 'ચલણ',
    reports: 'રિપોર્ટ્સ',
    save: 'સેવ કરો',
    cancel: 'રદ કરો',
    search: 'શોધો',
    filter: 'ફિલ્ટર',
    export: 'નિકાસ',
    addItem: 'આઈટમ ઉમેરો',
    totalOrders: 'કુલ ઓર્ડર',
    pendingJobs: 'બાકી કામ',
    readyForDispatch: 'ડિસ્પેચ માટે તૈયાર',
    urgentDeliveries: 'તાત્કાલિક ડિલિવરી',
    pendingChallans: 'બાકી ચલણ',
    stockBalance: 'સ્ટોક બેલેન્સ',
    orderReceived: 'ઓર્ડર મળ્યો',
    drawingReceived: 'ડ્રોઇંગ મળ્યું',
    nestingPending: 'નેસ્ટિંગ બાકી',
    nestingDone: 'નેસ્ટિંગ થઈ ગયું',
    productionPending: 'ઉત્પાદન બાકી',
    cuttingInProcess: 'કટીંગ ચાલુ છે',
    ready: 'તૈયાર',
    challanDone: 'ચલણ થયું',
    paymentPending: 'પેમેન્ટ બાકી',
    paymentReceived: 'પેમેન્ટ મળ્યું',
    purchaseOrder: 'ખરીદી ઓર્ડર',
    materialReceipt: 'મટીરીયલ રિસીપ્ટ',
    materialReceiptReport: 'મટીરીયલ રિસીપ્ટ રિપોર્ટ',
    materialPendingReport: 'મટીરીયલ પેન્ડિંગ રિપોર્ટ',
    ringRate: 'રિંગ રેટ એન્ટ્રી',
    plateQuotation: 'પ્લેટ ક્વોટેશન',
    cuttingAllocation: 'કટિંગ એલોકેશન',
    workerCutting: 'વર્કર કટિંગ લિસ્ટ',
    purchaseReports: 'ખરીદી રિપોર્ટ્સ',
    pendingPurchase: 'બાકી ખરીદી',
    supplierWise: 'સપ્લાયર મુજબ',
    itemWiseStock: 'આઇટમ મુજબ સ્ટોક',
    completedPurchase: 'પૂર્ણ ખરીદી',
    productionList: 'ઉત્પાદન યાદી',
    assignedWorker: 'સોંપેલ કાર્યકર',
    markCompleted: 'પૂર્ણ તરીકે માર્ક કરો',
    grnReport: 'GRN રિપોર્ટ',
    tcManagement: 'TC મેનેજમેન્ટ',
    heatNumber: 'હીટ નંબર',
    plateNumber: 'પ્લેટ નંબર',
    tcNumber: 'TC નંબર',
    tcDate: 'TC તારીખ',
    grade: 'ગ્રેડ',
    thickness: 'જાડાઈ',
    width: 'પહોળાઈ',
    length: 'લંબાઈ',
    plateWeight: 'પ્લેટ વજન',
    make: 'કંપની / મેક',
    quotation: 'કોટેશન',
    cncQuotation: 'CNC Quotation 2',
    partyMaster: 'પાર્ટી માસ્ટર',
  },
};

// ─── Seed Data ────────────────────────────────────────────────

const seedOrders: Order[] = [
  {
    id: "ord-101",
    orderNo: "JP-1205",
    orderDate: "2026-05-15",
    deliveryDate: "2026-05-22",
    partyName: "SUPERIOR STEEL FABRICATORS",
    contactPerson: "Mr. Rajan Patel",
    mobileNumber: "9876543210",
    location: "Vadodara",
    deliveryAddress: "PLOT NO. 23/B, GIDC MAKARPURA, VADODARA - 390010",
    handledBy: "Vraj Patel",
    remark: "High accuracy profile cutting required",
    stage: "Challan Done",
    urgent: true,
    deliveryOption: "Self Pick",
    paymentTerms: "30 Days Credit",
    termsAndConditions: "Material standard as per drawings.",
    gstType: "CGST/SGST",
    transportationCharges: 1500,
    loadingUnloadingCharges: 500,
    customerPONo: "PO-SSF-2026-89",
    customerPODate: "2026-05-14",
    tc: "Yes",
    ut: "No",
    items: [
      {
        id: "item-1",
        cuttingType: "CNC Profile",
        materialType: "MS",
        materialGrade: "IS 2062 E250",
        thickness: "25mm",
        plateSize: "2000x3000",
        drawingNumber: "DRW-SSF-01",
        partName: "Flange Plate 650 OD",
        quantity: 5,
        completedQty: 5,
        dispatchedQty: 5,
        unitType: "Nos",
        rate: 3400,
        amount: 17000,
        scrapBelongsTo: "Customer",
        specialInstructions: "Clean edges, no burr.",
        fileName: null,
        itemStatus: "Completed"
      },
      {
        id: "item-2",
        cuttingType: "CNC Profile",
        materialType: "MS",
        materialGrade: "IS 2062 E350",
        thickness: "40mm",
        plateSize: "1500x3000",
        drawingNumber: "DRW-SSF-02",
        partName: "Support Ring 450 ID",
        quantity: 3,
        completedQty: 3,
        dispatchedQty: 3,
        unitType: "Nos",
        rate: 5800,
        amount: 17400,
        scrapBelongsTo: "Our Company",
        specialInstructions: "UT Checked Plate.",
        fileName: null,
        itemStatus: "Completed"
      }
    ],
    createdAt: "2026-05-15T10:00:00.000Z"
  }
];
const seedPlates: Plate[] = [];
const seedUsages: Usage[] = [];
const seedDispatches: DispatchRecord[] = [
  {
    id: "disp-101",
    orderId: "ord-101",
    orderNo: "JP-1205",
    partyName: "SUPERIOR STEEL FABRICATORS",
    readyQty: 8,
    dispatchQty: 8,
    dispatchDate: "2026-05-20",
    vehicleNo: "GJ-06-ZZ-4521",
    deliveryNote: "DN-8964",
    pendingQty: 0,
    remark: "Delivered in perfect condition"
  }
];
const seedChallans: ChallanRecord[] = [
  {
    id: "ch-101",
    challanNo: "CH-2026-001",
    challanDate: "2026-05-20",
    orderNo: "JP-1205",
    partyName: "SUPERIOR STEEL FABRICATORS",
    taxableAmount: 34400,
    gstAmount: 6192,
    totalAmount: 40592,
    amountPaid: 0,
    balanceAmount: 40592,
    dueDate: "2026-05-27",
    status: "Pending"
  }
];
const seedPurchaseOrders: PurchaseOrder[] = [];
const seedPurchaseReceipts: PurchaseReceipt[] = [];
const seedTCRecords: TCRecord[] = [];
const seedParties: PartyMaster[] = [
  {
    id: "party-101",
    partyName: "SUPERIOR STEEL FABRICATORS",
    contactPerson: "Mr. Rajan Patel",
    mobileNumber: "9876543210",
    location: "Vadodara",
    deliveryAddress: "PLOT NO. 23/B, GIDC MAKARPURA, VADODARA - 390010",
    paymentTerms: "30 Days Credit",
    gstNumber: "24AAACS1234F1Z0",
    email: "superiorsteel@gmail.com",
    address: "PLOT NO. 23/B, GIDC MAKARPURA, VADODARA - 390010",
    supplierAddress: "PLOT NO. 23/B, GIDC MAKARPURA, VADODARA - 390010",
    reference: ""
  }
];

const seedGrades: GradeMasterRecord[] = MATERIAL_GRADES.slice(0, 5).map((name, i) => ({
  id: `grade-${i + 1}`,
  code: `GR-${String(i + 1).padStart(2, '0')}`,
  name,
  density: '7850',
  standard: 'IS',
  description: '',
  status: 'Active',
}));

// ─── LocalStorage Helpers ─────────────────────────────────────

const STORAGE_KEY = 'jagdamba_erp_data';
const AUTH_KEY = 'jagdamba_erp_auth';
const STORAGE_VERSION_KEY = 'jagdamba_erp_data_version';
const CURRENT_VERSION = ERP_VERSION;

interface StoredData {
  orders: Order[];
  plates: Plate[];
  usages: Usage[];
  dispatches: DispatchRecord[];
  challans: ChallanRecord[];
  purchaseOrders: PurchaseOrder[];
  purchaseReceipts: PurchaseReceipt[];
  tcRecords: TCRecord[];
  quotations: QuotationRecord[];
  cncQuotations: CNCQuotationRecord[];
  ringQuotations: RingQuotationRecord[];
  transportBills: TransportBillRecord[];
  logs: ActivityLog[];
  parties: PartyMaster[];
  grades: GradeMasterRecord[];
  items: ItemMasterRecord[];
  sections: SectionMasterRecord[];
  workers: WorkerMasterRecord[];
  transports: TransportMasterRecord[];
  companyProfile: CompanyProfileData;
  preferences: ErpPreferencesData;
  cuttingAllocations: CuttingAllocationRecord[];
  cncRateCalculations: CNCRateCalculationRecord[];
  jobWorkOutwards: JobWorkOutwardRecord[];
  jobWorkInwards: JobWorkInwardRecord[];
  weighbridgeEntries: WeighbridgeRecord[];
  rejectMaterialReturns: RejectMaterialReturnRecord[];
  anmsMtcRecords: AnmsMtcRecord[];
}

function loadAuth(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveAuth(user: User | null) {
  try {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  } catch { /* ignore */ }
}

function loadFromStorage(): StoredData | null {
  if (typeof window === 'undefined') return null;
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (version !== CURRENT_VERSION) {
      // Keep saved data — only bump version (do not wipe parties/orders on app update)
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    }
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    return;
  } catch (err) {
    console.warn('localStorage full — saving without TC attachments', err);
  }
  try {
    const lite: StoredData = {
      ...data,
      tcRecords: data.tcRecords.map((tc) => {
        const { pdfData, platePhotoData, heatMarkingPhotoData, labReportData, ...rest } = tc;
        return rest;
      }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lite));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    toast.error('Browser storage full — TC attachments kept in memory; saving full data to server.');
  } catch (err) {
    console.error('localStorage save failed:', err);
    toast.error('Browser storage full — save to server may still work. Try removing large TC attachments.');
  }
}

function getSeedData(): StoredData {
  return {
    orders: seedOrders,
    plates: seedPlates,
    usages: seedUsages,
    dispatches: seedDispatches,
    challans: seedChallans,
    purchaseOrders: seedPurchaseOrders,
    purchaseReceipts: seedPurchaseReceipts,
    tcRecords: seedTCRecords,
    quotations: [],
    cncQuotations: [],
    ringQuotations: [],
    transportBills: [],
    logs: [],
    parties: seedParties,
    grades: seedGrades,
    items: seedItems,
    sections: seedSections,
    workers: [],
    transports: [],
    companyProfile: DEFAULT_COMPANY_PROFILE,
    preferences: DEFAULT_ERP_PREFERENCES,
    cuttingAllocations: [],
    cncRateCalculations: [],
    jobWorkOutwards: [],
    jobWorkInwards: [],
    weighbridgeEntries: [],
    rejectMaterialReturns: [],
    anmsMtcRecords: [],
  };
}

type StoredDataSetters = {
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setPlates: React.Dispatch<React.SetStateAction<Plate[]>>;
  setUsages: React.Dispatch<React.SetStateAction<Usage[]>>;
  setDispatches: React.Dispatch<React.SetStateAction<DispatchRecord[]>>;
  setChallans: React.Dispatch<React.SetStateAction<ChallanRecord[]>>;
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  setPurchaseReceipts: React.Dispatch<React.SetStateAction<PurchaseReceipt[]>>;
  setTCRecords: React.Dispatch<React.SetStateAction<TCRecord[]>>;
  setQuotations: React.Dispatch<React.SetStateAction<QuotationRecord[]>>;
  setCNCQuotations: React.Dispatch<React.SetStateAction<CNCQuotationRecord[]>>;
  setRingQuotations: React.Dispatch<React.SetStateAction<RingQuotationRecord[]>>;
  setTransportBills: React.Dispatch<React.SetStateAction<TransportBillRecord[]>>;
  setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
  setParties: React.Dispatch<React.SetStateAction<PartyMaster[]>>;
  setGrades: React.Dispatch<React.SetStateAction<GradeMasterRecord[]>>;
  setItems: React.Dispatch<React.SetStateAction<ItemMasterRecord[]>>;
  setSections: React.Dispatch<React.SetStateAction<SectionMasterRecord[]>>;
  setWorkers: React.Dispatch<React.SetStateAction<WorkerMasterRecord[]>>;
  setTransports: React.Dispatch<React.SetStateAction<TransportMasterRecord[]>>;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfileData>>;
  setPreferences: React.Dispatch<React.SetStateAction<ErpPreferencesData>>;
  setCuttingAllocations: React.Dispatch<React.SetStateAction<CuttingAllocationRecord[]>>;
  setCNCRateCalculations: React.Dispatch<React.SetStateAction<CNCRateCalculationRecord[]>>;
  setJobWorkOutwards: React.Dispatch<React.SetStateAction<JobWorkOutwardRecord[]>>;
  setJobWorkInwards: React.Dispatch<React.SetStateAction<JobWorkInwardRecord[]>>;
  setWeighbridgeEntries: React.Dispatch<React.SetStateAction<WeighbridgeRecord[]>>;
  setRejectMaterialReturns: React.Dispatch<React.SetStateAction<RejectMaterialReturnRecord[]>>;
  setAnmsMtcRecords: React.Dispatch<React.SetStateAction<AnmsMtcRecord[]>>;
};

function pickArray<T>(primary: T[] | undefined, fallback: T[] | undefined): T[] {
  if (Array.isArray(primary) && primary.length > 0) return primary;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return Array.isArray(primary) ? primary : [];
}

function mergeMasterRows<T extends { id: string }>(
  primary: T[] | undefined,
  localRows: T[] | undefined,
  fallback: T[],
): T[] {
  const base = Array.isArray(primary) ? primary : (Array.isArray(localRows) ? localRows : fallback);
  if (!localRows?.length) return base.length ? base : fallback;
  const map = new Map(base.map((x) => [x.id, x]));
  for (const row of localRows) map.set(row.id, row);
  return Array.from(map.values());
}

/** Merge server + local cache into one payload (never prefer empty primary over non-empty local). */
function mergeStoredData(primary: Partial<StoredData> | null | undefined, local: StoredData | null): StoredData {
  const p = primary || {};
  return {
    orders: pickArray(p.orders, local?.orders),
    plates: pickArray(p.plates, local?.plates),
    usages: pickArray(p.usages, local?.usages),
    dispatches: pickArray(p.dispatches, local?.dispatches),
    challans: pickArray(p.challans, local?.challans),
    purchaseOrders: pickArray(p.purchaseOrders, local?.purchaseOrders),
    purchaseReceipts: pickArray(p.purchaseReceipts, local?.purchaseReceipts),
    tcRecords: pickArray(p.tcRecords, local?.tcRecords),
    quotations: pickArray(p.quotations, local?.quotations),
    cncQuotations: mergeMasterRows(p.cncQuotations, local?.cncQuotations, []),
    ringQuotations: mergeMasterRows(p.ringQuotations, local?.ringQuotations, []),
    transportBills: pickArray(p.transportBills, local?.transportBills),
    logs: pickArray(p.logs, local?.logs),
    parties: mergeMasterRows(p.parties, local?.parties, seedParties),
    grades: mergeMasterRows(p.grades, local?.grades, seedGrades),
    items: mergeItemCatalog(mergeMasterRows(p.items, local?.items, seedItems)),
    sections: mergeSectionCatalog(mergeMasterRows(p.sections, local?.sections, seedSections)),
    workers: mergeMasterRows(p.workers, local?.workers, []),
    transports: mergeMasterRows(p.transports, local?.transports, []),
    companyProfile: p.companyProfile ?? local?.companyProfile ?? DEFAULT_COMPANY_PROFILE,
    preferences: p.preferences ?? local?.preferences ?? DEFAULT_ERP_PREFERENCES,
    cuttingAllocations: pickArray(p.cuttingAllocations, local?.cuttingAllocations),
    cncRateCalculations: pickArray(p.cncRateCalculations, local?.cncRateCalculations),
    jobWorkOutwards: pickArray(p.jobWorkOutwards, local?.jobWorkOutwards),
    jobWorkInwards: pickArray(p.jobWorkInwards, local?.jobWorkInwards),
    weighbridgeEntries: pickArray(p.weighbridgeEntries, local?.weighbridgeEntries),
    rejectMaterialReturns: pickArray(p.rejectMaterialReturns, local?.rejectMaterialReturns),
    anmsMtcRecords: pickArray(p.anmsMtcRecords, local?.anmsMtcRecords),
  };
}

function applyMergedData(merged: StoredData, setters: StoredDataSetters) {
  setters.setOrders(merged.orders);
  setters.setPlates(merged.plates);
  setters.setUsages(merged.usages);
  setters.setDispatches(merged.dispatches);
  setters.setChallans(merged.challans);
  setters.setPurchaseOrders(merged.purchaseOrders);
  setters.setPurchaseReceipts(merged.purchaseReceipts);
  setters.setTCRecords(merged.tcRecords);
  setters.setQuotations(merged.quotations);
  setters.setCNCQuotations(merged.cncQuotations);
  setters.setRingQuotations(merged.ringQuotations);
  setters.setTransportBills(merged.transportBills);
  setters.setLogs(merged.logs);
  setters.setParties(merged.parties);
  setters.setGrades(merged.grades);
  setters.setItems(merged.items);
  setters.setSections(merged.sections);
  setters.setWorkers(merged.workers);
  setters.setTransports(merged.transports);
  setters.setCompanyProfile(merged.companyProfile);
  setters.setPreferences(merged.preferences);
  setters.setCuttingAllocations(merged.cuttingAllocations);
  setters.setCNCRateCalculations(merged.cncRateCalculations);
  setters.setJobWorkOutwards(merged.jobWorkOutwards);
  setters.setJobWorkInwards(merged.jobWorkInwards);
  setters.setWeighbridgeEntries(merged.weighbridgeEntries);
  setters.setRejectMaterialReturns(merged.rejectMaterialReturns);
  setters.setAnmsMtcRecords(merged.anmsMtcRecords);
}

// ─── Context ──────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    return loadAuth();
  });
  const [role, setRole] = useState<Role>(() => {
    const storedAuth = loadAuth();
    return storedAuth ? storedAuth.role : 'Admin';
  });
  const [language, setLanguage] = useState<Language>('English');
  const [branch, setBranch] = useState<string>('All');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jagdamba_theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jagdamba_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [usages, setUsages] = useState<Usage[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [challans, setChallans] = useState<ChallanRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseReceipts, setPurchaseReceipts] = useState<PurchaseReceipt[]>([]);
  const [tcRecords, setTCRecords] = useState<TCRecord[]>([]);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [cncQuotations, setCNCQuotations] = useState<CNCQuotationRecord[]>([]);
  const [ringQuotations, setRingQuotations] = useState<RingQuotationRecord[]>([]);
  const [transportBills, setTransportBills] = useState<TransportBillRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [parties, setParties] = useState<PartyMaster[]>([]);
  const [grades, setGrades] = useState<GradeMasterRecord[]>([]);
  const [items, setItems] = useState<ItemMasterRecord[]>([]);
  const [sections, setSections] = useState<SectionMasterRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerMasterRecord[]>([]);
  const [transports, setTransports] = useState<TransportMasterRecord[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfileData>(DEFAULT_COMPANY_PROFILE);
  const [preferences, setPreferences] = useState<ErpPreferencesData>(DEFAULT_ERP_PREFERENCES);
  const [cuttingAllocations, setCuttingAllocations] = useState<CuttingAllocationRecord[]>([]);
  const [cncRateCalculations, setCNCRateCalculations] = useState<CNCRateCalculationRecord[]>([]);
  const [jobWorkOutwards, setJobWorkOutwards] = useState<JobWorkOutwardRecord[]>([]);
  const [jobWorkInwards, setJobWorkInwards] = useState<JobWorkInwardRecord[]>([]);
  const [weighbridgeEntries, setWeighbridgeEntries] = useState<WeighbridgeRecord[]>([]);
  const [rejectMaterialReturns, setRejectMaterialReturns] = useState<RejectMaterialReturnRecord[]>([]);
  const [anmsMtcRecords, setAnmsMtcRecords] = useState<AnmsMtcRecord[]>([]);
  const dataReadyRef = useRef(false);
  /** Only true after a successful server load or intentional restore — blocks seed/empty PUTs. */
  const allowServerPersistRef = useRef(false);
  const lastGoodWeightRef = useRef(0);
  /** Last known-good full payload — empty arrays cannot erase these collections. */
  const lastGoodPayloadRef = useRef<StoredData | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rememberGoodPayload = (merged: StoredData) => {
    lastGoodPayloadRef.current = merged;
    lastGoodWeightRef.current = erpCriticalWeight(merged);
  };

  const safePersistPayload = (payload: StoredData): StoredData => {
    const protectedPayload = protectErpArrays(lastGoodPayloadRef.current, payload) as StoredData;
    const weight = erpCriticalWeight(protectedPayload);
    if (lastGoodWeightRef.current >= 10 && weight < Math.ceil(lastGoodWeightRef.current * 0.35)) {
      console.warn(
        `Blocked client ERP wipe persist: lastGood=${lastGoodWeightRef.current}, next=${weight}`,
      );
      return lastGoodPayloadRef.current || protectedPayload;
    }
    if (weight > 0) {
      rememberGoodPayload(protectedPayload);
    }
    return protectedPayload;
  };

  const fetchData = useCallback(async () => {
    const setters: StoredDataSetters = {
      setOrders, setPlates, setUsages, setDispatches, setChallans,
      setPurchaseOrders, setPurchaseReceipts, setTCRecords,
      setQuotations, setCNCQuotations, setRingQuotations, setTransportBills, setLogs, setParties,
      setGrades, setItems, setSections, setWorkers, setTransports,
      setCompanyProfile, setPreferences, setCuttingAllocations, setCNCRateCalculations,
      setJobWorkOutwards, setJobWorkInwards, setWeighbridgeEntries, setRejectMaterialReturns, setAnmsMtcRecords,
    };

    const commitLocalOnly = (merged: StoredData, toastMsg?: string) => {
      applyMergedData(merged, setters);
      saveToStorage(merged);
      rememberGoodPayload(merged);
      allowServerPersistRef.current = false;
      dataReadyRef.current = true;
      if (toastMsg) toast.error(toastMsg);
    };

    const commitWithServerWrite = (merged: StoredData, opts?: { toastLive?: boolean }) => {
      applyMergedData(merged, setters);
      saveToStorage(merged);
      rememberGoodPayload(merged);
      allowServerPersistRef.current = true;
      dataReadyRef.current = true;
      if (opts?.toastLive) {
        toast('Loaded data from live server (local API empty or offline).', { icon: '☁️' });
      }
    };

    try {
      const local = loadFromStorage();
      const server = await fetchErpData();
      const serverSparse = isSparseErpData(server.data);
      const localSparse = isSparseErpData(local);

      if (server.data && !serverSparse) {
        const merged = mergeStoredData(server.data as StoredData, local);
        commitWithServerWrite(merged, { toastLive: server.source === 'live' });
        return;
      }

      // Server empty/missing — restore from browser cache if it has real data
      if (local && !localSparse) {
        const merged = mergeStoredData(local, null);
        commitWithServerWrite(merged);
        try {
          await saveErpData(merged as ErpStoredData, CURRENT_VERSION);
        } catch (err) {
          console.error('Failed to restore local ERP cache to server:', err);
        }
        return;
      }

      // Both empty: show seed UI only — NEVER push seed to the server
      const seed = getSeedData();
      commitLocalOnly(
        seed,
        server.data
          ? 'Server returned empty ERP data — using defaults locally (server not overwritten).'
          : undefined,
      );
    } catch (error) {
      console.error('Error loading data:', error);
      const local = loadFromStorage();
      if (local && !isSparseErpData(local)) {
        commitLocalOnly(
          mergeStoredData(local, null),
          `Server unavailable — loaded ${local.parties?.length ?? 0} parties from browser cache (not writing to server).`,
        );
      } else {
        commitLocalOnly(
          getSeedData(),
          'Failed to load from server. Using default data locally (server not overwritten).',
        );
      }
    }
  }, []);

  useEffect(() => {
    const storedAuth = loadAuth();
    if (storedAuth) {
      setUserState(storedAuth);
      setRole(storedAuth.role);
    }
    fetchData();

    // Polling added for multitasking/syncing data automatically across clients
    const syncInterval = setInterval(() => {
      fetchData();
    }, 15000); // 15 seconds

    return () => {
      clearInterval(syncInterval);
    };
  }, [fetchData]);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) {
      setRole(u.role);
    }
    saveAuth(u);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    saveAuth(null);
    localStorage.removeItem('jagdamba_erp_token');
  }, []);

  // Sync to server + local cache on every state change
  useEffect(() => {
    const payload: StoredData = {
      orders, plates, usages, dispatches, challans,
      purchaseOrders, purchaseReceipts, tcRecords,
      quotations, cncQuotations, ringQuotations, transportBills, logs, parties,
      grades, items, sections, workers, transports,
      companyProfile, preferences, cuttingAllocations, cncRateCalculations,
      jobWorkOutwards, jobWorkInwards, weighbridgeEntries, rejectMaterialReturns, anmsMtcRecords,
    };

    if (!dataReadyRef.current) return;

    const rawWeight = erpCriticalWeight(payload);
    const safePayload = safePersistPayload(payload);
    const safeWeight = erpCriticalWeight(safePayload);

    // Incoming payload tried to wipe collections — do not persist the wipe
    if (rawWeight < safeWeight) {
      console.warn(`Blocked client ERP collection wipe: raw=${rawWeight}, safe=${safeWeight}`);
      return;
    }

    saveToStorage(safePayload);

    if (!allowServerPersistRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveErpData(safePayload as ErpStoredData, CURRENT_VERSION);
      } catch (error) {
        console.error('Error saving to server:', error);
        toast.error('Failed to save to server. Data kept in browser cache.');
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [orders, plates, usages, dispatches, challans, purchaseOrders, purchaseReceipts, tcRecords, quotations, cncQuotations, ringQuotations, transportBills, logs, parties, grades, items, sections, workers, transports, companyProfile, preferences, cuttingAllocations, cncRateCalculations, jobWorkOutwards, jobWorkInwards, weighbridgeEntries, rejectMaterialReturns, anmsMtcRecords]);

  const buildStoredPayload = useCallback((override?: Partial<StoredData>): StoredData => ({
    orders, plates, usages, dispatches, challans,
    purchaseOrders, purchaseReceipts, tcRecords,
    quotations, cncQuotations, ringQuotations, transportBills, logs, parties,
    grades, items, sections, workers, transports,
    companyProfile, preferences, cuttingAllocations, cncRateCalculations,
    jobWorkOutwards, jobWorkInwards, weighbridgeEntries, rejectMaterialReturns, anmsMtcRecords,
    ...override,
  }), [orders, plates, usages, dispatches, challans, purchaseOrders, purchaseReceipts, tcRecords, quotations, cncQuotations, ringQuotations, transportBills, logs, parties, grades, items, sections, workers, transports, companyProfile, preferences, cuttingAllocations, cncRateCalculations, jobWorkOutwards, jobWorkInwards, weighbridgeEntries, rejectMaterialReturns, anmsMtcRecords]);

  const persistErpNow = useCallback(async (override?: Partial<StoredData>) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const payload = safePersistPayload(buildStoredPayload(override));
    if (lastGoodWeightRef.current >= 10 && erpCriticalWeight(payload) < Math.ceil(lastGoodWeightRef.current * 0.35)) {
      toast.error('Save blocked — payload looks empty compared to loaded data. Refresh and retry.');
      throw new Error('Refusing to persist sparse ERP payload');
    }
    saveToStorage(payload);
    allowServerPersistRef.current = true;
    try {
      await saveErpData(payload as ErpStoredData, CURRENT_VERSION);
    } catch (error) {
      console.error('Immediate ERP save failed:', error);
      toast.error('Failed to save to server. Data kept in browser cache.');
      throw error;
    }
  }, [buildStoredPayload]);

  const persistMastersNow = useCallback(async (override: Partial<Pick<StoredData, 'parties' | 'grades' | 'items' | 'sections' | 'workers' | 'transports' | 'logs'>>) => {
    await persistErpNow(override);
  }, [persistErpNow]);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const nextOrderNo = useCallback(() => {
    const maxNum = orders.reduce((max, o) => {
      const num = parseInt(o.orderNo.replace('JP-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `JP-${String(maxNum + 1).padStart(4, '0')}`;
  }, [orders]);

  const nextChallanNo = useCallback(() => {
    const year = new Date().getFullYear();
    const maxNum = challans.reduce((max, c) => {
      const parts = c.challanNo.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `CH-${year}-${String(maxNum + 1).padStart(3, '0')}`;
  }, [challans]);

  const nextPONo = useCallback(() => {
    return nextPONumberFromExisting(purchaseOrders);
  }, [purchaseOrders]);
  
  const addLog = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp' | 'user' | 'role'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user?.displayName || 'System',
      role: role
    };
    setLogs(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500 logs
  }, [user, role]);

  const addOrder = useCallback(async (order: Order) => {
    setOrders(prev => [order, ...prev]);
    addLog({
      action: 'Order Created',
      details: `New order ${order.orderNo} created for ${order.partyName}`,
      type: 'info',
      orderNo: order.orderNo
    });
  }, [addLog]);

  const deleteOrder = useCallback(async (id: string) => {
    const order = orders.find(o => o.id === id);
    const next = orders.filter(o => o.id !== id);
    setOrders(next);
    addLog({
      action: 'Order Deleted',
      details: `Order '${order?.orderNo ?? id}' removed.`,
      type: 'warning',
      orderNo: order?.orderNo,
    });
    try {
      await persistErpNow({ orders: next });
      toast.success('Order deleted');
    } catch {
      toast.error('Deleted locally but server sync failed');
    }
  }, [orders, addLog, persistErpNow]);

  const updateOrderStage = useCallback(async (id: string, stage: Stage) => {
    const order = orders.find(o => o.id === id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, stage } : o));
    addLog({
      action: 'Stage Updated',
      details: `Order ${order?.orderNo}: Stage changed to ${stage}`,
      type: stage === 'Ready' || stage === 'Dispatch Done' ? 'info' : 'warning',
      orderNo: order?.orderNo
    });
    toast.success(`Stage updated to ${stage}`);
  }, [orders, addLog]);

  const updateItemStatus = useCallback(async (orderId: string, itemId: string, status: 'Pending' | 'In Progress' | 'Completed') => {
    const order = orders.find(o => o.id === orderId);
    const item = order?.items.find(i => i.id === itemId);
    
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(item => item.id === itemId ? { ...item, itemStatus: status, completedAt: status === 'Completed' ? new Date().toISOString() : item.completedAt } : item)
        };
      }
      return o;
    }));

    addLog({
      action: 'Item Status Update',
      details: `Order ${order?.orderNo}: Item '${item?.partName || item?.drawingNumber}' marked as ${status}`,
      type: status === 'Completed' ? 'info' : 'warning',
      orderNo: order?.orderNo
    });

    toast.success(`Item status updated to ${status}`);
  }, [orders, addLog]);

  const updateItemCompletedQty = useCallback(async (orderId: string, itemId: string, qty: number) => {
    const order = orders.find(o => o.id === orderId);
    const item = order?.items.find(i => i.id === itemId);
    const oldQty = item?.completedQty || 0;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(item => {
            if (item.id === itemId) {
              const completedQty = Math.min(qty, item.quantity);
              const status = completedQty >= item.quantity ? 'Completed' : completedQty > 0 ? 'In Progress' : 'Pending';
              return { 
                ...item, 
                completedQty, 
                itemStatus: status,
                completedAt: status === 'Completed' ? new Date().toISOString() : item.completedAt 
              };
            }
            return item;
          })
        };
      }
      return o;
    }));

    // Record Security Alert if quantity is reduced
    if (qty < oldQty) {
      addLog({
        action: 'Security Alert: Qty Reduced',
        details: `Order ${order?.orderNo}: Item '${item?.partName}' completed quantity REDUCED from ${oldQty} to ${qty}`,
        type: 'alert',
        orderNo: order?.orderNo
      });
    } else {
      addLog({
        action: 'Qty Updated',
        details: `Order ${order?.orderNo}: Item '${item?.partName}' completed quantity updated to ${qty}`,
        type: 'info',
        orderNo: order?.orderNo
      });
    }

    toast.success(`Completed quantity updated`);
  }, [orders, addLog]);

  const updateItemWorker = useCallback(async (orderId: string, itemId: string, workerName: string) => {
    const order = orders.find(o => o.id === orderId);
    const item = order?.items.find(i => i.id === itemId);

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(item => item.id === itemId ? { ...item, assignedWorker: workerName } : item)
        };
      }
      return o;
    }));

    addLog({
      action: 'Worker Assigned',
      details: `Order ${order?.orderNo}: Assigned '${workerName}' to Item '${item?.partName || item?.drawingNumber}'`,
      type: 'info',
      orderNo: order?.orderNo
    });

    toast.success(`Worker assigned successfully`);
  }, [orders, addLog]);

  const dispatchItems = useCallback(async (orderId: string, itemDispatches: { itemId: string; qty: number }[], vehicleNo: string, remark: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map(item => {
            const dispatch = itemDispatches.find(d => d.itemId === item.id);
            if (dispatch) {
              return { ...item, dispatchedQty: (item.dispatchedQty || 0) + dispatch.qty };
            }
            return item;
          })
        };
      }
      return o;
    }));

    // Create Dispatch Record
    const totalDispatchQty = itemDispatches.reduce((sum, d) => sum + d.qty, 0);
    const newDispatch: DispatchRecord = {
      id: Date.now().toString(),
      orderId: order.id,
      orderNo: order.orderNo,
      partyName: order.partyName,
      readyQty: totalDispatchQty, // Quantities in this specific dispatch
      dispatchQty: totalDispatchQty,
      dispatchDate: new Date().toISOString().split('T')[0],
      vehicleNo,
      deliveryNote: `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      pendingQty: 0,
      remark,
    };

    setDispatches(prev => [newDispatch, ...prev]);

    // Create Challan automatically
    let taxableAmount = 0;
    itemDispatches.forEach(d => {
      const item = order.items.find(i => i.id === d.itemId);
      if (item) {
        taxableAmount += d.qty * item.rate;
      }
    });

    const gstRate = 18; // Default
    const gstAmount = taxableAmount * (gstRate / 100);
    const totalAmount = taxableAmount + gstAmount;

    const newChallan: ChallanRecord = {
      id: (Date.now() + 1).toString(),
      challanNo: nextChallanNo(),
      challanDate: new Date().toISOString().split('T')[0],
      orderNo: order.orderNo,
      partyName: order.partyName,
      taxableAmount: Math.round(taxableAmount),
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(totalAmount),
      amountPaid: 0,
      balanceAmount: Math.round(totalAmount),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
    };

    setChallans(prev => [newChallan, ...prev]);

    addLog({
      action: 'Dispatch & Challan',
      details: `Dispatched ${totalDispatchQty} items for ${order.orderNo}. Challan ${newChallan.challanNo} generated.`,
      type: 'info',
      orderNo: order.orderNo
    });

    toast.success(`Dispatched ${totalDispatchQty} items & Created Challan ${newChallan.challanNo}`);
  }, [orders, nextChallanNo, addLog]);

  const normalizeParty = (party: Omit<PartyMaster, 'id'>): Omit<PartyMaster, 'id'> => ({
    ...party,
    partyName: party.partyName.trim().toUpperCase(),
    contactPerson: party.contactPerson.trim().toUpperCase(),
    mobileNumber: party.mobileNumber.trim(),
    location: party.location.trim(),
    deliveryAddress: party.deliveryAddress.trim().toUpperCase(),
    paymentTerms: party.paymentTerms?.trim().toUpperCase(),
    gstNumber: party.gstNumber?.trim().toUpperCase(),
    email: party.email?.trim(),
    address: party.address?.trim().toUpperCase(),
    supplierAddress: party.supplierAddress?.trim().toUpperCase(),
    reference: party.reference?.trim().toUpperCase(),
    grades: (party.grades ?? []).map(g => g.trim()).filter(Boolean),
  });

  const addParty = useCallback(async (party: Omit<PartyMaster, 'id'>) => {
    const newParty: PartyMaster = {
      ...normalizeParty(party),
      id: Date.now().toString(),
    };

    const existing = parties.find(p => p.partyName === newParty.partyName);
    if (existing) return existing;

    const nextParties = [...parties, newParty];
    setParties(nextParties);
    addLog({
      action: 'Party Created',
      details: `New party '${newParty.partyName}' registered in Master.`,
      type: 'info',
    });
    await persistMastersNow({ parties: nextParties });
    return newParty;
  }, [parties, addLog, persistMastersNow]);

  const deletePurchaseOrder = useCallback(async (id: string) => {
    const po = purchaseOrders.find(p => p.id === id);
    const next = purchaseOrders.filter(p => p.id !== id);
    setPurchaseOrders(next);
    addLog({
      action: 'PO Deleted',
      details: `Purchase order '${po?.poNumber ?? id}' removed.`,
      type: 'warning',
    });
    try {
      await persistErpNow({ purchaseOrders: next });
      toast.success('Purchase Order deleted');
    } catch {
      toast.error('Deleted locally but server sync failed — refresh and retry if needed');
    }
  }, [purchaseOrders, addLog, persistErpNow]);

  const updateParty = useCallback(async (party: PartyMaster) => {
    const updated: PartyMaster = {
      ...normalizeParty(party),
      id: party.id,
    };
    const nextParties = parties.map(p => p.id === updated.id ? updated : p);
    setParties(nextParties);
    addLog({
      action: 'Party Updated',
      details: `Party '${updated.partyName}' details updated.`,
      type: 'info',
    });
    await persistMastersNow({ parties: nextParties });
  }, [parties, addLog, persistMastersNow]);

  const deleteParty = useCallback(async (id: string) => {
    const party = parties.find(p => p.id === id);
    const nextParties = parties.filter(p => p.id !== id);
    setParties(nextParties);
    addLog({
      action: 'Party Deleted',
      details: `Party '${party?.partyName}' removed from Master.`,
      type: 'warning',
    });
    await persistMastersNow({ parties: nextParties });
  }, [parties, addLog, persistMastersNow]);

  const importParties = useCallback(async (rows: Omit<PartyMaster, 'id'>[]) => {
    let saved = 0;
    let skipped = 0;

    const idByName = new Map(parties.map(p => [p.partyName.trim().toUpperCase(), p.id]));
    const merged = new Map(parties.map(p => [p.partyName.trim().toUpperCase(), p]));
    let idx = 0;

    for (const row of rows) {
      const normalized = normalizeParty(row);
      if (!normalized.partyName) {
        skipped += 1;
        continue;
      }

      const name = normalized.partyName;
      const id = idByName.get(name) ?? `party_${Date.now()}_${idx++}`;
      merged.set(name, { ...normalized, id });
      saved += 1;
    }

    const nextParties = Array.from(merged.values());
    setParties(nextParties);

    if (saved > 0) {
      addLog({
        action: 'Parties Imported',
        details: `${saved} party ledger(s) loaded from Excel.${skipped > 0 ? ` ${skipped} empty row(s) skipped.` : ''}`,
        type: 'info',
      });
      await persistMastersNow({ parties: nextParties });
    }

    return { saved, skipped };
  }, [parties, addLog, persistMastersNow]);

  const addGrade = useCallback(async (grade: Omit<GradeMasterRecord, 'id'>) => {
    const record: GradeMasterRecord = { ...grade, id: Date.now().toString() };
    const next = [...grades, record];
    setGrades(next);
    addLog({ action: 'Grade Saved', details: `Grade '${record.name}' saved in Master.`, type: 'info' });
    await persistMastersNow({ grades: next });
    return record;
  }, [grades, addLog, persistMastersNow]);

  const updateGrade = useCallback(async (grade: GradeMasterRecord) => {
    const next = grades.map(g => g.id === grade.id ? grade : g);
    setGrades(next);
    addLog({ action: 'Grade Updated', details: `Grade '${grade.name}' updated.`, type: 'info' });
    await persistMastersNow({ grades: next });
  }, [grades, addLog, persistMastersNow]);

  const deleteGrade = useCallback(async (id: string) => {
    const grade = grades.find(g => g.id === id);
    const next = grades.filter(g => g.id !== id);
    setGrades(next);
    addLog({ action: 'Grade Deleted', details: `Grade '${grade?.name}' removed.`, type: 'warning' });
    await persistMastersNow({ grades: next });
  }, [grades, addLog, persistMastersNow]);

  const addItem = useCallback(async (item: Omit<ItemMasterRecord, 'id'>) => {
    const record: ItemMasterRecord = { ...item, id: Date.now().toString() };
    const next = [...items, record];
    setItems(next);
    addLog({ action: 'Item Saved', details: `Item '${record.name}' saved in Master.`, type: 'info' });
    await persistMastersNow({ items: next });
    return record;
  }, [items, addLog, persistMastersNow]);

  const updateItem = useCallback(async (item: ItemMasterRecord) => {
    const next = items.map(i => i.id === item.id ? item : i);
    setItems(next);
    addLog({ action: 'Item Updated', details: `Item '${item.name}' updated.`, type: 'info' });
    await persistMastersNow({ items: next });
  }, [items, addLog, persistMastersNow]);

  const deleteItem = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id);
    const next = items.filter(i => i.id !== id);
    setItems(next);
    addLog({ action: 'Item Deleted', details: `Item '${item?.name}' removed.`, type: 'warning' });
    await persistMastersNow({ items: next });
  }, [items, addLog, persistMastersNow]);

  const addSection = useCallback(async (section: Omit<SectionMasterRecord, 'id'>) => {
    const record: SectionMasterRecord = { ...section, id: Date.now().toString() };
    const next = [...sections, record];
    setSections(next);
    addLog({ action: 'Section Saved', details: `Section '${record.category} ${record.size}' saved in Master.`, type: 'info' });
    await persistMastersNow({ sections: next });
    return record;
  }, [sections, addLog, persistMastersNow]);

  const updateSection = useCallback(async (section: SectionMasterRecord) => {
    const next = sections.map(s => s.id === section.id ? section : s);
    setSections(next);
    addLog({ action: 'Section Updated', details: `Section '${section.category} ${section.size}' updated.`, type: 'info' });
    await persistMastersNow({ sections: next });
  }, [sections, addLog, persistMastersNow]);

  const deleteSection = useCallback(async (id: string) => {
    const section = sections.find(s => s.id === id);
    const next = sections.filter(s => s.id !== id);
    setSections(next);
    addLog({ action: 'Section Deleted', details: `Section '${section?.category} ${section?.size}' removed.`, type: 'warning' });
    await persistMastersNow({ sections: next });
  }, [sections, addLog, persistMastersNow]);

  const addWorker = useCallback(async (worker: Omit<WorkerMasterRecord, 'id'>) => {
    const record: WorkerMasterRecord = { ...worker, id: Date.now().toString() };
    const next = [...workers, record];
    setWorkers(next);
    addLog({ action: 'Worker Saved', details: `Worker '${record.name}' saved in Master.`, type: 'info' });
    await persistMastersNow({ workers: next });
    return record;
  }, [workers, addLog, persistMastersNow]);

  const updateWorker = useCallback(async (worker: WorkerMasterRecord) => {
    const next = workers.map(w => w.id === worker.id ? worker : w);
    setWorkers(next);
    addLog({ action: 'Worker Updated', details: `Worker '${worker.name}' updated.`, type: 'info' });
    await persistMastersNow({ workers: next });
  }, [workers, addLog, persistMastersNow]);

  const deleteWorker = useCallback(async (id: string) => {
    const worker = workers.find(w => w.id === id);
    const next = workers.filter(w => w.id !== id);
    setWorkers(next);
    addLog({ action: 'Worker Deleted', details: `Worker '${worker?.name}' removed.`, type: 'warning' });
    await persistMastersNow({ workers: next });
  }, [workers, addLog, persistMastersNow]);

  const addTransport = useCallback(async (transport: Omit<TransportMasterRecord, 'id'>) => {
    const record: TransportMasterRecord = { ...transport, id: Date.now().toString() };
    const next = [...transports, record];
    setTransports(next);
    addLog({ action: 'Transport Saved', details: `Transport '${record.name}' saved in Master.`, type: 'info' });
    await persistMastersNow({ transports: next });
    return record;
  }, [transports, addLog, persistMastersNow]);

  const updateTransport = useCallback(async (transport: TransportMasterRecord) => {
    const next = transports.map(t => t.id === transport.id ? transport : t);
    setTransports(next);
    addLog({ action: 'Transport Updated', details: `Transport '${transport.name}' updated.`, type: 'info' });
    await persistMastersNow({ transports: next });
  }, [transports, addLog, persistMastersNow]);

  const deleteTransport = useCallback(async (id: string) => {
    const transport = transports.find(t => t.id === id);
    const next = transports.filter(t => t.id !== id);
    setTransports(next);
    addLog({ action: 'Transport Deleted', details: `Transport '${transport?.name}' removed.`, type: 'warning' });
    await persistMastersNow({ transports: next });
  }, [transports, addLog, persistMastersNow]);

  return (
    <AppContext.Provider value={{
      user, setUser, logout,
      role, language, setLanguage, branch, setBranch, t,
      theme, setTheme,
      orders, setOrders, addOrder, deleteOrder, updateOrderStage, updateItemStatus, updateItemCompletedQty, updateItemWorker, dispatchItems,
      plates, setPlates,
      usages, setUsages,
      dispatches, setDispatches,
      challans, setChallans,
      logs, addLog,
      purchaseOrders,
      setPurchaseOrders,
      deletePurchaseOrder,
      purchaseReceipts, setPurchaseReceipts,
      tcRecords, setTCRecords,
      addTCRecord: (tc: TCRecord) => setTCRecords(prev => [tc, ...prev]),
      updateTCRecord: (tc: TCRecord) => setTCRecords(prev => prev.map(r => r.id === tc.id ? tc : r)),
      deleteTCRecord: (id: string) => setTCRecords(prev => prev.filter(r => r.id !== id)),
      quotations,
      setQuotations,
      addQuotation: (q: QuotationRecord) => setQuotations(prev => [q, ...prev]),
      updateQuotation: (q: QuotationRecord) => setQuotations(prev => prev.map(r => r.id === q.id ? q : r)),
      deleteQuotation: (id: string) => setQuotations(prev => prev.filter(q => q.id !== id)),

      cncQuotations,
      setCNCQuotations,
      addCNCQuotation: (q: CNCQuotationRecord) => setCNCQuotations(prev => [q, ...prev]),
      updateCNCQuotation: (q: CNCQuotationRecord) => setCNCQuotations(prev => prev.map(r => r.id === q.id ? q : r)),
      deleteCNCQuotation: (id: string) => setCNCQuotations(prev => prev.filter(q => q.id !== id)),

      ringQuotations,
      setRingQuotations,
      addRingQuotation: (q: RingQuotationRecord) => setRingQuotations(prev => [q, ...prev]),
      updateRingQuotation: (q: RingQuotationRecord) => setRingQuotations(prev => prev.map(r => r.id === q.id ? q : r)),
      deleteRingQuotation: (id: string) => setRingQuotations(prev => prev.filter(q => q.id !== id)),

      transportBills,
      addTransportBill: (bill: TransportBillRecord) => setTransportBills(prev => [bill, ...prev]),

      companyProfile, setCompanyProfile,
      preferences, setPreferences,
      cuttingAllocations, setCuttingAllocations,
      cncRateCalculations, setCNCRateCalculations,
      jobWorkOutwards, setJobWorkOutwards,
      jobWorkInwards, setJobWorkInwards,
      weighbridgeEntries, setWeighbridgeEntries,
      rejectMaterialReturns, setRejectMaterialReturns,
      anmsMtcRecords, setAnmsMtcRecords,

      persistErpNow,

      nextOrderNo, nextChallanNo, nextPONo,
      parties, setParties, addParty, updateParty, deleteParty, importParties,
      grades, addGrade, updateGrade, deleteGrade,
      items, addItem, updateItem, deleteItem,
      sections, addSection, updateSection, deleteSection,
      workers, addWorker, updateWorker, deleteWorker,
      transports, addTransport, updateTransport, deleteTransport,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
