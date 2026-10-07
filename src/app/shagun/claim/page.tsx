'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Screen } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { decodeShagun } from '@/lib/shagun';
import { addToPot, note } from '@/lib/logic';
import { fmtDay, rupees } from '@/lib/format';

function Claim() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const s = decodeShagun(useSearchParams().get('d') ?? '');
  const [explain, setExplain] = useState(false);

  if (!s) {
    return (
      <Screen orbs="a" nav={false}>
        <span className="eye">Shagun</span>
        <h1 className="h1">This shagun link looks broken.</h1>
        <p className="body">Ask the sender to share the card again.</p>
        <div className="foot nonav"><Link className="btn" href="/">Open the app</Link></div>
      </Screen>
    );
  }

  const expired = new Date(s.claimBy).getTime() < Date.now();
  const mine = state.shaguns.some((x) => x.id === s.id);
  const claimed = state.claimedShaguns.includes(s.id) || state.shaguns.some((x) => x.id === s.id && x.claimed);

  const claim = () => {
    update((d) => {
      if (!d.claimedShaguns.includes(s.id)) d.claimedShaguns.push(s.id);
      const own = d.shaguns.find((x) => x.id === s.id);
      if (own) own.claimed = true;
      if (!own && d.onboarded) {
        const never = d.pots.find((p) => p.bucket === 'never');
        if (never) addToPot(d, never.id, s.amount);
      }
      note(d, `Shagun claimed: ${rupees(s.amount)}`, `From ${s.from}. In a Nifty 50 index fund, in your name.`);
    });
    toast(mine ? 'Marked as claimed' : `${rupees(s.amount)} is yours`);
    router.push(mine ? `/shagun/${s.id}` : state.onboarded ? '/' : '/crash');
  };

  return (
    <Screen orbs="a" nav={false}>
      <div className="row" style={{ gap: 10 }}>
        <div className="ico"><Icon name="gift" /></div>
        <span className="eye">Shagun from {s.from}</span>
      </div>

      <div className="col" style={{ gap: 8 }}>
        <h1 className="h1" style={{ fontSize: 36, lineHeight: 1.1 }}>{s.to}, this {rupees(s.amount)} isn’t for spending.</h1>
        <p className="body" style={{ fontSize: 16 }}>It’s a slice of India’s 50 biggest companies. It moves up and down, and it’s yours.</p>
      </div>

      {s.message && <p className="body ink" style={{ padding: '0 4px' }}>“{s.message}”</p>}

      <section className="glass col" style={{ gap: 8 }}>
        <div className="plate row sp" style={{ padding: '14px 16px' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">{claimed ? 'Claimed' : 'Waiting for you'}</span>
            <span className="hero" style={{ fontSize: 48 }}>{rupees(s.amount)}</span>
          </div>
          <span className="chip">Nifty 50 index fund</span>
        </div>
        {[
          ['PAN and Aadhaar', 'About 2 minutes'],
          ['Units are bought in your name', 'At that day’s price'],
          ['Leave it, add to it, or take it out', 'Your call, anytime'],
        ].map(([a, b], k) => (
          <div key={a} className="plate row">
            <span className="av xs">{k + 1}</span>
            <div className="col grow"><span className="med">{a}</span><span className="cap">{b}</span></div>
          </div>
        ))}
      </section>

      {explain && (
        <section className="glass col" style={{ gap: 6 }}>
          <span className="eye">What’s an index fund?</span>
          <p className="body ink">One fund that holds the 50 biggest companies on the National Stock Exchange, in the same proportions as the Nifty 50. No one picks stocks; it just follows the index. That keeps costs low, and you never bet on a single company.</p>
        </section>
      )}

      <p className="cap">{expired ? `This shagun expired on ${fmtDay(s.claimBy)} and went back to ${s.from}.` : `Claim by ${fmtDay(s.claimBy)}. After that it goes back to ${s.from} and nothing is charged to you.`}</p>

      <div className="foot nonav">
        <button className="btn" disabled={expired || claimed} onClick={claim}>{claimed ? 'Already claimed' : 'Claim my shagun'}</button>
        <button className="ghost" aria-expanded={explain} onClick={() => setExplain((v) => !v)}>What’s an index fund?</button>
      </div>
    </Screen>
  );
}

export default function Page() {
  return (
    <Suspense>
      <Claim />
    </Suspense>
  );
}
