/* Investing: wallet, stock orders, mutual funds, SIPs and IPO applications.
   Everything runs on the demo market in ./market and is saved with the rest of State. */

import type { PersonaId, State } from './types';
import {
  FUNDS, allotted, findFund, findStock, ipoById, istDayStart, isTradingDay, nav, navOn, nextTradingDay, prevTradingDay,
  price, priceAt, quote, session, sessionCloseAt, sessionOpenAt, px,
} from './market';
import { note } from './logic';
import { rupees, uid } from './format';

/* ---------- Types ---------- */

export interface Kyc {
  status: 'none' | 'verified';
  name?: string;
  /** Masked: only the last five characters are kept. */
  pan?: string;
  bank?: { name: string; last4: string; ifsc: string };
  at?: string;
}

export type TxnKind = 'add' | 'withdraw' | 'buy' | 'sell' | 'block' | 'release' | 'mf' | 'redeem';

export interface Txn {
  id: string;
  at: string;
  label: string;
  /** + into the balance, − out of it. */
  amount: number;
  kind: TxnKind;
}

export interface Position {
  stockId: string;
  qty: number;
  avg: number;
  at: string;
}

export type OrderStatus = 'pending' | 'executed' | 'cancelled' | 'rejected';

export interface StockOrder {
  id: string;
  stockId: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty: number;
  limit?: number;
  status: OrderStatus;
  placedAt: string;
  /** After-market order: placed while the market was closed. */
  amo: boolean;
  /** Can execute from this moment (ms). */
  from: number;
  /** Lapses at this moment (ms): the close of its session. */
  till: number;
  /** Money held back from the balance for a pending buy. */
  blocked: number;
  price?: number;
  charges?: number;
  doneAt?: string;
  reason?: string;
}

export interface FundPosition {
  fundId: string;
  units: number;
  invested: number;
  at: string;
}

export interface MfOrder {
  id: string;
  fundId: string;
  side: 'buy' | 'sell';
  amount: number;
  units?: number;
  nav?: number;
  status: 'processing' | 'done' | 'failed';
  placedAt: string;
  /** Units are allotted (or money paid out) at this moment (ms). */
  settleAt: number;
  sipId?: string;
  via: 'balance' | 'upi' | 'autopay';
}

export interface Sip {
  id: string;
  fundId: string;
  amount: number;
  /** Day of the month, 1–28. */
  day: number;
  status: 'active' | 'paused';
  startedAt: string;
  /** Next instalment (ms). */
  nextAt: number;
  count: number;
}

export interface IpoApp {
  id: string;
  ipoId: string;
  lots: number;
  price: number;
  upi: string;
  at: string;
  status: 'applied' | 'allotted' | 'not-allotted' | 'listed' | 'cancelled';
}

export interface InvestState {
  kyc: Kyc;
  balance: number;
  txns: Txn[];
  positions: Position[];
  orders: StockOrder[];
  funds: FundPosition[];
  mfOrders: MfOrder[];
  sips: Sip[];
  watch: string[];
  ipos: IpoApp[];
  /** Saw the "before your first stock" card. */
  ackStocks?: boolean;
}

/* ---------- Charges: a typical discount broker's delivery charges ---------- */

export interface Charges { brokerage: number; stt: number; exchange: number; sebi: number; stamp: number; gst: number; total: number }

export function charges(side: 'buy' | 'sell', value: number): Charges {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const brokerage = r2(Math.min(20, Math.max(5, value * 0.001)));
  const stt = Math.round(value * 0.001);
  const exchange = r2(value * 0.0000297);
  const sebi = r2(value * 0.000001);
  const stamp = side === 'buy' ? r2(value * 0.00015) : 0;
  const gst = r2(0.18 * (brokerage + exchange + sebi));
  return { brokerage, stt, exchange, sebi, stamp, gst, total: r2(brokerage + stt + exchange + sebi + stamp + gst) };
}

/** Market buys hold back 3% extra in case the price moves before it fills. */
const MARKET_BUFFER = 1.03;
/** Mutual fund units are allotted this long after the order (demo; real AMCs take a working day). */
export const MF_SETTLE_MS = 45_000;

/* ---------- Derived ---------- */

