export type Accent = 'blue' | 'orange' | 'dark';

const ORANGE_ROUTES = ['/party-master', '/quotation', '/ring-rate', '/cnc-quotation', '/cnc-rate-calculator'];
const DARK_ROUTES: string[] = [];

export function getAccent(pathname: string): Accent {
  if (ORANGE_ROUTES.includes(pathname)) return 'orange';
  if (DARK_ROUTES.includes(pathname)) return 'dark';
  return 'blue';
}

/** Tailwind text/bg color for the active accent (used for sidebar active item, etc.) */
export function accentBg(accent: Accent): string {
  if (accent === 'orange') return 'bg-brand-orange';
  if (accent === 'dark') return 'bg-brand-navy';
  return 'bg-brand-blue';
}

export function accentText(accent: Accent): string {
  if (accent === 'orange') return 'text-brand-orange';
  return 'text-brand-blue';
}

/** Section-header modifier class for a given accent */
export function sectionAccentClass(accent: Accent): string {
  return accent === 'orange' ? 'accent-orange' : '';
}
