'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Screen, Money, Dots } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { investCredit, landings, note } from '@/lib/logic';
import { fmtTime, relDay, rupees } from '@/lib/format';

function Skipped() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const id = useSearchParams().get('id');
  const credit = state.credits.find((c) => c.id === id);
  const dots = landings(state);
  const showed = dots.filter(Boolean).length;
  const canUndo = credit && credit.status === 'skipped' && credit.cutoff && new Date(credit.cutoff).getTime() > Date.now();

  return (
    <Screen orbs="a">
      <span className="eye">Invest what lands</span>
      <div className="col" style={{ gap: 14, marginTop: 20 }}>
        <div className="ico n" style={{ width: 64, height: 64, borderRadius: 22 }}><Icon name="skip" style={{ width: 30, height: 30 }} /></div>
        <h1 className="h1" style={{ fontSize: 38, lineHeight: 1.08 }}>Skipped.<br />Koi baat nahi.</h1>
        <p className="body" style={{ fontSize: 16 }}>Tight months happen. Your {state.lands.share}% rule stays on for the next credit.</p>
      </div>

      <section className="glass col" style={{ gap: 8, marginTop: 6 }}>
        {credit && (
          <div className="plate row sp">
            <div className="col" style={{ gap: 2 }}>
              <span className="cap">Stays in your account</span>
              <Money value={Math.round((credit.amount * credit.share) / 100)} className="num" />
            </div>
            <span className="chip">{credit.source.split('·')[0].trim()} · {relDay(credit.at)}</span>
          </div>
        )}
        <div className="plate col" style={{ gap: 10 }}>
          <span className="med">Showed up {showed} of the last {dots.length} landings</span>
          <Dots values={dots} />
          <span className="cap">A skip is a decision you made, not a streak you broke. Nothing resets.</span>
        </div>
      </section>

      <div className="foot">
        <Link className="btn" href="/lands">Done</Link>
        {canUndo && (
          <button
            className="ghost"
            onClick={() => {
              update((d) => { investCredit(d, credit.id); note(d, `${rupees(Math.round((credit.amount * credit.share) / 100))} went in`, 'You changed your mind. Fair.', '/lands'); });
              toast('Invested after all');
              router.push('/lands');
            }}
          >
            Changed my mind, invest it (till {fmtTime(credit.cutoff!)})
          </button>
        )}
      </div>
    </Screen>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Skipped />
    </Suspense>
  );
}
