/* Demo market: fictional companies, funds and IPOs with deterministic prices.
   Prices are a pure function of time, so every reload and every device sees the same tape.
   Sessions follow NSE hours in IST (9:15 am to 3:30 pm, Monday to Friday; holidays ignored). */

const MIN = 60_000;
const DAY = 86_400_000;
const OFF = 330 * MIN; // IST is UTC+5:30
const OPEN = (9 * 60 + 15) * MIN;
const CLOSE = (15 * 60 + 30) * MIN;
/** Base prices are roughly where each name trades at the start of 2026. */
const EPOCH = Date.UTC(2026, 0, 1);

/* ---------- Instruments ---------- */

export interface Stock {
  kind: 'stock' | 'index';
  id: string;
  name: string;
  symbol: string;
  sector: string;
  base: number;
  /** Long-run yearly drift. */
  drift: number;
  /** Size of the slow multi-month swings (1 = a typical stock). */
  swing: number;
  /** Size of intraday wiggles. */
  vol: number;
  phase: number;
  /** Shares outstanding, crore (for market cap). */
  shares?: number;
  pe?: number;
  pb?: number;
  div?: number;
  roe?: number;
  about?: string;
  /** For IPO listings: no price before this moment. */
  listedAt?: number;
  /** Price at listing, used to anchor a fresh listing's tape. */
  listPrice?: number;
}

const stock = (id: string, name: string, symbol: string, sector: string, base: number, drift: number, swing: number, vol: number, phase: number, shares: number, pe: number, pb: number, div: number, roe: number, about: string): Stock =>
  ({ kind: 'stock', id, name, symbol, sector, base, drift, swing, vol, phase, shares, pe, pb, div, roe, about });

export const STOCKS: Stock[] = [
  stock('bharatgrid', 'Bharat Grid Power', 'BHARATGRID', 'Power', 312, 0.11, 0.9, 0.012, 0.4, 930, 17.8, 3.1, 2.4, 18.2, 'Runs high-voltage transmission lines across 14 states and earns regulated returns on them. Boring on purpose.'),
  stock('sahyadri', 'Sahyadri Motors', 'SAHYMOTOR', 'Auto', 1840, 0.08, 1.1, 0.015, 1.9, 332, 24.6, 4.4, 1.1, 17.5, 'Makes scooters, small cars and an electric three-wheeler that delivery fleets love.'),
  stock('indusdigital', 'Indus Digital', 'INDUSDIG', 'IT', 1475, 0.13, 1, 0.013, 3.1, 415, 27.2, 7.9, 2.1, 29.4, 'IT services for banks and airlines in 30 countries. Most of its revenue is in dollars.'),
  stock('ganga', 'Ganga Consumer', 'GANGACONS', 'FMCG', 2560, 0.06, 0.6, 0.009, 4.4, 235, 52.3, 11.6, 1.6, 22.8, 'Soaps, tea and biscuits sold in 9 lakh shops. Grows slowly, falls slowly.'),
  stock('deccanbank', 'Deccan Bank', 'DECCANBNK', 'Banking', 1620, 0.09, 0.9, 0.012, 5.2, 760, 18.4, 2.7, 1.2, 15.9, 'A private bank with 4,200 branches, strong in home loans and small business lending.'),
  stock('kaveri', 'Kaveri Pharma Labs', 'KAVERIPH', 'Pharma', 1180, 0.1, 1, 0.014, 2.3, 168, 31.5, 5.2, 0.8, 16.4, 'Generic medicines for India and the US, plus a growing diagnostics arm.'),
  stock('tarang', 'Tarang Telecom', 'TARANG', 'Telecom', 214, 0.07, 1.4, 0.019, 0.9, 2900, 0, 4.8, 0, -3.1, 'The third-largest mobile network. Still loss-making, still adding 5G towers.'),
  stock('vistaar', 'Vistaar Realty', 'VISTAAR', 'Realty', 742, 0.12, 1.6, 0.021, 3.7, 120, 41.2, 3.9, 0.3, 9.8, 'Builds apartments in Pune and Bengaluru. Sales swing with interest rates.'),
  stock('chandra', 'Chandra Steel Works', 'CHANDSTEEL', 'Metals', 158, 0.05, 1.7, 0.022, 4.9, 1210, 11.3, 1.6, 2.9, 13.7, 'One of the cheapest steel makers in the country. Profits follow global steel prices.'),
  stock('pragati', 'Pragati Finserv', 'PRAGATI', 'NBFC', 3240, 0.15, 1.2, 0.017, 1.4, 62, 29.8, 5.6, 0.5, 19.9, 'Consumer loans for phones, two-wheelers and appliances, approved in minutes at the shop counter.'),
  stock('saptarishi', 'Saptarishi Insurance', 'SAPTINS', 'Insurance', 655, 0.09, 0.8, 0.012, 2.8, 210, 68.1, 8.2, 0.2, 12.6, 'Life insurance and pension plans sold mostly through bank branches.'),
  stock('meghna', 'Meghna Airways', 'MEGHNAAIR', 'Aviation', 4120, 0.14, 1.5, 0.02, 0.2, 39, 22.4, 18.5, 0, 74.2, 'The largest airline by passengers. Fuel prices are its biggest worry.'),
  stock('rangoli', 'Rangoli Paints', 'RANGOLI', 'Paints', 2890, 0.04, 0.9, 0.013, 5.9, 96, 58.6, 13.1, 1, 24.3, 'Decorative paints with a dealer network in every district. New rivals are squeezing margins.'),
  stock('zaika', 'Zaika Foodtech', 'ZAIKA', 'Internet', 238, 0.18, 1.8, 0.024, 1.1, 880, 312, 9.4, 0, 2.2, 'Food delivery and 10-minute groceries. Only recently started making a profit.'),
  stock('nayirail', 'Nayi Rail Systems', 'NAYIRAIL', 'Railways', 412, 0.16, 1.6, 0.02, 3.3, 240, 48.9, 7.7, 0.6, 16.1, 'Builds coaches and signalling for metro and railway projects. Order book is three years deep.'),
  stock('ambar', 'Ambar Chemicals', 'AMBARCHEM', 'Chemicals', 960, 0.06, 1.2, 0.016, 4.1, 74, 34.7, 4.1, 0.7, 12.9, 'Speciality chemicals for pharma and agriculture, exported to 60 countries.'),
  stock('swadesh', 'Swadesh Oil & Gas', 'SWADESHOG', 'Energy', 1325, 0.07, 1, 0.014, 2.0, 1350, 13.9, 1.9, 3.6, 14.4, 'Refines crude and runs 8,000 fuel stations. Pays a steady dividend.'),
  stock('lehar', 'Lehar Payments', 'LEHARPAY', 'Fintech', 880, 0.2, 1.9, 0.026, 5.5, 64, 0, 6.3, 0, -8.4, 'A payments app and lending platform. Growing fast, still burning cash.'),
];

