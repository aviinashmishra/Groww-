'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dots } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { STICKERS } from '@/lib/stickers';
import { circleGoal, landings, runway, tipOutcome, twin } from '@/lib/logic';
import { fmtDay, localDay, rupees } from '@/lib/format';
import { buzz, useCountUp } from '@/lib/fx';
import { Face, MOOD_LABEL } from '@/components/Mood';

const DURATION = 5500;

const BG = [
  'radial-gradient(circle 320px at 10% 10%, rgba(0,208,156,.55), transparent), radial-gradient(circle 300px at 100% 90%, rgba(96,104,220,.55), transparent), #04110E',
  'radial-gradient(circle 360px at 90% 0%, rgba(0,208,156,.6), transparent), radial-gradient(circle 280px at 0% 100%, rgba(140,235,205,.35), transparent), #04110E',
  'radial-gradient(circle 340px at 0% 40%, rgba(96,104,220,.6), transparent), radial-gradient(circle 300px at 100% 100%, rgba(0,208,156,.4), transparent), #060B1A',
  'radial-gradient(circle 360px at 100% 20%, rgba(245,165,36,.45), transparent), radial-gradient(circle 280px at 0% 90%, rgba(0,208,156,.35), transparent), #120D04',
  'radial-gradient(circle 340px at 50% 0%, rgba(140,235,205,.45), transparent), radial-gradient(circle 300px at 0% 100%, rgba(96,104,220,.5), transparent), #04110E',
  'radial-gradient(circle 340px at 0% 0%, rgba(0,208,156,.5), transparent), radial-gradient(circle 320px at 100% 70%, rgba(245,165,36,.35), transparent), #04110E',
  'radial-gradient(circle 380px at 50% 50%, rgba(0,208,156,.45), transparent), radial-gradient(circle 300px at 100% 0%, rgba(96,104,220,.45), transparent), #04110E',
  'radial-gradient(circle 420px at 50% 100%, rgba(0,208,156,.6), transparent), #04110E',
];

