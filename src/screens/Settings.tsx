import { useState } from 'react'
import { formatTime } from '../lib/date'
import { HABITS, normalizeRange, reminders, type HabitId, type RangeId, type Times } from '../lib/habits'
import { buildIcs } from '../lib/ics'
import { buzzer, unlockAudio } from '../lib/sound'
import { useStore } from '../store/useStore'
import { useUi } from '../store/useUi'
import { BackButton, Card, PillButton, Sheet } from '../components/ui'

const RANGE_LABELS: Record<RangeId, string> = { jumprope: 'Jump rope', journal: 'Journal', meditate: 'Meditation (morning + evening)' }
const TIME_LABELS: [keyof Omit<Times, 'sets'>, string][] = [
  ['meditateAM', 'Morning meditation'], ['prayAM', 'Morning prayer'], ['teethAM', 'Brush teeth (morning)'], ['stretch', 'Stretch'], ['jumprope', 'Jump rope'], ['journal', 'Journal'],
  ['meditate', 'Evening meditation'], ['prayPM', 'Evening prayer'], ['reflect', 'Log your day'],
  ['shower', 'Shower'], ['teethPM', 'Brush teeth (night)'],
]

/** Number field that only commits a clean value on blur. */
function NumberField({ value, onCommit, min = 1, max = 1000, suffix }: {
  value: number; onCommit: (n: number) => void; min?: number; max?: number; suffix?: string
}) {
  const [draft, setDraft] = useState(String(value))
  const commit = () => {
    const n = Math.min(max, Math.max(min, Math.round(Number(draft) || value)))
    setDraft(String(n))
    onCommit(n)
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-16 rounded-lg border border-line bg-card px-2 py-1.5 text-center tabular-nums outline-none focus:border-ink"
      />
      {suffix && <span className="text-muted text-[14px]">{suffix}</span>}
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="text-[16px]">{label}</span>
      {children}
    </div>
  )
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-accent' : 'bg-empty border border-line'}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function downloadIcs(text: string) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  if (isIOS()) {
    // iOS Safari opens text/calendar in its "Add to Calendar" sheet.
    window.location.href = url
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = 'full-day-reminders.ics'
    a.click()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function Settings() {
  const s = useStore((st) => st.settings)
  const update = useStore((st) => st.updateSettings)
  const close = useUi((st) => () => st.open(null))
  const setTime = (k: keyof Omit<Times, 'sets'>, v: string) => v && update({ times: { ...s.times, [k]: v } })
  const setSet = (i: number, v: string) =>
    v && update({ times: { ...s.times, sets: s.times.sets.map((x, j) => (j === i ? v : x)) } })
  const toggleHabit = (id: HabitId) =>
    update({ off: s.off.includes(id) ? s.off.filter((x) => x !== id) : [...s.off, id] })
  const setRange = (id: RangeId, part: 'min' | 'max', n: number) =>
    update({ ranges: { ...s.ranges, [id]: normalizeRange({ ...s.ranges[id], [part]: n }) } })

  return (
    <Sheet>
      <BackButton onClick={close} />
      <h1 className="font-serif text-[30px] font-bold mt-2">Settings</h1>

      <Card className="mt-6 px-4 divide-y divide-line">
        <Row label="Your name">
          <input
            defaultValue={s.name}
            onBlur={(e) => update({ name: e.target.value.trim() || s.name })}
            className="w-36 rounded-lg border border-line bg-card px-2 py-1.5 text-right outline-none focus:border-ink"
          />
        </Row>
        <Row label="Pushups per day">
          <NumberField value={s.pushupTarget} onCommit={(n) => update({ pushupTarget: n })} />
        </Row>
        <Row label="Sit-ups per day">
          <NumberField value={s.situpTarget} onCommit={(n) => update({ situpTarget: n })} />
        </Row>
        <Row label="Timer sound">
          <button
            onClick={() => { unlockAudio(); setTimeout(buzzer, 150) }}
            className="rounded-full border border-line px-4 py-1.5 text-[14px] font-medium"
          >
            Test sound
          </button>
        </Row>
      </Card>

      <h2 className="font-serif text-[20px] font-bold mt-8">Daily habits</h2>
      <p className="text-muted text-[14px] mt-1">Start small. Switch more on when you’re ready for them.</p>
      <Card className="mt-3 px-4 divide-y divide-line">
        {HABITS.map((h) => {
          const on = !s.off.includes(h.id)
          return (
            <Row key={h.id} label={h.name}>
              <Switch on={on} label={h.name} onChange={() => toggleHabit(h.id)} />
            </Row>
          )
        })}
      </Card>

      <h2 className="font-serif text-[20px] font-bold mt-8">Timer ranges</h2>
      <p className="text-muted text-[14px] mt-1">Each session picks a random length in this range.</p>
      <Card className="mt-3 px-4 divide-y divide-line">
        {(Object.keys(RANGE_LABELS) as RangeId[]).map((id) => (
          <Row key={`${id}-${s.ranges[id].min}-${s.ranges[id].max}`} label={RANGE_LABELS[id]}>
            <span className="flex items-center gap-2">
              <NumberField value={s.ranges[id].min} max={120} onCommit={(n) => setRange(id, 'min', n)} />
              <span className="text-muted">to</span>
              <NumberField value={s.ranges[id].max} max={120} suffix="min" onCommit={(n) => setRange(id, 'max', n)} />
            </span>
          </Row>
        ))}
      </Card>

      <h2 className="font-serif text-[20px] font-bold mt-8">Reminder times</h2>
      <Card className="mt-3 px-4 divide-y divide-line">
        {TIME_LABELS.map(([k, label]) => (
          <Row key={k} label={label}>
            <input type="time" value={s.times[k]} onChange={(e) => setTime(k, e.target.value)} className="bg-transparent text-right" />
          </Row>
        ))}
        {s.times.sets.map((t, i) => (
          <Row key={`set${i}`} label={`Pushups + sit-ups, set ${i + 1}`}>
            <input type="time" value={t} onChange={(e) => setSet(i, e.target.value)} className="bg-transparent text-right" />
          </Row>
        ))}
      </Card>

      <h2 className="font-serif text-[20px] font-bold mt-8">Calendar reminders</h2>
      <p className="text-muted text-[14px] mt-1 leading-relaxed">
        Adds {reminders(s).length} daily repeating events with alerts to your iPhone calendar. If you change times
        later, delete the old events (or the calendar you added them to) and add them again.
      </p>
      <Card className="mt-3 px-4 py-2 divide-y divide-line">
        {reminders(s).map((r) => (
          <div key={r.id} className="flex justify-between py-2 text-[14px]">
            <span>{r.title}</span>
            <span className="text-muted tabular-nums">{formatTime(r.time)}</span>
          </div>
        ))}
      </Card>
      <PillButton className="w-full mt-4 mb-10" onClick={() => downloadIcs(buildIcs(s, new Date()))}>
        Add reminders to Calendar
      </PillButton>
    </Sheet>
  )
}
