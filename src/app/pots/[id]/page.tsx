'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar, Money, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { AddMoneySheet } from '@/components/AddMoneySheet';
import { SwipeConfirm } from '@/components/SwipeConfirm';
import { FutureYou } from '@/components/FutureYou';
import { useStore } from '@/lib/store';
import { BUCKET_LABEL, marketToday } from '@/lib/data';
import { note } from '@/lib/logic';
import { changeWords, fmtDate, fmtTime, parseAmount, rupees, uid } from '@/lib/format';
import type { Bucket } from '@/lib/types';

export default function PotPage() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useStore();
  const router = useRouter();
  const pot = state.pots.find((p) => p.id === id);
  const [sheet, setSheet] = useState<null | 'add' | 'withdraw' | 'edit' | 'wait'>(null);
  const [amount, setAmount] = useState('');

  if (!pot) {
    return (
      <Screen>
        <TopBar back="/" label="Pot" />
        <h1 className="h1">This pot doesn’t exist any more.</h1>
        <div className="foot"><Link className="btn" href="/">Back home</Link></div>
      </Screen>
    );
  }

  const progress = pot.target > 0 ? Math.min(1, pot.balance / pot.target) : 0;
  const n = parseAmount(amount);
  const market = marketToday();
  const sleeping = state.twin.sleepUntil && new Date(state.twin.sleepUntil).getTime() > Date.now();
  const soon = state.pots.find((p) => p.bucket === 'soon' && p.id !== pot.id);
  const downDaySells = state.twin.moves.filter((m) => m.label.toLowerCase().includes('sold')).length;

  const withdraw = (amt: number) => {
    update((d) => {
      const p = d.pots.find((x) => x.id === pot.id);
      if (!p) return;
      p.balance -= amt;
      if (p.bucket === 'never' && market < 0) {
        d.twin.moves.unshift({
          id: uid(), at: new Date().toISOString(),
          label: `Sold on a down day, ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
          detail: `Estimated cost vs. holding: market was ${changeWords(market).toLowerCase()}`,
          impact: -Math.round(amt * 0.03),
        });
      }
      d.twin.sleepUntil = undefined;
      note(d, `${rupees(amt)} out of ${p.name}`, 'Sent to your bank account.', `/pots/${p.id}`);
    });
    toast(`${rupees(amt)} withdrawn`);
    setSheet(null);
    setAmount('');
  };

  const requestWithdraw = () => {
    if (n <= 0 || n > pot.balance) return;
    if (pot.bucket === 'never' && state.twin.pauseBeforeSell) setSheet('wait');
    else withdraw(n);
  };

  return (
    <Screen orbs={pot.bucket === 'soon' ? 'a' : pot.bucket === 'later' ? 'b' : 'c'}>
      <TopBar back="/" label={`${BUCKET_LABEL[pot.bucket]} pot`} />
      <h1 className="h1">{pot.name}</h1>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="plate col" style={{ gap: 12, padding: 16 }}>
          <div className="row sp" style={{ alignItems: 'flex-end' }}>
            <div className="col" style={{ gap: 4 }}>
              <span className="eye">Balance</span>
              <Money value={pot.balance} className="hero" style={{ fontSize: 48 }} />
            </div>
            <span className="chip acc">{Math.round(progress * 100)}% there</span>
          </div>
          <div className="bar" style={{ height: 12, borderRadius: 6 }}><i style={{ width: `${progress * 100}%` }} /></div>
          <div className="row sp">
            <span className="cap">Target <Money value={pot.target} className="" /></span>
            <span className="cap">{pot.bucket === 'never' ? 'Nifty 50 index fund' : pot.bucket === 'later' ? 'Debt fund, low risk' : 'Liquid fund, instant out'}</span>
          </div>
        </div>
        {pot.bucket === 'never' && (
          <div className="plate row sp">
            <span className="cap ink2">Market today (demo)</span>
            <span className="amt" style={{ fontSize: 15 }}>{changeWords(market)}</span>
          </div>
        )}
      </section>

      {sleeping && (
        <section className="glass row" style={{ alignItems: 'flex-start' }}>
          <div className="ico n"><Icon name="moon" /></div>
          <p className="body grow ink">You chose to sleep on selling. We’ll ask again after {fmtTime(state.twin.sleepUntil!)}, {fmtDate(state.twin.sleepUntil!)}.</p>
        </section>
      )}

      {pot.bucket !== 'soon' && <FutureYou pot={pot} />}

      <div className="row" style={{ gap: 8 }}>
        <button className="btn2" onClick={() => setSheet('edit')}><Icon name="edit" small />Edit</button>
        <button className="btn2" onClick={() => { setAmount(''); setSheet('withdraw'); }} disabled={pot.balance <= 0}>
          {pot.bucket === 'never' ? 'Sell' : 'Withdraw'}
        </button>
      </div>

      <div className="foot">
        <button className="btn" onClick={() => setSheet('add')}><Icon name="plus" />Add money</button>
      </div>

      {sheet === 'add' && <AddMoneySheet open onClose={() => setSheet(null)} defaultPot={pot.id} defaultAmount={pot.bucket === 'never' ? 500 : 1000} presets={[500, 1000, 2000, 5000]} title={`Add to ${pot.name}`} />}

      <Sheet open={sheet === 'withdraw'} onClose={() => setSheet(null)} label="Withdraw">
        <h2 className="h1" style={{ fontSize: 26 }}>{pot.bucket === 'never' ? 'Sell from Never touch' : `Take money out of ${pot.name}`}</h2>
        <AmountField id="wd" label="Amount" value={amount} onChange={setAmount} max={pot.balance} />
        {n > pot.balance && <p className="err">This pot has {rupees(pot.balance)}.</p>}
        <button className="btn" disabled={n <= 0 || n > pot.balance} onClick={requestWithdraw}>
          {pot.bucket === 'never' ? 'Sell' : 'Withdraw'} {n > 0 ? rupees(n) : ''}
        </button>
      </Sheet>

      <Sheet open={sheet === 'wait'} onClose={() => setSheet(null)} label="Before you sell">
        <div className="row" style={{ gap: 10 }}>
          <div className="ico n"><Icon name="moon" /></div>
          <span className="eye">Before you sell</span>
        </div>
        <h2 className="h1" style={{ fontSize: 32 }}>Lazy Twin would wait.</h2>
        <div className="col" style={{ gap: 8 }}>
          {downDaySells > 0 && (
            <div className="plate col" style={{ gap: 2 }}>
              <span className="med">You’ve sold on a down day {downDaySells === 1 ? 'once' : downDaySells === 2 ? 'twice' : `${downDaySells} times`}</span>
              <span className="cap">Each time it cost you against holding. Market today: {changeWords(market).toLowerCase()}.</span>
            </div>
          )}
          <div className="plate col" style={{ gap: 2 }}>
            <span className="med">This pot is labelled Never touch</span>
            <span className="cap">You named it.{soon && soon.balance > 0 ? ` Need cash? Your ${soon.name} pot has ${state.settings.hideAmounts ? 'money in it' : rupees(soon.balance)}.` : ''}</span>
          </div>
        </div>
        <div className="col" style={{ gap: 2 }}>
          <button
            className="btn"
            onClick={() => {
              update((d) => {
                d.twin.sleepUntil = new Date(Date.now() + 86400000).toISOString();
                note(d, 'Still want to sell?', `You paused a ${rupees(n)} sale. Decide with a clear head.`, `/pots/${pot.id}`);
              });
              toast('Okay. We’ll ask you tomorrow.');
              setSheet(null);
            }}
          >
            <Icon name="clock" />Sleep on it, ask me tomorrow
          </button>
          <div style={{ marginTop: 8 }}><SwipeConfirm warn label={`Slide to sell ${rupees(n)} anyway`} onConfirm={() => withdraw(n)} /></div>
        </div>
      </Sheet>

      {sheet === 'edit' && <EditPotSheet id={pot.id} onClose={() => setSheet(null)} onDeleted={() => router.replace('/')} />}
    </Screen>
  );
}

function EditPotSheet({ id, onClose, onDeleted }: { id: string; onClose: () => void; onDeleted: () => void }) {
  const { state, update, toast } = useStore();
  const pot = state.pots.find((p) => p.id === id)!;
  const [name, setName] = useState(pot.name);
  const [bucket, setBucket] = useState<Bucket>(pot.bucket);
  const [target, setTarget] = useState(String(pot.target));
  const canDelete = pot.balance === 0 && state.pots.length > 1;
  return (
    <Sheet open onClose={onClose} label="Edit pot">
      <h2 className="h1" style={{ fontSize: 26 }}>Edit pot</h2>
      <div className="col" style={{ gap: 8 }}>
        <label htmlFor="ep-name" className="eye" style={{ padding: '0 4px' }}>Name</label>
        <div className="field"><input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} /></div>
      </div>
      <div className="seg" role="tablist" aria-label="Bucket">
        {(['soon', 'later', 'never'] as Bucket[]).map((b) => (
          <button key={b} role="tab" aria-selected={bucket === b} onClick={() => setBucket(b)}>{BUCKET_LABEL[b]}</button>
        ))}
      </div>
      <AmountField id="ep-target" label="Target" value={target} onChange={setTarget} />
      <button
        className="btn"
        disabled={!name.trim() || parseAmount(target) <= 0}
        onClick={() => {
          update((d) => {
            const p = d.pots.find((x) => x.id === id);
            if (p) { p.name = name.trim(); p.bucket = bucket; p.target = parseAmount(target); }
          });
          toast('Pot saved');
          onClose();
        }}
      >
        Save
      </button>
      <button
        className="ghost"
        disabled={!canDelete}
        onClick={() => {
          update((d) => { d.pots = d.pots.filter((x) => x.id !== id); if (d.lands.potId === id) d.lands.potId = d.pots[0].id; });
          toast('Pot deleted');
          onDeleted();
        }}
      >
        <Icon name="trash" small />{canDelete ? 'Delete this pot' : 'Empty the pot to delete it'}
      </button>
    </Sheet>
  );
}
