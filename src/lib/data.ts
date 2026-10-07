import type { Bucket, Credit, Holding, Member, Move, Note, OwnNumbers, PersonaId, Pot, Spend, SpendCat, State, TipRecord } from './types';
import { daysFromNow, monthsAgo, uid } from './format';
import { FUN_STOCK_IDS, INDICES, STOCKS as MARKET_STOCKS, quote, stockPrice } from './market';
import { initialInvest } from './invest';

/* ---------- Personas: the three Home screens on the canvas ---------- */

export interface Persona {
  id: PersonaId;
  label: string;
  blurb: string;
  defaultName: string;
  monthlyIncome: number;
  monthlySpend: number;
  monthsIn: number;
  /** Runway goal: months for earners, days for students. */
  runwayGoal: number;
  runwayUnit: 'months' | 'days';
  pots: Pot[];
}

const pot = (id: string, bucket: Bucket, name: string, balance: number, target: number): Pot => ({ id, bucket, name, balance, target });

export const PERSONAS: Record<PersonaId, Persona> = {
  salary: {
    id: 'salary',
    label: 'First salary',
    blurb: 'A monthly salary just started landing',
    defaultName: 'Avi',
    monthlyIncome: 42000,
    monthlySpend: 31500,
    monthsIn: 12,
    runwayGoal: 6,
    runwayUnit: 'months',
    pots: [
      pot('soon', 'soon', 'Goa trip · Dec', 18000, 25000),
      pot('later', 'later', 'Bike down payment', 24400, 60000),
      pot('never', 'never', 'Emergency + index', 30000, 190000),
    ],
  },
  student: {
    id: 'student',
    label: 'Student',
    blurb: 'Pocket money, no salary yet',
    defaultName: 'Avi',
    monthlyIncome: 6000,
    monthlySpend: 6000,
    monthsIn: 2,
    runwayGoal: 30,
    runwayUnit: 'days',
    pots: [
      pot('soon', 'soon', 'Concert ticket', 900, 2500),
      pot('later', 'later', 'Laptop fund', 750, 45000),
      pot('never', 'never', 'Index fund starter', 500, 6000),
    ],
  },
  irregular: {
    id: 'irregular',
    label: 'Irregular earner',
    blurb: 'Freelance, gigs, stipends on random dates',
    defaultName: 'Avi',
    monthlyIncome: 22000,
    monthlySpend: 22000,
    monthsIn: 9,
    runwayGoal: 3,
    runwayUnit: 'months',
    pots: [
      pot('soon', 'soon', 'Dry-month buffer', 15000, 22000),
      pot('later', 'later', 'Camera lens', 8200, 38000),
      pot('never', 'never', 'Index fund', 12000, 66000),
    ],
  },
};

export const BUCKET_LABEL: Record<Bucket, string> = { soon: 'Soon', later: 'Later', never: 'Never touch' };

/* ---------- Crash Simulator: a ₹10,000 path shaped on Nifty 50, 2015–2025 ---------- */

export const CRASH_START = 2015;
export const CRASH_MONTHS = 121; // Jan 2015 … Jan 2025
export const CRASH_DECISION = 62; // March 2020
export const CRASH_PEAK = 60; // January 2020

const ANCHORS: [number, number][] = [
  [0, 10000], [2, 10600], [13, 8600], [23, 9900], [35, 12400], [44, 13000], [46, 12100],
  [59, 14300], [60, 14900], [61, 13500], [62, 9200], [65, 11800], [71, 16000], [81, 21500],
  [89, 18600], [95, 21000], [98, 19800], [107, 25500], [116, 30800], [120, 28400],
];

export const CRASH_SERIES: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < CRASH_MONTHS; i++) {
    const k = ANCHORS.findIndex(([m]) => m >= i);
    const [m1, v1] = ANCHORS[k];
    if (m1 === i) { out.push(v1); continue; }
    const [m0, v0] = ANCHORS[k - 1];
    const t = (i - m0) / (m1 - m0);
    const base = v0 + (v1 - v0) * t;
    out.push(Math.round(base * (1 + 0.014 * Math.sin(i * 1.7) * Math.sin(Math.PI * t))));
  }
  return out;
})();

