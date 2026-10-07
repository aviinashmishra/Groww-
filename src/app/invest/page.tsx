'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Screen } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { FundRow, KycNeeded, MarketChip, MoneyP, Returns, StockRow, useNow } from '@/components/Invest';
import { COLLECTIONS, FUNDS, INDICES, STOCKS, findFund, findStock, ipoCalendar, ipoStatus, num2, pctWords, quote } from '@/lib/market';
import { portfolio } from '@/lib/invest';
import { licence } from '@/lib/logic';

type Tab = 'stocks' | 'funds' | 'watch';
const TABS: [Tab, string][] = [['stocks', 'Stocks'], ['funds', 'Mutual funds'], ['watch', 'Watchlist']];
const MOST_BOUGHT = ['zaika', 'meghna', 'tarang', 'indusdigital', 'nayirail', 'bharatgrid'];

export default function Invest() {
  const { state } = useStore();
  const now = useNow();
  const inv = state.invest;
  const [tab, setTab] = useState<Tab>('stocks');
  const [col, setCol] = useState('popular');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'stocks' || t === 'funds' || t === 'watch') setTab(t);
  }, []);
  const pick = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, '', t === 'stocks' ? '/invest' : `/invest?tab=${t}`);
  };

  const pf = portfolio(inv, now);
  const has = inv.positions.length + inv.funds.length > 0;
  const movers = useMemo(() => STOCKS.map((s) => ({ s, q: quote(s, now) })).sort((a, b) => b.q.pct - a.q.pct), [now]);
  const openIpos = ipoCalendar(now).filter((i) => ipoStatus(i, now) === 'open' || ipoStatus(i, now) === 'upcoming').length;
  const lic = licence(state);

  return (
    <Screen orbs="b">
      <header className="row sp">
        <div className="col" style={{ gap: 4 }}>
          <MarketChip now={now} />
          <h1 className="h1">Invest</h1>
        </div>
        <div className="row" style={{ gap: 8, alignSelf: 'flex-start' }}>
          <Link className="av" href="/invest/search" aria-label="Search stocks and funds"><Icon name="search" /></Link>
          <Link className="av" href="/wallet" aria-label="Balance"><Icon name="wallet" /></Link>
        </div>
      </header>

      <div className="hscroll" aria-label="Indices">
        {INDICES.map((ix) => {
          const q = quote(ix, now);
          return (
            <Link key={ix.id} href={`/stocks/${ix.id}`} className="idx">
              <span className="eye" style={{ fontSize: 10.5 }}>{ix.name}</span>
              <span className="v">{num2(q.price)}</span>
              <span className="cap">{pctWords(q.pct)}</span>
            </Link>
          );
        })}
      </div>

      {inv.kyc.status !== 'verified' ? (
        <KycNeeded next="/invest" what="start investing" />
      ) : (
        <Link href="/portfolio" className="glass col" style={{ gap: 10 }}>
          <div className="row sp">
            <span className="eye">Your investments</span>
            <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
          </div>
          {has ? (
            <>
              <MoneyP value={pf.total.current} className="num" />
              <div className="row sp wrap" style={{ gap: 4 }}>
                <span className="cap ink2"><Returns abs={pf.total.ret} pct={pf.total.retPct} prefix="Overall " /></span>
                <span className="cap"><Returns abs={pf.total.day} pct={pf.total.current ? (pf.total.day / (pf.total.current - pf.total.day)) * 100 : 0} prefix="Today " /></span>
              </div>
            </>
          ) : (
            <span className="med">Nothing yet. An index fund SIP is the easy first step.</span>
          )}
        </Link>
      )}

      <nav className="qa" aria-label="Investing tools">
        <Link href="/portfolio"><span className="tile t-acc"><Icon name="pie" /></span><span className="lbl">Portfolio</span></Link>
        <Link href="/orders"><span className="tile t-ink"><Icon name="receipt" /></span><span className="lbl">Orders</span></Link>
        <Link href="/sips"><span className="tile t-ind"><Icon name="calendar" />{inv.sips.filter((x) => x.status === 'active').length > 0 && <span className="pip">{inv.sips.filter((x) => x.status === 'active').length}</span>}</span><span className="lbl">SIPs</span></Link>
        <Link href="/ipo"><span className="tile t-pink"><Icon name="rocket" />{openIpos > 0 && <span className="pip">{openIpos}</span>}</span><span className="lbl">IPOs</span></Link>
        <Link href="/wallet"><span className="tile t-amb"><Icon name="wallet" /></span><span className="lbl">Balance</span></Link>
      </nav>

      <div className="seg" role="tablist" aria-label="Browse">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => pick(id)}>{label}</button>
        ))}
      </div>

      {tab === 'stocks' && (
        <>
          {!lic.crash && (
            <Link href="/crash" className="glass row" style={{ padding: '12px 16px' }}>
              <div className="lp" />
              <div className="col grow"><span className="eye">Before single stocks</span><span className="med">Get your L-plate: hold through a fake crash, 90 seconds</span></div>
              <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
            </Link>
          )}
          <section className="glass col" style={{ gap: 8 }}>
            <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Top gainers</h2><span className="cap">Today</span></div>
            {movers.slice(0, 3).map(({ s }) => <StockRow key={s.id} s={s} now={now} />)}
          </section>
          <section className="glass col" style={{ gap: 8 }}>
            <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Top losers</h2><span className="cap">Today</span></div>
            {movers.slice(-3).reverse().map(({ s }) => <StockRow key={s.id} s={s} now={now} />)}
          </section>
          <section className="glass col" style={{ gap: 8 }}>
            <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Most bought on the app</h2></div>
            {MOST_BOUGHT.map((id) => findStock(id)!).map((s) => <StockRow key={s.id} s={s} now={now} />)}
          </section>
          <section className="glass col" style={{ gap: 8 }}>
            <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">All stocks</h2><span className="cap">{STOCKS.length} · fictional</span></div>
            {[...STOCKS].sort((a, b) => a.name.localeCompare(b.name)).map((s) => <StockRow key={s.id} s={s} now={now} />)}
          </section>
        </>
      )}

      {tab === 'funds' && (
        <>
          <div className="hscroll" role="group" aria-label="Collections">
            {COLLECTIONS.map((c) => (
              <button key={c.id} className="chip" aria-pressed={col === c.id} onClick={() => setCol(c.id)}>{c.label}</button>
            ))}
          </div>
          <section className="glass col" style={{ gap: 8 }}>
            {FUNDS.filter(COLLECTIONS.find((c) => c.id === col)!.match).map((f) => <FundRow key={f.id} f={f} now={now} />)}
          </section>
          <Link href="/mf/lakshya-nifty50" className="glass row" style={{ padding: '12px 16px' }}>
            <div className="ico"><Icon name="spark" /></div>
            <div className="col grow"><span className="eye">Not sure where to start?</span><span className="med">A Nifty 50 index fund SIP, from ₹100 a month</span></div>
            <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
          </Link>
        </>
      )}

      {tab === 'watch' && (
        <section className="glass col" style={{ gap: 8 }}>
          {inv.watch.length === 0 ? (
            <div className="col" style={{ gap: 6, padding: 8 }}>
              <span className="med">Your watchlist is empty</span>
              <span className="cap">Tap the star on any stock or fund to keep an eye on it here.</span>
            </div>
          ) : (
            inv.watch.map((id) => {
              const s = findStock(id);
              if (s) return <StockRow key={id} s={s} now={now} />;
              const f = findFund(id);
              return f ? <FundRow key={id} f={f} now={now} /> : null;
            })
          )}
          <Link href="/invest/search" className="chip big" style={{ alignSelf: 'center' }}><Icon name="plus" small />Add from search</Link>
        </section>
      )}

      <p className="cap center">Fictional companies and funds, demo prices that move in real time during market hours.</p>
      <div className="foot" />
    </Screen>
  );
}
