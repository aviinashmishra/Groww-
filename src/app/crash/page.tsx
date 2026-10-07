'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Screen, LineChart } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { CRASH_DECISION, CRASH_MONTHS, CRASH_PEAK, CRASH_SERIES, crashMonthLabel } from '@/lib/data';
import { note } from '@/lib/logic';
import { rupees } from '@/lib/format';

const TOTAL = 90; // seconds
const DECIDE_AT = 49; // seconds in, March 2020
const AFTER = CRASH_MONTHS - 1 - CRASH_DECISION;

type Stage = 'intro' | 'run' | 'decide' | 'after' | 'result';

function monthAt(t: number): number {
  if (t <= DECIDE_AT) return Math.min(CRASH_DECISION, Math.floor((t / DECIDE_AT) * CRASH_DECISION));
  return Math.min(CRASH_MONTHS - 1, CRASH_DECISION + Math.floor(((t - DECIDE_AT) / (TOTAL - DECIDE_AT)) * AFTER));
}

function storyLine(m: number): string {
  if (m < 14) return 'Markets go up and down. Mostly up.';
  if (m < 24) return 'A dip in 2016. Headlines get nervous.';
  if (m < 46) return 'Steady climb. Feels easy.';
  if (m < 59) return 'Wobbles in 2018. Still above where you started.';
  return 'A new high in January 2020.';
}

