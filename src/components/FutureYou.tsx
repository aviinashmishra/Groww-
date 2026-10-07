'use client';

import { useState } from 'react';
import { LineChart, Money } from './ui';
import { Icon } from './Icon';
import { useStore } from '@/lib/store';
import { buzz } from '@/lib/fx';
import { rupees } from '@/lib/format';
import type { Pot } from '@/lib/types';

/** Assumed yearly growth, stated in plain words on screen. */
const RATE = { never: 0.1, later: 0.07, soon: 0.05 } as const;

function future(start: number, monthly: number, years: number, r: number): number {
  const m = r / 12;
  const n = years * 12;
  return start * Math.pow(1 + m, n) + monthly * ((Math.pow(1 + m, n) - 1) / m);
}

export function FutureYou({ pot }: { pot: Pot }) {
  const { state } = useStore();
  const r = RATE[pot.bucket];
  const [years, setYears] = useState(10);
  const [monthly, setMonthly] = useState(pot.bucket === 'never' ? 1000 : 500);
  const value = future(pot.balance, monthly, years, r);
  const putIn = pot.balance + monthly * years * 12;
  const series = Array.from({ length: years + 1 }, (_, y) => future(pot.balance, monthly, y, r));
  const flat = Array.from({ length: years + 1 }, (_, y) => pot.balance + monthly * y * 12);
  const year = new Date().getFullYear() + years;

  return (
    <section className="glass col" style={{ gap: 10 }}>
      <div className="row sp" style={{ padding: '0 4px' }}>
        <span className="row" style={{ gap: 8 }}><Icon name="spark" small style={{ color: 'var(--acc-ink)' }} /><h2 className="h2">Future you</h2></span>
        <span className="cap">in {year}</span>
      </div>
      <div className="plate col" style={{ gap: 8, padding: 14 }}>
        <div className="row sp" style={{ alignItems: 'flex-end' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">Could become</span>
            <Money value={value} className="num" />
          </div>
          <div className="col" style={{ gap: 2, alignItems: 'flex-end' }}>
            <span className="cap">You put in</span>
            <Money value={putIn} className="amt" style={{ color: 'var(--ink3)' }} />
          </div>
        </div>
        <LineChart
          label={`Projected growth over ${years} years at ${r * 100}% a year, against the money put in`}
          series={[{ values: flat, kind: 'b' }, { values: series, kind: 'a' }]}
          height={110}
        />
      </div>
      <div className="col" style={{ gap: 2, padding: '0 4px' }}>
        <div className="row sp">
          <label htmlFor={`fy-y-${pot.id}`} className="eye">Years</label>
          <span className="amt" style={{ fontSize: 15 }}>{years}</span>
        </div>
        <input id={`fy-y-${pot.id}`} className="range" type="range" min={1} max={30} value={years}
          onChange={(e) => { setYears(Number(e.target.value)); buzz(3); }}
          style={{ ['--pct' as string]: `${((years - 1) / 29) * 100}%` }} />
        <div className="row sp">
          <label htmlFor={`fy-m-${pot.id}`} className="eye">Add each month</label>
          <span className="amt" style={{ fontSize: 15 }}>{state.settings.hideAmounts ? '₹•,•••' : rupees(monthly)}</span>
        </div>
        <input id={`fy-m-${pot.id}`} className="range" type="range" min={0} max={20000} step={500} value={monthly}
          onChange={(e) => { setMonthly(Number(e.target.value)); buzz(3); }}
          style={{ ['--pct' as string]: `${(monthly / 20000) * 100}%` }} />
      </div>
      <p className="cap">Assumes {r * 100}% a year on average. Real returns jump around, some years go negative, and nothing here is promised.</p>
    </section>
  );
}
