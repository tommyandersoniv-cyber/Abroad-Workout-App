import { Panel, PixelButton } from '../components/ui'
import { useGameStore } from '../store/useGameStore'
import { useFx } from '../store/useFx'

export function Settings() {
  const s = useGameStore()

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