export function sellableQty(inv: InvestState, stockId: string): number {
  const held = inv.positions.find((p) => p.stockId === stockId)?.qty ?? 0;
  const pending = inv.orders.filter((o) => o.stockId === stockId && o.side === 'sell' && o.status === 'pending').reduce((a, o) => a + o.qty, 0);
  return Math.max(0, held - pending);
}

export function redeemableUnits(inv: InvestState, fundId: string, now = Date.now()): { units: number; lockedTill?: number } {
  const pos = inv.funds.find((f) => f.fundId === fundId);
  if (!pos) return { units: 0 };
  const f = findFund(fundId);
  if (!f?.lockInYears) return { units: pos.units };
  // ELSS: each instalment is locked for 3 years from its own date.
  const lock = f.lockInYears * 365 * 86400000;
  const buys = inv.mfOrders.filter((o) => o.fundId === fundId && o.side === 'buy' && o.status === 'done' && o.units);
  const free = buys.filter((o) => new Date(o.placedAt).getTime() + lock <= now).reduce((a, o) => a + (o.units ?? 0), 0);
  const sold = inv.mfOrders.filter((o) => o.fundId === fundId && o.side === 'sell' && o.status !== 'failed').reduce((a, o) => a + (o.units ?? 0), 0);
  const earliest = buys.map((o) => new Date(o.placedAt).getTime() + lock).filter((t) => t > now).sort((a, b) => a - b)[0];
  return { units: Math.max(0, Math.min(pos.units, free - sold)), lockedTill: earliest };
}

export interface Book {
  invested: number;
  current: number;
  day: number;
  ret: number;
  retPct: number;
}

const book = (invested: number, current: number, day: number): Book => ({
  invested, current, day, ret: current - invested, retPct: invested > 0 ? ((current - invested) / invested) * 100 : 0,
});

export function stockBook(inv: InvestState, now = Date.now()): Book {
  let invested = 0;
  let current = 0;
  let day = 0;
  for (const p of inv.positions) {
    const s = findStock(p.stockId);
    if (!s) continue;
    const q = quote(s, now);
    invested += p.qty * p.avg;
    current += p.qty * q.price;
    const boughtToday = new Date(p.at).getTime() > sessionCloseAt(prevTradingDay(session(now).day));
    day += p.qty * (q.price - (boughtToday ? p.avg : q.prev));
  }
  return book(invested, current, day);
}

export function fundBook(inv: InvestState, now = Date.now()): Book {
  let invested = 0;
  let current = 0;
  let day = 0;
  for (const p of inv.funds) {
    const f = findFund(p.fundId);
    if (!f) continue;
    const n = nav(f, now);
    invested += p.invested;
    current += p.units * n.nav;
    day += p.units * (n.nav - n.prev);
  }
  return book(invested, current, day);
}

export function portfolio(inv: InvestState, now = Date.now()) {
  const st = stockBook(inv, now);
  const mf = fundBook(inv, now);
  return { stocks: st, funds: mf, total: book(st.invested + mf.invested, st.current + mf.current, st.day + mf.day) };
}

/* ---------- Wallet ---------- */

function txn(d: State, kind: TxnKind, amount: number, label: string, at = new Date().toISOString()) {
  d.invest.txns.unshift({ id: uid(), at, kind, amount: Math.round(amount * 100) / 100, label });
  d.invest.txns = d.invest.txns.slice(0, 300);
}

function move(d: State, kind: TxnKind, amount: number, label: string, at?: string) {
  d.invest.balance = Math.round((d.invest.balance + amount) * 100) / 100;
  txn(d, kind, amount, label, at);
}

export function addMoney(d: State, amount: number, via: string) {
  move(d, 'add', amount, `Added via ${via}`);
}

export function withdrawMoney(d: State, amount: number): boolean {
  if (amount <= 0 || amount > d.invest.balance) return false;
  const bank = d.invest.kyc.bank;
  move(d, 'withdraw', -amount, bank ? `To ${bank.name} ••${bank.last4}` : 'To your bank');
  note(d, `${rupees(amount)} on its way to your bank`, 'Withdrawals reach your bank account within a working day.', '/wallet');
  return true;
}

/* ---------- Stock orders ---------- */

export interface OrderInput { stockId: string; side: 'buy' | 'sell'; type: 'market' | 'limit'; qty: number; limit?: number }

