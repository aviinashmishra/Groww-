'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Screen, TopBar, Sheet, AmountField, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Logo, MoneyP, PriceChart, RangeTabs, Returns, RiskMeter, Stars, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { type Fund, type NavRange, type Point, NAV_RANGES, findFund, fundReturn, istDate, istDay, nav, navSeries, px, sipFutureValue } from '@/lib/market';
import { buyFund, ordinal, redeemFund, redeemableUnits, startSip } from '@/lib/invest';
import { parseAmount, rupees } from '@/lib/format';
import { buzz } from '@/lib/fx';

export default function FundPage() {
  const { id } = useParams<{ id: string }>();
  const f = findFund(id);
  if (!f) {
    return (
      <Screen>
        <TopBar back="/invest?tab=funds" label="Mutual fund" />
        <h1 className="h1">We couldn’t find that fund.</h1>
        <div className="foot"><Link className="btn" href="/invest?tab=funds">See all funds</Link></div>
      </Screen>
    );
  }
  return <FundView f={f} />;
}

function FundView({ f }: { f: Fund }) {
  const { state, update, toast } = useStore();
  const now = useNow();
  const inv = state.invest;
  const [range, setRange] = useState<NavRange>('1Y');
  const [scrub, setScrub] = useState<Point | null>(null);
  const [sheet, setSheet] = useState<null | 'sip' | 'lump' | 'redeem'>(null);
  const n = nav(f, now);
  const pts = useMemo(() => navSeries(f, range, now), [f, range, now]);
  const first = pts[0]?.v ?? n.nav;
  const shown = scrub?.v ?? n.nav;
  const r = { 1: fundReturn(f, 1, now), 3: fundReturn(f, 3, now), 5: fundReturn(f, 5, now) };
  const pos = inv.funds.find((p) => p.fundId === f.id);
  const sips = inv.sips.filter((x) => x.fundId === f.id);
  const processing = inv.mfOrders.filter((o) => o.fundId === f.id && o.status === 'processing');
  const watched = inv.watch.includes(f.id);

  const [calcAmt, setCalcAmt] = useState(f.minSip >= 500 ? 1000 : 500);
  const [calcYrs, setCalcYrs] = useState(10);
  const rate = Math.max(4, Math.min(16, r[5] || r[3]));
  const fv = sipFutureValue(calcAmt, calcYrs, rate);

  return (
    <Screen orbs="c" nav={false}>
      <div className="row sp">
        <TopBar back="/invest?tab=funds" label={f.category} />
        <button
          className="av"
          aria-pressed={watched}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          onClick={() => {
            update((d) => { d.invest.watch = watched ? d.invest.watch.filter((x) => x !== f.id) : [f.id, ...d.invest.watch]; });
            toast(watched ? 'Removed from watchlist' : 'Added to watchlist');
          }}
        >
          <Icon name="star" style={watched ? { fill: 'var(--amb)', stroke: 'var(--amb)' } : undefined} />
        </button>
      </div>

      <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
        <Logo id={f.amc} name={f.amc} lg />
        <div className="col grow" style={{ gap: 4 }}>
          <h1 className="h1" style={{ fontSize: 23 }}>{f.name}</h1>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="pill">{f.category}</span>
            <span className={`pill${f.risk === 'Very High' || f.risk === 'High' ? ' amb' : ' acc'}`}>{f.risk} risk</span>
            <Stars n={f.rating} />
          </div>
        </div>
      </div>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="row sp" style={{ padding: '0 4px', alignItems: 'flex-end' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">{scrub ? istDate(scrub.t) : `NAV · ${istDay(n.day)}`}</span>
            <span className="num">{px(shown)}</span>
            <span className="cap ink2">{scrub ? `${shown >= first ? 'Up' : 'Down'} ${Math.abs(((shown - first) / first) * 100).toFixed(2)}% from the start of the range` : `${n.pct >= 0 ? 'Up' : 'Down'} ${Math.abs(n.pct).toFixed(2)}% on the day`}</span>
          </div>
          <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
            <span className="cap">{range} return</span>
            <span className="h2">{(((n.nav - first) / first) * 100).toFixed(1)}%</span>
          </div>
        </div>
        <PriceChart points={pts} label={`${f.name} NAV, ${range}`} onScrub={setScrub} />
        <RangeTabs ranges={NAV_RANGES} value={range} onChange={(x) => { setRange(x); buzz(4); }} />
        <div className="stats three" style={{ padding: '4px 4px 0' }}>
          <div><span className="cap">1Y</span><b>{r[1].toFixed(1)}%</b></div>
          <div><span className="cap">3Y a year</span><b>{r[3].toFixed(1)}%</b></div>
          <div><span className="cap">5Y a year</span><b>{r[5].toFixed(1)}%</b></div>
        </div>
      </section>

      {(pos || processing.length > 0) && (
        <section className="glass col" style={{ gap: 10 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Your investment</h2>{pos && <span className="cap">{pos.units.toFixed(3)} units</span>}</div>
          {pos && (
            <div className="plate col" style={{ gap: 6 }}>
              <div className="kv"><span>Current value</span><MoneyP value={pos.units * n.nav} className="" /></div>
              <div className="kv"><span>Invested</span><MoneyP value={pos.invested} className="" /></div>
              <div className="kv"><span>Returns</span><span><Returns abs={pos.units * n.nav - pos.invested} pct={pos.invested ? ((pos.units * n.nav - pos.invested) / pos.invested) * 100 : 0} /></span></div>
              <div className="kv"><span>Average NAV</span><span>{px(pos.invested / pos.units)}</span></div>
            </div>
          )}
          {processing.map((o) => (
            <div key={o.id} className="plate row">
              <div className="spin-ring" style={{ width: 22, height: 22, borderWidth: 3 }} />
              <span className="col grow"><span className="med">{o.side === 'buy' ? `${rupees(o.amount)} being invested` : `${o.units?.toFixed(3)} units being redeemed`}</span><span className="cap">Units are allotted at the day’s NAV in under a minute (demo)</span></span>
            </div>
          ))}
          {sips.map((x) => (
            <Link key={x.id} href="/sips" className="plate row">
              <div className="ico"><Icon name="calendar" /></div>
              <span className="col grow"><span className="med">SIP {rupees(x.amount)} on the {ordinal(x.day)}</span><span className="cap">{x.status === 'paused' ? 'Paused' : `Next on ${istDay(x.nextAt)}`} · {x.count} done</span></span>
              <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
            </Link>
          ))}
          {pos && <button className="btn2" onClick={() => setSheet('redeem')}>Redeem</button>}
        </section>
      )}

      <section className="glass col" style={{ gap: 12 }}>
        <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">If you SIP this</h2><span className="cap">at {rate.toFixed(1)}% a year</span></div>
        <div className="col" style={{ gap: 2, padding: '0 4px' }}>
          <div className="row sp"><label htmlFor="calc-amt" className="cap">Every month</label><span className="med">{rupees(calcAmt)}</span></div>
          <input id="calc-amt" className="range" type="range" min={100} max={25000} step={100} value={calcAmt} onChange={(e) => setCalcAmt(Number(e.target.value))} style={{ ['--pct' as string]: `${((calcAmt - 100) / 24900) * 100}%` }} />
          <div className="row sp"><label htmlFor="calc-yrs" className="cap">For</label><span className="med">{calcYrs} years</span></div>
          <input id="calc-yrs" className="range" type="range" min={1} max={30} value={calcYrs} onChange={(e) => setCalcYrs(Number(e.target.value))} style={{ ['--pct' as string]: `${((calcYrs - 1) / 29) * 100}%` }} />
        </div>
        <div className="wi-out">
          <div className="plate col" style={{ gap: 2 }}><span className="cap">You put in</span><span className="amt">{rupees(fv.invested)}</span></div>
          <div className="plate col you" style={{ gap: 2 }}><span className="cap">Could become</span><span className="amt">{rupees(fv.value)}</span></div>
        </div>
        <p className="cap" style={{ padding: '0 4px' }}>Uses this fund’s past {r[5] ? '5-year' : '3-year'} return, capped at 16%. Past returns don’t promise future ones; some years will be negative.</p>
      </section>

      <section className="glass col" style={{ gap: 12 }}>
        <h2 className="h2" style={{ padding: '0 4px' }}>Fund details</h2>
        <div className="stats" style={{ padding: '0 4px' }}>
          <div><span className="cap">Expense ratio</span><b>{f.expense.toFixed(2)}% a year</b></div>
          <div><span className="cap">Fund size</span><b>₹{f.aum.toLocaleString('en-IN')} Cr</b></div>
          <div><span className="cap">Min. SIP</span><b>{rupees(f.minSip)}</b></div>
          <div><span className="cap">Min. one-time</span><b>{rupees(f.minLump)}</b></div>
          <div><span className="cap">Exit load</span><b style={{ whiteSpace: 'normal' }}>{f.exitLoad}</b></div>
          <div><span className="cap">Lock-in</span><b>{f.lockInYears ? `${f.lockInYears} years` : 'None'}</b></div>
          <div><span className="cap">Benchmark</span><b style={{ whiteSpace: 'normal' }}>{f.benchmark}</b></div>
          <div><span className="cap">Fund manager</span><b>{f.manager}</b></div>
        </div>
        <div className="plate col" style={{ gap: 6 }}>
          <span className="eye">Top holdings</span>
          {f.top.map((t, i) => <span key={t} className="row" style={{ gap: 8 }}><span className="cap" style={{ width: 14 }}>{i + 1}</span><span className="med">{t}</span></span>)}
        </div>
        <RiskMeter risk={f.risk} />
      </section>

      <section className="glass col" style={{ gap: 6 }}>
        <h2 className="h2" style={{ padding: '0 4px' }}>About</h2>
        <p className="body" style={{ padding: '0 4px' }}>{f.about}</p>
        <p className="cap" style={{ padding: '0 4px' }}>{f.amc} is a fictional fund house. Demo NAVs.</p>
      </section>

      <div className="dock">
        <button className="btn2" onClick={() => setSheet('lump')}>One-time</button>
        <button className="btn" onClick={() => setSheet('sip')}>Start SIP</button>
      </div>

      {(sheet === 'sip' || sheet === 'lump') && <InvestSheet f={f} mode={sheet} onClose={() => setSheet(null)} />}
      {sheet === 'redeem' && <RedeemSheet f={f} onClose={() => setSheet(null)} />}
    </Screen>
  );
}

const DAYS = [1, 5, 10, 15, 20, 25];

function InvestSheet({ f, mode: initial, onClose }: { f: Fund; mode: 'sip' | 'lump'; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const inv = state.invest;
  const [mode, setMode] = useState(initial);
  const [amount, setAmount] = useState(String(Math.max(mode === 'sip' ? f.minSip : f.minLump, 500)));
  const [day, setDay] = useState(() => DAYS.reduce((b, d) => (Math.abs(d - new Date().getDate()) < Math.abs(b - new Date().getDate()) ? d : b), 5));
  const [payNow, setPayNow] = useState(true);
  const [via, setVia] = useState<'balance' | 'upi'>(inv.balance >= 500 ? 'balance' : 'upi');
  const [err, setErr] = useState<string | null>(null);
  const n = parseAmount(amount);
  const min = mode === 'sip' ? f.minSip : f.minLump;

  if (inv.kyc.status !== 'verified') {
    return (
      <Sheet open onClose={onClose} label="KYC first">
        <div className="ico w"><Icon name="shield" /></div>
        <h2 className="h1" style={{ fontSize: 26 }}>KYC first</h2>
        <p className="body">Fund houses need your PAN and a bank account in your name. Two minutes, done once.</p>
        <Link className="btn" href={`/kyc?next=${encodeURIComponent(`/mf/${f.id}`)}`}>Start KYC</Link>
      </Sheet>
    );
  }

  const confirm = () => {
    const at = Date.now();
    const run = (d: typeof state) => (mode === 'sip' ? startSip(d, f.id, n, day, payNow, at) : buyFund(d, f.id, n, via, at));
    const res = run(structuredClone(state));
    if (typeof res === 'string') { setErr(res); return; }
    update((d) => { run(d); });
    buzz([10, 30, 20]);
    toast(mode === 'sip' ? `SIP of ${rupees(n)} a month started` : `${rupees(n)} order placed. Units in under a minute.`);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} label={mode === 'sip' ? 'Start a SIP' : 'Invest one-time'}>
      <div className="seg" role="tablist" aria-label="How">
        <button role="tab" aria-selected={mode === 'sip'} onClick={() => setMode('sip')}>Monthly SIP</button>
        <button role="tab" aria-selected={mode === 'lump'} onClick={() => setMode('lump')}>One-time</button>
      </div>
      <h2 className="h2">{f.name}</h2>
      <AmountField id="mf-amt" label={mode === 'sip' ? 'Every month' : 'Amount'} value={amount} onChange={(v) => { setAmount(v); setErr(null); }} />
      <div className="row wrap" style={{ gap: 6 }}>
        {(mode === 'sip' ? [f.minSip, 500, 1000, 2000, 5000] : [1000, 5000, 10000, 25000]).filter((v, i, a) => a.indexOf(v) === i && v >= min).map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={n === p} onClick={() => setAmount(String(p))}>{rupees(p)}</button>
        ))}
      </div>

      {mode === 'sip' ? (
        <>
          <div className="col" style={{ gap: 8 }}>
            <span className="eye" style={{ padding: '0 4px' }}>On the</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {DAYS.map((d) => <button key={d} type="button" className="chip" aria-pressed={day === d} onClick={() => setDay(d)}>{ordinal(d)}</button>)}
            </div>
          </div>
          <div className="row">
            <div className="col grow"><span id="paynow-l" className="med">Pay the first one today</span><span className="cap">Via UPI. Later ones come by autopay.</span></div>
            <Toggle on={payNow} labelledBy="paynow-l" onChange={setPayNow} />
          </div>
          <div className="plate row">
            <div className="ico n"><Icon name="bank" /></div>
            <span className="col grow"><span className="med">Autopay from {inv.kyc.bank ? `${inv.kyc.bank.name} ••${inv.kyc.bank.last4}` : 'your bank'}</span><span className="cap">Pause, change or stop any time from SIPs</span></span>
          </div>
        </>
      ) : (
        <fieldset className="col" style={{ gap: 6, border: 0, margin: 0, padding: 0 }}>
          <legend className="eye" style={{ padding: '0 4px', marginBottom: 8 }}>Pay from</legend>
          <button type="button" className={`plate row${via === 'balance' ? ' you' : ''}`} aria-pressed={via === 'balance'} onClick={() => setVia('balance')} style={{ minHeight: 52 }}>
            <div className="ico n"><Icon name="wallet" /></div>
            <span className="col grow"><span className="med">Balance</span><span className="cap"><MoneyP value={inv.balance} className="" /> available</span></span>
            <span className={`dot${via === 'balance' ? '' : ' o'}`} />
          </button>
          <button type="button" className={`plate row${via === 'upi' ? ' you' : ''}`} aria-pressed={via === 'upi'} onClick={() => setVia('upi')} style={{ minHeight: 52 }}>
            <div className="ico n"><Icon name="bolt" /></div>
            <span className="col grow"><span className="med">UPI</span><span className="cap">Straight from your bank</span></span>
            <span className={`dot${via === 'upi' ? '' : ' o'}`} />
          </button>
        </fieldset>
      )}

      {n > 0 && n < min && <p className="err">The minimum is {rupees(min)}.</p>}
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn" disabled={n < min} onClick={confirm}>
        {mode === 'sip' ? `Start ${n >= min ? rupees(n) : ''} SIP` : `Invest ${n >= min ? rupees(n) : ''}`}
      </button>
      <p className="cap center">Orders before 3 pm get that day’s NAV. Demo fund, no real money moves.</p>
    </Sheet>
  );
}

function RedeemSheet({ f, onClose }: { f: Fund; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const n = nav(f).nav;
  const free = redeemableUnits(state.invest, f.id);
  const max = Math.floor(free.units * n);
  const [amount, setAmount] = useState(String(max));
  const [all, setAll] = useState(true);
  const amt = parseAmount(amount);
  const units = all ? free.units : Math.min(free.units, amt / n);
  const [err, setErr] = useState<string | null>(null);

  return (
    <Sheet open onClose={onClose} label="Redeem">
      <h2 className="h1" style={{ fontSize: 26 }}>Redeem from {f.name}</h2>
      {free.lockedTill && <p className="cap ambx">Some units are in ELSS lock-in until {istDate(free.lockedTill)}.</p>}
      <div className="row">
        <div className="col grow"><span id="all-l" className="med">Redeem everything I can</span><span className="cap">{free.units.toFixed(3)} units ≈ {px(free.units * n)}</span></div>
        <Toggle on={all} labelledBy="all-l" onChange={(v) => { setAll(v); if (v) setAmount(String(max)); }} />
      </div>
      {!all && <AmountField id="red-amt" label="Amount" value={amount} onChange={setAmount} max={max} />}
      {f.exitLoad !== 'Nil' && <p className="cap">Exit load: {f.exitLoad}.</p>}
      {err && <p className="err">{err}</p>}
      <button
        className="btn"
        disabled={units <= 0 || (!all && amt > max)}
        onClick={() => {
          const at = Date.now();
          const res = redeemFund(structuredClone(state), f.id, units, at);
          if (typeof res === 'string') { setErr(res); return; }
          update((d) => { redeemFund(d, f.id, units, at); });
          toast(`Redeeming ${px(units * n)}. It lands in your balance shortly.`);
          onClose();
        }}
      >
        Redeem {units > 0 ? `≈ ${px(units * n)}` : ''}
      </button>
    </Sheet>
  );
}
