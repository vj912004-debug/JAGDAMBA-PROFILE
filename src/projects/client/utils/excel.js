import * as XLSX from 'xlsx';

export const exportToExcel = (data, sheetName = 'Data', filename = 'export.xlsx') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Column aliases → internal field names (key = lowercased/trimmed header)
const CSV_MAP = {
  // Name
  'contact person': 'contactPerson', 'contactperson': 'contactPerson',
  'person': 'contactPerson', 'name': 'contactPerson', 'full name': 'contactPerson',
  'fullname': 'contactPerson', 'contact name': 'contactPerson',
  // Company
  'company name': 'companyName', 'companyname': 'companyName',
  'company': 'companyName', 'firm': 'companyName', 'firm name': 'companyName',
  'business name': 'companyName', 'organisation': 'companyName', 'organization': 'companyName',
  // Mobile
  'mobile': 'mobile', 'phone': 'mobile', 'mobile number': 'mobile',
  'mobilenumber': 'mobile', 'phone number': 'mobile', 'phonenumber': 'mobile',
  'contact number': 'mobile', 'cell': 'mobile', 'cell number': 'mobile', 'number': 'mobile',
  'mob': 'mobile', 'mob no': 'mobile', 'mobile no': 'mobile', 'ph no': 'mobile',
  // Alt Mobile
  'alternate mobile': 'altMobile', 'alt mobile': 'altMobile', 'alt phone': 'altMobile',
  'alternate number': 'altMobile', 'alt number': 'altMobile', 'mobile 2': 'altMobile',
  'phone 2': 'altMobile', 'secondary mobile': 'altMobile',
  // WhatsApp
  'whatsapp': 'whatsapp', 'whatsapp number': 'whatsapp', 'wa number': 'whatsapp',
  'whatsapp no': 'whatsapp', 'wp': 'whatsapp', 'wp number': 'whatsapp',
  // Email
  'email': 'email', 'email id': 'email', 'emailid': 'email', 'email address': 'email',
  'e-mail': 'email', 'mail': 'email',
  // Address
  'address': 'address', 'addr': 'address', 'street': 'address', 'street address': 'address',
  // City
  'city': 'city', 'town': 'city', 'district': 'city',
  // State
  'state': 'state', 'province': 'state',
  // Pincode
  'pincode': 'pincode', 'pin code': 'pincode', 'zip': 'pincode', 'zip code': 'pincode', 'postal code': 'pincode',
  // Designation
  'designation': 'designation', 'role': 'designation', 'title': 'designation', 'position': 'designation',
  // Category
  'category group': 'categoryGroup', 'categorygroup': 'categoryGroup', 'group': 'categoryGroup',
  'category': 'category', 'cat': 'category', 'type': 'category',
  // Status
  'status': 'status', 'importance': 'status', 'priority': 'status',
  // Rating
  'rating': 'rating', 'stars': 'rating', 'score': 'rating',
  // Dates
  'birthday': 'birthday', 'birth date': 'birthday', 'dob': 'birthday', 'date of birth': 'birthday',
  'follow up date': 'followUpDate', 'followup date': 'followUpDate', 'followupdate': 'followUpDate',
  'follow-up date': 'followUpDate', 'follow up': 'followUpDate', 'next follow up': 'followUpDate',
  // Notes
  'notes': 'notes', 'note': 'notes', 'remarks': 'notes', 'comment': 'notes', 'comments': 'notes',
  'description': 'notes',
};

// Pure JS CSV parser — handles quotes, commas inside values, CRLF/LF, BOM
function parseCSVText(text) {
  // Strip BOM
  const t = text.replace(/^\uFEFF/, '');
  const lines = t.split(/\r?\n/);
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const cols = [];
    let cur = '', inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseRow(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
    rows.push(obj);
  }
  return rows;
}

export const importFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = parseCSVText(e.target.result);
        const mapped = raw.map((row, i) => {
          const contact = {
            id: `csv_${Date.now()}_${i}`,
            companyName: '', contactPerson: '', mobile: '', altMobile: '',
            whatsapp: '', email: '', address: '', city: '', state: '', pincode: '',
            designation: '', categoryGroup: 'Business', category: '',
            status: 'Regular', rating: 0, birthday: '', followUpDate: '', notes: '',
            createdAt: new Date().toISOString(),
          };
          Object.entries(row).forEach(([key, val]) => {
            const field = CSV_MAP[key.trim().toLowerCase()];
            if (field && val !== undefined && val !== null) {
              contact[field] = field === 'rating' ? Number(val) || 0 : String(val).trim();
            }
          });

          // Fallback: if nothing mapped, store first non-empty value as contactPerson
          const anyMapped = Object.entries(contact).some(([k, v]) =>
            k !== 'id' && k !== 'createdAt' && k !== 'categoryGroup' && k !== 'status' && k !== 'rating' && v !== ''
          );
          if (!anyMapped) {
            const firstVal = Object.values(row).find(v => v && String(v).trim());
            if (firstVal) contact.contactPerson = String(firstVal).trim();
          }
          return contact;
        }).filter(c =>
          c.contactPerson || c.companyName || c.mobile || c.email || c.city
        );

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
};

