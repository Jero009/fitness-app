const toTimestamp = (value: unknown): number => {
  if (value === null || value === undefined) return NaN;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  const raw = String(value).trim();
  if (!raw) return NaN;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return numeric;
  }

  const normalized = raw.includes(' ') ? raw.replace(' ', 'T') : raw;
  const hasTimezone = /(?:Z|[-+]\d{2}:?\d{2})$/i.test(normalized);
  const candidate = hasTimezone ? normalized : `${normalized}Z`;

  return new Date(candidate).getTime();
};

export const formatDuration = (start: string, end: any) => {
  if (!start || !end) return '0h 0m 0s';

  const s = toTimestamp(start);
  const e = toTimestamp(end);

  if (isNaN(s) || isNaN(e)) return 'Invalid time';

  const diff = Math.max(0, e - s);
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};

export const formatTime = (secondsValue: number) => {
  const hrs = Math.floor(secondsValue / 3600);
  const mins = Math.floor((secondsValue % 3600) / 60);
  const secs = secondsValue % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};