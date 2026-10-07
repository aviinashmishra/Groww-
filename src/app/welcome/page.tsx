'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen, AmountField } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { PERSONAS } from '@/lib/data';
import { parseAmount, rupees } from '@/lib/format';
import type { PersonaId } from '@/lib/types';

const ICONS: Record<PersonaId, IconName> = { salary: 'calendar', student: 'coin', irregular: 'lands' };

export default function Welcome() {
  const { state, reset } = useStore();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [persona, setPersona] = useState<PersonaId>(state.persona);
  const [name, setName] = useState(state.onboarded ? state.name : '');
  const [mode, setMode] = useState<'own' | 'sample'>('own');
  const p = PERSONAS[persona];
  const [income, setIncome] = useState('');
  const [spend, setSpend] = useState('');
  const [savings, setSavings] = useState('');
  const inc = parseAmount(income);
  const sp = parseAmount(spend);
  const sv = parseAmount(savings);
  const ownReady = sp > 0 && inc >= 0;
  const preview = sp > 0 ? sv / sp : 0;

  const start = (to: string) => {
    reset(persona, name, true, mode === 'own' ? { income: inc, spend: sp, savings: sv } : undefined);
    router.push(to);
  };

  return (
    <Screen orbs="a" nav={false}>
      <div className="row" style={{ gap: 10 }}>
        <div className="lp" />
        <span className="eye">Welcome · step {step} of 2</span>
      </div>
      <div className="steps" aria-hidden="true"><i className="on" /><i className={step === 2 ? 'on' : ''} /></div>

      {step === 1 ? (
        <>
          <div className="col" style={{ gap: 10, marginTop: 14 }}>
            <h1 className="h1" style={{ fontSize: 38, lineHeight: 1.06 }}>Money, minus the panic.</h1>
            <p className="body" style={{ fontSize: 16 }}>Tell us how money reaches you. The app shapes itself around you, not the other way round.</p>
          </div>

          <section className="glass col" style={{ gap: 12 }}>
            <div className="col" style={{ gap: 8 }}>
              <label htmlFor="name" className="eye" style={{ padding: '0 4px' }}>What should we call you?</label>
              <div className="field">
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" maxLength={24} />
              </div>
            </div>
            <fieldset className="col" style={{ gap: 8, border: 0, margin: 0, padding: 0 }}>
              <legend className="eye" style={{ padding: '0 4px', marginBottom: 8 }}>Money reaches me as</legend>
              {(Object.keys(PERSONAS) as PersonaId[]).map((id) => (
                <button key={id} type="button" className={`plate row${persona === id ? ' you' : ''}`} aria-pressed={persona === id} onClick={() => setPersona(id)}>
                  <div className={`ico${persona === id ? '' : ' n'}`}><Icon name={ICONS[id]} /></div>
                  <span className="col grow">
                    <span className="med">{PERSONAS[id].label}</span>
                    <span className="cap">{PERSONAS[id].blurb}</span>
                  </span>
                  {persona === id && <Icon name="check" style={{ color: 'var(--acc-ink)' }} />}
                </button>
              ))}
            </fieldset>
          </section>

          <div className="foot nonav">
            <button className="btn" disabled={!name.trim()} onClick={() => setStep(2)}>
              {name.trim() ? `Nice to meet you, ${name.trim().split(' ')[0]}` : 'Tell us your name'}<Icon name="arrowR" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="col" style={{ gap: 8, marginTop: 14 }}>
            <h1 className="h1" style={{ fontSize: 34, lineHeight: 1.08 }}>Your numbers, {name.trim().split(' ')[0]}.</h1>
            <p className="body">Three rough numbers make everything about you. They stay on this phone; nobody else sees them.</p>
          </div>

          <div className="seg" role="group" aria-label="Start with">
            <button aria-pressed={mode === 'own'} onClick={() => setMode('own')}>My own numbers</button>
            <button aria-pressed={mode === 'sample'} onClick={() => setMode('sample')}>Sample data</button>
          </div>

          {mode === 'own' ? (
            <section className="glass col" style={{ gap: 12 }}>
              <AmountField id="w-income" label={persona === 'student' ? 'Pocket money a month' : persona === 'irregular' ? 'Roughly earned a month' : 'Monthly salary, in hand'} value={income} onChange={setIncome} />
              <AmountField id="w-spend" label="A month costs me" value={spend} onChange={setSpend} />
              <AmountField id="w-save" label="Saved so far (all of it)" value={savings} onChange={setSavings} />
              {sp > 0 && (
                <div className="plate row sp">
                  <span className="cap ink2">Your runway today</span>
                  <span className="amt accx">
                    {p.runwayUnit === 'days' ? `${Math.round(preview * 30)} days` : `${(Math.round(preview * 10) / 10).toFixed(1)} months`}
                  </span>
                </div>
              )}
              <p className="cap">Your savings go into a Never touch pot. You can rename pots, add more, and change any number later in Profile.</p>
            </section>
          ) : (
            <section className="glass col" style={{ gap: 8 }}>
              <div className="row"><div className="ico"><Icon name="spark" /></div><p className="body grow ink">Explore with {p.label.toLowerCase()} sample data: {rupees(p.pots.reduce((a, x) => a + x.balance, 0))} in pots, a year of history, tips and picks.</p></div>
              <p className="cap">Switch to your own numbers any time in Profile → Settings.</p>
            </section>
          )}

          <div className="foot nonav">
            <button className="btn" disabled={mode === 'own' && !ownReady} onClick={() => start('/crash')}>
              <Icon name="play" />Start with the Crash Simulator
            </button>
            <button className="ghost" disabled={mode === 'own' && !ownReady} onClick={() => start('/')}>Skip to home</button>
            <button className="ghost" onClick={() => setStep(1)}><Icon name="back" small />Back</button>
          </div>
        </>
      )}
    </Screen>
  );
}
