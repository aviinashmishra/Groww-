'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, TopBar, Money, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { STOCKS, stockPrice } from '@/lib/data';
import { funValue, licence, note, potsTotal } from '@/lib/logic';
import { changeWords, parseAmount, rupees, uid } from '@/lib/format';

export default function Fun() {
  const { state, update, toast } = useStore();
  const [sheet, setSheet] = useState<null | 'topup' | 'buy'>(null);
  const lic = licence(state);
  const f = funValue(state);
  const walled = potsTotal(state);

  if (lic.level < 2) {
    return (
      <Screen orbs="b">
        <TopBar back="/profile" label="Fun Pot" />
        <h1 className="h1">The Fun Pot opens at Level 2.</h1>
        <p className="body">Stocks are fun once the boring part is done. Here’s what’s left.</p>
        <section className="glass col" style={{ gap: 8 }}>
          {[
            [lic.crash, 'Hold through the Crash Simulator', '/crash'],
            [lic.six, `6 months of index fund and goals (${Math.min(6, lic.months)} of 6)`, '/'],
            [lic.rw, 'Runway past 2 months', '/'],
          ].map(([ok, label, href]) => (
            <Link key={label as string} href={href as string} className="plate row">
              <div className={`ico${ok ? '' : ' n'}`}><Icon name={ok ? 'check' : 'lock'} /></div>
              <span className="grow med">{label as string}</span>
              {!ok && <Icon name="chevR" style={{ color: 'var(--ink3)' }} />}
            </Link>
          ))}
        </section>
        <div className="foot"><Link className="btn" href="/profile">Back to my licence</Link></div>
      </Screen>
    );
  }

  const fill = f.ceiling > 0 ? Math.min(1, f.balance / f.ceiling) : 0;

  return (
    <Screen orbs="b">
      <TopBar back="/profile" label="Fun Pot" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">Thrill chahiye? Fine.<br />It has a ceiling.</h1>
        <p className="body">Punt on stocks here. The other 90% can’t be reached from this screen.</p>
      </div>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="plate col" style={{ gap: 10, padding: 16 }}>
          <div className="row sp" style={{ alignItems: 'flex-end' }}>
            <div className="col" style={{ gap: 4 }}>
              <span className="eye">Play balance</span>
              <Money value={f.balance} className="hero" style={{ fontSize: 48 }} />
            </div>
            <span className="chip">{Math.round(fill * 100)}% of ceiling</span>
          </div>
          <div className="bar" style={{ height: 12, borderRadius: 6 }}><i style={{ width: `${fill * 100}%` }} /></div>
          <div className="row sp">
            <span className="cap">Ceiling <Money value={f.ceiling} className="" /></span>
            <span className="cap">Cash <Money value={state.fun.cash} className="" /></span>
          </div>
        </div>
        <div className="plate row">
          <div className="ico n"><Icon name="lock" /></div>
          <div className="col grow"><span className="med">Walled off in your pots</span><span className="cap">Soon, Later, Never touch</span></div>
          <Money value={walled} />
        </div>
      </section>

      {state.fun.holdings.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Your picks</h2><span className="cap">Demo prices</span></div>
          {state.fun.holdings.map((h) => {
            const s = STOCKS.find((x) => x.id === h.stockId)!;
            const value = h.units * stockPrice(s);
            const ch = ((value - h.cost) / h.cost) * 100;
            return (
              <div key={h.id} className="plate row">
                <div className="col grow" style={{ gap: 2 }}><span className="med">{s.name}</span><span className="cap">{changeWords(ch)} since you bought</span></div>
                <Money value={value} />
                <button
                  className="chip"
                  onClick={() => {
                    update((d) => { d.fun.holdings = d.fun.holdings.filter((x) => x.id !== h.id); d.fun.cash += Math.round(value); });
                    toast(`Sold ${s.name} for ${rupees(value)}`);
                  }}
                >
                  Sell
                </button>
              </div>
            );
          })}
        </section>
      )}

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px', minHeight: 44 }}>
          <span className="med">Stocks</span>
          <span className="chip acc"><Icon name="check" small />Unlocked</span>
        </div>
        <div className="hr" />
        <div className="row sp" style={{ padding: '0 4px' }}>
          <span className="med">Futures and options</span>
          {state.fun.foUnlocked ? (
            <span className="chip acc"><Icon name="check" small />Unlocked · {rupees(state.fun.lossLimit)} limit</span>
          ) : (
            <Link className="chip big" href="/fun/odds"><Icon name="lock" small />Locked · see the odds</Link>
          )}
        </div>
      </section>

      <div className="foot" style={{ gap: 8 }}>
        <button className="btn2" onClick={() => setSheet('topup')} disabled={f.room < 1}>
          <Icon name="plus" small />{f.room < 1 ? 'At the ceiling' : `Add play money (up to ${rupees(f.room)})`}
        </button>
        <button className="btn" onClick={() => setSheet('buy')} disabled={state.fun.cash < 1}>Pick a stock</button>
      </div>

      {sheet === 'topup' && <TopUp room={f.room} onClose={() => setSheet(null)} />}
      {sheet === 'buy' && <Buy onClose={() => setSheet(null)} />}
    </Screen>
  );
}

