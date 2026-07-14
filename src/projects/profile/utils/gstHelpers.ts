export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman & Diu',
  '26': 'Dadra & Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

export interface GstLookupResult {
  gstNumber: string;
  partyName: string;
  legalName: string;
  tradeName: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  source: 'local' | 'gstincheck' | 'gstverify' | 'gstportal' | 'party';
  partial?: boolean;
}

export function normalizeGstin(input: string) {
  return input.replace(/\s/g, '').toUpperCase();
}

export function isValidGstinFormat(gstin: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin);
}

export function panFromGstin(gstin: string) {
  return normalizeGstin(gstin).substring(2, 12);
}

export function stateFromGstin(gstin: string) {
  const code = normalizeGstin(gstin).substring(0, 2);
  return GST_STATE_CODES[code] || '';
}

function joinParts(parts: Array<string | undefined | null>) {
  return parts.map(p => (p || '').trim()).filter(Boolean).join(', ');
}

function parsePincode(text = '') {
  const match = String(text).match(/\b(\d{6})\b/);
  return match ? match[1] : '';
}

const STATE_NAME_LIST = Object.values(GST_STATE_CODES);

function normalizeStateToken(value = '') {
  return String(value).trim().toUpperCase();
}

export function parseGstAddressLine(adr: string, fallbackState = '') {
  const raw = String(adr || '').trim().replace(/\s+/g, ' ');
  if (!raw) return { address: '', city: '', pincode: '' };

  let parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  const pincode = parsePincode(raw);

  if (parts.length && /^\d{6}$/.test(parts[parts.length - 1])) {
    parts = parts.slice(0, -1);
  }

  if (parts.length) {
    const last = normalizeStateToken(parts[parts.length - 1]);
    const matchedState = STATE_NAME_LIST.find(
      state => normalizeStateToken(state) === last || last.includes(normalizeStateToken(state)),
    );
    const fallbackMatch = fallbackState && last === normalizeStateToken(fallbackState);
    if (matchedState || fallbackMatch) {
      parts = parts.slice(0, -1);
    }
  }

  let city = '';
  if (parts.length >= 2) {
    city = parts[parts.length - 1];
    parts = parts.slice(0, -1);
  } else if (parts.length === 1) {
    city = parts[0];
    parts = [];
  }

  const address = parts.join(', ') || raw;
  return { address, city, pincode };
}

function guessCityFromAddress(address: string) {
  return parseGstAddressLine(address).city;
}

function addressFromPradr(pradr: unknown, fallbackState = ''): { address: string; city: string; state: string; pincode: string } {
  if (!pradr) {
    return { address: '', city: '', state: '', pincode: '' };
  }
  if (typeof pradr === 'string') {
    const parsed = parseGstAddressLine(pradr, fallbackState);
    return { ...parsed, state: '' };
  }
  const root = pradr as { addr?: Record<string, string>; adr?: string };
  const addr = root.addr || {};
  const hasStructuredAddr = Boolean(
    addr.bno || addr.bnm || addr.st || addr.loc || addr.dst || addr.pncd || addr.stcd,
  );

  if (hasStructuredAddr) {
    const city = (addr.loc || addr.city || addr.dst || '').trim();
    const address = joinParts([addr.flno, addr.bno, addr.bnm, addr.st]);
    return {
      address: address || joinParts([addr.bno, addr.bnm, addr.st, addr.loc, addr.dst]),
      city,
      state: (addr.stcd || '').trim(),
      pincode: (addr.pncd || '').trim(),
    };
  }

  if (typeof root.adr === 'string' && root.adr.trim()) {
    const parsed = parseGstAddressLine(root.adr.trim(), fallbackState);
    return { ...parsed, state: '' };
  }

  return { address: '', city: '', state: '', pincode: '' };
}

export function mapGstApiPayload(raw: Record<string, unknown>, gstin: string, source: GstLookupResult['source']): GstLookupResult {
  const legalName = String(raw.lgnm || raw.legal_name || raw.legalName || '').trim();
  const tradeName = String(raw.tradeNam || raw.trade_name || raw.tradeName || '').trim();
  const partyName = legalName || tradeName;
  const fallbackState = stateFromGstin(gstin);
  const pradr = raw.pradr || raw.registered_address || raw.address;
  const addr = addressFromPradr(pradr, fallbackState);
  const parsedAddress = addr.address ? parseGstAddressLine(addr.address, addr.state || fallbackState) : { address: '', city: '', pincode: '' };
  const address = parsedAddress.address || addr.address;
  const city = addr.city || parsedAddress.city || guessCityFromAddress(address);
  const pincode = addr.pincode || parsedAddress.pincode || parsePincode(address);
  const status = String(raw.sts || raw.registration_status || raw.status || '').trim();

  return {
    gstNumber: normalizeGstin(String(raw.gstin || gstin)),
    partyName,
    legalName,
    tradeName,
    panNumber: panFromGstin(gstin),
    address,
    city,
    state: addr.state || stateFromGstin(gstin),
    pincode,
    status,
    source,
    partial: false,
  };
}

export function localGstLookup(gstin: string): GstLookupResult {
  const normalized = normalizeGstin(gstin);
  return {
    gstNumber: normalized,
    partyName: '',
    legalName: '',
    tradeName: '',
    panNumber: panFromGstin(normalized),
    address: '',
    city: '',
    state: stateFromGstin(normalized),
    pincode: '',
    status: '',
    source: 'local',
    partial: true,
  };
}

export function matchPartyMasterState(stateName: string, options: string[]) {
  if (!stateName) return options[0] || 'Gujarat';
  const upper = stateName.toUpperCase();
  const exact = options.find(s => s.toUpperCase() === upper);
  if (exact) return exact;
  const partial = options.find(s => upper.includes(s.toUpperCase()) || s.toUpperCase().includes(upper));
  return partial || 'Other';
}
