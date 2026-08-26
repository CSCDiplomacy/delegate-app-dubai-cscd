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

// Scholarship Holders page (2026-08-27, results announcement phase). Full
// names as recorded in delegates.name (Supabase), matching the client's
// evaluation workbook exactly — see app_brain/Dubai Fork Progress.md for the
// full reconciliation. This is a fixed, one-time roster (not derived live
// from the delegate's own session), so it's hardcoded here rather than
// wired through the data/*.json + API pipeline that Rundown/Visits/etc use
// for content that's still being actively published — same precedent as
// THEMES/EXPERIENCE/EDITIONS above.
//
// Nationality added 2026-08-27, pulled from the applicant workbook's "All
// data 22" sheet (Nationality column, matched by exact normalised name
// against "Full Name (as per passport)"), cross-checked against "All Data
// 12". Source rows were a mix of demonym adjectives and country nouns
// ("American"/"Ghanaian" vs "Ghana"/"Kazakhstan") — normalised to plain
// country names here so the roster reads consistently. Self-reported by the
// applicant, not otherwise verified.
export interface ScholarshipHolder {
  name: string;
  nationality: string;
}

export const FULLY_FUNDED: ScholarshipHolder[] = [
  { name: 'Aiaru Abzikir', nationality: 'Kazakhstan' },
  { name: 'Hanaa Haleem', nationality: 'United States' },
  { name: 'Husam Yaqoob Hashim Al Balushi', nationality: 'Oman' },
  { name: 'Ian Emiliano Rivera Cruz', nationality: 'Mexico' },
  { name: 'Marianne Ziad Al Halabi', nationality: 'Lebanon' },
  { name: 'Mugahid Abualgasim Musa Elnour', nationality: 'Sudan' },
  { name: 'Naisha Aree', nationality: 'Thailand' },
  { name: 'Nayana Chandran', nationality: 'India' },
  { name: 'Renee Naomi Odle', nationality: 'Barbados' },
  { name: 'Saha Rathor', nationality: 'Pakistan' },
];

export const PARTIALLY_FUNDED: ScholarshipHolder[] = [
  { name: 'Acheampong Samuel Agyei', nationality: 'Ghana' },
  { name: 'Akash Kumar', nationality: 'Pakistan' },
  { name: 'Amanda Da Silva Martins', nationality: 'Brazil' },
  { name: 'Arjun Vij', nationality: 'India' },
  { name: 'Ceyda Gursel', nationality: 'Serbia' },
  { name: 'Devi Krishna H', nationality: 'United Arab Emirates' },
  { name: 'Ege Dolu', nationality: 'Türkiye' },
  { name: 'Eman Ahmed Kidwai', nationality: 'Pakistan' },
  { name: 'Farah Kharrat', nationality: 'Tunisia' },
  { name: 'Gerald Tahiri', nationality: 'Albania' },
  { name: 'Goh Chen How, Calvin', nationality: 'Singapore' },
  { name: 'Himanshi Gulia', nationality: 'India' },
  { name: 'Indira Tabaeva', nationality: 'Kyrgyzstan' },
  { name: 'Khalid Ibnelbachyr', nationality: 'France' },
  { name: 'Lê Bình Minh', nationality: 'Vietnam' },
  { name: 'Mahreen Adil', nationality: 'Pakistan' },
  { name: 'Mahsati Mehdiyeva', nationality: 'Azerbaijan' },
  { name: 'Mariama Jawneh', nationality: 'Gambia' },
  { name: 'Mercy Mabiza', nationality: 'Zimbabwe' },
  { name: 'Naba Ali', nationality: 'India' },
  { name: 'Nomin Azjargal', nationality: 'Mongolia' },
  { name: 'Noor Ul Ain', nationality: 'Pakistan' },
  { name: 'Nuttha Teanpitak', nationality: 'Thailand' },
  { name: 'Nyame Ishmael Bonsu', nationality: 'Ghana' },
  { name: 'Rishabh Sikarwal', nationality: 'India' },
  { name: 'Sambhav Jain', nationality: 'India' },
  { name: 'Sami Fahd Bakr Baghdadi', nationality: 'United Kingdom' },
  { name: 'Shruti Hans', nationality: 'India' },
  { name: 'Steffi Abhishek Kamble', nationality: 'India' },
  { name: 'Tatiana Zvenigorodskaia', nationality: 'Russia' },
];
