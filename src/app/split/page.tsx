'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { SwipeConfirm } from '@/components/SwipeConfirm';
import { useStore } from '@/lib/store';
import { BUCKET_LABEL } from '@/lib/data';
import { addToPot, note } from '@/lib/logic';
import { monthKey, parseAmount, rupees } from '@/lib/format';

const STEP = 500;
const WEIGHT = { soon: 0.3, later: 0.3, never: 0.4 } as const;

export default function Split() {
  const { state, update, toast, celebrate } = useStore();
  const router = useRouter();
  const [income, setIncome] = useState(String(state.monthlyIncome));
  const total = parseAmount(income);

  const suggestion = useMemo(() => {
    const left = Math.max(0, total - state.monthlySpend);
    const w = state.pots.reduce((a, p) => a + WEIGHT[p.bucket], 0) || 1;
    return Object.fromEntries(state.pots.map((p) => [p.id, Math.floor((left * WEIGHT[p.bucket]) / w / 100) * 100]));
  }, [total, state.monthlySpend, state.pots]);

  const [alloc, setAlloc] = useState<Record<string, number>>(suggestion);
  const allocated = Object.values(alloc).reduce((a, b) => a + b, 0);
  const spend = total - allocated;

  const bump = (id: string, by: number) =>
    setAlloc((a) => {
      const next = Math.max(0, (a[id] ?? 0) + by);
      const others = allocated - (a[id] ?? 0);
      return { ...a, [id]: Math.min(next, Math.max(0, total - others)) };
    });

  const confirm = () => {
    update((d) => {
      for (const [id, amt] of Object.entries(alloc)) addToPot(d, id, amt);
      d.lastSplitMonth = monthKey();
      d.monthlyIncome = total;
      note(d, `Split done: ${rupees(allocated)} into pots`, `${rupees(spend)} left for spending this month.`, '/');
    });
    toast(`${rupees(allocated)} split into your pots`);
    router.push('/');
  };

  return (
    <Screen orbs="b">
      <TopBar back="/" label="Split this month" />
      <h1 className="h1">Pay your pots first.<br />Spend what’s left.</h1>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="income" className="eye" style={{ padding: '0 4px' }}>This month’s salary</label>
          <div className="field">
            <span className="pre">₹</span>
            <input id="income" inputMode="numeric" value={income} onChange={(e) => { setIncome(e.target.value.replace(/[^\d,]/g, '')); }} />
            <button className="chip" type="button" onClick={() => setAlloc(suggestion)}>Suggest</button>
          </div>
        </div>
        {state.pots.map((p) => (
          <div key={p.id} className="plate row">
            <div className="col grow"><span className="eye">{BUCKET_LABEL[p.bucket]}</span><span className="med">{p.name}</span></div>
            <button className="av xs" aria-label={`Less into ${p.name}`} onClick={() => bump(p.id, -STEP)}><Icon name="minus" small /></button>
            <span className="amt" style={{ minWidth: 76, textAlign: 'center' }}>{rupees(alloc[p.id] ?? 0)}</span>
            <button className="av xs" aria-label={`More into ${p.name}`} onClick={() => bump(p.id, STEP)}><Icon name="plus" small /></button>
          </div>
        ))}
        <div className="hr" style={{ margin: '2px 4px' }} />
        <div className="plate row sp">
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">Left to spend</span>
            <span className="num" style={spend < state.monthlySpend ? { color: 'var(--amb-ink)' } : undefined}>{rupees(spend)}</span>
          </div>
          <span className="cap" style={{ textAlign: 'right', maxWidth: 140 }}>
            {spend < state.monthlySpend ? `Below your usual ${rupees(state.monthlySpend)}` : `Your usual month is ${rupees(state.monthlySpend)}`}
          </span>
        </div>
      </section>

      <p className="cap">Money moves on confirm. Soon goes to a liquid fund, Later to a low-risk debt fund, Never touch to a Nifty 50 index fund.</p>

      <div className="foot">
        <SwipeConfirm label={`Slide to split ${rupees(allocated)}`} icon="lands" disabled={allocated <= 0 || spend < 0} onConfirm={confirm} />
      </div>
    </Screen>
  );
}
