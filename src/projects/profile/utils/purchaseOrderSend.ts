import type { PurchaseOrder } from '../store/AppContext';

/** Open Gmail compose with PO email body (fallback when API mail is unavailable). */
export function openEmailPO(po: PurchaseOrder) {
  let to = po.supplierEmail?.trim() || '';
  if (!to) {
    const entered = window.prompt('Enter supplier email address:', '');
    if (!entered?.trim()) return;
    to = entered.trim();
  }

  const body = [
    `Dear ${po.supplierName},`,
    '',
    `Please find the attached Purchase Order ${po.poNumber} from Jagdamba Profile.`,
    'Kindly acknowledge receipt and confirm the delivery schedule.',
    '',
    'Thanks & Regards,',
    'Jagdamba Profile',
    '504/1/A, GIDC Makarpura, Vadodara - 390010',
    'Mo: 8799617251 / 8799617252',
  ].join('\n');

  const subject = encodeURIComponent(`Purchase Order ${po.poNumber} - Jagdamba Profile`);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${subject}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
}
