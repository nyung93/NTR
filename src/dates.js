// Accept the original dotted dates as well as the date input's ISO format.
export function toDateInputValue(value) {
  if (typeof value !== 'string') return '';
  const match = value.trim().match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:\s*\([^)]*\))?$/);
  if (!match) return '';
  const iso = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : '';
}

export function formatTravelDate(value) {
  const iso = toDateInputValue(value);
  if (!iso) return value || '미정';
  const day = '일월화수목금토'[new Date(`${iso}T00:00:00Z`).getUTCDay()];
  return `${iso.replaceAll('-', '.')}(${day})`;
}