export function crashMonthLabel(i: number): string {
  const d = new Date(CRASH_START, i, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/* ---------- Tip Check: a demo dataset of fictional companies ---------- */

export interface Company {
  id: string;
  name: string;
  aliases: string[];
  size: string;
  profit: string;
  pledged: string;
  price30: string;
  trading: string;
  /** Price change 90 days after a check, for the Tip Graveyard (null = halted). */
  after90: number | null;
  nifty90: number;
}

export const COMPANIES: Company[] = [
  { id: 'zentra', name: 'Zentra Polymers Ltd', aliases: ['zentra', 'zentra polymers'], size: 'Small · ₹420 Cr', profit: 'Loss in 2 of 3', pledged: '38%', price30: 'Up 64%', trading: 'Thin, hard to exit', after90: -36, nifty90: 2.6 },
  { id: 'kavach', name: 'Kavach Infra Ltd', aliases: ['kavach', 'kavach infra'], size: 'Small · ₹610 Cr', profit: 'Loss in 3 of 3', pledged: '52%', price30: 'Up 41%', trading: 'Thin, hard to exit', after90: -41, nifty90: 3.4 },
  { id: 'orbit', name: 'Orbit Fintech Ltd', aliases: ['orbit', 'orbit fintech'], size: 'Micro · ₹95 Cr', profit: 'Loss in 2 of 3', pledged: '61%', price30: 'Up 120%', trading: 'Very thin', after90: null, nifty90: 2.9 },
  { id: 'nirmal', name: 'Nirmal Agro Ltd', aliases: ['nirmal', 'nirmal agro'], size: 'Small · ₹1,150 Cr', profit: 'Profit in 3 of 3', pledged: '0%', price30: 'Up 12%', trading: 'Moderate', after90: 8, nifty90: 3.1 },
  { id: 'trishul', name: 'Trishul Chemicals Ltd', aliases: ['trishul', 'trishul chem', 'trishul chemicals'], size: 'Small · ₹780 Cr', profit: 'Profit in 1 of 3', pledged: '22%', price30: 'Up 33%', trading: 'Thin', after90: -12, nifty90: 2.2 },
  { id: 'meghdoot', name: 'Meghdoot Logistics Ltd', aliases: ['meghdoot', 'meghdoot logistics'], size: 'Mid · ₹6,400 Cr', profit: 'Profit in 3 of 3', pledged: '4%', price30: 'Up 9%', trading: 'Healthy', after90: 6, nifty90: 3.8 },
  { id: 'saffron', name: 'Saffron Textiles Ltd', aliases: ['saffron', 'saffron textiles'], size: 'Micro · ₹140 Cr', profit: 'Loss in 2 of 3', pledged: '44%', price30: 'Up 78%', trading: 'Very thin', after90: -29, nifty90: 2.4 },
  { id: 'vayu', name: 'Vayu Renewables Ltd', aliases: ['vayu', 'vayu renewables'], size: 'Small · ₹980 Cr', profit: 'Loss in 1 of 3', pledged: '18%', price30: 'Up 52%', trading: 'Thin', after90: -18, nifty90: 3.0 },
  { id: 'koshi', name: 'Koshi Pharma Ltd', aliases: ['koshi', 'koshi pharma'], size: 'Small · ₹530 Cr', profit: 'Loss in 2 of 3', pledged: '35%', price30: 'Up 47%', trading: 'Thin, hard to exit', after90: -22, nifty90: 2.7 },
  { id: 'deccan', name: 'Deccan Foods Ltd', aliases: ['deccan', 'deccan foods'], size: 'Small · ₹890 Cr', profit: 'Profit in 2 of 3', pledged: '9%', price30: 'Up 21%', trading: 'Moderate', after90: 4, nifty90: 3.5 },
  { id: 'arjun', name: 'Arjun Steel Tubes Ltd', aliases: ['arjun', 'arjun steel'], size: 'Micro · ₹210 Cr', profit: 'Loss in 3 of 3', pledged: '57%', price30: 'Up 90%', trading: 'Very thin', after90: -47, nifty90: 2.8 },
  { id: 'sindhu', name: 'Sindhu Media Ltd', aliases: ['sindhu', 'sindhu media'], size: 'Micro · ₹75 Cr', profit: 'Loss in 2 of 3', pledged: '29%', price30: 'Up 66%', trading: 'Very thin', after90: -33, nifty90: 3.2 },
];

/** Demo register: in production this is a lookup against SEBI's public list. */
export const TIPSTERS: Record<string, boolean> = {
  'paisa.guru.raj': false,
  'stockwali.didi': false,
  'multibagger.mafia': false,
  'finplan.with.anaya': true,
  'ria.advisory.in': true,
};

export function findCompany(q: string): Company | undefined {
  const s = q.trim().toLowerCase().replace(/\s+(ltd|limited)\.?$/, '');
  if (!s) return undefined;
  return COMPANIES.find((c) => c.aliases.includes(s) || c.name.toLowerCase().startsWith(s) || c.aliases.some((a) => s.includes(a)));
}

/* ---------- Fun Pot: fictional large caps, on the same tape as the Invest tab ---------- */

export type { Stock } from './market';
export { stockPrice } from './market';
export const STOCKS = MARKET_STOCKS.filter((s) => FUN_STOCK_IDS.includes(s.id));

/** "Market today": the demo Nifty 50's move, in percent, to one decimal. */
export function marketToday(at = new Date()): number {
  const nifty = INDICES.find((x) => x.id === 'nifty50')!;
  return Math.round(quote(nifty, at.getTime()).pct * 10) / 10;
}

/* ---------- F&O quiz ---------- */

export const QUIZ = [
  { q: 'An option you bought expires out of the money. What is it worth?', a: ['Whatever you paid for it', '₹0', 'Half of what you paid'], right: 1 },
  { q: 'In SEBI’s study of individual F&O traders, roughly how many lost money?', a: ['About 1 in 2', 'About 3 in 10', 'About 9 in 10'], right: 2 },
  { q: 'Who is usually on the other side of your F&O trade?', a: ['Another beginner', 'Professional firms with faster systems', 'The exchange itself'], right: 1 },
  { q: 'When do you pay brokerage, STT and taxes on a trade?', a: ['Only when you win', 'Win or lose, every trade', 'Only on big trades'], right: 1 },
  { q: 'Your loss limit is ₹1,000. What happens when you hit it?', a: ['F&O locks till the 1st of next month', 'You get a warning, then keep trading', 'Nothing until ₹2,000'], right: 0 },
];

/* ---------- Seeds ---------- */

const at = (daysAgo: number, hour = 11) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

function seedCredits(p: PersonaId): Credit[] {
  if (p !== 'irregular') return [];
  return [
    { id: uid(), source: 'UPI · Rhea, logo work', amount: 4500, at: at(4), kind: 'income', status: 'invested', share: 10 },
    { id: uid(), source: 'UPI · Tuition, class 9 batch', amount: 3000, at: at(10), kind: 'income', status: 'invested', share: 10 },
    { id: uid(), source: 'Refund · online order', amount: 899, at: at(15), kind: 'refund', status: 'ignored', share: 10 },
  ];
}

function seedMoves(p: PersonaId): Move[] {
  const scale = p === 'salary' ? 1 : p === 'irregular' ? 0.45 : 0.05;
  const r = (n: number) => Math.round((n * scale) / 10) * 10;
  return [
    { id: uid(), label: 'Sold on a bad-news day in June', detail: 'Bought back 11 days later, higher', impact: -r(1120), at: monthsAgo(4) },
    { id: uid(), label: 'Switched to a small-cap fund', detail: 'September, after a reel', impact: -r(940), at: monthsAgo(1) },
    { id: uid(), label: 'Added extra in January', detail: "Your twin didn't. Well played.", impact: r(220), at: monthsAgo(9) },
  ];
}

function seedTips(): TipRecord[] {
  const list: [string, string, string, number][] = [
    ['kavach', 'Telegram group', '', 97],
    ['orbit', 'WhatsApp', '', 101],
    ['nirmal', 'Reel', 'stockwali.didi', 110],
    ['trishul', 'Reel', 'paisa.guru.raj', 125],
    ['saffron', 'Reel', 'multibagger.mafia', 140],
    ['vayu', 'Telegram group', '', 152],
    ['koshi', 'WhatsApp', '', 166],
    ['deccan', 'Reel', 'finplan.with.anaya', 175],
    ['arjun', 'Reel', 'paisa.guru.raj', 190],
    ['sindhu', 'Telegram group', '', 204],
    ['meghdoot', 'WhatsApp', '', 220],
    ['zentra', 'Reel', 'stockwali.didi', 240],
  ];
  return list.map(([companyId, source, handle, ago]) => ({
    id: uid(), companyId, source, handle: handle || undefined, checkedAt: at(ago), parked: true,
  }));
}

function seedHoldings(p: PersonaId): { cash: number; holdings: Holding[] } {
  if (p === 'student') return { cash: 0, holdings: [] };
  const mk = (stockId: string, cost: number, ago: number): Holding => {
    const s = STOCKS.find((x) => x.id === stockId)!;
    const when = new Date(Date.now() - ago * 86400000);
    return { id: uid(), stockId, units: Math.round((cost / stockPrice(s, when)) * 1000) / 1000, cost, at: when.toISOString() };
  };
  if (p === 'irregular') return { cash: 600, holdings: [mk('bharatgrid', 1500, 60)] };
  return { cash: 1100, holdings: [mk('indusdigital', 2400, 120), mk('bharatgrid', 1600, 45)] };
}

function seedMembers(): Member[] {
  return [
    { id: 'dev', name: 'Dev', landings: [true, true, true, true, true, true, true, true], share: 11800 },
    { id: 'sana', name: 'Sana', landings: [true, true, true, false, true, true, true, true], share: 9600 },
    { id: 'you', name: 'You', landings: [], share: 9300, isYou: true },
    { id: 'kabir', name: 'Kabir', landings: [true, true, true, false, false, false, false, false], share: 6500 },
  ];
}

function nextDecember(): string {
  const now = new Date();
  let d = new Date(now.getFullYear(), 11, 15);
  if (d.getTime() < now.getTime()) d = new Date(now.getFullYear() + 1, 11, 15);
  return d.toISOString();
}

export const AVATAR_COLORS = ['#00D09C', '#7B83F0', '#F5A524', '#FF8FB1', '#3BB4F2', '#0B1A19'];

/**
 * A fresh state. With `own` numbers it starts from the user's real income, spend and
 * savings, with no sample history; without, it loads the persona's sample data.
 */
export function createState(persona: PersonaId, name?: string, onboarded = false, own?: OwnNumbers): State {
  const p = PERSONAS[persona];
  const sample = !own;
  const welcome: Note = {
    id: uid(), at: new Date().toISOString(), read: false, href: '/crash',
    title: 'Your Learner’s licence starts here',
    body: 'Ninety seconds in the Crash Simulator. Play money, real history.',
  };
  const ownPots: Pot[] = own
    ? [
        pot('soon', 'soon', p.pots[0].name, 0, Math.max(1000, Math.round((own.spend * 0.5) / 500) * 500)),
        pot('later', 'later', p.pots[1].name, 0, Math.max(5000, Math.round((own.spend * 2) / 1000) * 1000)),
        pot('never', 'never', 'Emergency + index', Math.max(0, own.savings), Math.max(5000, Math.round((own.spend * (p.runwayUnit === 'days' ? 1 : p.runwayGoal)) / 1000) * 1000)),
      ]
    : p.pots.map((x) => ({ ...x }));
  return {
    v: 1,
    onboarded,
    sample,
    avatar: AVATAR_COLORS[Math.floor(Math.random() * 5)],
    persona,
    name: name?.trim() || p.defaultName,
    joinedAt: sample ? monthsAgo(p.monthsIn) : new Date().toISOString(),
    monthlyIncome: own ? own.income : p.monthlyIncome,
    monthlySpend: own ? Math.max(1, own.spend) : p.monthlySpend,
    pots: ownPots,
    lands: {
      enabled: sample && persona === 'irregular',
      share: 10,
      potId: 'never',
      history: sample && persona === 'irregular' ? [true, true, false, true, true, true, true, false] : [],
    },
    credits: sample ? seedCredits(persona) : [],
    crash: { attempts: 0, held: null },
    twin: { moves: sample ? seedMoves(persona) : [], pauseBeforeSell: false },
    tips: sample ? seedTips() : [],
    fun: { ...(sample ? seedHoldings(persona) : { cash: 0, holdings: [] }), quizPassed: false, lossLimit: 1000, foUnlocked: false },
    circle: { name: 'Hostel 4B', members: seedMembers(), goal: { name: 'Goa, December', target: 60000, deadline: nextDecember() } },
    shaguns: [],
    claimedShaguns: [],
    notes: [welcome],
    stickers: [],
    snapshots: [],
    spends: sample ? seedSpends(persona) : [],
    jar: { balance: sample ? (persona === 'student' ? 64 : 186) : 0, step: 10, multiplier: 1, swept: 0, on: true },
    moods: [],
    wishes: [],
    settings: { hideAmounts: false, theme: 'light', lite: false, language: 'hinglish', haptics: true, lock: null },
    invest: initialInvest(persona, sample),
  };
}
function seedSpends(p: PersonaId): Spend[] {
  const list: [string, number, SpendCat, number][] = p === 'student'
    ? [['Chai + samosa', 46, 'food', 0], ['Metro card top-up', 200, 'travel', 1], ['Maggi, hostel canteen', 64, 'food', 1], ['Notebook', 117, 'shopping', 2], ['Movie, student ticket', 180, 'fun', 3]]
    : [['Swiggy · biryani', 342, 'food', 0], ['Uber to office', 186, 'travel', 0], ['Blinkit groceries', 613, 'food', 1], ['Phone recharge', 299, 'bills', 2], ['Zara sale', 1499, 'shopping', 3], ['BookMyShow', 418, 'fun', 4], ['Rapido', 73, 'travel', 5]];
  return list.map(([what, amount, cat, ago]) => ({ id: uid(), what, amount, cat, at: at(ago, 13), roundup: Math.ceil(amount / 10) * 10 - amount }));
}

export const SPEND_CATS: Record<SpendCat, string> = { food: 'Food', travel: 'Travel', shopping: 'Shopping', fun: 'Fun', bills: 'Bills' };

/* ---------- Jargon Buster ---------- */

export const GLOSSARY: { term: string; short: string; long: string }[] = [
  { term: 'Index fund', short: 'One fund that buys the whole index.', long: 'Instead of picking stocks, it holds all 50 Nifty companies in the same proportions as the index. Low cost, no star fund manager, no single-company bet.' },
  { term: 'SIP', short: 'A fixed amount invested automatically, every month.', long: 'Systematic Investment Plan. You buy more units when prices are low and fewer when high, without timing anything. Invest What Lands is a SIP without the fixed date.' },
  { term: 'Nifty 50', short: 'India’s 50 biggest listed companies, as one number.', long: 'An index run by the NSE. When people say “the market fell 2%”, they usually mean this number.' },
  { term: 'Expense ratio', short: 'The yearly fee a fund charges, as a percent.', long: 'Taken quietly from your money every year. 0.2% vs 1.5% sounds tiny but over 20 years it can eat a big slice of your returns.' },
  { term: 'Compounding', short: 'Returns that earn their own returns.', long: '₹1,000 growing 10% becomes ₹1,100, then ₹1,210, not ₹1,200. Small at first, then it bends upward. Time matters more than amount.' },
  { term: 'Emergency fund', short: 'Money that exists so you don’t have to sell.', long: 'Usually 3–6 months of expenses, kept somewhere boring and instantly available. It’s why your Never touch pot can stay untouched.' },
  { term: 'Runway', short: 'How long your savings would last with zero income.', long: 'Savings divided by monthly spend. Two months of runway means you could lose your income and be fine for two months.' },
  { term: 'Liquid fund', short: 'A mutual fund you can withdraw from in a day.', long: 'Holds very short-term government and company debt. Low risk, low return, but better than a savings account for money you need soon.' },
  { term: 'Debt fund', short: 'A fund that lends money instead of owning companies.', long: 'Earns interest from bonds. Steadier than stocks, used for goals 1–3 years away, like your Later pot.' },
  { term: 'F&O', short: 'Futures and options: bets on where a price will go, with a deadline.', long: 'Leverage makes gains and losses bigger than the money you put in. SEBI found about 9 in 10 individual traders lost money.' },
  { term: 'SEBI', short: 'India’s market regulator.', long: 'Registers advisers and analysts. A SEBI-registered adviser can be held accountable; a random reel can’t.' },
  { term: 'Pledged shares', short: 'Shares a promoter has used as loan collateral.', long: 'If the price falls, lenders may sell them, which can push the price down more. High pledging is a warning sign.' },
  { term: 'Market cap', short: 'What the whole company is worth on the market.', long: 'Share price × number of shares. Small caps (under ~₹5,000 Cr) move wildly and are easier to manipulate.' },
  { term: 'Diversification', short: 'Not putting all your eggs in one basket.', long: 'Owning many companies so one bad one doesn’t sink you. An index fund diversifies in one purchase.' },
  { term: 'NAV', short: 'The price of one unit of a mutual fund.', long: 'Net Asset Value, updated once a day. A low NAV doesn’t mean cheap; it just means smaller units.' },
  { term: 'KYC', short: 'Proving who you are before you invest.', long: 'PAN, Aadhaar and a selfie. Done once, works across most investment apps.' },
  { term: 'Capital gains tax', short: 'Tax on profit when you sell.', long: 'Equity held over a year is long-term and taxed lower than short-term gains. Another reason the Lazy Twin wins.' },
  { term: 'Inflation', short: 'Prices creeping up every year.', long: 'At 6% inflation, ₹1,000 today buys what ₹560 buys in 10 years. Money sitting idle quietly shrinks.' },
  { term: 'Pump and dump', short: 'Hype a tiny stock, sell to the people who buy the hype.', long: 'Common in Telegram and reel tips. The tipster buys first, the followers buy after, the tipster sells to them.' },
  { term: 'Round-up', short: 'Investing the spare change from your spends.', long: 'Spend ₹342, round up to ₹350, invest the ₹8. Your Chillar Jar does this quietly.' },
];

export const SHAGUN_DAYS = 30;
export const claimDeadline = () => daysFromNow(SHAGUN_DAYS);