function TopUp({ room, onClose }: { room: number; onClose: () => void }) {
  const { update, toast } = useStore();
  const [v, setV] = useState(String(Math.min(500, room)));
  const n = parseAmount(v);
  return (
    <Sheet open onClose={onClose} label="Add play money">
      <h2 className="h1" style={{ fontSize: 26 }}>Add play money</h2>
      <p className="body">From your bank, not your pots. The ceiling is 10% of everything you have here.</p>
      <AmountField id="topup" label="Amount" value={v} onChange={setV} max={room} />
      {n > room && <p className="err">That’s over the ceiling by {rupees(n - room)}.</p>}
      <button className="btn" disabled={n <= 0 || n > room} onClick={() => { update((d) => { d.fun.cash += n; }); toast(`${rupees(n)} added to the Fun Pot`); onClose(); }}>Add {n > 0 ? rupees(n) : ''}</button>
    </Sheet>
  );
}

function Buy({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [stockId, setStockId] = useState(STOCKS[0].id);
  const [v, setV] = useState(String(Math.min(1000, Math.floor(state.fun.cash))));
  const n = parseAmount(v);
  const s = STOCKS.find((x) => x.id === stockId)!;
  const yesterday = new Date(Date.now() - 86400000);
  return (
    <Sheet open onClose={onClose} label="Pick a stock">
      <h2 className="h1" style={{ fontSize: 26 }}>Pick a stock</h2>
      <div className="col" style={{ gap: 6 }}>
        {STOCKS.map((st) => {
          const p = stockPrice(st);
          const ch = ((p - stockPrice(st, yesterday)) / stockPrice(st, yesterday)) * 100;
          return (
            <button key={st.id} className={`plate row${stockId === st.id ? ' you' : ''}`} aria-pressed={stockId === st.id} onClick={() => setStockId(st.id)} style={{ minHeight: 52 }}>
              <span className="col grow"><span className="med">{st.name}</span><span className="cap">{changeWords(ch)} today</span></span>
              <span className="amt" style={{ fontSize: 15 }}>₹{p.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </button>
          );
        })}
      </div>
      <AmountField id="buy" label="Invest" value={v} onChange={setV} max={Math.floor(state.fun.cash)} />
      {n > state.fun.cash && <p className="err">You have {rupees(state.fun.cash)} in play cash.</p>}
      <button
        className="btn"
        disabled={n <= 0 || n > state.fun.cash}
        onClick={() => {
          const price = stockPrice(s);
          update((d) => {
            d.fun.cash -= n;
            d.fun.holdings.push({ id: uid(), stockId: s.id, units: Math.round((n / price) * 1000) / 1000, cost: n, at: new Date().toISOString() });
            note(d, `Bought ${s.name}`, `${rupees(n)} from your Fun Pot.`, '/fun');
          });
          toast(`${rupees(n)} of ${s.name} bought`);
          onClose();
        }}
      >
        Buy {n > 0 ? rupees(n) : ''} of {s.name}
      </button>
      <p className="cap center">Fictional companies, demo prices.</p>
    </Sheet>
  );
}
