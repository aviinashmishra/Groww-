'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Screen, TopBar, Money, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { SwipeConfirm } from '@/components/SwipeConfirm';
import { useStore } from '@/lib/store';
import { note, worth } from '@/lib/logic';
import { useCountUp } from '@/lib/fx';
import { parseAmount, rupees, uid } from '@/lib/format';

const COOL_HOURS = 48;
const IDEAS: [string, number][] = [['AirPods', 24900], ['Sneakers', 8999], ['Concert pass', 4500], ['Goa weekend', 12000], ['New phone', 69999]];

function left(at: string) {
  const ms = new Date(at).getTime() + COOL_HOURS * 3600000 - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function Worth() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [, tick] = useState(0);
  const n = parseAmount(price);
  const w = worth(state, n);
  const soon = state.pots.find((p) => p.bucket === 'soon');
  const covered = !!soon && soon.balance >= n;
  const dropped = state.wishes.filter((x) => x.status === 'dropped').reduce((a, x) => a + x.price, 0);
  const shownDropped = useCountUp(dropped);
  const cooling = state.wishes.filter((x) => x.status === 'cooling');
  const days = useCountUp(w.days, 600);
  const hours = useCountUp(w.hours, 600);
  const label = name.trim() || 'it';

  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const reset = () => { setName(''); setPrice(''); };

  const saveFor = () => {
    const potId = uid();
    update((d) => {
      d.pots.push({ id: potId, name: name.trim() || 'Wishlist', bucket: 'soon', balance: 0, target: n, wish: true });
      d.wishes.unshift({ id: uid(), name: name.trim() || 'Wishlist', price: n, at: new Date().toISOString(), status: 'saving', potId });
      note(d, `Saving for ${name.trim() || 'it'}`, `A new pot with a ${rupees(n)} target.`, `/pots/${potId}`);
    });
    toast(`New pot: ${name.trim() || 'Wishlist'}`);
    router.push(`/pots/${potId}`);
  };

  const sleepOn = () => {
    update((d) => { d.wishes.unshift({ id: uid(), name: name.trim() || 'That thing', price: n, at: new Date().toISOString(), status: 'cooling' }); });
    toast(`Parked for ${COOL_HOURS} hours. Want it after that? Then it’s real.`);
    reset();
  };

  const buy = (id: string | null, amount: number, what: string) => {
    update((d) => {
      const s = d.pots.find((p) => p.bucket === 'soon');
      if (s && s.balance >= amount) s.balance -= amount;
      if (id) { const x = d.wishes.find((y) => y.id === id); if (x) x.status = 'bought'; }
      else d.wishes.unshift({ id: uid(), name: what, price: amount, at: new Date().toISOString(), status: 'bought' });
      note(d, `Bought ${what}`, covered ? 'Paid from your Soon pot. Guilt-free, as planned.' : 'Enjoy it.', '/worth');
    });
    toast(`Enjoy the ${what}. Guilt-free.`);
    reset();
  };

  return (
    <Screen orbs="c">
      <TopBar back="/" label="Worth it?" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">See what it really costs.</h1>
        <p className="body">Not in rupees. In days of freedom, hours of work, and what it could become.</p>
      </div>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="w-name" className="eye" style={{ padding: '0 4px' }}>I want</label>
          <div className="field"><input id="w-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New sneakers" maxLength={32} /></div>
        </div>
        <AmountField id="w-price" label="It costs" value={price} onChange={setPrice} />
        <div className="row wrap" style={{ gap: 6 }}>
          {IDEAS.map(([t, p]) => (
            <button key={t} className="chip" onClick={() => { setName(t); setPrice(String(p)); }}>{t}</button>
          ))}
        </div>
      </section>

      {n > 0 && (
        <>
          <div className="wtiles" aria-live="polite">
            <div className="wtile">
              <span className="eye">Runway</span>
              <span className="num">{days < 10 ? days.toFixed(1) : Math.round(days)}</span>
              <span className="cap">days of freedom</span>
            </div>
            <div className="wtile">
              <span className="eye">Work</span>
              <span className="num">{hours < 10 ? hours.toFixed(1) : Math.round(hours)}</span>
              <span className="cap">hours of your income</span>
            </div>
            <div className="wtile">
              <span className="eye">In 10 yrs</span>
              <span className="num" style={{ fontSize: w.tenYears >= 100000 ? 20 : 24 }}>{state.settings.hideAmounts ? '••' : rupees(w.tenYears)}</span>
              <span className="cap">if invested at 10%</span>
            </div>
          </div>

          <section className="glass col" style={{ gap: 8 }}>
            <div className="row">
              <div className={`ico${covered ? '' : ' w'}`}><Icon name={covered ? 'check' : 'clock'} /></div>
              <p className="body grow ink">
                {covered
                  ? `Your ${soon!.name} pot can cover ${label}. That’s what it’s for.`
                  : soon
                    ? `Your ${soon.name} pot is ${state.settings.hideAmounts ? 'short' : `${rupees(n - soon.balance)} short`}. Save for ${label}, or sleep on it.`
                    : 'No Soon pot yet. Save for it first.'}
              </p>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn2" onClick={sleepOn}><Icon name="moon" small />Sleep on it</button>
              <button className="btn2" onClick={saveFor}><Icon name="plus" small />Save for it</button>
            </div>
            {covered && <SwipeConfirm label={`Slide to buy from ${soon!.name}`} icon="heart" onConfirm={() => buy(null, n, label)} />}
          </section>
        </>
      )}

      {cooling.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Sleeping on it</h2><span className="cap">{COOL_HOURS}-hour rule</span></div>
          {cooling.map((x) => {
            const l = left(x.at);
            return (
              <div key={x.id} className="plate col" style={{ gap: 8 }}>
                <div className="row">
                  <div className="col grow" style={{ gap: 2 }}><span className="med">{x.name}</span><span className="cap">{l ?? 'Time’s up. Still want it?'}</span></div>
                  <Money value={x.price} />
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="chip grow" style={{ justifyContent: 'center', height: 40 }} onClick={() => { update((d) => { const y = d.wishes.find((z) => z.id === x.id); if (y) y.status = 'dropped'; }); toast(`Dropped. ${rupees(x.price)} stays yours.`); }}>Don’t want it</button>
                  <button className="chip grow" style={{ justifyContent: 'center', height: 40 }} onClick={() => buy(x.id, x.price, x.name)}>{l ? 'Buy early' : 'Still want it'}</button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {dropped > 0 && (
        <section className="glass col" style={{ gap: 4, alignItems: 'center', textAlign: 'center' }}>
          <span className="eye accx">Money you didn’t spend</span>
          <span className="big-saved">{state.settings.hideAmounts ? '₹••,•••' : rupees(shownDropped)}</span>
          <span className="cap">On things you stopped wanting after sleeping on them.</span>
        </section>
      )}

      <div className="foot" />
    </Screen>
  );
}
