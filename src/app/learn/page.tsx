'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { GLOSSARY } from '@/lib/data';

function dayIndex(n: number) {
  const d = new Date();
  return (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % n;
}

function Learn() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const s = q.trim().toLowerCase();
  const list = GLOSSARY.filter((g) => !s || g.term.toLowerCase().includes(s) || g.short.toLowerCase().includes(s) || g.long.toLowerCase().includes(s));
  const tod = GLOSSARY[dayIndex(GLOSSARY.length)];

  return (
    <Screen orbs="a">
      <TopBar back="/" label="Jargon Buster" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">Money words,<br />minus the gyaan.</h1>
        <p className="body">{GLOSSARY.length} terms, one line each. Tap for the longer version.</p>
      </div>

      {!s && (
        <section className="glass col tod" style={{ gap: 6 }}>
          <span className="eye">Word of the day</span>
          <span className="h1" style={{ fontSize: 30 }}>{tod.term}</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{tod.short}</span>
          <span className="cap" style={{ fontSize: 14 }}>{tod.long}</span>
        </section>
      )}

      <div className="field">
        <Icon name="search" style={{ color: 'var(--ink3)' }} />
        <label htmlFor="gl-q" className="sr">Search terms</label>
        <input id="gl-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="SIP, NAV, pledged…" autoComplete="off" />
      </div>

      <section className="col" style={{ gap: 8 }}>
        {list.map((g) => (
          <details key={g.term} className="gl" open={!!s && list.length <= 2}>
            <summary>
              <span className="col grow" style={{ gap: 2 }}>
                <span className="med" style={{ fontSize: 16 }}>{g.term}</span>
                <span className="cap">{g.short}</span>
              </span>
              <Icon name="chevR" />
            </summary>
            <div className="gl-body">{g.long}</div>
          </details>
        ))}
        {list.length === 0 && <p className="body center">Nothing for “{q}”. Try a simpler word.</p>}
      </section>
      <div className="foot" />
    </Screen>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Learn />
    </Suspense>
  );
}