const index = (id: string, name: string, base: number, drift: number, swing: number, vol: number, phase: number, about: string): Stock =>
  ({ kind: 'index', id, name, symbol: name, sector: 'Index', base, drift, swing, vol, phase, about });

export const INDICES: Stock[] = [
  index('nifty50', 'NIFTY 50', 24800, 0.11, 0.55, 0.006, 1.2, 'India’s 50 largest listed companies in one number. Demo values shaped like the real index.'),
  index('sensex', 'SENSEX', 81200, 0.105, 0.55, 0.006, 1.25, '30 large BSE-listed companies. Moves almost in step with the Nifty 50. Demo values.'),
  index('banknifty', 'NIFTY BANK', 53400, 0.1, 0.75, 0.008, 2.6, 'The biggest listed banks. Swings harder than the Nifty 50. Demo values.'),
  index('midcap', 'NIFTY MIDCAP 100', 56800, 0.15, 0.95, 0.009, 3.9, '100 mid-sized companies: more growth, more drama. Demo values.'),
];

/** The five large caps the Fun Pot trades. */
export const FUN_STOCK_IDS = ['bharatgrid', 'sahyadri', 'indusdigital', 'ganga', 'deccanbank'];

/* ---------- Noise ---------- */

function hash(i: number, seed: number): number {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Smooth value noise in [-1, 1]. */
function vnoise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - u) + hash(i + 1, seed) * u;
}

function seedOf(id: string): number {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return h;
}

/* ---------- Sessions (IST) ---------- */

export const istDayStart = (ms: number) => Math.floor((ms + OFF) / DAY) * DAY - OFF;
const weekday = (dayStart: number) => new Date(dayStart + OFF).getUTCDay();
export const isTradingDay = (dayStart: number) => weekday(dayStart) !== 0 && weekday(dayStart) !== 6;

export function prevTradingDay(dayStart: number): number {
  let d = dayStart - DAY;
  while (!isTradingDay(d)) d -= DAY;
  return d;
}

export function nextTradingDay(dayStart: number): number {
  let d = dayStart + DAY;
  while (!isTradingDay(d)) d += DAY;
  return d;
}

export interface Session {
  open: boolean;
  /** Start (00:00 IST) of the session the tape is showing. */
  day: number;
  /** The moment prices are read at: now while open, else the last close. */
  eff: number;
  /** Next opening bell, when closed. */
  next?: number;
  /** Close of the current or last session. */
  close: number;
}

