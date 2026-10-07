'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, Money, Ring, Sheet, AmountField } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { AddMoneySheet } from '@/components/AddMoneySheet';
import { ThemeToggle } from '@/components/Theme';
import { WhatIfSheet } from '@/components/WhatIf';
import { useCountUp } from '@/lib/fx';
import { MoodCheckIn } from '@/components/Mood';
import { useStore } from '@/lib/store';
import { BUCKET_LABEL } from '@/lib/data';
import { potsTotal, runway, twin } from '@/lib/logic';
import { fmtDay, monthKey, parseAmount, relDay, rupees, uid } from '@/lib/format';
import type { Bucket } from '@/lib/types';

const POT_ICON: Record<Bucket, IconName> = { soon: 'clock', later: 'calendar', never: 'lock' };

export default function Home() {
  const { state, update, toast, t } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [spendOpen, setSpendOpen] = useState(false);
  const [newPotOpen, setNewPotOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const rw = runway(state);
  const saved = potsTotal(state);
  const hidden = state.settings.hideAmounts;
  const unread = state.notes.filter((n) => !n.read).length;
  const tw = twin(state);
  const shownRunway = useCountUp(rw.value);

  const lastIncome = state.credits.find((c) => c.kind === 'income');
  const caption = hidden
    ? 'Amounts hidden'
    : state.persona === 'salary'
      ? `Salary lands on the 1st · ${fmtDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())}`
      : state.persona === 'irregular' && lastIncome
        ? `${rupees(lastIncome.amount)} landed ${relDay(lastIncome.at)}`
        : state.persona === 'irregular'
          ? 'Whatever lands, whenever'
          : 'No salary, no problem';

  const splitDone = state.lastSplitMonth === monthKey();
  const irregularSlice = Math.max(100, Math.round(((lastIncome?.amount ?? 8500) * state.lands.share) / 100));

  return (
    <Screen orbs={state.persona === 'student' ? 'b' : state.persona === 'irregular' ? 'c' : 'a'}>
      <header className="row sp">
        <div className="col" style={{ gap: 4 }}>
          <span className="cap">{caption}</span>
          <h1 className="h1">{hidden ? 'Safe to open\non the metro.' : t.headline[state.persona]}</h1>
        </div>
        <div className="row" style={{ gap: 8, alignSelf: 'flex-start' }}>
          <ThemeToggle />
          {hidden ? (
            <button className="av" aria-label="Show amounts" onClick={() => update((d) => { d.settings.hideAmounts = false; })}>
              <Icon name="eyeOff" />
            </button>
          ) : (
            <Link className="av" href="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
              <Icon name="bell" />
              {unread > 0 && <span className="badge" />}
            </Link>
          )}
        </div>
      </header>

      <section className="glass col" style={{ alignItems: 'center', gap: 12 }}>
        <button className="ringbtn" onClick={() => setWhatIfOpen(true)} aria-label={`Runway ${rw.display} ${rw.unit}. Open the what-if planner`}>
          <Ring fill={rw.fill}>
            <span className="eye">{t.runway}</span>
            <span className="hero">{rw.unit === 'days' ? Math.round(shownRunway) : shownRunway.toFixed(1)}</span>
            <span className="cap">{rw.unit} of freedom</span>
          </Ring>
          <span className="chip ringhint"><Icon name="wand" small />What if?</span>
        </button>
        <button className="plate row sp" style={{ minHeight: 44 }} onClick={() => setSpendOpen(true)} aria-label="Change monthly spend">
          <span className="cap ink2">
            {hidden ? 'Not a rupee figure, so it stays' : `${rupees(saved)} saved ÷ ${rupees(state.monthlySpend)}/month`}
          </span>
          <span className="chip acc">Goal: {rw.goal}</span>
        </button>
      </section>

      <nav className="qa" aria-label="Quick actions">
        <Link href="/worth"><span className="tile t-pink"><Icon name="scale" /></span><span className="lbl">Worth it?</span></Link>
        <Link href="/jar">
          <span className="tile t-amb"><Icon name="jar" />{state.jar.balance >= 1 && !hidden && <span className="pip">₹{Math.floor(state.jar.balance)}</span>}</span>
          <span className="lbl">Chillar Jar</span>
        </Link>
        <Link href="/recap"><span className="tile t-acc"><Icon name="story" /></span><span className="lbl">Your week</span></Link>
        <Link href="/shagun"><span className="tile t-ind"><Icon name="gift" /></span><span className="lbl">Shagun</span></Link>
        <Link href="/learn"><span className="tile t-ink"><Icon name="book" /></span><span className="lbl">Jargon Buster</span></Link>
      </nav>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">{t.pots}</h2>
          <button className="chip" onClick={() => setNewPotOpen(true)}><Icon name="plus" small />New pot</button>
        </div>
        {state.pots.map((pot) => (
          <Link key={pot.id} href={`/pots/${pot.id}`} className="plate row">
            <div className={`ico${pot.bucket === 'never' ? ' n' : ''}`}><Icon name={POT_ICON[pot.bucket]} /></div>
            <div className="col grow"><span className="eye">{BUCKET_LABEL[pot.bucket]}</span><span className="med">{pot.name}</span></div>
            <Money value={pot.balance} />
          </Link>
        ))}
      </section>

      <MoodCheckIn />

      <section className="col" style={{ gap: 8 }}>
        <Link href="/twin" className="glass row" style={{ padding: '12px 16px' }}>
          <div className="ico n"><Icon name="twin" /></div>
          <div className="col grow">
            <span className="eye">Lazy Twin</span>
            <span className="med">{tw.gap > 0 ? `Your twin is ${hidden ? 'ahead' : `${rupees(tw.gap)} ahead`}` : tw.gap < 0 ? 'You’re ahead of your twin' : 'Neck and neck with your twin'}</span>
          </div>
          <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
        </Link>

        {state.crash.held !== true && (
          <Link href="/crash" className="glass row" style={{ padding: '12px 16px' }}>
            <div className="lp">L</div>
            <div className="col grow"><span className="eye">Learner’s licence</span><span className="med">Survive a fake crash, 90 seconds</span></div>
            <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
          </Link>
        )}
      </section>

      <div className="foot">
        {state.persona === 'salary' && (
          <Link className="btn" href="/split">
            {splitDone ? 'Split extra income' : hidden ? 'Split this month’s salary' : `Split this month's ${rupees(state.monthlyIncome)}`}
          </Link>
        )}
        {state.persona === 'student' && (
          <button className="btn" onClick={() => setAddOpen(true)}><Icon name="plus" />Drop in ₹100</button>
        )}
        {state.persona === 'irregular' && (
          <button className="btn" onClick={() => setAddOpen(true)}>
            {lastIncome && !hidden ? `Invest ${rupees(irregularSlice)} of ${relDay(lastIncome.at) === 'today' ? 'today’s' : 'the last'} ${rupees(lastIncome.amount)}` : 'Park a slice'}
          </button>
        )}
      </div>

      {addOpen && (
        <AddMoneySheet
          open
          onClose={() => setAddOpen(false)}
          defaultAmount={state.persona === 'irregular' ? irregularSlice : 100}
          defaultPot={state.persona === 'irregular' ? 'never' : state.pots[0]?.id}
          title={state.persona === 'irregular' ? 'Park a slice' : 'Drop money into a pot'}
          presets={state.persona === 'irregular' ? [irregularSlice, 500, 1000, 2000].filter((v, i, a) => a.indexOf(v) === i) : [100, 200, 500, 1000]}
        />
      )}
      {spendOpen && <SpendSheet onClose={() => setSpendOpen(false)} />}
      {newPotOpen && <NewPotSheet onClose={() => setNewPotOpen(false)} />}
      {whatIfOpen && <WhatIfSheet onClose={() => setWhatIfOpen(false)} />}
    </Screen>
  );
}

function SpendSheet({ onClose }: { onClose: () => void }) {
    const { state, update, toast } = useStore();
    const [v, setV] = useState(String(state.monthlySpend));
    const n = parseAmount(v);
    return (
      <Sheet open onClose={onClose} label="Monthly spend">
        <h2 className="h1" style={{ fontSize: 26 }}>What does a month cost you?</h2>
        <p className="body">Rent, food, travel, recharges. Runway is your savings divided by this.</p>
        <AmountField id="spend" label="Monthly spend" value={v} onChange={setV} />
        <button className="btn" disabled={n < 500} onClick={() => { update((d) => { d.monthlySpend = n; }); toast('Runway updated'); onClose(); }}>Save</button>
      </Sheet>
    );
  }

function NewPotSheet({ onClose }: { onClose: () => void }) {
    const { update, toast } = useStore();
    const [name, setName] = useState('');
    const [bucket, setBucket] = useState<Bucket>('soon');
    const [target, setTarget] = useState('');
    return (
      <Sheet open onClose={onClose} label="New pot">
        <h2 className="h1" style={{ fontSize: 26 }}>A new pot</h2>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="pot-name" className="eye" style={{ padding: '0 4px' }}>Name</label>
          <div className="field"><input id="pot-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Diwali gifts" maxLength={32} /></div>
        </div>
        <div className="col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>When will you need it?</span>
          <div className="seg" role="tablist" aria-label="Bucket">
            {(['soon', 'later', 'never'] as Bucket[]).map((b) => (
              <button key={b} role="tab" aria-selected={bucket === b} onClick={() => setBucket(b)}>{BUCKET_LABEL[b]}</button>
            ))}
          </div>
        </div>
        <AmountField id="pot-target" label="Target" value={target} onChange={setTarget} />
        <button
          className="btn"
          disabled={!name.trim() || parseAmount(target) <= 0}
          onClick={() => {
            update((d) => { d.pots.push({ id: uid(), name: name.trim(), bucket, balance: 0, target: parseAmount(target) }); });
            toast(`${name.trim()} created`);
            onClose();
          }}
        >
          Create pot
        </button>
      </Sheet>
    );
  }
