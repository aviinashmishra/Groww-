'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Sheet, AmountField } from './ui';
import { useStore } from '@/lib/store';
import { HIDDEN, parseAmount, rupees } from '@/lib/format';
import { buzz } from '@/lib/fx';
import { addMoney, portfolio } from '@/lib/invest';
import {
  type Fund, type Point, type Stock, RISKS, fundReturn, marketStatus, nav, num2, pctWords, px, quote, session, istDay, istTime,
} from '@/lib/market';

/* ---------- Live clock ---------- */

/** The current time, ticking every 3 s while the market is open and every 30 s otherwise. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  const open = session(now).open;
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), open ? 3000 : 30000);
    return () => clearInterval(id);
  }, [open]);
  return now;
}

export function MarketChip({ now }: { now: number }) {
  const m = marketStatus(now);
  return <span className={`mkt${m.open ? ' on' : ''}`}><i />{m.text}</span>;
}

/* ---------- Money with paise, respecting "Hide amounts" ---------- */

export function MoneyP({ value, className = 'amt', style, signed }: { value: number; className?: string; style?: React.CSSProperties; signed?: boolean }) {
  const { state } = useStore();
  if (state.settings.hideAmounts) return <span className={className} style={{ ...style, color: 'var(--ink3)' }} aria-label="Amount hidden">{HIDDEN}</span>;
  const text = signed ? `${value < 0 ? '−' : '+'}${px(Math.abs(value))}` : px(value);
  return <span className={className} style={style}>{text}</span>;
}

/** "Up ₹1,240 (3.2%)" for your own money, hidden when amounts are hidden. */
export function Returns({ abs, pct, prefix = '' }: { abs: number; pct: number; prefix?: string }) {
  const { state } = useStore();
  const word = Math.abs(abs) < 0.005 ? 'Flat' : abs < 0 ? 'Down' : 'Up';
  if (state.settings.hideAmounts) return <span>{prefix}{word} {Math.abs(pct).toFixed(2)}%</span>;
  return <span>{prefix}{word} {px(Math.abs(abs))} ({Math.abs(pct).toFixed(2)}%)</span>;
}

/* ---------- Logos ---------- */

const HUES = ['#7EE7C7', '#B9BDFF', '#FFD58A', '#FFC2D3', '#9EDCFB', '#D7E9A8', '#F7C6A3', '#C9B8F5'];

export function Logo({ id, name, lg }: { id: string; name: string; lg?: boolean }) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const initials = name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className={`logo${lg ? ' lg' : ''}`} style={{ background: HUES[h % HUES.length] }} aria-hidden="true">{initials}</span>;
}

/* ---------- Sparkline ---------- */

export function Spark({ values, down }: { values: number[]; down?: boolean }) {
  if (values.length < 2) return <svg className="spark" aria-hidden="true" />;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${((i / (values.length - 1)) * 62 + 1).toFixed(1)} ${(26 - ((v - lo) / (hi - lo || 1)) * 24).toFixed(1)}`).join(' ');
  return <svg className={`spark${down ? ' dn' : ''}`} viewBox="0 0 64 28" aria-hidden="true"><path d={d} /></svg>;
}

/* ---------- Price chart with scrubbing ---------- */

export function PriceChart({ points, base, label, height = 190, intraday, onScrub }: {
  points: Point[]; base?: number; label: string; height?: number; intraday?: boolean; onScrub?: (p: Point | null) => void;
}) {
  const gid = useId().replace(/:/g, '');
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 340;
  const H = height;
  const pad = 22;
  const { lo, hi } = useMemo(() => {
    const vs = points.map((p) => p.v);
    if (base !== undefined) vs.push(base);
    const a = Math.min(...vs);
    const b = Math.max(...vs);
    const m = (b - a) * 0.08 || a * 0.01 || 1;
    return { lo: a - m, hi: b + m };
  }, [points, base]);
  if (points.length < 2) return <div className="cap" style={{ height }}>Not enough history yet.</div>;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (H - pad * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const hp = hover !== null ? points[hover] : null;

  const pick = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const k = Math.round(((clientX - r.left) / r.width) * (points.length - 1));
    const i = Math.max(0, Math.min(points.length - 1, k));
    if (i !== hover) {
      setHover(i);
      onScrub?.(points[i]);
      buzz(2);
    }
  };
  const clear = () => {
    setHover(null);
    onScrub?.(null);
  };
  const when = (t: number) => (intraday ? `${istDay(t)}, ${istTime(t)}` : istDay(t) + (points.length > 300 || points[points.length - 1].t - points[0].t > 400 * 86400000 ? ` ${new Date(t).getFullYear()}` : ''));

  return (
    <div
      ref={box}
      className="chart"
      role="img"
      aria-label={label}
      onPointerDown={(e) => pick(e.clientX)}
      onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons ? pick(e.clientX) : undefined)}
      onPointerLeave={clear}
      onPointerUp={(e) => (e.pointerType !== 'mouse' ? clear() : undefined)}
      onPointerCancel={clear}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: H }}>
        <defs>
          <linearGradient id={`cf${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--acc-line)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--acc-line)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {base !== undefined && <path className="base" d={`M0 ${y(base)}H${W}`} vectorEffect="non-scaling-stroke" />}
        <path d={area} fill={`url(#cf${gid})`} />
        <path className="line" d={line} vectorEffect="non-scaling-stroke" />
        {hp && <path className="cross" d={`M${x(hover!)} 0V${H}`} vectorEffect="non-scaling-stroke" />}
      </svg>
      {hp && (
        <>
          <span style={{ position: 'absolute', left: `${(hover! / (points.length - 1)) * 100}%`, top: y(hp.v) - 6, width: 12, height: 12, marginLeft: -6, borderRadius: '50%', background: 'var(--acc-line)', border: '3px solid var(--plate)', pointerEvents: 'none' }} />
          <span className="chart-tip" style={{ left: `clamp(48px, ${(hover! / (points.length - 1)) * 100}%, calc(100% - 48px))` }}>{when(hp.t)}</span>
        </>
      )}
    </div>
  );
}

