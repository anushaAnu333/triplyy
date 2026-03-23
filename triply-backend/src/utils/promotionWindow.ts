/**
 * Returns true if `now` falls on a calendar day within [start, end] (inclusive), using local date boundaries.
 */
export function isDateWithinPromotionWindow(start: Date, end: Date, now: Date = new Date()): boolean {
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return n >= s && n <= e;
}
