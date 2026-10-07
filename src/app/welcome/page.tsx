'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { PERSONAS } from '@/lib/data';
import type { PersonaId } from '@/lib/types';

const ICONS: Record<PersonaId, IconName> = { salary: 'calendar', student: 'coin', irregular: 'lands' };

export default function Welcome() {
  const { state, reset } = useStore();
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaId>(state.persona);
  const [name, setName] = useState(state.onboarded ? state.name : '');

  const start = (to: string) => {
    reset(persona, name, true);
    router.push(to);
  };

  return (
    <Screen orbs="a" nav={false}>
      <div className="row" style={{ gap: 10 }}>
        <div className="lp">L</div>
        <span className="eye">Welcome</span>
      </div>

      <div className="col" style={{ gap: 10, marginTop: 20 }}>
        <h1 className="h1" style={{ fontSize: 38, lineHeight: 1.08 }}>Money, minus the panic.</h1>
        <p className="body" style={{ fontSize: 16 }}>Tell us how money reaches you. The app shapes itself around it.</p>
      </div>

      <section className="glass col" style={{ gap: 12 }}>
        <div className="col" style={{ gap: 8 }}>
          <label htmlFor="name" className="eye" style={{ padding: '0 4px' }}>What should we call you?</label>
          <div className="field">
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={PERSONAS[persona].defaultName} autoComplete="given-name" maxLength={24} />
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

      <p className="cap">This is a working demo. It starts with sample pots for the profile you pick, and everything you do is saved on this device only.</p>

      <div className="foot nonav">
        <button className="btn" onClick={() => start('/crash')}>
          <Icon name="play" />Start with the Crash Simulator
        </button>
        <button className="ghost" onClick={() => start('/')}>Skip to home</button>
      </div>
    </Screen>
  );
}