// ---- VCF / vCard import ----

// Normalize a phone string → keep digits, drop +91/0 prefix, return last 10 digits when possible
function cleanPhone(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/[^\d]/g, '');
  if (d.length > 10) d = d.slice(-10);
  return d;
}

// Decode quoted-printable (used by vCard 2.1) — incl. soft line breaks
function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// Parse a single vCard block into our contact shape
function parseVCard(block, index) {
  const contact = {
    id: `vcf_${Date.now()}_${index}`,
    companyName: '', contactPerson: '', mobile: '', altMobile: '',
    whatsapp: '', email: '', address: '', city: '', state: '', pincode: '',
    designation: '', categoryGroup: 'Business', category: '',
    status: 'Regular', rating: 0, birthday: '', followUpDate: '', notes: '',
    createdAt: new Date().toISOString(),
  };

  // Unfold folded lines (continuation lines begin with space/tab)
  const lines = block.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);

  let fn = '', nName = '';
  const phones = [];

  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const left = line.slice(0, idx);
    let value = line.slice(idx + 1).trim();
    const parts = left.split(';');
    const name = parts[0].toUpperCase().replace(/^ITEM\d+\./, '');
    const params = parts.slice(1).map(p => p.toUpperCase());

    if (params.some(p => p.includes('QUOTED-PRINTABLE'))) value = decodeQuotedPrintable(value);
    if (!value) continue;

    switch (name) {
      case 'FN':
        fn = value;
        break;
      case 'N': {
        // Last;First;Middle;Prefix;Suffix
        const seg = value.split(';');
        nName = [seg[3], seg[1], seg[2], seg[0], seg[4]].filter(Boolean).join(' ').trim();
        break;
      }
      case 'ORG':
        contact.companyName = value.split(';')[0].trim();
        break;
      case 'TITLE':
        contact.designation = value;
        break;
      case 'TEL': {
        const phone = cleanPhone(value);
        if (phone) phones.push({ phone, params });
        break;
      }
      case 'EMAIL':
        if (!contact.email) contact.email = value;
        break;
      case 'ADR': {
        // ;;street;city;state;pincode;country
        const seg = value.split(';');
        const street = [seg[0], seg[1], seg[2]].filter(Boolean).join(' ').trim();
        if (street) contact.address = street;
        if (seg[3]) contact.city = seg[3].trim();
        if (seg[4]) contact.state = seg[4].trim();
        if (seg[5]) contact.pincode = seg[5].trim();
        break;
      }
      case 'BDAY':
        contact.birthday = value.slice(0, 10);
        break;
      case 'NOTE':
        contact.notes = value;
        break;
      default:
        break;
    }
  }

  contact.contactPerson = (fn || nName).trim();

  // Choose mobile: prefer CELL/MOBILE typed numbers, else first
  const cell = phones.find(p => p.params.some(x => x.includes('CELL') || x.includes('MOBILE')));
  const primary = cell || phones[0];
  if (primary) {
    contact.mobile = primary.phone;
    contact.whatsapp = primary.phone;
    const others = phones.filter(p => p.phone !== primary.phone);
    if (others[0]) contact.altMobile = others[0].phone;
  }

  return contact;
}

export const importFromVCF = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target.result).replace(/^\uFEFF/, '');
        const blocks = text.split(/BEGIN:VCARD/i).slice(1);
        const contacts = blocks
          .map((b, i) => parseVCard(b.replace(/END:VCARD[\s\S]*$/i, ''), i))
          .filter(c => c.contactPerson || c.companyName || c.mobile || c.email);
        resolve(contacts);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
};

export const downloadCSVTemplate = () => {
  const headers = [
    'Name', 'Company', 'Mobile', 'Alternate Mobile', 'WhatsApp',
    'Email', 'Address', 'City', 'State', 'Pincode',
    'Designation', 'Category', 'Status', 'Rating',
    'Birthday', 'Follow Up Date', 'Notes',
  ];
  const rows = [
    ['Ramesh Shah', 'Shah Steels Pvt Ltd', '9876543210', '9876543211', '9876543210',
     'ramesh@shahsteels.com', '12 Industrial Area', 'Surat', 'Gujarat', '395010',
     'Owner', 'Steel Trader', 'VIP', '5', '1985-04-15', '', 'Key customer'],
    ['Dilip Patel', 'Patel Transport Co', '9898989898', '', '9898989898',
     '', 'NH-8 Highway', 'Ahmedabad', 'Gujarat', '380001',
     'Manager', 'Transporter', 'Regular', '3', '', '2026-07-01', 'Follow up for rates'],
  ];
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'contacts_template.csv'; a.click();
  URL.revokeObjectURL(url);
};
