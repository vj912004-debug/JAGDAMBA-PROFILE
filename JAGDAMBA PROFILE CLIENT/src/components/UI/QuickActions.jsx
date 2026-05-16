import React from 'react';
import { Phone, MessageCircle, Mail, MapPin, Share2 } from 'lucide-react';

export default function QuickActions({ contact }) {
  const { mobile, whatsapp, email, address, city, contactPerson } = contact;

  const share = async () => {
    const text = `${contactPerson}\n${contact.companyName || ''}\nMob: ${mobile}\nCity: ${city}`;
    if (navigator.share) {
      await navigator.share({ title: contactPerson, text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Contact info copied to clipboard!');
    }
  };

  return (
    <div className="quick-actions">
      {mobile && (
        <a className="qa-btn call" href={`tel:${mobile}`} title="Call">
          <Phone size={14} />
        </a>
      )}
      {(whatsapp || mobile) && (
        <a className="qa-btn whatsapp" href={`https://wa.me/91${whatsapp || mobile}`} target="_blank" rel="noreferrer" title="WhatsApp">
          <MessageCircle size={14} />
        </a>
      )}
      {email && (
        <a className="qa-btn email" href={`mailto:${email}`} title="Email">
          <Mail size={14} />
        </a>
      )}
      {(address || city) && (
        <a className="qa-btn map" href={`https://maps.google.com?q=${encodeURIComponent(`${address} ${city}`)}`} target="_blank" rel="noreferrer" title="Map">
          <MapPin size={14} />
        </a>
      )}
      <button className="qa-btn share" onClick={share} title="Share">
        <Share2 size={14} />
      </button>
    </div>
  );
}
