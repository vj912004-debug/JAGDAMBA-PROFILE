import type { TransportMasterRecord, TransportVehicle } from '../store/AppContext';
import { exportToExcel, getExcelCellByAliases } from './excel';

const TRANSPORT_ALIASES = {
  name: ['Transport Name', 'Name', 'Party Name', 'Company Name', 'Transporter', 'Transport'],
  contact: ['Contact Person', 'Contact', 'Person Name', 'Contact Name'],
  phone: ['Phone No', 'Phone', 'Telephone', 'Phone Number'],
  altMobile: ['Alt Mobile', 'Alternate Mobile', 'Alt Phone', 'Alt. Mobile No'],
  mobile: ['Mobile No', 'Mobile', 'Mobile Number', 'Cell', 'Mobile No.'],
  address: ['Address', 'Add', 'Full Address'],
  city: ['City', 'Location', 'Town'],
  state: ['State', 'Region'],
  pincode: ['Pincode', 'Pin', 'Zip', 'PIN Code'],
  gst: ['GST No', 'GST', 'GSTIN', 'GST Number'],
  email: ['Email', 'Email Id', 'E-mail', 'Mail'],
  vehicleCapacity: ['Vehicle Capacity', 'Capacity', 'Weight Capacity'],
  vehicleType: ['Vehicle Type', 'Type', 'Default Vehicle Type'],
  ratePerKg: ['Rate / KG', 'Rate Per Kg', 'Rate', 'Price'],
  remark: ['Remark', 'Remarks', 'Note'],
  vehicleNo: ['Vehicle No', 'Veh No', 'Truck No', 'Lorry No', 'Vehicle Number'],
  vehType: ['Veh Type', 'Vehicle Type (Row)', 'Truck Type'],
  vehCapacity: ['Veh Capacity', 'Vehicle Capacity (Row)'],
  driverName: ['Driver Name', 'Driver'],
  driverMobile: ['Driver Mobile', 'Driver No', 'Driver Mobile No'],
  driverAlt: ['Driver Alt', 'Alt Mobile No', 'Driver Alt Mobile'],
  status: ['Status', 'Vehicle Status'],
};

export function downloadTransportTemplate(): void {
  exportToExcel(
    [
      {
        'Transport Name': 'R.M TRANSPORT',
        'Contact Person': 'RAMESH',
        'Mobile No': '9825012345',
        'Phone No': '0265-123456',
        'Alt Mobile': '9876543210',
        'Address': 'GIDC MAKARPURA, VADODARA',
        'City': 'Vadodara',
        'State': 'Gujarat',
        'Pincode': '390010',
        'GST No': '24AAAAA1111A1Z1',
        'Email': 'rmtransport@example.com',
        'Vehicle Type': 'TRUCK',
        'Vehicle Capacity': '20 TON',
        'Rate / KG': '1.50',
        'Remark': 'LOCAL',
        'Vehicle No': 'GJ06AB1234',
        'Veh Type': 'TRUCK',
        'Veh Capacity': '20 TON',
        'Driver Name': 'SURESH',
        'Driver Mobile': '9998887776',
        'Alt Mobile No': '',
        'Status': 'ACTIVE',
      },
      {
        'Transport Name': 'R.M TRANSPORT',
        'Contact Person': 'RAMESH',
        'Mobile No': '9825012345',
        'Phone No': '',
        'Alt Mobile': '',
        'Address': 'GIDC MAKARPURA, VADODARA',
        'City': 'Vadodara',
        'State': 'Gujarat',
        'Pincode': '390010',
        'GST No': '24AAAAA1111A1Z1',
        'Email': 'rmtransport@example.com',
        'Vehicle Type': 'TRUCK',
        'Vehicle Capacity': '20 TON',
        'Rate / KG': '1.50',
        'Remark': 'LOCAL',
        'Vehicle No': 'GJ06CD5678',
        'Veh Type': 'PICKUP',
        'Veh Capacity': '3 TON',
        'Driver Name': 'MAHESH',
        'Driver Mobile': '9988776655',
        'Alt Mobile No': '',
        'Status': 'ACTIVE',
      },
    ],
    'Transport Master',
    'transport_master_template.xlsx',
  );
}

function cell(row: Record<string, unknown>, aliases: string[]): string {
  return getExcelCellByAliases(row, aliases).trim();
}

