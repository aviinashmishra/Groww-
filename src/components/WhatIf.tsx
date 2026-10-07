'use client';

import { useState } from 'react';
import { Sheet, Ring } from './ui';
import { Icon } from './Icon';
import { useStore } from '@/lib/store';
import { PERSONAS } from '@/lib/data';
import { potsTotal, runway } from '@/lib/logic';
import { rupees } from '@/lib/format';
import { buzz } from '@/lib/fx';

/** Drag two levers, watch your runway move. Then make it real with one tap. */
export function WhatIfSheet({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const p = PERSONAS[state.persona];
  const rw = runway(state);
  const saved = potsTotal(state);
  const spend = state.monthlySpend;
  const maxAdd = Math.max(5000, Math.round(state.monthlyIncome / 500) * 500);
  const [less, setLess] = useState(0);
  const [add, setAdd] = useState(Math.min(maxAdd, Math.max(500, Math.round(Math.max(0, state.monthlyIncome - spend) / 500) * 500 || 1000)));

  const newSpend = Math.max(1, spend * (1 - less / 100));
  const months = saved / newSpend;
  const days = p.runwayUnit === 'days';
  const now = days ? Math.round(months * 30) : Math.round(months * 10) / 10;
  const goalMonths = days ? p.runwayGoal / 30 : p.runwayGoal;
  const need = goalMonths * newSpend - saved;
  const monthsToGoal = need <= 0 ? 0 : add > 0 ? Math.ceil(need / add) : Infinity;
  const when = Number.isFinite(monthsToGoal) && monthsToGoal > 0
    ? new Date(new Date().getFullYear(), new Date().getMonth() + monthsToGoal, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;
  const delta = (days ? now - rw.value : now - rw.value);

  const tick = (fn: () => void) => { fn(); buzz(4); };

  return (
    <Sheet open onClose={onClose} label="What-if planner">
      <div className="row" style={{ gap: 10 }}>
        <div className="ico"><Icon name="wand" /></div>
        <span className="eye">What if…</span>
      </div>

      <div className="row" style={{ gap: 14 }}>
        <Ring fill={Math.min(1, (days ? now / p.runwayGoal : months / p.runwayGoal))} size={118}>
          <span className="hero" style={{ fontSize: 34 }}>{days ? now : now.toFixed(1)}</span>
          <span className="cap">{days ? 'days' : 'months'}</span>
        </Ring>
        <div className="col grow" style={{ gap: 4 }}>
          <span className="h2">{delta > 0.05 ? `+${days ? delta : delta.toFixed(1)} ${days ? 'days' : 'months'} of freedom, today.` : 'Your runway, today.'}</span>
          <span className="cap">
            {monthsToGoal === 0 ? 'Goal reached. Bas, enjoy.' : when ? `Goal of ${p.runwayGoal} ${days ? 'days' : 'months'} by ${when} (${monthsToGoal} ${monthsToGoal === 1 ? 'month' : 'months'}).` : 'Add something each month to see a date.'}
          </span>
        </div>
      </div>

      <div className="col" style={{ gap: 4 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <label htmlFor="wi-less" className="eye">Spend less each month</label>
          <span className="amt" style={{ fontSize: 15 }}>{less}% · {rupees(spend - newSpend)}</span>
        </div>
        <input id="wi-less" className="range" type="range" min={0} max={40} step={5} value={less}
          onChange={(e) => tick(() => setLess(Number(e.target.value)))}
          style={{ ['--pct' as string]: `${(less / 40) * 100}%` }} aria-valuetext={`${less} percent less`} />
      </div>

      <div className="col" style={{ gap: 4 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <label htmlFor="wi-add" className="eye">Put into pots each month</label>
          <span className="amt" style={{ fontSize: 15 }}>{rupees(add)}</span>
        </div>
        <input id="wi-add" className="range" type="range" min={0} max={maxAdd} step={500} value={add}
          onChange={(e) => tick(() => setAdd(Number(e.target.value)))}
          style={{ ['--pct' as string]: `${(add / maxAdd) * 100}%` }} aria-valuetext={rupees(add)} />
      </div>

      <div className="wi-out">
        <div className="plate col" style={{ gap: 2 }}>
          <span className="eye">Month costs</span>
          <span className="amt">{rupees(newSpend)}</span>
        </div>
        <div className="plate col" style={{ gap: 2 }}>
          <span className="eye">In a year</span>
          <span className="amt">{rupees(saved + add * 12)}</span>
        </div>
      </div>

      <button
        className="btn"
        disabled={less === 0}
        onClick={() => {
          update((d) => { d.monthlySpend = Math.round(newSpend / 100) * 100; });
          toast(`Monthly spend set to ${rupees(Math.round(newSpend / 100) * 100)}`);
          onClose();
        }}
      >
        {less === 0 ? 'Drag a lever to plan' : `Make it real: spend ${rupees(Math.round(newSpend / 100) * 100)}/month`}
      </button>
      <p className="cap center">No returns assumed here. Just your money, your months.</p>
    </Sheet>
  );
}
