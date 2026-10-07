'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { note } from '@/lib/logic';
import { rupees } from '@/lib/format';

export default function LandsSetup() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const [share, setShare] = useState(state.lands.share);
  const example = state.credits.find((c) => c.kind === 'income')?.amount ?? 8500;
  const target = state.pots.find((p) => p.id === state.lands.potId) ?? state.pots.find((p) => p.bucket === 'never');

  const save = () => {
    update((d) => {
      d.lands.share = share;
      if (!d.lands.enabled) note(d, `Invest what lands: ${share}% on`, 'Every credit, any date, any amount.', '/lands');
      d.lands.enabled = share > 0;
    });
    toast(share > 0 ? `On at ${share}%` : 'Turned off');
    router.push('/lands');
  };

  return (
    <Screen orbs="b">
      {state.lands.enabled ? <TopBar back="/lands" label="Invest what lands · share" /> : <span className="eye">Invest what lands</span>}
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1">No salary date?<br />Then no SIP date.</h1>
        <p className="body">Pick a share once. It goes in whenever money lands, on any date, in any amount.</p>
      </div>

      <section className="glass col" style={{ gap: 14 }}>
        <div className="plate col" style={{ alignItems: 'center', gap: 2, padding: 16 }}>
          <label htmlFor="share" className="eye">Invest this much of every credit</label>
          <span className="hero" style={{ fontSize: 72 }} aria-hidden="true">{share}%</span>
        </div>
        <div className="col" style={{ gap: 4, padding: '0 4px' }}>
          <input
            id="share"
            className="range"
            type="range"
            min={0}
            max={50}
            step={1}
            value={share}
            onChange={(e) => setShare(Number(e.target.value))}
            style={{ ['--pct' as string]: `${(share / 50) * 100}%` }}
            aria-valuetext={`${share} percent`}
          />
          <div className="row sp">
            {[0, 10, 20, 30, 40, 50].map((v) => (
              <button key={v} type="button" className="cap" onClick={() => setShare(v)} style={{ border: 0, background: 'none', padding: '6px 2px', color: share === v ? 'var(--ink)' : undefined, fontWeight: share === v ? 600 : 500 }}>{v}%</button>
            ))}
          </div>
        </div>
        <div className="plate row sp">
          <div className="col" style={{ gap: 2 }}>
            <span className="cap">If this lands</span>
            <span className="amt">{rupees(example)}</span>
          </div>
          <Icon name="arrowR" style={{ color: 'var(--ink3)' }} />
          <div className="col" style={{ gap: 2, alignItems: 'flex-end' }}>
            <span className="cap">This goes in</span>
            <span className="amt accx">{rupees(Math.round((example * share) / 100))}</span>
          </div>
        </div>
      </section>

      <p className="cap">Goes to your {target?.name ?? 'Never touch'} pot, Nifty 50 index fund. Credits are read through Account Aggregator, read-only. Refunds and transfers from yourself are ignored.</p>

      <div className="foot">
        <button className="btn" onClick={save}>{share === 0 ? 'Turn it off' : state.lands.enabled ? `Save at ${share}%` : `Turn it on at ${share}%`}</button>
      </div>
    </Screen>
  );
}
