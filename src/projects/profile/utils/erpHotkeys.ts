export type ErpHotkeyAction = 'save' | 'print' | 'pdf' | 'whatsapp' | 'new' | 'cancel';

export const ERP_HOTKEY_MAP: Record<string, ErpHotkeyAction> = {
  F2: 'save',
  F3: 'print',
  F4: 'pdf',
  F5: 'whatsapp',
  F6: 'new',
  Escape: 'cancel',
};

export const ERP_HOTKEY_LABELS: Record<ErpHotkeyAction, string> = {
  save: 'F2',
  print: 'F3',
  pdf: 'F4',
  whatsapp: 'F5',
  new: 'F6',
  cancel: 'ESC',
};

export function erpHotkeyProps(action: ErpHotkeyAction) {
  return { 'data-erp-hotkey': action } as const;
}

function isActionable(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (Number(style.opacity) === 0) return false;
  return el.getClientRects().length > 0;
}

export function triggerErpHotkey(action: ErpHotkeyAction): boolean {
  const root = document.querySelector('main') ?? document.body;
  const candidates = root.querySelectorAll<HTMLElement>(`[data-erp-hotkey="${action}"]`);

  for (const el of candidates) {
    if (!isActionable(el)) continue;
    el.click();
    return true;
  }
  return false;
}

export function handleErpHotkeyEvent(event: KeyboardEvent, onCancelFallback?: () => void): boolean {
  if (event.isComposing || event.repeat) return false;

  const action = ERP_HOTKEY_MAP[event.key];
  if (!action) return false;

  if (document.querySelector('[data-autocomplete-open="true"]')) return false;

  const hasOpenModal = Boolean(document.querySelector('.modal-open, [role="dialog"]'));
  if (hasOpenModal && action !== 'cancel') return false;

  if (action === 'cancel') {
    if (hasOpenModal) return false;
    if (onCancelFallback) {
      event.preventDefault();
      event.stopImmediatePropagation();
      onCancelFallback();
      return true;
    }
  }

  const triggered = triggerErpHotkey(action);
  if (!triggered) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  return true;
}
