import type { PartyMaster } from '../store/AppContext';
import {
  type GstLookupResult,
  isValidGstinFormat,
  localGstLookup,
  mapGstApiPayload,
  matchPartyMasterState,
  normalizeGstin,
  parseGstAddressLine,
} from './gstHelpers';

export type { GstLookupResult } from './gstHelpers';

export interface GstCaptchaSession {
  sessionId: string;
  image: string;
  imageUrl?: string;
}

function partyToGstLookup(party: PartyMaster): GstLookupResult {
  return {
    gstNumber: normalizeGstin(party.gstNumber || ''),
    partyName: party.partyName || '',
    legalName: party.partyName || '',
    tradeName: party.partyName || '',
    panNumber: party.panNumber || '',
    address: party.address || party.deliveryAddress || '',
    city: party.city || '',
    state: party.state || '',
    pincode: party.pincode || '',
    status: party.partyStatus || '',
    source: 'party',
    partial: false,
  };
}

async function parseJsonResponse(res: Response) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message || body.error || `GST request failed (${res.status})`);
  }
  return body;
}

export async function fetchGstCaptcha(): Promise<GstCaptchaSession> {
  const body = await parseJsonResponse(await fetch('/api/erp/gst-captcha'));
  if (!body.sessionId || !body.image) {
    throw new Error('Could not load GST captcha');
  }
  return { sessionId: body.sessionId, image: body.image, imageUrl: body.imageUrl };
}

export async function submitGstLookupWithCaptcha(
  gstin: string,
  captcha: string,
  sessionId: string,
): Promise<GstLookupResult> {
  const normalized = normalizeGstin(gstin);
  const body = await parseJsonResponse(await fetch('/api/erp/gst-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gstin: normalized, captcha, sessionId }),
  }));
  if (!body?.data) {
    throw new Error('GST details not found');
  }
  return body.data as GstLookupResult;
}

export async function fetchGstDetails(gstin: string): Promise<GstLookupResult & { requiresCaptcha?: boolean }> {
  const normalized = normalizeGstin(gstin);
  if (!isValidGstinFormat(normalized)) {
    throw new Error('Enter a valid 15-character GST number');
  }

  const body = await parseJsonResponse(await fetch(`/api/erp/gst-lookup/${encodeURIComponent(normalized)}`));
  if (body?.data) {
    return { ...(body.data as GstLookupResult), requiresCaptcha: Boolean(body.requiresCaptcha) };
  }
  return mapGstApiPayload(body, normalized, 'local');
}

export function findPartyByGst(parties: PartyMaster[], gstin: string, excludeId = '') {
  const normalized = normalizeGstin(gstin);
  return parties.find(
    p => p.id !== excludeId && normalizeGstin(p.gstNumber || '') === normalized,
  );
}

export function applyGstLookupToPartyForm<T extends {
  partyName: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  deliveryAddress: string;
  supplierAddress: string;
}>(
  form: T,
  lookup: GstLookupResult,
  stateOptions: string[],
): T {
  const nextState = matchPartyMasterState(lookup.state, stateOptions);
  const address = lookup.address.trim().toUpperCase();
  const partyName = lookup.partyName.trim().toUpperCase();
  const city = (lookup.city || parseGstAddressLine(lookup.address).city).trim().toUpperCase();

  return {
    ...form,
    gstNumber: lookup.gstNumber,
    panNumber: lookup.panNumber || form.panNumber,
    partyName: partyName || form.partyName,
    address: address || form.address,
    city: city || form.city.trim().toUpperCase(),
    state: nextState,
    pincode: lookup.pincode || form.pincode,
    deliveryAddress: address || form.deliveryAddress,
    supplierAddress: address || form.supplierAddress,
  };
}

export function lookupGstFromPartyOrApi(
  parties: PartyMaster[],
  gstin: string,
  excludeId = '',
): Promise<GstLookupResult & { requiresCaptcha?: boolean }> {
  const existing = findPartyByGst(parties, gstin, excludeId);
  if (existing) {
    return Promise.resolve(partyToGstLookup(existing));
  }
  return fetchGstDetails(gstin).catch((error) => {
    console.error('GST API lookup failed:', error);
    return { ...localGstLookup(gstin), requiresCaptcha: false };
  });
}
