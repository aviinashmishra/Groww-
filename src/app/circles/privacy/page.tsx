'use client';

import Link from 'next/link';
import { Screen, TopBar, Dots } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { landings } from '@/lib/logic';

const ROWS: [string, string, boolean][] = [
  ['Consistency', 'Showed up or skipped', true],
  ['Shared goal', 'As a percent of the total', true],
  ['Amounts', 'What you put in or hold', false],
  ['Returns', 'Gains, losses, ranks', false],
  ['What you own', 'Funds, stocks, Fun Pot', false],
];

export default function Privacy() {
  const { state } = useStore();
  const l = landings(state);
  const friend = state.circle.members.find((m) => !m.isYou)?.name ?? 'a friend';

  return (
    <Screen orbs="b">
      <TopBar back="/circles" label="Circles · privacy" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1" style={{ fontSize: 32 }}>Dosti mein paisa nahi dikhta.</h1>
        <p className="body">Friends see whether you showed up. Never how much.</p>
      </div>

      <section className="glass col" style={{ gap: 8 }}>
        <span className="eye" style={{ padding: '0 4px' }}>Your card, as {friend} sees it</span>
        <div className="plate row">
          <div className="av sm">{state.name.charAt(0).toUpperCase()}</div>
          <div className="col grow" style={{ gap: 6 }}>
            <span className="med">{state.name}</span>
            {l.length ? <Dots values={l} /> : <span className="cap">No landings yet</span>}
          </div>
          <span className="amt">{l.filter(Boolean).length} of {l.length || 8}</span>
        </div>
      </section>

      <section className="glass col" style={{ gap: 10 }}>
        {ROWS.map(([title, sub, shown], i) => (
          <div key={title} className="col" style={{ gap: 10 }}>
            {i === 2 && <div className="hr" />}
            <div className="row">
              <div className={`ico${shown ? '' : ' n'}`}><Icon name={shown ? 'check' : 'lock'} /></div>
              <div className="col grow"><span className="med">{title}</span><span className="cap">{sub}</span></div>
              <span className={`chip${shown ? ' acc' : ''}`}>{shown ? 'Shown' : 'Never'}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="foot">
        <Link className="btn" href="/circles">Looks right</Link>
      </div>
    </Screen>
  );
}
