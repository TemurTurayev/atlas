import type { Rng } from '../../random/rng'
import { linear } from '../../math/latex'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Kinematics describes motion using position $x(t)$, velocity $v(t) = \\frac{dx}{dt}$, and acceleration $a(t) = \\frac{dv}{dt}$.
Displacement over an interval $[t_1, t_2]$ is given by $\\Delta x = \\int_{t_1}^{t_2} v(t) \\, dt$.
For constant acceleration $a$: $v = v_0 + at$, $x = v_0 t + \\frac{1}{2} a t^2$, and $v^2 = v_0^2 + 2a \\Delta x$.
Stopping distance for initial speed $v_0$ and deceleration $a$ is $d = \\frac{v_0^2}{2a}$.
Common mistakes: Confusing displacement with total distance, or forgetting that acceleration can be negative when slowing down.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['const_accel_v', 'poly_v_at_t', 'displacement_integral'] as const)

  if (shape === 'const_accel_v') {
    const v0 = rng.int(0, 30)
    const a = rng.int(1, 8)
    const t = rng.int(2, 12)
    const v = v0 + a * t

    return {
      statement: `A car moves at $v_0 = ${v0}$ m/s and accelerates at $a = ${a}$ m/s$^2$ for $t = ${t}$ s. Find its final velocity in m/s.`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Use the kinematic equation for final velocity under constant acceleration:' },
        { text: 'Substitute the given values:', tex: `v = v_0 + at = ${v0} + ${a} \\cdot ${t} = ${v}` },
      ],
      hints: [
        'Recall $v = v_0 + at$.',
        `Multiply acceleration $a = ${a}$ m/s$^2$ by time $t = ${t}$ s and add initial speed $v_0 = ${v0}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'poly_v_at_t') {
    const c2 = rng.int(1, 6)
    const c1 = rng.int(1, 12)
    const c0 = rng.int(0, 25)
    const t0 = rng.int(1, 8)
    const v = 2 * c2 * t0 + c1

    const terms: string[] = []
    terms.push(c2 === 1 ? 't^2' : `${c2}t^2`)
    terms.push(c1 === 1 ? 't' : `${c1}t`)
    if (c0 !== 0) terms.push(String(c0))
    const polyLatex = terms.join(' + ')

    return {
      statement: `The position of a particle is given by $x(t) = ${polyLatex}$ meters, where $t$ is in seconds. Find its velocity at $t = ${t0}$ s in m/s.`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Velocity is the derivative of position with respect to time: $v(t) = \\frac{dx}{dt}$.' },
        { text: 'Differentiate $x(t)$ and evaluate:', tex: `v(${t0}) = 2 \\cdot ${c2} \\cdot ${t0} + ${c1} = ${v}` },
      ],
      hints: [
        'Differentiate $x(t)$ to find $v(t)$.',
        `$v(t) = ${2 * c2}t + ${c1}$. Now substitute $t = ${t0}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const aCoeff = 2 * rng.int(1, 5)
  const b = rng.int(0, 10)
  const t0 = rng.int(2, 8)
  const dx = (aCoeff / 2) * t0 * t0 + b * t0
  const vLatex = linear(aCoeff, b, 't')

  return {
    statement: `A body moves with velocity $v(t) = ${vLatex}$ m/s. Find its displacement from $t = 0$ s to $t = ${t0}$ s in meters.`,
    answer: { kind: 'number', value: String(dx) },
    solution: [
      { text: 'Displacement is the integral of velocity over the time interval:' },
      { text: 'Integrate:', tex: `\\Delta x = \\int_0^{${t0}} (${vLatex}) \\, dt = \\frac{${aCoeff}}{2} \\cdot ${t0}^2 + ${b} \\cdot ${t0} = ${dx}` },
    ],
    hints: [
      'Displacement is $\\Delta x = \\int_{t_1}^{t_2} v(t) \\, dt$.',
      `Integrate $v(t)$ from $0$ to $${t0}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['stopping_distance', 'max_height_time', 'time_v_zero_poly', 'displacement_given_v0_a_t'] as const)

  if (shape === 'stopping_distance') {
    const a = rng.int(2, 6)
    const k = rng.int(2, 10)
    const v0 = 2 * a * k
    const d = 2 * a * k * k

    return {
      statement: `A car traveling at $v_0 = ${v0}$ m/s brakes with a constant deceleration of $a = ${a}$ m/s$^2$ until it stops. Find its stopping distance in meters.`,
      answer: { kind: 'number', value: String(d) },
      solution: [
        { text: 'Use $v^2 = v_0^2 - 2ad$ with final velocity $v = 0$:' },
        { text: 'Solve for distance $d$:', tex: `d = \\frac{v_0^2}{2a} = \\frac{${v0}^2}{2 \\cdot ${a}} = ${d}` },
      ],
      hints: [
        'Use the kinematic equation $v^2 = v_0^2 + 2a\\Delta x$.',
        `Here $v = 0$, so $d = \\frac{v_0^2}{2a} = \\frac{${v0 * v0}}{${2 * a}}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'max_height_time') {
    const v0 = 10 * rng.int(1, 10)
    const hMax = (v0 * v0) / 20

    return {
      statement: `A ball is thrown vertically upward with an initial velocity of $v_0 = ${v0}$ m/s. Find the maximum height reached in meters. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(hMax) },
      solution: [
        { text: 'At maximum height, $v = 0$. Use $v^2 = v_0^2 - 2gh$:' },
        { text: 'Compute maximum height:', tex: `h = \\frac{v_0^2}{2g} = \\frac{${v0}^2}{20} = ${hMax}` },
      ],
      hints: [
        'At the top of the trajectory, vertical velocity becomes zero.',
        `Use $h = \\frac{v_0^2}{2g} = \\frac{${v0 * v0}}{20}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'time_v_zero_poly') {
    const a = rng.int(2, 6)
    const t0 = rng.int(2, 10)
    const b = a * t0
    const vLatex = `-${a}t + ${b}`

    return {
      statement: `The velocity of a particle is $v(t) = ${vLatex}$ m/s. Find the time $t > 0$ when the particle momentarily comes to rest, in seconds.`,
      answer: { kind: 'number', value: String(t0) },
      solution: [
        { text: 'Set velocity $v(t) = 0$ and solve for $t$:' },
        { text: 'Solve:', tex: `${vLatex} = 0 \\implies t = \\frac{${b}}{${a}} = ${t0}` },
      ],
      hints: [
        'A particle is at rest when $v(t) = 0$.',
        `Solve $-${a}t + ${b} = 0$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const v0 = 5 * rng.int(0, 6)
  const a = 2 * rng.int(1, 4)
  const t = rng.int(2, 8)
  const x = v0 * t + 0.5 * a * t * t

  return {
    statement: `A vehicle moving at $v_0 = ${v0}$ m/s accelerates at $a = ${a}$ m/s$^2$ for $t = ${t}$ s. Find the total distance traveled in meters.`,
    answer: { kind: 'number', value: String(x) },
    solution: [
      { text: 'Use the displacement formula $x = v_0 t + \\frac{1}{2} a t^2$:' },
      { text: 'Compute distance:', tex: `x = ${v0} \\cdot ${t} + \\frac{1}{2} \\cdot ${a} \\cdot ${t}^2 = ${x}` },
    ],
    hints: [
      'Recall $x = v_0 t + \\frac{1}{2} a t^2$.',
      `Substitute $v_0 = ${v0}$, $a = ${a}$, and $t = ${t}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['initial_speed_v2_eq', 'two_phase_motion', 'vt_graph_concept_choice'] as const)

  if (shape === 'initial_speed_v2_eq') {
    const a = rng.pick([1, 2, 3])
    const v = rng.int(4, 15)
    const mult = rng.int(1, 4)
    const v0 = v + 6 * mult
    const diff = v0 * v0 - v * v
    const d = diff / (2 * a)

    return {
      statement: `A vehicle decelerates at $a = ${a}$ m/s$^2$ over a distance of $d = ${d}$ m to reach a final speed of $v = ${v}$ m/s. Find its initial speed in m/s.`,
      answer: { kind: 'number', value: String(v0) },
      solution: [
        { text: 'Use the kinematic formula $v^2 = v_0^2 - 2ad$:' },
        { text: 'Rearrange for initial speed $v_0$:', tex: `v_0 = \\sqrt{v^2 + 2ad} = \\sqrt{${v}^2 + 2 \\cdot ${a} \\cdot ${d}} = ${v0}` },
      ],
      hints: [
        'Use $v^2 = v_0^2 - 2ad$.',
        `$v_0 = \\sqrt{v^2 + 2ad} = \\sqrt{${v * v} + ${2 * a * d}}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'two_phase_motion') {
    const a1 = rng.int(1, 5)
    const t1 = 2 * rng.int(1, 4)
    const v1 = a1 * t1
    const a2 = rng.pick([1, 2, 4, 8])
    const d1 = 0.5 * a1 * t1 * t1
    const d2 = (v1 * v1) / (2 * a2)
    const totalD = d1 + d2

    return {
      statement: `A car starts from rest, accelerates at $a_1 = ${a1}$ m/s$^2$ for $t_1 = ${t1}$ s, and then brakes at $a_2 = ${a2}$ m/s$^2$ until it stops. Find the total distance traveled in meters.`,
      answer: { kind: 'number', value: String(totalD) },
      solution: [
        { text: 'Compute maximum speed $v_1 = a_1 t_1$ and distances for both acceleration and braking phases:' },
        { text: 'Total distance $d = d_1 + d_2$:', tex: `d = \\frac{1}{2} a_1 t_1^2 + \\frac{v_1^2}{2 a_2} = \\frac{1}{2} \\cdot ${a1} \\cdot ${t1}^2 + \\frac{${v1}^2}{2 \\cdot ${a2}} = ${totalD}` },
      ],
      hints: [
        'Calculate distance during acceleration ($d_1 = \\frac{1}{2} a_1 t_1^2$) and max velocity $v_1 = a_1 t_1$.',
        'Calculate braking distance $d_2 = \\frac{v_1^2}{2 a_2}$ and add $d_1 + d_2$.',
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const conceptType = rng.pick(['v_t_area', 'x_t_slope', 'v_t_slope'] as const)
  let statementText: string
  let correctLabel: string
  let correctId: string

  if (conceptType === 'v_t_area') {
    statementText = 'What physical quantity is represented by the area under a velocity-time graph?'
    correctId = 'disp'
    correctLabel = 'Displacement'
  } else if (conceptType === 'x_t_slope') {
    statementText = 'What physical quantity is represented by the slope of a position-time graph?'
    correctId = 'vel'
    correctLabel = 'Velocity'
  } else {
    statementText = 'What physical quantity is represented by the slope of a velocity-time graph?'
    correctId = 'acc'
    correctLabel = 'Acceleration'
  }

  const allOpts: ChoiceOption[] = [
    { id: 'disp', label: 'Displacement' },
    { id: 'vel', label: 'Velocity' },
    { id: 'acc', label: 'Acceleration' },
    { id: 'jerk', label: 'Jerk' },
  ]
  const options = rng.shuffle(allOpts)

  return {
    statement: statementText,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `By definition, ${correctLabel.toLowerCase()} corresponds to this graphical feature.` },
    ],
    hints: [
      'Recall the graphical definitions of derivative and integral in kinematics.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'kinematics',
  theory,
  expectedSeconds: { 1: 40, 2: 60, 3: 90 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
