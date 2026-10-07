'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Screen, TopBar, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { SwipeConfirm } from '@/components/SwipeConfirm';
import { AddFundsSheet, Logo, MoneyP, PriceChart, RangeTabs, Returns, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { licence } from '@/lib/logic';
import {
  type Point, type Range, type Stock, RANGES, capLabel, capSize, findStock, istTime, marketCap, moveWords, num2, px, quote, series, session, stats52,
} from '@/lib/market';
import { buyHold, cancelOrder, charges, placeOrder, sellableQty } from '@/lib/invest';
import { buzz } from '@/lib/fx';

export default function StockPage() {
  const { id } = useParams<{ id: string }>();
  const s = findStock(id);
  if (!s) {
    return (
      <Screen>
        <TopBar back="/invest" label="Stock" />
        <h1 className="h1">We couldn’t find that stock.</h1>
        <div className="foot"><Link className="btn" href="/invest/search">Search instead</Link></div>
      </Screen>
    );
  }
  return <StockView s={s} />;
}

function StockView({ s }: { s: Stock }) {
  const { state, update, toast } = useStore();
  const now = useNow();
  const [range, setRange] = useState<Range>('1D');
  const [scrub, setScrub] = useState<Point | null>(null);
  const [order, setOrder] = useState<null | 'buy' | 'sell'>(null);
  const inv = state.invest;
  const q = quote(s, now);
  const pts = useMemo(() => series(s, range, now), [s, range, now]);
  const st52 = useMemo(() => stats52(s, now), [s, now]);
  const isIndex = s.kind === 'index';
  const fmt = (v: number) => (isIndex ? num2(v) : px(v));
  const notListed = s.listedAt !== undefined && now < s.listedAt;

  const base = range === '1D' ? q.prev : pts[0]?.v ?? q.prev;
  const shown = scrub?.v ?? q.price;
  const diff = shown - base;
  const watched = inv.watch.includes(s.id);
  const pos = inv.positions.find((p) => p.stockId === s.id);
  const pending = inv.orders.filter((o) => o.stockId === s.id && o.status === 'pending');
  const sellable = sellableQty(inv, s.id);
  const cap = marketCap(s, now);
  const rangeLabel: Record<Range, string> = { '1D': 'today', '1W': 'past week', '1M': 'past month', '1Y': 'past year', '5Y': 'past 5 years' };

  return (
    <Screen orbs="a" nav={false}>
      <div className="row sp">
        <TopBar back="/invest" label={isIndex ? 'Index' : s.sector} />
        <button
          className="av"
          aria-pressed={watched}
          aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
          onClick={() => {
            update((d) => { d.invest.watch = watched ? d.invest.watch.filter((x) => x !== s.id) : [s.id, ...d.invest.watch]; });
            toast(watched ? 'Removed from watchlist' : 'Added to watchlist');
          }}
        >
          <Icon name="star" style={watched ? { fill: 'var(--amb)', stroke: 'var(--amb)' } : undefined} />
        </button>
      </div>

      <div className="row" style={{ gap: 12 }}>
        <Logo id={s.id} name={s.name} lg />
        <div className="col grow" style={{ gap: 2 }}>
          <h1 className="h1" style={{ fontSize: 24 }}>{s.name}</h1>
          <span className="cap">{isIndex ? 'Index · demo values' : `${s.symbol} · NSE (demo)`}</span>
        </div>
      </div>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="col" style={{ gap: 2, padding: '0 4px' }}>
          <span className="num" aria-live="polite">{notListed ? 'Not listed yet' : fmt(shown)}</span>
          <span className="cap ink2">
            {scrub ? `${diff < 0 ? 'Down' : 'Up'} ${fmt(Math.abs(diff))} (${Math.abs((diff / base) * 100).toFixed(2)}%) from the start of the range` : `${moveWords(diff, (diff / base) * 100).replace(' today', '')} · ${rangeLabel[range]}`}
          </span>
          <span className="cap">{q.live ? `Live · ${istTime(now)}` : `At close · ${istTime(session(now).eff)}`}</span>
        </div>
        {!notListed && <PriceChart points={pts} base={range === '1D' ? q.prev : undefined} label={`${s.name} price, ${rangeLabel[range]}`} intraday={range === '1D' || range === '1W'} onScrub={setScrub} />}
        <RangeTabs ranges={RANGES} value={range} onChange={(r) => { setRange(r); buzz(4); }} />
      </section>

      {pos && (
        <section className="glass col" style={{ gap: 10 }}>
          <div className="row sp" style={{ padding: '0 4px' }}><h2 className="h2">Your holding</h2><span className="cap">{pos.qty} share{pos.qty > 1 ? 's' : ''}</span></div>
          <div className="plate col" style={{ gap: 6 }}>
            <div className="kv"><span>Current value</span><MoneyP value={pos.qty * q.price} className="" /></div>
            <div className="kv"><span>Invested</span><MoneyP value={pos.qty * pos.avg} className="" /></div>
            <div className="kv"><span>Average price</span><span>{px(pos.avg)}</span></div>
            <div className="kv"><span>Returns</span><span><Returns abs={pos.qty * (q.price - pos.avg)} pct={((q.price - pos.avg) / pos.avg) * 100} /></span></div>
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="glass col" style={{ gap: 8 }}>
          <h2 className="h2" style={{ padding: '0 4px' }}>Open orders</h2>
          {pending.map((o) => (
            <div key={o.id} className="plate row">
              <span className="col grow" style={{ gap: 2 }}>
                <span className="med">{o.side === 'buy' ? 'Buy' : 'Sell'} {o.qty} · {o.type === 'limit' ? `limit ${px(o.limit!)}` : 'at market'}</span>
                <span className="cap">{o.amo ? 'After-market order, goes in at 9:15 am' : 'Open until 3:30 pm'}</span>
              </span>
              <button className="chip" onClick={() => { update((d) => cancelOrder(d, o.id)); toast('Order cancelled'); }}>Cancel</button>
            </div>
          ))}
        </section>
      )}

      {!notListed && (
        <section className="glass col" style={{ gap: 12 }}>
          <h2 className="h2" style={{ padding: '0 4px' }}>Today</h2>
          <div className="stats three" style={{ padding: '0 4px' }}>
            <div><span className="cap">Open</span><b>{fmt(q.open)}</b></div>
            <div><span className="cap">High</span><b>{fmt(q.high)}</b></div>
            <div><span className="cap">Low</span><b>{fmt(q.low)}</b></div>
            <div><span className="cap">Prev. close</span><b>{fmt(q.prev)}</b></div>
            <div><span className="cap">52W high</span><b>{fmt(st52.high)}</b></div>
            <div><span className="cap">52W low</span><b>{fmt(st52.low)}</b></div>
          </div>
          <div className="col" style={{ gap: 6, padding: '0 4px' }}>
            <div className="row sp"><span className="cap">52-week range</span><span className="cap">where today sits</span></div>
            <div className="bar"><i style={{ width: `${Math.max(2, Math.min(100, ((q.price - st52.low) / (st52.high - st52.low || 1)) * 100))}%` }} /></div>
          </div>
        </section>
      )}

      {!isIndex && (
        <section className="glass col" style={{ gap: 12 }}>
          <h2 className="h2" style={{ padding: '0 4px' }}>Fundamentals</h2>
          <div className="stats" style={{ padding: '0 4px' }}>
            <div><span className="cap">Market cap</span><b>{capLabel(cap)}</b></div>
            <div><span className="cap">Size</span><b>{capSize(cap)}</b></div>
            <div><span className="cap">P/E ratio</span><b>{s.pe ? s.pe.toFixed(1) : 'Loss-making'}</b></div>
            <div><span className="cap">P/B ratio</span><b>{s.pb ? s.pb.toFixed(1) : '—'}</b></div>
            <div><span className="cap">Dividend yield</span><b>{s.div ? `${s.div.toFixed(1)}%` : 'None'}</b></div>
            <div><span className="cap">Return on equity</span><b>{s.roe ? `${s.roe.toFixed(1)}%` : '—'}</b></div>
          </div>
          <Link href="/learn" className="cap" style={{ padding: '0 4px', textDecoration: 'underline' }}>What do these mean? Jargon Buster</Link>
        </section>
      )}

      <section className="glass col" style={{ gap: 6 }}>
        <h2 className="h2" style={{ padding: '0 4px' }}>About</h2>
        <p className="body" style={{ padding: '0 4px' }}>{s.about}</p>
        <p className="cap" style={{ padding: '0 4px' }}>A fictional company with demo prices.</p>
      </section>

      {isIndex ? (
        <div className="dock">
          <Link className="btn" href="/mf/lakshya-nifty50">You can’t buy an index. An index fund can.</Link>
        </div>
      ) : notListed ? (
        <div className="dock"><Link className="btn2" href="/ipo">See the IPO</Link></div>
      ) : (
        <div className="dock">
          {sellable > 0 && <button className="btn2" onClick={() => setOrder('sell')}>Sell</button>}
          <button className="btn" onClick={() => setOrder('buy')}>Buy</button>
        </div>
      )}

      {order && <OrderSheet s={s} initial={order} onClose={() => setOrder(null)} />}
    </Screen>
  );
}

function OrderSheet({ s, initial, onClose }: { s: Stock; initial: 'buy' | 'sell'; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const now = useNow();
  const inv = state.invest;
  const [side, setSide] = useState(initial);
  const [type, setType] = useState<'market' | 'limit'>('market');
  const [qty, setQty] = useState('1');
  const [limit, setLimit] = useState(() => quote(s, Date.now()).price.toFixed(2));
  const [adding, setAdding] = useState(0);
  const [showCharges, setShowCharges] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  const q = quote(s, now);
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const lim = Number(limit) || 0;
  const per = type === 'limit' ? lim : q.price;
  const value = per * n;
  const ch = charges(side, value);
  const hold = side === 'buy' ? buyHold(s.id, type, n, lim, now) : 0;
  const sellable = sellableQty(inv, s.id);
  const short = side === 'buy' ? Math.max(0, hold - inv.balance) : 0;
  const open = session(now).open;
  const lic = licence(state);

  if (adding > 0) return <AddFundsSheet need={adding} onClose={() => setAdding(0)} />;

  const gate = inv.kyc.status !== 'verified' ? 'kyc' : side === 'buy' && !lic.crash ? 'lplate' : side === 'buy' && !inv.ackStocks ? 'ack' : null;

  return (
    <Sheet open onClose={onClose} label={`${side === 'buy' ? 'Buy' : 'Sell'} ${s.name}`}>
      {gate === 'kyc' ? (
        <>
          <div className="ico w"><Icon name="shield" /></div>
          <h2 className="h1" style={{ fontSize: 26 }}>KYC first</h2>
          <p className="body">Every investment app checks your PAN and bank once. It takes two minutes.</p>
          <Link className="btn" href={`/kyc?next=${encodeURIComponent(`/stocks/${s.id}`)}`}>Start KYC</Link>
        </>
      ) : gate === 'lplate' ? (
        <>
          <div className="lp" style={{ width: 52, height: 52 }} />
          <h2 className="h1" style={{ fontSize: 26 }}>Single stocks need your L-plate.</h2>
          <p className="body">Ninety seconds in the Crash Simulator: watch March 2020 happen to play money and decide whether to hold. Index funds don’t need it.</p>
          <Link className="btn" href="/crash"><Icon name="play" />Take the Crash Simulator</Link>
          <Link className="ghost" href="/mf/lakshya-nifty50">Try an index fund instead</Link>
        </>
      ) : gate === 'ack' ? (
        <>
          <span className="eye">Before your first stock</span>
          <h2 className="h1" style={{ fontSize: 26 }}>Three honest things.</h2>
          <div className="col" style={{ gap: 8 }}>
            {[
              ['One company can halve.', 'An index fund holds 50 at once. A single stock can fall 50% and stay there for years.'],
              ['Every trade costs money.', 'Brokerage, STT, GST and stamp duty, win or lose. We show them before you confirm.'],
              ['Keep it to your Fun money.', 'Most of your money belongs in pots and funds. Stocks are the spice, not the meal.'],
            ].map(([t, b]) => (
              <div key={t} className="plate col" style={{ gap: 2 }}><span className="med">{t}</span><span className="cap">{b}</span></div>
            ))}
          </div>
          <button className="btn" onClick={() => update((d) => { d.invest.ackStocks = true; })}>Got it, show me the order</button>
        </>
      ) : (
        <>
          <div className="row sp">
            <div className="col" style={{ gap: 2 }}>
              <h2 className="h2">{s.name}</h2>
              <span className="cap">{px(q.price)} · {q.live ? 'live' : 'last close'}</span>
            </div>
            <Logo id={s.id} name={s.name} />
          </div>
          <div className="seg" role="tablist" aria-label="Side">
            <button role="tab" aria-selected={side === 'buy'} onClick={() => setSide('buy')}>Buy</button>
            <button role="tab" aria-selected={side === 'sell'} onClick={() => setSide('sell')} disabled={sellable < 1}>Sell</button>
          </div>

          <div className="col" style={{ gap: 8 }}>
            <label htmlFor="qty" className="eye" style={{ padding: '0 4px' }}>Quantity{side === 'sell' ? ` · you can sell ${sellable}` : ''}</label>
            <div className="plate stepper">
              <button type="button" aria-label="One less" onClick={() => setQty(String(Math.max(1, n - 1)))}><Icon name="minus" /></button>
              <input id="qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, '').slice(0, 5))} />
              <button type="button" aria-label="One more" onClick={() => setQty(String(n + 1))}><Icon name="plus" /></button>
            </div>
          </div>

          <div className="seg" role="tablist" aria-label="Order type">
            <button role="tab" aria-selected={type === 'market'} onClick={() => setType('market')}>At market</button>
            <button role="tab" aria-selected={type === 'limit'} onClick={() => setType('limit')}>Limit price</button>
          </div>
          {type === 'limit' && (
            <div className="col" style={{ gap: 6 }}>
              <div className="field">
                <span className="pre">₹</span>
                <input inputMode="decimal" aria-label="Limit price" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ''))} />
              </div>
              <span className="cap" style={{ padding: '0 4px' }}>{side === 'buy' ? 'Buys only at this price or lower.' : 'Sells only at this price or higher.'} Unfilled orders lapse at 3:30 pm.</span>
            </div>
          )}

          {!open && <p className="cap ambx" style={{ padding: '0 4px' }}>Market’s closed. This goes in as an after-market order and {type === 'market' ? 'fills at the opening price' : 'waits for your price'} from 9:15 am.</p>}

          <div className="plate col" style={{ gap: 4 }}>
            <div className="kv"><span>{side === 'buy' ? 'Approx. cost' : 'Approx. you get'}</span><span>{px(side === 'buy' ? value + ch.total : value - ch.total)}</span></div>
            <button type="button" className="kv" style={{ border: 0, background: 'none', padding: 0, width: '100%', color: 'inherit', font: 'inherit' }} onClick={() => setShowCharges((v) => !v)} aria-expanded={showCharges}>
              <span>Charges {showCharges ? '▴' : '▾'}</span><span>{px(ch.total)}</span>
            </button>
            {showCharges && (
              <div className="col" style={{ gap: 0, paddingLeft: 10 }}>
                {([['Brokerage', ch.brokerage], ['STT', ch.stt], ['Exchange fee', ch.exchange], ['SEBI fee', ch.sebi], ['Stamp duty', ch.stamp], ['GST', ch.gst]] as [string, number][]).map(([k, v]) => (
                  <div key={k} className="kv cap" style={{ minHeight: 22 }}><span>{k}</span><span>{px(v)}</span></div>
                ))}
              </div>
            )}
            {side === 'buy' && <div className="kv"><span>Balance</span><MoneyP value={inv.balance} className="" /></div>}
            {side === 'buy' && type === 'market' && <span className="cap">We hold 3% extra in case the price moves; the unused part comes straight back.</span>}
          </div>

          {err && <p className="err" role="alert">{err}</p>}
          {side === 'sell' && n > sellable && <p className="err">You can sell up to {sellable}.</p>}

          {short > 0 ? (
            <button className="btn" onClick={() => setAdding(short)}><Icon name="plus" />Add {px(short)} to continue</button>
          ) : (
            <SwipeConfirm
              key={`${key}-${side}`}
              warn={side === 'sell'}
              disabled={n < 1 || (side === 'sell' && n > sellable) || (type === 'limit' && lim <= 0)}
              label={`Slide to ${side} ${n} share${n === 1 ? '' : 's'}`}
              onConfirm={() => {
                const input = { stockId: s.id, side, type, qty: n, limit: type === 'limit' ? lim : undefined };
                const at = Date.now();
                // Dry run on a copy to get the outcome, then apply the same order for real.
                const o = placeOrder(structuredClone(state), input, at);
                if (typeof o === 'string') {
                  setErr(o);
                  setKey((k) => k + 1);
                  return;
                }
                update((d) => { placeOrder(d, input, at); });
                toast(o.status === 'executed' ? `${side === 'buy' ? 'Bought' : 'Sold'} ${n} × ${s.name} at ${px(o.price!)}` : o.amo ? 'After-market order placed for 9:15 am' : `Limit order placed at ${px(o.limit!)}`);
                onClose();
              }}
            />
          )}
          <p className="cap center">Demo trading. Fictional company, no real money moves.</p>
        </>
      )}
    </Sheet>
  );
}
