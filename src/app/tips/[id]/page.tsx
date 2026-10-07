'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { TIPSTERS } from '@/lib/data';
import { note, tipOutcome } from '@/lib/logic';
import { changeWords, fmtDate, relDay } from '@/lib/format';

export default function TipResult() {
  const { id } = useParams<{ id: string }>();
  const { state, update, toast } = useStore();
  const router = useRouter();
  const tip = state.tips.find((t) => t.id === id);
  const o = tip ? tipOutcome(tip) : null;
  const c = o?.company;

  if (!tip || !c || !o) {
    return (
      <Screen orbs="c">
        <TopBar back="/tips" label="Tip Check" />
        <h1 className="h1">That tip isn’t here any more.</h1>
        <div className="foot"><Link className="btn" href="/tips">Check a tip</Link></div>
      </Screen>
    );
  }

  const registered = tip.handle ? TIPSTERS[tip.handle.toLowerCase()] : undefined;
  const initials = (tip.handle ?? tip.source).replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase() || 'TP';

  const facts: [string, string][] = [
    ['Company size', c.size],
    ['Profit, last 3 years', c.profit],
    ['Promoter shares pledged', c.pledged],
    ['Price, last 30 days', c.price30],
    ['Daily trading', c.trading],
  ];

  return (
    <Screen orbs="c">
      <TopBar back="/tips" label="Tip Check · result" />

      <section className="glass col" style={{ gap: 10 }}>
        <div className="row">
          <div className="av sm">{initials}</div>
          <div className="col grow" style={{ gap: 2 }}>
            <span style={{ fontWeight: 600 }}>{tip.handle ? `@${tip.handle}` : tip.source}</span>
            <span className="cap">{tip.source} · checked {relDay(tip.checkedAt)}</span>
          </div>
        </div>
        {tip.handle && registered === false && (
          <div className="plate row" style={{ background: 'var(--amb-soft)', borderColor: 'transparent', color: 'var(--amb-ink)' }}>
            <Icon name="warn" />
            <div className="col grow"><span style={{ fontWeight: 600 }}>SEBI-registered: No</span><span style={{ fontSize: 12.5, fontWeight: 500 }}>Nobody answers for this advice.</span></div>
          </div>
        )}
        {tip.handle && registered === true && (
          <div className="plate row" style={{ background: 'var(--acc-soft)', borderColor: 'transparent', color: 'var(--acc-ink)' }}>
            <Icon name="check" />
            <div className="col grow"><span style={{ fontWeight: 600 }}>SEBI-registered: Yes</span><span style={{ fontSize: 12.5, fontWeight: 500 }}>Accountable, which still isn’t the same as right.</span></div>
          </div>
        )}
        {tip.handle && registered === undefined && (
          <div className="plate row">
            <Icon name="warn" style={{ color: 'var(--ink3)' }} />
            <div className="col grow"><span style={{ fontWeight: 600 }}>SEBI-registered: Not found</span><span className="cap">This handle isn’t in the demo register. Check sebi.gov.in before trusting it.</span></div>
          </div>
        )}
        {tip.quote && <p className="body ink" style={{ fontSize: 16, padding: '0 4px' }}>“{tip.quote}”</p>}
      </section>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">{c.name}</h2>
          <span className="cap">The plain facts</span>
        </div>
        <div className="plate col" style={{ gap: 9, padding: 14 }}>
          {facts.map(([k, v], i) => (
            <div key={k} className="col" style={{ gap: 9 }}>
              {i > 0 && <div className="hr" />}
              <div className="row sp"><span className="cap ink2">{k}</span><span className="amt" style={{ fontSize: 15 }}>{v}</span></div>
            </div>
          ))}
        </div>
        {tip.parked && o.resolved && (
          <div className="plate row sp">
            <span className="cap ink2">90 days later</span>
            <span className={`amt${o.halted ? ' ambx' : ''}`} style={{ fontSize: 15 }}>{o.halted ? 'Trading halted' : changeWords(o.after90)}</span>
          </div>
        )}
      </section>

      <div className="row wrap" style={{ gap: 6 }}>
        <Link className="chip" href="/learn?q=Pledged"><Icon name="book" small />What’s pledging?</Link>
        <Link className="chip" href="/learn?q=Pump"><Icon name="book" small />Pump and dump?</Link>
        <Link className="chip" href="/learn?q=Market cap"><Icon name="book" small />Small cap?</Link>
      </div>

      <p className="cap">Demo facts for a fictional company. Not buy or sell advice. Registered doesn’t mean right; unregistered means no one is accountable.</p>

      <div className="foot">
        {tip.parked ? (
          <Link className="btn" href="/tips?tab=graveyard">
            <Icon name="clock" />{o.resolved ? 'See the Tip Graveyard' : `Parked · follow-up ${fmtDate(o.due)}`}
          </Link>
        ) : (
          <button
            className="btn"
            onClick={() => {
              update((d) => {
                const t = d.tips.find((x) => x.id === tip.id);
                if (t) t.parked = true;
                note(d, `Parked: ${c.name.replace(' Ltd', '')}`, `We’ll show you how it did on ${fmtDate(o.due)}.`, `/tips/${tip.id}`);
              });
              toast(`Parked. Follow-up on ${fmtDate(o.due)}.`);
              router.push('/tips?tab=graveyard');
            }}
          >
            <Icon name="clock" />Park it for 90 days
          </button>
        )}
        {!tip.parked && (
          <button className="ghost" onClick={() => { update((d) => { d.tips = d.tips.filter((x) => x.id !== tip.id); }); router.push('/tips'); }}>Forget this tip</button>
        )}
      </div>
    </Screen>
  );
}
