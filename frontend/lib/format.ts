const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n: unknown) => (typeof n === "number" && !Number.isNaN(n) ? inr.format(n) : "—");

/** Accepts "YYYY-MM-DD" or a full ISO timestamp; always renders the calendar day as entered (UTC). */
export function formatDay(value?: string) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateRange(dateType: string, start?: string, end?: string) {
  if (dateType === "range" && end) return `${formatDay(start)} → ${formatDay(end)}`;
  return formatDay(start);
}

export function formatDuration(minutes: unknown) {
  if (typeof minutes !== "number" || Number.isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h} hr`, m && `${m} min`].filter(Boolean).join(" ");
}
