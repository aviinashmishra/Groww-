'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Screen, Sheet } from '@/components/ui';
import { STICKERS } from '@/lib/stickers';
import { Icon } from '@/components/Icon';
import { Avatar } from '@/components/Avatar';
import { useStore } from '@/lib/store';
import { LEVEL_NAME, licence } from '@/lib/logic';
import { fmtMonthYear } from '@/lib/format';

export default function Profile() {
  const { state } = useStore();
  const lic = licence(state);
  const steps = ['L-plate', 'Fun Pot', 'F&O'];
  const [open, setOpen] = useState<string | null>(null);
  const sel = STICKERS.find((s) => s.id === open);
  const got = !!sel && state.stickers.includes(sel.id);
  const earnedCount = STICKERS.filter((s) => state.stickers.includes(s.id)).length;

  const criteria: [boolean, string, string][] = [
    [lic.crash, 'Held through the Crash Simulator', '/crash'],
    [lic.six, lic.six ? '6 months of index fund and goals' : `6 months of index fund and goals (${Math.max(0, lic.months)} of 6)`, '/'],
    [lic.rw, 'Runway past 2 months', '/'],
  ];

  return (
    <Screen orbs="a">
      <div className="row sp">
        <div className="row">
          <Avatar size={48} />
          <div className="col"><span style={{ fontWeight: 600, fontSize: 17 }}>{state.name}</span><span className="cap">Here since {fmtMonthYear(state.joinedAt)}</span></div>
        </div>
        <Link className="av" href="/profile/settings" aria-label="Settings"><Icon name="sliders" /></Link>
      </div>

      <section className="glass col" style={{ gap: 14 }}>
        <div className="plate col" style={{ gap: 14, padding: '18px 16px' }}>
          <div className="row" style={{ gap: 14 }}>
            <div className="lp" style={{ width: 64, height: 64, opacity: lic.level ? 1 : 0.4 }} />
            <div className="col grow" style={{ gap: 2 }}>
              <span className="eye">Licence for money</span>
              <span className="h1">{LEVEL_NAME[lic.level]}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }} role="img" aria-label={`Level ${lic.level} of 3`}>
            {steps.map((s, i) => {
              const lvl = i + 1;
              const done = lic.level > lvl || (lic.level === 3 && lvl === 3);
              const current = lic.level === lvl && lvl !== 3;
              return (
                <span key={s} className="row" style={{ gap: 6, flex: i < 2 ? 1 : 'none' }}>
                  {done ? (
                    <span className="ico" style={{ width: 32, height: 32, borderRadius: '50%' }}><Icon name="check" small /></span>
                  ) : current ? (
                    <span style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--acc-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flex: 'none' }}>{lvl}</span>
                  ) : (
                    <span className="ico n" style={{ width: 32, height: 32, borderRadius: '50%' }}><Icon name="lock" small /></span>
                  )}
                  {i < 2 && <span className="bar grow" style={{ height: 4 }}>{lic.level > lvl && <i style={{ width: '100%' }} />}</span>}
                </span>
              );
            })}
          </div>
          <div className="row sp">
            {steps.map((s, i) => <span key={s} className="cap" style={lic.level === i + 1 ? { color: 'var(--ink)', fontWeight: 600 } : undefined}>{s}</span>)}
          </div>
        </div>
        <div className="col" style={{ gap: 10, padding: '0 4px' }}>
          <span className="eye">{lic.level >= 2 ? 'How you got here' : 'The road to the Fun Pot'}</span>
          {criteria.map(([ok, label, href]) => (
            <Link key={label} href={href} className="row" style={{ minHeight: 28 }}>
              <Icon name={ok ? 'check' : 'lock'} style={{ color: ok ? 'var(--acc-ink)' : 'var(--ink3)' }} />
              <span className="grow" style={ok ? undefined : { color: 'var(--ink2)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass col" style={{ gap: 12 }} id="stickers">
        <div className="row sp" style={{ padding: '0 4px' }}>
          <h2 className="h2">Stickers</h2>
          <span className="cap">{earnedCount} of {STICKERS.length} · for habits, never streaks</span>
        </div>
        <div className="stickers">
          {STICKERS.map((s, k) => {
            const got = state.stickers.includes(s.id);
            return (
              <button key={s.id} className="stk" onClick={() => setOpen(s.id)} aria-label={`${s.name}, ${got ? 'earned' : 'locked'}`}>
                <span className={`face ${got ? s.hue : 'off'}`} style={{ ['--tilt' as string]: `${[-6, 4, -3, 6, -5][k % 5]}deg` }}>
                  <Icon name={got ? s.icon : 'lock'} />
                </span>
                <span className="nm">{s.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Link className="glass row" href="/recap" style={{ padding: '12px 16px' }}>
        <div className="ico"><Icon name="story" /></div>
        <div className="col grow"><span className="eye">Your week</span><span className="med">Replay your week in money</span></div>
        <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
      </Link>

      <Link className="glass row" href="/fun" style={{ padding: '12px 16px' }}>
        <div className="col grow"><span className="eye">Fun Pot</span><span className="med">{lic.level >= 2 ? 'Stocks, capped at 10%' : 'Opens at Level 2'}</span></div>
        <Icon name="chevR" style={{ color: 'var(--ink3)' }} />
      </Link>

      <div className="foot">
        {lic.level === 0 ? (
          <Link className="btn" href="/crash"><Icon name="play" />Take the Crash Simulator</Link>
        ) : lic.level === 1 ? (
          <Link className="btn" href="/">Keep building runway</Link>
        ) : lic.level === 2 ? (
          <Link className="btn" href="/fun/odds">See what F&amp;O asks of you</Link>
        ) : (
          <Link className="btn" href="/fun">Open the Fun Pot</Link>
        )}
      </div>
      <Sheet open={!!sel} onClose={() => setOpen(null)} label="Sticker">
        {sel && (
          <>
            <div className="row" style={{ gap: 14 }}>
              <span className={`stk`} style={{ width: 72 }}>
                <span className={`face ${got ? sel.hue : 'off'}`} style={{ ['--tilt' as string]: '-6deg' }}><Icon name={got ? sel.icon : 'lock'} style={{ width: 30, height: 30 }} /></span>
              </span>
              <div className="col grow" style={{ gap: 4 }}>
                <span className={`eye${got ? ' accx' : ''}`}>{got ? 'Earned' : 'Locked'}</span>
                <h2 className="h1" style={{ fontSize: 26 }}>{sel.name}</h2>
              </div>
            </div>
            <p className="body">{got ? sel.blurb : `To earn it: ${sel.hint.toLowerCase()}.`}</p>
            <button className="btn" onClick={() => setOpen(null)}>{got ? 'Nice' : 'Got it'}</button>
          </>
        )}
      </Sheet>
    </Screen>
  );
}
