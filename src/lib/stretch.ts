// The Morning Stretch flow carried over from v1: 12 holds, in order.

export interface Stretch {
  id: string
  name: string
  desc: string
  cues: string[]
}

export const STRETCHES: Stretch[] = [
  { id: 'lumbar-rotation', name: 'Lumbar Rotation', desc: 'Gentle lower-spine rotation to open the morning.', cues: ['Lie on your back, knees bent.', 'Drop both knees slowly to one side.', 'Hold, breathe, return and switch.'] },
  { id: 'thoracic-rotation', name: 'Thoracic Rotation', desc: 'Mid-back opener.', cues: ['On all fours, hand at the back of your head.', 'Rotate elbow up toward the ceiling.', 'Follow the elbow with your eyes; alternate.'] },
  { id: 'upper-trap', name: 'Upper Trap Stretch', desc: 'Releases neck and shoulder tension.', cues: ['Sit or stand tall.', 'Gently tilt ear toward shoulder.', 'Hold, breathe, switch sides.'] },
  { id: 'cat-cow', name: 'Cat / Cow', desc: 'Spinal flexion-extension flow.', cues: ['On all fours.', 'Inhale: drop belly, lift gaze (cow).', 'Exhale: round spine, tuck chin (cat).'] },
  { id: 'hip-flexor-r', name: 'Hip Flexor (R)', desc: 'Half-kneel hip opener, right.', cues: ['Half-kneel, right knee down.', 'Tuck pelvis and press hips forward.', 'Hold tall through the chest.'] },
  { id: 'hamstring-l', name: 'Hamstring (L)', desc: 'Seated/standing hamstring, left.', cues: ['Extend the left leg.', 'Hinge from the hips, flat back.', 'Reach toward the toes.'] },
  { id: 'adductor-l', name: 'Adductor (L)', desc: 'Inner-thigh stretch, left.', cues: ['Wide stance or seated straddle.', 'Shift weight away from the left leg.', 'Keep the stretched leg straight.'] },
  { id: 'adductor-r', name: 'Adductor (R)', desc: 'Inner-thigh stretch, right.', cues: ['Wide stance or seated straddle.', 'Shift weight away from the right leg.', 'Keep the stretched leg straight.'] },
  { id: 'hip-flexor-l', name: 'Hip Flexor (L)', desc: 'Half-kneel hip opener, left.', cues: ['Half-kneel, left knee down.', 'Tuck pelvis and press hips forward.', 'Hold tall through the chest.'] },
  { id: 'hamstring-r', name: 'Hamstring (R)', desc: 'Seated/standing hamstring, right.', cues: ['Extend the right leg.', 'Hinge from the hips, flat back.', 'Reach toward the toes.'] },
  { id: 'chest-opener', name: 'Chest Opener', desc: 'Opens the front of the shoulders.', cues: ['Clasp hands at your lower back.', 'Lift the arms, squeeze shoulder blades.', 'Breathe into the chest.'] },
  { id: 'overhead-w', name: 'Overhead & W Stretch', desc: 'Lat reach into scapular retraction.', cues: ['Reach both arms overhead.', 'Pull elbows down into a "W".', 'Squeeze the mid-back, repeat.'] },
]

export const stretchPhoto = (id: string) => `/stretch/${id}.webp`