export function session(now: number = Date.now()): Session {
  const ds = istDayStart(now);
  const tod = now - ds;
  if (isTradingDay(ds) && tod >= OPEN && tod < CLOSE) return { open: true, day: ds, eff: now, close: ds + CLOSE };
  if (isTradingDay(ds) && tod >= CLOSE) return { open: false, day: ds, eff: ds + CLOSE, next: nextTradingDay(ds) + OPEN, close: ds + CLOSE };
  const p = prevTradingDay(ds);
  const next = isTradingDay(ds) ? ds + OPEN : nextTradingDay(ds) + OPEN;
  return { open: false, day: p, eff: p + CLOSE, next, close: p + CLOSE };
}

export const sessionOpenAt = (day: number) => day + OPEN;
export const sessionCloseAt = (day: number) => day + CLOSE;

const IST: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' };

export function istTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-IN', { ...IST, hour: 'numeric', minute: '2-digit' });
}

export function istDay(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short' });
}

export function istDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { ...IST, day: 'numeric', month: 'short', year: 'numeric' });
}

export function istWeekday(ms: number): string {
  return new Date(ms).toLocaleDateString('en-IN', { ...IST, weekday: 'short' });
}

export function marketStatus(now = Date.now()): { open: boolean; text: string } {
  const s = session(now);
  if (s.open) return { open: true, text: 'Market open · closes 3:30 pm' };
  const next = s.next!;
  const tomorrow = istDayStart(now) + DAY;
  const when = istDayStart(next) === istDayStart(now) ? 'today' : istDayStart(next) === tomorrow ? 'tomorrow' : istWeekday(next);
  return { open: false, text: `Market closed · opens ${when} 9:15 am` };
}

/* ---------- Prices ---------- */

function factor(s: Stock, ms: number): number {
  const d = (ms - EPOCH) / DAY;
  const ph = s.phase;
  const slow = 0.07 * Math.sin(d / 61 + ph) + 0.035 * Math.sin(d / 19 + 2 * ph) + 0.014 * Math.sin(d / 4.3 + 3 * ph);
  const m = ms / MIN;
  const seed = seedOf(s.id);
  const daily = vnoise(d * 1.3, seed + 3) * 0.6;
  const fast = 0.6 * vnoise(m / 50, seed) + 0.3 * vnoise(m / 12, seed + 7) + 0.12 * vnoise(m / 3, seed + 13);
  return Math.exp((s.drift * d) / 365) * (1 + slow * s.swing) * (1 + (fast + daily) * s.vol);
}

function tick(s: Stock, p: number): number {
  return s.kind === 'index' ? Math.round(p * 100) / 100 : Math.max(0.05, Math.round(p * 20) / 20);
}

/** Price at a moment, with no session clamping. */
export function priceAt(s: Stock, ms: number): number {
  const t = s.listedAt ? Math.max(ms, s.listedAt) : ms;
  if (s.listPrice && s.listedAt) return tick(s, (s.listPrice * factor(s, t)) / factor(s, s.listedAt));
  return tick(s, s.base * factor(s, t));
}

/** The live price: now while the market is open, else the last close. */
export function price(s: Stock, now = Date.now()): number {
  return priceAt(s, session(now).eff);
}

/** Same signature the Fun Pot always used. */
export function stockPrice(s: Stock, at = new Date()): number {
  return price(s, at.getTime());
}

export interface Quote {
  price: number;
  prev: number;
  change: number;
  pct: number;
  open: number;
  high: number;
  low: number;
  live: boolean;
}

export function quote(s: Stock, now = Date.now()): Quote {
  const ses = session(now);
  const p = priceAt(s, ses.eff);
  const prevClose = sessionCloseAt(prevTradingDay(ses.day));
  const listedToday = s.listedAt !== undefined && s.listedAt > prevClose;
  const prev = listedToday ? s.listPrice! : priceAt(s, prevClose);
  const from = Math.max(ses.day + OPEN, s.listedAt ?? 0);
  let high = p;
  let low = p;
  for (let t = from; t < ses.eff; t += 5 * MIN) {
    const v = priceAt(s, t);
    if (v > high) high = v;
    if (v < low) low = v;
  }
  const change = p - prev;
  return { price: p, prev, change, pct: prev ? (change / prev) * 100 : 0, open: priceAt(s, from), high, low, live: ses.open };
}

export function stats52(s: Stock, now = Date.now()): { high: number; low: number } {
  const ses = session(now);
  let high = -Infinity;
  let low = Infinity;
  let d = ses.day;
  for (let i = 0; i < 250; i++) {
    const v = priceAt(s, Math.min(d + CLOSE, ses.eff));
    if (v > high) high = v;
    if (v < low) low = v;
    d = prevTradingDay(d);
    if (s.listedAt && d + CLOSE < s.listedAt) break;
  }
  return { high, low };
}

/** Market cap in ₹ crore. */
export const marketCap = (s: Stock, now = Date.now()) => (s.shares ? price(s, now) * s.shares : 0);

