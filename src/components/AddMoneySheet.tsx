'use client';

import { useState } from 'react';
import { Sheet, AmountField } from './ui';
import { useStore } from '@/lib/store';
import { BUCKET_LABEL } from '@/lib/data';
import { addToPot, note } from '@/lib/logic';
import { parseAmount, rupees } from '@/lib/format';

export function AddMoneySheet({ open, onClose, defaultAmount = 100, defaultPot, title = 'Drop money into a pot', presets = [100, 200, 500, 1000] }: {
  open: boolean; onClose: () => void; defaultAmount?: number; defaultPot?: string; title?: string; presets?: number[];
}) {
  const { state, update, toast, celebrate } = useStore();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [potId, setPotId] = useState(defaultPot ?? state.pots[0]?.id ?? '');
  const n = parseAmount(amount);
  const target = state.pots.find((p) => p.id === potId);

  const confirm = () => {
    if (!target || n <= 0) return;
    update((d) => {
      addToPot(d, potId, n);
      note(d, `${rupees(n)} into ${target.name}`, 'Every rupee counts toward your runway.', `/pots/${potId}`);
    });
    const crossed = target.target > 0 && target.balance < target.target && target.balance + n >= target.target;
    if (crossed) celebrate({ eyebrow: 'Pot filled', title: `${target.name} is full`, body: `${rupees(target.target)}, saved on purpose. Spend it guilt-free; that was the plan.`, icon: 'check' });
    else toast(`${rupees(n)} added to ${target.name}`);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <h2 className="h1" style={{ fontSize: 26 }}>{title}</h2>
      <AmountField id="add-amt" label="Amount" value={amount} onChange={setAmount} />
      <div className="row wrap" style={{ gap: 6 }}>
        {presets.map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={n === p} onClick={() => setAmount(String(p))}>{rupees(p)}</button>
        ))}
      </div>
      <fieldset className="col" style={{ gap: 6, border: 0, margin: 0, padding: 0 }}>
        <legend className="eye" style={{ padding: '0 4px', marginBottom: 8 }}>Into</legend>
        {state.pots.map((p) => (
          <button key={p.id} type="button" className={`plate row${potId === p.id ? ' you' : ''}`} aria-pressed={potId === p.id} onClick={() => setPotId(p.id)} style={{ minHeight: 52 }}>
            <span className="col grow"><span className="eye">{BUCKET_LABEL[p.bucket]}</span><span className="med">{p.name}</span></span>
            <span className={`dot${potId === p.id ? '' : ' o'}`} />
          </button>
        ))}
      </fieldset>
      <button className="btn" disabled={n <= 0 || !target} onClick={confirm}>Add {n > 0 ? rupees(n) : ''}</button>
    </Sheet>
  );
}
