# Translation review

All Sinhala and Tamil text is a draft. Every string sits in `src/i18n/si.ts` or `src/i18n/ta.ts` with a trailing `// TODO(review-si)` or `// TODO(review-ta)` comment. Delete that comment once you have checked the line. Station names are in `src/mocks/stations.json`.

To see your language in the app: **More → Settings → Language**.

The questions below need a decision, not just a wording check.

---

## Sinhala (සිංහල)

1. **Time format: `06:30` or `06.30`?**
   The app currently shows `06:30` in every language, which matches e-tickets and printed timetables. Standard Sinhala formatting uses a dot (`06.30`). Which should Sinhala users see?
2. **Date order.**
   Dates are currently shown as `2026 දෙසැ 10, බ්‍රහස්` (year, month, day, weekday). Is that natural, or would you prefer, for example, `දෙසැ 10, 2026 (බ්‍රහස්පතින්දා)`? The order is one template: `format.date`.
3. **Shortened weekday names.**
   Short forms are used where space is tight: ඉරිදා, සඳුදා, **අඟහ**, බදාදා, **බ්‍රහස්**, **සිකු**, **සෙන** (`format.weekdaysShort`). Are these abbreviations recognisable, or should the full names be used?
4. **Shortened month names.** ජන, පෙබ, … **නොවැ**, **දෙසැ** (`format.months`). Are these clear?
5. **"Ticket".** The app uses ටිකට්පත. Should it be ප්‍රවේශ පත්‍රය instead, or should the two be mixed?

## Tamil (தமிழ்)

1. **Time format.** The app shows `06:30` (24-hour). Is the 24-hour clock fine, or should it be 12-hour with காலை / மாலை?
2. **Date order.**
   Dates are shown as `செவ்., 10 நவ. 2026` (weekday, day, month, year), set by the `format.date` template. Is that natural?
3. **Shortened weekday names.**
   ஞாயி., திங்., செவ்., புத., வியா., வெள்., சனி (`format.weekdaysShort`). Are these recognisable?
4. **Shortened month names.** ஜன., பிப்., … நவ., டிச. (`format.months`). Should they have the trailing full stop?
5. **"Commuter ticket".** The draft says பயணிகள் (commuter) டிக்கெட்டுகள், keeping the English word in brackets. Is there a better common term?

## Both languages

- **"Pravesha"** is written in Latin letters. Should it be transliterated?
- **Long strings.** Please read these at small phone width: the booking-window explanation (`bookingWindow.twoDatesWhy`) and the reminder toggle (`reminder.midnightToggle`).
- **Line-by-line check.** Every string with a `TODO(review-…)` comment still needs one.
