import { useRef, useState } from 'react'
import type { DayKey } from '../lib/date'
import type { DimensionId } from '../lib/dimensions'
import { deletePhoto, savePhoto, usePhotoUrl } from '../lib/photos'
import { Icon } from './ui'

/** Round photo button: pick/take a photo for a dimension; shows a thumbnail once saved. */
export function PhotoButton({ day, dimension }: { day: DayKey; dimension: DimensionId }) {
  const url = usePhotoUrl(day, dimension)
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      await savePhoto(day, dimension, file)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <span className="relative inline-block shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={url ? 'Change photo' : 'Add photo'}
        onClick={() => input.current?.click()}
        className="size-12 rounded-full border border-line grid place-items-center text-muted overflow-hidden bg-card"
      >
        {url ? <img src={url} alt="" className="size-full object-cover" /> : busy ? '…' : <Icon name="image" />}
      </button>
      {url && (
        <button
          type="button"
          aria-label="Remove photo"
          onClick={() => void deletePhoto(day, dimension)}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-ink text-on-ink grid place-items-center"
        >
          <Icon name="x" size={12} />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </span>
  )
}
