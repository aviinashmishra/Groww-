'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { claimDeadline } from '@/lib/data';
import { fmtDay, parseAmount, rupees, uid } from '@/lib/format';

const OCCASIONS = ['Diwali', 'Rakhi', 'Shaadi', 'Birthday'];
const AMOUNTS = [101, 251, 501, 1101];

export default function SendShagun() {
  const { state, update } = useStore();
  const router = useRouter();
  const [to, setTo] = useState('');
  const [relation, setRelation] = useState('');
  const [occasion, setOccasion] = useState('Diwali');
  const [amount, setAmount] = useState(501);
  const [custom, setCustom] = useState('');
  const value = custom ? parseAmount(custom) : amount;
  const sent = state.shaguns;

  const create = () => {
    const id = uid();
    update((d) => {
      d.shaguns.unshift({
        id, to: to.trim(), relation: relation.trim(), occasion, amount: value,
        message: 'Kharch mat karna. Isse badhne dena.', from: d.name,
        createdAt: new Date().toISOString(), claimBy: claimDeadline(), shared: false, claimed: false,
      });
    });
    router.push(`/shagun/${id}`);
  };

  return (
    <Screen orbs="b" nav={false}>
      <TopBar back="/" label="Shagun" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1" style={{ fontSize: 34 }}>Lifafa, but it grows.</h1>
        <p className="body">Cash gets spent by Sunday. Send a slice of an index fund instead.</p>
      </div>

      <section className="glass col" style={{ gap: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <div className="field grow">
            <label htmlFor="to" className="sr">Send to</label>
            <span className="pre">To</span>
            <input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Kabir" maxLength={24} autoComplete="off" />
          </div>
          <div className="field" style={{ width: 130 }}>
            <label htmlFor="rel" className="sr">Relation</label>
            <input id="rel" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="cousin" maxLength={16} />
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <span className="eye" id="occ-l" style={{ padding: '0 4px' }}>Occasion</span>
          <div className="row wrap" style={{ gap: 6 }} role="group" aria-labelledby="occ-l">
            {OCCASIONS.map((o) => (
              <button key={o} className="chip" aria-pressed={occasion === o} style={{ padding: '0 13px' }} onClick={() => setOccasion(o)}>{o}</button>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 8 }}>
          <span className="eye" id="amt-l" style={{ padding: '0 4px' }}>Amount</span>
          <div className="row" style={{ gap: 6 }} role="group" aria-labelledby="amt-l">
            {AMOUNTS.map((a) => (
              <button key={a} className="chip grow" aria-pressed={!custom && amount === a} style={{ padding: 0, justifyContent: 'center', fontSize: 15 }} onClick={() => { setAmount(a); setCustom(''); }}>{rupees(a)}</button>
            ))}
          </div>
          <div className="field">
            <label htmlFor="custom" className="sr">Other amount</label>
            <span className="pre">₹</span>
            <input id="custom" inputMode="numeric" placeholder="Other amount" value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d,]/g, ''))} />
          </div>
        </div>

        <div className="plate row">
          <div className="col grow"><span className="eye">Goes into</span><span className="med">Nifty 50 index fund</span></div>
          <span className="chip">In their name</span>
        </div>
      </section>

      {sent.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Sent</h2><span className="cap">{sent.length}</span></div>
          {sent.slice(0, 4).map((s) => (
            <Link key={s.id} href={`/shagun/${s.id}`} className="plate row">
              <div className="col grow" style={{ gap: 2 }}><span className="med">{s.to} · {s.occasion}</span><span className="cap">{s.claimed ? 'Claimed' : s.shared ? `Waiting, claim by ${fmtDay(s.claimBy)}` : 'Not shared yet'}</span></div>
              <span className="amt">{rupees(s.amount)}</span>
            </Link>
          ))}
        </section>
      )}

      <div className="foot nonav">
        <button className="btn" disabled={!to.trim() || value < 1} onClick={create}>
          <Icon name="gift" />Make the card · {rupees(value)}
        </button>
      </div>
    </Screen>
  );
}
