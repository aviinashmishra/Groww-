'use client';

import Link from 'next/link';
import { Screen, TopBar } from '@/components/ui';
import { Logo, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { type Ipo, type IpoStatus, ipoCalendar, ipoStatus, ipoSubscription, istDay, px, quote, ipoStock } from '@/lib/market';

const LABEL: Record<IpoStatus, string> = { upcoming: 'Opens soon', open: 'Open now', closed: 'Bidding closed', allotted: 'Allotment out', listed: 'Listed' };

export default function Ipos() {
  const { state } = useStore();
  const now = useNow();
  const list = ipoCalendar(now);
  const groups: [string, Ipo[]][] = [
    ['Open now', list.filter((i) => ipoStatus(i, now) === 'open')],
    ['Coming up', list.filter((i) => ipoStatus(i, now) === 'upcoming')],
    ['Closed and listed', list.filter((i) => ['closed', 'allotted', 'listed'].includes(ipoStatus(i, now)))],
  ];

  return (
    <Screen orbs="a">
      <TopBar back="/invest" label="IPOs" />
      <h1 className="h1">New listings,{'\n'}real odds.</h1>
      <p className="body">Popular IPOs are a lottery: when retail bids are 10× the shares on offer, about 1 in 10 people get a lot. We show the odds on every card.</p>

      {groups.map(([title, items]) => items.length > 0 && (
        <section key={title} className="glass col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>{title}</span>
          {items.map((i) => {
            const st = ipoStatus(i, now);
            const applied = state.invest.ipos.find((a) => a.ipoId === i.id && a.status !== 'cancelled');
            const sub = ipoSubscription(i, now);
            return (
              <Link key={i.id} href={`/ipo/${i.id}`} className="plate col" style={{ gap: 8, padding: 14 }}>
                <div className="row" style={{ gap: 12 }}>
                  <Logo id={i.slug} name={i.name} />
                  <span className="col grow" style={{ gap: 2 }}>
                    <span className="med">{i.name}</span>
                    <span className="cap">{i.sector} · ₹{i.sizeCr.toLocaleString('en-IN')} Cr issue</span>
                  </span>
                  <span className={`pill${st === 'open' ? ' acc' : st === 'upcoming' ? ' amb' : ''}`}>{LABEL[st]}</span>
                </div>
                <div className="stats three">
                  <div><span className="cap">Price band</span><b>₹{i.band[0]}–{i.band[1]}</b></div>
                  <div><span className="cap">Min. investment</span><b>{px(i.band[1] * i.lot).replace('.00', '')}</b></div>
                  <div>
                    <span className="cap">{st === 'listed' ? 'Now' : st === 'upcoming' ? 'Opens' : 'Retail bids'}</span>
                    <b>{st === 'listed' ? px(quote(ipoStock(i), now).price) : st === 'upcoming' ? istDay(i.opensAt) : `${sub.toFixed(1)}×`}</b>
                  </div>
                </div>
                {applied && <span className="cap accx">You applied · {applied.status === 'applied' ? 'waiting' : applied.status === 'not-allotted' ? 'not allotted' : applied.status}</span>}
              </Link>
            );
          })}
        </section>
      ))}
      <p className="cap center">A rolling calendar of fictional companies, a new one every week.</p>
      <div className="foot" />
    </Screen>
  );
}
