'use client';

import Link from 'next/link';
import { Screen, TopBar } from '@/components/ui';

export default function Odds() {
  return (
    <Screen orbs="c" nav={false}>
      <TopBar back="/fun" close label="F&O · the honest odds" />
      <h1 className="h1" style={{ fontSize: 36, lineHeight: 1.1, marginTop: 8 }}>About 9 in 10 traders your age lost money last year.</h1>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="plate col" style={{ gap: 12, padding: '16px 14px' }}>
          <div className="row" style={{ gap: 7 }} role="img" aria-label="Nine out of ten lost money">
            {Array.from({ length: 9 }, (_, i) => <span key={i} className="dot w" style={{ width: 22, height: 22 }} />)}
            <span className="dot" style={{ width: 22, height: 22, background: 'transparent', border: '4px solid var(--acc-line)' }} />
          </div>
          <div className="row sp">
            <span className="cap ambx" style={{ fontWeight: 600 }}>9 lost money</span>
            <span className="cap accx" style={{ fontWeight: 600 }}>1 didn’t</span>
          </div>
        </div>
        <div className="plate col" style={{ gap: 2 }}>
          <span className="med">It isn’t investing, only faster</span>
          <span className="cap">It’s a different game. Fees and taxes on every trade, and professionals on the other side.</span>
        </div>
        <div className="plate col" style={{ gap: 2 }}>
          <span className="med">Nobody thinks they’re the nine</span>
          <span className="cap">Neither did the nine.</span>
        </div>
      </section>

      <p className="cap">Source: SEBI study of individual F&amp;O traders. We’ll show you this again every time, in the same size.</p>

      <div className="foot nonav">
        <Link className="btn" href="/fun"><span className="lp inbtn">L</span>Stay on stocks</Link>
        <Link className="ghost" href="/fun/unlock">I still want to unlock F&amp;O</Link>
      </div>
    </Screen>
  );
}
