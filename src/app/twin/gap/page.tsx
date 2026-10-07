'use client';

import { Screen, TopBar, Money, Toggle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { twin } from '@/lib/logic';
import { HIDDEN, signedRupees } from '@/lib/format';

export default function Gap() {
  const { state, update, toast } = useStore();
  const t = twin(state);
  const moves = state.twin.moves;
  const hidden = state.settings.hideAmounts;
  const on = state.twin.pauseBeforeSell;

  const setPause = (v: boolean) => {
    update((d) => { d.twin.pauseBeforeSell = v; });
    toast(v ? 'Pause on. Next time you sell Never touch, Lazy Twin steps in.' : 'Pause off');
  };

  return (
    <Screen orbs="b">
      <TopBar back="/twin" label="Lazy Twin · the gap" />
      <h1 className="h1">
        {moves.length === 0 ? 'No moves yet. You are the twin.' : `${moves.length === 1 ? 'One move' : `${['Two', 'Three', 'Four', 'Five'][moves.length - 2] ?? moves.length} moves`} made the ${hidden ? 'gap' : signedRupees(t.gap).replace('+ ', '')}.`}
      </h1>

      <section className="glass col" style={{ gap: 8 }}>
        {moves.map((m) => (
          <div key={m.id} className="plate row">
            <div className="col grow" style={{ gap: 2 }}><span className="med">{m.label}</span><span className="cap">{m.detail}</span></div>
            <span className={`amt${m.impact > 0 ? ' accx' : ''}`}>{hidden ? HIDDEN : signedRupees(m.impact)}</span>
          </div>
        ))}
        <div className="hr" style={{ margin: '4px 4px' }} />
        <div className="plate row sp">
          <span className="eye">{t.gap >= 0 ? 'Behind your twin by' : 'Ahead of your twin by'}</span>
          <Money value={Math.abs(t.gap)} className="num" />
        </div>
      </section>

      <section className="glass row" style={{ alignItems: 'flex-start' }}>
        <div className="ico n"><Icon name="moon" /></div>
        <p className="body grow ink">Doing less would have earned more. That’s not you being bad at this; most switching costs money.</p>
      </section>

      <div className="foot">
        {on ? (
          <div className="glass row">
            <div className="col grow"><span id="pause-l" className="med">24-hour pause before I sell</span><span className="cap">On for your Never touch pots</span></div>
            <Toggle on onChange={setPause} labelledBy="pause-l" />
          </div>
        ) : (
          <button className="btn" onClick={() => setPause(true)}>Add a 24-hour pause before I sell</button>
        )}
      </div>
    </Screen>
  );
}
