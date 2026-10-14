# Full Day

A small, encouraging habit builder for iPhone (installable web app).

**Today:** greeting, today's intention, 8 daily habits (morning prayer, stretch, jump rope, pushups,
sit-ups, journal, meditate, evening prayer), and "Log Your Day", an 8-dimension reflection.
**Progress:** Screen Time-style Week/Month views. Each habit aims for 4 days a week; a good week means
every habit got there.

- Timers pick a random length inside each range and end with a buzzer.
- Reminders: Settings → "Add reminders to Calendar" makes a `.ics` of daily repeating events with alerts.
- Data lives on the device: localStorage for logs, IndexedDB for reflection photos. Nothing is uploaded.

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build   # static PWA in dist/, deployed by Netlify
```

The previous app (RIVAL) is preserved at git tag `rival-v1`.
