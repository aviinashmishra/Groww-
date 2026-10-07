import type { State } from './types';
import type { IconName } from '@/components/Icon';
import { landings, runway } from './logic';

export interface Sticker {
  id: string;
  name: string;
  /** What earning it says about you. */
  blurb: string;
  /** How to earn it, shown while locked. */
  hint: string;
  icon: IconName;
  hue: 'acc' | 'amb' | 'ind' | 'pink';
  earned: (s: State) => boolean;
}

/** Stickers reward good habits, never streaks. Nothing is ever taken away. */
export const STICKERS: Sticker[] = [
  { id: 'held', name: 'Held the line', blurb: 'You sat through March 2020 and didn’t flinch.', hint: 'Hold through the Crash Simulator', icon: 'shield', hue: 'acc', earned: (s) => s.crash.held === true },
  { id: 'halfway', name: 'Halfway free', blurb: 'Your runway is past halfway to your goal.', hint: 'Get your runway to half your goal', icon: 'bolt', hue: 'acc', earned: (s) => runway(s).fill >= 0.5 },
  { id: 'pot-full', name: 'Pot filled', blurb: 'A goal pot hit its target. Treat yourself, from that pot.', hint: 'Fill any pot to its target', icon: 'check', hue: 'acc', earned: (s) => s.pots.some((p) => p.target > 0 && p.balance >= p.target) },
  { id: 'showed-up', name: 'Showed up', blurb: 'Six of your last eight landings went in.', hint: 'Invest 6 of 8 landings', icon: 'lands', hue: 'ind', earned: (s) => landings(s).filter(Boolean).length >= 6 },
  { id: 'tip-checker', name: 'Checked, not chased', blurb: 'You parked a tip instead of buying it.', hint: 'Check a tip and park it', icon: 'tip', hue: 'amb', earned: (s) => s.tips.some((t) => t.mine && t.parked) },
  { id: 'twin-tamer', name: 'Twin tamer', blurb: 'You gave yourself 24 hours before selling.', hint: 'Turn on the pause before selling', icon: 'twin', hue: 'ind', earned: (s) => s.twin.pauseBeforeSell },
  { id: 'lifafa', name: 'Lifafa that grows', blurb: 'You sent a shagun that compounds.', hint: 'Share a shagun card', icon: 'gift', hue: 'amb', earned: (s) => s.shaguns.some((x) => x.shared) },
  { id: 'team', name: 'Team player', blurb: 'You chipped in to a shared goal.', hint: 'Add your share to a circle goal', icon: 'circles', hue: 'ind', earned: (s) => s.circle.members.some((m) => m.isYou && m.share > 9300) },
  { id: 'odds', name: 'Knows the odds', blurb: 'You passed the F&O odds quiz.', hint: 'Pass the odds quiz in the Fun Pot', icon: 'fork', hue: 'amb', earned: (s) => s.fun.quizPassed },
  { id: 'chillar', name: 'Chillar champ', blurb: 'You swept spare change into an index fund.', hint: 'Sweep your Chillar Jar into a pot', icon: 'jar', hue: 'amb', earned: (s) => s.jar.swept > 0 },
  { id: 'worth', name: 'Slept on it', blurb: 'You chose saving or skipping over an impulse buy.', hint: 'Save for or drop a Worth it? wish', icon: 'scale', hue: 'pink', earned: (s) => s.wishes.some((w) => w.status === 'dropped' || w.status === 'saving') },
  { id: 'split', name: 'Paid yourself first', blurb: 'You split a salary into pots before spending it.', hint: 'Split a month’s income into pots', icon: 'sliders', hue: 'acc', earned: (s) => !!s.lastSplitMonth },
];

export function earnedIds(s: State): string[] {
  return STICKERS.filter((x) => x.earned(s)).map((x) => x.id);
}
