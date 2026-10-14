// The daily stretch flow: 11 stretches in 4 phases. Holds plus a 3s get-set
// gap before each hold come to exactly 15:00.
// One-sided stretches get a full hold per side. `prompts` are mid-hold
// instructions (seconds into the hold), each marked with a beep.

export interface Stretch {
  id: string
  name: string
  phase: string
  why: string
  cues: string[]
  /** Seconds per side (or total, if not one-sided). */
  holdSec: number
  sides?: 2
  /** Local photo file in /public/stretch, when we have one. */
  photo?: string
  /** Reference picture/video page. */
  link?: string
  prompts?: [number, string][]
}

export const STRETCHES: Stretch[] = [
  {
    id: 'cat-cow', name: 'Cat-Cow', phase: 'Wake the Spine', holdSec: 55, photo: 'cat-cow.webp',
    why: 'Moves your whole spine forward and back to wake it up after sleep.',
    cues: ['Hands under shoulders, knees under hips.', 'Breathe in: belly drops, look up (cow).', 'Breathe out: round your back, tuck your chin (cat).', 'Keep moving slowly with your breath.'],
    link: 'https://www.hingehealth.com/gb/en/resources/articles/cat-cow/',
  },
  {
    id: 'thread-needle', name: 'Thread the Needle', phase: 'Wake the Spine', holdSec: 25, sides: 2, photo: 'thread-needle.jpg',
    why: 'Opens the upper back and the back of the shoulders.',
    cues: ['From hands and knees, lift one arm to the ceiling.', 'Slide it under your chest along the floor.', 'Rest that shoulder and the side of your head on the mat.', 'Hold and breathe.'],
    link: 'https://www.hingehealth.com/gb/en/resources/articles/thread-the-needle/',
  },
  {
    id: 'child-cobra', name: 'Child’s Pose to Cobra', phase: 'Wake the Spine', holdSec: 90, photo: 'child-cobra.jpg',
    why: 'Alternates rounding and arching the spine: lower back, then stomach and front of the hips.',
    cues: ['Hips back on heels, arms forward, forehead down.', 'Slide forward onto your stomach, hands under shoulders.', 'Press your chest up, hips stay down. Don’t look at the ceiling.', 'Flow between the two, 8–10 times.'],
    link: 'https://fitwill.app/exercise/9224/child-to-cobra-pose/',
  },
  {
    id: 'worlds-greatest', name: 'World’s Greatest Stretch', phase: 'Open the Hips', holdSec: 45, sides: 2, photo: 'worlds-greatest.jpg',
    why: 'Hits the hips, hamstrings, chest and upper back at once.',
    cues: ['From a high plank, step your foot outside your hand into a deep lunge.', 'Drop that elbow toward the inside of the foot.', 'Reach the same arm to the ceiling and open your chest.', 'Hold each position a few breaths. Back knee down if needed.'],
    link: 'https://redefiningstrength.com/worlds-greatest-stretch/',
    prompts: [[22, 'Now reach that arm up and open your chest.']],
  },
  {
    id: 'ninety-ninety', name: '90/90 Hold', phase: 'Open the Hips', holdSec: 36, sides: 2, photo: 'ninety-ninety.jpg',
    why: 'Stretches the hip in two directions at once.',
    cues: ['Front leg bent at 90° in front, back leg bent at 90° to the side.', 'Sit tall, then lean your chest slightly over the front shin.', 'Can’t keep your back straight? Put a rolled towel under the front hip.'],
    link: 'https://www.healthline.com/health/fitness/90-90-stretch',
  },
  {
    id: 'kneeling-hip-flexor', name: 'Kneeling Hip Flexor', phase: 'Open the Hips', holdSec: 35, sides: 2, photo: 'kneeling-hip-flexor.jpg',
    why: 'Lengthens the front of the hip that gets short from sitting.',
    cues: ['Kneel on one knee, other foot flat in front, knee over ankle.', 'Squeeze the glute of the kneeling leg, chest tall.', 'Shift your hips forward until you feel the front of the hip.'],
    link: 'https://www.hingehealth.com/resources/articles/kneeling-hip-flexor-stretch/',
  },
  {
    id: 'hamstring', name: 'Hamstring Stretch', phase: 'Open the Hips', holdSec: 30, sides: 2, photo: 'hamstring-l.webp',
    why: 'Lengthens the back of the thigh.',
    cues: ['Extend one leg out in front.', 'Hinge from the hips with a flat back.', 'Reach toward the toes.'],
  },
  {
    id: 'adductor', name: 'Adductor Stretch', phase: 'Open the Hips', holdSec: 30, sides: 2, photo: 'adductor-l.webp',
    why: 'Opens the inner thighs and groin.',
    cues: ['Wide stance or seated straddle.', 'Shift your weight away from the leg being stretched.', 'Keep the stretched leg straight.'],
  },
  {
    id: 'triceps-side', name: 'Overhead Triceps & Side Stretch', phase: 'Free the Shoulders', holdSec: 35, sides: 2, photo: 'triceps-side.jpg',
    why: 'Stretches the back of the arm and the long muscle down your side.',
    cues: ['Stand tall. Raise one arm and drop the hand between your shoulder blades.', 'Use the other hand to gently press that elbow back.', 'Lean slightly away to add a side stretch.'],
    link: 'https://livestrong.com/article/13778430-triceps-stretches',
  },
  {
    id: 'cross-body', name: 'Cross-Body Shoulder Stretch', phase: 'Free the Shoulders', holdSec: 25, sides: 2, photo: 'cross-body.jpg',
    why: 'Releases the back of the shoulder and upper back.',
    cues: ['Bring one arm straight across your chest at shoulder height.', 'Hook the other hand above the elbow and gently pull.', 'Shoulders down, don’t twist.'],
    link: 'https://planfit.ai/en/exercise/cross-body-shoulder-stretch',
  },
  {
    id: 'clasped-chest', name: 'Clasped-Hands Chest Stretch', phase: 'Free the Shoulders', holdSec: 65, photo: 'chest-opener.webp',
    why: 'Opens the chest and front of the shoulders, undoing the phone hunch.',
    cues: ['Stand tall, clasp your hands behind your back.', 'Shoulders back and down, squeeze the shoulder blades.', 'Lift your hands slightly away from your back.'],
    link: 'https://medlineplus.gov/ency/imagepages/19483.htm',
    prompts: [[22, 'Release and rest a few breaths, then clasp again.'], [44, 'One more: release, rest, clasp and lift.']],
  },
  {
    id: 'deep-squat', name: 'Deep Squat Hold', phase: 'Finish Standing', holdSec: 50, photo: 'deep-squat.jpg',
    why: 'Opens the hips, groin, ankles and lower back.',
    cues: ['Feet a little wider than shoulders, toes slightly out.', 'Sink your hips as low as you can, heels down if possible.', 'Press elbows against the inside of your knees.', 'Hard? Hold something steady or put a towel under your heels.'],
    link: 'https://www.caliverse.app/exercises/low-squat-hold-1168',
  },
  {
    id: 'rag-doll', name: 'Rag Doll to Roll-Up', phase: 'Finish Standing', holdSec: 55, photo: 'rag-doll.jpg',
    why: 'Releases the hamstrings and spine, then brings you up slowly to finish.',
    cues: ['Feet hip-width, knees bent, fold forward.', 'Hold opposite elbows and let your head hang.'],
    link: 'https://workoutlabs.com/yoga-poses-guide/rag-doll-uttanasana-variation/',
    prompts: [[37, 'Let go and roll up slowly, one section of spine at a time, then reach overhead.']],
  },
]

export const PHASES = [...new Set(STRETCHES.map((s) => s.phase))]

/** Seconds to get set before each hold (and to switch sides). */
export const PREP_SEC = 3

const HOLDS = STRETCHES.reduce((n, s) => n + (s.sides ?? 1), 0)

/** Whole session length: every hold plus its get-set gap. */
export const STRETCH_TOTAL_SEC = STRETCHES.reduce((n, s) => n + s.holdSec * (s.sides ?? 1), 0) + HOLDS * PREP_SEC

export const stretchPhoto = (s: Stretch) => (s.photo ? `/stretch/${s.photo}` : null)
