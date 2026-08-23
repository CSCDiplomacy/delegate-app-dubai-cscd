// Static summit content, lifted from the Youth Strategic Forum, Dubai 2026
// marketing site so the portal tells the same story. Marketing copy, safe to
// hardcode.

export const SUMMIT = {
  edition: 'Youth Strategic Forum, Dubai 2026',
  dates: 'September 22–25, 2026',
  location: 'Dubai, United Arab Emirates',
  tagline: 'Convergence of Innovation',
  intro:
    'Four days in Dubai where emerging leaders and creatives from 50+ nations meet to shape what comes next. The Youth Strategic Forum explores technology, culture, creativity, and human connection, moving delegates between panel discussions, hands-on workshops, city innovation visits, and structured networking.',
  rationale:
    "Dubai is a global crossroads of culture, technology, and ambition: a city built on reinvention. Hosting the forum at the Mohammed Bin Rashid Library, designed in the shape of an open book and one of the Arab world's most iconic cultural landmarks, situates the conversation inside a living symbol of knowledge and strategic vision.",
  participants:
    'Emerging leaders, creators, innovators, and entrepreneurs from diverse backgrounds, representing more than 50 nations.',
};

export const THEMES: Array<{ numeral: string; title: string; blurb: string }> = [
  {
    numeral: 'I',
    title: 'Global Platform',
    blurb: 'Create an international, non-political platform for youth dialogue and collaboration.',
  },
  {
    numeral: 'II',
    title: 'Tech Meets Culture',
    blurb: 'Explore the intersection of technology, creativity, and contemporary culture.',
  },
  {
    numeral: 'III',
    title: 'Strategic Thinking',
    blurb: 'Encourage innovative and strategic thinking among young people.',
  },
  {
    numeral: 'IV',
    title: 'Cross-Cultural Exchange',
    blurb: 'Promote cross-cultural understanding through storytelling, art, media, and digital engagement.',
  },
  {
    numeral: 'V',
    title: 'Connect Leaders',
    blurb: 'Connect emerging leaders, creators, innovators, and entrepreneurs from diverse backgrounds.',
  },
  {
    numeral: 'VI',
    title: 'Future Vision',
    blurb: 'Inspire future-oriented perspectives on culture, technology, and society.',
  },
];

export const EXPERIENCE: string[] = [
  "Exclusive forum sessions inside the Mohammed Bin Rashid Library, one of the Arab world's most iconic cultural landmarks.",
  'A Dubai Marina dinner cruise and a desert safari under the stars.',
  'Skyline views and downtime at your Dubai hotel between sessions.',
];

export const EDITIONS: Array<{
  city: string;
  year: string;
  note: string;
  report?: string;
  current?: boolean;
}> = [
  {
    city: 'Baku',
    year: '2024',
    note: 'The Genesis of Dialogue',
    report: 'https://thecscd.org/events/ypds-baku-2024',
  },
  {
    city: 'Istanbul',
    year: '2024',
    note: 'Crossroads of Diplomacy',
    report: 'https://thecscd.org/events/ypds-istanbul-2024',
  },
  {
    city: 'Tashkent',
    year: '2025',
    note: 'Expanding Horizons',
    report: 'https://thecscd.org/events/ypds-tashkent',
  },
  { city: 'Jakarta', year: '2026', note: 'Convergence of Power' },
  { city: 'Dubai', year: '2026', note: 'Convergence of Innovation', current: true },
];
