'use client';

import { useState } from 'react';
import { Screen, TopBar, Money, Sheet, AmountField, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { SPEND_CATS } from '@/lib/data';
import { addSpend, roundup, sweepJar } from '@/lib/logic';
import { buzz } from '@/lib/fx';
import { parseAmount, relDay, rupees } from '@/lib/format';
import type { SpendCat } from '@/lib/types';

const GOAL = 500;
const CATS = Object.keys(SPEND_CATS) as SpendCat[];
const DEMO: [string, number, SpendCat][] = [
  ['Zomato · momos', 238, 'food'], ['Auto to college', 64, 'travel'], ['Starbucks', 355, 'food'], ['Myntra', 1149, 'shopping'],
  ['Spotify', 119, 'bills'], ['Ola', 212, 'travel'], ['Gaming top-up', 149, 'fun'], ['Chai tapri', 23, 'food'], ['PVR snacks', 410, 'fun'],
];

function JarArt({ fill }: { fill: number }) {
  const level = 150 - Math.max(0.06, Math.min(1, fill)) * 108;
  return (
    <svg viewBox="0 0 132 160" width="132" height="160" aria-hidden="true">
      <defs>
        <clipPath id="jar-clip"><path d="M30 34h72v10c14 8 20 20 20 34v56a20 20 0 0 1-20 20H30a20 20 0 0 1-20-20V78c0-14 6-26 20-34z" /></clipPath>
      </defs>
      <g clipPath="url(#jar-clip)">
        <rect x="0" y="0" width="132" height="160" fill="var(--plate)" />
        <g className="jar-wave">
          <path d={`M0 ${level} q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V170 H0z`} fill="var(--acc)" opacity=".9" />
        </g>
        {Array.from({ length: Math.round(Math.min(1, fill) * 9) }, (_, k) => (
          <circle key={k} cx={28 + ((k * 23) % 78)} cy={146 - Math.floor(k / 3) * 14} r="7" fill="#F5C451" stroke="#B9851B" strokeWidth="1.5" />
        ))}
      </g>
      <path d="M30 34h72v10c14 8 20 20 20 34v56a20 20 0 0 1-20 20H30a20 20 0 0 1-20-20V78c0-14 6-26 20-34z" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
      <rect x="26" y="20" width="80" height="16" rx="6" fill="var(--ink)" />
    </svg>
  );
}

export default function Jar() {
  const { state, update, toast } = useStore();
  const [shake, setShake] = useState(false);
  const [open, setOpen] = useState(false);
  const jar = state.jar;
  const weekAgo = Date.now() - 7 * 86400000;
  const week = state.spends.filter((s) => new Date(s.at).getTime() >= weekAgo);
  const spent = week.reduce((a, s) => a + s.amount, 0);
  const byCat = CATS.map((c) => ({ c, v: week.filter((s) => s.cat === c).reduce((a, s) => a + s.amount, 0) })).filter((x) => x.v > 0);
  const never = state.pots.find((p) => p.bucket === 'never');

  const jiggle = () => { setShake(true); buzz([8, 30, 8]); setTimeout(() => setShake(false), 520); };

  const simulate = () => {
    update((d) => {
      for (let k = 0; k < 3; k++) {
        const [w, a, c] = DEMO[Math.floor(Math.random() * DEMO.length)];
        addSpend(d, w, a, c);
      }
    });
    jiggle();
    toast('3 UPI spends landed. Chillar went in.');
  };

  return (
    <Screen orbs="b">
      <TopBar back="/" label="Chillar Jar" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">Spare change,<br />quietly invested.</h1>
        <p className="body">Every UPI spend rounds up. The extra rupees drop in the jar. Sweep them into your index fund.</p>
      </div>

      <section className="glass row" style={{ gap: 16, alignItems: 'center' }}>
        <button className={`jar-wrap${shake ? ' shake' : ''}`} onClick={jiggle} aria-label="Shake the jar">
          <JarArt fill={jar.balance / GOAL} />
        </button>
        <div className="col grow" style={{ gap: 6 }}>
          <span className="eye">In the jar</span>
          <Money value={jar.balance} className="hero" style={{ fontSize: 44 }} />
          <span className="cap">Swept so far <Money value={jar.swept} className="" /></span>
          <div className="bar"><i style={{ width: `${Math.min(100, (jar.balance / GOAL) * 100)}%` }} /></div>
          <span className="cap">{jar.balance >= GOAL ? 'Jar’s full. Sweep it!' : `${rupees(GOAL - jar.balance)} to a full jar`}</span>
        </div>
      </section>

      <section className="glass col" style={{ gap: 12 }}>
        <div className="row">
          <div className="col grow"><span id="jar-on" className="med">Round-ups</span><span className="cap">{jar.on ? `₹342 becomes ₹${Math.ceil(342 / jar.step) * jar.step}, ${rupees(roundup(342, jar.step, jar.multiplier))} to the jar` : 'Paused. Spends won’t round up.'}</span></div>
          <Toggle on={jar.on} labelledBy="jar-on" onChange={(v) => update((d) => { d.jar.on = v; })} />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="seg grow" role="group" aria-label="Round up to the nearest">
            {([10, 50, 100] as const).map((s) => (
              <button key={s} aria-pressed={jar.step === s} onClick={() => update((d) => { d.jar.step = s; })}>₹{s}</button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Multiplier" style={{ width: 132 }}>
            {([1, 2, 3] as const).map((m) => (
              <button key={m} aria-pressed={jar.multiplier === m} onClick={() => update((d) => { d.jar.multiplier = m; })}>{m}×</button>
            ))}
          </div>
        </div>
      </section>

      {byCat.length > 0 && (
        <section className="glass col" style={{ gap: 10 }}>
          <div className="row sp" style={{ padding: '0 4px' }}>
            <h2 className="h2">This week</h2>
            <Money value={spent} className="amt" />
          </div>
          <div className="catbar" role="img" aria-label={byCat.map((x) => `${SPEND_CATS[x.c]} ${rupees(x.v)}`).join(', ')}>
            {byCat.map((x) => <i key={x.c} className={`c-${x.c}`} style={{ width: `${(x.v / spent) * 100}%` }} />)}
          </div>
          <div className="legend">
            {byCat.map((x) => <span key={x.c}><b className={`c-${x.c}`} />{SPEND_CATS[x.c]} {state.settings.hideAmounts ? '' : rupees(x.v)}</span>)}
          </div>
          <div className="col" style={{ gap: 6 }}>
            {week.slice(0, 6).map((s) => (
              <div key={s.id} className="plate row">
                <span className={`dot c-${s.cat}`} />
                <div className="col grow" style={{ gap: 1 }}><span className="med">{s.what}</span><span className="cap">{relDay(s.at)} · <Money value={s.amount} className="" /></span></div>
                <span className="amt accx" style={{ fontSize: 15 }}>{s.roundup > 0 ? `+${rupees(s.roundup)}` : '—'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="foot" style={{ gap: 8 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn2" onClick={() => setOpen(true)}><Icon name="receipt" small />Log a spend</button>
          <button className="btn2" onClick={simulate}><Icon name="bolt" small />Simulate UPI</button>
        </div>
        <button
          className="btn"
          disabled={jar.balance < 1}
          onClick={() => {
            update((d) => { sweepJar(d); }, `Swept into ${never?.name ?? 'Never touch'}`);
            jiggle();
          }}
        >
          <Icon name="jar" />{jar.balance < 1 ? 'Jar’s empty, spend something' : `Sweep ${state.settings.hideAmounts ? 'it' : rupees(Math.floor(jar.balance))} into ${never?.name ?? 'Never touch'}`}
        </button>
      </div>

      {open && <SpendSheet onClose={() => setOpen(false)} onAdded={jiggle} />}
    </Screen>
  );
}

function SpendSheet({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { state, update, toast } = useStore();
  const [what, setWhat] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<SpendCat>('food');
  const n = parseAmount(amount);
  const r = state.jar.on ? roundup(n, state.jar.step, state.jar.multiplier) : 0;
  return (
    <Sheet open onClose={onClose} label="Log a spend">
      <h2 className="h1" style={{ fontSize: 26 }}>Log a spend</h2>
      <div className="col" style={{ gap: 8 }}>
        <label htmlFor="sp-what" className="eye" style={{ padding: '0 4px' }}>On what</label>
        <div className="field"><input id="sp-what" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Swiggy · biryani" maxLength={40} /></div>
      </div>
      <AmountField id="sp-amt" label="Amount" value={amount} onChange={setAmount} />
      <div className="row wrap" style={{ gap: 6 }}>
        {CATS.map((c) => <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{SPEND_CATS[c]}</button>)}
      </div>
      {n > 0 && <p className="cap center">{r > 0 ? `${rupees(r)} of chillar goes in the jar.` : 'A round number. Nothing to round up.'}</p>}
      <button
        className="btn"
        disabled={n <= 0 || !what.trim()}
        onClick={() => { update((d) => { addSpend(d, what.trim(), n, cat); }, r > 0 ? `+${rupees(r)} in the jar` : 'Spend logged'); onAdded(); onClose(); }}
      >
        Log {n > 0 ? rupees(n) : ''}
      </button>
    </Sheet>
  );
}
