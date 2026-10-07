'use client';

import Link from 'next/link';
import { Screen, Dots } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { circleGoal, landings } from '@/lib/logic';

export default function Circles() {
  const { state, update, toast } = useStore();
  const you = landings(state);
  const members = state.circle.members.map((m) => (m.isYou ? { ...m, landings: you } : m));
  const score = (l: boolean[]) => l.slice(-8).filter(Boolean).length;
  const sorted = [...members].sort((a, b) => score(b.landings) - score(a.landings));
  const lowest = [...members].filter((m) => !m.isYou).sort((a, b) => score(a.landings) - score(b.landings))[0];
  const nudgedToday = lowest?.lastNudgedAt && Date.now() - new Date(lowest.lastNudgedAt).getTime() < 86400000;
  const g = circleGoal(state);

  return (
    <Screen orbs="c">
      <div className="row sp" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ gap: 6 }}>
          <span className="eye">Circles</span>
          <h1 className="h1">{state.circle.name}</h1>
        </div>
        <Link href="/circles/privacy" className="chip"><Icon name="eyeOff" small />No amounts, ever</Link>
      </div>
      <p className="body">Who showed up the last 8 times their money landed. Date and size don’t matter.</p>

      <section className="glass col" style={{ gap: 8 }}>
        {sorted.map((m) => {
          const l = m.landings.slice(-8);
          return (
            <div key={m.id} className={`plate row${m.isYou ? ' you' : ''}`}>
              <div className="av sm">{(m.isYou ? state.name : m.name).charAt(0).toUpperCase()}</div>
              <div className="col grow" style={{ gap: 6 }}>
                <span className="med">{m.name}</span>
                {l.length ? <Dots values={l} /> : <span className="cap">No landings yet. Turn on Invest what lands.</span>}
              </div>
              <span className="amt" style={score(l) < 4 ? { color: 'var(--ink3)' } : undefined}>{score(l)} of {l.length || 8}</span>
            </div>
          );
        })}
      </section>

      <Link className="glass row" href="/circles/goal" style={{ padding: '12px 16px' }}>
        <div className="col grow"><span className="eye">Shared goal</span><span className="med">{state.circle.goal.name} · {g.pct}% there</span></div>
        <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
      </Link>

      <div className="foot">
        {lowest && (
          <button
            className="btn"
            disabled={!!nudgedToday}
            onClick={() => {
              update((d) => { const m = d.circle.members.find((x) => x.id === lowest.id); if (m) m.lastNudgedAt = new Date().toISOString(); });
              toast(`Nudged ${lowest.name}. They only see “Hostel 4B misses you.”`);
            }}
          >
            <Icon name="bell" />{nudgedToday ? `Nudged ${lowest.name} today` : `Nudge ${lowest.name}, gently`}
          </button>
        )}
      </div>
    </Screen>
  );
}
