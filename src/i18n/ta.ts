/**
 * Tamil strings.
 * TODO(review-ta): every string below is a draft translation and must be
 * reviewed by a native Tamil speaker. Remove the trailing TODO on each line
 * once it has been checked.
 */
import type { Messages } from './en';

const ta: Messages = {
  app: {
    name: 'Dumriya', // brand name, not translated
    unofficial: 'அதிகாரப்பூர்வமற்றது', // TODO(review-ta)
    tagline: 'அதிகாரப்பூர்வமற்ற ரயில் துணை', // TODO(review-ta)
  },
  nav: {
    main: 'முதன்மை', // TODO(review-ta)
    search: 'தேடல்', // TODO(review-ta)
    tickets: 'டிக்கெட்டுகள்', // TODO(review-ta)
    reminders: 'நினைவூட்டல்கள்', // TODO(review-ta)
    more: 'மேலும்', // TODO(review-ta)
  },
  common: {
    loading: 'ஏற்றுகிறது…', // TODO(review-ta)
    back: 'பின்செல்', // TODO(review-ta)
    comingSoon: 'இந்தத் திரை உருவாக்கப்படுகிறது.', // TODO(review-ta)
    offline: 'இணைய இணைப்பு இல்லை. சேமித்த தகவல்கள் காட்டப்படுகின்றன.', // TODO(review-ta)
    preview: 'முன்னோட்டம்', // TODO(review-ta)
    previewNote: 'உருவகப்படுத்தப்பட்ட தரவுடன் முன்னோட்டம். நேரடித் தகவல் அல்ல.', // TODO(review-ta)
    sampleData: 'மாதிரித் தரவு – அதிகாரப்பூர்வ கால அட்டவணை அல்ல', // TODO(review-ta)
    notFound: 'பக்கம் கிடைக்கவில்லை', // TODO(review-ta)
    goHome: 'தேடலுக்குச் செல்', // TODO(review-ta)
    error: 'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.', // TODO(review-ta)
    retry: 'மீண்டும் முயற்சி', // TODO(review-ta)
    skipToContent: 'உள்ளடக்கத்திற்குச் செல்', // TODO(review-ta)
    close: 'மூடு', // TODO(review-ta)
    notConfirmed: 'உறுதிப்படுத்தப்படவில்லை', // TODO(review-ta)
  },
  screens: {
    home: 'ரயிலைத் தேடுங்கள்', // TODO(review-ta)
    results: 'ரயில்கள்', // TODO(review-ta)
    train: 'ரயில் விவரங்கள்', // TODO(review-ta)
    book: 'முன்பதிவு செய்வதற்கு முன்', // TODO(review-ta)
    tickets: 'எனது டிக்கெட்டுகள்', // TODO(review-ta)
    ticket: 'டிக்கெட்', // TODO(review-ta)
    refund: 'பணத்திருப்பக் கணிப்பான்', // TODO(review-ta)
    dispute: 'பணம் கழிந்தது, டிக்கெட் இல்லை', // TODO(review-ta)
    reminders: 'நினைவூட்டல்கள்', // TODO(review-ta)
    stations: 'நிலையங்கள்', // TODO(review-ta)
    station: 'நிலையம்', // TODO(review-ta)
    board: 'நிலையப் பலகை', // TODO(review-ta)
    live: 'நேரடி ரயில் வரைபடம்', // TODO(review-ta)
    more: 'மேலும்', // TODO(review-ta)
    settings: 'அமைப்புகள்', // TODO(review-ta)
    about: 'Dumriya பற்றி', // TODO(review-ta)
  },
  settings: {
    language: 'மொழி', // TODO(review-ta)
    theme: 'தோற்றம்', // TODO(review-ta)
    themeSystem: 'தொலைபேசி அமைப்பின்படி', // TODO(review-ta)
    themeLight: 'வெளிர்', // TODO(review-ta)
    themeDark: 'இருண்ட', // TODO(review-ta)
  },
  format: {
    lkr: 'ரூ. {{amount}}', // TODO(review-ta)
    durationHm: '{{h}} மணி {{m}} நிமி', // TODO(review-ta)
    durationH: '{{h}} மணி', // TODO(review-ta)
    durationM: '{{m}} நிமி', // TODO(review-ta)
    plusDay_one: '+{{count}} நாள்', // TODO(review-ta)
    plusDay_other: '+{{count}} நாட்கள்', // TODO(review-ta)
    nextDay: 'அடுத்த நாள்', // TODO(review-ta)
    countdownDhm: '{{d}} நாள் {{h}} மணி {{m}} நிமி', // TODO(review-ta)
    date: '{{weekday}}, {{day}} {{month}} {{year}}', // TODO(review-ta)
    shortDate: '{{day}} {{month}}', // TODO(review-ta)
    months: {
      '1': 'ஜன.', // TODO(review-ta)
      '2': 'பிப்.', // TODO(review-ta)
      '3': 'மார்.', // TODO(review-ta)
      '4': 'ஏப்.', // TODO(review-ta)
      '5': 'மே', // TODO(review-ta)
      '6': 'ஜூன்', // TODO(review-ta)
      '7': 'ஜூலை', // TODO(review-ta)
      '8': 'ஆக.', // TODO(review-ta)
      '9': 'செப்.', // TODO(review-ta)
      '10': 'அக்.', // TODO(review-ta)
      '11': 'நவ.', // TODO(review-ta)
      '12': 'டிச.', // TODO(review-ta)
    },
    weekdays: {
      '0': 'ஞாயிறு', // TODO(review-ta)
      '1': 'திங்கள்', // TODO(review-ta)
      '2': 'செவ்வாய்', // TODO(review-ta)
      '3': 'புதன்', // TODO(review-ta)
      '4': 'வியாழன்', // TODO(review-ta)
      '5': 'வெள்ளி', // TODO(review-ta)
      '6': 'சனி', // TODO(review-ta)
    },
    weekdaysShort: {
      '0': 'ஞாயி.', // TODO(review-ta)
      '1': 'திங்.', // TODO(review-ta)
      '2': 'செவ்.', // TODO(review-ta)
      '3': 'புத.', // TODO(review-ta)
      '4': 'வியா.', // TODO(review-ta)
      '5': 'வெள்.', // TODO(review-ta)
      '6': 'சனி', // TODO(review-ta)
    },
  },
  home: {
    from: 'இருந்து', // TODO(review-ta)
    to: 'வரை', // TODO(review-ta)
    chooseStation: 'நிலையத்தைத் தேர்ந்தெடுக்கவும்', // TODO(review-ta)
    swap: 'புறப்படும், செல்லும் இடங்களை மாற்று', // TODO(review-ta)
    date: 'தேதி', // TODO(review-ta)
    time: 'இதற்குப் பின் புறப்படும்', // TODO(review-ta)
    timeHint: 'விருப்பத்தேர்வு. அன்றைய அனைத்து ரயில்களுக்கும் காலியாக விடவும்.', // TODO(review-ta)
    search: 'ரயில்களைத் தேடு', // TODO(review-ta)
    errorFrom: 'நீங்கள் புறப்படும் நிலையத்தைத் தேர்ந்தெடுக்கவும்.', // TODO(review-ta)
    errorTo: 'நீங்கள் செல்லும் நிலையத்தைத் தேர்ந்தெடுக்கவும்.', // TODO(review-ta)
    errorSame: 'புறப்படும் மற்றும் செல்லும் நிலையங்கள் வேறுபட வேண்டும்.', // TODO(review-ta)
    errorDate: 'சரியான தேதியைத் தேர்ந்தெடுக்கவும்.', // TODO(review-ta)
    recent: 'சமீபத்திய தேடல்கள்', // TODO(review-ta)
    clearRecent: 'சமீபத்திய தேடல்களை அழி', // TODO(review-ta)
    tools: 'கருவிகள்', // TODO(review-ta)
    toolTickets: 'எனது டிக்கெட்டுகள்', // TODO(review-ta)
    toolTicketsHint: 'உங்கள் மின்-டிக்கெட்டுகள், இணையம் இல்லாமலும்', // TODO(review-ta)
    toolRefund: 'பணத்திருப்பக் கணிப்பான்', // TODO(review-ta)
    toolRefundHint: 'ரத்து செய்தால் திரும்பக் கிடைப்பது', // TODO(review-ta)
    toolReminders: 'நினைவூட்டல்கள்', // TODO(review-ta)
    toolRemindersHint: 'முன்பதிவுக் காலங்கள், இறுதித் தேதிகள்', // TODO(review-ta)
    unofficialNote: 'Dumriya ஒரு அதிகாரப்பூர்வமற்ற செயலி. இது டிக்கெட்டுகளை விற்பதில்லை; அதிகாரப்பூர்வ இலங்கை ரயில்வே தளங்களில் முன்பதிவு செய்யுங்கள்.', // TODO(review-ta)
  },
  picker: {
    fromTitle: 'புறப்படும் இடம்', // TODO(review-ta)
    toTitle: 'செல்லும் இடம்', // TODO(review-ta)
    searchLabel: 'நிலையங்களைத் தேடு', // TODO(review-ta)
    searchHint: 'ஆங்கிலம், சிங்களம் அல்லது தமிழில் பெயரை, அல்லது நிலையக் குறியீட்டைத் தட்டச்சு செய்யவும்.', // TODO(review-ta)
    noResults: '“{{query}}” உடன் பொருந்தும் நிலையம் இல்லை.', // TODO(review-ta)
    close: 'மூடு', // TODO(review-ta)
  },
  results: {
    route: '{{from}} முதல் {{to}} வரை', // TODO(review-ta)
    prevDay: 'முந்தைய நாள்', // TODO(review-ta)
    nextDay: 'அடுத்த நாள்', // TODO(review-ta)
    count_one: '{{count}} ரயில்', // TODO(review-ta)
    count_other: '{{count}} ரயில்கள்', // TODO(review-ta)
    leavingAfter: '{{time}} க்குப் பின் புறப்படுபவை', // TODO(review-ta)
    none: 'இந்த நாளுக்கு ரயில்கள் இல்லை.', // TODO(review-ta)
    noneAfter: 'இந்த நாளில் {{time}} க்குப் பின் ரயில்கள் இல்லை.', // TODO(review-ta)
    noneHint: 'வேறு தேதி அல்லது முந்தைய நேரத்தை முயற்சிக்கவும்.', // TODO(review-ta)
    showAllDay: 'இந்த நாளின் அனைத்து ரயில்களையும் காட்டு', // TODO(review-ta)
    changeSearch: 'தேடலை மாற்று', // TODO(review-ta)
    missing: 'தேட நிலையங்களையும் தேதியையும் தேர்ந்தெடுக்கவும்.', // TODO(review-ta)
    fromPrice: '{{price}} முதல்', // TODO(review-ta)
  },
  train: {
    number: 'ரயில் {{number}}', // TODO(review-ta)
    departs: 'புறப்படுகிறது', // TODO(review-ta)
    arrives: 'வந்தடைகிறது', // TODO(review-ta)
    duration: 'பயண நேரம்', // TODO(review-ta)
    reservableOnline: 'இணையத்தில் முன்பதிவு செய்யலாம்', // TODO(review-ta)
    unreservedOnly: 'முன்பதிவு இல்லாதவை மட்டும்', // TODO(review-ta)
    classes: 'வகுப்புகள்', // TODO(review-ta)
    praveshaNote: 'பயணிகள் (commuter) டிக்கெட்டுகளை பயணத்துக்கு {{days}} நாட்கள் முன்பு வரை Pravesha இல் வாங்கலாம்.', // TODO(review-ta)
    praveshaFrom: '{{date}} க்கு {{opens}} முதல் வாங்கலாம்.', // TODO(review-ta)
    runningDays: 'ஓடும் நாட்கள்', // TODO(review-ta)
    runsDaily: 'தினமும் ஓடுகிறது.', // TODO(review-ta)
    runsOn: 'ஓடும் நாட்கள்: {{days}}.', // TODO(review-ta)
    runsYes: 'ஓடுகிறது', // TODO(review-ta)
    runsNo: 'ஓடாது', // TODO(review-ta)
    notRunning: 'இந்த ரயில் {{date}} அன்று ஓடாது.', // TODO(review-ta)
    stops: 'நிறுத்தங்கள்', // TODO(review-ta)
    platform: 'நடைமேடை {{platform}}', // TODO(review-ta)
    youBoard: 'நீங்கள் இங்கே ஏறுகிறீர்கள்', // TODO(review-ta)
    youGetOff: 'நீங்கள் இங்கே இறங்குகிறீர்கள்', // TODO(review-ta)
    arr: 'வருகை', // TODO(review-ta)
    dep: 'புறப்பாடு', // TODO(review-ta)
    fares: 'கட்டணங்கள்', // TODO(review-ta)
    faresFor: '{{from}} முதல் {{to}} வரை, ஒரு பெரியவருக்கு, ஒரு வழி.', // TODO(review-ta)
    feeNote: 'இணையத்தில் முன்பதிவு செய்தால் {{percent}}% வசதிக் கட்டணம் சேர்க்கப்படும்.', // TODO(review-ta)
    reservable: 'இணையத்தில் முன்பதிவு', // TODO(review-ta)
    unreserved: 'முன்பதிவு இல்லாதது', // TODO(review-ta)
    liveMap: 'நேரடி வரைபடம்', // TODO(review-ta)
    notFound: 'இந்த ரயிலைக் கண்டுபிடிக்க முடியவில்லை.', // TODO(review-ta)
    beforeYouBook: 'முன்பதிவு செய்வதற்கு முன்', // TODO(review-ta)
    unreservedTitle: 'இணைய இருக்கை முன்பதிவு இல்லை', // TODO(review-ta)
    unreservedBody: 'இந்த ரயிலின் இருக்கைகளை இணையத்தில் முன்பதிவு செய்ய முடியாது. நிலையக் கருமபீடத்தில் டிக்கெட் வாங்கவும்.', // TODO(review-ta)
  },
  classes: {
    firstAC: 'முதல் வகுப்பு (குளிரூட்டப்பட்டது)', // TODO(review-ta)
    observation: 'முதல் வகுப்பு கண்காணிப்புப் பெட்டி', // TODO(review-ta)
    second: 'இரண்டாம் வகுப்பு', // TODO(review-ta)
    third: 'மூன்றாம் வகுப்பு', // TODO(review-ta)
  },
  classesShort: {
    firstAC: '1 AC', // TODO(review-ta)
    observation: 'கண்காணிப்பு', // TODO(review-ta)
    second: '2ஆம்', // TODO(review-ta)
    third: '3ஆம்', // TODO(review-ta)
  },
  bookingWindow: {
    title: 'முன்பதிவுக் காலம்', // TODO(review-ta)
    opens: 'திறக்கும்', // TODO(review-ta)
    closes: 'மூடும்', // TODO(review-ta)
    opensOn: '{{date}} அன்று திறக்கும்', // TODO(review-ta)
    opensAt: '{{date}} அன்று {{time}} க்குத் திறக்கும்', // TODO(review-ta)
    timeNotConfirmed: 'திறக்கும் நேரம் உறுதிப்படுத்தப்படவில்லை. பயணத்துக்கு {{days}} நாட்களுக்கு முன் முன்பதிவு திறக்கும் என்று மட்டுமே இலங்கை ரயில்வே கூறுகிறது.', // TODO(review-ta)
    twoDates: 'முன்பதிவு {{early}} அல்லது {{late}} அன்று திறக்கும்.', // TODO(review-ta)
    twoDatesWhy: 'இந்த ரயில் {{serviceDate}} அன்று {{origin}} இலிருந்து புறப்படுகிறது, ஆனால் நீங்கள் {{boardingDate}} அன்று ஏறுகிறீர்கள். எந்தத் தேதி கணக்கில் கொள்ளப்படும் என்பது உறுதிப்படுத்தப்படவில்லை, எனவே {{early}} க்குத் திட்டமிடுங்கள்.', // TODO(review-ta)
    closesAt: 'இணைய முன்பதிவு {{date}} அன்று {{time}} க்கு மூடும்', // TODO(review-ta)
    mayBeLater: '(உங்கள் நிலையத்திலிருந்து பின்னர் இருக்கலாம்)', // TODO(review-ta)
    mayBeLaterWhy: 'இது ரயில் {{origin}} இலிருந்து புறப்படுவதற்கு {{hours}} மணி நேரம் முன். {{station}} இலிருந்து பின்னர் மூடலாம், ஆனால் இது உறுதிப்படுத்தப்படவில்லை.', // TODO(review-ta)
    countdown: '{{time}} இல் திறக்கும்', // TODO(review-ta)
    remindMe: 'முன்பதிவு திறக்கும்போது நினைவூட்டு', // TODO(review-ta)
    status: {
      'not-yet-open': 'இன்னும் திறக்கவில்லை', // TODO(review-ta)
      'opens-today': 'இன்று திறக்கலாம். சரியான நேரம் உறுதிப்படுத்தப்படவில்லை.', // TODO(review-ta)
      'may-be-open': 'ஏற்கனவே திறந்திருக்கலாம். அதிகாரப்பூர்வ தளத்தைப் பார்க்கவும்.', // TODO(review-ta)
      open: 'இப்போது திறந்துள்ளது', // TODO(review-ta)
      closed: 'இந்த ரயிலுக்கான இணைய முன்பதிவு மூடப்பட்டது.', // TODO(review-ta)
    },
  },
  reminder: {
    title: 'முன்பதிவு நினைவூட்டல்', // TODO(review-ta)
    intro: 'Dumriya உங்களுக்கு நினைவூட்டும் நேரங்கள்:', // TODO(review-ta)
    basedOnEarlier: 'முந்தைய சாத்தியமான திறப்புத் தேதியான {{date}} அடிப்படையில்.', // TODO(review-ta)
    alertHeadsUp: '{{date}}, {{time}}: முந்தைய நாள் மாலை', // TODO(review-ta)
    alertMidnight: '{{date}}, {{time}}: திறக்கும் நாளின் தொடக்கத்தில்', // TODO(review-ta)
    alertOpening: '{{date}}, {{time}}: முன்பதிவு திறக்கும்போது', // TODO(review-ta)
    midnightToggle: 'நள்ளிரவிலும் எனக்கு அறிவிக்கவும் (பிரபல ரயில்களின் இருக்கைகள் சில நிமிடங்களில் தீர்ந்துவிடலாம்)', // TODO(review-ta)
    headsUpText: '{{date}} அன்றைய {{train}} க்கான முன்பதிவு நாளை திறக்கலாம். சரியான நேரம் உறுதிப்படுத்தப்படவில்லை.', // TODO(review-ta)
    midnightText: '{{date}} அன்றைய {{train}} க்கான முன்பதிவு இப்போது திறக்கலாம். சரியான நேரம் உறுதிப்படுத்தப்படவில்லை.', // TODO(review-ta)
    openingText: '{{date}} அன்றைய {{train}} க்கான முன்பதிவு இப்போது திறக்கிறது.', // TODO(review-ta)
    nothingLeft: 'இந்த முன்பதிவுக் காலத்துக்கான அனைத்து நினைவூட்டல் நேரங்களும் ஏற்கனவே கடந்துவிட்டன.', // TODO(review-ta)
    save: 'நினைவூட்டலைச் சேமி', // TODO(review-ta)
    saved: 'நினைவூட்டல் இந்தத் தொலைபேசியில் சேமிக்கப்பட்டது.', // TODO(review-ta)
    addToCalendar: 'நாட்காட்டியில் சேர் (.ics)', // TODO(review-ta)
    calendarHint: 'Dumriya உங்கள் தொலைபேசியில் இயங்கும்போது மட்டுமே செயலி அறிவிப்புகள் வேலை செய்யும். நாட்காட்டியில் சேர்த்தால் நினைவூட்டல் நிச்சயம் ஒலிக்கும்.', // TODO(review-ta)
    storageError: 'இந்தத் தொலைபேசியில் சேமிக்க முடியவில்லை. பதிலாக “நாட்காட்டியில் சேர்” பயன்படுத்தவும்.', // TODO(review-ta)
    cancel: 'ரத்து செய்', // TODO(review-ta)
  },
};

export default ta;
