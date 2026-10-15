import { useState } from 'react'
import { PillButton } from './ui'

/**
 * Quiet "Already done" link for start screens, for when a habit was done
 * outside the app. Asks for an honest confirmation before checking it off.
 */
export function AlreadyDone({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false)
  return (
    <>
      <button onClick={() => setAsking(true)} className="mt-5 w-full text-center text-[15px] text-muted underline underline-offset-4">
        Already done
      </button>
      {asking && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bg/90 backdrop-blur-sm px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-card p-6 text-center anim-pop">
            <div className="font-serif text-[26px] font-bold leading-tight">Did you really do it?</div>
            <p className="text-muted text-[16px] mt-3 leading-relaxed">
              Only check off {name.toLowerCase()} if you actually did it outside the app. Don’t cheat yourself. The
              habit is the point, not the checkmark.
            </p>
            <p className="text-muted text-[15px] mt-2">“Not yet” is a fine answer too.</p>
            <PillButton className="w-full mt-6" onClick={onConfirm}>Yes, I did it</PillButton>
            <PillButton variant="ghost" className="w-full mt-3" onClick={() => setAsking(false)}>Not yet</PillButton>
          </div>
        </div>
      )}
    </>
  )
}
