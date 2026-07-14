import React from 'react';
import type { ErpHotkeyAction } from '../utils/erpHotkeys';
import { ERP_HOTKEY_LABELS } from '../utils/erpHotkeys';

export const ErpHotkeyLabel: React.FC<{ action: ErpHotkeyAction }> = ({ action }) => (
  <span className="erp-hotkey-label">({ERP_HOTKEY_LABELS[action]})</span>
);
