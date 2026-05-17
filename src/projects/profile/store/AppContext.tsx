"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
// import api from '../services/api'; // Removed for local-only version
import toast from 'react-hot-toast';
// import { socket, connectSocket, disconnectSocket } from '../services/socket'; // Removed for local-only version

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

export type CuttingType = 'CNC Profile' | 'Circle' | 'Square' | 'Ring' | 'Plate' | 'Scrap';
export const CUTTING_TYPES: CuttingType[] = ['CNC Profile', 'Circle', 'Square', 'Ring', 'Plate', 'Scrap'];

export type MaterialType = 'MS' | 'SS' | 'Alloy' | 'Other';
export const MATERIAL_TYPES: MaterialType[] = ['MS', 'SS', 'Alloy', 'Other'];

export type UnitType = 'Kg' | 'Nos' | 'Set' | 'Plate' | 'Piece' | 'Job' | 'Other';
export const UNIT_TYPES: UnitType[] = ['Kg', 'Nos', 'Set', 'Plate', 'Piece', 'Job', 'Other'];

export type ScrapOwner = 'Customer' | 'Our Company';
export type PlateSource = 'Customer' | 'Stock';

export const BRANCHES = ['Makarpura Unit', 'Por Unit', 'Other'];

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
  transportName?: string;
  transportNumber?: string;
  paymentTerms?: string;
  make?: string;
  utLevel?: string;
  invoiceNo?: string;
  customer?: string;
  location?: string;
  items: POItem[];
  totalKg: number;
  totalAmount: number;
  status: 'Pending' | 'Partial' | 'Complete';
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
}

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
  dispatchHistory: DispatchHistoryItem[];
}

export interface QuotationItem {
  id: string;
  shape: 'Square' | 'Ring' | 'CNC Profile';
  grade: string;
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

export interface QuotationRecord {
  id: string;
  quoteNo: string;
  date: string;
  validUntil: string;
  partyName: string;
  contactPerson: string;
  mobileNo: string;
  address: string;
  items: QuotationItem[];
  loadingCharges: number;
  transportCharges: number;
  gstRate: number;
  totalAmount: number;
  grandTotal: number;
}

export interface CNCQuotationRecord {
  id: string;
  quoteNo: string;
  date: string;
  partyName: string;
  mobileNo: string;
  items: CNCItem[];
  loadingCharges: number;
  transportCharges: number;
  gstRate: number;
  totalAmount: number;
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
  deleteQuotation: (id: string) => void;

  cncQuotations: CNCQuotationRecord[];
  setCNCQuotations: React.Dispatch<React.SetStateAction<CNCQuotationRecord[]>>;
  addCNCQuotation: (q: CNCQuotationRecord) => void;
  deleteCNCQuotation: (id: string) => void;

  nextOrderNo: () => string;
  nextChallanNo: () => string;
  nextPONo: () => string;

  parties: PartyMaster[];
  setParties: React.Dispatch<React.SetStateAction<PartyMaster[]>>;
  addParty: (party: Omit<PartyMaster, 'id'>) => Promise<PartyMaster>;
  updateParty: (party: PartyMaster) => Promise<void>;
  deleteParty: (id: string) => Promise<void>;
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
    cncQuotation: 'CNC Quotation',
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
    cncQuotation: 'CNC ક્વોટેશન',
    partyMaster: 'પાર્ટી માસ્ટર',
  },
};

