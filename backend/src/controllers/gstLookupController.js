import {
  fetchGstPortalCaptcha,
  fetchGstPortalCaptchaPng,
  fetchGstPortalTaxpayer,
} from '../services/gstPortalService.js';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const GST_STATE_CODES = {
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

function normalizeGstin(input = '') {
  return String(input).replace(/\s/g, '').toUpperCase();
}

function panFromGstin(gstin) {
  return gstin.substring(2, 12);
}

function stateFromGstin(gstin) {
  return GST_STATE_CODES[gstin.substring(0, 2)] || '';
}

function joinParts(parts) {
  return parts.map((p) => String(p || '').trim()).filter(Boolean).join(', ');
}

function parsePincode(text = '') {
  const match = String(text).match(/\b(\d{6})\b/);
  return match ? match[1] : '';
}

function parseGstAddressLine(adr, fallbackState = '') {
  const raw = String(adr || '').trim().replace(/\s+/g, ' ');
  if (!raw) return { address: '', city: '', pincode: '' };

  let parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  const pincode = parsePincode(raw);

  if (parts.length && /^\d{6}$/.test(parts[parts.length - 1])) {
    parts = parts.slice(0, -1);
  }

  if (parts.length) {
    const last = parts[parts.length - 1].trim().toUpperCase();
    const matchedState = Object.values(GST_STATE_CODES).find(
      (state) => state.toUpperCase() === last || last.includes(state.toUpperCase()),
    );
    const fallbackMatch = fallbackState && last === String(fallbackState).trim().toUpperCase();
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

function addressFromPradr(pradr, fallbackState = '') {
  if (!pradr) {
    return { address: '', city: '', state: '', pincode: '' };
  }
  if (typeof pradr === 'string') {
    const parsed = parseGstAddressLine(pradr, fallbackState);
    return { ...parsed, state: '' };
  }
  const addr = pradr.addr || {};
  const hasStructuredAddr = Boolean(
    addr.bno || addr.bnm || addr.st || addr.loc || addr.dst || addr.pncd || addr.stcd,
  );

  if (hasStructuredAddr) {
    const city = String(addr.loc || addr.city || addr.dst || '').trim();
    const address = joinParts([addr.flno, addr.bno, addr.bnm, addr.st]);
    return {
      address: address || joinParts([addr.bno, addr.bnm, addr.st, addr.loc, addr.dst]),
      city,
      state: String(addr.stcd || '').trim(),
      pincode: String(addr.pncd || '').trim(),
    };
  }

  if (typeof pradr.adr === 'string' && pradr.adr.trim()) {
    const parsed = parseGstAddressLine(pradr.adr.trim(), fallbackState);
    return { ...parsed, state: '' };
  }

  return { address: '', city: '', state: '', pincode: '' };
}

function buildResult(raw, gstin, source, partial = false) {
  const legalName = String(raw.lgnm || raw.legal_name || raw.legalName || '').trim();
  const tradeName = String(raw.tradeNam || raw.trade_name || raw.tradeName || '').trim();
  const fallbackState = stateFromGstin(gstin);
  const pradr = raw.pradr || raw.registered_address || raw.address;
  const addr = addressFromPradr(pradr, fallbackState);
  const parsedAddress = addr.address ? parseGstAddressLine(addr.address, addr.state || fallbackState) : { address: '', city: '', pincode: '' };
  const address = parsedAddress.address || addr.address;
  const city = addr.city || parsedAddress.city || parseGstAddressLine(address, addr.state || fallbackState).city;
  const pincode = addr.pincode || parsedAddress.pincode || parsePincode(address);

  return {
    success: true,
    data: {
      gstNumber: normalizeGstin(raw.gstin || gstin),
      partyName: legalName || tradeName,
      legalName,
      tradeName,
      panNumber: panFromGstin(gstin),
      address,
      city,
      state: addr.state || stateFromGstin(gstin),
      pincode,
      status: String(raw.sts || raw.registration_status || raw.status || '').trim(),
      source,
      partial,
    },
  };
}

async function lookupGstincheck(gstin, apiKey) {
  const res = await fetch(`https://sheet.gstincheck.co.in/check/${apiKey}/${gstin}`, {
    headers: { Accept: 'application/json' },
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.flag || !json?.data) {
    throw new Error(json?.message || 'GST lookup failed');
  }
  return buildResult(json.data, gstin, 'gstincheck', false);
}

async function lookupGstverify(gstin, apiKey) {
  const res = await fetch(`https://gstverify.co.in/api/v1/verify/${gstin}`, {
    headers: {
      Accept: 'application/json',
      'X-API-Key': apiKey,
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || json?.message || 'GST lookup failed');
  }
  return buildResult(json.data, gstin, 'gstverify', false);
}

export const getGstCaptcha = async (_req, res) => {
  try {
    const captcha = await fetchGstPortalCaptcha();
    res.json({
      success: true,
      ...captcha,
      imageUrl: `/api/erp/gst-captcha/${encodeURIComponent(captcha.sessionId)}.png`,
    });
  } catch (error) {
    console.error('GST captcha error:', error.message);
    res.status(502).json({ success: false, message: error.message || 'Could not load GST captcha' });
  }
};

export const getGstCaptchaImage = async (req, res) => {
  const sessionId = String(req.params.sessionId || '').trim();
  if (!sessionId) {
    return res.status(400).send('Missing sessionId');
  }
  try {
    const buffer = await fetchGstPortalCaptchaPng(sessionId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('GST captcha image error:', error.message);
    return res.status(404).send('Captcha expired');
  }
};

export const lookupGstinWithCaptcha = async (req, res) => {
  const gstin = normalizeGstin(req.body?.gstin);
  const captcha = String(req.body?.captcha || '').trim();
  const sessionId = String(req.body?.sessionId || '').trim();

  if (!GSTIN_RE.test(gstin)) {
    return res.status(400).json({ success: false, message: 'Invalid GST number format' });
  }
  if (!captcha) {
    return res.status(400).json({ success: false, message: 'Captcha is required' });
  }
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'GST session expired. Refresh captcha.' });
  }

  try {
    const raw = await fetchGstPortalTaxpayer(gstin, captcha, sessionId);
    return res.json(buildResult(raw, gstin, 'gstportal', false));
  } catch (error) {
    console.error('GST portal lookup error:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'GST lookup failed' });
  }
};

export const lookupGstin = async (req, res) => {
  const gstin = normalizeGstin(req.params.gstin);
  if (!GSTIN_RE.test(gstin)) {
    return res.status(400).json({ success: false, message: 'Invalid GST number format' });
  }

  const gstCheckKey = process.env.GST_LOOKUP_API_KEY;
  const gstVerifyKey = process.env.GST_VERIFY_API_KEY;

  try {
    if (gstCheckKey) {
      const result = await lookupGstincheck(gstin, gstCheckKey);
      return res.json(result);
    }
    if (gstVerifyKey) {
      const result = await lookupGstverify(gstin, gstVerifyKey);
      return res.json(result);
    }
  } catch (error) {
    console.error('GST lookup provider error:', error.message);
    if (gstCheckKey || gstVerifyKey) {
      return res.status(400).json({ success: false, message: `API Key Error: ${error.message}. Please check your GST_LOOKUP_API_KEY in .env` });
    }
  }

  return res.json({
    success: true,
    requiresCaptcha: false,
    ...buildResult({}, gstin, 'local', true),
  });
};
