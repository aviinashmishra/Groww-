'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen, TopBar, Sheet } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { SwipeConfirm } from '@/components/SwipeConfirm';
import { useStore } from '@/lib/store';
import { QUIZ } from '@/lib/data';
import { funValue, note } from '@/lib/logic';
import { fmtDate, rupees } from '@/lib/format';

const WAIT_DAYS = 7;
const STEP = 500;

export default function Unlock() {
  const { state, update, toast } = useStore();
  const router = useRouter();
  const [quizOpen, setQuizOpen] = useState(false);
  const fun = state.fun;
  const ceiling = Math.max(STEP, funValue(state).ceiling);

  const started = fun.coolingStartedAt ? new Date(fun.coolingStartedAt) : null;
  const endsAt = started ? new Date(started.getTime() + WAIT_DAYS * 86400000) : null;
  const daysIn = started ? Math.min(WAIT_DAYS, Math.floor((Date.now() - started.getTime()) / 86400000)) : 0;
  const cooled = !!endsAt && endsAt.getTime() <= Date.now();
  const ready = fun.quizPassed && cooled;

  const setLimit = (by: number) => update((d) => { d.fun.lossLimit = Math.min(ceiling, Math.max(STEP, d.fun.lossLimit + by)); });

  if (fun.foUnlocked) {
    return (
      <Screen orbs="a" nav={false}>
        <TopBar back="/fun" label="F&O" />
        <h1 className="h1" style={{ fontSize: 32 }}>F&amp;O is unlocked. The limit stays.</h1>
        <p className="body">Lose {rupees(fun.lossLimit)} in a month and it locks till the 1st. Losses come only from your Fun Pot.</p>
        <div className="foot nonav"><Link className="btn" href="/fun">Back to the Fun Pot</Link></div>
      </Screen>
    );
  }

  return (
    <Screen orbs="a" nav={false}>
      <TopBar back="/fun/odds" label="F&O unlock · 3 gates" />
      <div className="col" style={{ gap: 6 }}>
        <h1 className="h1" style={{ fontSize: 32 }}>Still in? Three gates, no shortcuts.</h1>
        <p className="body">Jaldi kya hai. The market will be there next week.</p>
      </div>

      <section className="glass col" style={{ gap: 8 }}>
        <button className="plate row" onClick={() => !fun.quizPassed && setQuizOpen(true)} aria-label={fun.quizPassed ? 'Gate 1, odds quiz, passed' : 'Gate 1, take the odds quiz'}>
          <div className={`ico${fun.quizPassed ? '' : ' n'}`}><Icon name={fun.quizPassed ? 'check' : 'tip'} /></div>
          <div className="col grow"><span className="eye">Gate 1</span><span className="med">Odds quiz, {QUIZ.length} questions</span></div>
          <span className={`chip${fun.quizPassed ? ' acc' : ''}`}>{fun.quizPassed ? 'Passed' : 'Take it'}</span>
        </button>
        <div className="plate row">
          <div className={`ico${cooled ? '' : ' n'}`}><Icon name={cooled ? 'check' : 'clock'} /></div>
          <div className="col grow"><span className="eye">Gate 2</span><span className="med">{WAIT_DAYS}-day cooling-off</span></div>
          <span className={`chip${cooled ? ' acc' : ''}`}>{cooled ? 'Done' : started ? `Day ${daysIn + 1} of ${WAIT_DAYS}` : 'Not started'}</span>
        </div>
        <div className="plate col" style={{ gap: 10 }}>
          <div className="row">
            <div className="ico n"><Icon name="shield" /></div>
            <div className="col grow"><span className="eye">Gate 3</span><span className="med">Your hard loss limit</span></div>
          </div>
          <div className="row sp">
            <button className="av" aria-label="Lower limit" onClick={() => setLimit(-STEP)} disabled={fun.lossLimit <= STEP}><Icon name="minus" /></button>
            <div className="col" style={{ alignItems: 'center', gap: 2 }}>
              <span className="num" style={{ fontSize: 36 }} aria-live="polite">{rupees(fun.lossLimit)}</span>
              <span className="cap">most I can lose in a month</span>
            </div>
            <button className="av" aria-label="Raise limit" onClick={() => setLimit(STEP)} disabled={fun.lossLimit >= ceiling}><Icon name="plus" /></button>
          </div>
        </div>
      </section>

      <p className="cap">Hit the limit and F&amp;O locks till the 1st. Losses come only from your Fun Pot, never from your goal pots.</p>

      <div className="foot nonav">
        {ready ? (
          <SwipeConfirm
            warn
            label={`Slide to unlock with a ${rupees(fun.lossLimit)} limit`}
            icon="lock"
            onConfirm={() => {
              update((d) => { d.fun.foUnlocked = true; note(d, 'F&O unlocked', `Your loss limit is ${rupees(d.fun.lossLimit)} a month.`, '/fun'); });
              toast('Level 3 · F&O');
              router.push('/profile');
            }}
          />
        ) : started ? (
          <button className="btn" disabled>Unlocks {fmtDate(endsAt!.toISOString())}{fun.quizPassed ? '' : ', after the quiz'}</button>
        ) : (
          <button
            className="btn"
            onClick={() => {
              update((d) => { d.fun.coolingStartedAt = new Date().toISOString(); note(d, 'Cooling-off started', `Seven days. We’ll tell you when it’s done.`, '/fun/unlock'); });
              toast('The 7-day wait has started');
            }}
          >
            Start the {WAIT_DAYS}-day wait
          </button>
        )}
        <Link className="ghost" href="/fun">Not now</Link>
      </div>

      {quizOpen && <Quiz onClose={() => setQuizOpen(false)} />}
    </Screen>
  );
}