// ─── Seed Data ────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const seedOrders: Order[] = [
  {
    id: '1', orderNo: 'JP-0001', orderDate: '2026-04-18', deliveryDate: '2026-04-25',
    partyName: 'Larsen & Toubro', contactPerson: 'Rahul Mehta', mobileNumber: '9876543210',
    location: 'Makarpura Unit', deliveryAddress: 'L&T Gate 4, Vadodara', handledBy: 'System', remark: 'Urgent order',
    stage: 'Cutting In Process', urgent: true, createdAt: '2026-04-18T09:00:00',
    items: [
      { id: '1a', cuttingType: 'CNC Profile', materialType: 'MS', materialGrade: 'IS 2062 E250', thickness: '10mm', plateSize: '1250 x 2500', drawingNumber: 'DRW-1001', partName: 'Base Plate', quantity: 15, completedQty: 5, dispatchedQty: 0, unitType: 'Nos', rate: 350, amount: 5250, scrapBelongsTo: 'Our Company', specialInstructions: 'Finish edges', fileName: null },
      { id: '1b', cuttingType: 'Circle', materialType: 'MS', materialGrade: 'IS 2062 E250', thickness: '10mm', plateSize: '1250 x 2500', drawingNumber: 'DRW-1002', partName: 'Flange Ring', quantity: 30, completedQty: 10, dispatchedQty: 0, unitType: 'Nos', rate: 120, amount: 3600, scrapBelongsTo: 'Our Company', specialInstructions: '', fileName: null },
    ],
  },
  {
    id: '2', orderNo: 'JP-0002', orderDate: '2026-04-19', deliveryDate: '2026-04-28',
    partyName: 'Reliance Industries', contactPerson: 'Amit Patel', mobileNumber: '9876541111',
    location: 'Por Unit', deliveryAddress: 'Reliance Jamnagar', handledBy: 'System', remark: '',
    stage: 'Nesting Done', urgent: false, createdAt: '2026-04-19T10:30:00',
    items: [
      { id: '2a', cuttingType: 'Square', materialType: 'SS', materialGrade: 'SS 304', thickness: '5mm', plateSize: '1500 x 3000', drawingNumber: 'DRW-2001', partName: 'Cover Plate', quantity: 50, completedQty: 0, dispatchedQty: 0, unitType: 'Kg', rate: 45, amount: 2250, scrapBelongsTo: 'Customer', specialInstructions: '', fileName: null },
    ],
  },
  {
    id: '3', orderNo: 'JP-0003', orderDate: '2026-04-20', deliveryDate: '2026-04-23',
    partyName: 'Adani Power', contactPerson: 'Vijay Shah', mobileNumber: '9876542222',
    location: 'Makarpura Unit', deliveryAddress: 'Adani Mundra', handledBy: 'System', remark: 'Very urgent',
    stage: 'Order Received', urgent: true, createdAt: '2026-04-20T08:00:00',
    items: [
      { id: '3a', cuttingType: 'Ring', materialType: 'MS', materialGrade: 'SA 516 Gr 70', thickness: '20mm', plateSize: '2000 x 6000', drawingNumber: 'DRW-3001', partName: 'Ring Flange', quantity: 120, completedQty: 0, dispatchedQty: 0, unitType: 'Nos', rate: 250, amount: 30000, scrapBelongsTo: 'Our Company', specialInstructions: 'Heat number required on each piece', fileName: null },
    ],
  },
  {
    id: '4', orderNo: 'JP-0004', orderDate: '2026-04-20', deliveryDate: '2026-04-30',
    partyName: 'Tata Steel', contactPerson: 'Deepak Joshi', mobileNumber: '9876543333',
    location: 'Por Unit', deliveryAddress: 'Tata Haldia', handledBy: 'System', remark: '',
    stage: 'Ready', urgent: false, createdAt: '2026-04-20T11:00:00',
    items: [
      { id: '4a', cuttingType: 'Scrap', materialType: 'SS', materialGrade: 'SS 316', thickness: '12mm', plateSize: '1500 x 6000', drawingNumber: 'DRW-4001', partName: 'Stiffener', quantity: 8, completedQty: 8, dispatchedQty: 0, unitType: 'Set', rate: 1500, amount: 12000, scrapBelongsTo: 'Customer', specialInstructions: '', fileName: null },
    ],
  },
  {
    id: '5', orderNo: 'JP-0005', orderDate: today, deliveryDate: '2026-04-26',
    partyName: 'BHEL', contactPerson: 'Suresh Kumar', mobileNumber: '9876544444',
    location: 'Makarpura Unit', deliveryAddress: 'BHEL Haridwar', handledBy: 'System', remark: 'TC copy needed',
    stage: 'Order Received', urgent: false, createdAt: new Date().toISOString(),
    items: [
      { id: '5a', cuttingType: 'CNC Profile', materialType: 'Alloy', materialGrade: 'SA 387 Gr 11', thickness: '25mm', plateSize: '2500 x 6000', drawingNumber: 'DRW-5001', partName: 'Saddle Plate', quantity: 4, completedQty: 0, dispatchedQty: 0, unitType: 'Job', rate: 8500, amount: 34000, scrapBelongsTo: 'Our Company', specialInstructions: 'Mill finish required', fileName: null },
      { id: '5b', cuttingType: 'Circle', materialType: 'Alloy', materialGrade: 'SA 387 Gr 11', thickness: '25mm', plateSize: '2500 x 6000', drawingNumber: 'DRW-5002', partName: 'End Cap', quantity: 2, completedQty: 0, dispatchedQty: 0, unitType: 'Nos', rate: 4200, amount: 8400, scrapBelongsTo: 'Our Company', specialInstructions: '', fileName: null },
    ],
  },
  {
    id: '6', orderNo: 'JP-0006', orderDate: today, deliveryDate: '2026-04-24',
    partyName: 'Larsen & Toubro', contactPerson: 'Rahul Mehta', mobileNumber: '9876543210',
    location: 'Makarpura Unit', deliveryAddress: 'L&T Gate 4, Vadodara', handledBy: 'System', remark: '',
    stage: 'Dispatch Done', urgent: false, createdAt: new Date().toISOString(),
    items: [
      { id: '6a', cuttingType: 'Plate', materialType: 'MS', materialGrade: 'IS 2062 E250', thickness: '16mm', plateSize: '1500 x 3000', drawingNumber: 'DRW-6001', partName: 'Gusset Plate', quantity: 200, completedQty: 200, dispatchedQty: 200, unitType: 'Kg', rate: 38, amount: 7600, scrapBelongsTo: 'Our Company', specialInstructions: '', fileName: null },
    ],
  },
];