/** What a buy would hold back from the balance. */
export function buyHold(stockId: string, type: 'market' | 'limit', qty: number, limit?: number, now = Date.now()): number {
  const s = findStock(stockId);
  if (!s) return 0;
  const per = type === 'limit' && limit ? limit : price(s, now) * MARKET_BUFFER;
  const value = per * qty;
  return Math.round((value + charges('buy', value).total) * 100) / 100;
}

/** Places an order. Returns the order, or a reason it was refused. */
export function placeOrder(d: State, o: OrderInput, now = Date.now()): StockOrder | string {
  const s = findStock(o.stockId);
  if (!s || s.kind !== 'stock') return 'This can’t be traded.';
  if (s.listedAt && now < s.listedAt - 6 * 3600000) return 'It isn’t listed yet.';
  if (!Number.isInteger(o.qty) || o.qty < 1) return 'Quantity must be a whole number.';
  if (o.type === 'limit' && (!o.limit || o.limit <= 0)) return 'Set a limit price.';
  const ses = session(now);
  const cur = price(s, now);
  if (o.type === 'limit' && o.limit && Math.abs(o.limit - cur) / cur > 0.2) return 'Limit price must be within 20% of the current price.';
  if (o.side === 'sell' && o.qty > sellableQty(d.invest, o.stockId)) return 'You don’t hold that many shares.';

  const amo = !ses.open;
  const day = ses.open ? ses.day : istDayStart(ses.next!);
  const order: StockOrder = {
    id: uid(), stockId: o.stockId, side: o.side, type: o.type, qty: o.qty, limit: o.type === 'limit' ? Math.round(o.limit! * 20) / 20 : undefined,
    status: 'pending', placedAt: new Date(now).toISOString(), amo, from: ses.open ? now : sessionOpenAt(day), till: sessionCloseAt(day), blocked: 0,
  };
  if (o.side === 'buy') {
    const hold = buyHold(o.stockId, o.type, o.qty, order.limit, now);
    if (hold > d.invest.balance) return `You need ${px(hold)}; your balance is ${px(d.invest.balance)}.`;
    order.blocked = hold;
    move(d, 'block', -hold, `Held for ${o.qty} × ${s.name}`);
  }
  d.invest.orders.unshift(order);
  d.invest.orders = d.invest.orders.slice(0, 200);
  const fill = fillPrice(order, now);
  if (fill !== null) execute(d, order, fill, now, false);
  return order;
}

/** The price an order would fill at right now, or null. */
export function fillPrice(o: StockOrder, now = Date.now()): number | null {
  if (o.status !== 'pending') return null;
  const ses = session(now);
  if (!ses.open || now < o.from || now > o.till) return null;
  const s = findStock(o.stockId);
  if (!s) return null;
  const p = priceAt(s, now);
  if (o.type === 'market') return p;
  if (o.side === 'buy' && p <= o.limit!) return p;
  if (o.side === 'sell' && p >= o.limit!) return p;
  return null;
}

function execute(d: State, o: StockOrder, fill: number, now: number, notify: boolean) {
  const s = findStock(o.stockId)!;
  const value = Math.round(fill * o.qty * 100) / 100;
  const ch = charges(o.side, value);
  const at = new Date(now).toISOString();
  o.status = 'executed';
  o.price = fill;
  o.charges = ch.total;
  o.doneAt = at;
  if (o.side === 'buy') {
    const cost = value + ch.total;
    move(d, 'release', o.blocked, `Released hold, ${s.name}`, at);
    move(d, 'buy', -cost, `Bought ${o.qty} × ${s.name} @ ${px(fill)}`, at);
    o.blocked = 0;
    const pos = d.invest.positions.find((p) => p.stockId === o.stockId);
    if (pos) {
      pos.avg = (pos.avg * pos.qty + value) / (pos.qty + o.qty);
      pos.qty += o.qty;
    } else d.invest.positions.push({ stockId: o.stockId, qty: o.qty, avg: fill, at });
  } else {
    const pos = d.invest.positions.find((p) => p.stockId === o.stockId);
    if (!pos || pos.qty < o.qty) {
      o.status = 'rejected';
      o.reason = 'Not enough shares';
      return;
    }
    pos.qty -= o.qty;
    if (pos.qty === 0) d.invest.positions = d.invest.positions.filter((p) => p !== pos);
    move(d, 'sell', value - ch.total, `Sold ${o.qty} × ${s.name} @ ${px(fill)}`, at);
  }
  if (notify) note(d, `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.qty} × ${s.name}`, `Filled at ${px(fill)}${o.amo ? ', at the opening bell' : ''}.`, '/orders');
}