function Quiz({ onClose }: { onClose: () => void }) {
  const { update, toast } = useStore();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const q = QUIZ[i];
  const passed = score >= QUIZ.length - 1;

  const next = () => {
    const s = score + (picked === q.right ? 1 : 0);
    setScore(s);
    setPicked(null);
    if (i + 1 < QUIZ.length) setI(i + 1);
    else {
      setDone(true);
      if (s >= QUIZ.length - 1) {
        update((d) => { d.fun.quizPassed = true; });
        toast('Gate 1 passed');
      }
    }
  };

  return (
    <Sheet open onClose={onClose} label="Odds quiz">
      {done ? (
        <>
          <span className="eye">Odds quiz</span>
          <h2 className="h1" style={{ fontSize: 30 }}>{passed ? `${score} of ${QUIZ.length}. Gate 1 open.` : `${score} of ${QUIZ.length}. Not yet.`}</h2>
          <p className="body">{passed ? 'You know the odds. The cooling-off is next.' : `You need ${QUIZ.length - 1} right. Try again whenever you like.`}</p>
          <button className="btn" onClick={onClose}>{passed ? 'Continue' : 'Close'}</button>
        </>
      ) : (
        <>
          <div className="row sp"><span className="eye">Question {i + 1} of {QUIZ.length}</span><span className="cap">{score} right so far</span></div>
          <div className="bar"><i style={{ width: `${(i / QUIZ.length) * 100}%` }} /></div>
          <h2 className="h2" style={{ fontSize: 20 }}>{q.q}</h2>
          <div className="col" style={{ gap: 8 }}>
            {q.a.map((a, k) => {
              const cls = picked === null ? '' : k === q.right ? ' right' : k === picked ? ' wrong' : '';
              return (
                <button key={k} className={`quiz-opt${cls}`} aria-pressed={picked === k} disabled={picked !== null} onClick={() => setPicked(k)}>
                  <span className="grow">{a}</span>
                  {picked !== null && k === q.right && <Icon name="check" style={{ color: 'var(--acc-ink)' }} />}
                </button>
              );
            })}
          </div>
          <button className="btn" disabled={picked === null} onClick={next}>{i + 1 < QUIZ.length ? 'Next' : 'See result'}</button>
        </>
      )}
    </Sheet>
  );
}
