import type { State } from './types';
import type { IconName } from '@/components/Icon';
import { GLOSSARY, PERSONAS } from './data';
import { monthKey, rupees } from './format';
import { potsTotal, runway } from './logic';

export interface Nudge {
  key: string;
  eyebrow: string;
  title: string;
  href: string;
  icon: IconName;
}

const COOL_MS = 48 * 3600000;

/** The single most useful thing to do right now, in priority order. */
export function forYou(s: State, now = new Date()): Nudge {
  const hide = s.settings.hideAmounts;
  const money = (n: number) => (hide ? 'money' : rupees(n));

  const pending = s.credits.find((c) => c.status === 'pending');
  if (pending) {
    return { key: 'pending', eyebrow: 'Landed', title: `${money(Math.round((pending.amount * pending.share) / 100))} goes in at 6 pm. Skip or keep?`, href: '/lands', icon: 'lands' };
  }

  const cooled = s.wishes.find((w) => w.status === 'cooling' && now.getTime() - new Date(w.at).getTime() >= COOL_MS);
  if (cooled) return { key: 'wish', eyebrow: '48 hours later', title: `Still want the ${cooled.name}?`, href: '/worth', icon: 'scale' };

  if (s.twin.sleepUntil && new Date(s.twin.sleepUntil).getTime() <= now.getTime()) {
    return { key: 'sleep', eyebrow: 'You slept on it', title: 'Still want to sell? Decide with a clear head.', href: '/pots/never', icon: 'moon' };
  }

  if (s.crash.held !== true) return { key: 'crash', eyebrow: 'Learner’s licence', title: 'Survive a fake crash. 90 seconds, play money.', href: '/crash', icon: 'shield' };

  if (s.persona === 'salary' && s.lastSplitMonth !== monthKey(now)) {
    return { key: 'split', eyebrow: 'Pay yourself first', title: `Split this month’s ${money(s.monthlyIncome)} before it splits itself.`, href: '/split', icon: 'sliders' };
  }

  if (s.jar.balance >= 100) return { key: 'jar', eyebrow: 'Chillar Jar', title: `${money(Math.floor(s.jar.balance))} of spare change is ready to sweep.`, href: '/jar', icon: 'jar' };

  const nearly = s.pots.find((p) => p.target > 0 && p.balance < p.target && p.balance / p.target >= 0.8);
  if (nearly) return { key: 'nearly', eyebrow: 'So close', title: `${money(nearly.target - nearly.balance)} more fills ${nearly.name}.`, href: `/pots/${nearly.id}`, icon: 'check' };

  const rw = runway(s);
  if (rw.fill < 1) {
    const p = PERSONAS[s.persona];
    const goalMonths = p.runwayUnit === 'days' ? p.runwayGoal / 30 : p.runwayGoal;
    const gap = Math.max(0, goalMonths * s.monthlySpend - potsTotal(s));
    const perMonth = Math.max(500, Math.ceil(gap / 12 / 500) * 500);
    return { key: 'runway', eyebrow: 'Your runway goal', title: `${money(perMonth)} a month reaches ${rw.goal} ${p.runwayUnit} of freedom within a year.`, href: '/pots/never', icon: 'bolt' };
  }

  const day = now.getFullYear() * 372 + now.getMonth() * 31 + now.getDate();
  const g = GLOSSARY[day % GLOSSARY.length];
  return { key: 'learn', eyebrow: 'Word of the day', title: `${g.term}: ${g.short}`, href: '/learn', icon: 'book' };
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
