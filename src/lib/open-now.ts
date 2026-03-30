const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
type DayName = (typeof DAY_ORDER)[number];

interface Range {
  open: number;
  close: number;
}

type ParsedHours = Record<DayName, Range[]>;

function blankHours(): ParsedHours {
  return {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };
}

function toMinutes(token: string): number | null {
  const clean = token.replace(/[\u202f\u2009]/g, " ").trim().toUpperCase();
  const match = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!match) return null;

  let hour = Number(match[1]);
  const min = Number(match[2] || "0");
  const meridiem = match[3];

  if (meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (meridiem === "PM") {
    if (hour < 12) hour += 12;
  }

  return hour * 60 + min;
}

function splitRanges(raw: string): string[] {
  return raw
    .split(/,|\//)
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseLine(day: DayName, value: string, parsed: ParsedHours) {
  const normalized = value.replace(/[\u202f\u2009]/g, " ").trim();
  if (!normalized || /closed/i.test(normalized)) return;

  if (/open\s*24\s*hours?/i.test(normalized) || /^24\s*hours$/i.test(normalized)) {
    parsed[day].push({ open: 0, close: 24 * 60 });
    return;
  }

  for (const rangeText of splitRanges(normalized)) {
    const parts = rangeText.split(/\s*[–-]\s*/);
    if (parts.length !== 2) continue;
    const open = toMinutes(parts[0]);
    const close = toMinutes(parts[1]);
    if (open == null || close == null) continue;

    if (close <= open) {
      parsed[day].push({ open, close: 24 * 60 });
      const nextIndex = (DAY_ORDER.indexOf(day) + 1) % 7;
      parsed[DAY_ORDER[nextIndex]].push({ open: 0, close });
    } else {
      parsed[day].push({ open, close });
    }
  }
}

function extractDayAndValue(entry: unknown): { day: DayName; value: string } | null {
  if (typeof entry === "string") {
    const normalized = entry.replace(/[\u202f\u2009]/g, " ");
    const m = normalized.match(/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s*:\s*(.+)$/i);
    if (!m) return null;
    const day = `${m[1].slice(0, 1).toUpperCase()}${m[1].slice(1).toLowerCase()}` as DayName;
    return { day, value: m[2].trim() };
  }

  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const dayRaw = String(obj.day ?? obj.name ?? "");
    const valueRaw = String(obj.hours ?? obj.value ?? obj.text ?? "");
    if (!dayRaw || !valueRaw) return null;
    const day = `${dayRaw.slice(0, 1).toUpperCase()}${dayRaw.slice(1).toLowerCase()}` as DayName;
    if (!DAY_ORDER.includes(day)) return null;
    return { day, value: valueRaw };
  }

  return null;
}

function parseHours(hours: unknown): ParsedHours {
  const parsed = blankHours();
  if (!Array.isArray(hours)) return parsed;

  for (const entry of hours) {
    const pair = extractDayAndValue(entry);
    if (!pair) continue;
    parseLine(pair.day, pair.value, parsed);
  }

  return parsed;
}

function fmt(minutes: number): string {
  let hour = Math.floor(minutes / 60) % 24;
  const min = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function isOpenNow(hours: unknown): boolean {
  const parsed = parseHours(hours);
  const now = new Date();
  const day = DAY_ORDER[now.getDay()];
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return parsed[day].some((r) => nowMin >= r.open && nowMin < r.close);
}

export function getNextOpenTime(hours: unknown): string | null {
  const parsed = parseHours(hours);
  const now = new Date();
  const currentDayIdx = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < 7; i += 1) {
    const dayIdx = (currentDayIdx + i) % 7;
    const day = DAY_ORDER[dayIdx];
    const ranges = [...parsed[day]].sort((a, b) => a.open - b.open);
    if (!ranges.length) continue;

    for (const range of ranges) {
      if (i === 0 && nowMin < range.open) {
        return `Today at ${fmt(range.open)}`;
      }
      if (i > 0) {
        const label = i === 1 ? "Tomorrow" : day;
        return `${label} at ${fmt(range.open)}`;
      }
    }
  }

  return null;
}
