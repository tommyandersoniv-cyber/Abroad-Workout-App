// Deterministic placeholder "pixel media" for an exercise — a labelled slot
// with an add-photo affordance. We never fetch or fabricate real photos (PRD
// §6.2); the user populates these later. The pattern is seeded so it's stable.

function seededGrid(seed: number, n: number): boolean[] {
  const out: boolean[] = []
  let s = seed >>> 0
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    out.push((s & 255) > 150)
  }
  return out
}

export function PixelMedia({
  seed,
  label,
  size = 'lg',
  onAdd,
}: {
  seed: number
  label?: string
  size?: 'sm' | 'lg'
  onAdd?: () => void
}) {
  const dim = 8
  const grid = seededGrid(seed, dim * dim)
  const cell = size === 'lg' ? 'h-full' : ''
  return (
    <div
      className={`relative panel-tight overflow-hidden ${size === 'lg' ? 'aspect-square' : 'w-14 h-14'}`}
      style={{ background: 'var(--color-night)' }}
    >
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${dim}, 1fr)` }}>
        {grid.map((on, i) => (
          <div
            key={i}
            className={cell}
            style={{
              background: on
                ? i % 3 === 0
                  ? 'var(--color-panel3)'
                  : 'var(--color-panel2)'
                : 'transparent',
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center text-center px-2">
        <div>
          <div className="font-pixel text-[7px] text-dim">NO MEDIA</div>
          {size === 'lg' && onAdd && (
            <span
              role="button"
              tabIndex={0}
              className="btn inline-block mt-2 text-[7px]"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
            >
              + ADD PHOTO
            </span>
          )}
        </div>
      </div>
      {label && size === 'lg' && (
        <div className="absolute bottom-0 inset-x-0 bg-ink/80 font-term text-center text-cyan text-sm py-0.5">
          {label}
        </div>
      )}
    </div>
  )
}
