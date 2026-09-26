import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = `Work done by constant force $\\vec{F}$ over displacement $\\vec{d}$ is $W = \\vec{F} \\cdot \\vec{d} = F d \\cos\\theta$.
Kinetic energy is $E_k = \\frac{1}{2} m v^2$; gravitational potential energy is $E_p = mgh$.
Work-energy theorem: net work equals change in kinetic energy ($W_{\\text{net}} = \\Delta E_k$).
Elastic potential energy of a compressed spring is $E_s = \\frac{1}{2} k x^2$.
Average power is rate of work: $P = \\frac{W}{t} = F v$.
(Use $g = 10\\text{ m/s}^2$ throughout.)
Common mistakes: Forgetting the angle $\\cos\\theta$ when calculating work done by a force at an incline.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['kinetic_or_potential_energy', 'work_dot_product_angle', 'power_work_time'] as const)

  if (shape === 'kinetic_or_potential_energy') {
    const isKinetic = rng.chance(0.5)
    if (isKinetic) {
      const m = 2 * rng.int(1, 15)
      const v = rng.int(2, 20)
      const Ek = 0.5 * m * v * v

      return {
        statement: `A body of mass $m = ${m}$ kg moves at speed $v = ${v}$ m/s. Find its kinetic energy in Joules. (Use $g = 10$ m/s$^2$.)`,
        answer: { kind: 'number', value: String(Ek) },
        solution: [
          { text: 'Use the kinetic energy formula $E_k = \\frac{1}{2} m v^2$:' },
          { text: 'Compute kinetic energy:', tex: `E_k = \\frac{1}{2} \\cdot ${m} \\cdot ${v}^2 = ${Ek}` },
        ],
        hints: [
          'Recall $E_k = \\frac{1}{2} m v^2$.',
          `Square $v = ${v}$ and multiply by $\\frac{${m}}{2}$.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    const m = rng.int(2, 25)
    const h = rng.int(2, 20)
    const Ep = m * 10 * h

    return {
      statement: `An object of mass $m = ${m}$ kg is lifted to a height of $h = ${h}$ m. Find its gravitational potential energy in Joules. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(Ep) },
      solution: [
        { text: 'Use the potential energy formula $E_p = mgh$:' },
        { text: 'Compute potential energy:', tex: `E_p = ${m} \\cdot 10 \\cdot ${h} = ${Ep}` },
      ],
      hints: [
        'Recall $E_p = mgh$.',
        `Multiply mass $m = ${m}$, $g = 10$, and height $h = ${h}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'work_dot_product_angle') {
    const angleDeg = rng.pick([0, 60, 90, 180])
    const F = 10 * rng.int(1, 15)
    const d = 2 * rng.int(1, 12)
    let W: number
    let cosTex: string
    if (angleDeg === 0) {
      W = F * d
      cosTex = '1'
    } else if (angleDeg === 60) {
      W = 0.5 * F * d
      cosTex = '\\frac{1}{2}'
    } else if (angleDeg === 90) {
      W = 0
      cosTex = '0'
    } else {
      W = -F * d
      cosTex = '\\left(-1\\right)'
    }

    return {
      statement: `A force $F = ${F}$ N pulls a box across a distance of $d = ${d}$ m at an angle of $\\theta = ${angleDeg}^\\circ$ relative to the displacement. Find the work done in Joules. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(W) },
      solution: [
        { text: 'Use the definition of work $W = F d \\cos\\theta$:' },
        { text: 'Compute work:', tex: `W = ${F} \\cdot ${d} \\cdot \\cos(${angleDeg}^\\circ) = ${F} \\cdot ${d} \\cdot ${cosTex} = ${W}` },
      ],
      hints: [
        'Recall $W = F d \\cos\\theta$.',
        `Evaluate $\\cos(${angleDeg}^\\circ)$ and multiply by $F = ${F}$ N and $d = ${d}$ m.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const P = 10 * rng.int(5, 80)
  const t = rng.int(2, 25)
  const W = P * t

  return {
    statement: `A motor performs $W = ${W}$ J of work in $t = ${t}$ seconds. Find its average power in Watts. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(P) },
    solution: [
      { text: 'Power is the rate of work done $P = \\frac{W}{t}$:' },
      { text: 'Compute power:', tex: `P = \\frac{${W}}{${t}} = ${P}` },
    ],
    hints: [
      'Recall $P = \\frac{W}{t}$.',
      `Divide total work $W = ${W}$ J by time $t = ${t}$ s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['speed_at_bottom_slide', 'spring_energy_or_launch', 'work_energy_theorem_stopping'] as const)

  if (shape === 'speed_at_bottom_slide') {
    const h = rng.pick([5, 20, 45, 80, 125])
    const m = rng.int(2, 25)
    const v = Math.round(Math.sqrt(20 * h))

    return {
      statement: `A block of mass $m = ${m}$ kg slides down a frictionless ramp from an initial height of $h = ${h}$ m. Find its speed at the bottom of the ramp in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Equate initial potential energy to final kinetic energy $mgh = \\frac{1}{2} m v^2 \\implies v = \\sqrt{2gh}$:' },
        { text: 'Compute speed:', tex: `v = \\sqrt{2 \\cdot 10 \\cdot ${h}} = ${v}` },
      ],
      hints: [
        'Use conservation of energy: $mgh = \\frac{1}{2} m v^2$.',
        `$v = \\sqrt{20h} = \\sqrt{20 \\cdot ${h}} = ${v}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'spring_energy_or_launch') {
    // Pick m, v, x such that k is strictly in [50, 2000]
    const candidates = [
      { m: 1, v: 2, x: 0.1, k: 400 },
      { m: 1, v: 3, x: 0.1, k: 900 },
      { m: 1, v: 4, x: 0.1, k: 1600 },
      { m: 1, v: 2, x: 0.2, k: 100 },
      { m: 1, v: 4, x: 0.2, k: 400 },
      { m: 2, v: 4, x: 0.2, k: 800 },
      { m: 2, v: 6, x: 0.2, k: 1800 },
      { m: 1, v: 2, x: 0.25, k: 64 },
      { m: 1, v: 5, x: 0.25, k: 400 },
      { m: 2, v: 5, x: 0.25, k: 800 },
      { m: 2, v: 7, x: 0.25, k: 1568 },
      { m: 1, v: 4, x: 0.5, k: 64 },
      { m: 2, v: 5, x: 0.5, k: 200 },
      { m: 4, v: 8, x: 0.5, k: 1024 },
      { m: 1, v: 6, x: 0.4, k: 225 },
      { m: 2, v: 6, x: 0.4, k: 450 },
      { m: 4, v: 6, x: 0.4, k: 900 },
    ]
    const p = rng.pick(candidates)
    const { m, v, x, k } = p

    return {
      statement: `A spring with spring constant $k = ${k}$ N/m is compressed by $x = ${x}$ m and used to launch a mass $m = ${m}$ kg horizontally across a frictionless surface. Find the launch speed in m/s. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Equate spring potential energy to kinetic energy $\\frac{1}{2} k x^2 = \\frac{1}{2} m v^2 \\implies v = x \\sqrt{\\frac{k}{m}}$:' },
        { text: 'Compute launch speed:', tex: `v = \\sqrt{\\frac{${k} \\cdot ${x}^2}{${m}}} = ${v}` },
      ],
      hints: [
        'Elastic potential energy $\\frac{1}{2} k x^2$ converts completely into kinetic energy $\\frac{1}{2} m v^2$.',
        `$v = \\sqrt{\\frac{k x^2}{m}} = \\sqrt{\\frac{${k} \\cdot ${x * x}}{${m}}} = ${v}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const m = 100 * rng.int(6, 20)
  const v0 = 5 * rng.int(2, 8)
  const W = Math.round(0.5 * m * v0 * v0)

  return {
    statement: `A car of mass $m = ${m}$ kg traveling at $v_0 = ${v0}$ m/s brakes to a complete stop. Find the magnitude of the work done by the braking force in Joules. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(W) },
    solution: [
      { text: 'By the work-energy theorem, magnitude of work done equals initial kinetic energy $|W| = \\frac{1}{2} m v_0^2$:' },
      { text: 'Compute work:', tex: `|W| = \\frac{1}{2} \\cdot ${m} \\cdot ${v0}^2 = ${W}` },
    ],
    hints: [
      'The work done by friction equals the change in kinetic energy $\\Delta E_k = 0 - \\frac{1}{2} m v_0^2$.',
      `Magnitude of work is $\\frac{1}{2} \\cdot ${m} \\cdot ${v0}^2 = ${W}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['spring_launcher_vertical_height', 'energy_lost_to_friction_on_ramp', 'average_power_accelerating_car'] as const)

  if (shape === 'spring_launcher_vertical_height') {
    const candidates = [
      { x: 0.2, m: 1, h: 1, k: 500 },
      { x: 0.2, m: 1, h: 2, k: 1000 },
      { x: 0.2, m: 1, h: 3, k: 1500 },
      { x: 0.2, m: 1, h: 4, k: 2000 },
      { x: 0.4, m: 1, h: 2, k: 250 },
      { x: 0.4, m: 2, h: 4, k: 1000 },
      { x: 0.5, m: 1, h: 5, k: 400 },
      { x: 0.5, m: 2, h: 5, k: 800 },
      { x: 0.5, m: 4, h: 5, k: 1600 },
    ]
    const p = rng.pick(candidates)
    const { x, m, h, k } = p

    return {
      statement: `A spring of constant $k = ${k}$ N/m compressed by $x = ${x}$ m launches a projectile of mass $m = ${m}$ kg vertically upwards. Find the maximum height reached above the compressed position in meters. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(h) },
      solution: [
        { text: 'Equate initial spring potential energy to final gravitational potential energy $\\frac{1}{2} k x^2 = mgh$:' },
        { text: 'Solve for height $h$:', tex: `h = \\frac{k x^2}{2mg} = \\frac{${k} \\cdot ${x}^2}{2 \\cdot ${m} \\cdot 10} = ${h}` },
      ],
      hints: [
        'Conservation of energy: $\\frac{1}{2} k x^2 = mgh$.',
        `$h = \\frac{${k} \\cdot ${x * x}}{${20 * m}} = ${h}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'energy_lost_to_friction_on_ramp') {
    const m = rng.int(2, 12)
    const h = rng.pick([5, 10, 20, 45])
    const vMax = Math.round(Math.sqrt(20 * h))
    const v = vMax - 2 * rng.int(1, 4)
    const Ep = m * 10 * h
    const Ek = 0.5 * m * v * v
    const Elost = Ep - Ek

    return {
      statement: `A block of mass $m = ${m}$ kg slides down a rough ramp from height $h = ${h}$ m and reaches the bottom with speed $v = ${v}$ m/s. Find the thermal energy lost to friction in Joules. (Use $g = 10$ m/s$^2$.)`,
      answer: { kind: 'number', value: String(Elost) },
      solution: [
        { text: 'Energy lost to friction is initial potential energy minus final kinetic energy $E_{\\text{lost}} = mgh - \\frac{1}{2} m v^2$:' },
        { text: 'Compute energy lost:', tex: `E_{\\text{lost}} = (${m} \\cdot 10 \\cdot ${h}) - \\left(\\frac{1}{2} \\cdot ${m} \\cdot ${v}^2\\right) = ${Ep} - ${Ek} = ${Elost}` },
      ],
      hints: [
        'Calculate initial potential energy $E_p = mgh$ and final kinetic energy $E_k = \\frac{1}{2} m v^2$.',
        `$E_{\\text{lost}} = ${Ep} - ${Ek} = ${Elost}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const m = 100 * rng.int(8, 15)
  const v = 5 * rng.int(3, 8)
  const t = rng.pick([4, 5, 8, 10, 16])
  const Ek = 0.5 * m * v * v
  const P = Ek / t

  return {
    statement: `A car of mass $m = ${m}$ kg accelerates from rest to $v = ${v}$ m/s in $t = ${t}$ seconds. Find the average power delivered by the engine in Watts. (Use $g = 10$ m/s$^2$.)`,
    answer: { kind: 'number', value: String(P) },
    solution: [
      { text: 'Average power is rate of energy transfer $P_{\\text{avg}} = \\frac{\\Delta E_k}{t} = \\frac{\\frac{1}{2} m v^2}{t}$:' },
      { text: 'Compute average power:', tex: `P_{\\text{avg}} = \\frac{\\frac{1}{2} \\cdot ${m} \\cdot ${v}^2}{${t}} = \\frac{${Ek}}{${t}} = ${P}` },
    ],
    hints: [
      'Calculate total kinetic energy gained $\\Delta E_k = \\frac{1}{2} m v^2$.',
      `Divide $\\Delta E_k = ${Ek}$ J by time $t = ${t}$ s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

export const template: SkillTemplate = {
  skillId: 'energy_cons',
  theory,
  expectedSeconds: { 1: 40, 2: 65, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
