'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, TopBar, Sheet, AmountField } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Logo, MoneyP } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { findFund, istDate, istDay } from '@/lib/market';
import { nextSipDate, ordinal } from '@/lib/invest';
import { parseAmount, rupees } from '@/lib/format';

const DAYS = [1, 5, 10, 15, 20, 25];

export default function Sips() {
  const { state } = useStore();
  const sips = state.invest.sips;
  const [open, setOpen] = useState<string | null>(null);
  const active = sips.filter((x) => x.status === 'active');
  const monthly = active.reduce((a, x) => a + x.amount, 0);
  const next = [...active].sort((a, b) => a.nextAt - b.nextAt)[0];
  const sel = sips.find((x) => x.id === open);

  return (
    <Screen orbs="c">
      <TopBar back="/invest" label="SIPs" />
      <h1 className="h1">Set once,{'\n'}grow quietly.</h1>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="row sp" style={{ padding: '0 4px', alignItems: 'flex-end' }}>
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">Every month</span>
            <MoneyP value={monthly} className="num" />
          </div>
          <span className="chip acc">{active.length} active</span>
        </div>
        {next && (
          <div className="plate row">
            <div className="ico"><Icon name="calendar" /></div>
            <span className="col grow"><span className="med">Next: {rupees(next.amount)} on {istDay(next.nextAt)}</span><span className="cap">{findFund(next.fundId)?.name} · autopay</span></span>
          </div>
        )}
      </section>

      <section className="glass col" style={{ gap: 8 }}>
        {sips.length === 0 ? (
          <div className="col" style={{ gap: 6, padding: 8 }}>
            <span className="med">No SIPs yet</span>
            <span className="cap">A SIP buys a fund on the same date every month, so you never have to time the market.</span>
            <Link href="/mf/lakshya-nifty50" className="chip big acc" style={{ alignSelf: 'flex-start' }}>Start with an index fund</Link>
          </div>
        ) : sips.map((x) => {
          const f = findFund(x.fundId);
          return (
            <button key={x.id} className="plate tk" onClick={() => setOpen(x.id)}>
              <Logo id={f?.amc ?? x.fundId} name={f?.amc ?? 'Fund'} />
              <span className="col grow" style={{ gap: 2 }}>
                <span className="med" style={{ lineHeight: 1.25 }}>{f?.name}</span>
                <span className="cap">{x.status === 'paused' ? 'Paused' : `${ordinal(x.day)} of every month · next ${istDay(x.nextAt)}`}</span>
              </span>
              <span className="r">
                <span className="p">{rupees(x.amount)}</span>
                <span className={`pill${x.status === 'active' ? ' acc' : ''}`}>{x.count} done</span>
              </span>
            </button>
          );
        })}
      </section>

      <p className="cap center">SIP instalments come from your bank by autopay, not from your balance.</p>
      <div className="foot" />
      <Sheet open={!!sel} onClose={() => setOpen(null)} label="Manage SIP">{sel && <Manage id={sel.id} onClose={() => setOpen(null)} />}</Sheet>
    </Screen>
  );
}

function Manage({ id, onClose }: { id: string; onClose: () => void }) {
  const { state, update, toast } = useStore();
  const sip = state.invest.sips.find((x) => x.id === id)!;
  const f = findFund(sip.fundId)!;
  const [amount, setAmount] = useState(String(sip.amount));
  const [day, setDay] = useState(sip.day);
  const [stopping, setStopping] = useState(false);
  const n = parseAmount(amount);
  const changed = n !== sip.amount || day !== sip.day;

  if (stopping) {
    return (
      <>
        <h2 className="h1" style={{ fontSize: 26 }}>Stop this SIP?</h2>
        <p className="body">The units you already own stay invested. Lazy Twin would only pause it, if money is tight this month.</p>
        <button className="btn" onClick={() => { update((d) => { const s = d.invest.sips.find((x) => x.id === id); if (s) s.status = 'paused'; }); toast('SIP paused instead'); onClose(); }}>Just pause it</button>
        <button className="ghost" style={{ color: 'var(--amb-ink)' }} onClick={() => { update((d) => { d.invest.sips = d.invest.sips.filter((x) => x.id !== id); }); toast('SIP stopped'); onClose(); }}>Stop it for good</button>
      </>
    );
  }

  return (
    <>
      <div className="row" style={{ gap: 12 }}>
        <Logo id={f.amc} name={f.amc} lg />
        <div className="col grow"><span className="eye">SIP since {istDate(new Date(sip.startedAt).getTime())}</span><h2 className="h2">{f.name}</h2></div>
      </div>
      <AmountField id="sip-amt" label="Every month" value={amount} onChange={setAmount} />
      {n > 0 && n < f.minSip && <p className="err">The minimum SIP is {rupees(f.minSip)}.</p>}
      <div className="row wrap" style={{ gap: 6 }}>
        {DAYS.map((d) => <button key={d} type="button" className="chip" aria-pressed={day === d} onClick={() => setDay(d)}>{ordinal(d)}</button>)}
      </div>
      <button
        className="btn"
        disabled={!changed || n < f.minSip}
        onClick={() => {
          update((d) => {
            const s = d.invest.sips.find((x) => x.id === id);
            if (!s) return;
            s.amount = n;
            if (s.day !== day) { s.day = day; s.nextAt = nextSipDate(day, Date.now()); }
          });
          toast('SIP updated');
          onClose();
        }}
      >
        Save changes
      </button>
      <div className="row" style={{ gap: 8 }}>
        {sip.status === 'active' ? (
          <button className="btn2" onClick={() => { update((d) => { const s = d.invest.sips.find((x) => x.id === id); if (s) s.status = 'paused'; }); toast('SIP paused'); onClose(); }}>Pause</button>
        ) : (
          <button className="btn2" onClick={() => { update((d) => { const s = d.invest.sips.find((x) => x.id === id); if (s) { s.status = 'active'; s.nextAt = nextSipDate(s.day, Date.now()); } }); toast('SIP resumed'); onClose(); }}>Resume</button>
        )}
        <button className="btn2" onClick={() => setStopping(true)}>Stop</button>
      </div>
      <Link href={`/mf/${f.id}`} className="ghost">Open the fund<Icon name="chevR" small /></Link>
    </>
  );
}
