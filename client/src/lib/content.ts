// Static summit content, lifted from the YPDS Jakarta 2026 landing page so the
// portal tells the same story. Marketing copy, safe to hardcode.

export const SUMMIT = {
  edition: 'YPDS Jakarta 2026',
  dates: 'August 20–23, 2026',
  location: 'Jakarta, Indonesia',
  tagline: 'Convergence of Power',
  intro:
    'Following successful editions of the Young Public Diplomacy Summit in Baku, Istanbul, and Tashkent, the summit continues to expand as a platform for engaging young leaders in international dialogue and diplomacy.',
  rationale:
    'Jakarta, as the capital of Indonesia, is a key center of diplomacy, governance, and international cooperation, home to embassies, policy institutions, and academic centers. Its strategic position at the heart of Southeast Asia makes it an ideal setting for discussions on public diplomacy and global engagement.',
  participants:
    'Emerging youth leaders, university students, and young professionals (ages 16–40), representing regions across Asia, Europe, Africa, and the Middle East.',
};

export const THEMES: Array<{ numeral: string; title: string; blurb: string }> = [
  {
    numeral: 'I',
    title: 'Public Diplomacy in the 21st Century',
    blurb: 'Understanding the intersection of culture and governance.',
  },
  {
    numeral: 'II',
    title: 'Asia and the Mediterranean',
    blurb: 'Past, present & future, regional cooperation and strategic opportunities.',
  },
  {
    numeral: 'III',
    title: 'Peace by Peaceful Means',
    blurb: 'Youth roles in conflict resolution and diplomacy.',
  },
  {
    numeral: 'IV',
    title: 'Soft, Smart, and Hard Power',
    blurb: 'Analyzing the tools of influence in international relations.',
  },
  {
    numeral: 'V',
    title: 'Strategic Communication',
    blurb: 'Techniques for effective advocacy, public diplomacy, and media engagement.',
  },
  {
    numeral: 'VI',
    title: 'Grand Strategy vs Economic Strategy',
    blurb: 'Balancing national interests, regional cooperation, and global challenges.',
  },
];

export const EXPERIENCE: string[] = [
  'Exclusive venue hosting inside a prominent policy institution.',
  'Curated cultural excursions including historic Jakarta and its iconic landmarks.',
  'Authentic Indonesian culinary experiences and networking dinners.',
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
  { city: 'Jakarta', year: '2026', note: 'Convergence of Power', current: true },
];
