import { BRANCHES, type PartyMaster } from '../store/AppContext';
import { exportToExcel, getExcelCellByAliases } from './excel';

const PARTY_FIELD_ALIASES: Record<keyof Omit<PartyMaster, 'id'>, string[]> = {
  partyName: [
    'Party Name', 'Party', 'Customer Name', 'Customer', 'Ledger Name', 'Ledger',
    'Name', 'Company', 'Company Name', 'Party / Customer Name', 'partyName', 'Mailing Name',
  ],
  location: [
    'Branch / Location', 'Branch', 'Location', 'City', 'Branch Location', 'location',
  ],
  contactPerson: [
    'Contact Person', 'Contact', 'Person', 'Contact Name', 'contactPerson',
  ],
  mobileNumber: [
    'Mobile Number', 'Mobile', 'Phone', 'Phone Number', 'Contact Number',
    'Mobile No', 'Mobile No.', 'mobileNumber',
  ],
  email: ['Email Address', 'Email', 'E-mail', 'email'],
  gstNumber: [
    'GSTIN Number', 'GST Number', 'GSTIN', 'GST No', 'GST', 'gstNumber',
  ],
  paymentTerms: ['Payment Terms', 'Credit Terms', 'Terms', 'Credit Period', 'paymentTerms'],
  reference: ['Reference', 'Ref', 'Remark', 'Remarks', 'reference'],
  deliveryAddress: [
    'Delivery Address', 'Default Delivery Address', 'Delivery', 'deliveryAddress', 'Mailing Address',
  ],
  supplierAddress: ['Supplier Address', 'Supplier', 'supplierAddress'],
  address: ['Address', 'Billing Address', 'address'],
  grades: ['Grades', 'Grade', 'Material Grade', 'grades'],
  partyCode: ['Party Code', 'Code', 'partyCode'],
  category: ['Category', 'Type', 'category'],
  mobile2: ['Mobile 2', 'Mobile No 2', 'mobile2'],
  whatsappNumber: ['WhatsApp', 'WhatsApp No', 'whatsappNumber'],
  city: ['City', 'city'],
  state: ['State', 'state'],
  country: ['Country', 'country'],
  pincode: ['Pincode', 'PIN', 'pincode'],
  panNumber: ['PAN', 'PAN No', 'panNumber'],
  msmeNumber: ['MSME', 'MSME No', 'msmeNumber'],
  salesPerson: ['Sales Person', 'salesPerson'],
  followupPerson: ['Follow-up Person', 'Followup Person', 'followupPerson'],
  remark: ['Remark', 'Remarks', 'remark'],
  partyStatus: ['Status', 'Party Status', 'partyStatus'],
};

function normalizePaymentTerms(value: string): string {
  const upper = value.toUpperCase().trim();
  if (!upper) return '30 DAYS';
  if (upper.includes('IMMEDIATE')) return 'IMMEDIATE';
  if (upper.includes('7')) return '7 DAYS';
  if (upper.includes('15')) return '15 DAYS';
  if (upper.includes('45')) return '45 DAYS';
  if (upper.includes('60')) return '60 DAYS';
  if (upper.includes('30')) return '30 DAYS';
  return upper;
}

export function downloadPartyTemplate(): void {
  exportToExcel(
    [
      {
        'Party Name': 'KARAN ENTERPRISE',
        'Branch / Location': BRANCHES[0] || 'VADODARA',
        'Contact Person': 'KARAN SHAH',
        'Mobile Number': '9824042755',
        'Email Address': 'karan@example.com',
        'GSTIN Number': '24AAAAA1111A1Z1',
        'Payment Terms': '30 DAYS',
        'Reference': 'LOCAL SUPPLIER',
        'Supplier Address': '504/1/A, GIDC MAKARPURA, VADODARA',
        'Delivery Address': '504/1/A, GIDC MAKARPURA, VADODARA',
      },
    ],
    'Party Master',
    'party_master_template.xlsx',
  );
}

export function excelRowToParty(row: Record<string, unknown>): Omit<PartyMaster, 'id'> {
  const party: Omit<PartyMaster, 'id'> = {
    partyName: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.partyName),
    location: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.location) || BRANCHES[0] || '',
    contactPerson: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.contactPerson),
    mobileNumber: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.mobileNumber),
    email: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.email),
    gstNumber: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.gstNumber),
    paymentTerms: normalizePaymentTerms(getExcelCellByAliases(row, PARTY_FIELD_ALIASES.paymentTerms)),
    reference: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.reference),
    deliveryAddress: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.deliveryAddress),
    supplierAddress: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.supplierAddress),
    address: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.address),
    grades: getExcelCellByAliases(row, PARTY_FIELD_ALIASES.grades)
      .split(/[,;|]/)
      .map(g => g.trim())
      .filter(Boolean),
  };

  if (!party.deliveryAddress && party.address) {
    party.deliveryAddress = party.address;
  }

  return party;
}
