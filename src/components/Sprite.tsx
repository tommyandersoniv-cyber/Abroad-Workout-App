// ─────────────────────────────────────────────────────────────────────────
// Original pixel-art characters, drawn as SVG <rect> grids (no external art).
// One humanoid silhouette, recoloured per character and dressed up per
// evolution stage (headband → crown for YOU, spikes → horns for the RIVAL),
// with an aura ring at the APEX stage. Idle bob handled by the caller.
// ─────────────────────────────────────────────────────────────────────────

type Token = '.' | '1' | '2' | 'K' | 'E' | 'H' | 'B' | 'A'

// 16 × 18 athletic humanoid, arms slightly out, ready stance.
const FIGURE: string[] = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HKKKKKKH....',
  '....KKKKKKKK....',
  '....KEKKKKEK....',
  '....KKKKKKKK....',
  '.....KKKKKK.....',
  '......KKKK......',
  '...1111111111...',
  '..111111111111..',
  '.K11111111111K..',
  '.K1122222211K...',
  '..1222222221....',
  '...22222222.....',
  '...BB....BB.....',
  '..BBB....BBB....',
  '..BB......BB....',
]

interface Palette {
  '1': string // primary
  '2': string // primary shade
  K: string // skin / face
  E: string // eye
  H: string // hair / hood
  B: string // boots / base
  A: string // accent (headgear/trim)
}

const HERO_PAL: Palette = {
  '1': '#41f59b',
  '2': '#1f9c5e',
  K: '#f0c19a',
  E: '#07040f',
  H: '#6b4a2a',
  B: '#2a1b4d',
  A: '#ffd34d',
}

const RIVAL_PAL: Palette = {
  '1': '#7b4bd6',
  '2': '#3a1f6e',
  K: '#cdbcf2',
  E: '#ff7a45',
  H: '#1a1033',
  B: '#160c2c',
  A: '#ff7a45',
}

// Tommy = the 90% locked-in version: ME's silhouette, blue shirt, red headband.
const TOMMY_PAL: Palette = {
  '1': '#4f86ff',
  '2': '#2a4fb0',
  K: '#f0c19a',
  E: '#07040f',
  H: '#6b4a2a',
  B: '#2a1b4d',
  A: '#ff4d6d', // red headband / crown
}

export interface SpriteProps {
  who: 'hero' | 'rival' | 'tommy'
  stage: number // 0..3  (0 WASTE · 1 FAILURE · 2 CONTENDER · 3 APEX)
  px?: number // pixel cell size
  className?: string
  /** mirror so the two face each other */
  flip?: boolean
}

export function Sprite({ who, stage, px = 7, className = '', flip = false }: SpriteProps) {
  const pal = who === 'hero' ? HERO_PAL : who === 'tommy' ? TOMMY_PAL : RIVAL_PAL
  const heroLike = who === 'hero' || who === 'tommy'
  const cols = FIGURE[0].length
  const rows = FIGURE.length
  const W = cols * px
  const H = rows * px

  const cells: { x: number; y: number; c: string }[] = []
  FIGURE.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      const t = line[x] as Token
      if (t === '.') continue
      cells.push({ x, y, c: pal[t] })
    }
  })

  // Stage dressing: 2=CONTENDER gear, 3=APEX crown/horns + aura. -------------
  const extras: { x: number; y: number; c: string }[] = []
  const acc = pal.A
  if (heroLike) {
    // Tommy always wears his red headband; ME earns the band at CONTENDER.
    if (who === 'tommy' || stage >= 2) {
      for (let x = 4; x <= 11; x++) extras.push({ x, y: 4, c: acc })
    }
    if (stage >= 3) {
      // little crown
      ;[[5, 0], [8, 0], [10, 0], [5, 1], [8, 1], [10, 1]].forEach(([x, y]) =>
        extras.push({ x, y, c: acc }),
      )
    }
  } else {
    if (stage >= 2) {
      // shoulder spikes
      ;[[2, 9], [13, 9], [1, 10], [14, 10]].forEach(([x, y]) =>
        extras.push({ x, y, c: acc }),
      )
    }
    if (stage >= 3) {
      // horns
      ;[[4, 0], [4, 1], [11, 0], [11, 1]].forEach(([x, y]) =>
        extras.push({ x, y, c: acc }),
      )
    }
  }

  // Stage 0 (WASTE OF SPACE) is visibly diminished.
  const dim = stage === 0 ? 0.55 : 1
  const auraColor = who === 'hero' ? '#41f59b' : who === 'tommy' ? '#4f86ff' : '#ff7a45'

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible' }}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {stage >= 3 && (
        <g opacity={0.5}>
          <circle cx={cols / 2} cy={rows / 2 + 1} r={cols / 2 + 1} fill="none" stroke={auraColor} strokeWidth={0.6} />
          {[...Array(8)].map((_, i) => {
            const ang = (i / 8) * Math.PI * 2
            const cx = cols / 2 + Math.cos(ang) * (cols / 2 + 1)
            const cy = rows / 2 + 1 + Math.sin(ang) * (cols / 2 + 1)
            return <rect key={i} x={cx - 0.4} y={cy - 0.4} width={0.9} height={0.9} fill={auraColor} />
          })}
        </g>
      )}
      <g opacity={dim}>
        {cells.map((c, i) => (
          <rect key={i} x={c.x} y={c.y} width={1.02} height={1.02} fill={c.c} />
        ))}
        {extras.map((c, i) => (
          <rect key={`e${i}`} x={c.x} y={c.y} width={1.02} height={1.02} fill={c.c} />
        ))}
      </g>
      {/* rival glowing eyes get an extra bloom */}
      {who === 'rival' && (
        <g opacity={0.9}>
          <rect x={4} y={5} width={1.1} height={1.1} fill="#ffd34d" />
          <rect x={9} y={5} width={1.1} height={1.1} fill="#ffd34d" />
        </g>
      )}
    </svg>
  )
}
