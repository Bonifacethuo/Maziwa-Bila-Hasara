export const STORAGE_KEY = 'maziwa-bila-hasara:v1';

export function emptyState() {
  return { version: 1, animals: [], treatments: [], checks: [], deliveries: [] };
}

export const MAX_BACKUP_BYTES = 2_000_000;
const tables = ['animals', 'treatments', 'checks', 'deliveries'];
const text = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);

// Fail closed on malformed records; never silently replace a damaged farm register.
export function validateState(value) {
  const fail = () => { throw new Error('Invalid or oversized farm records.'); };
  if (!value || value.version !== 1 || !tables.every(key => Array.isArray(value[key]) && value[key].length <= 5000)) fail();
  const ids = new Set();
  for (const key of tables) for (const row of value[key]) {
    if (!row || !text(row.id, 100, true) || ids.has(row.id) || !text(row.createdAt, 40, true) || !/^\d{4}-\d{2}-\d{2}T/.test(row.createdAt) || !Number.isFinite(Date.parse(row.createdAt))) fail();
    ids.add(row.id);
  }
  const animals = new Set(value.animals.map(row => row.id));
  if (!value.animals.every(row => text(row.name,60,true) && text(row.note,120))) fail();
  if (!value.treatments.every(row => animals.has(row.animalId) && text(row.name,100,true) && text(row.vet,100,true) && validDate(row.date) && (row.holdUntil === '' || (validDate(row.holdUntil) && row.holdUntil >= row.date)) && text(row.instructions,500))) fail();
  if (!value.checks.every(row => validDate(row.date) && ['container','water','promptly'].every(key => ['yes','no','unsure'].includes(row[key])) && typeof row.flagged === 'boolean' && (row.flagged || ['container','water','promptly'].every(key => row[key] === 'yes')))) fail();
  if (!value.deliveries.every(row => validDate(row.date) && typeof row.litres === 'number' && Number.isFinite(row.litres) && row.litres > 0 && row.litres <= 100000 && ['accepted','rejected'].includes(row.status) && text(row.reason,180,row.status === 'rejected') && text(row.collector,100))) fail();
  // Copy only known fields; discard imported metadata and prototype-like properties.
  const fields = {animals:['id','createdAt','name','note'],treatments:['id','createdAt','animalId','name','vet','date','holdUntil','instructions'],checks:['id','createdAt','date','container','water','promptly','flagged'],deliveries:['id','createdAt','date','litres','status','reason','collector']};
  return Object.fromEntries([['version',1], ...tables.map(key => [key,value[key].map(row => Object.fromEntries(fields[key].map(field => [field,row[field]])))])]);
}

export function parseBackup(raw) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('Backup exceeds the 2 MB limit.');
  return validateState(JSON.parse(raw));
}

export function readState(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? emptyState() : parseBackup(raw);
}

export function loadState(storage) {
  try { return readState(storage); } catch { return emptyState(); }
}

export function saveState(storage, state) {
  const safe = validateState(state);
  const raw = JSON.stringify(safe);
  parseBackup(raw);
  storage.setItem(STORAGE_KEY, raw);
  return safe;
}

export function commitState(storage, current, change) {
  const next = structuredClone(current);
  change(next);
  return saveState(storage, next);
}

export function todayLocal(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
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
