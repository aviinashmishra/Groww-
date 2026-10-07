'use client';

import { useState } from 'react';
import { Screen, TopBar, Sheet, AmountField } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { AddFundsSheet, KycNeeded, MoneyP } from '@/components/Invest';
import { useStore } from '@/lib/store';
import { istDate, istTime, px } from '@/lib/market';
import { type TxnKind, withdrawMoney } from '@/lib/invest';
import { parseAmount, rupees } from '@/lib/format';

const ICON: Record<TxnKind, IconName> = { add: 'plus', withdraw: 'bank', buy: 'trend', sell: 'trend', block: 'lock', release: 'refresh', mf: 'coin', redeem: 'coin' };

export default function Wallet() {
  const { state } = useStore();
  const inv = state.invest;
  const [sheet, setSheet] = useState<null | 'add' | 'out'>(null);
  const [filter, setFilter] = useState<'all' | 'money' | 'trades'>('all');
  const held = inv.orders.filter((o) => o.status === 'pending').reduce((a, o) => a + o.blocked, 0);
  const txns = inv.txns.filter((t) => filter === 'all' || (filter === 'money' ? t.kind === 'add' || t.kind === 'withdraw' : t.kind !== 'add' && t.kind !== 'withdraw'));
  const verified = inv.kyc.status === 'verified';

  return (
    <Screen orbs="b">
      <TopBar back="/invest" label="Balance" />
      {!verified && <KycNeeded next="/wallet" what="add money" />}
      <section className="glass col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 4, padding: '0 4px' }}>
          <span className="eye">Available to invest</span>
          <MoneyP value={inv.balance} className="hero" style={{ fontSize: 44 }} />
          {held > 0 && <span className="cap">Plus <MoneyP value={held} className="" /> held for open orders</span>}
        </div>
        {inv.kyc.bank && (
          <div className="plate row">
            <div className="ico n"><Icon name="bank" /></div>
            <span className="col grow"><span className="med">{inv.kyc.bank.name} ••{inv.kyc.bank.last4}</span><span className="cap">Your linked bank · {inv.kyc.bank.ifsc}</span></span>
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <button className="btn2" disabled={!verified || inv.balance <= 0} onClick={() => setSheet('out')}>Withdraw</button>
          <button className="btn" disabled={!verified} onClick={() => setSheet('add')}><Icon name="plus" />Add money</button>
        </div>
      </section>

      <section className="glass col" style={{ gap: 8 }}>
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">Transactions</h2>
          <div className="row" style={{ gap: 4 }}>
            {(['all', 'money', 'trades'] as const).map((f) => <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)} style={{ height: 32 }}>{f === 'all' ? 'All' : f === 'money' ? 'In/out' : 'Trades'}</button>)}
          </div>
        </div>
        {txns.length === 0 ? <p className="cap" style={{ padding: '0 4px' }}>Nothing here yet.</p> : txns.slice(0, 100).map((t) => {
          const ms = new Date(t.at).getTime();
          return (
            <div key={t.id} className="plate row">
              <div className={`ico${t.amount > 0 ? '' : ' n'}`}><Icon name={ICON[t.kind]} small /></div>
              <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                <span className="med" style={{ fontSize: 14.5, lineHeight: 1.25 }}>{t.label}</span>
                <span className="cap">{istDate(ms)}, {istTime(ms)}</span>
              </span>
              <MoneyP value={t.amount} signed className="amt" style={{ fontSize: 15 }} />
            </div>
          );
        })}
      </section>
      <p className="cap center">Demo balance. Real brokers keep it with a clearing corporation, not in the app.</p>
      <div className="foot" />

      {sheet === 'add' && <AddFundsSheet onClose={() => setSheet(null)} />}
      {sheet === 'out' && <Withdraw onClose={() => setSheet(null)} />}
    </Screen>
  );
}

function Withdraw({ onClose }: { onClose: () => void }) {
  const { state, update, toast } = useStore();
  const max = Math.floor(state.invest.balance * 100) / 100;
  const [amount, setAmount] = useState(String(Math.floor(max)));
  const n = parseAmount(amount);
  const bank = state.invest.kyc.bank;
  return (
    <Sheet open onClose={onClose} label="Withdraw">
      <h2 className="h1" style={{ fontSize: 26 }}>Withdraw to your bank</h2>
      <AmountField id="wd-amt" label="Amount" value={amount} onChange={setAmount} max={Math.floor(max)} />
      {n > max && <p className="err">Your balance is {px(max)}.</p>}
      <div className="plate row">
        <div className="ico n"><Icon name="bank" /></div>
        <span className="col grow"><span className="med">{bank ? `${bank.name} ••${bank.last4}` : 'Your bank'}</span><span className="cap">Usually within a working day</span></span>
      </div>
      <button className="btn" disabled={n <= 0 || n > max} onClick={() => { update((d) => { withdrawMoney(d, n); }); toast(`${rupees(n)} on its way to your bank`); onClose(); }}>Withdraw {n > 0 ? rupees(n) : ''}</button>
    </Sheet>
  );
}