function Big({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const v = useCountUp(value, 1100);
  return <span className="story-big">{decimals ? v.toFixed(decimals) : Math.round(v)}</span>;
}

export default function Recap() {
  const { state, toast } = useStore();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const prog = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const hidden = state.settings.hideAmounts;

  const rw = runway(state);
  const weekAgo = localDay(new Date(Date.now() - 7 * 86400000));
  const base = state.snapshots.find((s) => s.day >= weekAgo);
  const savedDelta = base ? state.snapshots[state.snapshots.length - 1].saved - base.saved : 0;
  const dots = landings(state);
  const resolvedTips = state.tips.filter((t) => t.parked).map((t) => tipOutcome(t)).filter((o) => o.resolved);
  const dodged = resolvedTips.filter((o) => o.halted || o.after90 < 0).length;
  const tw = twin(state);
  const g = circleGoal(state);
  const earned = STICKERS.filter((s) => state.stickers.includes(s.id));
  const weekSpends = state.spends.filter((s) => new Date(s.at).getTime() >= Date.now() - 7 * 86400000);
  const weekChillar = weekSpends.reduce((a, s) => a + s.roundup, 0);
  const weekMoods = state.moods.filter((m) => m.day >= weekAgo).map((m) => m.mood);

  const slides: { key: string; body: ReactNode }[] = useMemo(() => [
    {
      key: 'hi',
      body: (
        <>
          <span className="eye">Your week in money · {fmtDay(new Date(Date.now() - 6 * 86400000).toISOString())} – {fmtDay(new Date().toISOString())}</span>
          <h1 className="h1" style={{ fontSize: 52, lineHeight: 1 }}>Hi {state.name}.</h1>
          <p className="body" style={{ fontSize: 18 }}>Eight things that happened with your money. No judgement, just the facts. Tap to go on.</p>
        </>
      ),
    },
    {
      key: 'runway',
      body: (
        <>
          <span className="eye">Runway</span>
          <Big value={rw.value} decimals={rw.unit === 'days' ? 0 : 1} />
          <h2 className="h1" style={{ fontSize: 30 }}>{rw.unit} you could live on savings alone.</h2>
          <p className="body">
            {savedDelta > 0 ? `You added ${hidden ? 'to your pots' : rupees(savedDelta)} this week. That’s freedom you bought.` : savedDelta < 0 ? 'A little went out this week. That’s what pots are for.' : 'Your first week here. This is your baseline; next week we compare.'}
          </p>
        </>
      ),
    },
    {
      key: 'showed',
      body: dots.length ? (
        <>
          <span className="eye">Showed up</span>
          <Big value={dots.filter(Boolean).length} />
          <h2 className="h1" style={{ fontSize: 30 }}>of your last {dots.length} landings went in.</h2>
          <Dots values={dots} size={18} />
          <p className="body">A skip is a decision, not a broken streak.</p>
        </>
      ) : (
        <>
          <span className="eye">Showed up</span>
          <h2 className="h1" style={{ fontSize: 36 }}>No landings yet.</h2>
          <p className="body">Turn on Invest what lands and every credit, any date, quietly counts.</p>
        </>
      ),
    },
    {
      key: 'tips',
      body: (
        <>
          <span className="eye">Tip Graveyard</span>
          <Big value={dodged} />
          <h2 className="h1" style={{ fontSize: 30 }}>tips you checked went lower after 90 days.</h2>
          <p className="body">{dodged ? 'You parked them instead of chasing them. That’s the whole skill.' : 'Nothing has reached 90 days yet. Park the next one you see.'}</p>
        </>
      ),
    },
    {
      key: 'jar',
      body: (
        <>
          <span className="eye">Chillar Jar</span>
          <Big value={weekSpends.length} />
          <h2 className="h1" style={{ fontSize: 30 }}>UPI spends rounded up this week.</h2>
          <p className="body">{weekChillar > 0 ? `${hidden ? 'Spare change' : rupees(weekChillar)} of spare change went in the jar without you noticing.` : 'Turn on round-ups and your chai money starts compounding.'}</p>
        </>
      ),
    },
    {
      key: 'mood',
      body: (
        <>
          <span className="eye">Money mood</span>
          {weekMoods.length ? (
            <>
              <div className="row" style={{ gap: 6, color: '#F0F5F4' }}>
                {weekMoods.map((m, k) => <span key={k} style={{ width: 40, height: 40, display: 'inline-flex' }}><Face level={m} /></span>)}
              </div>
              <h2 className="h1" style={{ fontSize: 32 }}>Mostly {MOOD_LABEL[Math.round(weekMoods.reduce((a, b) => a + b, 0) / weekMoods.length) - 1].toLowerCase()} this week.</h2>
              <p className="body">Feelings are data. Calm usually follows runway.</p>
            </>
          ) : (
            <>
              <h2 className="h1" style={{ fontSize: 36 }}>No check-ins yet.</h2>
              <p className="body">Ten seconds on Home, once a day. Next week you’ll see a pattern.</p>
            </>
          )}
        </>
      ),
    },
    {
      key: 'twin',
      body: (
        <>
          <span className="eye">Lazy Twin</span>
          <h2 className="h1" style={{ fontSize: 40, lineHeight: 1.05 }}>
            {tw.gap > 0 ? `Your twin is ${hidden ? 'ahead' : `${rupees(tw.gap)} ahead`}.` : tw.gap < 0 ? 'You’re ahead of your twin.' : 'You and your twin are level.'}
          </h2>
          <p className="body">{tw.gap > 0 ? 'They did nothing. Doing less is a strategy.' : 'Every move you made paid off. Rare. Don’t get cocky.'}</p>
        </>
      ),
    },
    {
      key: 'circle',
      body: (
        <>
          <span className="eye">{state.circle.name}</span>
          <Big value={g.pct} />
          <h2 className="h1" style={{ fontSize: 30 }}>percent of the way to {state.circle.goal.name.replace(/,.*/, '')}.</h2>
          <p className="body">Together, without anyone seeing anyone’s amounts.</p>
        </>
      ),
    },
    {
      key: 'stickers',
      body: (
        <>
          <span className="eye">Stickers</span>
          <Big value={earned.length} />
          <h2 className="h1" style={{ fontSize: 30 }}>of {STICKERS.length} habits, unlocked.</h2>
          <div className="row wrap" style={{ gap: 8 }}>
            {earned.map((s, k) => (
              <span key={s.id} className="chip" style={{ background: 'rgba(255,255,255,.12)', color: '#F0F5F4', border: 0, transform: `rotate(${k % 2 ? 3 : -3}deg)` }}><Icon name={s.icon} small />{s.name}</span>
            ))}
          </div>
        </>
      ),
    },
    {
      key: 'end',
      body: (
        <>
          <span className="eye">That’s the week</span>
          <h1 className="h1" style={{ fontSize: 46, lineHeight: 1.02 }}>Boring money, exciting life.</h1>
          <p className="body">Share your week. Only habits go out, never amounts.</p>
        </>
      ),
    },
  ], [state, rw.value, rw.unit, savedDelta, hidden, dots, dodged, tw.gap, g.pct, earned, weekSpends.length, weekChillar, weekMoods]);

  const last = slides.length - 1;
  const go = (n: number) => {
    if (n < 0) return;
    if (n > last) { router.push('/'); return; }
    prog.current = 0;
    setI(n);
    setProgress(0);
    buzz(5);
  };

  useEffect(() => { box.current?.focus(); }, []);

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = now - prev;
      prev = now;
      if (!paused.current && i < last) {
        prog.current += dt / DURATION;
        if (prog.current >= 1) {
          prog.current = 0;
          setProgress(0);
          setI((x) => Math.min(last, x + 1));
          return;
        }
        setProgress(prog.current);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [i, last]);

  const share = async () => {
    const text = `My week on Groww: ${rw.display} ${rw.unit} of runway, ${dots.filter(Boolean).length}/${dots.length || 8} landings invested, ${earned.length} habit stickers. No amounts, just habits.`;
    try {
      if (navigator.share) await navigator.share({ title: 'My week in money', text });
      else { await navigator.clipboard.writeText(text); toast('Copied. Paste it anywhere.'); }
    } catch { /* cancelled */ }
  };

  return (
    <div
      className="story"
      ref={box}
      tabIndex={-1}
      role="region"
      aria-roledescription="story"
      aria-label={`Your week, slide ${i + 1} of ${slides.length}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(i + 1);
        if (e.key === 'ArrowLeft') go(i - 1);
        if (e.key === 'Escape') router.push('/');
      }}
    >
      <div className="story-in">
        <div className="story-bg" style={{ background: BG[i % BG.length] }} />
        <div className="story-bars" aria-hidden="true">
          {slides.map((s, k) => (
            <span key={s.key}><i style={{ width: `${k < i ? 100 : k === i ? (i === last ? 100 : progress * 100) : 0}%` }} /></span>
          ))}
        </div>
        <div className="row sp" style={{ position: 'relative', zIndex: 3, marginTop: 12 }}>
          <span className="row" style={{ gap: 8 }}><span className="lp" style={{ width: 28, height: 28, fontSize: 15, borderRadius: 8, borderColor: '#F0F5F4', background: 'transparent', color: '#F0F5F4' }}>L</span><span className="eye" style={{ color: 'rgba(240,245,244,.8)' }}>Your week</span></span>
          <button className="av" style={{ background: 'rgba(255,255,255,.12)', border: 0, color: '#F0F5F4' }} aria-label="Close" onClick={() => router.push('/')}><Icon name="close" /></button>
        </div>

        <div
          className="story-tap"
          onPointerDown={() => { paused.current = true; }}
          onPointerUp={() => { paused.current = false; }}
          onPointerLeave={() => { paused.current = false; }}
        >
          <button aria-label="Previous" onClick={() => go(i - 1)} />
          <button aria-label="Next" onClick={() => go(i + 1)} style={{ flex: 2 }} />
        </div>

        <div className="story-body" key={slides[i].key} aria-live="polite">{slides[i].body}</div>

        <div className="story-foot">
          {i === last ? (
            <>
              <button className="btn" onClick={share}><Icon name="share" />Share my week</button>
              <button className="ghost" onClick={() => router.push('/')}>Back home</button>
            </>
          ) : (
            <p className="cap center" style={{ color: 'rgba(240,245,244,.6)' }}>Tap right for next · hold to pause</p>
          )}
        </div>
      </div>
    </div>
  );
}
