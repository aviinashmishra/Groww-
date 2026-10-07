'use client';

import { useState } from 'react';
import { Screen, TopBar, Ring, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { circleGoal, note } from '@/lib/logic';
import { parseAmount, rupees } from '@/lib/format';

export default function Goal() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const g = circleGoal(state);
  const goal = state.circle.goal;
  const weeks = Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (7 * 86400000)));
  const fair = goal.target / state.circle.members.length;
  // Expected share by now, assuming the goal was set 16 weeks before the deadline.
  const elapsed = Math.min(1, Math.max(0.05, (16 - weeks) / 16));
  const pace = (share: number) => {
    const r = share / (fair * elapsed);
    return r >= 1.15 ? 'Ahead' : r >= 0.85 ? 'On pace' : 'Catching up';
  };

  return (
    <Screen orbs="a">
      <TopBar back="/circles" label={`${state.circle.name} · shared goal`} />

      <section className="glass row" style={{ gap: 16 }}>
        <Ring fill={g.pct / 100} size={140}>
          <span className="hero" style={{ fontSize: 44 }}>{g.pct}%</span>
          <span className="cap">there</span>
        </Ring>
        <div className="col grow" style={{ gap: 6 }}>
          <h1 className="h1">{goal.name}.</h1>
          <span className="cap">{weeks} weeks to go. {g.pct >= 100 ? 'Done. Pack your bags.' : pace(g.total / state.circle.members.length) === 'Catching up' ? 'Thoda push chahiye.' : 'On pace, bas thoda aur.'}</span>
        </div>
      </section>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">Who’s where</h2>
          <span className="cap">Pace only</span>
        </div>
        {state.circle.members.map((m) => {
          const p = pace(m.share);
          return (
            <div key={m.id} className={`plate row${m.isYou ? ' you' : ''}`}>
              <div className="av xs">{(m.isYou ? state.name : m.name).charAt(0).toUpperCase()}</div>
              <span className="grow med">{m.name}</span>
              <span className={`chip${p === 'Catching up' ? '' : ' acc'}`}>{p}</span>
            </div>
          );
        })}
      </section>

      <p className="cap">Each person’s share is private. The circle sees one number: the total, as a percent.</p>

      <div className="foot">
        <button className="btn" onClick={() => setOpen(true)} disabled={g.pct >= 100}><Icon name="plus" />Add my share</button>
      </div>
      {open && <AddShare onClose={() => setOpen(false)} />}
    </Screen>
  );
}

function AddShare({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const [v, setV] = useState('1000');
  const n = parseAmount(v);
  const remaining = Math.max(0, state.circle.goal.target - circleGoal(state).total);
  return (
    <Sheet open onClose={onClose} label="Add my share">
      <h2 className="h1" style={{ fontSize: 26 }}>Add to {state.circle.goal.name}</h2>
      <p className="body">Only you see this amount. The circle sees the new percent.</p>
      <AmountField id="share-amt" label="Amount" value={v} onChange={setV} max={remaining} />
      <button
        className="btn"
        disabled={n <= 0 || n > remaining}
        onClick={() => {
          update((d) => {
            const me = d.circle.members.find((m) => m.isYou);
            if (me) me.share += n;
            note(d, `${rupees(n)} into ${d.circle.goal.name}`, `${d.circle.name} is now ${circleGoal(d).pct}% there.`, '/circles/goal');
          });
          toast('Added. The circle sees the new percent.');
          onClose();
        }}
      >
        Add {n > 0 ? rupees(n) : ''}
      </button>
    </Sheet>
  );
}
