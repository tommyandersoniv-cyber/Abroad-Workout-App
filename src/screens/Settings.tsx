import { Panel, PixelButton } from '../components/ui'
import { Sprite } from '../components/Sprite'
import { useGameStore, selectRivalXP, selectPlayerXP, selectYmmotXP } from '../store/useGameStore'
import { useFx } from '../store/useFx'
import { useTick } from '../hooks/useNow'
import { tierForGap } from '../engine/levels'
import type { Personality } from '../engine/types'

const PERSONALITIES: { id: Personality; label: string }[] = [
  { id: 'cocky', label: 'COCKY' },
  { id: 'stoic', label: 'STOIC' },
  { id: 'hypeman', label: 'HYPE-MAN' },
  { id: 'sarcastic', label: 'SARCASTIC' },
]

export function Settings() {
  useTick(1000)
  const s = useGameStore()
  const you = selectPlayerXP(s)
  const ymmot = selectYmmotXP(s)
  const tommy = selectRivalXP(s)

  function exportData() {
    const blob = new Blob([JSON.stringify(useGameStore.getState(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rival-save.json'
    a.click()
    URL.revokeObjectURL(url)
    useFx.getState().say('Save exported')
  }

  return (
    <div className="p-3 space-y-3 anim-rise">
      <Panel accent="gold" title="SETTINGS">
        <Toggle
          label="Sound"
          sub="Optional retro blips — off by default"
          on={s.settings.sound}
          onChange={s.toggleSound}
        />
        <div className="h-px bg-line my-2" />
        <Toggle
          label="Allow negative XP"
          sub="Let your line go into debt (default: on). The gap is the real number."
          on={s.settings.allowNegative}
          onChange={() => s.setAllowNegative(!s.settings.allowNegative)}
        />
      </Panel>

      {/* ── Rivals & names (merged in from the old Rivals page) ──────────────── */}
      <Panel accent="gold" title="THE THREE LINES" className="crt">
        <p className="font-term text-dim text-base mb-3">
          One contest, three versions of you — all start at 0 on day 1.
        </p>
        <div className="grid grid-cols-3 items-end gap-1">
          <div className="flex flex-col items-center">
            <Sprite who="hero" stage={tierForGap(you - tommy)} px={6} className="anim-bob" />
            <div className="font-term text-you text-sm mt-1">{s.playerName}</div>
            <div className="font-term text-dim text-xs">you</div>
          </div>
          <div className="flex flex-col items-center">
            <Sprite who="rival" stage={tierForGap(ymmot - you)} px={6} className="anim-bob-fast" />
            <div className="font-term text-ymmot text-sm mt-1">{s.ymmotName}</div>
            <div className="font-term text-dim text-xs">50%</div>
          </div>
          <div className="flex flex-col items-center">
            <Sprite who="tommy" stage={tierForGap(tommy - you)} px={6} className="anim-bob-fast" flip />
            <div className="font-term text-tommy text-sm mt-1">{s.rival.name}</div>
            <div className="font-term text-dim text-xs">90%</div>
          </div>
        </div>
      </Panel>

      <Panel accent="you" title="YOU CONTROL">
        <NameField value={s.playerName} onChange={(v) => s.setPlayer({ name: v })} color="text-you" hint="the player you control" />
      </Panel>

      <Panel title="YMMOT · 50% (HUMAN-ACHIEVABLE)">
        <NameField value={s.ymmotName} onChange={s.setYmmotName} color="text-ymmot" hint="the constant humanly-achievable benchmark" />
      </Panel>

      <Panel title="TOMMY · 90% (LOCKED-IN)">
        <NameField value={s.rival.name} onChange={(v) => s.setRival({ name: v })} color="text-tommy" hint="the totally locked-in version — your nemesis" />
        <div className="font-pixel text-[7px] text-dim mt-3 mb-2">TOMMY’S PERSONALITY (drives taunts)</div>
        <div className="grid grid-cols-2 gap-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              className={`btn ${s.rival.personality === p.id ? 'btn-rival' : ''}`}
              onClick={() => s.setRival({ personality: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="font-term text-dim text-sm mt-3">
          The two benchmarks are fixed by design — Ymmot always holds 50% of the maximum possible XP and
          Tommy always holds 90%. Names &amp; Tommy’s personality are live; sprite uploads are stubbed.
        </p>
      </Panel>

      <Panel title="DEADLINES">
        <p className="font-term text-dim text-base">
          A daily item counts as missed at end of day (local time); weekly items at week’s end. Custom
          schedule windows &amp; notification editing are stubbed in this prototype.
        </p>
      </Panel>

      <Panel title="DATA">
        <div className="space-y-2">
          <PixelButton className="w-full" onClick={exportData}>⤓ EXPORT SAVE (JSON)</PixelButton>
          <PixelButton
            variant="rival"
            className="w-full"
            onClick={() => {
              if (confirm('Reset everything to the seed state? This wipes your progress.')) {
                s.resetToSeed()
                useFx.getState().say('Reset to seed')
              }
            }}
          >
            ↺ RESET TO SEED
          </PixelButton>
        </div>
      </Panel>

      <Panel title="ABOUT">
        <p className="font-term text-dim text-base">
          RIVAL · v0.2 — a pixel-art discipline game with no finish line. Offline-first PWA, all state
          local. The rival is the version of you that does 90% of everything, every day, forever.
        </p>
      </Panel>
    </div>
  )
}

function Toggle({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: () => void }) {
  return (
    <button className="w-full flex items-center gap-3 text-left" onClick={onChange}>
      <div className={`pixbox ${on ? '!bg-you-dk' : ''}`}>{on && <span className="font-pixel text-[10px]">✓</span>}</div>
      <div className="flex-1">
        <div className="font-pixel text-[9px]">{label}</div>
        <div className="font-term text-dim text-sm">{sub}</div>
      </div>
      <span className={`font-pixel text-[8px] ${on ? 'text-you' : 'text-dim'}`}>{on ? 'ON' : 'OFF'}</span>
    </button>
  )
}

function NameField({
  value,
  onChange,
  color,
  hint,
}: {
  value: string
  onChange: (v: string) => void
  color: string
  hint: string
}) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 12))}
        className={`bg-night border-3 border-ink px-2 py-2 font-pixel text-[11px] ${color} text-center w-full`}
        style={{ boxShadow: 'inset 0 0 0 2px var(--color-line)' }}
      />
      <div className="font-term text-dim text-sm mt-1">{hint}</div>
    </div>
  )
}
