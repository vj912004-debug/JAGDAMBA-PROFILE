const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(el: HTMLElement): boolean {
  if (el.closest('[inert], [aria-hidden="true"]')) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  return el.getClientRects().length > 0;
}

function getFocusRoot(el: HTMLElement): HTMLElement {
  return (
    el.closest('[role="dialog"]') ??
    el.closest('main') ??
    document.body
  ) as HTMLElement;
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    el => isVisible(el) && !el.closest('[data-skip-enter-tab]') && el.getAttribute('data-skip-enter-tab') !== 'true',
  );
}

export function focusNextField(current: HTMLElement, reverse = false): boolean {
  const focusables = getFocusableElements(getFocusRoot(current));
  const idx = focusables.indexOf(current);
  if (idx === -1) return false;

  const nextIdx = reverse ? idx - 1 : idx + 1;
  if (nextIdx < 0 || nextIdx >= focusables.length) return false;

  const next = focusables[nextIdx];
  next.focus();

  if (next instanceof HTMLInputElement && ['text', 'search', 'tel', 'url', 'email', ''].includes(next.type)) {
    if (next.dataset.numeric !== 'true') {
      next.select();
    }
  }

  return true;
}

/** Press Enter in a field to move focus like Tab (ERP data-entry shortcut). */
export function handleEnterAsTab(event: KeyboardEvent): void {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.defaultPrevented) return;
  if (event.isComposing) return;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target instanceof HTMLTextAreaElement) return;
  if (target.isContentEditable) return;
  if (target instanceof HTMLButtonElement) return;

  if (target instanceof HTMLInputElement) {
    const type = target.type.toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'checkbox' || type === 'radio' || type === 'file') return;
    if (target.getAttribute('role') === 'combobox' && target.getAttribute('aria-expanded') === 'true') return;
  }

  if (target.closest('[data-autocomplete-open="true"]')) return;

  if (focusNextField(target)) {
    event.preventDefault();
  }
}
