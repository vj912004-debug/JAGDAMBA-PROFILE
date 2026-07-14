export function getWhatsAppApiUrl(path: string): string {
  const base =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : '';
  return `${base}${path}`;
}

async function parseWhatsAppResponse(response: Response): Promise<Record<string, unknown>> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error(
        'WhatsApp service is unreachable. Ensure the WhatsApp server is running and nginx is configured to proxy /api/whatsapp/ to port 5001.',
      );
    }
    throw new Error(text.slice(0, 200) || `WhatsApp request failed (${response.status})`);
  }

  return response.json();
}

export async function fetchWhatsAppApi(
  path: string,
  options?: RequestInit,
): Promise<Record<string, unknown>> {
  const response = await fetch(getWhatsAppApiUrl(path), options);
  const result = await parseWhatsAppResponse(response);

  if (!response.ok && result.success !== true) {
    throw new Error(String(result.message ?? `WhatsApp request failed (${response.status})`));
  }

  return result;
}

export async function sendWhatsAppMedia(payload: {
  number: string;
  mediaData: string;
  fileName: string;
  caption?: string;
}): Promise<void> {
  const result = await fetchWhatsAppApi('/api/whatsapp/send-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!result.success) {
    throw new Error(String(result.message ?? 'Failed to send WhatsApp message'));
  }
}

function formatPartyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildWhatsAppPOMessage(supplierName: string, poNumber: string): string {
  const name = formatPartyName(supplierName);
  return `Dear ${name},

Please find attached our Purchase Order No. ${poNumber} for your reference.

Kindly acknowledge receipt and confirm acceptance.

Thanks & regards,
Jagdamba Profile
Makarpura, Vadodara`;
}

export function buildWhatsAppCNCRateMessage(partyName: string, inquiryNo: string): string {
  const name = formatPartyName(partyName);
  return `Dear ${name},

Please find attached our CNC Rate Calculation for Inquiry No. ${inquiryNo}.

Thanks & regards,
Jagdamba Profile
Makarpura, Vadodara`;
}
