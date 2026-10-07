'use client';

import Link from 'next/link';
import { Screen, TopBar, LineChart, Money } from '@/components/ui';
import { useStore } from '@/lib/store';
import { monthsSince, twin } from '@/lib/logic';
import { fmtMonthYear, rupees } from '@/lib/format';

/** Two 13-point paths that end at today's values. The twin's is smooth; yours dips where you moved. */
function paths(you: number, tw: number, moves: { impact: number; at: string }[]) {
  const n = 13;
  const start = tw * 0.42;
  const twinLine = Array.from({ length: n }, (_, i) => start + (tw - start) * Math.pow(i / (n - 1), 1.15) * (1 + 0.012 * Math.sin(i * 1.3)));
  twinLine[n - 1] = tw;
  const youLine = twinLine.map((v, i) => {
    const lost = moves.reduce((a, m) => {
      const idx = Math.max(0, n - 1 - monthsSince(m.at));
      return i >= idx ? a + m.impact : a;
    }, 0);
    return v + lost;
  });
  youLine[n - 1] = you;
  return { twinLine, youLine };
}

export default function Twin() {
  const { state } = useStore();
  const t = twin(state);
  const { twinLine, youLine } = paths(t.you, t.twin, state.twin.moves);
  const hidden = state.settings.hideAmounts;
  const ahead = t.gap > 0;

  return (
    <Screen orbs="a">
      <TopBar back="/" label="Lazy Twin" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">
          {ahead ? `Your twin did nothing. They're ${hidden ? 'ahead' : `${rupees(t.gap)} ahead`}.` : t.gap < 0 ? `You beat your twin${hidden ? '' : ` by ${rupees(-t.gap)}`}.` : 'You and your twin are level.'}
        </h1>
        <p className="body">Same money in, same days. The twin just never sold or switched.</p>
      </div>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="plate" style={{ padding: 12 }}>
          <div className="row" style={{ gap: 14, marginBottom: 6 }}>
            <span className="row cap ink" style={{ gap: 6 }}><span className="dot" />You</span>
            <span className="row cap ink" style={{ gap: 6 }}><span className="dot o" />Lazy Twin</span>
          </div>
          <LineChart
            label={`Your invested pots against a twin who never sold or switched, over the last 12 months`}
            series={[{ values: twinLine, kind: 'b' }, { values: youLine, kind: 'a' }]}
          />
          <div className="row sp" style={{ marginTop: 4 }}>
            <span className="cap">{fmtMonthYear(new Date(Date.now() - 365 * 86400000).toISOString())}</span>
            <span className="cap">Today</span>
          </div>
        </div>
        <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
          <div className="plate col grow" style={{ gap: 4 }}>
            <span className="eye accx">You</span>
            <Money value={t.you} className="num" />
          </div>
          <div className="plate col grow" style={{ gap: 4 }}>
            <span className="eye">Lazy Twin</span>
            <Money value={t.twin} className="num" />
          </div>
        </div>
      </section>

      <div className="foot">
        <Link className="btn" href="/twin/gap">See what made the gap</Link>
      </div>
    </Screen>
  );
}
