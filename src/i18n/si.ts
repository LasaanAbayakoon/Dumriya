/**
 * Sinhala strings.
 * TODO(review-si): every string below is a draft translation and must be
 * reviewed by a native Sinhala speaker. Remove the trailing TODO on each line
 * once it has been checked.
 */
import type { Messages } from './en';

const si: Messages = {
  app: {
    name: 'Dumriya', // brand name, not translated
    unofficial: 'නිල නොවන', // TODO(review-si)
    tagline: 'නිල නොවන දුම්රිය සහායකය', // TODO(review-si)
  },
  nav: {
    main: 'ප්‍රධාන', // TODO(review-si)
    search: 'සොයන්න', // TODO(review-si)
    tickets: 'ටිකට්පත්', // TODO(review-si)
    reminders: 'සිහිකැඳවීම්', // TODO(review-si)
    more: 'තවත්', // TODO(review-si)
  },
  common: {
    loading: 'පූරණය වෙමින්…', // TODO(review-si)
    back: 'ආපසු', // TODO(review-si)
    comingSoon: 'මෙම තිරය සකසමින් පවතී.', // TODO(review-si)
    offline: 'ඔබ අන්තර්ජාලයට සම්බන්ධ නැත. සුරැකි තොරතුරු පෙන්වයි.', // TODO(review-si)
    preview: 'පෙරදසුන', // TODO(review-si)
    previewNote: 'අනුකරණය කළ දත්ත සහිත පෙරදසුනකි. සජීවී තොරතුරු නොවේ.', // TODO(review-si)
    sampleData: 'නියැදි දත්ත – නිල කාලසටහන නොවේ', // TODO(review-si)
    notFound: 'පිටුව හමු නොවීය', // TODO(review-si)
    goHome: 'සෙවුමට යන්න', // TODO(review-si)
    error: 'යමක් වැරදී ඇත. නැවත උත්සාහ කරන්න.', // TODO(review-si)
    retry: 'නැවත උත්සාහ කරන්න', // TODO(review-si)
    skipToContent: 'අන්තර්ගතයට යන්න', // TODO(review-si)
    close: 'වසන්න', // TODO(review-si)
    notConfirmed: 'තහවුරු කර නැත', // TODO(review-si)
  },
  screens: {
    home: 'දුම්රියක් සොයන්න', // TODO(review-si)
    results: 'දුම්රිය', // TODO(review-si)
    train: 'දුම්රිය විස්තර', // TODO(review-si)
    book: 'වෙන්කිරීමට පෙර', // TODO(review-si)
    tickets: 'මගේ ටිකට්පත්', // TODO(review-si)
    ticket: 'ටිකට්පත', // TODO(review-si)
    refund: 'මුදල් ආපසු ගැනීමේ ගණකය', // TODO(review-si)
    dispute: 'මුදල් අය වුණා, ටිකට්පතක් නැත', // TODO(review-si)
    reminders: 'සිහිකැඳවීම්', // TODO(review-si)
    stations: 'දුම්රිය ස්ථාන', // TODO(review-si)
    station: 'දුම්රිය ස්ථානය', // TODO(review-si)
    board: 'ස්ථාන පුවරුව', // TODO(review-si)
    live: 'සජීවී දුම්රිය සිතියම', // TODO(review-si)
    more: 'තවත්', // TODO(review-si)
    settings: 'සැකසුම්', // TODO(review-si)
    about: 'Dumriya ගැන', // TODO(review-si)
  },
  settings: {
    language: 'භාෂාව', // TODO(review-si)
    theme: 'පෙනුම', // TODO(review-si)
    themeSystem: 'දුරකථනයට ගැළපෙන ලෙස', // TODO(review-si)
    themeLight: 'ආලෝකමත්', // TODO(review-si)
    themeDark: 'අඳුරු', // TODO(review-si)
  },
  format: {
    lkr: 'රු. {{amount}}', // TODO(review-si)
    durationHm: 'පැය {{h}} මිනිත්තු {{m}}', // TODO(review-si)
    durationH: 'පැය {{h}}', // TODO(review-si)
    durationM: 'මිනිත්තු {{m}}', // TODO(review-si)
    plusDay_one: '+දින {{count}}', // TODO(review-si)
    plusDay_other: '+දින {{count}}', // TODO(review-si)
    nextDay: 'ඊළඟ දිනය', // TODO(review-si)
    countdownDhm: 'දින {{d}} පැය {{h}} මිනිත්තු {{m}}', // TODO(review-si)
    date: '{{year}} {{month}} {{day}}, {{weekday}}', // TODO(review-si)
    shortDate: '{{month}} {{day}}', // TODO(review-si)
    months: {
      '1': 'ජන', // TODO(review-si)
      '2': 'පෙබ', // TODO(review-si)
      '3': 'මාර්තු', // TODO(review-si)
      '4': 'අප්‍රේල්', // TODO(review-si)
      '5': 'මැයි', // TODO(review-si)
      '6': 'ජූනි', // TODO(review-si)
      '7': 'ජූලි', // TODO(review-si)
      '8': 'අගෝ', // TODO(review-si)
      '9': 'සැප්', // TODO(review-si)
      '10': 'ඔක්', // TODO(review-si)
      '11': 'නොවැ', // TODO(review-si)
      '12': 'දෙසැ', // TODO(review-si)
    },
    weekdays: {
      '0': 'ඉරිදා', // TODO(review-si)
      '1': 'සඳුදා', // TODO(review-si)
      '2': 'අඟහරුවාදා', // TODO(review-si)
      '3': 'බදාදා', // TODO(review-si)
      '4': 'බ්‍රහස්පතින්දා', // TODO(review-si)
      '5': 'සිකුරාදා', // TODO(review-si)
      '6': 'සෙනසුරාදා', // TODO(review-si)
    },
    weekdaysShort: {
      '0': 'ඉරිදා', // TODO(review-si)
      '1': 'සඳුදා', // TODO(review-si)
      '2': 'අඟහ', // TODO(review-si)
      '3': 'බදාදා', // TODO(review-si)
      '4': 'බ්‍රහස්', // TODO(review-si)
      '5': 'සිකු', // TODO(review-si)
      '6': 'සෙන', // TODO(review-si)
    },
  },
  home: {
    from: 'සිට', // TODO(review-si)
    to: 'දක්වා', // TODO(review-si)
    chooseStation: 'ස්ථානයක් තෝරන්න', // TODO(review-si)
    swap: 'සිට සහ දක්වා මාරු කරන්න', // TODO(review-si)
    date: 'දිනය', // TODO(review-si)
    time: 'මෙයට පසු පිටත්වන', // TODO(review-si)
    timeHint: 'අනිවාර්ය නැත. එදින සියලු දුම්රිය සඳහා හිස්ව තබන්න.', // TODO(review-si)
    search: 'දුම්රිය සොයන්න', // TODO(review-si)
    errorFrom: 'ඔබ පිටත්වන ස්ථානය තෝරන්න.', // TODO(review-si)
    errorTo: 'ඔබ යන ස්ථානය තෝරන්න.', // TODO(review-si)
    errorSame: 'පිටත්වන සහ යන ස්ථාන වෙනස් විය යුතුය.', // TODO(review-si)
    errorDate: 'වලංගු දිනයක් තෝරන්න.', // TODO(review-si)
    recent: 'මෑත සෙවීම්', // TODO(review-si)
    clearRecent: 'මෑත සෙවීම් මකන්න', // TODO(review-si)
    tools: 'මෙවලම්', // TODO(review-si)
    toolTickets: 'මගේ ටිකට්පත්', // TODO(review-si)
    toolTicketsHint: 'ඔබේ ඊ-ටිකට්පත්, අන්තර්ජාලය නැතිවත් ලබාගත හැක', // TODO(review-si)
    toolRefund: 'මුදල් ආපසු ගැනීමේ ගණකය', // TODO(review-si)
    toolRefundHint: 'අවලංගු කළහොත් ආපසු ලැබෙන මුදල', // TODO(review-si)
    toolReminders: 'සිහිකැඳවීම්', // TODO(review-si)
    toolRemindersHint: 'වෙන්කිරීමේ කාල සහ අවසාන දින', // TODO(review-si)
    unofficialNote: 'Dumriya නිල නොවන යෙදුමකි. එය ටිකට්පත් අලෙවි නොකරයි; ඔබ වෙන්කරන්නේ නිල ශ්‍රී ලංකා දුම්රිය වෙබ් අඩවිවලිනි.', // TODO(review-si)
  },
  picker: {
    fromTitle: 'පිටත්වන ස්ථානය', // TODO(review-si)
    toTitle: 'යන ස්ථානය', // TODO(review-si)
    searchLabel: 'ස්ථාන සොයන්න', // TODO(review-si)
    searchHint: 'ඉංග්‍රීසි, සිංහල හෝ දෙමළ නමක්, නැතහොත් ස්ථාන කේතයක් ටයිප් කරන්න.', // TODO(review-si)
    noResults: '“{{query}}” ට ගැළපෙන ස්ථානයක් නැත.', // TODO(review-si)
    close: 'වසන්න', // TODO(review-si)
  },
  results: {
    route: '{{from}} සිට {{to}} දක්වා', // TODO(review-si)
    prevDay: 'පෙර දිනය', // TODO(review-si)
    nextDay: 'ඊළඟ දිනය', // TODO(review-si)
    count_one: 'දුම්රිය {{count}}', // TODO(review-si)
    count_other: 'දුම්රිය {{count}}', // TODO(review-si)
    leavingAfter: '{{time}} ට පසු පිටත්වන', // TODO(review-si)
    none: 'මෙදින සඳහා දුම්රිය හමු නොවීය.', // TODO(review-si)
    noneAfter: 'මෙදින {{time}} ට පසු දුම්රිය හමු නොවීය.', // TODO(review-si)
    noneHint: 'වෙනත් දිනයක් හෝ කලින් වේලාවක් උත්සාහ කරන්න.', // TODO(review-si)
    showAllDay: 'මෙදින සියලු දුම්රිය පෙන්වන්න', // TODO(review-si)
    changeSearch: 'සෙවුම වෙනස් කරන්න', // TODO(review-si)
    missing: 'සෙවීමට ස්ථාන සහ දිනයක් තෝරන්න.', // TODO(review-si)
    fromPrice: '{{price}} සිට', // TODO(review-si)
  },
  train: {
    number: 'දුම්රිය අංක {{number}}', // TODO(review-si)
    departs: 'පිටත්වේ', // TODO(review-si)
    arrives: 'පැමිණේ', // TODO(review-si)
    duration: 'ගමන් කාලය', // TODO(review-si)
    reservableOnline: 'අන්තර්ජාලයෙන් වෙන්කළ හැක', // TODO(review-si)
    unreservedOnly: 'වෙන් නොකළ ආසන පමණි', // TODO(review-si)
    classes: 'පන්ති', // TODO(review-si)
    praveshaNote: 'ගමන් ටිකට්පත් (commuter) ගමනට දින {{days}} කට පෙර සිට Pravesha හරහා මිලදී ගත හැක.', // TODO(review-si)
    praveshaFrom: '{{date}} සඳහා {{opens}} සිට මිලදී ගත හැක.', // TODO(review-si)
    runningDays: 'ධාවන දින', // TODO(review-si)
    runsDaily: 'සෑම දිනකම ධාවනය වේ.', // TODO(review-si)
    runsOn: 'ධාවන දින: {{days}}.', // TODO(review-si)
    runsYes: 'ධාවනය වේ', // TODO(review-si)
    runsNo: 'ධාවනය නොවේ', // TODO(review-si)
    notRunning: 'මෙම දුම්රිය {{date}} දින ධාවනය නොවේ.', // TODO(review-si)
    stops: 'නැවතුම්', // TODO(review-si)
    platform: 'වේදිකාව {{platform}}', // TODO(review-si)
    youBoard: 'ඔබ මෙතැනින් නගී', // TODO(review-si)
    youGetOff: 'ඔබ මෙතැනින් බසී', // TODO(review-si)
    arr: 'පැමිණීම', // TODO(review-si)
    dep: 'පිටත්වීම', // TODO(review-si)
    fares: 'ගාස්තු', // TODO(review-si)
    faresFor: '{{from}} සිට {{to}} දක්වා, වැඩිහිටියෙකුට, එක් පැත්තකට.', // TODO(review-si)
    feeNote: 'අන්තර්ජාලයෙන් වෙන්කිරීමේදී {{percent}}% පහසුකම් ගාස්තුවක් එකතු වේ.', // TODO(review-si)
    reservable: 'අන්තර්ජාලයෙන් වෙන්කළ හැක', // TODO(review-si)
    unreserved: 'වෙන් නොකළ', // TODO(review-si)
    liveMap: 'සජීවී සිතියම', // TODO(review-si)
    notFound: 'මෙම දුම්රිය සොයාගත නොහැක.', // TODO(review-si)
    beforeYouBook: 'වෙන්කිරීමට පෙර', // TODO(review-si)
    unreservedTitle: 'අන්තර්ජාල ආසන වෙන්කිරීමක් නැත', // TODO(review-si)
    unreservedBody: 'මෙම දුම්රියේ ආසන අන්තර්ජාලයෙන් වෙන්කළ නොහැක. දුම්රිය ස්ථාන කවුළුවෙන් ටිකට්පත මිලදී ගන්න.', // TODO(review-si)
  },
  classes: {
    firstAC: 'පළමු පන්තිය (වායුසමීකරණ)', // TODO(review-si)
    observation: 'පළමු පන්ති නිරීක්ෂණ මැදිරිය', // TODO(review-si)
    second: 'දෙවන පන්තිය', // TODO(review-si)
    third: 'තුන්වන පන්තිය', // TODO(review-si)
  },
  classesShort: {
    firstAC: '1 AC', // TODO(review-si)
    observation: 'නිරීක්ෂණ', // TODO(review-si)
    second: '2 පන්තිය', // TODO(review-si)
    third: '3 පන්තිය', // TODO(review-si)
  },
  bookingWindow: {
    title: 'වෙන්කිරීමේ කාලය', // TODO(review-si)
    opens: 'විවෘත වේ', // TODO(review-si)
    closes: 'වැසේ', // TODO(review-si)
    opensOn: '{{date}} දින විවෘත වේ', // TODO(review-si)
    opensAt: '{{date}} දින {{time}} ට විවෘත වේ', // TODO(review-si)
    timeNotConfirmed: 'විවෘත වන වේලාව තහවුරු කර නැත. ශ්‍රී ලංකා දුම්රිය සේවය පවසන්නේ ගමනට දින {{days}} කට පෙර වෙන්කිරීම් විවෘත වන බව පමණි.', // TODO(review-si)
    twoDates: 'වෙන්කිරීම් {{early}} හෝ {{late}} දින විවෘත වේ.', // TODO(review-si)
    twoDatesWhy: 'මෙම දුම්රිය {{serviceDate}} දින {{origin}} වලින් පිටත් වුවද, ඔබ නගින්නේ {{boardingDate}} දිනයි. කුමන දිනය ගණන් ගන්නේදැයි තහවුරු කර නැති නිසා {{early}} සඳහා සූදානම් වන්න.', // TODO(review-si)
    closesAt: 'අන්තර්ජාල වෙන්කිරීම් {{date}} දින {{time}} ට වැසේ', // TODO(review-si)
    mayBeLater: '(ඔබේ ස්ථානයෙන් පසුව විය හැක)', // TODO(review-si)
    mayBeLaterWhy: 'එය දුම්රිය {{origin}} වලින් පිටත්වීමට පැය {{hours}} කට පෙරයි. {{station}} සිට එය පසුව වැසිය හැකි නමුත් එය තහවුරු කර නැත.', // TODO(review-si)
    countdown: '{{time}} කින් විවෘත වේ', // TODO(review-si)
    remindMe: 'වෙන්කිරීම් විවෘත වන විට මට මතක් කරන්න', // TODO(review-si)
    status: {
      'not-yet-open': 'තවම විවෘත නැත', // TODO(review-si)
      'opens-today': 'අද විවෘත විය හැක. නිශ්චිත වේලාව තහවුරු කර නැත.', // TODO(review-si)
      'may-be-open': 'දැනටමත් විවෘත විය හැක. නිල වෙබ් අඩවිය පරීක්ෂා කරන්න.', // TODO(review-si)
      open: 'දැන් විවෘතයි', // TODO(review-si)
      closed: 'මෙම දුම්රිය සඳහා අන්තර්ජාල වෙන්කිරීම් වසා ඇත.', // TODO(review-si)
    },
  },
  reminder: {
    title: 'වෙන්කිරීමේ සිහිකැඳවීම', // TODO(review-si)
    intro: 'Dumriya ඔබට මතක් කරන වේලාවන්:', // TODO(review-si)
    basedOnEarlier: 'කලින් විය හැකි විවෘත දිනය වන {{date}} මත පදනම්ව.', // TODO(review-si)
    alertHeadsUp: '{{date}}, {{time}}: පෙර දින සවස', // TODO(review-si)
    alertMidnight: '{{date}}, {{time}}: විවෘත වන දිනයේ ආරම්භයේදී', // TODO(review-si)
    alertOpening: '{{date}}, {{time}}: වෙන්කිරීම් විවෘත වන විට', // TODO(review-si)
    midnightToggle: 'මධ්‍යම රාත්‍රියේදීත් මට දැනුම් දෙන්න (ජනප්‍රිය දුම්රියවල ආසන මිනිත්තු කිහිපයකින් අවසන් විය හැක)', // TODO(review-si)
    headsUpText: '{{date}} දින {{train}} සඳහා වෙන්කිරීම් හෙට විවෘත විය හැක. නිශ්චිත වේලාව තහවුරු කර නැත.', // TODO(review-si)
    midnightText: '{{date}} දින {{train}} සඳහා වෙන්කිරීම් දැන් විවෘත විය හැක. නිශ්චිත වේලාව තහවුරු කර නැත.', // TODO(review-si)
    openingText: '{{date}} දින {{train}} සඳහා වෙන්කිරීම් දැන් විවෘතයි.', // TODO(review-si)
    nothingLeft: 'මෙම වෙන්කිරීමේ කාලය සඳහා සියලු සිහිකැඳවීම් වේලාවන් දැනටමත් ගත වී ඇත.', // TODO(review-si)
    save: 'සිහිකැඳවීම සුරකින්න', // TODO(review-si)
    saved: 'සිහිකැඳවීම මෙම දුරකථනයේ සුරැකිණි.', // TODO(review-si)
    addToCalendar: 'දින දර්ශනයට එක් කරන්න (.ics)', // TODO(review-si)
    calendarHint: 'යෙදුමේ දැනුම්දීම් ක්‍රියා කරන්නේ Dumriya ඔබේ දුරකථනයේ ක්‍රියාත්මක විය හැකි විට පමණි. දින දර්ශනයට එක් කිරීමෙන් සිහිකැඳවීම නිසැකවම ලැබේ.', // TODO(review-si)
    storageError: 'මෙම දුරකථනයේ සුරැකීමට නොහැකි විය. ඒ වෙනුවට “දින දර්ශනයට එක් කරන්න” භාවිත කරන්න.', // TODO(review-si)
    cancel: 'අවලංගු කරන්න', // TODO(review-si)
  },
};

export default si;
