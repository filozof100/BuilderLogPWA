// Add the currency only to displayed amounts; keep form values and API data unchanged.
export function withRsd(value) {
  const text = String(value ?? '').trim();
  if (!text || text === '-') return '-';
  return /RSD$/i.test(text) ? text : text + ' RSD';
}
