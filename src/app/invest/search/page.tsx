'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { FundRow, Logo, StockRow, useNow } from '@/components/Invest';
import { findFund, findStock, ipoStatus, searchAll } from '@/lib/market';

const POPULAR = ['nifty50', 'indusdigital', 'zaika', 'deccanbank', 'lakshya-nifty50', 'udaan-small'];

export default function Search() {
  const now = useNow();
  const [q, setQ] = useState('');
  const r = searchAll(q, now);
  const none = q.trim() && r.stocks.length + r.funds.length + r.ipos.length === 0;

  return (
    <Screen orbs="c">
      <TopBar back="/invest" label="Search" />
      <div className="field search-in">
        <Icon name="search" style={{ color: 'var(--ink3)' }} />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Stocks, funds, IPOs, sectors" aria-label="Search" enterKeyHint="search" />
        {q && <button className="chip" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" small /></button>}
      </div>

      {!q.trim() && (
        <section className="glass col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>Popular right now</span>
          {POPULAR.map((id) => {
            const s = findStock(id);
            if (s) return <StockRow key={id} s={s} now={now} />;
            const f = findFund(id)!;
            return <FundRow key={id} f={f} now={now} />;
          })}
        </section>
      )}

      {r.stocks.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>Stocks and indices</span>
          {r.stocks.map((s) => <StockRow key={s.id} s={s} now={now} />)}
        </section>
      )}
      {r.funds.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>Mutual funds</span>
          {r.funds.map((f) => <FundRow key={f.id} f={f} now={now} />)}
        </section>
      )}
      {r.ipos.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <span className="eye" style={{ padding: '0 4px' }}>IPOs</span>
          {r.ipos.map((i) => (
            <Link key={i.id} href={`/ipo/${i.id}`} className="plate tk">
              <Logo id={i.slug} name={i.name} />
              <span className="col grow"><span className="med">{i.name}</span><span className="cap">IPO · {ipoStatus(i, now)}</span></span>
              <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
            </Link>
          ))}
        </section>
      )}
      {none && (
        <div className="col" style={{ gap: 6, padding: '0 4px' }}>
          <span className="med">Nothing called “{q.trim()}”</span>
          <span className="cap">Try a sector like IT or Banking, or a fund type like index or liquid.</span>
        </div>
      )}
      <div className="foot" />
    </Screen>
  );
}
