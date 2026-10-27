/**
 * English strings. English is the source of truth and is final.
 * Sinhala (si.ts) and Tamil (ta.ts) must have exactly the same keys;
 * the type checker enforces this.
 */
const en = {
  app: {
    name: 'Dumriya',
    unofficial: 'Unofficial',
    tagline: 'Unofficial train companion',
  },
  nav: {
    main: 'Main',
    search: 'Search',
    tickets: 'Tickets',
    reminders: 'Reminders',
    more: 'More',
  },
  common: {
    loading: 'Loading…',
    back: 'Back',
    comingSoon: 'This screen is being built.',
    offline: 'You are offline. Showing saved information.',
    preview: 'Preview',
    previewNote: 'Preview with simulated data. Not real-time information.',
    sampleData: 'Sample data – not official timetable',
    notFound: 'Page not found',
    goHome: 'Go to search',
    error: 'Something went wrong. Please try again.',
    retry: 'Try again',
    skipToContent: 'Skip to content',
  },
  screens: {
    home: 'Find a train',
    results: 'Trains',
    train: 'Train details',
    book: 'Before you book',
    tickets: 'My tickets',
    ticket: 'Ticket',
    refund: 'Refund calculator',
    dispute: 'Charged but no ticket',
    reminders: 'Reminders',
    stations: 'Stations',
    station: 'Station',
    board: 'Station board',
    live: 'Live train map',
    more: 'More',
    settings: 'Settings',
    about: 'About Dumriya',
  },
  settings: {
    language: 'Language',
    theme: 'Appearance',
    themeSystem: 'Match phone',
    themeLight: 'Light',
    themeDark: 'Dark',
  },
};

export default en;

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };
export type Messages = DeepString<typeof en>;