export function cancelOrder(d: State, id: string, reason = 'Cancelled by you') {
  const o = d.invest.orders.find((x) => x.id === id);
  if (!o || o.status !== 'pending') return;
  o.status = 'cancelled';
  o.reason = reason;
  o.doneAt = new Date().toISOString();
  if (o.blocked > 0) {
    const s = findStock(o.stockId);
    move(d, 'release', o.blocked, `Released hold, ${s?.name ?? 'order'}`);
    o.blocked = 0;
  }
}

/* ---------- Mutual funds ---------- */

export function buyFund(d: State, fundId: string, amount: number, via: MfOrder['via'], now = Date.now(), sipId?: string): MfOrder | string {
  const f = findFund(fundId);
  if (!f) return 'Fund not found.';
  if (amount < (sipId ? f.minSip : f.minLump)) return `The minimum is ${rupees(sipId ? f.minSip : f.minLump)}.`;
  if (via === 'balance' && amount > d.invest.balance) return `Your balance is ${px(d.invest.balance)}.`;
  const o: MfOrder = { id: uid(), fundId, side: 'buy', amount, status: 'processing', placedAt: new Date(now).toISOString(), settleAt: now + MF_SETTLE_MS, sipId, via };
  if (via === 'balance') move(d, 'mf', -amount, `${f.name}`);
  d.invest.mfOrders.unshift(o);
  d.invest.mfOrders = d.invest.mfOrders.slice(0, 300);
  return o;
}

export function redeemFund(d: State, fundId: string, units: number, now = Date.now()): MfOrder | string {
  const f = findFund(fundId);
  const pos = d.invest.funds.find((p) => p.fundId === fundId);
  if (!f || !pos) return 'You don’t hold this fund.';
  const free = redeemableUnits(d.invest, fundId, now).units;
  if (units <= 0 || units > free + 1e-6) return f.lockInYears ? 'Some units are still in their 3-year lock-in.' : 'That’s more units than you hold.';
  const u = Math.min(units, pos.units);
  const n = nav(f, now).nav;
  const o: MfOrder = { id: uid(), fundId, side: 'sell', amount: Math.round(u * n * 100) / 100, units: u, status: 'processing', placedAt: new Date(now).toISOString(), settleAt: now + MF_SETTLE_MS, via: 'balance' };
  const share = u / pos.units;
  pos.invested = Math.round(pos.invested * (1 - share) * 100) / 100;
  pos.units = Math.round((pos.units - u) * 10000) / 10000;
  if (pos.units <= 0.0001) d.invest.funds = d.invest.funds.filter((p) => p !== pos);
  d.invest.mfOrders.unshift(o);
  return o;
}

function allot(d: State, o: MfOrder, notify: boolean) {
  const f = findFund(o.fundId);
  if (!f) {
    o.status = 'failed';
    return;
  }
  // NAV of the order's day: the same day if placed before 3 pm on a trading day, else the next trading day.
  const placed = new Date(o.placedAt).getTime();
  let day = istDayStart(placed);
  if (!isTradingDay(day) || placed - day >= 15 * 3600000) day = nextTradingDay(day);
  const latest = nav(f, o.settleAt).day;
  if (day > latest) day = latest;
  const n = navOn(f, day);
  o.nav = n;
  o.status = 'done';
  if (o.side === 'buy') {
    const units = Math.round((o.amount / n) * 10000) / 10000;
    o.units = units;
    const pos = d.invest.funds.find((p) => p.fundId === o.fundId);
    if (pos) {
      pos.units = Math.round((pos.units + units) * 10000) / 10000;
      pos.invested = Math.round((pos.invested + o.amount) * 100) / 100;
    } else d.invest.funds.push({ fundId: o.fundId, units, invested: o.amount, at: o.placedAt });
    if (notify) note(d, `${units.toFixed(3)} units of ${f.name}`, `${rupees(o.amount)} at NAV ${px(n)}${o.sipId ? ', your SIP instalment' : ''}.`, `/mf/${f.id}`);
  } else {
    o.amount = Math.round((o.units ?? 0) * n * 100) / 100;
    move(d, 'redeem', o.amount, `Redeemed ${f.name}`);
    if (notify) note(d, `${rupees(o.amount)} from ${f.name}`, 'Redemption paid into your balance.', '/wallet');
  }
}