export default function Crash() {
  const { state, update } = useStore();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('intro');
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [held, setHeld] = useState<boolean | null>(null);
  const recorded = useRef(false);
  const tRef = useRef(0);

  // Animation clock: only ticks in the two running stages.
  useEffect(() => {
    if (stage !== 'run' && stage !== 'after') return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const next = tRef.current + ((now - last) / 1000) * speed;
      last = now;
      if (stage === 'run' && next >= DECIDE_AT) {
        tRef.current = DECIDE_AT;
        setT(DECIDE_AT);
        setStage('decide');
        return;
      }
      if (stage === 'after' && next >= TOTAL) {
        tRef.current = TOTAL;
        setT(TOTAL);
        setStage('result');
        return;
      }
      tRef.current = next;
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, speed]);

  // Record the outcome once.
  useEffect(() => {
    if (stage !== 'result' || recorded.current || held === null) return;
    recorded.current = true;
    update((d) => {
      d.crash.attempts += 1;
      d.crash.at = new Date().toISOString();
      if (held) {
        if (d.crash.held !== true) note(d, 'L-plate earned', 'You held through March 2020. Your Learner’s licence is on your profile.', '/profile');
        d.crash.held = true;
      } else if (d.crash.held !== true) {
        d.crash.held = false;
      }
    });
  }, [stage, held, update]);

  const restart = () => {
    recorded.current = false;
    setHeld(null);
    tRef.current = 0;
    setT(0);
    setSpeed(1);
    setStage('run');
  };

  const m = monthAt(t);
  const year = Math.floor(m / 12) + 1;
  const market = CRASH_SERIES.slice(0, m + 1);
  const soldValue = CRASH_SERIES[CRASH_DECISION];
  const yours = held === false && m > CRASH_DECISION ? soldValue : CRASH_SERIES[m];
  const left = Math.max(0, Math.ceil(TOTAL - t));
  const finalHeld = CRASH_SERIES[CRASH_MONTHS - 1];

  if (stage === 'intro') {
    return (
      <Screen orbs="a" nav={false}>
        <div className="row" style={{ gap: 10 }}>
          <div className="lp">L</div>
          <span className="eye">Learner’s licence · test 1</span>
        </div>
        <div className="col" style={{ gap: 12, marginTop: 28 }}>
          <h1 className="h1" style={{ fontSize: 38, lineHeight: 1.08 }}>Before real money, survive a fake crash.</h1>
          <p className="body" style={{ fontSize: 16 }}>Ninety seconds. Ten years of the Nifty 50. Koi risk nahi, it’s play money.</p>
        </div>
        <section className="glass col" style={{ gap: 8, marginTop: 10 }}>
          <div className="plate row">
            <div className="ico"><Icon name="coin" /></div>
            <div className="col grow"><span className="eye">You start with</span><span className="med">Play money</span></div>
            <span className="amt">₹10,000</span>
          </div>
          <div className="plate row">
            <div className="ico n"><Icon name="trend" /></div>
            <div className="col grow"><span className="eye">You live through</span><span className="med">2015 to 2025, as it happened</span></div>
          </div>
          <div className="plate row">
            <div className="ico n"><Icon name="fork" /></div>
            <div className="col grow"><span className="eye">You decide</span><span className="med">Hold or sell, once</span></div>
          </div>
        </section>
        <div className="foot nonav">
          <button className="btn" onClick={restart}><Icon name="play" />Start the 90 seconds</button>
          <button className="ghost" onClick={() => router.push(state.onboarded ? '/' : '/welcome')}>I’ve invested before, skip</button>
        </div>
      </Screen>
    );
  }

  if (stage === 'result') {
    return (
      <Screen orbs="c" nav={false}>
        <span className="eye">Ten years later · 2025</span>
        <div className="col" style={{ gap: 8 }}>
          <h1 className="h1" style={{ fontSize: 52, lineHeight: 1 }}>{held ? 'You held.' : 'You sold.'}</h1>
          <p className="body" style={{ fontSize: 16 }}>Same crash, same ₹10,000. The whole difference was one tap in March 2020.</p>
        </div>
        <section className="glass col" style={{ gap: 10 }}>
          <div className="plate" style={{ padding: 12 }}>
            <LineChart
              label={`Play money from 2015 to 2025. Holding ended at ${rupees(finalHeld)}, selling in March 2020 ended at ${rupees(soldValue)}.`}
              series={[{ values: CRASH_SERIES, kind: 'a' }]}
              refY={soldValue}
              refFrom={CRASH_DECISION}
              refKind="b"
              height={140}
              min={7000}
              max={32000}
            />
            <div className="row sp" style={{ marginTop: 4 }}>
              <span className="cap">2015</span><span className="cap">Mar 2020</span><span className="cap">2025</span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
            <div className="plate col grow" style={{ gap: 4 }}>
              <span className={`eye${held ? ' accx' : ''}`}>{held ? 'You, who held' : 'If you’d held'}</span>
              <span className="num" style={held ? undefined : { color: 'var(--ink3)' }}>{rupees(finalHeld)}</span>
            </div>
            <div className="plate col grow" style={{ gap: 4 }}>
              <span className={`eye${held ? '' : ' accx'}`}>{held ? 'You, who sold' : 'You, who sold'}</span>
              <span className="num" style={held ? { color: 'var(--ink3)' } : undefined}>{rupees(soldValue)}</span>
            </div>
          </div>
        </section>
        <p className="cap">Play money on a path shaped like Nifty 50 history, 2015 to 2025, with values rounded. Past returns don’t promise future ones. Crashes will happen again; that is the point of the test.</p>
        <div className="foot nonav">
          {held ? (
            <Link className="btn" href={state.onboarded ? '/profile' : '/welcome'}>
              <span className="lp inbtn">L</span>Get my L-plate
            </Link>
          ) : (
            <button className="btn" onClick={restart}><Icon name="refresh" />Replay and hold this time</button>
          )}
          {held ? (
            <button className="ghost" onClick={restart}>Replay and sell this time</button>
          ) : (
            <Link className="ghost" href={state.onboarded ? '/' : '/welcome'}>Not now</Link>
          )}
        </div>
      </Screen>
    );
  }

  const deciding = stage === 'decide';
  const headline = deciding
    ? 'Markets just fell 38% in five weeks.'
    : stage === 'after'
      ? held ? 'You held. Now you wait.' : `You sold at ${rupees(soldValue)}. Now you watch.`
      : storyLine(m);

  return (
    <Screen orbs="b" nav={false}>
      <div className="col" style={{ gap: 8 }}>
        <div className="row sp">
          <span className="eye" aria-live="polite">Year {Math.min(10, year)} of 10 · {crashMonthLabel(m)}</span>
          <div className="row" style={{ gap: 6 }}>
            {!deciding && (
              <button className="chip" onClick={() => setSpeed((s) => (s === 1 ? 4 : 1))} aria-label={`Playback speed ${speed}×, tap to change`}>
                {speed}×
              </button>
            )}
            <span className="chip"><Icon name="clock" small />0:{String(left).padStart(2, '0')} left</span>
          </div>
        </div>
        <div className="bar"><i style={{ width: `${(t / TOTAL) * 100}%` }} /></div>
      </div>

      <h1 className="h1" style={{ fontSize: 32, marginTop: 6, minHeight: 74 }}>{headline}</h1>

      <section className="glass col" style={{ gap: 10 }}>
        <div className="plate" style={{ padding: 12 }}>
          <LineChart
            label={`Play money path up to ${crashMonthLabel(m)}`}
            series={[{ values: market, kind: 'a', length: CRASH_MONTHS }]}
            refY={m >= CRASH_PEAK ? CRASH_SERIES[CRASH_PEAK] : held === false ? soldValue : undefined}
            refFrom={m >= CRASH_PEAK && held !== false ? CRASH_PEAK : CRASH_DECISION}
            refKind={held === false ? 'b' : 'w'}
            min={7000}
            max={32000}
          />
          <div className="row sp" style={{ marginTop: 4 }}>
            <span className="cap">2015</span>
            {m >= CRASH_PEAK && <span className="cap ambx">{held === false ? 'Where you sold' : 'January peak'}</span>}
          </div>
        </div>
        <div className="plate row sp">
          <div className="col" style={{ gap: 2 }}>
            <span className="eye">Your ₹10,000 is now</span>
            <span className="num" style={{ fontSize: 40 }}>{rupees(yours)}</span>
          </div>
          {m >= CRASH_PEAK && (
            <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
              <span className="cap">In January 2020</span>
              <span className="amt" style={{ color: 'var(--ink3)' }}>{rupees(CRASH_SERIES[CRASH_PEAK])}</span>
            </div>
          )}
        </div>
      </section>

      {deciding && <p className="body">News is bad. Friends are selling. Nobody knows when it ends. Ab kya?</p>}

      <div className="foot nonav" style={{ gap: 10 }}>
        {deciding ? (
          <>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn2" onClick={() => { setHeld(true); setStage('after'); }}>Hold</button>
              <button className="btn2" onClick={() => { setHeld(false); setStage('after'); }}>Sell everything</button>
            </div>
            <p className="cap center">Both buttons look the same on purpose. Decide like it’s real.</p>
          </>
        ) : stage === 'after' ? (
          <button className="ghost" onClick={() => { tRef.current = TOTAL; setT(TOTAL); setStage('result'); }}>Skip to 2025</button>
        ) : (
          <p className="cap center">Watch. You’ll get one decision.</p>
        )}
      </div>
    </Screen>
  );
}
