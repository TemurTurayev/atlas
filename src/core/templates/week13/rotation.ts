import type { Rng } from '../../random/rng'
import { paren } from '../../math/latex'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Angular velocity $\\omega$ relates to linear speed by $v = \\omega r$, with frequency in rpm converting to rad/s via $\\omega = \\frac{\\pi \\cdot \\text{rpm}}{30}$.
Moments of inertia for standard bodies of mass $m$: ring $m R^2$, disc $\\frac{1}{2} m R^2$, rod about centre $\\frac{1}{12} m L^2$ (about end $\\frac{1}{3} m L^2$), solid sphere $\\frac{2}{5} m R^2$.
Parallel-axis theorem: $I = I_{\\text{cm}} + m d^2$ for shift distance $d$.
Rotational kinetic energy is $E_k = \\frac{1}{2} I \\omega^2$ and angular momentum is $L = I \\omega$ or vector $\\vec{L} = \\vec{r} \\times \\vec{p}$.
Torque vector is $\\vec{\\tau} = \\vec{r} \\times \\vec{F}$ with magnitude $|\\tau| = r F \\sin\\theta$. Angular momentum is conserved ($I_1 \\omega_1 = I_2 \\omega_2$) when net external torque is zero.
Common mistakes: Using diameter instead of radius $R$ when calculating moments of inertia.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['rpm_to_rads_or_linear_speed', 'standard_moment_of_inertia', 'torque_magnitude_or_rot_energy'] as const)

  if (shape === 'rpm_to_rads_or_linear_speed') {
    const rpmMult = rng.int(1, 40)
    const rpm = 30 * rpmMult
    const askLinear = rng.pick([true, false])

    if (!askLinear) {
      const omegaVal = rpmMult === 1 ? '\\pi' : `${rpmMult}\\pi`
      return {
        statement: `A wheel rotates at ${rpm} revolutions per minute (rpm). Find its angular speed $\\omega$ in rad/s.`,
        answer: { kind: 'number', value: omegaVal },
        solution: [
          { text: 'Convert rpm to rad/s using $\\omega = \\frac{\\pi \\cdot \\text{rpm}}{30}$:' },
          { text: 'Compute angular speed:', tex: `\\omega = \\frac{\\pi \\cdot ${rpm}}{30} = ${omegaVal}` },
        ],
        hints: [
          'Use $\\omega = \\frac{2\\pi \\cdot \\text{rpm}}{60} = \\frac{\\pi \\cdot \\text{rpm}}{30}$.',
          `Divide ${rpm} by 30 and append $\\pi$.`,
        ],
        inputHint: 'Enter an exact expression with \\pi.',
      }
    }

    const omega = 2 * rng.int(1, 10)
    const r = rng.pick([0.5, 1, 1.5, 2])
    const v = omega * r

    return {
      statement: `A point on a rotating disk of radius $r = ${r}$ m moves at angular speed $\\omega = ${omega}$ rad/s. Find its linear speed $v$ in m/s.`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Linear speed is related to angular speed by $v = \\omega r$:' },
        { text: 'Compute linear speed:', tex: `v = ${omega} \\cdot ${r} = ${v}` },
      ],
      hints: [
        'Recall $v = \\omega r$.',
        `Multiply $\\omega = ${omega}$ by $r = ${r}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'standard_moment_of_inertia') {
    const bodyKind = rng.pick(['ring', 'disc', 'rod_center', 'rod_end', 'sphere'] as const)
    let m: number
    let dim: number
    let I: number
    let desc: string
    let formulaTex: string

    if (bodyKind === 'ring') {
      m = rng.int(2, 10)
      dim = rng.pick([1, 2])
      I = m * dim * dim
      desc = `A thin ring of mass $m = ${m}$ kg and radius $R = ${dim}$ m`
      formulaTex = `I = m R^2 = ${m} \\cdot ${dim}^2 = ${I}`
    } else if (bodyKind === 'disc') {
      m = 2 * rng.int(1, 8)
      dim = rng.pick([1, 2])
      I = (m / 2) * dim * dim
      desc = `A uniform disc of mass $m = ${m}$ kg and radius $R = ${dim}$ m`
      formulaTex = `I = \\frac{1}{2} m R^2 = \\frac{${m}}{2} \\cdot ${dim}^2 = ${I}`
    } else if (bodyKind === 'rod_center') {
      m = 12 * rng.int(1, 5)
      dim = rng.pick([1, 2, 3])
      I = (m / 12) * dim * dim
      desc = `A thin uniform rod of mass $m = ${m}$ kg and length $L = ${dim}$ m about an axis through its center of mass`
      formulaTex = `I = \\frac{1}{12} m L^2 = \\frac{${m}}{12} \\cdot ${dim}^2 = ${I}`
    } else if (bodyKind === 'rod_end') {
      m = 3 * rng.int(1, 8)
      dim = rng.pick([1, 2, 3])
      I = (m / 3) * dim * dim
      desc = `A thin uniform rod of mass $m = ${m}$ kg and length $L = ${dim}$ m about an axis through one end`
      formulaTex = `I = \\frac{1}{3} m L^2 = \\frac{${m}}{3} \\cdot ${dim}^2 = ${I}`
    } else {
      m = 5 * rng.int(1, 6)
      dim = rng.pick([1, 2])
      I = (2 * m / 5) * dim * dim
      desc = `A solid uniform sphere of mass $m = ${m}$ kg and radius $R = ${dim}$ m`
      formulaTex = `I = \\frac{2}{5} m R^2 = \\frac{2 \\cdot ${m}}{5} \\cdot ${dim}^2 = ${I}`
    }

    return {
      statement: `${desc}. Find its moment of inertia $I$ in kg$\\cdot$m$^2$.`,
      answer: { kind: 'number', value: String(I) },
      solution: [
        { text: 'Apply the standard moment of inertia formula for the specified geometry:' },
        { text: 'Compute moment of inertia:', tex: formulaTex },
      ],
      hints: [
        'Use the moment of inertia formula for this shape.',
        `Substitute the given mass and dimension into the formula to get $I = ${I}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const askTorque = rng.pick([true, false])

  if (askTorque) {
    const r = rng.pick([0.5, 1, 1.5, 2])
    const F = 2 * rng.int(1, 10)
    const tau = r * F

    return {
      statement: `A force of $F = ${F}$ N is applied perpendicularly (angle $\\theta = 90^\\circ$) at a lever arm distance $r = ${r}$ m from a pivot. Find the magnitude of the torque $|\\tau|$ in N$\\cdot$m.`,
      answer: { kind: 'number', value: String(tau) },
      solution: [
        { text: 'Torque magnitude is $|\\tau| = r F \\sin\\theta$ with $\\sin 90^\\circ = 1$:' },
        { text: 'Compute torque:', tex: `|\\tau| = ${r} \\cdot ${F} \\cdot 1 = ${tau}` },
      ],
      hints: [
        'Recall $|\\tau| = r F \\sin\\theta$.',
        `$|\\tau| = ${r} \\cdot ${F} = ${tau}$ N$\\cdot$m.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const I = 2 * rng.int(1, 10)
  const omega = rng.int(2, 10)
  const Ek = 0.5 * I * omega * omega

  return {
    statement: `A body with moment of inertia $I = ${I}$ kg$\\cdot$m$^2$ rotates at angular speed $\\omega = ${omega}$ rad/s. Find its rotational kinetic energy $E_k$ in Joules.`,
    answer: { kind: 'number', value: String(Ek) },
    solution: [
      { text: 'Rotational kinetic energy is $E_k = \\frac{1}{2} I \\omega^2$:' },
      { text: 'Compute kinetic energy:', tex: `E_k = \\frac{1}{2} \\cdot ${I} \\cdot ${omega}^2 = ${Ek}` },
    ],
    hints: [
      'Use $E_k = \\frac{1}{2} I \\omega^2$.',
      `Multiply $\\frac{${I}}{2}$ by $\\omega^2 = ${omega * omega}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['parallel_axis_theorem', 'angular_momentum_conservation', 'torque_vector_cross_product'] as const)

  if (shape === 'parallel_axis_theorem') {
    const kFactor = rng.int(1, 4)
    const m = 24 * kFactor
    const L = rng.pick([1, 2, 3])
    const d = rng.pick([0.5, 1, 1.5, 2])
    const Icm = (m / 12) * L * L
    const I = Icm + m * d * d

    return {
      statement: `A thin uniform rod of mass $m = ${m}$ kg and length $L = ${L}$ m is rotated about a transverse axis passing through a point at distance $d = ${d}$ m from its center of mass. Using the parallel-axis theorem ($I = I_{\\text{cm}} + m d^2$), find its moment of inertia $I$ in kg$\\cdot$m$^2$.`,
      answer: { kind: 'number', value: String(I) },
      solution: [
        { text: 'Find $I_{\\text{cm}} = \\frac{1}{12} m L^2$, then apply parallel-axis theorem $I = I_{\\text{cm}} + m d^2$:' },
        { text: 'Compute moment of inertia:', tex: `I_{\\text{cm}} = \\frac{${m}}{12} \\cdot ${L}^2 = ${Icm} \\text{ kg}\\cdot\\text{m}^2, \\quad I = ${Icm} + ${m} \\cdot ${d}^2 = ${I}` },
      ],
      hints: [
        'Calculate $I_{\\text{cm}} = \\frac{1}{12} m L^2$.',
        `Add $m d^2 = ${m} \\cdot ${d * d} = ${m * d * d}$ to $I_{\\text{cm}} = ${Icm}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'angular_momentum_conservation') {
    const I2 = rng.int(1, 8)
    const ratio = rng.int(2, 6)
    const I1 = I2 * ratio
    const omega1 = rng.int(2, 10)
    const omega2 = ratio * omega1

    return {
      statement: `A figure skater spins with initial moment of inertia $I_1 = ${I1}$ kg$\\cdot$m$^2$ at angular speed $\\omega_1 = ${omega1}$ rad/s. When she pulls her arms in, her moment of inertia decreases to $I_2 = ${I2}$ kg$\\cdot$m$^2$. Find her new angular speed $\\omega_2$ in rad/s.`,
      answer: { kind: 'number', value: String(omega2) },
      solution: [
        { text: 'By conservation of angular momentum ($I_1 \\omega_1 = I_2 \\omega_2$), solve for $\\omega_2 = \\frac{I_1 \\omega_1}{I_2}$:' },
        { text: 'Compute final angular speed:', tex: `\\omega_2 = \\frac{${I1} \\cdot ${omega1}}{${I2}} = ${omega2}` },
      ],
      hints: [
        'Recall angular momentum is conserved: $I_1 \\omega_1 = I_2 \\omega_2$.',
        `$\\omega_2 = \\frac{${I1} \\cdot ${omega1}}{${I2}} = ${omega2}$ rad/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const rx = rng.int(-5, 5)
  const ry = rng.int(-5, 5)
  const rz = rng.int(-5, 5)
  const Fx = rng.int(-5, 5)
  const Fy = rng.int(-5, 5)
  const Fz = rng.int(-5, 5)

  const norm = (n: number) => (Object.is(n, -0) ? 0 : n)
  const tx = norm(ry * Fz - rz * Fy)
  const ty = norm(rz * Fx - rx * Fz)
  const tz = norm(rx * Fy - ry * Fx)

  return {
    statement: `A force $\\vec{F} = (${Fx}, ${Fy}, ${Fz})$ N acts at position $\\vec{r} = (${rx}, ${ry}, ${rz})$ m relative to the origin. Find the torque vector $\\vec{\\tau} = \\vec{r} \\times \\vec{F}$ in N$\\cdot$m.`,
    answer: { kind: 'vector', components: [String(tx), String(ty), String(tz)] },
    solution: [
      { text: 'Torque vector is given by the 3D cross product $\\vec{\\tau} = \\vec{r} \\times \\vec{F}$:' },
      { text: 'Compute vector components:', tex: `\\vec{\\tau} = (${paren(ry)} \\cdot ${paren(Fz)} - ${paren(rz)} \\cdot ${paren(Fy)},\\; ${paren(rz)} \\cdot ${paren(Fx)} - ${paren(rx)} \\cdot ${paren(Fz)},\\; ${paren(rx)} \\cdot ${paren(Fy)} - ${paren(ry)} \\cdot ${paren(Fx)}) = (${tx}, ${ty}, ${tz})` },
    ],
    hints: [
      'Use $\\tau_x = y F_z - z F_y$, $\\tau_y = z F_x - x F_z$, $\\tau_z = x F_y - y F_x$.',
      `Substitute coordinates to obtain components $(${tx}, ${ty}, ${tz})$.`,
    ],
    inputHint: 'Enter 3 vector components.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['angular_momentum_vector', 'rotational_work_energy_change', 'rolling_without_slipping_choice'] as const)

  if (shape === 'angular_momentum_vector') {
    const m = rng.int(1, 5)
    const rx = rng.int(-4, 4)
    const ry = rng.int(-4, 4)
    const rz = rng.int(-4, 4)
    const vx = rng.int(-5, 5)
    const vy = rng.int(-5, 5)
    const vz = rng.int(-5, 5)

    const norm = (n: number) => (Object.is(n, -0) ? 0 : n)
    const Lx = norm(m * (ry * vz - rz * vy))
    const Ly = norm(m * (rz * vx - rx * vz))
    const Lz = norm(m * (rx * vy - ry * vx))

    return {
      statement: `A particle of mass $m = ${m}$ kg is at position $\\vec{r} = (${rx}, ${ry}, ${rz})$ m moving with velocity $\\vec{v} = (${vx}, ${vy}, ${vz})$ m/s. Find its angular momentum vector $\\vec{L} = \\vec{r} \\times \\vec{p}$ about the origin in kg$\\cdot$m$^2$/s.`,
      answer: { kind: 'vector', components: [String(Lx), String(Ly), String(Lz)] },
      solution: [
        { text: 'Angular momentum is $\\vec{L} = m (\\vec{r} \\times \\vec{v})$:' },
        { text: 'Compute vector components:', tex: `\\vec{L} = ${m} \\cdot (${paren(ry)} \\cdot ${paren(vz)} - ${paren(rz)} \\cdot ${paren(vy)},\\; ${paren(rz)} \\cdot ${paren(vx)} - ${paren(rx)} \\cdot ${paren(vz)},\\; ${paren(rx)} \\cdot ${paren(vy)} - ${paren(ry)} \\cdot ${paren(vx)}) = (${Lx}, ${Ly}, ${Lz})` },
      ],
      hints: [
        'Compute cross product $\\vec{r} \\times \\vec{v}$, then multiply each component by $m = ${m}$.',
        `Components are $(${Lx}, ${Ly}, ${Lz})$.`,
      ],
      inputHint: 'Enter 3 vector components.',
    }
  }

  if (shape === 'rotational_work_energy_change') {
    const I = 2 * rng.int(1, 8)
    const w1 = rng.int(2, 10)
    const w2 = w1 + rng.int(2, 10)
    const W = 0.5 * I * (w2 * w2 - w1 * w1)

    return {
      statement: `A flywheel with moment of inertia $I = ${I}$ kg$\\cdot$m$^2$ accelerates from $\\omega_1 = ${w1}$ rad/s to $\\omega_2 = ${w2}$ rad/s under a net torque. Find the total work done on the flywheel in Joules.`,
      answer: { kind: 'number', value: String(W) },
      solution: [
        { text: 'Work done equals change in rotational kinetic energy $W = \\Delta E_k = \\frac{1}{2} I (\\omega_2^2 - \\omega_1^2)$:' },
        { text: 'Compute work done:', tex: `W = \\frac{1}{2} \\cdot ${I} \\cdot (${w2}^2 - ${w1}^2) = ${I / 2} \\cdot (${w2 * w2} - ${w1 * w1}) = ${W}` },
      ],
      hints: [
        'Use work-energy theorem $W = \\frac{1}{2} I \\omega_2^2 - \\frac{1}{2} I \\omega_1^2$.',
        `$W = \\frac{${I}}{2} (${w2 * w2} - ${w1 * w1}) = ${W}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const allOpts: ChoiceOption[] = [
    { id: 'correct', label: 'Linear speed of center of mass equals angular speed times radius: $v_{\\text{cm}} = \\omega R$' },
    { id: 'opt2', label: 'Linear speed of center of mass is double angular speed: $v_{\\text{cm}} = 2 \\omega R$' },
    { id: 'opt3', label: 'The point of contact with the ground moves at maximum speed $2 v_{\\text{cm}}$' },
    { id: 'opt4', label: 'Rotational kinetic energy is zero for rolling bodies' },
  ]

  return {
    statement: 'Which statement correctly describes a round object rolling without slipping along a flat surface with radius $R$?',
    answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
    solution: [
      { text: 'Rolling without slipping requires zero relative motion at the point of contact, yielding $v_{\\text{cm}} = \\omega R$.' },
    ],
    hints: [
      'The point of contact with the ground is instantaneously at rest.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'rotation',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
