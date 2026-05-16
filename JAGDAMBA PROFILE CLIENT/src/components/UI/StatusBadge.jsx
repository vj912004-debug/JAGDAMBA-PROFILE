import React from 'react';

const STATUS_MAP = {
  VIP: 'badge-vip',
  IMP: 'badge-imp',
  Favourite: 'badge-favourite',
  Regular: 'badge-regular',
  Backup: 'badge-backup',
  Avoid: 'badge-avoid',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge ${STATUS_MAP[status] || 'badge-regular'}`}>{status}</span>;
}