export function RangeTabs<T extends string>({ ranges, value, onChange }: { ranges: T[]; value: T; onChange: (r: T) => void }) {
  return (
    <div className="ranges" role="group" aria-label="Chart range">
      {ranges.map((r) => (
        <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)}>{r}</button>
      ))}
    </div>
  );
}

/* ---------- Rows ---------- */

export function StockRow({ s, now, sub, href }: { s: Stock; now: number; sub?: React.ReactNode; href?: string }) {
  const q = quote(s, now);
  return (
    <Link href={href ?? `/stocks/${s.id}`} className="plate tk">
      <Logo id={s.id} name={s.name} />
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="med" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
        <span className="cap">{sub ?? (s.kind === 'index' ? 'Index' : s.sector)}</span>
      </span>
      <span className="r">
        <span className="p">{s.kind === 'index' ? num2(q.price) : px(q.price)}</span>
        <span className="cap">{pctWords(q.pct)}</span>
      </span>
    </Link>
  );
}

export function FundRow({ f, now, sub }: { f: Fund; now: number; sub?: React.ReactNode }) {
  const r3 = fundReturn(f, 3, now);
  return (
    <Link href={`/mf/${f.id}`} className="plate tk">
      <Logo id={f.amc} name={f.amc} />
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="med" style={{ lineHeight: 1.25 }}>{f.name}</span>
        <span className="cap">{sub ?? `${f.category} · ${f.risk} risk`}</span>
      </span>
      <span className="r">
        <span className="p">{r3.toFixed(1)}%</span>
        <span className="cap">3Y a year</span>
      </span>
    </Link>
  );
}

/* ---------- Fund bits ---------- */

export function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((k) => <Icon key={k} name="star" className={k <= n ? '' : 'off'} />)}
    </span>
  );
}

export function RiskMeter({ risk }: { risk: Fund['risk'] }) {
  const k = RISKS.indexOf(risk);
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="risk" role="img" aria-label={`Risk: ${risk}, ${k + 1} of 6`}>
        {RISKS.map((r, i) => <i key={r} className={i <= k ? `on${k <= 2 ? ' lo' : ''}` : ''} />)}
      </div>
      <span className="cap">SEBI riskometer: <b className="ink">{risk}</b></span>
    </div>
  );
}

export function navText(f: Fund, now: number) {
  const n = nav(f, now);
  return `NAV ${px(n.nav)} · ${istDay(n.day)}`;
}

/* ---------- KYC gate ---------- */

export function KycNeeded({ next, what }: { next: string; what: string }) {
  return (
    <section className="glass row" style={{ alignItems: 'flex-start', padding: '14px 16px' }}>
      <div className="ico w"><Icon name="shield" /></div>
      <div className="col grow" style={{ gap: 8 }}>
        <span className="med">Finish KYC to {what}</span>
        <span className="cap">PAN and a bank account. About two minutes, done once.</span>
        <Link className="chip big acc" href={`/kyc?next=${encodeURIComponent(next)}`} style={{ alignSelf: 'flex-start' }}>Start KYC<Icon name="arrowR" small /></Link>
      </div>
    </section>
  );
}

/* ---------- Add money to the balance ---------- */

