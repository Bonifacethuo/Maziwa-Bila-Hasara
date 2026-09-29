export const STORAGE_KEY = 'maziwa-bila-hasara:v1';

export function emptyState() {
  return { version: 1, animals: [], treatments: [], checks: [], deliveries: [] };
}

export function loadState(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    if (value?.version === 1 && ['animals', 'treatments', 'checks', 'deliveries'].every(key => Array.isArray(value[key]))) return value;
  } catch { /* corrupted or unavailable storage: start with an empty record */ }
  return emptyState();
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function todayLocal(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function treatmentStatus(treatment, date = todayLocal()) {
  if (!validDate(treatment.holdUntil)) return 'ask';
  // The date is inclusive; even after it passes, a reminder cannot certify milk safety.
  return date <= treatment.holdUntil ? 'hold' : 'review';
}

export function animalStatus(animalId, treatments, date = todayLocal()) {
  const records = treatments.filter(item => item.animalId === animalId);
  if (records.some(item => treatmentStatus(item, date) === 'hold')) return 'hold';
  if (records.some(item => treatmentStatus(item, date) === 'ask')) return 'ask';
  return records.length ? 'review' : 'none';
}

export function formatDate(value, locale = 'en-KE') {
  if (!validDate(value)) return '—';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function totalLitres(items, status) {
  return items.filter(item => item.status === status).reduce((sum, item) => sum + Number(item.litres || 0), 0);
}

export function csvCell(value) {
  const str = String(value ?? '');
  // Prevent spreadsheet formula execution when farmers open exports in Excel.
  const safe = /^[\s]*[=+@-]/.test(str) ? `'${str}` : str;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toCsv(rows, columns) {
  return [columns.map(([label]) => csvCell(label)).join(','), ...rows.map(row => columns.map(([, key]) => csvCell(row[key])).join(','))].join('\r\n');
}