function parseVehicle(row: Record<string, unknown>, idx: number): TransportVehicle | null {
  const vehicleNo = cell(row, TRANSPORT_ALIASES.vehicleNo);
  if (!vehicleNo) return null;
  const statusRaw = cell(row, TRANSPORT_ALIASES.status).toUpperCase();
  return {
    id: `veh_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
    vehicleNo: vehicleNo.toUpperCase(),
    vehicleType: cell(row, TRANSPORT_ALIASES.vehType) || cell(row, TRANSPORT_ALIASES.vehicleType),
    vehicleCapacity: cell(row, TRANSPORT_ALIASES.vehCapacity) || cell(row, TRANSPORT_ALIASES.vehicleCapacity),
    driverName: cell(row, TRANSPORT_ALIASES.driverName),
    driverMobileNo: cell(row, TRANSPORT_ALIASES.driverMobile),
    altMobileNo: cell(row, TRANSPORT_ALIASES.driverAlt),
    status: statusRaw === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  };
}

export type ParsedTransportRow = Omit<TransportMasterRecord, 'id' | 'code'>;

/** Parse Excel rows into transport masters. Same name = one transport with merged vehicles. */
export function excelRowsToTransports(rows: Record<string, unknown>[]): ParsedTransportRow[] {
  const byKey = new Map<string, ParsedTransportRow>();

  rows.forEach((row, idx) => {
    const name = cell(row, TRANSPORT_ALIASES.name).toUpperCase();
    if (!name) return;

    const key = name;
    const existing = byKey.get(key);
    const vehicle = parseVehicle(row, idx);

    if (!existing) {
      byKey.set(key, {
        name,
        contact: cell(row, TRANSPORT_ALIASES.contact),
        phone: cell(row, TRANSPORT_ALIASES.phone),
        altMobile: cell(row, TRANSPORT_ALIASES.altMobile),
        mobile: cell(row, TRANSPORT_ALIASES.mobile),
        address: cell(row, TRANSPORT_ALIASES.address),
        city: cell(row, TRANSPORT_ALIASES.city),
        state: cell(row, TRANSPORT_ALIASES.state) || 'Gujarat',
        pincode: cell(row, TRANSPORT_ALIASES.pincode),
        gst: cell(row, TRANSPORT_ALIASES.gst).toUpperCase(),
        email: cell(row, TRANSPORT_ALIASES.email),
        vehicleCapacity: cell(row, TRANSPORT_ALIASES.vehicleCapacity),
        vehicleType: cell(row, TRANSPORT_ALIASES.vehicleType),
        ratePerKg: cell(row, TRANSPORT_ALIASES.ratePerKg),
        remark: cell(row, TRANSPORT_ALIASES.remark),
        vehicles: vehicle ? [vehicle] : [],
      });
      return;
    }

    // Fill blanks from later rows; append vehicles
    if (!existing.contact) existing.contact = cell(row, TRANSPORT_ALIASES.contact);
    if (!existing.mobile) existing.mobile = cell(row, TRANSPORT_ALIASES.mobile);
    if (!existing.phone) existing.phone = cell(row, TRANSPORT_ALIASES.phone);
    if (!existing.altMobile) existing.altMobile = cell(row, TRANSPORT_ALIASES.altMobile);
    if (!existing.address) existing.address = cell(row, TRANSPORT_ALIASES.address);
    if (!existing.city) existing.city = cell(row, TRANSPORT_ALIASES.city);
    if (!existing.gst) existing.gst = cell(row, TRANSPORT_ALIASES.gst).toUpperCase();
    if (!existing.email) existing.email = cell(row, TRANSPORT_ALIASES.email);
    if (!existing.vehicleType) existing.vehicleType = cell(row, TRANSPORT_ALIASES.vehicleType);
    if (!existing.vehicleCapacity) existing.vehicleCapacity = cell(row, TRANSPORT_ALIASES.vehicleCapacity);
    if (!existing.ratePerKg) existing.ratePerKg = cell(row, TRANSPORT_ALIASES.ratePerKg);
    if (!existing.remark) existing.remark = cell(row, TRANSPORT_ALIASES.remark);

    if (vehicle) {
      const dup = (existing.vehicles || []).some(
        v => v.vehicleNo.toUpperCase() === vehicle.vehicleNo.toUpperCase(),
      );
      if (!dup) existing.vehicles = [...(existing.vehicles || []), vehicle];
    }
  });

  return Array.from(byKey.values());
}
