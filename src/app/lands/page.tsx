'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Screen, Money, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { investCredit, landCredit, note, skipCredit } from '@/lib/logic';
import { fmtDay, fmtTime, parseAmount, relDay, rupees } from '@/lib/format';
import type { CreditKind } from '@/lib/types';

export default function Lands() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const [simOpen, setSimOpen] = useState(false);

  useEffect(() => {
    if (!state.lands.enabled) router.replace('/lands/setup');
  }, [state.lands.enabled, router]);
  if (!state.lands.enabled) return null;

  const monthAgo = Date.now() - 30 * 86400000;
  const recent = state.credits.filter((c) => c.status !== 'pending' && new Date(c.at).getTime() >= monthAgo);
  const investedSum = recent.filter((c) => c.status === 'invested').reduce((a, c) => a + Math.round((c.amount * c.share) / 100), 0);
  const pending = state.credits.find((c) => c.status === 'pending');
  const distinctDays = new Set(recent.filter((c) => c.kind === 'income').map((c) => fmtDay(c.at))).size;

  return (
    <Screen orbs="c">
      <div className="col" style={{ gap: 6 }}>
        <div className="row sp">
          <span className="eye">Invest what lands</span>
          <Link href="/lands/setup" className="chip acc" aria-label={`${state.lands.share}% on, change share`}>{state.lands.share}% on<Icon name="sliders" small /></Link>
        </div>
        <h1 className="h1">
          {recent.length === 0 ? 'Waiting for money\nto land.' : `${recent.length} ${recent.length === 1 ? 'credit' : 'credits'},\n${distinctDays} different ${distinctDays === 1 ? 'date' : 'dates'}.`}
        </h1>
      </div>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">Last 30 days</h2>
          <span className="cap"><Money value={investedSum} className="" /> invested</span>
        </div>
        {recent.length === 0 && <p className="cap" style={{ padding: '4px' }}>Nothing landed in the last 30 days.</p>}
        {recent.map((c) => {
          const muted = c.status === 'ignored';
          const slice = Math.round((c.amount * c.share) / 100);
          return (
            <div key={c.id} className="plate row">
              <div className="col grow" style={{ gap: 2 }}>
                <span className="med" style={muted ? { color: 'var(--ink3)' } : undefined}>{c.source}</span>
                <span className="cap">
                  {fmtDay(c.at)} · {c.status === 'invested' ? <><Money value={slice} className="" /> went in</> : c.status === 'skipped' ? 'skipped, stays with you' : c.kind === 'refund' ? 'not income, ignored' : 'your own transfer, ignored'}
                </span>
              </div>
              <Money value={c.amount} style={muted ? { color: 'var(--ink3)' } : undefined} />
            </div>
          );
        })}
      </section>

      <div className="foot" style={{ gap: 10 }}>
        {pending ? (
          <>
            <section className="glass col" style={{ gap: 10 }}>
              <div className="row sp" style={{ padding: '0 4px' }}>
                <h2 className="h2">Landed {relDay(pending.at)}</h2>
                <span className="chip"><Icon name="clock" small />Goes in at {fmtTime(pending.cutoff!)}{relDay(pending.cutoff!) === 'today' ? '' : ' tomorrow'}</span>
              </div>
              <div className="plate row sp">
                <div className="col" style={{ gap: 2 }}>
                  <span className="cap">{pending.source}</span>
                  <Money value={pending.amount} className="num" />
                </div>
                <div className="col" style={{ gap: 2, alignItems: 'flex-end' }}>
                  <span className="cap">Your {pending.share}%</span>
                  <Money value={Math.round((pending.amount * pending.share) / 100)} className="num accx" />
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn2" onClick={() => { update((d) => skipCredit(d, pending.id)); router.push(`/lands/skipped?id=${pending.id}`); }}>Skip this one</button>
                <button
                  className="btn2"
                  onClick={() => {
                    update((d) => { investCredit(d, pending.id); note(d, `${rupees(Math.round((pending.amount * pending.share) / 100))} went in`, `${pending.share}% of ${pending.source}.`, '/lands'); });
                    toast('Invested now');
                  }}
                >
                  Invest now
                </button>
              </div>
            </section>
            <p className="cap center">Do nothing and it invests itself. One tap skips, no questions.</p>
          </>
        ) : (
          <>
            <button className="btn2" onClick={() => setSimOpen(true)}><Icon name="plus" />Simulate money landing</button>
            <p className="cap center">Demo: in the real app, credits arrive from your bank through Account Aggregator.</p>
          </>
        )}
      </div>

      {simOpen && <SimulateSheet onClose={() => setSimOpen(false)} />}
    </Screen>
  );
}

function SimulateSheet({ onClose }: { onClose: () => void }) {
  const { update, toast } = useStore();
  const [source, setSource] = useState('Stipend · Lumen Labs');
  const [amount, setAmount] = useState('12000');
  const [kind, setKind] = useState<CreditKind>('income');
  const n = parseAmount(amount);
  return (
    <Sheet open onClose={onClose} label="Simulate a credit">
      <h2 className="h1" style={{ fontSize: 26 }}>Money lands</h2>
      <div className="col" style={{ gap: 8 }}>
        <label htmlFor="src" className="eye" style={{ padding: '0 4px' }}>From</label>
        <div className="field"><input id="src" value={source} onChange={(e) => setSource(e.target.value)} maxLength={40} /></div>
      </div>
      <AmountField id="sim-amt" label="Amount" value={amount} onChange={setAmount} />
      <div className="seg" role="tablist" aria-label="Kind of credit">
        {([['income', 'Income'], ['refund', 'Refund'], ['self', 'From myself']] as [CreditKind, string][]).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{l}</button>
        ))}
      </div>
      <button
        className="btn"
        disabled={n <= 0 || !source.trim()}
        onClick={() => {
          update((d) => { landCredit(d, source.trim(), n, kind); });
          toast(kind === 'income' ? `${rupees(n)} landed` : 'Not income, so it’s ignored');
          onClose();
        }}
      >
        Land {n > 0 ? rupees(n) : ''}
      </button>
    </Sheet>
  );
}
