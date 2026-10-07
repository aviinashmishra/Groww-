import type { Language, PersonaId } from './types';

type Dict = {
  nav: { home: string; lands: string; tips: string; circles: string; profile: string };
  headline: Record<PersonaId, string>;
  runway: string;
  pots: string;
};

export const DICT: Record<Language, Dict> = {
  en: {
    nav: { home: 'Home', lands: 'Invest what lands', tips: 'Tip Check', circles: 'Circles', profile: 'Profile' },
    headline: {
      salary: "First salary?\nLet's split it.",
      student: 'Pocket money in?\nEven ₹100 counts.',
      irregular: 'Money came in?\nPark a slice.',
    },
    runway: 'Runway',
    pots: 'Goal pots',
  },
  hinglish: {
    nav: { home: 'Home', lands: 'Invest what lands', tips: 'Tip Check', circles: 'Circles', profile: 'Profile' },
    headline: {
      salary: "Pehli salary?\nLet's split it.",
      student: 'Pocket money aaya?\nEven ₹100 counts.',
      irregular: 'Kuch aaya?\nPark a slice.',
    },
    runway: 'Runway',
    pots: 'Goal pots',
  },
  hi: {
    nav: { home: 'होम', lands: 'जो आए, उसमें से निवेश', tips: 'टिप जाँच', circles: 'सर्कल', profile: 'प्रोफ़ाइल' },
    headline: {
      salary: 'पहली सैलरी?\nचलो बाँटें।',
      student: 'पॉकेट मनी आई?\n₹100 भी गिना जाता है।',
      irregular: 'कुछ आया?\nएक हिस्सा अलग रखो।',
    },
    runway: 'रनवे',
    pots: 'लक्ष्य पॉट',
  },
  mr: {
    nav: { home: 'होम', lands: 'जे येईल त्यातून गुंतवणूक', tips: 'टिप तपासा', circles: 'सर्कल', profile: 'प्रोफाइल' },
    headline: {
      salary: 'पहिला पगार?\nचला, वाटून घेऊ.',
      student: 'पॉकेट मनी आली?\n₹100 सुद्धा मोजले जातात.',
      irregular: 'काही आलं?\nएक भाग बाजूला ठेवा.',
    },
    runway: 'रनवे',
    pots: 'ध्येय पॉट',
  },
};

export const LANG_ATTR: Record<Language, string> = { en: 'en-IN', hinglish: 'en-IN', hi: 'hi', mr: 'mr' };