const seedPlates: Plate[] = [
  { id: 'PLT-1001', grade: 'IS 2062 E250', thickness: '10mm', size: '1250 x 2500', weight: 2500, heatNumber: 'TC-89234', source: 'Stock', initialWeight: 2500 },
  { id: 'PLT-1002', grade: 'SS 304', thickness: '5mm', size: '1500 x 3000', weight: 1200, heatNumber: 'TC-89235', source: 'Customer', initialWeight: 1200 },
  { id: 'PLT-1003', grade: 'SA 516 Gr 70', thickness: '20mm', size: '2000 x 6000', weight: 5600, heatNumber: 'TC-89236', source: 'Stock', initialWeight: 5600 },
  { id: 'PLT-1004', grade: 'SS 316', thickness: '12mm', size: '1500 x 6000', weight: 3400, heatNumber: 'TC-89237', source: 'Customer', initialWeight: 3400 },
];

const seedUsages: Usage[] = [
  { id: 'U1', plateId: 'PLT-1001', orderId: '1', orderNo: 'JP-0001', usedWeight: 1800, scrapQuantity: 150, scrapOwner: 'Our Company' },
  { id: 'U2', plateId: 'PLT-1002', orderId: '2', orderNo: 'JP-0002', usedWeight: 600, scrapQuantity: 80, scrapOwner: 'Customer' },
];

const seedDispatches: DispatchRecord[] = [
  { id: 'D1', orderId: '4', orderNo: 'JP-0004', partyName: 'Tata Steel', readyQty: 8, dispatchQty: 0, dispatchDate: '', vehicleNo: '', deliveryNote: '', pendingQty: 8, remark: '' },
  { id: 'D2', orderId: '6', orderNo: 'JP-0006', partyName: 'Larsen & Toubro', readyQty: 200, dispatchQty: 200, dispatchDate: today, vehicleNo: 'GJ-06-AB-7890', deliveryNote: 'DN-5001', pendingQty: 0, remark: 'Full dispatch' },
];

const seedChallans: ChallanRecord[] = [
  { id: 'C1', challanNo: 'CH-2026-001', challanDate: today, orderNo: 'JP-0006', partyName: 'Larsen & Toubro', taxableAmount: 7600, gstAmount: 1368, totalAmount: 8968, amountPaid: 0, balanceAmount: 8968, dueDate: '2026-05-21', status: 'Pending' },
];

const seedPurchaseOrders: PurchaseOrder[] = [
  { 
    id: 'PO1', 
    poNumber: 'PO-JP-2026-001', 
    supplierName: 'Steel India Ltd', 
    date: '2026-04-20', 
    status: 'Partial',
    items: [
      { id: 'item1', grade: 'IS 2062', thickness: '10mm', width: '1250', length: '2500', nos: 1, kg: 10, rate: 55000, amount: 550000 }
    ],
    totalKg: 10,
    totalAmount: 550000
  },
];


const seedPurchaseReceipts: PurchaseReceipt[] = [
  { id: 'PR1', poId: 'PO1', receivedQty: 6, date: '2026-04-22', remark: 'First lot' },
];

