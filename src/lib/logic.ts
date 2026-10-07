import type { Credit, CreditKind, Note, Pot, SpendCat, State } from './types';
import { COMPANIES, PERSONAS, STOCKS, stockPrice } from './data';
import { rupees, uid } from './format';

/* ---------- Derived values ---------- */

export const potsTotal = (s: State) => s.pots.reduce((a, p) => a + p.balance, 0);

export function runway(s: State) {
  const p = PERSONAS[s.persona];
  const months = s.monthlySpend > 0 ? potsTotal(s) / s.monthlySpend : 0;
  if (p.runwayUnit === 'days') {
    const days = Math.round(months * 30);
    return { value: days, display: String(days), unit: days === 1 ? 'day' : 'days', goal: p.runwayGoal, fill: Math.min(1, days / p.runwayGoal), months };
  }
  const v = Math.round(months * 10) / 10;
  return { value: v, display: v.toFixed(1), unit: 'months', goal: p.runwayGoal, fill: Math.min(1, months / p.runwayGoal), months };
}

export function monthsSince(iso: string, now = new Date()): number {
  const d = new Date(iso);
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()) - (now.getDate() < d.getDate() ? 1 : 0);
}

export function licence(s: State) {
  const crash = s.crash.held === true;
  const months = monthsSince(s.joinedAt);
  const six = months >= 6;
  const rw = runway(s).months >= 2;
  const level = s.fun.foUnlocked && crash && six && rw ? 3 : crash && six && rw ? 2 : crash ? 1 : 0;
  return { level, crash, six, months, rw };
}

export const LEVEL_NAME = ['No licence yet', 'Level 1 · L-plate', 'Level 2 · Fun Pot', 'Level 3 · F&O'];

export function funValue(s: State, at = new Date()) {
  const held = s.fun.holdings.reduce((a, h) => {
    const st = STOCKS.find((x) => x.id === h.stockId);
    return a + (st ? h.units * stockPrice(st, at) : 0);
  }, 0);
  const balance = s.fun.cash + held;
  const ceiling = Math.round((potsTotal(s) + balance) * 0.1);
  return { held, balance, ceiling, room: Math.max(0, ceiling - balance) };
}

export function twin(s: State) {
  const invested = s.pots.filter((p) => p.bucket !== 'soon').reduce((a, p) => a + p.balance, 0);
  const gap = -s.twin.moves.reduce((a, m) => a + m.impact, 0);
  return { you: invested, twin: invested + gap, gap };
}

export function tipOutcome(t: { companyId: string; checkedAt: string }, now = new Date()) {
  const c = COMPANIES.find((x) => x.id === t.companyId);
  const due = new Date(new Date(t.checkedAt).getTime() + 90 * 86400000);
  const resolved = due.getTime() <= now.getTime();
  return { company: c, due: due.toISOString(), resolved, after90: c?.after90 ?? 0, halted: c ? c.after90 === null : false, nifty90: c?.nifty90 ?? 0 };
}

export function circleGoal(s: State) {
  const total = s.circle.members.reduce((a, m) => a + m.share, 0);
  return { total, pct: Math.min(100, Math.round((total / s.circle.goal.target) * 100)) };
}

export function landings(s: State): boolean[] {
  return s.lands.history.slice(-8);
}

/* ---------- Mutations (operate on a cloned draft) ---------- */

export function note(d: State, title: string, body: string, href?: string) {
  const n: Note = { id: uid(), at: new Date().toISOString(), title, body, href, read: false };
  d.notes.unshift(n);
  d.notes = d.notes.slice(0, 60);
}

export function potById(d: State, id: string): Pot | undefined {
  return d.pots.find((p) => p.id === id);
}

export function addToPot(d: State, id: string, amount: number) {
  const p = potById(d, id);
  if (p && amount > 0) p.balance += amount;
}

function nextCutoff(now = new Date()): string {
  const c = new Date(now);
  c.setHours(18, 0, 0, 0);
  if (c.getTime() <= now.getTime()) c.setDate(c.getDate() + 1);
  return c.toISOString();
}

export function landCredit(d: State, source: string, amount: number, kind: CreditKind): Credit {
  const c: Credit = {
    id: uid(), source, amount, kind, at: new Date().toISOString(), share: d.lands.share,
    status: kind === 'income' && d.lands.enabled ? 'pending' : 'ignored',
    cutoff: kind === 'income' && d.lands.enabled ? nextCutoff() : undefined,
  };
  d.credits.unshift(c);
  if (c.status === 'pending') {
    note(d, `${rupees(amount)} landed`, `${rupees(Math.round((amount * c.share) / 100))} goes in at 6 pm unless you skip it.`, '/lands');
  }
  return c;
}

export function investCredit(d: State, id: string) {
  const c = d.credits.find((x) => x.id === id);
  if (!c || (c.status !== 'pending' && c.status !== 'skipped')) return;
  const wasSkipped = c.status === 'skipped';
  c.status = 'invested';
  addToPot(d, d.lands.potId, Math.round((c.amount * c.share) / 100));
  if (wasSkipped && d.lands.history.length) d.lands.history[d.lands.history.length - 1] = true;
  else d.lands.history.push(true);
}

export function skipCredit(d: State, id: string) {
  const c = d.credits.find((x) => x.id === id);
  if (!c || c.status !== 'pending') return;
  c.status = 'skipped';
  d.lands.history.push(false);
}

/** Pending credits past their cutoff invest themselves. Returns true if anything changed. */
export function settle(d: State, now = new Date()): boolean {
  let changed = false;
  for (const c of d.credits) {
    if (c.status === 'pending' && c.cutoff && new Date(c.cutoff).getTime() <= now.getTime()) {
      investCredit(d, c.id);
      note(d, `${rupees(Math.round((c.amount * c.share) / 100))} went in`, `${c.share}% of ${c.source}, into your Never touch pot.`, '/lands');
      changed = true;
    }
  }
  return changed;
}

export function needsSettle(s: State, now = new Date()): boolean {
  return s.credits.some((c) => c.status === 'pending' && c.cutoff && new Date(c.cutoff).getTime() <= now.getTime());
}

/* ---------- Chillar Jar ---------- */

export function roundup(amount: number, step: number, multiplier: number): number {
  const r = Math.ceil(amount / step) * step - amount;
  return r * multiplier;
}

export function addSpend(d: State, what: string, amount: number, cat: SpendCat) {
  const r = d.jar.on ? roundup(amount, d.jar.step, d.jar.multiplier) : 0;
  d.spends.unshift({ id: uid(), at: new Date().toISOString(), what, amount, cat, roundup: r });
  d.spends = d.spends.slice(0, 200);
  d.jar.balance += r;
  return r;
}

export function sweepJar(d: State): number {
  const amt = Math.floor(d.jar.balance);
  if (amt <= 0) return 0;
  const never = d.pots.find((p) => p.bucket === 'never') ?? d.pots[0];
  if (!never) return 0;
  never.balance += amt;
  d.jar.balance -= amt;
  d.jar.swept += amt;
  note(d, `${rupees(amt)} of chillar swept`, `Spare change, now in ${never.name}.`, '/jar');
  return amt;
}

/** Runway days a price would cost, and hours of work it took. */
export function worth(s: State, price: number) {
  const perDay = s.monthlySpend / 30;
  const perHour = s.monthlyIncome / 176;
  return {
    days: perDay > 0 ? price / perDay : 0,
    hours: perHour > 0 ? price / perHour : 0,
    tenYears: price * Math.pow(1.1, 10),
  };
}
