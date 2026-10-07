'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, TopBar, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Logo, useNow } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { findFund, findStock, ipoById, ipoStatus, istDate, istTime, px } from '@/lib/market';
import { type StockOrder, cancelOrder, charges } from '@/lib/invest';
import { rupees } from '@/lib/format';

type Tab = 'stocks' | 'funds' | 'ipo';

const STATUS: Record<StockOrder['status'], [string, string]> = {
  pending: ['Open', 'amb'],
  executed: ['Executed', 'acc'],
  cancelled: ['Cancelled', ''],
  rejected: ['Rejected', 'amb'],
};

const when = (iso: string) => `${istDate(new Date(iso).getTime())}, ${istTime(new Date(iso).getTime())}`;

export default function Orders() {
  const { state } = useStore();
  const now = useNow();
  const inv = state.invest;
  const [tab, setTab] = useState<Tab>('stocks');
  const [open, setOpen] = useState<string | null>(null);
  const sel = inv.orders.find((o) => o.id === open);
  const pending = inv.orders.filter((o) => o.status === 'pending');
  const done = inv.orders.filter((o) => o.status !== 'pending');

  return (
    <Screen orbs="b">
      <TopBar back="/invest" label="Orders" />
      <h1 className="h1">Every order, honestly logged.</h1>
      <div className="seg" role="tablist" aria-label="Order type">
        <button role="tab" aria-selected={tab === 'stocks'} onClick={() => setTab('stocks')}>Stocks{pending.length ? ` · ${pending.length} open` : ''}</button>
        <button role="tab" aria-selected={tab === 'funds'} onClick={() => setTab('funds')}>Mutual funds</button>
        <button role="tab" aria-selected={tab === 'ipo'} onClick={() => setTab('ipo')}>IPO</button>
      </div>

      {tab === 'stocks' && (
        <>
          {pending.length > 0 && (
            <section className="glass col" style={{ gap: 8 }}>
              <span className="eye" style={{ padding: '0 4px' }}>Open</span>
              {pending.map((o) => <OrderRow key={o.id} o={o} onOpen={() => setOpen(o.id)} />)}
            </section>
          )}
          <section className="glass col" style={{ gap: 8 }}>
            <span className="eye" style={{ padding: '0 4px' }}>History</span>
            {done.length === 0 ? <p className="cap" style={{ padding: '0 4px' }}>No stock orders yet.</p> : done.map((o) => <OrderRow key={o.id} o={o} onOpen={() => setOpen(o.id)} />)}
          </section>
        </>
      )}

      {tab === 'funds' && (
        <section className="glass col" style={{ gap: 8 }}>
          {inv.mfOrders.length === 0 ? <p className="cap" style={{ padding: '0 4px' }}>No fund orders yet.</p> : inv.mfOrders.slice(0, 80).map((o) => {
            const f = findFund(o.fundId);
            return (
              <Link key={o.id} href={`/mf/${o.fundId}`} className="plate tk">
                <Logo id={f?.amc ?? o.fundId} name={f?.amc ?? 'Fund'} />
                <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                  <span className="med" style={{ lineHeight: 1.25 }}>{f?.name ?? o.fundId}</span>
                  <span className="cap">{o.side === 'buy' ? (o.sipId ? 'SIP instalment' : 'One-time') : 'Redemption'} · {istDate(new Date(o.placedAt).getTime())}</span>
                </span>
                <span className="r">
                  <span className="p">{rupees(o.amount)}</span>
                  <span className={`pill${o.status === 'done' ? ' acc' : o.status === 'processing' ? ' amb' : ''}`}>{o.status === 'done' ? (o.units ? `${o.units.toFixed(3)} units` : 'Done') : o.status === 'processing' ? 'Processing' : 'Failed'}</span>
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {tab === 'ipo' && (
        <section className="glass col" style={{ gap: 8 }}>
          {inv.ipos.length === 0 ? (
            <div className="col" style={{ gap: 6, padding: 4 }}>
              <p className="cap">No IPO applications yet.</p>
              <Link href="/ipo" className="chip big acc" style={{ alignSelf: 'flex-start' }}><Icon name="rocket" small />See IPOs</Link>
            </div>
          ) : inv.ipos.map((a) => {
            const ipo = ipoById(a.ipoId);
            const label = { applied: ipo && ipoStatus(ipo, now) === 'open' ? 'Bid placed' : 'Awaiting allotment', allotted: 'Allotted', 'not-allotted': 'Not allotted', listed: 'Listed, in portfolio', cancelled: 'Cancelled' }[a.status];
            return (
              <Link key={a.id} href={`/ipo/${a.ipoId}`} className="plate tk">
                <Logo id={ipo?.slug ?? a.ipoId} name={ipo?.name ?? 'IPO'} />
                <span className="col grow" style={{ gap: 2 }}>
                  <span className="med">{ipo?.name ?? 'IPO'}</span>
                  <span className="cap">{a.lots} lot{a.lots > 1 ? 's' : ''} at {px(a.price)}</span>
                </span>
                <span className={`pill${a.status === 'allotted' || a.status === 'listed' ? ' acc' : a.status === 'applied' ? ' amb' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </section>
      )}

      <div className="foot" />
      <Sheet open={!!sel} onClose={() => setOpen(null)} label="Order details">{sel && <OrderDetail o={sel} onClose={() => setOpen(null)} />}</Sheet>
    </Screen>
  );
}

function OrderRow({ o, onOpen }: { o: StockOrder; onOpen: () => void }) {
  const s = findStock(o.stockId);
  const [label, hue] = STATUS[o.status];
  return (
    <button className="plate tk" onClick={onOpen}>
      <Logo id={o.stockId} name={s?.name ?? o.stockId} />
      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
        <span className="med" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s?.name ?? o.stockId}</span>
        <span className="cap">{o.side === 'buy' ? 'Buy' : 'Sell'} {o.qty} · {o.type === 'limit' ? `limit ${px(o.limit!)}` : 'market'}{o.amo ? ' · AMO' : ''}</span>
      </span>
      <span className="r">
        <span className="p">{o.price ? px(o.price) : o.limit ? px(o.limit) : '—'}</span>
        <span className={`pill${hue ? ` ${hue}` : ''}`}>{label}</span>
      </span>
    </button>
  );
}

function OrderDetail({ o, onClose }: { o: StockOrder; onClose: () => void }) {
  const { update, toast } = useStore();
  const s = findStock(o.stockId);
  const value = (o.price ?? o.limit ?? 0) * o.qty;
  const ch = charges(o.side, value);
  return (
    <>
      <div className="row" style={{ gap: 12 }}>
        <Logo id={o.stockId} name={s?.name ?? ''} lg />
        <div className="col grow"><span className="eye">{o.side === 'buy' ? 'Buy' : 'Sell'} order · {STATUS[o.status][0]}</span><h2 className="h2">{s?.name}</h2></div>
      </div>
      <div className="plate col" style={{ gap: 2 }}>
        <div className="kv"><span>Quantity</span><span>{o.qty}</span></div>
        <div className="kv"><span>Type</span><span>{o.type === 'limit' ? `Limit at ${px(o.limit!)}` : 'Market'}{o.amo ? ' (after-market)' : ''}</span></div>
        {o.price !== undefined && <div className="kv"><span>Filled at</span><span>{px(o.price)}</span></div>}
        <div className="kv"><span>Placed</span><span>{when(o.placedAt)}</span></div>
        {o.doneAt && <div className="kv"><span>{o.status === 'executed' ? 'Executed' : 'Closed'}</span><span>{when(o.doneAt)}</span></div>}
        {o.reason && <div className="kv"><span>Why</span><span>{o.reason}</span></div>}
        {o.blocked > 0 && <div className="kv"><span>Held from balance</span><span>{px(o.blocked)}</span></div>}
      </div>
      {o.status === 'executed' && (
        <div className="plate col" style={{ gap: 0 }}>
          <div className="kv"><span>Order value</span><span>{px(value)}</span></div>
          {([['Brokerage', ch.brokerage], ['STT', ch.stt], ['Exchange fee', ch.exchange], ['SEBI fee', ch.sebi], ['Stamp duty', ch.stamp], ['GST', ch.gst]] as [string, number][]).map(([k, v]) => (
            <div key={k} className="kv cap" style={{ minHeight: 22 }}><span>{k}</span><span>{px(v)}</span></div>
          ))}
          <div className="kv"><span>{o.side === 'buy' ? 'Total paid' : 'Total received'}</span><span>{px(o.side === 'buy' ? value + ch.total : value - ch.total)}</span></div>
        </div>
      )}
      {o.status === 'pending' ? (
        <button className="btn2" onClick={() => { update((d) => cancelOrder(d, o.id)); toast('Order cancelled. Held money is back.'); onClose(); }}>Cancel order</button>
      ) : (
        <Link className="btn2" href={`/stocks/${o.stockId}`}>Open {s?.name}</Link>
      )}
    </>
  );
}