const seedTCRecords: TCRecord[] = [
  {
    id: 'TC-001',
    heatNumber: 'H12345',
    plateNumber: 'P9876',
    tcNumber: 'TC-2026-001',
    tcDate: '2026-05-10',
    salesOrderNumber: 'SO-1001',
    salesOrderDate: '2026-05-08',
    purchaseOrderNumber: 'PO-5001',
    purchaseOrderDate: '2026-05-01',
    supplierInvoiceNumber: 'INV-7788',
    supplierInvoiceDate: '2026-05-05',
    grnNumber: 'GRN-2026-01',
    grade: 'IS 2062 E250',
    thickness: '10mm',
    width: '1250',
    length: '2500',
    plateWeight: '250',
    make: 'Jindal Steel',
    standard: 'ASTM A36',
    batchNumber: 'B-001',
    remarks: 'Sample TC record',
    emailStatus: 'Sent',
    dispatchHistory: [
      {
        partyName: 'Larsen & Toubro',
        dispatchDate: '2026-05-12',
        salesOrderNumber: 'SO-1001',
        tcNumber: 'TC-2026-001',
        emailStatus: 'Sent',
        resendHistory: ['2026-05-14']
      }
    ]
  },
  {
    id: 'TC-002',
    heatNumber: 'H12346',
    plateNumber: 'P9877',
    tcNumber: 'TC-2026-002',
    tcDate: '2026-05-11',
    salesOrderNumber: 'SO-1002',
    salesOrderDate: '2026-05-09',
    purchaseOrderNumber: 'PO-5002',
    purchaseOrderDate: '2026-05-02',
    supplierInvoiceNumber: 'INV-7789',
    supplierInvoiceDate: '2026-05-06',
    grnNumber: 'GRN-2026-02',
    grade: 'SA 516 Gr 70',
    thickness: '20mm',
    width: '2000',
    length: '6000',
    plateWeight: '1884',
    make: 'Tata Steel',
    standard: 'ASME SA516',
    remarks: 'Another TC record',
    emailStatus: 'Not Sent',
    dispatchHistory: []
  }
];

const seedParties: PartyMaster[] = [
  { id: '1', partyName: 'LARSEN & TOUBRO', contactPerson: 'RAHUL MEHTA', mobileNumber: '9876543210', location: 'Makarpura Unit', deliveryAddress: 'L&T GATE 4, VADODARA', paymentTerms: '30 DAYS' },
  { id: '2', partyName: 'RELIANCE INDUSTRIES', contactPerson: 'AMIT PATEL', mobileNumber: '9876541111', location: 'Por Unit', deliveryAddress: 'RELIANCE JAMNAGAR', paymentTerms: '15 DAYS' },
  { id: '3', partyName: 'ADANI POWER', contactPerson: 'VIJAY SHAH', mobileNumber: '9876542222', location: 'Makarpura Unit', deliveryAddress: 'ADANI MUNDRA', paymentTerms: '30 DAYS' },
  { id: '4', partyName: 'TATA STEEL', contactPerson: 'DEEPAK JOSHI', mobileNumber: '9876543333', location: 'Por Unit', deliveryAddress: 'TATA HALDIA', paymentTerms: '45 DAYS' },
  { id: '5', partyName: 'BHEL', contactPerson: 'SURESH KUMAR', mobileNumber: '9876544444', location: 'Makarpura Unit', deliveryAddress: 'BHEL HARIDWAR', paymentTerms: '30 DAYS' },
];

// ─── LocalStorage Helpers ─────────────────────────────────────

