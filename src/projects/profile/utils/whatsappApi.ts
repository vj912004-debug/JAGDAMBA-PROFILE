export function getWhatsAppApiUrl(path: string): string {
  const base =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : '';
  return `${base}${path}`;
}
