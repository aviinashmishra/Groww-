const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Indian grouping, always: ₹1,25,000, never ₹125,000. */
export function rupees(n: number): string {
  const r = Math.round(Math.abs(n));
  return `${n < 0 ? '− ' : ''}₹${inr.format(r)}`;
}

export function signedRupees(n: number): string {
  return `${n < 0 ? '−' : '+'} ₹${inr.format(Math.round(Math.abs(n)))}`;
}

export const HIDDEN = '₹••,•••';

/** Up and down are written as words, never coloured. */
export function changeWords(pct: number): string {
  const v = Math.abs(pct);
  const s = v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v).toString();
  if (Math.abs(pct) < 0.05) return 'Flat';
  return `${pct < 0 ? 'Down' : 'Up'} ${s}%`;
}

export function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).replace(':00', '');
}

export function relDay(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((a - b) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return fmtDay(iso);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function daysFromNow(days: number, from = new Date()): string {
  return new Date(from.getTime() + days * 86400000).toISOString();
}

export function monthsAgo(months: number, from = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Parse a typed rupee amount like "1,200" or "₹ 850". */
export function parseAmount(s: string): number {
  const n = Number(s.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/** Local calendar day as YYYY-MM-DD (not UTC). */
export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
