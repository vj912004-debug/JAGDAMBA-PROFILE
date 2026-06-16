"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { fetchErpData, saveErpData, ERP_VERSION, type ErpStoredData } from '../services/erpApi';
import toast from 'react-hot-toast';

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
  driverMobile?: string;
  paymentTerms?: string;
  make?: string;
  utLevel?: string;
  tc?: string;
  note?: string;
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
  address?: string;
  supplierAddress?: string;
  reference?: string;
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
  deletePurchaseOrder: (id: string) => void;
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
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('jagdamba_erp_token');
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      return null;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(data: StoredData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  } catch { /* ignore */ }
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
    logs: [],
    parties: seedParties,
  };
}

function applyStoredData(
  stored: StoredData,
  setters: {
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
    setLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>;
    setParties: React.Dispatch<React.SetStateAction<PartyMaster[]>>;
  }
) {
  setters.setOrders(stored.orders ?? []);
  setters.setPlates(stored.plates ?? []);
  setters.setUsages(stored.usages ?? []);
  setters.setDispatches(stored.dispatches ?? []);
  setters.setChallans(stored.challans ?? []);
  setters.setPurchaseOrders(stored.purchaseOrders ?? []);
  setters.setPurchaseReceipts(stored.purchaseReceipts ?? []);
  setters.setTCRecords(stored.tcRecords ?? []);
  setters.setQuotations(stored.quotations ?? []);
  setters.setCNCQuotations(stored.cncQuotations ?? []);
  setters.setLogs(stored.logs ?? []);
  setters.setParties(stored.parties?.length ? stored.parties : seedParties);
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
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [parties, setParties] = useState<PartyMaster[]>([]);
  const dataReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    const setters = {
      setOrders, setPlates, setUsages, setDispatches, setChallans,
      setPurchaseOrders, setPurchaseReceipts, setTCRecords,
      setQuotations, setCNCQuotations, setLogs, setParties,
    };

    try {
      const server = await fetchErpData();
      if (server.data) {
        applyStoredData(server.data as StoredData, setters);
        saveToStorage(server.data as StoredData);
        dataReadyRef.current = true;
        return;
      }

      const local = loadFromStorage();
      if (local) {
        applyStoredData(local, setters);
        await saveErpData(local as ErpStoredData, CURRENT_VERSION);
        dataReadyRef.current = true;
        return;
      }

      const seed = getSeedData();
      applyStoredData(seed, setters);
      await saveErpData(seed as ErpStoredData, CURRENT_VERSION);
      saveToStorage(seed);
      dataReadyRef.current = true;
    } catch (error) {
      console.error('Error loading data:', error);
      const local = loadFromStorage();
      if (local) {
        applyStoredData(local, setters);
        toast.error('Server unavailable — loaded from browser cache.');
      } else {
        const seed = getSeedData();
        applyStoredData(seed, setters);
        saveToStorage(seed);
        toast.error('Failed to load from server. Using default data.');
      }
      dataReadyRef.current = true;
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

  // Sync to server + local cache on every state change
  useEffect(() => {
    if (!dataReadyRef.current) return;

    const payload: StoredData = {
      orders, plates, usages, dispatches, challans,
      purchaseOrders, purchaseReceipts, tcRecords,
      quotations, cncQuotations, logs, parties,
    };

    saveToStorage(payload);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveErpData(payload as ErpStoredData, CURRENT_VERSION);
      } catch (error) {
        console.error('Error saving to server:', error);
        toast.error('Failed to save to server. Data kept in browser cache.');
      }
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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
      email: party.email?.trim(),
      address: party.address?.trim().toUpperCase(),
      supplierAddress: party.supplierAddress?.trim().toUpperCase(),
      reference: party.reference?.trim().toUpperCase()
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

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    toast.success('Purchase Order deleted');
  };

  const updateParty = useCallback(async (party: PartyMaster) => {
    const updated: PartyMaster = {
      ...party,
      partyName: party.partyName.trim().toUpperCase(),
      contactPerson: party.contactPerson.trim().toUpperCase(),
      mobileNumber: party.mobileNumber.trim(),
      deliveryAddress: party.deliveryAddress.trim().toUpperCase(),
      paymentTerms: party.paymentTerms?.trim().toUpperCase(),
      gstNumber: party.gstNumber?.trim().toUpperCase(),
      email: party.email?.trim(),
      address: party.address?.trim().toUpperCase(),
      supplierAddress: party.supplierAddress?.trim().toUpperCase(),
      reference: party.reference?.trim().toUpperCase()
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
