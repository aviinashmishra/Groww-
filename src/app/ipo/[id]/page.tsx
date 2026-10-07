'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar, Sheet, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Logo, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { type Ipo, ipoById, ipoStatus, ipoSubscription, istDay, istTime, px } from '@/lib/market';
import { applyIpo, cancelIpo } from '@/lib/invest';
import { rupees } from '@/lib/format';
import { buzz } from '@/lib/fx';

export default function IpoPage() {
  const { id } = useParams<{ id: string }>();
  const ipo = ipoById(id);
  if (!ipo) {
    return (
      <Screen>
        <TopBar back="/ipo" label="IPO" />
        <h1 className="h1">That IPO isn’t on the calendar.</h1>
        <div className="foot"><Link className="btn" href="/ipo">See IPOs</Link></div>
      </Screen>
    );
  }
  return <IpoView ipo={ipo} />;
}

function IpoView({ ipo }: { ipo: Ipo }) {
  const { state, update, toast } = useStore();
  const now = useNow();
  const [applying, setApplying] = useState(false);
  const st = ipoStatus(ipo, now);
  const sub = ipoSubscription(ipo, now);
  const app = state.invest.ipos.find((a) => a.ipoId === ipo.id && a.status !== 'cancelled');
  const odds = sub > 1 ? Math.round(sub) : 1;

  const steps: [string, number][] = [
    ['Bidding opens', ipo.opensAt],
    ['Bidding closes', ipo.closesAt],
    ['Allotment', ipo.allotAt],
    ['Listing', ipo.listAt],
  ];

  return (
    <Screen orbs="b" nav={false}>
      <TopBar back="/ipo" label="IPO" />
      <div className="row" style={{ gap: 12 }}>
        <Logo id={ipo.slug} name={ipo.name} lg />
        <div className="col grow" style={{ gap: 2 }}>
          <h1 className="h1" style={{ fontSize: 24 }}>{ipo.name}</h1>
          <span className="cap">{ipo.sector} · mainboard IPO (demo)</span>
        </div>
      </div>

      <section className="glass col" style={{ gap: 12 }}>
        <div className="stats" style={{ padding: '0 4px' }}>
          <div><span className="cap">Price band</span><b>{px(ipo.band[0])}–{px(ipo.band[1])}</b></div>
          <div><span className="cap">Lot size</span><b>{ipo.lot} shares</b></div>
          <div><span className="cap">Min. investment</span><b>{px(ipo.band[1] * ipo.lot)}</b></div>
          <div><span className="cap">Issue size</span><b>₹{ipo.sizeCr.toLocaleString('en-IN')} Cr</b></div>
        </div>
        {(st === 'open' || st === 'closed' || st === 'allotted' || st === 'listed') && (
          <div className="plate col" style={{ gap: 6 }}>
            <div className="row sp"><span className="med">Retail subscription</span><span className="h2">{sub.toFixed(2)}×</span></div>
            <div className="bar"><i style={{ width: `${Math.min(100, (sub / Math.max(ipo.retail, 1)) * 100)}%` }} /></div>
            <span className="cap">{sub > 1 ? `Roughly 1 in ${odds} retail applicants will get a lot.` : 'Not fully subscribed yet; everyone who bids at the top of the band gets shares.'}</span>
          </div>
        )}
      </section>

      <section className="glass col" style={{ gap: 4 }}>
        <h2 className="h2" style={{ padding: '0 4px 8px' }}>Timeline</h2>
        <div className="timeline" style={{ padding: '0 4px' }}>
          {steps.map(([label, t], i) => {
            const done = now >= t;
            const current = done && (i === steps.length - 1 || now < steps[i + 1][1]);
            return (
              <div key={label} className={`st${done ? ' done' : ''}${current ? ' now' : ''}`}>
                <i />
                <span className="col" style={{ gap: 1 }}><span className="med">{label}</span><span className="cap">{istDay(t)}, {istTime(t)}</span></span>
              </div>
            );
          })}
        </div>
      </section>

      {app && (
        <section className="glass col" style={{ gap: 8 }}>
          <h2 className="h2" style={{ padding: '0 4px' }}>Your application</h2>
          <div className="plate col" style={{ gap: 2 }}>
            <div className="kv"><span>Bid</span><span>{app.lots} lot{app.lots > 1 ? 's' : ''} at {px(app.price)}</span></div>
            <div className="kv"><span>Blocked in bank</span><span>{rupees(app.lots * ipo.lot * app.price)}</span></div>
            <div className="kv"><span>UPI</span><span>{app.upi}</span></div>
            <div className="kv"><span>Status</span><span>{{ applied: st === 'open' ? 'Bid placed' : 'Waiting for allotment', allotted: 'Allotted 1 lot', 'not-allotted': 'Not allotted, money released', listed: 'Listed, in your portfolio', cancelled: 'Cancelled' }[app.status]}</span></div>
          </div>
          {app.status === 'applied' && st === 'open' && (
            <button className="btn2" onClick={() => { update((d) => cancelIpo(d, app.id)); toast('Application cancelled. The mandate is released.'); }}>Cancel application</button>
          )}
          {app.status === 'listed' && <Link className="btn2" href={`/stocks/${ipo.id}`}>See it in your portfolio</Link>}
        </section>
      )}

      <section className="glass col" style={{ gap: 6 }}>
        <h2 className="h2" style={{ padding: '0 4px' }}>About</h2>
        <p className="body" style={{ padding: '0 4px' }}>{ipo.about}</p>
        <div className="plate col" style={{ gap: 4 }}>
          <span className="med">Before you bid</span>
          <span className="cap">Listing-day pops get the headlines. Some IPOs list below their price, and many trail the Nifty a year later. Read the risk factors in the offer document.</span>
        </div>
        <p className="cap" style={{ padding: '0 4px' }}>A fictional company.</p>
      </section>

      <div className="dock">
        {st === 'open' && !app ? (
          <button className="btn" onClick={() => setApplying(true)}>Apply</button>
        ) : st === 'upcoming' ? (
          <button className="btn2" disabled>Opens {istDay(ipo.opensAt)}, 10 am</button>
        ) : st === 'listed' ? (
          <Link className="btn" href={`/stocks/${ipo.id}`}>Trade {ipo.name}</Link>
        ) : (
          <Link className="btn2" href="/ipo">Back to IPOs</Link>
        )}
      </div>

      {applying && <ApplySheet ipo={ipo} onClose={() => setApplying(false)} />}
    </Screen>
  );
}

