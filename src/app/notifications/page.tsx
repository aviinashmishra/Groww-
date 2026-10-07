'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { useStore } from '@/lib/store';
import { fmtTime, relDay } from '@/lib/format';

export default function Notifications() {
  const { state, update } = useStore();
  const hasUnread = state.notes.some((n) => !n.read);

  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(() => update((d) => { d.notes.forEach((n) => { n.read = true; }); }), 1200);
    return () => clearTimeout(t);
  }, [hasUnread, update]);

  return (
    <Screen orbs="c">
      <TopBar back="/" label="Notifications" />
      <h1 className="h1">What happened.</h1>
      {state.notes.length === 0 ? (
        <p className="body">Nothing yet. Quiet is good.</p>
      ) : (
        <section className="glass col" style={{ gap: 8 }}>
          {state.notes.map((n) => {
            const inner = (
              <>
                <span className={`dot${n.read ? ' o' : ''}`} style={{ marginTop: 6 }} />
                <span className="col grow" style={{ gap: 2 }}>
                  <span className="med">{n.title}</span>
                  <span className="cap">{n.body}</span>
                </span>
                <span className="cap" style={{ whiteSpace: 'nowrap' }}>{relDay(n.at) === 'today' ? fmtTime(n.at) : relDay(n.at)}</span>
              </>
            );
            return n.href ? (
              <Link key={n.id} href={n.href} className="plate row" style={{ alignItems: 'flex-start' }}>{inner}</Link>
            ) : (
              <div key={n.id} className="plate row" style={{ alignItems: 'flex-start' }}>{inner}</div>
            );
          })}
        </section>
      )}
      <div className="foot" />
    </Screen>
  );
}