const METHODS: { id: string; label: string; sub: string }[] = [
  { id: 'UPI', label: 'UPI', sub: 'Approve in any UPI app' },
  { id: 'net banking', label: 'Net banking', sub: 'Log in to your bank' },
];

export function AddFundsSheet({ onClose, need = 0, title = 'Add money' }: { onClose: () => void; need?: number; title?: string }) {
  const { state, update, toast } = useStore();
  const bank = state.invest.kyc.bank;
  const [amount, setAmount] = useState(String(Math.max(100, Math.ceil(need / 100) * 100) || 1000));
  const [method, setMethod] = useState(METHODS[0].id);
  const [phase, setPhase] = useState<'form' | 'paying'>('form');
  const n = parseAmount(amount);

  const pay = () => {
    setPhase('paying');
    setTimeout(() => {
      update((d) => addMoney(d, n, method));
      toast(`${rupees(n)} added to your balance`);
      buzz([10, 30, 20]);
      onClose();
    }, 1400);
  };

  return (
    <Sheet open onClose={phase === 'paying' ? () => {} : onClose} label={title}>
      {phase === 'paying' ? (
        <div className="col" style={{ alignItems: 'center', gap: 14, padding: '26px 0' }}>
          <div className="spin-ring" />
          <span className="h2">Waiting for your bank…</span>
          <span className="cap center">{method === 'UPI' ? 'Approve the request in your UPI app.' : 'Finish the payment on your bank’s page.'} This is a demo, so it approves itself.</span>
        </div>
      ) : (
        <>
          <h2 className="h1" style={{ fontSize: 26 }}>{title}</h2>
          {need > 0 && <p className="body">You need {px(need)} more for this order.</p>}
          <AmountField id="add-bal" label="Amount" value={amount} onChange={setAmount} />
          <div className="row wrap" style={{ gap: 6 }}>
            {[500, 1000, 5000, 10000].map((p) => (
              <button key={p} type="button" className="chip" aria-pressed={n === p} onClick={() => setAmount(String(p))}>+{rupees(p)}</button>
            ))}
          </div>
          <fieldset className="col" style={{ gap: 6, border: 0, margin: 0, padding: 0 }}>
            <legend className="eye" style={{ padding: '0 4px', marginBottom: 8 }}>Pay with</legend>
            {METHODS.map((m) => (
              <button key={m.id} type="button" className={`plate row${method === m.id ? ' you' : ''}`} aria-pressed={method === m.id} onClick={() => setMethod(m.id)} style={{ minHeight: 52 }}>
                <div className="ico n"><Icon name={m.id === 'UPI' ? 'bolt' : 'bank'} /></div>
                <span className="col grow"><span className="med">{m.label}</span><span className="cap">{bank ? `${bank.name} ••${bank.last4}` : m.sub}</span></span>
                <span className={`dot${method === m.id ? '' : ' o'}`} />
              </button>
            ))}
          </fieldset>
          {n > 0 && n < 100 && <p className="err">The minimum is ₹100.</p>}
          {n > 500000 && <p className="err">Up to ₹5,00,000 at a time.</p>}
          <button className="btn" disabled={n < 100 || n > 500000} onClick={pay}>Add {n >= 100 ? rupees(n) : ''}</button>
          <p className="cap center">Only from a bank account in your name. Demo: no real money moves.</p>
        </>
      )}
    </Sheet>
  );
}

/* ---------- Home card ---------- */

export function InvestCard() {
  const { state } = useStore();
  const now = useNow();
  const inv = state.invest;
  const pf = portfolio(inv, now);
  const has = inv.positions.length + inv.funds.length > 0;
  const nextSip = inv.sips.filter((x) => x.status === 'active').sort((a, b) => a.nextAt - b.nextAt)[0];
  return (
    <Link href={inv.kyc.status === 'verified' ? '/portfolio' : '/invest'} className="glass row" style={{ padding: '14px 16px', alignItems: 'center' }}>
      <div className="ico"><Icon name="trend" /></div>
      <div className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="eye">Investments</span>
        {inv.kyc.status !== 'verified' ? (
          <span className="med">Stocks, funds and SIPs: finish KYC to start</span>
        ) : has ? (
          <>
            <MoneyP value={pf.total.current} className="amt" />
            <span className="cap"><Returns abs={pf.total.ret} pct={pf.total.retPct} prefix="Overall " />{nextSip ? ` · next SIP ${istDay(nextSip.nextAt)}` : ''}</span>
          </>
        ) : (
          <span className="med">Start with an index fund, from ₹100</span>
        )}
      </div>
      <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
    </Link>
  );
}