function ApplySheet({ ipo, onClose }: { ipo: Ipo; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const maxLots = Math.floor(200000 / (ipo.band[1] * ipo.lot));
  const [lots, setLots] = useState(1);
  const [cutoff, setCutoff] = useState(true);
  const [bid, setBid] = useState(String(ipo.band[1]));
  const [upi, setUpi] = useState(() => `${state.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'me'}@okbank`);
  const [phase, setPhase] = useState<'form' | 'mandate'>('form');
  const [err, setErr] = useState<string | null>(null);
  const price = cutoff ? ipo.band[1] : Number(bid) || 0;
  const amount = price * ipo.lot * lots;

  if (state.invest.kyc.status !== 'verified') {
    return (
      <Sheet open onClose={onClose} label="KYC first">
        <h2 className="h1" style={{ fontSize: 26 }}>KYC first</h2>
        <p className="body">IPO bids need a verified PAN and a demat account. Two minutes.</p>
        <Link className="btn" href={`/kyc?next=${encodeURIComponent(`/ipo/${ipo.id}`)}`}>Start KYC</Link>
      </Sheet>
    );
  }

  const submit = () => {
    const at = Date.now();
    const res = applyIpo(structuredClone(state), ipo.id, lots, price, upi, at);
    if (typeof res === 'string') { setErr(res); return; }
    setPhase('mandate');
    setTimeout(() => {
      update((d) => { applyIpo(d, ipo.id, lots, price, upi, at); });
      buzz([10, 30, 20]);
      toast(`Applied for ${ipo.name}. Allotment on ${istDay(ipo.allotAt)}.`);
      onClose();
    }, 1600);
  };

  return (
    <Sheet open onClose={phase === 'mandate' ? () => {} : onClose} label={`Apply for ${ipo.name}`}>
      {phase === 'mandate' ? (
        <div className="col" style={{ alignItems: 'center', gap: 14, padding: '26px 0' }}>
          <div className="spin-ring" />
          <span className="h2">Approve the mandate</span>
          <span className="cap center">A request for {rupees(amount)} went to {upi}. The money stays in your bank, blocked, until allotment. Demo: it approves itself.</span>
        </div>
      ) : (
        <>
          <h2 className="h1" style={{ fontSize: 26 }}>Apply for {ipo.name}</h2>
          <div className="col" style={{ gap: 8 }}>
            <span className="eye" style={{ padding: '0 4px' }}>Lots · {ipo.lot} shares each</span>
            <div className="plate stepper">
              <button type="button" aria-label="One lot less" onClick={() => setLots((l) => Math.max(1, l - 1))}><Icon name="minus" /></button>
              <input aria-label="Lots" readOnly value={lots} />
              <button type="button" aria-label="One lot more" onClick={() => setLots((l) => Math.min(maxLots, l + 1))}><Icon name="plus" /></button>
            </div>
            <span className="cap" style={{ padding: '0 4px' }}>Up to {maxLots} lots for retail. If it’s oversubscribed, you’d get at most one lot whatever you bid, so one lot is usually enough.</span>
          </div>
          <div className="row">
            <div className="col grow"><span id="cut-l" className="med">Bid at cut-off price</span><span className="cap">The top of the band, {px(ipo.band[1])}. Recommended.</span></div>
            <Toggle on={cutoff} labelledBy="cut-l" onChange={setCutoff} />
          </div>
          {!cutoff && (
            <div className="field"><span className="pre">₹</span><input inputMode="decimal" aria-label="Bid price" value={bid} onChange={(e) => setBid(e.target.value.replace(/[^\d.]/g, ''))} /></div>
          )}
          <div className="col" style={{ gap: 8 }}>
            <label htmlFor="upi" className="eye" style={{ padding: '0 4px' }}>Your UPI ID</label>
            <div className="field"><input id="upi" value={upi} onChange={(e) => { setUpi(e.target.value); setErr(null); }} autoComplete="off" autoCapitalize="none" spellCheck={false} /></div>
          </div>
          <div className="plate kv"><span>Amount blocked</span><span>{rupees(amount)}</span></div>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" onClick={submit}>Apply for {lots} lot{lots > 1 ? 's' : ''}</button>
        </>
      )}
    </Sheet>
  );
}
