// ─────────────────────────────────────────────────────────────────────────
// Exercise library — transcribed from PRD Appendix A. Each movement carries a
// text how-to (offline) and a placeholder pixel-media slot (you add the photo).
// Online video refs from the appendix are attached where given.
// ─────────────────────────────────────────────────────────────────────────

import type { Exercise } from '../engine/types'

let seed = 1
const s = () => seed++

// Convenience builder to keep this readable.
function ex(
  id: string,
  name: string,
  category: Exercise['category'],
  description: string,
  howTo: string[],
  extra: Partial<Exercise> = {},
): Exercise {
  return {
    id,
    name,
    category,
    description,
    howTo,
    spriteSeed: s(),
    ...extra,
  }
}

const WARMUP_VID = { url: 'https://youtu.be/_6-k5-w1bZw' }
const COOLDOWN_VID = { url: 'https://www.youtube.com/watch?v=NUIMZ4IcBy8' }
const MOBILITY_VID = { url: 'https://youtu.be/bg5ltVL3fok' }
const MITT_VID = { url: 'https://youtu.be/ioZYglRIVzA' }
const HIIT_VID = { url: 'https://youtu.be/npofZutKsfA' }

export const EXERCISES: Exercise[] = [
  // ── A.1 Morning stretch (every day) ──────────────────────────────────────
  ex('lumbar-rotation', 'Lumbar Rotation', 'stretch', 'Gentle lower-spine rotation to open the morning.', ['Lie on your back, knees bent.', 'Drop both knees slowly to one side.', 'Hold, breathe, return and switch.'], { photoUrl: '/images/exercises/lumbar-rotation.webp', targetMuscles: ['lower back', 'obliques'] }),
  ex('thoracic-rotation', 'Thoracic Rotation', 'stretch', 'Mid-back opener.', ['On all fours, hand behind head.', 'Rotate elbow up toward the ceiling.', 'Follow the elbow with your eyes; alternate.'], { photoUrl: '/images/exercises/thoracic-rotation.webp', targetMuscles: ['thoracic spine'] }),
  ex('upper-trap', 'Upper Trap Stretch', 'stretch', 'Releases neck and shoulder tension.', ['Sit or stand tall.', 'Gently tilt ear toward shoulder.', 'Hold, breathe, switch sides.'], { photoUrl: '/images/exercises/upper-trap.webp', targetMuscles: ['traps', 'neck'] }),
  ex('cat-cow', 'Cat / Cow', 'stretch', 'Spinal flexion-extension flow.', ['On all fours.', 'Inhale: drop belly, lift gaze (cow).', 'Exhale: round spine, tuck chin (cat).'], { photoUrl: '/images/exercises/cat-cow.webp', targetMuscles: ['spine'] }),
  ex('hip-flexor-r', 'Hip Flexor (R)', 'stretch', 'Half-kneel hip opener, right.', ['Half-kneel, right knee down.', 'Tuck pelvis and press hips forward.', 'Hold tall through the chest.'], { photoUrl: '/images/exercises/hip-flexor-r.webp', targetMuscles: ['hip flexors'] }),
  ex('hamstring-l', 'Hamstring (L)', 'stretch', 'Seated/standing hamstring, left.', ['Extend the left leg.', 'Hinge from the hips, flat back.', 'Reach toward the toes.'], { photoUrl: '/images/exercises/hamstring-l.webp', targetMuscles: ['hamstrings'] }),
  ex('adductor-l', 'Adductor (L)', 'stretch', 'Inner-thigh stretch, left.', ['Wide stance or seated straddle.', 'Shift weight away from the left leg.', 'Keep the stretched leg straight.'], { photoUrl: '/images/exercises/adductor-l.webp', targetMuscles: ['adductors'] }),
  ex('adductor-r', 'Adductor (R)', 'stretch', 'Inner-thigh stretch, right.', ['Wide stance or seated straddle.', 'Shift weight away from the right leg.', 'Keep the stretched leg straight.'], { photoUrl: '/images/exercises/adductor-r.webp', targetMuscles: ['adductors'] }),
  ex('hip-flexor-l', 'Hip Flexor (L)', 'stretch', 'Half-kneel hip opener, left.', ['Half-kneel, left knee down.', 'Tuck pelvis and press hips forward.', 'Hold tall through the chest.'], { photoUrl: '/images/exercises/hip-flexor-l.webp', targetMuscles: ['hip flexors'] }),
  ex('hamstring-r', 'Hamstring (R)', 'stretch', 'Seated/standing hamstring, right.', ['Extend the right leg.', 'Hinge from the hips, flat back.', 'Reach toward the toes.'], { photoUrl: '/images/exercises/hamstring-r.webp', targetMuscles: ['hamstrings'] }),
  ex('chest-opener', 'Chest Opener', 'stretch', 'Opens the front of the shoulders.', ['Clasp hands behind your back.', 'Lift the arms, squeeze shoulder blades.', 'Breathe into the chest.'], { photoUrl: '/images/exercises/chest-opener.webp', targetMuscles: ['chest', 'shoulders'] }),
  ex('overhead-w', 'Overhead & W Stretch', 'stretch', 'Lat reach into scapular retraction.', ['Reach both arms overhead.', 'Pull elbows down into a "W".', 'Squeeze the mid-back, repeat.'], { photoUrl: '/images/exercises/overhead-w.webp', targetMuscles: ['lats', 'mid-back'] }),

  // ── A.2 Warmup (30s/5s) ──────────────────────────────────────────────────
  ex('jumping-jacks', 'Jumping Jacks', 'warmup', 'Full-body pulse-raiser.', ['Jump feet out, arms overhead.', 'Jump back in.', 'Keep a steady rhythm.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('cross-toe-touches', 'Cross Toe Touches', 'warmup', 'Dynamic hamstring + rotation.', ['Stand wide.', 'Reach right hand to left toe and up.', 'Alternate fluidly.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('squat-front-kick', 'Squat + Front Kick', 'warmup', 'Squat into an alternating kick.', ['Squat down.', 'Stand and kick one leg forward.', 'Alternate kicks.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('chest-opener-butt-kicks', 'Chest Opener + Butt Kicks', 'warmup', 'Open chest while heeling the glutes.', ['Jog in place kicking heels to glutes.', 'Swing arms open across the chest.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('arm-circles', 'Arm Circles', 'warmup', 'Shoulder mobilizer; switch halfway.', ['Arms out wide.', 'Small-to-large circles forward.', 'Reverse halfway through.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('standing-knee-drives', 'Standing Knee Drives', 'warmup', 'March driving knees high.', ['Drive one knee up to hip height.', 'Alternate with control.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('inchworm-pushup', 'Inchworm Push-up', 'warmup', 'Walk out, one push-up, walk in.', ['Hinge and walk hands to plank.', 'One push-up.', 'Walk hands back, stand.'], { photoUrl: '/images/exercises/inchworm-pushup.webp', defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('downdog-knee-tuck', 'Down Dog + Knee Tuck', 'warmup', 'Down dog into a knee-to-nose tuck.', ['Press into downward dog.', 'Draw one knee toward the nose.', 'Alternate.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('lateral-lunges', 'Lateral Lunges', 'warmup', 'Side-to-side lunges.', ['Step wide to one side.', 'Sit into that hip, other leg straight.', 'Alternate.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),
  ex('high-knees', 'High Knees', 'warmup', 'Fast knee-drive run in place.', ['Run in place driving knees high.', 'Stay light on the balls of the feet.'], { defaultPrescription: '30s / 5s', videoRef: WARMUP_VID }),

  // ── A.3 Cooldown ──────────────────────────────────────────────────────────
  ex('downward-dog', 'Downward Dog', 'cooldown', 'Lengthens the posterior chain.', ['Hands and feet down, hips high.', 'Press heels toward the floor.', 'Breathe and relax the neck.'], { photoUrl: '/images/exercises/downward-dog.webp', videoRef: COOLDOWN_VID }),
  ex('cobra', 'Cobra', 'cooldown', 'Gentle back extension.', ['Lie face down, hands under shoulders.', 'Press chest up, elbows soft.', 'Keep hips grounded.'], { photoUrl: '/images/exercises/cobra.webp', videoRef: COOLDOWN_VID }),
  ex('quad-r', 'Quad Stretch (R)', 'cooldown', 'Standing quad, right.', ['Pull the right heel to the glute.', 'Knees together, hips forward.'], { videoRef: COOLDOWN_VID }),
  ex('quad-l', 'Quad Stretch (L)', 'cooldown', 'Standing quad, left.', ['Pull the left heel to the glute.', 'Knees together, hips forward.'], { videoRef: COOLDOWN_VID }),
  ex('seated-glute-r', 'Seated Glute (R)', 'cooldown', 'Figure-4 glute, right.', ['Seated, cross right ankle over left knee.', 'Hinge forward gently.'], { photoUrl: '/images/exercises/seated-glute-r.webp', videoRef: COOLDOWN_VID }),
  ex('seated-glute-l', 'Seated Glute (L)', 'cooldown', 'Figure-4 glute, left.', ['Seated, cross left ankle over right knee.', 'Hinge forward gently.'], { photoUrl: '/images/exercises/seated-glute-l.webp', videoRef: COOLDOWN_VID }),
  ex('cat-cow-cd', 'Cat / Cow', 'cooldown', 'Spinal decompression flow.', ['On all fours.', 'Flow between rounding and arching.'], { photoUrl: '/images/exercises/cat-cow-cd.webp', videoRef: COOLDOWN_VID }),
  ex('supine-twist-r', 'Supine Spinal Twist (R)', 'cooldown', 'Lying twist, right.', ['On your back, drop knees right.', 'Open arms wide, gaze left.'], { photoUrl: '/images/exercises/supine-twist-r.webp', videoRef: COOLDOWN_VID }),
  ex('supine-twist-l', 'Supine Spinal Twist (L)', 'cooldown', 'Lying twist, left.', ['On your back, drop knees left.', 'Open arms wide, gaze right.'], { photoUrl: '/images/exercises/supine-twist-l.webp', videoRef: COOLDOWN_VID }),
  ex('wide-forward-fold', 'Wide-Stance Forward Fold', 'cooldown', 'Standing wide fold.', ['Feet wide, hinge at the hips.', 'Let the head hang heavy.'], { photoUrl: '/images/exercises/wide-forward-fold.webp', videoRef: COOLDOWN_VID }),

  // ── A.4 Mobility A / B ─────────────────────────────────────────────────────
  ex('hang', 'Bar Hang', 'mobility', 'Passive/active hang for shoulders & grip.', ['Hang from a bar, full grip.', 'Relax shoulders, then engage scapula.'], { defaultPrescription: '30–60s', equipment: ['bar'], videoRef: MOBILITY_VID }),
  ex('deep-squat', 'Deep Squat Hold', 'mobility', 'Bottom-of-squat ankle/hip opener.', ['Sit into a deep squat.', 'Elbows press knees out.', 'Stay tall through the chest.'], { defaultPrescription: '30–60s', videoRef: MOBILITY_VID }),
  ex('couch-stretch', 'Couch Stretch', 'mobility', 'Aggressive hip-flexor + quad.', ['Rear foot up against a wall.', 'Sink hips down, stay upright.'], { photoUrl: '/images/exercises/couch-stretch.webp', defaultPrescription: '30–60s', videoRef: MOBILITY_VID }),
  ex('jefferson-curl', 'Jefferson Curl', 'mobility', 'Segmental spinal flexion under load.', ['Stand tall on a step.', 'Roll down one vertebra at a time.', 'Reverse to stack the spine.'], { photoUrl: '/images/exercises/jefferson-curl.webp', defaultPrescription: '30–60s', videoRef: MOBILITY_VID }),
  ex('crab-stretch', 'Crab Stretch', 'mobility', 'Anterior shoulder + chest opener.', ['Sit, hands behind, fingers back.', 'Lift hips into a reverse tabletop.'], { photoUrl: '/images/exercises/crab-stretch.webp', defaultPrescription: '10 reps', videoRef: MOBILITY_VID }),
  ex('pigeon-hinge', 'Elevated Pigeon Hinge', 'mobility', 'Glute/hip external rotation.', ['Shin on an elevated surface.', 'Hinge over the front shin.', '10 reps + 10s hold.'], { photoUrl: '/images/exercises/pigeon-hinge.webp', defaultPrescription: '10 + 10s', videoRef: MOBILITY_VID }),
  ex('sl-hip-hinge', 'Straight-Leg Hip Hinge', 'mobility', 'Hamstring-loaded hinge.', ['Stand tall, slight knee bend.', 'Hinge back, flat spine.', '10 reps + 10s hold.'], { photoUrl: '/images/exercises/sl-hip-hinge.webp', defaultPrescription: '10 + 10s', videoRef: MOBILITY_VID }),
  ex('wall-butterfly', 'Wall Butterfly', 'mobility', 'Adductor + hip opener at the wall.', ['Lie with hips at the wall.', 'Soles together, knees fall open.', '10 reps + 10s hold.'], { defaultPrescription: '10 + 10s', videoRef: MOBILITY_VID }),
  ex('hip-ir-9090', '90/90 Hip IR Isometrics', 'mobility', 'Internal-rotation strength in 90/90.', ['Sit in a 90/90 position.', 'Press the rear shin down.', '5–10 controlled reps.'], { photoUrl: '/images/exercises/hip-ir-9090.webp', defaultPrescription: '5–10 reps', videoRef: MOBILITY_VID }),
  ex('butcher-block', 'Butcher Block', 'mobility', 'Overhead + thoracic extension.', ['Elbows on a bench, hands overhead.', 'Sink the chest toward the floor.'], { photoUrl: '/images/exercises/butcher-block.webp', defaultPrescription: '30–60s', videoRef: MOBILITY_VID }),

  // ── A.7 Calisthenics — Block A & B mains + skills ──────────────────────────
  ex('pushups', 'Push-ups', 'main', 'Standard horizontal press.', ['Plank, hands under shoulders.', 'Lower with elbows ~45°.', 'Press to lockout.'], { defaultPrescription: '4×10–15', targetMuscles: ['chest', 'triceps'], commonMistakes: ['Flaring elbows', 'Sagging hips'] }),
  ex('pullups', 'Pull-ups', 'main', 'Vertical pull from a bar.', ['Dead hang, full grip.', 'Pull chest to bar, lead with elbows.', 'Lower under control.'], { defaultPrescription: '4×8–12', equipment: ['bar'], substitutionOfId: 'inverted-rows', targetMuscles: ['lats', 'biceps'] }),
  ex('inverted-rows', 'Inverted / Table Rows', 'main', 'Horizontal bodyweight pull.', ['Lie under a bar or table.', 'Pull chest to the edge.', 'Keep the body rigid.'], { photoUrl: '/images/exercises/inverted-rows.webp', defaultPrescription: '4×6–10', targetMuscles: ['back', 'biceps'] }),
  ex('dips', 'Dips', 'main', 'Vertical press on parallel supports.', ['Support on two surfaces.', 'Lower until shoulders ≈ elbows.', 'Press to lockout.'], { defaultPrescription: '4×10–15', targetMuscles: ['chest', 'triceps'] }),
  ex('pike-pushups', 'Pike Push-ups', 'main', 'Overhead-press progression.', ['Pike hips high, head between hands.', 'Lower the crown toward the floor.', 'Press back up.'], { photoUrl: '/images/exercises/pike-pushups.webp', defaultPrescription: '3×8–12', targetMuscles: ['shoulders'] }),
  ex('plank-to-pushup', 'Plank-to-Push-up', 'main', 'Forearm plank up to a push-up.', ['Start on forearms.', 'Press up one arm at a time.', 'Lower back down, alternate lead.'], { photoUrl: '/images/exercises/plank-to-pushup.webp', defaultPrescription: '3×10–15', targetMuscles: ['core', 'triceps'] }),
  ex('decline-pushups', 'Decline Push-ups', 'main', 'Feet-elevated push-up (Block B).', ['Feet on a raised surface.', 'Lower with control.', 'Press to lockout.'], { photoUrl: '/images/exercises/decline-pushups.webp', defaultPrescription: '4×10–15', targetMuscles: ['upper chest', 'shoulders'] }),
  ex('archer-pushups', 'Archer Push-ups', 'main', 'Unilateral push-up (Block B).', ['Wide hands.', 'Lower toward one hand, other arm straight.', 'Alternate sides.'], { photoUrl: '/images/exercises/archer-pushups.webp', defaultPrescription: '3×6–10/side', targetMuscles: ['chest', 'triceps'] }),
  ex('squats', 'Squats', 'main', 'Bodyweight squat.', ['Feet shoulder-width.', 'Sit hips back and down.', 'Drive through the floor.'], { defaultPrescription: '4×20–25', targetMuscles: ['quads', 'glutes'] }),
  ex('lunges', 'Lunges', 'main', 'Alternating forward lunge.', ['Step forward, drop the back knee.', 'Push back to standing.', 'Alternate legs.'], { defaultPrescription: '4×15–20/leg', targetMuscles: ['quads', 'glutes'] }),
  ex('glute-bridges', 'Glute Bridges', 'main', 'Supine hip extension.', ['On your back, knees bent.', 'Drive hips up, squeeze glutes.', 'Lower with control.'], { photoUrl: '/images/exercises/glute-bridges.webp', defaultPrescription: '3×20–25', targetMuscles: ['glutes', 'hamstrings'] }),
  ex('calf-raises', 'Calf Raises', 'main', 'Standing heel raise.', ['Rise onto the balls of the feet.', 'Pause at the top.', 'Lower slowly.'], { defaultPrescription: '3×20–25', targetMuscles: ['calves'] }),
  ex('hanging-leg-raises', 'Hanging Leg Raises', 'main', 'Hanging core flexion.', ['Hang from a bar.', 'Raise legs to hip height or higher.', 'Lower without swinging.'], { defaultPrescription: '3×8–12', equipment: ['bar'], targetMuscles: ['core'] }),
  ex('russian-twists', 'Russian Twists', 'main', 'Seated rotational core.', ['Sit, lean back, feet up.', 'Rotate side to side.', 'Control the tempo.'], { photoUrl: '/images/exercises/russian-twists.webp', defaultPrescription: '3×20/side', targetMuscles: ['obliques'] }),
  ex('pistol-squats', 'Assisted Pistol Squats', 'main', 'Single-leg squat (Block B).', ['Hold a support for balance.', 'Lower on one leg.', 'Drive back up.'], { photoUrl: '/images/exercises/pistol-squats.webp', defaultPrescription: '4×6–10/leg', targetMuscles: ['quads', 'glutes'] }),
  ex('bulgarian-split', 'Bulgarian Split Squats', 'main', 'Rear-foot-elevated split squat (Block B).', ['Rear foot on a bench.', 'Lower the front thigh to parallel.', 'Drive up.'], { photoUrl: '/images/exercises/bulgarian-split.webp', defaultPrescription: '4×10–15/leg', targetMuscles: ['quads', 'glutes'] }),
  ex('sl-glute-bridge', 'Single-Leg Glute Bridge', 'main', 'Unilateral hip extension (Block B).', ['One foot down, other leg extended.', 'Bridge up on one leg.', 'Lower with control.'], { photoUrl: '/images/exercises/sl-glute-bridge.webp', defaultPrescription: '3×15–20/leg', targetMuscles: ['glutes'] }),
  ex('windshield-wipers', 'Windshield Wipers', 'main', 'Rotational core (Block B).', ['On your back, legs up.', 'Rotate legs side to side.', 'Keep shoulders down.'], { photoUrl: '/images/exercises/windshield-wipers.webp', defaultPrescription: '3×10–15/side', targetMuscles: ['obliques', 'core'] }),

  // Skills
  ex('wall-handstand', 'Wall Handstand', 'skill', 'Chest-to-wall handstand hold.', ['Walk feet up the wall.', 'Stack shoulders over hands.', 'Hold, breathe, come down safely.'], { defaultPrescription: '3×20–30s', targetMuscles: ['shoulders', 'core'] }),
  ex('tuck-lsit', 'Tuck L-Sit', 'skill', 'Tucked L-sit on supports.', ['Support on the floor or paralettes.', 'Lift hips, tuck the knees.', 'Hold.'], { photoUrl: '/images/exercises/tuck-lsit.webp', defaultPrescription: '3×10–15s', targetMuscles: ['core', 'hip flexors'] }),
  ex('free-handstand', 'Free Handstand', 'skill', 'Freestanding handstand (Block B).', ['Kick up to balance.', 'Fingertip-correct the balance.', 'Bail by cartwheeling out.'], { defaultPrescription: '3×20–30s', targetMuscles: ['shoulders', 'core'] }),
  ex('lsit-hold', 'L-Sit Hold', 'skill', 'Full L-sit (Block B).', ['Support tall, legs straight out.', 'Push the floor away.', 'Hold.'], { photoUrl: '/images/exercises/lsit-hold.webp', defaultPrescription: '3×10–20s', targetMuscles: ['core', 'hip flexors'] }),
  ex('muscle-up-prog', 'Muscle-Up Progressions', 'skill', 'Jumping/band muscle-up work (Block B).', ['Explosive pull to the transition.', 'Roll the wrists over the bar.', 'Press out.'], { defaultPrescription: '3×3–5', equipment: ['bar'] }),

  // ── A.8 Bar-free substitutions ─────────────────────────────────────────────
  ex('scapular-pushups', 'Scapular Push-ups', 'main', 'Pull initiator (bar-free sub).', ['Plank position, arms straight.', 'Protract and retract the shoulder blades.'], { photoUrl: '/images/exercises/scapular-pushups.webp', substitutionOfId: 'pullups', targetMuscles: ['serratus', 'scapula'] }),
  ex('superman-hold', 'Superman Hold', 'main', 'Posterior-chain hold (bar-free sub).', ['Lie face down.', 'Lift arms, chest, and legs.', 'Hold and squeeze.'], { photoUrl: '/images/exercises/superman-hold.webp', substitutionOfId: 'pullups', targetMuscles: ['lower back', 'glutes'] }),
  ex('ytw-raises', 'YTW Raises', 'main', 'Rear-delt / scapular raises (bar-free sub).', ['Bent over or prone.', 'Trace Y, then T, then W shapes.', 'Squeeze the mid-back.'], { photoUrl: '/images/exercises/ytw-raises.webp', substitutionOfId: 'pullups', targetMuscles: ['rear delts', 'mid-back'] }),

  // ── Conditioning ───────────────────────────────────────────────────────────
  ex('jump-rope', 'Jump Rope', 'conditioning', 'Midday rope conditioning, 2–10 min.', ['Light bounces on the balls of the feet.', 'Wrists turn the rope, not the arms.', 'Build to continuous skipping.'], { defaultPrescription: '2–10 min' }),

  // ── MITT (sampled key moves; full list in Appendix A.5) ────────────────────
  ex('squat-jacks', 'Squat Jacks', 'conditioning', 'MITT — squat in/out jacks.', ['Squat low.', 'Jump feet in and out staying low.'], { photoUrl: '/images/exercises/squat-jacks.webp', defaultPrescription: '40s / 20s', videoRef: MITT_VID }),
  ex('half-burpees', 'Half Burpees', 'conditioning', 'MITT/HIIT — plank-jump conditioning.', ['Hands down, jump feet to plank.', 'Jump feet back in, stand.'], { defaultPrescription: '40s / 20s', videoRef: MITT_VID }),
  ex('curtsy-lunges', 'Curtsy Lunges', 'conditioning', 'MITT — cross-behind lunge.', ['Step one leg behind and across.', 'Lower, then drive up.', 'Alternate.'], { photoUrl: '/images/exercises/curtsy-lunges.webp', defaultPrescription: '40s / 20s', videoRef: MITT_VID }),

  // ── HIIT (sampled key moves; full list in Appendix A.6) ────────────────────
  ex('jump-squats', 'Jump Squats', 'conditioning', 'HIIT — explosive squat.', ['Squat, then jump.', 'Land soft and re-absorb.'], { defaultPrescription: '40s / 20s', videoRef: HIIT_VID }),
  ex('shoulder-taps', 'Shoulder Taps', 'conditioning', 'HIIT — anti-rotation plank.', ['High plank, wide feet.', 'Tap opposite shoulder, stay square.'], { defaultPrescription: '40s / 20s', videoRef: HIIT_VID }),
  ex('mountain-climbers', 'Cross Mountain Climbers', 'conditioning', 'HIIT — knee-to-opposite-elbow.', ['High plank.', 'Drive knee toward the opposite elbow.', 'Alternate fast.'], { defaultPrescription: '40s / 20s', videoRef: HIIT_VID }),

  // ── Muay Thai ───────────────────────────────────────────────────────────
  ex('shadow-boxing', 'Shadow Boxing — Jab/Cross', 'conditioning', 'Muay Thai — hands combo at range.', ['Stance up, hands guarding the chin.', 'Snap the jab, rotate into the cross.', 'Reset guard between reps.'], { defaultPrescription: '40s / 20s' }),
  ex('teep', 'Teep (Push Kick)', 'conditioning', 'Muay Thai — the range-control kick.', ['Drive the knee up, then snap the heel through.', 'Push, don’t swing — think "stomp the door".', 'Recover balance, alternate legs.'], { defaultPrescription: '40s / 20s' }),
  ex('roundhouse-kicks', 'Roundhouse Kicks', 'conditioning', 'Muay Thai — hip-driven power kick.', ['Pivot fully on the plant foot.', 'Swing the shin through the target.', 'Alternate sides each rep.'], { defaultPrescription: '40s / 20s' }),
  ex('knee-strikes', 'Knee Strikes', 'conditioning', 'Muay Thai — clinch-range knee.', ['Drive the hips forward into the knee.', 'Pull an imaginary clinch down as you strike.', 'Alternate legs.'], { defaultPrescription: '40s / 20s' }),
  ex('elbow-strikes', 'Elbow Strikes', 'conditioning', 'Muay Thai — close-range elbow combo.', ['Rotate the hips into a horizontal elbow.', 'Chain into a downward elbow.', 'Reset guard, alternate sides.'], { defaultPrescription: '40s / 20s' }),
  ex('switch-kicks', 'Switch Kicks', 'conditioning', 'Muay Thai — switch-stance power kick.', ['Switch your stance with a small hop.', 'Fire the rear-leg kick immediately after.', 'Keep hands up through the switch.'], { defaultPrescription: '40s / 20s' }),
]

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
)