export function capLabel(cr: number): string {
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} L Cr`;
  return `₹${Math.round(cr).toLocaleString('en-IN')} Cr`;
}

export function capSize(cr: number): 'Large cap' | 'Mid cap' | 'Small cap' {
  return cr >= 100000 ? 'Large cap' : cr >= 30000 ? 'Mid cap' : 'Small cap';
}

/* ---------- Chart series ---------- */

export type Range = '1D' | '1W' | '1M' | '1Y' | '5Y';
export const RANGES: Range[] = ['1D', '1W', '1M', '1Y', '5Y'];
export interface Point { t: number; v: number }

function daysBack(day: number, n: number): number[] {
  const out = [day];
  let d = day;
  while (out.length < n) {
    d = prevTradingDay(d);
    out.unshift(d);
  }
  return out;
}

export function series(s: Stock, range: Range, now = Date.now()): Point[] {
  const ses = session(now);
  const pts: Point[] = [];
  const push = (t: number) => {
    if (t > ses.eff) return;
    if (s.listedAt && t < s.listedAt) return;
    pts.push({ t, v: priceAt(s, t) });
  };
  if (range === '1D') {
    for (let t = ses.day + OPEN; t < ses.eff; t += 5 * MIN) push(t);
  } else if (range === '1W') {
    for (const d of daysBack(ses.day, 5)) for (let t = d + OPEN; t < d + CLOSE; t += 30 * MIN) push(t);
  } else if (range === '1M') {
    for (const d of daysBack(ses.day, 22)) for (const h of [OPEN + 105 * MIN, OPEN + 240 * MIN]) push(d + h);
  } else if (range === '1Y') {
    for (const d of daysBack(ses.day, 250)) push(d + CLOSE);
  } else {
    let d = ses.day;
    const days: number[] = [];
    for (let i = 0; i < 260; i++) {
      days.unshift(d);
      d = istDayStart(d - 7 * DAY + DAY / 2);
      if (!isTradingDay(d)) d = prevTradingDay(d);
    }
    for (const x of days) push(x + CLOSE);
  }
  push(ses.eff);
  return pts;
}

/* ---------- Mutual funds ---------- */

export type FundCategory = 'Index' | 'Large Cap' | 'Flexi Cap' | 'Mid Cap' | 'Small Cap' | 'ELSS' | 'Hybrid' | 'Debt' | 'Liquid' | 'Gold' | 'International';
export type Risk = 'Low' | 'Low to Moderate' | 'Moderate' | 'Moderately High' | 'High' | 'Very High';
export const RISKS: Risk[] = ['Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High'];

export interface Fund {
  id: string;
  name: string;
  amc: string;
  category: FundCategory;
  risk: Risk;
  /** NAV on 1 Jan 2026. */
  navBase: number;
  cagr: number;
  vol: number;
  phase: number;
  /** Tracks this index's tape, minus the expense ratio. */
  tracks?: string;
  expense: number;
  aum: number;
  minSip: number;
  minLump: number;
  exitLoad: string;
  lockInYears?: number;
  manager: string;
  benchmark: string;
  rating: number;
  about: string;
  top: string[];
}

const fund = (f: Fund) => f;

export const FUNDS: Fund[] = [
  fund({ id: 'lakshya-nifty50', name: 'Lakshya Nifty 50 Index Fund', amc: 'Lakshya MF', category: 'Index', risk: 'Very High', navBase: 168.42, cagr: 0.11, vol: 0, phase: 0, tracks: 'nifty50', expense: 0.18, aum: 8420, minSip: 100, minLump: 100, exitLoad: 'Nil', manager: 'Ritika Bansal', benchmark: 'NIFTY 50 TRI', rating: 5, about: 'Buys all 50 Nifty companies in the index’s own proportions. No stock picking, no star manager, a very low fee. The boring choice that usually wins.', top: ['Deccan Bank', 'Indus Digital', 'Swadesh Oil & Gas', 'Ganga Consumer', 'Bharat Grid Power'] }),
  fund({ id: 'saral-next50', name: 'Saral Nifty Next 50 Index Fund', amc: 'Saral MF', category: 'Index', risk: 'Very High', navBase: 64.1, cagr: 0.14, vol: 0.17, phase: 2.2, expense: 0.3, aum: 2310, minSip: 100, minLump: 500, exitLoad: 'Nil', manager: 'Kunal Shetty', benchmark: 'NIFTY NEXT 50 TRI', rating: 4, about: 'The 50 companies just below the Nifty 50. Tomorrow’s large caps, with bigger swings.', top: ['Pragati Finserv', 'Saptarishi Insurance', 'Nayi Rail Systems', 'Rangoli Paints', 'Kaveri Pharma Labs'] }),
  fund({ id: 'setu-flexi', name: 'Setu Flexi Cap Fund', amc: 'Setu MF', category: 'Flexi Cap', risk: 'Very High', navBase: 92.7, cagr: 0.16, vol: 0.16, phase: 1.1, expense: 0.62, aum: 18650, minSip: 500, minLump: 1000, exitLoad: '1% if sold within 1 year', manager: 'Anand Iyer', benchmark: 'NIFTY 500 TRI', rating: 5, about: 'The manager can buy companies of any size. Mostly large caps, some mid and small caps when they look cheap.', top: ['Indus Digital', 'Deccan Bank', 'Meghna Airways', 'Pragati Finserv', 'Ambar Chemicals'] }),
  fund({ id: 'akash-large', name: 'Akash Bluechip Fund', amc: 'Akash MF', category: 'Large Cap', risk: 'Very High', navBase: 71.3, cagr: 0.12, vol: 0.13, phase: 3.4, expense: 0.84, aum: 12900, minSip: 100, minLump: 100, exitLoad: '1% if sold within 1 year', manager: 'Farah Khan', benchmark: 'NIFTY 100 TRI', rating: 3, about: 'Picks from the top 100 companies. Costs more than an index fund and hasn’t beaten one over 5 years.', top: ['Deccan Bank', 'Swadesh Oil & Gas', 'Indus Digital', 'Sahyadri Motors', 'Ganga Consumer'] }),
  fund({ id: 'sagar-mid', name: 'Sagar Midcap Fund', amc: 'Sagar MF', category: 'Mid Cap', risk: 'Very High', navBase: 118.9, cagr: 0.19, vol: 0.22, phase: 4.6, expense: 0.58, aum: 9740, minSip: 100, minLump: 500, exitLoad: '1% if sold within 1 year', manager: 'Vivek Rao', benchmark: 'NIFTY MIDCAP 150 TRI', rating: 4, about: 'Mid-sized companies that could become large ones. Expect a few years where it falls 25% or more.', top: ['Nayi Rail Systems', 'Ambar Chemicals', 'Vistaar Realty', 'Kaveri Pharma Labs', 'Rangoli Paints'] }),
  fund({ id: 'udaan-small', name: 'Udaan Small Cap Fund', amc: 'Udaan MF', category: 'Small Cap', risk: 'Very High', navBase: 156.2, cagr: 0.22, vol: 0.3, phase: 0.7, expense: 0.71, aum: 15200, minSip: 100, minLump: 1000, exitLoad: '1% if sold within 1 year', manager: 'Neha Kulkarni', benchmark: 'NIFTY SMALLCAP 250 TRI', rating: 4, about: 'Small companies: the highest long-run returns and the deepest falls. Only for money you won’t need for 7+ years.', top: ['Chandra Steel Works', 'Vistaar Realty', 'Ambar Chemicals', 'Nayi Rail Systems', 'Zaika Foodtech'] }),
  fund({ id: 'kosh-elss', name: 'Kosh ELSS Tax Saver Fund', amc: 'Kosh MF', category: 'ELSS', risk: 'Very High', navBase: 84.6, cagr: 0.15, vol: 0.17, phase: 5.3, expense: 0.66, aum: 6100, minSip: 500, minLump: 500, exitLoad: 'Nil (3-year lock-in)', lockInYears: 3, manager: 'Sameer Joshi', benchmark: 'NIFTY 500 TRI', rating: 4, about: 'Saves tax under Section 80C in the old regime, up to ₹1.5 lakh a year. Each instalment is locked for 3 years.', top: ['Deccan Bank', 'Indus Digital', 'Pragati Finserv', 'Saptarishi Insurance', 'Sahyadri Motors'] }),
  fund({ id: 'taara-hybrid', name: 'Taara Balanced Advantage Fund', amc: 'Taara MF', category: 'Hybrid', risk: 'Moderately High', navBase: 42.8, cagr: 0.11, vol: 0.08, phase: 2.9, expense: 0.74, aum: 7350, minSip: 100, minLump: 500, exitLoad: '1% if sold within 1 year', manager: 'Gaurav Menon', benchmark: 'NIFTY 50 Hybrid Composite 50:50', rating: 4, about: 'Moves between stocks and bonds on its own, buying more stock when the market is cheap. Smoother ride, lower peak.', top: ['Government bonds', 'Deccan Bank', 'Indus Digital', 'Swadesh Oil & Gas', 'Corporate bonds'] }),
  fund({ id: 'prithvi-debt', name: 'Prithvi Short Duration Fund', amc: 'Prithvi MF', category: 'Debt', risk: 'Moderate', navBase: 31.94, cagr: 0.074, vol: 0.006, phase: 1.7, expense: 0.36, aum: 4820, minSip: 500, minLump: 500, exitLoad: 'Nil', manager: 'Shalini Pillai', benchmark: 'CRISIL Short Duration Debt Index', rating: 4, about: 'Lends to the government and top-rated companies for 1 to 3 years. For goals a year or two away.', top: ['7.1% GOI 2028', 'Bharat Grid Power bonds', 'Deccan Bank CDs', '7.3% GOI 2027', 'State development loans'] }),
  fund({ id: 'neev-liquid', name: 'Neev Liquid Fund', amc: 'Neev MF', category: 'Liquid', risk: 'Low to Moderate', navBase: 3412.55, cagr: 0.068, vol: 0.0008, phase: 0.3, expense: 0.12, aum: 21500, minSip: 500, minLump: 100, exitLoad: 'Tiny, only within 7 days', manager: 'Arjun Mehta', benchmark: 'CRISIL Liquid Debt Index', rating: 5, about: 'Parks money in 91-day treasury bills and similar. Withdraw any working day. Better than a savings account for money you need soon.', top: ['91-day T-bills', '182-day T-bills', 'Bank CDs', 'Commercial paper', 'TREPS'] }),
  fund({ id: 'dhruv-gold', name: 'Dhruv Gold Fund', amc: 'Dhruv MF', category: 'Gold', risk: 'High', navBase: 27.6, cagr: 0.13, vol: 0.1, phase: 3.9, expense: 0.42, aum: 3200, minSip: 100, minLump: 100, exitLoad: '1% if sold within 15 days', manager: 'Pooja Desai', benchmark: 'Domestic price of gold', rating: 4, about: 'Holds a gold ETF, so you own gold without lockers or making charges. Often rises when stocks fall.', top: ['Dhruv Gold ETF'] }),
  fund({ id: 'yatra-us', name: 'Yatra US Tech Fund of Fund', amc: 'Yatra MF', category: 'International', risk: 'Very High', navBase: 19.85, cagr: 0.17, vol: 0.26, phase: 4.2, expense: 0.58, aum: 1450, minSip: 500, minLump: 1000, exitLoad: '1% if sold within 1 year', manager: 'Daniel Mathew', benchmark: 'NASDAQ-100 (in ₹)', rating: 3, about: 'Invests in a US fund that holds big American tech companies. Your returns also move with the dollar.', top: ['US tech index fund (units)'] }),
];

export const COLLECTIONS: { id: string; label: string; match: (f: Fund) => boolean }[] = [
  { id: 'popular', label: 'Popular', match: (f) => ['lakshya-nifty50', 'setu-flexi', 'udaan-small', 'neev-liquid', 'sagar-mid', 'kosh-elss'].includes(f.id) },
  { id: 'index', label: 'Index funds', match: (f) => f.category === 'Index' },
  { id: 'tax', label: 'Tax saving', match: (f) => f.category === 'ELSS' },
  { id: 'safe', label: 'Low risk', match: (f) => RISKS.indexOf(f.risk) <= 2 },
  { id: 'high', label: 'High return', match: (f) => f.cagr >= 0.16 },
  { id: 'gold', label: 'Gold', match: (f) => f.category === 'Gold' },
  { id: 'all', label: 'All funds', match: () => true },
];

function navAtRaw(f: Fund, ms: number): number {
  const yrs = (ms - EPOCH) / (365 * DAY);
  if (f.tracks) {
    const idx = INDICES.find((x) => x.id === f.tracks)!;
    return f.navBase * (priceAt(idx, ms) / priceAt(idx, EPOCH)) * Math.exp((-f.expense / 100) * yrs);
  }
  const d = (ms - EPOCH) / DAY;
  const seed = seedOf(f.id);
  const wave = 0.6 * Math.sin(d / 47 + f.phase) + 0.3 * Math.sin(d / 13 + 2 * f.phase) + 0.25 * vnoise(d * 1.1, seed);
  return f.navBase * Math.exp(f.cagr * yrs) * (1 + wave * f.vol * 0.35);
}

/** NAV for the trading day containing `ms` (published at that day's close). */
export function navOn(f: Fund, day: number): number {
  return Math.round(navAtRaw(f, day + CLOSE) * 10000) / 10000;
}

/** The latest published NAV, its day, and the change from the day before. */
export function nav(f: Fund, now = Date.now()): { nav: number; day: number; prev: number; pct: number } {
  const s = session(now);
  const day = s.open ? prevTradingDay(s.day) : s.day;
  const v = navOn(f, day);
  const prev = navOn(f, prevTradingDay(day));
  return { nav: v, day, prev, pct: ((v - prev) / prev) * 100 };
}

/** Annualised return over `years` (absolute when under a year). */
export function fundReturn(f: Fund, years: number, now = Date.now()): number {
  const n = nav(f, now);
  let then = istDayStart(n.day - years * 365 * DAY);
  if (!isTradingDay(then)) then = prevTradingDay(then);
  const ratio = n.nav / navOn(f, then);
  return (years >= 1 ? Math.pow(ratio, 1 / years) - 1 : ratio - 1) * 100;
}

export type NavRange = '1M' | '6M' | '1Y' | '3Y' | '5Y';
export const NAV_RANGES: NavRange[] = ['1M', '6M', '1Y', '3Y', '5Y'];

export function navSeries(f: Fund, range: NavRange, now = Date.now()): Point[] {
  const n = nav(f, now);
  const span = { '1M': 30, '6M': 182, '1Y': 365, '3Y': 1095, '5Y': 1825 }[range];
  const step = Math.max(1, Math.round(span / 120));
  const pts: Point[] = [];
  for (let k = span; k >= 0; k -= step) {
    let d = istDayStart(n.day - k * DAY);
    if (!isTradingDay(d)) d = prevTradingDay(d);
    if (pts.length && pts[pts.length - 1].t === d + CLOSE) continue;
    pts.push({ t: d + CLOSE, v: navOn(f, d) });
  }
  if (pts[pts.length - 1].t !== n.day + CLOSE) pts.push({ t: n.day + CLOSE, v: n.nav });
  return pts;
}

/** Future value of a monthly SIP. */
export function sipFutureValue(monthly: number, years: number, annualPct: number): { invested: number; value: number } {
  const i = annualPct / 100 / 12;
  const n = Math.round(years * 12);
  const value = i === 0 ? monthly * n : monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  return { invested: monthly * n, value };
}

/* ---------- IPOs: a rolling weekly calendar ---------- */

interface IpoSeed {
  slug: string;
  name: string;
  sector: string;
  about: string;
  band: [number, number];
  lot: number;
  sizeCr: number;
  /** Listing-day move versus the issue price. */
  gain: number;
  /** Final retail subscription, times. */
  retail: number;
  swing: number;
  vol: number;
}

const IPO_POOL: IpoSeed[] = [
  { slug: 'chaiwala', name: 'Chaiwala Brew Co', sector: 'Consumer', about: 'A chain of 640 tea cafés in malls, stations and colleges, with packaged chai on the side. Profitable for the last two years.', band: [182, 192], lot: 78, sizeCr: 640, gain: 0.18, retail: 14.2, swing: 1.4, vol: 0.022 },
  { slug: 'saathi-ev', name: 'Saathi EV Mobility', sector: 'Auto', about: 'Electric scooters for delivery riders, sold with battery swapping. Revenue doubled last year; losses narrowed but haven’t ended.', band: [74, 78], lot: 192, sizeCr: 1200, gain: -0.06, retail: 2.3, swing: 1.8, vol: 0.026 },
  { slug: 'gagan-aero', name: 'Gagan Aerospace Components', sector: 'Defence', about: 'Precision parts for aircraft engines and satellites, mostly exported. Order book covers four years of sales.', band: [412, 433], lot: 34, sizeCr: 880, gain: 0.42, retail: 38.6, swing: 1.6, vol: 0.024 },
  { slug: 'bachat-sfb', name: 'Bachat Small Finance Bank', sector: 'Banking', about: 'Small loans to shopkeepers and farmers in 9 states. This IPO is partly existing owners selling their stake.', band: [58, 61], lot: 245, sizeCr: 1050, gain: 0.03, retail: 4.1, swing: 1.1, vol: 0.018 },
  { slug: 'megh-cloud', name: 'Megh Cloud Datacenters', sector: 'IT', about: 'Runs 6 data centres and rents server space to banks and apps. Needs heavy spending to grow; most of the IPO money funds new buildings.', band: [290, 305], lot: 49, sizeCr: 1480, gain: 0.11, retail: 9.6, swing: 1.3, vol: 0.02 },
  { slug: 'rasoi-ready', name: 'Rasoi Ready Foods', sector: 'FMCG', about: 'Ready-to-cook curries and frozen parathas, sold in modern trade and quick-commerce apps. Thin margins.', band: [128, 135], lot: 111, sizeCr: 410, gain: -0.02, retail: 1.4, swing: 1.2, vol: 0.019 },
];

/** A known Monday, 00:00 IST. */
const MONDAY0 = Date.UTC(2024, 0, 1) - OFF;
const WEEK = 7 * DAY;

export type IpoStatus = 'upcoming' | 'open' | 'closed' | 'allotted' | 'listed';

export interface Ipo extends IpoSeed {
  id: string;
  week: number;
  opensAt: number;
  closesAt: number;
  allotAt: number;
  listAt: number;
  listPrice: number;
}

export function ipoForWeek(week: number): Ipo {
  const seed = IPO_POOL[((week % IPO_POOL.length) + IPO_POOL.length) % IPO_POOL.length];
  const mon = MONDAY0 + week * WEEK;
  return {
    ...seed,
    id: `ipo-${seed.slug}-${week}`,
    week,
    opensAt: mon + DAY + 10 * 60 * MIN,
    closesAt: mon + 3 * DAY + 17 * 60 * MIN,
    allotAt: mon + WEEK + 18 * 60 * MIN,
    listAt: mon + WEEK + 2 * DAY + OPEN,
    listPrice: Math.round(seed.band[1] * (1 + seed.gain) * 20) / 20,
  };
}

export const currentWeek = (now = Date.now()) => Math.floor((now - MONDAY0) / WEEK);

export function ipoStatus(ipo: Ipo, now = Date.now()): IpoStatus {
  if (now < ipo.opensAt) return 'upcoming';
  if (now < ipo.closesAt) return 'open';
  if (now < ipo.allotAt) return 'closed';
  if (now < ipo.listAt) return 'allotted';
  return 'listed';
}

/** Last week's (closing or listing), this week's and next week's issues. */
export function ipoCalendar(now = Date.now()): Ipo[] {
  const w = currentWeek(now);
  return [w + 1, w, w - 1, w - 2].map(ipoForWeek);
}

export function ipoById(id: string): Ipo | undefined {
  const m = /^ipo-(.+)-(-?\d+)$/.exec(id);
  if (!m) return undefined;
  const ipo = ipoForWeek(Number(m[2]));
  return ipo.slug === m[1] ? ipo : undefined;
}

/** Retail subscription so far (times), building through the bidding days. */
export function ipoSubscription(ipo: Ipo, now = Date.now()): number {
  if (now < ipo.opensAt) return 0;
  const k = Math.min(1, (now - ipo.opensAt) / (ipo.closesAt - ipo.opensAt));
  return Math.round(ipo.retail * (0.08 + 0.92 * k * k) * 100) / 100;
}

/** A listed IPO trades like any other stock. */
export function ipoStock(ipo: Ipo): Stock {
  return {
    kind: 'stock', id: ipo.id, name: ipo.name, symbol: ipo.slug.replace(/-/g, '').toUpperCase().slice(0, 10), sector: ipo.sector,
    base: ipo.listPrice, drift: 0.08, swing: ipo.swing, vol: ipo.vol, phase: (ipo.week % 7) * 0.9,
    shares: Math.round((ipo.sizeCr * 4) / ipo.band[1]), pe: 0, pb: 0, div: 0, roe: 0, about: ipo.about,
    listedAt: ipo.listAt, listPrice: ipo.listPrice,
  };
}

/** Allotment is a lottery when retail is oversubscribed: about 1 in N applicants get a lot. */
export function allotted(appId: string, ipo: Ipo): boolean {
  const chance = Math.min(1, 1 / Math.max(1, ipo.retail));
  return (hash(seedOf(appId), seedOf(ipo.id)) + 1) / 2 < chance;
}

/* ---------- Lookup ---------- */

export function findStock(id: string): Stock | undefined {
  const s = STOCKS.find((x) => x.id === id) ?? INDICES.find((x) => x.id === id);
  if (s) return s;
  const ipo = ipoById(id);
  return ipo ? ipoStock(ipo) : undefined;
}

export const findFund = (id: string) => FUNDS.find((f) => f.id === id);

export function searchAll(q: string, now = Date.now()): { stocks: Stock[]; funds: Fund[]; ipos: Ipo[] } {
  const s = q.trim().toLowerCase();
  if (!s) return { stocks: [], funds: [], ipos: [] };
  const hit = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(s));
  return {
    stocks: [...INDICES, ...STOCKS].filter((x) => hit(x.name, x.symbol, x.sector)),
    funds: FUNDS.filter((f) => hit(f.name, f.amc, f.category)),
    ipos: ipoCalendar(now).filter((i) => ipoStatus(i, now) !== 'listed' && hit(i.name, i.sector)),
  };
}

/* ---------- Formatting ---------- */

const p2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,476.20 — prices and NAVs keep their paise. */
export function px(n: number): string {
  return `${n < 0 ? '−' : ''}₹${p2.format(Math.abs(n))}`;
}

export function num2(n: number): string {
  return p2.format(n);
}

/** "Up ₹12.40 (0.8%)", always in words. */
export function moveWords(abs: number, pct: number): string {
  if (Math.abs(pct) < 0.005) return 'Flat today';
  return `${abs < 0 ? 'Down' : 'Up'} ${px(Math.abs(abs)).replace('−', '')} (${Math.abs(pct).toFixed(2)}%)`;
}

export function pctWords(pct: number): string {
  if (Math.abs(pct) < 0.005) return 'Flat';
  return `${pct < 0 ? 'Down' : 'Up'} ${Math.abs(pct).toFixed(2)}%`;
}