/* ---------- SIPs ---------- */

/** The next instalment on `day` of the month, strictly after `after`, at 10 am IST. */
export function nextSipDate(day: number, after: number): number {
  const ist = new Date(after + 330 * 60000);
  let y = ist.getUTCFullYear();
  let m = ist.getUTCMonth();
  for (let k = 0; k < 3; k++) {
    const t = Date.UTC(y, m, day, 10, 0) - 330 * 60000;
    if (t > after) return t;
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return Date.UTC(y, m, day, 10, 0) - 330 * 60000;
}

export function startSip(d: State, fundId: string, amount: number, day: number, payNow: boolean, now = Date.now()): Sip | string {
  const f = findFund(fundId);
  if (!f) return 'Fund not found.';
  if (amount < f.minSip) return `The minimum SIP is ${rupees(f.minSip)}.`;
  const sip: Sip = { id: uid(), fundId, amount, day, status: 'active', startedAt: new Date(now).toISOString(), nextAt: nextSipDate(day, now), count: 0 };
  if (payNow) {
    const o = buyFund(d, fundId, amount, 'upi', now, sip.id);
    if (typeof o === 'string') return o;
    sip.count = 1;
  }
  d.invest.sips.push(sip);
  note(d, `SIP started: ${rupees(amount)} a month`, `${f.name}, on the ${ordinal(day)}. Autopay from your bank.`, '/sips');
  return sip;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ---------- IPOs ---------- */

export function applyIpo(d: State, ipoId: string, lots: number, bid: number, upi: string, now = Date.now()): IpoApp | string {
  const ipo = ipoById(ipoId);
  if (!ipo) return 'IPO not found.';
  if (now < ipo.opensAt || now >= ipo.closesAt) return 'Bidding isn’t open.';
  if (d.invest.ipos.some((a) => a.ipoId === ipoId && a.status === 'applied')) return 'You’ve already applied. Cancel it first to change your bid.';
  if (lots < 1 || bid * ipo.lot * lots > 200000) return 'Retail bids go up to ₹2,00,000.';
  if (bid < ipo.band[0] || bid > ipo.band[1]) return `Bid inside the price band, ${px(ipo.band[0])}–${px(ipo.band[1])}.`;
  if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return 'That doesn’t look like a UPI ID.';
  const app: IpoApp = { id: uid(), ipoId, lots, price: bid, upi: upi.trim(), at: new Date(now).toISOString(), status: 'applied' };
  d.invest.ipos.unshift(app);
  note(d, `Applied for ${ipo.name}`, `${lots} lot${lots > 1 ? 's' : ''}. ${rupees(bid * ipo.lot * lots)} is blocked in your bank until allotment.`, `/ipo/${ipoId}`);
  return app;
}

export function cancelIpo(d: State, appId: string) {
  const a = d.invest.ipos.find((x) => x.id === appId);
  if (a && a.status === 'applied') a.status = 'cancelled';
}

/* ---------- Settling: run on a timer and on load ---------- */

export function investDue(s: State, now = Date.now()): boolean {
  const inv = s.invest;
  if (!inv) return false;
  if (inv.orders.some((o) => o.status === 'pending' && (now > o.till || fillPrice(o, now) !== null))) return true;
  if (inv.mfOrders.some((o) => o.status === 'processing' && o.settleAt <= now)) return true;
  if (inv.sips.some((x) => x.status === 'active' && x.nextAt <= now)) return true;
  return inv.ipos.some((a) => {
    const ipo = ipoById(a.ipoId);
    if (!ipo) return false;
    return (a.status === 'applied' && now >= ipo.allotAt) || (a.status === 'allotted' && now >= ipo.listAt);
  });
}

export function settleInvest(d: State, now = Date.now()): boolean {
  const inv = d.invest;
  let changed = false;

  for (const o of inv.orders) {
    if (o.status !== 'pending') continue;
    const fill = fillPrice(o, now);
    if (fill !== null) {
      execute(d, o, fill, now, true);
      changed = true;
    } else if (now > o.till) {
      cancelOrder(d, o.id, o.type === 'limit' ? 'Price never reached your limit' : 'Market closed before it filled');
      const s = findStock(o.stockId);
      note(d, `Order lapsed: ${s?.name ?? 'stock'}`, 'Day orders end at 3:30 pm. Any held money is back in your balance.', '/orders');
      changed = true;
    }
  }

  for (const sip of inv.sips) {
    let guard = 0;
    while (sip.status === 'active' && sip.nextAt <= now && guard++ < 12) {
      const due = sip.nextAt;
      const o = buyFund(d, sip.fundId, sip.amount, 'autopay', due, sip.id);
      if (typeof o !== 'string') sip.count += 1;
      sip.nextAt = nextSipDate(sip.day, due);
      changed = true;
    }
  }

  // Oldest first, so notes read in order.
  for (const o of [...inv.mfOrders].reverse()) {
    if (o.status === 'processing' && o.settleAt <= now) {
      allot(d, o, now - o.settleAt < 7 * 86400000);
      changed = true;
    }
  }

  for (const a of inv.ipos) {
    const ipo = ipoById(a.ipoId);
    if (!ipo) continue;
    if (a.status === 'applied' && now >= ipo.allotAt) {
      a.status = allotted(a.id, ipo) ? 'allotted' : 'not-allotted';
      note(
        d,
        a.status === 'allotted' ? `You got ${ipo.name}!` : `No allotment in ${ipo.name}`,
        a.status === 'allotted' ? `1 lot of ${ipo.lot} shares. They list on ${new Date(ipo.listAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` : `Retail was ${ipo.retail}× subscribed, so it was a lottery. The blocked money is released.`,
        `/ipo/${ipo.id}`,
      );
      changed = true;
    }
    if (a.status === 'allotted' && now >= ipo.listAt) {
      a.status = 'listed';
      // Oversubscribed retail gets one lot; otherwise the full bid.
      const lots = ipo.retail > 1 ? 1 : a.lots;
      const pos = inv.positions.find((p) => p.stockId === ipo.id);
      if (pos) pos.qty += lots * ipo.lot;
      else inv.positions.push({ stockId: ipo.id, qty: lots * ipo.lot, avg: ipo.band[1], at: new Date(ipo.listAt).toISOString() });
      note(d, `${ipo.name} listed at ${px(ipo.listPrice)}`, `${ipo.gain >= 0 ? 'Up' : 'Down'} ${Math.abs(Math.round(ipo.gain * 100))}% on your issue price. The shares are in your portfolio.`, `/stocks/${ipo.id}`);
      changed = true;
    }
  }
  return changed;
}

/* ---------- Seeds ---------- */

function seedSip(fundId: string, amount: number, day: number, months: number, now: number) {
  const f = findFund(fundId)!;
  const orders: MfOrder[] = [];
  let units = 0;
  for (let k = months; k >= 1; k--) {
    const t = new Date(now + 330 * 60000);
    const at = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - k + 1, day, 10) - 330 * 60000;
    if (at > now) continue;
    let dd = istDayStart(at);
    if (!isTradingDay(dd)) dd = nextTradingDay(dd);
    const n = navOn(f, Math.min(dd, prevTradingDay(istDayStart(now))));
    const u = Math.round((amount / n) * 10000) / 10000;
    units += u;
    orders.push({ id: uid(), fundId, side: 'buy', amount, units: u, nav: n, status: 'done', placedAt: new Date(at).toISOString(), settleAt: at + MF_SETTLE_MS, via: 'autopay' });
  }
  return { orders, units: Math.round(units * 10000) / 10000, invested: amount * orders.length, first: orders[0]?.placedAt ?? new Date(now).toISOString() };
}

const SAMPLE_BANK = { name: 'Deccan Bank', last4: '4821', ifsc: 'DECB0001042' };

export function initialInvest(persona: PersonaId, sample: boolean, now = Date.now()): InvestState {
  const empty: InvestState = { kyc: { status: 'none' }, balance: 0, txns: [], positions: [], orders: [], funds: [], mfOrders: [], sips: [], watch: ['nifty50', 'indusdigital', 'lakshya-nifty50'], ipos: [] };
  if (!sample) return empty;
  const kyc: Kyc = { status: 'verified', pan: '•••••1234K', bank: SAMPLE_BANK, at: new Date(now - 200 * 86400000).toISOString() };
  const ago = (days: number) => new Date(now - days * 86400000).toISOString();
  const pos = (stockId: string, qty: number, daysAgo: number): Position => {
    const s = findStock(stockId)!;
    return { stockId, qty, avg: priceAt(s, sessionCloseAt(prevTradingDay(istDayStart(now - daysAgo * 86400000)))), at: ago(daysAgo) };
  };
  const plan = (sips: [string, number, number, number][], extra: [string, number, number][] = []) => {
    const funds: FundPosition[] = [];
    const orders: MfOrder[] = [];
    const list: Sip[] = [];
    for (const [fundId, amount, day, months] of sips) {
      const h = seedSip(fundId, amount, day, months, now);
      orders.push(...h.orders);
      funds.push({ fundId, units: h.units, invested: h.invested, at: h.first });
      list.push({ id: uid(), fundId, amount, day, status: 'active', startedAt: h.first, nextAt: nextSipDate(day, now), count: h.orders.length });
    }
    for (const [fundId, amount, daysAgo] of extra) {
      const f = findFund(fundId)!;
      const n = navOn(f, prevTradingDay(istDayStart(now - daysAgo * 86400000)));
      const units = Math.round((amount / n) * 10000) / 10000;
      orders.push({ id: uid(), fundId, side: 'buy', amount, units, nav: n, status: 'done', placedAt: ago(daysAgo), settleAt: now - daysAgo * 86400000 + MF_SETTLE_MS, via: 'upi' });
      funds.push({ fundId, units, invested: amount, at: ago(daysAgo) });
    }
    orders.sort((a, b) => b.placedAt.localeCompare(a.placedAt));
    return { funds, mfOrders: orders, sips: list };
  };
  const executed = (p: Position): StockOrder => ({
    id: uid(), stockId: p.stockId, side: 'buy', type: 'market', qty: p.qty, status: 'executed', placedAt: p.at, amo: false,
    from: new Date(p.at).getTime(), till: new Date(p.at).getTime(), blocked: 0, price: p.avg, charges: charges('buy', p.avg * p.qty).total, doneAt: p.at,
  });

  if (persona === 'student') {
    return { ...empty, kyc, balance: 120, ...plan([['lakshya-nifty50', 100, 1, 2]]), watch: ['nifty50', 'zaika', 'lakshya-nifty50', 'udaan-small'],
      txns: [{ id: uid(), at: ago(9), kind: 'add', amount: 120, label: 'Added via UPI' }] };
  }
  if (persona === 'irregular') {
    const positions = [pos('bharatgrid', 5, 64)];
    return { ...empty, kyc, balance: 1850, positions, orders: positions.map(executed), ...plan([], [['setu-flexi', 4500, 120], ['neev-liquid', 6000, 40], ['lakshya-nifty50', 3000, 75]]),
      watch: ['nifty50', 'nayirail', 'meghna', 'setu-flexi'],
      txns: [{ id: uid(), at: ago(12), kind: 'add', amount: 1850, label: 'Added via UPI' }] };
  }
  const positions = [pos('indusdigital', 3, 150), pos('ganga', 1, 96), pos('tarang', 12, 40)];
  return {
    ...empty, kyc, balance: 2640, positions, orders: positions.map(executed),
    ...plan([['lakshya-nifty50', 2000, 5, 12], ['setu-flexi', 1000, 10, 7]]),
    watch: ['nifty50', 'banknifty', 'sahyadri', 'meghna', 'kaveri', 'udaan-small'],
    txns: [{ id: uid(), at: ago(3), kind: 'add', amount: 2640, label: 'Added via UPI' }],
  };
}

/** Old saves (and partial ones) get every field. */
export function ensureInvest(s: State): InvestState {
  const base = initialInvest(s.persona, false);
  const cur = (s as Partial<State>).invest;
  return cur ? { ...base, ...cur, kyc: { ...base.kyc, ...cur.kyc } } : initialInvest(s.persona, s.sample !== false);
}

export const ALL_FUND_IDS = FUNDS.map((f) => f.id);
