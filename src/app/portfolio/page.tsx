'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KycNeeded, Logo, MoneyP, Returns, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { findFund, findStock, nav, quote } from '@/lib/market';
import { portfolio } from '@/lib/invest';

type Tab = 'stocks' | 'funds';
type Sort = 'value' | 'returns' | 'name';

export default function Portfolio() {
  const { state } = useStore();
  const now = useNow();
  const inv = state.invest;
  const [tab, setTab] = useState<Tab>(inv.positions.length || !inv.funds.length ? 'stocks' : 'funds');
  const [sort, setSort] = useState<Sort>('value');
  const pf = portfolio(inv, now);
  const total = pf.total.current + inv.balance;
  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);

  const stocks = inv.positions
    .map((p) => {
      const s = findStock(p.stockId)!;
      const q = quote(s, now);
      return { p, s, q, value: p.qty * q.price, ret: ((q.price - p.avg) / p.avg) * 100 };
    })
    .sort((a, b) => (sort === 'name' ? a.s.name.localeCompare(b.s.name) : sort === 'returns' ? b.ret - a.ret : b.value - a.value));
  const funds = inv.funds
    .map((p) => {
      const f = findFund(p.fundId)!;
      const n = nav(f, now);
      const value = p.units * n.nav;
      return { p, f, value, ret: p.invested ? ((value - p.invested) / p.invested) * 100 : 0 };
    })
    .sort((a, b) => (sort === 'name' ? a.f.name.localeCompare(b.f.name) : sort === 'returns' ? b.ret - a.ret : b.value - a.value));

  const book = tab === 'stocks' ? pf.stocks : pf.funds;

  return (
    <Screen orbs="a">
      <TopBar back="/invest" label="Portfolio" />
      {inv.kyc.status !== 'verified' && <KycNeeded next="/portfolio" what="build a portfolio" />}

      <section className="glass col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 4, padding: '0 4px' }}>
          <span className="eye">Current value</span>
          <MoneyP value={pf.total.current} className="hero" style={{ fontSize: 44 }} />
          <span className="cap ink2"><Returns abs={pf.total.ret} pct={pf.total.retPct} prefix="Overall " /></span>
          <span className="cap"><Returns abs={pf.total.day} pct={pf.total.current - pf.total.day ? (pf.total.day / (pf.total.current - pf.total.day)) * 100 : 0} prefix="Today " /></span>
        </div>
        <div className="plate col" style={{ gap: 8 }}>
          <div className="alloc" role="img" aria-label={`Stocks ${pct(pf.stocks.current).toFixed(0)}%, mutual funds ${pct(pf.funds.current).toFixed(0)}%, balance ${pct(inv.balance).toFixed(0)}%`}>
            <i style={{ width: `${pct(pf.stocks.current)}%`, background: 'var(--hue-ind)' }} />
            <i style={{ width: `${pct(pf.funds.current)}%`, background: 'var(--acc-line)' }} />
            <i style={{ width: `${pct(inv.balance)}%`, background: 'var(--amb)' }} />
          </div>
          <div className="legend">
            <span><b style={{ background: 'var(--hue-ind)' }} />Stocks {pct(pf.stocks.current).toFixed(0)}%</span>
            <span><b style={{ background: 'var(--acc-line)' }} />Mutual funds {pct(pf.funds.current).toFixed(0)}%</span>
            <span><b style={{ background: 'var(--amb)' }} />Balance {pct(inv.balance).toFixed(0)}%</span>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link href="/orders" className="chip big grow" style={{ justifyContent: 'center' }}><Icon name="receipt" small />Orders</Link>
          <Link href="/sips" className="chip big grow" style={{ justifyContent: 'center' }}><Icon name="calendar" small />SIPs</Link>
          <Link href="/wallet" className="chip big grow" style={{ justifyContent: 'center' }}><Icon name="wallet" small />Balance</Link>
        </div>
      </section>

      <div className="seg" role="tablist" aria-label="Holdings">
        <button role="tab" aria-selected={tab === 'stocks'} onClick={() => setTab('stocks')}>Stocks · {inv.positions.length}</button>
        <button role="tab" aria-selected={tab === 'funds'} onClick={() => setTab('funds')}>Mutual funds · {inv.funds.length}</button>
      </div>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="cap">Invested <MoneyP value={book.invested} className="med" /></span>
            <span className="cap"><Returns abs={book.ret} pct={book.retPct} /></span>
          </div>
          <label className="cap row" style={{ gap: 6 }}>
            Sort
            <select className="chip" value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ appearance: 'auto' }}>
              <option value="value">Value</option>
              <option value="returns">Returns</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {tab === 'stocks' && (stocks.length === 0 ? (
          <div className="col" style={{ gap: 6, padding: 8 }}>
            <span className="med">No stocks yet</span>
            <span className="cap">Explore stocks, or apply for an IPO.</span>
            <Link href="/invest" className="chip big acc" style={{ alignSelf: 'flex-start' }}>Explore stocks</Link>
          </div>
        ) : stocks.map(({ p, s, q, value }) => (
          <Link key={p.stockId} href={`/stocks/${s.id}`} className="plate tk">
            <Logo id={s.id} name={s.name} />
            <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="med" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span className="cap">{p.qty} × avg ₹{p.avg.toFixed(2)}</span>
            </span>
            <span className="r">
              <MoneyP value={value} className="p" />
              <span className="cap"><Returns abs={p.qty * (q.price - p.avg)} pct={((q.price - p.avg) / p.avg) * 100} /></span>
            </span>
          </Link>
        )))}

        {tab === 'funds' && (funds.length === 0 ? (
          <div className="col" style={{ gap: 6, padding: 8 }}>
            <span className="med">No mutual funds yet</span>
            <span className="cap">An index fund SIP from ₹100 a month is the calm way in.</span>
            <Link href="/mf/lakshya-nifty50" className="chip big acc" style={{ alignSelf: 'flex-start' }}>Start with an index fund</Link>
          </div>
        ) : funds.map(({ p, f, value }) => (
          <Link key={p.fundId} href={`/mf/${f.id}`} className="plate tk">
            <Logo id={f.amc} name={f.amc} />
            <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
              <span className="med" style={{ lineHeight: 1.25 }}>{f.name}</span>
              <span className="cap">{p.units.toFixed(3)} units</span>
            </span>
            <span className="r">
              <MoneyP value={value} className="p" />
              <span className="cap"><Returns abs={value - p.invested} pct={p.invested ? ((value - p.invested) / p.invested) * 100 : 0} /></span>
            </span>
          </Link>
        )))}
      </section>

      <p className="cap center">Separate from your goal pots, which count toward runway.</p>
      <div className="foot" />
    </Screen>
  );
}
