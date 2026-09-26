import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Linear momentum is $\\vec{p} = m \\vec{v}$. Impulse equals momentum change: $\\vec{J} = \\vec{F} \\Delta t = \\Delta \\vec{p}$.
In a closed system with no external net force, total momentum is conserved: $\\sum \\vec{p}_i = \\sum \\vec{p}_f$.
In a perfectly inelastic collision, bodies stick together with final velocity $v_f = \\frac{m_1 v_1 + m_2 v_2}{m_1 + m_2}$.
In a 1D elastic collision with $m_2$ initially at rest: $v_1' = \\frac{m_1 - m_2}{m_1 + m_2} v_1$ and $v_2' = \\frac{2 m_1}{m_1 + m_2} v_1$.
Common mistakes: Forgetting that velocity is a vector (with signs for directions), or assuming kinetic energy is conserved in inelastic collisions.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['momentum_or_impulse_basic', 'perfectly_inelastic_collision_1d', 'recoil_velocity'] as const)

  if (shape === 'momentum_or_impulse_basic') {
    const m = rng.int(2, 60)
    const v = rng.int(2, 40)
    const p = m * v

    return {
      statement: `A body of mass $m = ${m}$ kg moves at $v = ${v}$ m/s. Find the magnitude of its linear momentum in kg$\\cdot$m/s.`,
      answer: { kind: 'number', value: String(p) },
      solution: [
        { text: 'Linear momentum magnitude is $p = mv$:' },
        { text: 'Compute momentum:', tex: `p = ${m} \\cdot ${v} = ${p}` },
      ],
      hints: [
        'Recall $p = mv$.',
        `Multiply mass $m = ${m}$ kg by velocity $v = ${v}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'perfectly_inelastic_collision_1d') {
    const pair = rng.pick([
      { m1: 3, m2: 3, v1: 10, vf: 5 },
      { m1: 2, m2: 4, v1: 12, vf: 4 },
      { m1: 6, m2: 3, v1: 9, vf: 6 },
      { m1: 4, m2: 6, v1: 15, vf: 6 },
      { m1: 5, m2: 5, v1: 14, vf: 7 },
      { m1: 8, m2: 4, v1: 18, vf: 12 },
      { m1: 7, m2: 7, v1: 20, vf: 10 },
      { m1: 6, m2: 2, v1: 16, vf: 12 },
      { m1: 9, m2: 3, v1: 16, vf: 12 },
    ])
    const { m1, m2, v1, vf } = pair

    return {
      statement: `A mass $m_1 = ${m1}$ kg moving at $v_1 = ${v1}$ m/s collides with a stationary mass $m_2 = ${m2}$ kg. They stick together after collision. Find their common final velocity in m/s.`,
      answer: { kind: 'number', value: String(vf) },
      solution: [
        { text: 'Apply conservation of momentum $m_1 v_1 = (m_1 + m_2) v_f$:' },
        { text: 'Solve for final velocity:', tex: `v_f = \\frac{${m1} \\cdot ${v1}}{${m1} + ${m2}} = \\frac{${m1 * v1}}{${m1 + m2}} = ${vf}` },
      ],
      hints: [
        'Total momentum before collision equals total momentum after collision.',
        `$v_f = \\frac{m_1 v_1}{m_1 + m_2} = \\frac{${m1 * v1}}{${m1 + m2}} = ${vf}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const m = rng.int(2, 12)
  const V = rng.int(2, 10)
  const mult = 10 * rng.int(2, 8)
  const M = m * mult
  const vBall = mult * V

  return {
    statement: `A cannon of mass $M = ${M}$ kg fires a projectile of mass $m = ${m}$ kg horizontally at a speed of $v = ${vBall}$ m/s. Find the magnitude of the cannon's recoil velocity in m/s.`,
    answer: { kind: 'number', value: String(V) },
    solution: [
      { text: 'Conservation of momentum $0 = m v_{\\text{ball}} - M V_{\\text{recoil}} \\implies V_{\\text{recoil}} = \\frac{m v_{\\text{ball}}}{M}$:' },
      { text: 'Compute recoil speed:', tex: `V = \\frac{${m} \\cdot ${vBall}}{${M}} = ${V}` },
    ],
    hints: [
      'Total initial momentum is zero.',
      `Recoil momentum equals projectile momentum: $M V = m v$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['elastic_collision_target_at_rest', 'kinetic_energy_lost_inelastic', 'impulse_rebound', 'impulse_force_time'] as const)

  if (shape === 'elastic_collision_target_at_rest') {
    const pair = rng.pick([
      { m1: 3, m2: 1, v1: 8, v1P: 4, v2P: 12 },
      { m1: 5, m2: 3, v1: 8, v1P: 2, v2P: 10 },
      { m1: 4, m2: 2, v1: 6, v1P: 2, v2P: 8 },
      { m1: 6, m2: 2, v1: 4, v1P: 2, v2P: 6 },
      { m1: 7, m2: 3, v1: 10, v1P: 4, v2P: 14 },
      { m1: 9, m2: 3, v1: 12, v1P: 6, v2P: 18 },
      { m1: 4, m2: 1, v1: 10, v1P: 6, v2P: 16 },
      { m1: 5, m2: 1, v1: 12, v1P: 8, v2P: 20 },
      { m1: 3, m2: 2, v1: 10, v1P: 2, v2P: 12 },
      { m1: 8, m2: 4, v1: 12, v1P: 4, v2P: 16 },
      { m1: 6, m2: 3, v1: 9, v1P: 3, v2P: 12 },
      { m1: 10, m2: 5, v1: 15, v1P: 5, v2P: 20 },
    ])
    const askForBody2 = rng.chance(0.5)
    const { m1, m2, v1, v1P, v2P } = pair
    const ansVal = askForBody2 ? v2P : v1P
    const bodyNum = askForBody2 ? 2 : 1

    return {
      statement: `A body of mass $m_1 = ${m1}$ kg moving at $v_1 = ${v1}$ m/s collides elastically with a stationary body of mass $m_2 = ${m2}$ kg. Find the velocity of body ${bodyNum} after the collision in m/s.`,
      answer: { kind: 'number', value: String(ansVal) },
      solution: [
        { text: `For 1D elastic collision with target at rest, $v_${bodyNum}' = ${askForBody2 ? '\\frac{2m_1}{m_1+m_2}v_1' : '\\frac{m_1-m_2}{m_1+m_2}v_1'}$:` },
        { text: 'Compute velocity:', tex: `v_${bodyNum}' = ${ansVal}` },
      ],
      hints: [
        `Use the 1D elastic collision formula for $v_${bodyNum}'$.`,
        `Substitute $m_1 = ${m1}$, $m_2 = ${m2}$, and $v_1 = ${v1}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'kinetic_energy_lost_inelastic') {
    const pair = rng.pick([
      { m1: 2, m2: 2, v1: 10, dEk: 50 },
      { m1: 3, m2: 1, v1: 8, dEk: 24 },
      { m1: 4, m2: 2, v1: 6, dEk: 24 },
      { m1: 6, m2: 3, v1: 6, dEk: 36 },
      { m1: 4, m2: 4, v1: 12, dEk: 144 },
      { m1: 5, m2: 5, v1: 8, dEk: 80 },
      { m1: 6, m2: 2, v1: 8, dEk: 48 },
      { m1: 8, m2: 4, v1: 9, dEk: 108 },
      { m1: 3, m2: 3, v1: 14, dEk: 147 },
      { m1: 1, m2: 3, v1: 8, dEk: 24 },
    ])
    const { m1, m2, v1, dEk } = pair
    const Eki = 0.5 * m1 * v1 * v1
    const vf = (m1 * v1) / (m1 + m2)
    const Ekf = 0.5 * (m1 + m2) * vf * vf

    return {
      statement: `A mass $m_1 = ${m1}$ kg moving at $v_1 = ${v1}$ m/s collides inelastically with a stationary mass $m_2 = ${m2}$ kg and sticks to it. Find the kinetic energy lost in the collision in Joules.`,
      answer: { kind: 'number', value: String(dEk) },
      solution: [
        { text: 'Find common velocity $v_f = \\frac{m_1 v_1}{m_1 + m_2}$, then calculate $\\Delta E_k = E_{k,i} - E_{k,f}$:' },
        { text: 'Compute kinetic energy lost:', tex: `E_{k,i} = ${Eki} \\text{ J}, \\quad v_f = ${vf} \\text{ m/s}, \\quad E_{k,f} = ${Ekf} \\text{ J}, \\quad \\Delta E_k = ${Eki} - ${Ekf} = ${dEk}` },
      ],
      hints: [
        'Find $v_f = \\frac{m_1 v_1}{m_1 + m_2}$.',
        `Subtract final kinetic energy $\\frac{1}{2}(m_1+m_2)v_f^2 = ${Ekf}$ J from initial kinetic energy $\\frac{1}{2}m_1 v_1^2 = ${Eki}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'impulse_rebound') {
    const m = rng.int(1, 8)
    const v1 = 5 * rng.int(2, 8)
    const v2 = 5 * rng.int(1, 6)
    const J = m * (v1 + v2)

    return {
      statement: `A ball of mass $m = ${m}$ kg moving horizontally at $v_1 = ${v1}$ m/s strikes a wall and rebounds in the opposite direction at $v_2 = ${v2}$ m/s. Find the magnitude of the impulse exerted by the wall on the ball in N$\\cdot$s.`,
      answer: { kind: 'number', value: String(J) },
      solution: [
        { text: 'Impulse equals magnitude of change in momentum $J = |\\Delta p| = m(v_1 + v_2)$:' },
        { text: 'Compute impulse:', tex: `J = ${m} \\cdot (${v1} + ${v2}) = ${J}` },
      ],
      hints: [
        'Because velocity reverses direction, change in velocity is $\\Delta v = v_1 - (-v_2) = v_1 + v_2$.',
        `Multiply mass $m = ${m}$ kg by $\\Delta v = ${v1 + v2}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const F = 50 * rng.int(2, 10)
  const dt = rng.pick([0.1, 0.2, 0.4, 0.5])
  const J = Math.round(F * dt)

  return {
    statement: `A constant force of $F = ${F}$ N acts on an object during a collision lasting $\\Delta t = ${dt}$ s. Find the magnitude of the impulse delivered in N$\\cdot$s.`,
    answer: { kind: 'number', value: String(J) },
    solution: [
      { text: 'Impulse is force multiplied by time interval $J = F \\Delta t$:' },
      { text: 'Compute impulse:', tex: `J = ${F} \\cdot ${dt} = ${J}` },
    ],
    hints: [
      'Recall $J = F \\Delta t$.',
      `Multiply force $F = ${F}$ N by duration $\\Delta t = ${dt}$ s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['ballistic_pendulum', 'head_on_elastic_both_moving', 'collision_conservation_laws_choice', 'explosion_into_two_fragments'] as const)

  if (shape === 'ballistic_pendulum') {
    const m = rng.pick([0.01, 0.02, 0.04, 0.05])
    const ratio = rng.pick([30, 40, 50, 60, 80, 100, 120, 150, 200, 250])
    const M = Math.round((m * (ratio - 1)) * 100) / 100
    const vf = rng.pick([1, 2, 3, 4, 5, 6])
    const h = Math.round(((vf * vf) / 20) * 1000) / 1000
    const v0 = ratio * vf
    const mM = Math.round((m + M) * 100) / 100

    return {
      statement: `A bullet of mass $m = ${m}$ kg is fired into a stationary block of mass $M = ${M}$ kg hanging on a pendulum string. The bullet embeds in the block, and the combined mass rises to a maximum height of $h = ${h}$ m. Find the initial speed of the bullet in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(v0) },
      solution: [
        { text: 'First find combined velocity after impact $v_f = \\sqrt{2gh}$, then use momentum conservation $v_0 = \\frac{m+M}{m} v_f$:' },
        { text: 'Compute bullet speed:', tex: `v_f = \\sqrt{20 \\cdot ${h}} = ${vf} \\text{ m/s}, \\quad v_0 = \\frac{${m} + ${M}}{${m}} \\cdot ${vf} = ${v0}` },
      ],
      hints: [
        'Find collision velocity from potential energy rise: $v_f = \\sqrt{2gh}$.',
        `Use $(m+M)v_f = m v_0 \\implies v_0 = \\frac{${mM}}{${m}} \\cdot ${vf} = ${v0}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'head_on_elastic_both_moving') {
    const m = rng.int(2, 12)
    const v1 = rng.int(2, 25)
    const v2 = rng.int(2, 25)
    const askForBody2 = rng.pick([true, false])
    const targetBody = askForBody2 ? '2' : '1'
    const ansVal = askForBody2 ? v1 : -v2

    return {
      statement: `Two identical bodies of mass $m = ${m}$ kg move toward each other on a frictionless track. Body 1 has velocity $v_1 = ${v1}$ m/s (moving right) and body 2 has velocity $v_2 = -${v2}$ m/s (moving left). Find the final velocity of body ${targetBody} after a 1D elastic collision in m/s.`,
      answer: { kind: 'number', value: String(ansVal) },
      solution: [
        { text: 'In a 1D elastic collision between identical masses ($m_1 = m_2$), the bodies swap their velocities:' },
        { text: `Compute final velocity of body ${targetBody}:`, tex: `v_${targetBody}' = ${ansVal}` },
      ],
      hints: [
        'When two equal masses collide elastically in 1D, they exchange velocities.',
        `Body ${targetBody} gets body ${askForBody2 ? '1' : '2'}’s initial velocity, which is ${ansVal} m/s.`,
      ],
      inputHint: 'Enter a signed integer (e.g. -5).',
    }
  }

  if (shape === 'collision_conservation_laws_choice') {
    const qKind = rng.pick(['quantities', 'always_conserved', 'inelastic_ke'] as const)

    if (qKind === 'quantities') {
      const allOpts: ChoiceOption[] = [
        {
          id: 'correct',
          label: 'Momentum and kinetic energy are both conserved in elastic collisions; only momentum is conserved in inelastic collisions',
        },
        {
          id: 'opt2',
          label: 'Kinetic energy is conserved in both, but momentum is lost in inelastic collisions',
        },
        {
          id: 'opt3',
          label: 'Momentum is conserved in both, and kinetic energy increases in inelastic collisions',
        },
        {
          id: 'opt4',
          label: 'Neither momentum nor kinetic energy is conserved in inelastic collisions',
        },
      ]

      return {
        statement: 'Which statement correctly describes conservation of physical quantities in a 1D elastic collision vs a perfectly inelastic collision?',
        answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
        solution: [
          { text: 'Momentum is conserved in all collisions with no external forces. Kinetic energy is conserved ONLY in elastic collisions.' },
        ],
        hints: [
          'Inelastic collisions convert some kinetic energy into heat/deformation.',
        ],
      }
    }

    if (qKind === 'always_conserved') {
      const allOpts: ChoiceOption[] = [
        { id: 'p', label: 'Total momentum' },
        { id: 'ek', label: 'Total kinetic energy' },
        { id: 'v', label: 'Relative velocity' },
        { id: 'none', label: 'None of the above' },
      ]

      return {
        statement: 'In any isolated system with no net external forces, which physical quantity is ALWAYS conserved during a 1D collision, whether elastic or inelastic?',
        answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'p' },
        solution: [
          { text: 'Total momentum is always conserved in isolated collisions. Kinetic energy is only conserved in elastic collisions.' },
        ],
        hints: [
          'Net external force is zero, so $d\\vec{P}/dt = 0$.',
        ],
      }
    }

    const allOpts: ChoiceOption[] = [
      { id: 'heat', label: 'Some kinetic energy is converted into heat, sound, or internal deformation energy' },
      { id: 'conserved', label: 'Total kinetic energy remains strictly constant' },
      { id: 'gained', label: 'Total kinetic energy increases due to impact work' },
      { id: 'zero', label: 'Total kinetic energy always becomes zero' },
    ]

    return {
      statement: 'What happens to the total kinetic energy of a closed system during a perfectly inelastic collision?',
      answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'heat' },
      solution: [
        { text: 'In a perfectly inelastic collision, kinetic energy is lost to internal work, heat, and deformation.' },
      ],
      hints: [
        'Objects stick together and maximum possible kinetic energy is dissipated.',
      ],
    }
  }

  const factor = rng.int(1, 5)
  const m1 = rng.int(1, 8)
  const m2 = rng.int(1, 8)
  const v1 = factor * m2 * rng.int(1, 4)
  const v2 = (m1 * v1) / m2
  const askForPiece2 = rng.pick([true, false])

  if (askForPiece2) {
    return {
      statement: `A stationary object at rest explodes into two pieces of masses $m_1 = ${m1}$ kg and $m_2 = ${m2}$ kg. If piece 1 moves to the left at speed $v_1 = ${v1}$ m/s, find the speed of piece 2 in m/s.`,
      answer: { kind: 'number', value: String(v2) },
      solution: [
        { text: 'Total momentum before explosion is zero: $0 = -m_1 v_1 + m_2 v_2 \\implies v_2 = \\frac{m_1 v_1}{m_2}$:' },
        { text: 'Compute speed of piece 2:', tex: `v_2 = \\frac{${m1} \\cdot ${v1}}{${m2}} = ${v2}` },
      ],
      hints: [
        'Conservation of momentum: initial momentum is zero.',
        `Piece 2 momentum equals piece 1 momentum: $m_2 v_2 = m_1 v_1 \\implies v_2 = \\frac{${m1} \\cdot ${v1}}{${m2}} = ${v2}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  return {
    statement: `A stationary object at rest explodes into two pieces of masses $m_1 = ${m1}$ kg and $m_2 = ${m2}$ kg. If piece 2 moves to the right at speed $v_2 = ${v2}$ m/s, find the speed of piece 1 in m/s.`,
    answer: { kind: 'number', value: String(v1) },
    solution: [
      { text: 'Total momentum before explosion is zero: $0 = -m_1 v_1 + m_2 v_2 \\implies v_1 = \\frac{m_2 v_2}{m_1}$:' },
      { text: 'Compute speed of piece 1:', tex: `v_1 = \\frac{${m2} \\cdot ${v2}}{${m1}} = ${v1}` },
    ],
    hints: [
      'Conservation of momentum: initial momentum is zero.',
      `Piece 1 momentum equals piece 2 momentum: $m_1 v_1 = m_2 v_2 \\implies v_1 = \\frac{${m2} \\cdot ${v2}}{${m1}} = ${v1}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

export const template: SkillTemplate = {
  skillId: 'momentum_cons',
  theory,
  expectedSeconds: { 1: 40, 2: 65, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