const STORAGE_KEY = 'jagdamba_erp_data';
const AUTH_KEY = 'jagdamba_erp_auth';

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
  logs: ActivityLog[];
  parties: PartyMaster[];
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('Admin');
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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [parties, setParties] = useState<PartyMaster[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const stored = loadFromStorage();
      if (stored) {
        setOrders(stored.orders ?? []);
        setPlates(stored.plates ?? []);
        setDispatches(stored.dispatches ?? []);
        setChallans(stored.challans ?? []);
        setPurchaseOrders(stored.purchaseOrders ?? []);
        setPurchaseReceipts(stored.purchaseReceipts ?? []);
        setTCRecords(stored.tcRecords ?? []);
        setQuotations(stored.quotations ?? []);
        setCNCQuotations(stored.cncQuotations ?? []);
        setLogs(stored.logs ?? []);
        setParties(stored.parties ?? seedParties);
      } else {
        // Fallback to seed data on first load
        setOrders(seedOrders);
        setPlates(seedPlates);
        setUsages(seedUsages);
        setDispatches(seedDispatches);
        setChallans(seedChallans);
        setPurchaseOrders(seedPurchaseOrders);
        setPurchaseReceipts(seedPurchaseReceipts);
        setTCRecords(seedTCRecords);
        setParties(seedParties);
        
        saveToStorage({
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
          logs: [],
          parties: seedParties
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data from local storage.');
    }
  }, []);

  useEffect(() => {
    const storedAuth = loadAuth();
    if (storedAuth) {
      setUserState(storedAuth);
      setRole(storedAuth.role);
    }
    fetchData();

    // Sockets removed for local-only version
    return () => {
      // Clean up if needed
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

  // Sync to local storage on every state change
  useEffect(() => {
    saveToStorage({ orders, plates, usages, dispatches, challans, purchaseOrders, purchaseReceipts, tcRecords, quotations, cncQuotations, logs, parties });
  }, [orders, plates, usages, dispatches, challans, purchaseOrders, purchaseReceipts, tcRecords, quotations, cncQuotations, logs, parties]);

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
    const year = new Date().getFullYear();
    const maxNum = purchaseOrders.reduce((max, p) => {
      const parts = p.poNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `PO-JP-${year}-${String(maxNum + 1).padStart(3, '0')}`;
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
    toast.success('Order saved locally');
  }, [addLog]);

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

  const addParty = useCallback(async (party: Omit<PartyMaster, 'id'>) => {
    const newParty: PartyMaster = {
      ...party,
      id: Date.now().toString(),
      partyName: party.partyName.trim().toUpperCase(),
      contactPerson: party.contactPerson.trim().toUpperCase(),
      mobileNumber: party.mobileNumber.trim(),
      deliveryAddress: party.deliveryAddress.trim().toUpperCase(),
      paymentTerms: party.paymentTerms?.trim().toUpperCase(),
      gstNumber: party.gstNumber?.trim().toUpperCase(),
      email: party.email?.trim()
    };
    
    // Prevent duplicates by checking name
    let addedParty = newParty;
    setParties(prev => {
      const existing = prev.find(p => p.partyName === newParty.partyName);
      if (existing) {
        addedParty = existing;
        return prev;
      }
      return [...prev, newParty];
    });

    addLog({
      action: 'Party Created',
      details: `New party '${newParty.partyName}' registered in Master.`,
      type: 'info'
    });
    return addedParty;
  }, [addLog]);

  const updateParty = useCallback(async (party: PartyMaster) => {
    const updated: PartyMaster = {
      ...party,
      partyName: party.partyName.trim().toUpperCase(),
      contactPerson: party.contactPerson.trim().toUpperCase(),
      mobileNumber: party.mobileNumber.trim(),
      deliveryAddress: party.deliveryAddress.trim().toUpperCase(),
      paymentTerms: party.paymentTerms?.trim().toUpperCase(),
      gstNumber: party.gstNumber?.trim().toUpperCase(),
      email: party.email?.trim()
    };
    setParties(prev => prev.map(p => p.id === updated.id ? updated : p));
    addLog({
      action: 'Party Updated',
      details: `Party '${updated.partyName}' details updated.`,
      type: 'info'
    });
    toast.success('Party master updated');
  }, [addLog]);

  const deleteParty = useCallback(async (id: string) => {
    const party = parties.find(p => p.id === id);
    setParties(prev => prev.filter(p => p.id !== id));
    addLog({
      action: 'Party Deleted',
      details: `Party '${party?.partyName}' removed from Master.`,
      type: 'warning'
    });
    toast.success('Party removed from Master');
  }, [parties, addLog]);

  return (
    <AppContext.Provider value={{
      user, setUser, logout,
      role, language, setLanguage, branch, setBranch, t,
      theme, setTheme,
      orders, setOrders, addOrder, updateOrderStage, updateItemStatus, updateItemCompletedQty, updateItemWorker, dispatchItems,
      plates, setPlates,
      usages, setUsages,
      dispatches, setDispatches,
      challans, setChallans,
      logs, addLog,
      purchaseOrders, setPurchaseOrders,
      purchaseReceipts, setPurchaseReceipts,
      tcRecords, setTCRecords,
      addTCRecord: (tc: TCRecord) => setTCRecords(prev => [tc, ...prev]),
      updateTCRecord: (tc: TCRecord) => setTCRecords(prev => prev.map(r => r.id === tc.id ? tc : r)),
      deleteTCRecord: (id: string) => setTCRecords(prev => prev.filter(r => r.id !== id)),
      quotations,
      setQuotations,
      addQuotation: (q: QuotationRecord) => setQuotations(prev => [q, ...prev]),
      deleteQuotation: (id: string) => setQuotations(prev => prev.filter(q => q.id !== id)),

      cncQuotations,
      setCNCQuotations,
      addCNCQuotation: (q: CNCQuotationRecord) => setCNCQuotations(prev => [q, ...prev]),
      deleteCNCQuotation: (id: string) => setCNCQuotations(prev => prev.filter(q => q.id !== id)),

      nextOrderNo, nextChallanNo, nextPONo,
      parties, setParties, addParty, updateParty, deleteParty,
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
