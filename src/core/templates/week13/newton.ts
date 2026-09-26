import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Newton's second law states $\\sum \\vec{F} = m \\vec{a}$. Weight is $W = mg$.
On a frictionless incline of angle $\\alpha$: component of gravity along incline is $F_{\\parallel} = mg \\sin\\alpha$, giving acceleration $a = g \\sin\\alpha$.
Kinetic friction force on a flat surface is $f_k = \\mu N = \\mu mg$.
For an Atwood machine with two masses $m_1 > m_2$: acceleration is $a = \\frac{m_1 - m_2}{m_1 + m_2} g$.
In an elevator accelerating upward at $a$: apparent weight / scale reading is $N = m(g + a)$.
(Use $g = 10\\text{ m/s}^2$ throughout.)
Common mistakes: Forgetting that friction depends on normal force $N$, or confusing action-reaction pairs with two forces acting on the same object.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['f_equals_ma_or_weight', 'lift_normal_force', 'action_reaction_choice'] as const)

  if (shape === 'f_equals_ma_or_weight') {
    const m = rng.int(2, 25)
    const a = rng.int(1, 12)
    const F = m * a

    return {
      statement: `A constant net force of $F = ${F}$ N acts on a mass $m = ${m}$ kg. Find the acceleration in m/s$^2$. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(a) },
      solution: [
        { text: 'Use Newton’s second law $F = ma$:' },
        { text: 'Solve for acceleration:', tex: `a = \\frac{F}{m} = \\frac{${F}}{${m}} = ${a}` },
      ],
      hints: [
        'Recall $F = ma$.',
        `Divide net force $F = ${F}$ N by mass $m = ${m}$ kg.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'lift_normal_force') {
    const m = 10 * rng.int(4, 12)
    const a0 = rng.int(1, 6)
    const isUpward = rng.chance(0.5)
    const direction = isUpward ? 'upward' : 'downward'
    const N = isUpward ? m * (10 + a0) : m * (10 - a0)

    return {
      statement: `A person of mass $m = ${m}$ kg stands on a scale inside an elevator accelerating ${direction} at $a = ${a0}$ m/s$^2$. Find the reading on the scale in Newtons. (Use $g = 10$ m/s$^2$.)` ,
      answer: { kind: 'number', value: String(N) },
      solution: [
        { text: `For ${direction} acceleration, the normal force scale reading is $N = m(g ${isUpward ? '+' : '-'} a)$:` },
        { text: 'Compute normal force:', tex: `N = ${m} \\cdot (${10} ${isUpward ? '+' : '-'} ${a0}) = ${N}` },
      ],
      hints: [
        `When accelerating ${direction}, effective acceleration is $g ${isUpward ? '+' : '-'} a$.`,
        `Multiply mass $m = ${m}$ kg by effective acceleration.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const allOpts: ChoiceOption[] = [
    { id: 'earth_book', label: 'The gravitational pull of the book on the Earth' },
    { id: 'table_book', label: 'The normal force exerted by the table on the book' },
    { id: 'friction', label: 'The force of friction between book and table' },
    { id: 'book_table', label: 'The normal force exerted by the book on the table' },
  ]

  return {
    statement: 'A book rests on a table. According to Newton’s third law, what is the action-reaction pair to the Earth’s gravitational pull on the book? (Use $g = 10$ m/s$^2$.)',
    answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'earth_book' },
    solution: [
      { text: 'Newton’s third law pairs involve the mutual forces between the SAME two bodies (Earth and book).' },
    ],
    hints: [
      'An action-reaction pair must involve the exact same two objects interacting.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['flat_friction_accel', 'frictionless_incline_accel', 'two_connected_blocks_tension'] as const)

  if (shape === 'flat_friction_accel') {
    const m = rng.int(2, 12)
    const mu = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5])
    const fk = Math.round(10 * mu * m)
    const a = rng.int(1, 10)
    const F = fk + m * a

    return {
      statement: `A block of mass $m = ${m}$ kg is pulled horizontally by a force $F = ${F}$ N on a surface with friction coefficient $\\mu = ${mu}$. Find its acceleration in m/s$^2$. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(a) },
      solution: [
        { text: 'Calculate friction force $f_k = \\mu m g$ and apply $F_{\\text{net}} = F - f_k = ma$:' },
        { text: 'Compute acceleration:', tex: `f_k = ${mu} \\cdot ${m} \\cdot 10 = ${fk} \\text{ N}, \\quad a = \\frac{${F} - ${fk}}{${m}} = ${a}` },
      ],
      hints: [
        'Calculate kinetic friction force $f_k = \\mu mg$.',
        `$f_k = ${fk}$ N. Subtract $f_k$ from $F = ${F}$ N and divide by $m = ${m}$ kg.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'frictionless_incline_accel') {
    const m = rng.int(2, 20)
    const angleDeg = rng.pick([30, 45, 60])
    let valLatex: string
    if (angleDeg === 30) {
      valLatex = '5'
    } else if (angleDeg === 45) {
      valLatex = '5\\sqrt{2}'
    } else {
      valLatex = '5\\sqrt{3}'
    }

    return {
      statement: `A block of mass $m = ${m}$ kg slides down a frictionless incline inclined at an angle of $\\alpha = ${angleDeg}^\\circ$ to the horizontal. Find its acceleration down the incline in m/s$^2$. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'Mass cancels out; component of gravity parallel to frictionless incline is $a = g \\sin\\alpha$:' },
        { text: 'Compute:', tex: `a = 10 \\cdot \\sin(${angleDeg}^\\circ) = ${valLatex}` },
      ],
      hints: [
        'Acceleration down a frictionless incline is independent of mass: $a = g \\sin\\alpha$.',
        `For $\\alpha = ${angleDeg}^\\circ$, calculate $10 \\sin(${angleDeg}^\\circ)$.`,
      ],
      inputHint: 'Enter an exact expression like 5\\sqrt{3} or an integer.',
    }
  }

  const m1 = rng.int(2, 10)
  const m2 = rng.int(2, 10)
  const a = rng.int(1, 8)
  const F = (m1 + m2) * a
  const T = m1 * a

  return {
    statement: `Two blocks of masses $m_1 = ${m1}$ kg and $m_2 = ${m2}$ kg are connected by a string on a frictionless surface. A force $F = ${F}$ N pulls mass $m_2$. Find the tension $T$ in the string connecting the blocks in Newtons. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(T) },
    solution: [
      { text: 'Find system acceleration $a = \\frac{F}{m_1 + m_2}$, then tension $T = m_1 a$:' },
      { text: 'Compute tension:', tex: `a = \\frac{${F}}{${m1} + ${m2}} = ${a} \\text{ m/s}^2, \\quad T = ${m1} \\cdot ${a} = ${T}` },
    ],
    hints: [
      'Find the total mass and calculate acceleration $a = \\frac{F}{m_1 + m_2}$.',
      `Tension accelerates mass $m_1$ alone: $T = m_1 a = ${m1} \\cdot ${a}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['atwood_machine', 'incline_with_friction', 'lift_cable_tension_braking', 'static_friction_prevent_slide'] as const)

  if (shape === 'atwood_machine') {
    const pair = rng.pick([
      { m1: 3, m2: 1, a: 5 },
      { m1: 4, m2: 1, a: 6 },
      { m1: 3, m2: 2, a: 2 },
      { m1: 7, m2: 3, a: 4 },
      { m1: 9, m2: 1, a: 8 },
      { m1: 9, m2: 3, a: 5 },
      { m1: 8, m2: 2, a: 6 },
      { m1: 6, m2: 4, a: 2 },
      { m1: 9, m2: 6, a: 2 },
      { m1: 13, m2: 7, a: 3 },
      { m1: 11, m2: 9, a: 1 },
      { m1: 14, m2: 6, a: 4 },
      { m1: 19, m2: 1, a: 9 },
    ])
    const { m1, m2, a } = pair

    return {
      statement: `In an Atwood machine, two masses $m_1 = ${m1}$ kg and $m_2 = ${m2}$ kg ($m_1 > m_2$) hang vertically over a frictionless pulley. Find the magnitude of the acceleration of the system in m/s$^2$. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(a) },
      solution: [
        { text: 'Apply Newton’s second law to the Atwood machine: $a = \\frac{m_1 - m_2}{m_1 + m_2} g$:' },
        { text: 'Compute acceleration:', tex: `a = \\frac{${m1} - ${m2}}{${m1} + ${m2}} \\cdot 10 = ${a}` },
      ],
      hints: [
        'Net driving force is $(m_1 - m_2)g$; total moving mass is $m_1 + m_2$.',
        `$a = \\frac{${m1 - m2}}{${m1 + m2}} \\cdot 10 = ${a}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'incline_with_friction') {
    const m = rng.int(2, 20)
    const mu = rng.pick([0.2, 0.4, 0.6, 0.8])
    const k = Math.round(5 * mu)
    const valLatex = `5\\sqrt{3}-${k}`

    return {
      statement: `A block of mass $m = ${m}$ kg slides down an incline at angle $\\alpha = 60^\\circ$ with kinetic friction coefficient $\\mu = ${mu}$. Find its acceleration down the ramp in m/s$^2$. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: valLatex },
      solution: [
        { text: 'Mass cancels out; net acceleration down incline is $a = g(\\sin 60^\\circ - \\mu \\cos 60^\\circ)$:' },
        { text: 'Compute acceleration:', tex: `a = 10 \\cdot \\left(\\frac{\\sqrt{3}}{2} - \\frac{${mu}}{2}\\right) = ${valLatex}` },
      ],
      hints: [
        'Recall $a = g(\\sin\\alpha - \\mu \\cos\\alpha)$.',
        `For $\\alpha = 60^\\circ$, $\\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$ and $\\cos 60^\\circ = \\frac{1}{2}$.`,
      ],
      inputHint: 'Enter an exact expression like 5\\sqrt{3}-2.',
    }
  }

  if (shape === 'lift_cable_tension_braking') {
    const M = 100 * rng.int(4, 20)
    const v0 = rng.pick([6, 8, 10, 12])
    const d = v0 === 6 ? 9 : v0 === 8 ? 16 : v0 === 10 ? 10 : 18
    const a0 = (v0 * v0) / (2 * d)
    const T = M * (10 + a0)

    return {
      statement: `An elevator of mass $M = ${M}$ kg descending at $v_0 = ${v0}$ m/s is brought to rest with constant deceleration over a distance of $d = ${d}$ m. Find the tension in the supporting cable while braking, in Newtons. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(T) },
      solution: [
        { text: 'Find deceleration $a = \\frac{v_0^2}{2d}$, then tension $T = M(g + a)$ during upward acceleration/braking:' },
        { text: 'Compute tension:', tex: `a = \\frac{${v0}^2}{2 \\cdot ${d}} = ${a0} \\text{ m/s}^2, \\quad T = ${M} \\cdot (10 + ${a0}) = ${T}` },
      ],
      hints: [
        'Calculate braking acceleration $a = \\frac{v_0^2}{2d}$.',
        `Tension must support weight and provide upward deceleration: $T = M(10 + a)$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const m = rng.int(2, 20)
  const angleDeg = rng.pick([30, 45, 60])
  let valLatex: string
  if (angleDeg === 30) {
    valLatex = '\\frac{\\sqrt{3}}{3}'
  } else if (angleDeg === 45) {
    valLatex = '1'
  } else {
    valLatex = '\\sqrt{3}'
  }

  return {
    statement: `Find the minimum coefficient of static friction $\\mu_s$ required to prevent a block of mass $m = ${m}$ kg from slipping down an incline at angle $\\alpha = ${angleDeg}^\\circ$. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: valLatex },
    solution: [
      { text: 'A block on an incline remains at rest if static friction force balances gravity component: $\\mu_s \\ge \\tan\\alpha$:' },
      { text: 'Compute minimum coefficient:', tex: `\\mu_s = \\tan(${angleDeg}^\\circ) = ${valLatex}` },
    ],
    hints: [
      'At the threshold of slipping along an incline, static friction satisfies $\\mu_s = \\tan\\alpha$.',
      `Calculate $\\tan(${angleDeg}^\\circ)$.`,
    ],
    inputHint: 'Enter an exact expression like \\frac{\\sqrt{3}}{3} or \\sqrt{3} or 1.',
  }
}

export const template: SkillTemplate = {
  skillId: 'newton',
  theory,
  expectedSeconds: { 1: 40, 2: 65, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
