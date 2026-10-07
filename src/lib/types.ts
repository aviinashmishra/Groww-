export type PersonaId = 'salary' | 'student' | 'irregular';
export type Bucket = 'soon' | 'later' | 'never';
export type Language = 'en' | 'hinglish' | 'hi' | 'mr';
export type ThemePref = 'auto' | 'light' | 'dark';

export interface Pot {
  id: string;
  name: string;
  bucket: Bucket;
  balance: number;
  target: number;
  /** Created from Worth it? to save for a thing instead of buying it now. */
  wish?: boolean;
}

export type CreditKind = 'income' | 'refund' | 'self';
export type CreditStatus = 'pending' | 'invested' | 'skipped' | 'ignored';

export interface Credit {
  id: string;
  source: string;
  amount: number;
  at: string;
  kind: CreditKind;
  status: CreditStatus;
  /** Share (percent) locked in when the credit landed. */
  share: number;
  /** When a pending credit invests itself. */
  cutoff?: string;
}

export interface Move {
  id: string;
  label: string;
  detail: string;
  /** Rupees gained (+) or lost (−) against the Lazy Twin. */
  impact: number;
  at: string;
}

export interface TipRecord {
  id: string;
  companyId: string;
  source: string;
  handle?: string;
  quote?: string;
  checkedAt: string;
  parked: boolean;
  /** Checked by the user, not seed data. */
  mine?: boolean;
}

export interface Holding {
  id: string;
  stockId: string;
  units: number;
  cost: number;
  at: string;
}

export interface Member {
  id: string;
  name: string;
  landings: boolean[];
  share: number;
  isYou?: boolean;
  lastNudgedAt?: string;
}

export interface Shagun {
  id: string;
  to: string;
  relation: string;
  occasion: string;
  amount: number;
  message: string;
  from: string;
  createdAt: string;
  claimBy: string;
  shared: boolean;
  claimed: boolean;
}

export interface Note {
  id: string;
  at: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
}

export type SpendCat = 'food' | 'travel' | 'shopping' | 'fun' | 'bills';

export interface Spend {
  id: string;
  at: string;
  what: string;
  amount: number;
  cat: SpendCat;
  /** Spare change sent to the Chillar Jar for this spend. */
  roundup: number;
}

export interface Wish {
  id: string;
  name: string;
  price: number;
  at: string;
  status: 'cooling' | 'bought' | 'dropped' | 'saving';
  potId?: string;
}

export interface State {
  v: 1;
  onboarded: boolean;
  persona: PersonaId;
  name: string;
  joinedAt: string;
  monthlyIncome: number;
  monthlySpend: number;
  pots: Pot[];
  lands: { enabled: boolean; share: number; potId: string; history: boolean[] };
  credits: Credit[];
  crash: { attempts: number; held: boolean | null; at?: string };
  twin: { moves: Move[]; pauseBeforeSell: boolean; sleepUntil?: string };
  tips: TipRecord[];
  fun: {
    cash: number;
    holdings: Holding[];
    quizPassed: boolean;
    coolingStartedAt?: string;
    lossLimit: number;
    foUnlocked: boolean;
  };
  circle: {
    name: string;
    members: Member[];
    goal: { name: string; target: number; deadline: string };
  };
  shaguns: Shagun[];
  claimedShaguns: string[];
  notes: Note[];
  lastSplitMonth?: string;
  /** Sticker ids already earned (celebrated once). */
  stickers: string[];
  /** One savings snapshot per day, for the weekly recap. */
  snapshots: { day: string; saved: number }[];
  spends: Spend[];
  jar: { balance: number; step: 10 | 50 | 100; multiplier: 1 | 2 | 3; swept: number; on: boolean };
  /** Money mood, 1 (stressed) to 5 (in control), one per day. */
  moods: { day: string; mood: number }[];
  wishes: Wish[];
  settings: { hideAmounts: boolean; theme: ThemePref; lite: boolean; language: Language };
}
