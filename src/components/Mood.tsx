'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { buzz } from '@/lib/fx';
import { localDay } from '@/lib/format';

export const MOOD_LABEL = ['Stressed', 'Meh', 'Okay', 'Good', 'In control'];

/** Five hand-drawn faces; the mouth curves up as the mood improves. */
export function Face({ level }: { level: number }) {
  const curve = [-5, -2.5, 0, 3, 5.5][level - 1];
  const brow = level === 1;
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="var(--acc-soft)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12.5" cy="15" r="1.8" fill="currentColor" />
      <circle cx="23.5" cy="15" r="1.8" fill="currentColor" />
      {brow && <path d="M9.5 10.5l5 1.5M26.5 10.5l-5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
      <path d={`M11.5 ${23 - curve / 2} Q18 ${23 + curve} 24.5 ${23 - curve / 2}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {level === 5 && <path d="M28 6l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" stroke="none" />}
    </svg>
  );
}

const today = () => localDay();

function insight(moods: { day: string; mood: number }[]): string {
  if (moods.length < 3) return 'Check in a few days and we’ll show you a pattern. Feelings are data too.';
  const recent = moods.slice(-7);
  const good = recent.filter((m) => m.mood >= 4).length;
  const avg = recent.reduce((a, m) => a + m.mood, 0) / recent.length;
  if (avg >= 4) return `Calm ${good} of your last ${recent.length} check-ins. Runway does that.`;
  if (avg <= 2.2) return 'A rough stretch. Your Never touch pot exists for exactly this. Nothing to fix today.';
  return `Good on ${good} of your last ${recent.length} check-ins. Money feels better with a plan.`;
}

export function MoodCheckIn() {
  const { state, update } = useStore();
  const logged = state.moods.find((m) => m.day === today());
  const [editing, setEditing] = useState(false);
  const last14 = Array.from({ length: 14 }, (_, k) => {
    const d = localDay(new Date(Date.now() - (13 - k) * 86400000));
    return state.moods.find((m) => m.day === d)?.mood ?? 0;
  });

  const pick = (mood: number) => {
    buzz(10);
    update((d) => {
      const t = today();
      const ex = d.moods.find((m) => m.day === t);
      if (ex) ex.mood = mood;
      else d.moods.push({ day: t, mood });
      d.moods = d.moods.slice(-90);
    });
    setEditing(false);
  };

  if (logged && !editing) {
    return (
      <section className="glass col" style={{ gap: 10 }}>
        <div className="row">
          <span className="mood" style={{ padding: 4, border: 0, background: 'none', color: 'var(--acc-ink)' }}><Face level={logged.mood} /></span>
          <div className="col grow" style={{ gap: 2 }}>
            <span className="eye">Money mood · today</span>
            <span className="med">{MOOD_LABEL[logged.mood - 1]}</span>
          </div>
          <button className="chip" onClick={() => setEditing(true)}>Change</button>
        </div>
        <div className="mbars" role="img" aria-label="Money mood over the last 14 days">
          {last14.map((m, k) => <i key={k} className={m ? '' : 'empty'} style={{ height: `${m ? m * 20 : 10}%` }} />)}
        </div>
        <p className="cap">{insight(state.moods)}</p>
      </section>
    );
  }

  return (
    <section className="glass col" style={{ gap: 10 }}>
      <div className="row sp" style={{ padding: '0 4px' }}>
        <h2 className="h2">How does money feel today?</h2>
        <span className="cap">10 sec</span>
      </div>
      <div className="moods" role="group" aria-label="Money mood">
        {MOOD_LABEL.map((l, k) => (
          <button key={l} className="mood" aria-pressed={logged?.mood === k + 1} onClick={() => pick(k + 1)}>
            <Face level={k + 1} />
            <span>{l}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
