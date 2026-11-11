export function minutesToHHMM(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

/**
 * Like minutesToHHMM but renders 1440 as "24:00" instead of wrapping to "00:00".
 * Use only for the End time display.
 */
export function minutesToHHMMEnd(min: number): string {
  if (min === 1440) return "24:00";
  return minutesToHHMM(min);
}

export function hhmmToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const mm = parseInt(match[2], 10);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

/**
 * Like hhmmToMinutes but also accepts exactly "24:00" (1440).
 * Use only for the End time field — Start and Current time
 * must stay within 00:00–23:59.
 */
export function hhmmToMinutesEnd(hhmm: string): number | null {
  const trimmed = hhmm.trim();
  if (trimmed === "24:00") return 1440;
  return hhmmToMinutes(trimmed);
}

export function formatRange(start: number, end: number): string {
  return `${minutesToHHMM(start)} – ${minutesToHHMMEnd(end)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function nowInMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
