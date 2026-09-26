import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = `Simple harmonic motion satisfies $x(t) = A \\cos(\\omega t + \\varphi)$ with angular frequency $\\omega = \\sqrt{\\frac{k}{m}}$, period $T = \\frac{2\\pi}{\\omega}$, and frequency $f = \\frac{\\omega}{2\\pi}$.
Maximum speed is $v_{\\text{max}} = A \\omega$ and maximum acceleration is $a_{\\text{max}} = A \\omega^2$.
Total mechanical energy is $E = \\frac{1}{2} k A^2 = \\frac{1}{2} m v_{\\text{max}}^2$, with speed at position $x$ given by $v(x) = \\omega \\sqrt{A^2 - x^2}$.
Phase space trajectories $(x, v)$ trace out ellipses with semi-axes $A$ and $A \\omega$.
Harmonic motion obeys the differential equation $x''(t) = -\\omega^2 x(t)$.
Common mistakes: Confusing frequency $f = \\frac{\\omega}{2\\pi}$ in Hz with angular frequency $\\omega$ in rad/s.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['period_or_frequency', 'max_speed_or_accel', 'total_energy'] as const)

  if (shape === 'period_or_frequency') {
    const omega = rng.int(2, 15)
    const askPeriod = rng.pick([true, false])
    let ansVal: string
    let propName: string
    let unitStr: string

    if (askPeriod) {
      ansVal = omega === 2 ? '\\pi' : `\\frac{2\\pi}{${omega}}`
      propName = 'period $T$'
      unitStr = 'seconds'
    } else {
      ansVal = omega % 2 === 0 ? `\\frac{${omega / 2}}{\\pi}` : `\\frac{${omega}}{2\\pi}`
      propName = 'frequency $f$'
      unitStr = 'Hz'
    }

    return {
      statement: `A harmonic oscillator has angular frequency $\\omega = ${omega}$ rad/s. Find its ${propName} in ${unitStr}.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: `Use $T = \\frac{2\\pi}{\\omega}$ or $f = \\frac{\\omega}{2\\pi}$ with $\\omega = ${omega}$ rad/s:` },
        { text: `Compute ${propName}:`, tex: `${askPeriod ? 'T' : 'f'} = ${ansVal}` },
      ],
      hints: [
        'Recall $T = \\frac{2\\pi}{\\omega}$ and $f = \\frac{\\omega}{2\\pi}$.',
        `Substitute $\\omega = ${omega}$.`,
      ],
      inputHint: 'Enter an exact expression with \\pi or a fraction.',
    }
  }

  if (shape === 'max_speed_or_accel') {
    const A = rng.int(1, 10)
    const omega = rng.int(2, 12)
    const askSpeed = rng.pick([true, false])

    if (askSpeed) {
      const vmax = A * omega
      return {
        statement: `An oscillator has amplitude $A = ${A}$ m and angular frequency $\\omega = ${omega}$ rad/s. Find its maximum speed $v_{\\text{max}}$ in m/s.`,
        answer: { kind: 'number', value: String(vmax) },
        solution: [
          { text: 'Maximum speed occurs at the equilibrium position: $v_{\\text{max}} = A \\omega$:' },
          { text: 'Compute maximum speed:', tex: `v_{\\text{max}} = ${A} \\cdot ${omega} = ${vmax}` },
        ],
        hints: [
          'Use $v_{\\text{max}} = A \\omega$.',
          `Multiply $A = ${A}$ by $\\omega = ${omega}$.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    const amax = A * omega * omega
    return {
      statement: `An oscillator has amplitude $A = ${A}$ m and angular frequency $\\omega = ${omega}$ rad/s. Find the magnitude of its maximum acceleration $a_{\\text{max}}$ in m/s$^2$.`,
      answer: { kind: 'number', value: String(amax) },
      solution: [
        { text: 'Maximum acceleration occurs at maximum displacement: $a_{\\text{max}} = A \\omega^2$:' },
        { text: 'Compute maximum acceleration:', tex: `a_{\\text{max}} = ${A} \\cdot ${omega}^2 = ${amax}` },
      ],
      hints: [
        'Use $a_{\\text{max}} = A \\omega^2$.',
        `Multiply $A = ${A}$ by $\\omega^2 = ${omega * omega}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const k = 2 * rng.int(5, 50)
  const A = rng.int(1, 8)
  const E = 0.5 * k * A * A

  return {
    statement: `A block-spring system has spring constant $k = ${k}$ N/m and amplitude $A = ${A}$ m. Find the total mechanical energy $E$ in Joules.`,
    answer: { kind: 'number', value: String(E) },
    solution: [
      { text: 'Total mechanical energy of a simple harmonic oscillator is $E = \\frac{1}{2} k A^2$:' },
      { text: 'Compute energy:', tex: `E = \\frac{1}{2} \\cdot ${k} \\cdot ${A}^2 = ${E}` },
    ],
    hints: [
      'Recall $E = \\frac{1}{2} k A^2$.',
      `Multiply $\\frac{${k}}{2}$ by $A^2 = ${A * A}$.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['amplitude_from_initial', 'speed_at_position', 'diff_eq_acceleration'] as const)

  if (shape === 'amplitude_from_initial') {
    const pyth = rng.pick([
      { a: 3, b: 4, c: 5 },
      { a: 5, b: 12, c: 13 },
      { a: 6, b: 8, c: 10 },
      { a: 8, b: 15, c: 17 },
      { a: 9, b: 12, c: 15 },
    ])
    const omega = rng.int(2, 10)
    const x0 = pyth.a
    const v0 = pyth.b * omega
    const A = pyth.c

    return {
      statement: `An oscillator with angular frequency $\\omega = ${omega}$ rad/s has initial displacement $x(0) = ${x0}$ m and initial velocity $v(0) = -${v0}$ m/s. Find its amplitude $A$ in meters.`,
      answer: { kind: 'number', value: String(A) },
      solution: [
        { text: 'Amplitude is related to initial conditions by $A = \\sqrt{x(0)^2 + \\left(\\frac{v(0)}{\\omega}\\right)^2}$:' },
        { text: 'Compute amplitude:', tex: `A = \\sqrt{${x0}^2 + \\left(\\frac{-${v0}}{${omega}}\\right)^2} = \\sqrt{${x0 * x0} + ${pyth.b * pyth.b}} = ${A}` },
      ],
      hints: [
        'Use $A^2 = x_0^2 + (v_0/\\omega)^2$.',
        `Calculate $\\frac{v_0}{\\omega} = ${pyth.b}$, then $A = \\sqrt{${x0}^2 + ${pyth.b}^2}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'speed_at_position') {
    const pyth = rng.pick([
      { x: 3, A: 5, rem: 4 },
      { x: 6, A: 10, rem: 8 },
      { x: 5, A: 13, rem: 12 },
      { x: 8, A: 10, rem: 6 },
      { x: 12, A: 13, rem: 5 },
      { x: 9, A: 15, rem: 12 },
    ])
    const omega = rng.int(2, 12)
    const { x, A, rem } = pyth
    const v = omega * rem

    return {
      statement: `A harmonic oscillator with angular frequency $\\omega = ${omega}$ rad/s has amplitude $A = ${A}$ m. Find its speed in m/s when passing position $x = ${x}$ m.`,
      answer: { kind: 'number', value: String(v) },
      solution: [
        { text: 'Speed at displacement $x$ is $v = \\omega \\sqrt{A^2 - x^2}$:' },
        { text: 'Compute speed:', tex: `v = ${omega} \\cdot \\sqrt{${A}^2 - ${x}^2} = ${omega} \\cdot ${rem} = ${v}` },
      ],
      hints: [
        'Recall $v = \\omega \\sqrt{A^2 - x^2}$.',
        `Evaluate $\\sqrt{${A * A} - ${x * x}} = ${rem}$, then multiply by $\\omega = ${omega}$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const omega = rng.int(2, 12)
  const xVal = rng.int(2, 10)
  const aVal = -omega * omega * xVal

  return {
    statement: `An object undergoing simple harmonic motion with $\\omega = ${omega}$ rad/s is at position $x = ${xVal}$ m at time $t_1$. Find its acceleration in m/s$^2$ at time $t_1$.`,
    answer: { kind: 'number', value: String(aVal) },
    solution: [
      { text: 'Harmonic motion satisfies $a(t) = -\\omega^2 x(t)$:' },
      { text: 'Compute acceleration:', tex: `a = -${omega}^2 \\cdot ${xVal} = ${aVal}` },
    ],
    hints: [
      'Recall $a = -\\omega^2 x$.',
      `Substitute $\\omega = ${omega}$ and $x = ${xVal}$.`,
    ],
    inputHint: 'Enter a signed integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['phase_space_semi_axis', 'energy_equal_split_position', 'phase_space_area'] as const)

  if (shape === 'phase_space_semi_axis') {
    const A = rng.int(2, 15)
    const omega = rng.int(2, 12)
    const vmax = A * omega
    const askVelocityAxis = rng.pick([true, false])

    if (askVelocityAxis) {
      return {
        statement: `A harmonic oscillator of amplitude $A = ${A}$ m and angular frequency $\\omega = ${omega}$ rad/s traces an ellipse in phase space $(x, v)$. Find the length of the semi-axis along the velocity axis ($v$-axis) in m/s.`,
        answer: { kind: 'number', value: String(vmax) },
        solution: [
          { text: 'The phase-space trajectory is $\\frac{x^2}{A^2} + \\frac{v^2}{(A\\omega)^2} = 1$, so the velocity semi-axis is $v_{\\text{max}} = A\\omega$:' },
          { text: 'Compute velocity semi-axis:', tex: `v_{\\text{max}} = ${A} \\cdot ${omega} = ${vmax}` },
        ],
        hints: [
          'The semi-axis along the $v$-axis is the maximum speed $v_{\\text{max}} = A \\omega$.',
          `$v_{\\text{max}} = ${A} \\cdot ${omega} = ${vmax}$ m/s.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `A harmonic oscillator with angular frequency $\\omega = ${omega}$ rad/s has maximum speed $v_{\\text{max}} = ${vmax}$ m/s. Find the length of the semi-axis along the position axis ($x$-axis) in meters.`,
      answer: { kind: 'number', value: String(A) },
      solution: [
        { text: 'The semi-axis along the $x$-axis is the amplitude $A = \\frac{v_{\\text{max}}}{\\omega}$:' },
        { text: 'Compute position semi-axis:', tex: `A = \\frac{${vmax}}{${omega}} = ${A}` },
      ],
      hints: [
        'The semi-axis along the $x$-axis is the amplitude $A = \\frac{v_{\\text{max}}}{\\omega}$.',
        `$A = \\frac{${vmax}}{${omega}} = ${A}$ m.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'energy_equal_split_position') {
    const askTriple = rng.pick([true, false])
    const kFactor = rng.int(1, 12)
    const A = 2 * kFactor

    if (!askTriple) {
      const coef = kFactor
      return {
        statement: `A harmonic oscillator has amplitude $A = ${A}$ m. At what positive displacement $x$ in meters is the kinetic energy equal to the potential energy?`,
        answer: { kind: 'number', value: `${coef}\\sqrt{2}` },
        solution: [
          { text: 'When $E_k = E_p$, potential energy is half the total energy: $\\frac{1}{2} k x^2 = \\frac{1}{2} \\left(\\frac{1}{2} k A^2\\right) \\implies x = \\frac{A}{\\sqrt{2}} = \\frac{A\\sqrt{2}}{2}$:' },
          { text: 'Compute displacement:', tex: `x = \\frac{${A}\\sqrt{2}}{2} = ${coef}\\sqrt{2}` },
        ],
        hints: [
          'Set $E_p = \\frac{1}{2} E_{\\text{total}} \\implies x = \\frac{A}{\\sqrt{2}}$.',
          `For $A = ${A}$, $x = \\frac{${A}}{\\sqrt{2}} = ${coef}\\sqrt{2}$ m.`,
        ],
        inputHint: 'Enter an exact radical expression like 3\\sqrt{2}.',
      }
    }

    const xVal = kFactor
    return {
      statement: `A harmonic oscillator has amplitude $A = ${A}$ m. At what positive displacement $x$ in meters is the kinetic energy equal to three times the potential energy ($E_k = 3 E_p$)?`,
      answer: { kind: 'number', value: String(xVal) },
      solution: [
        { text: 'When $E_k = 3 E_p$, total energy is $E = 4 E_p \\implies \\frac{1}{2} k A^2 = 4 \\left(\\frac{1}{2} k x^2\\right) \\implies x = \\frac{A}{2}$:' },
        { text: 'Compute displacement:', tex: `x = \\frac{${A}}{2} = ${xVal}` },
      ],
      hints: [
        'Substitute $E_k = 3 E_p$ into $E = E_k + E_p = 4 E_p \\implies x = \\frac{A}{2}$.',
        `$x = \\frac{${A}}{2} = ${xVal}$ m.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const A = rng.int(2, 15)
  const Vmax = rng.int(3, 15)
  const areaCoef = A * Vmax

  return {
    statement: `The phase-space trajectory of a harmonic oscillator is an ellipse $\\frac{x^2}{${A * A}} + \\frac{v^2}{${Vmax * Vmax}} = 1$. Find the area enclosed by the trajectory in phase space in m$\\cdot$m/s.`,
    answer: { kind: 'number', value: `${areaCoef}\\pi` },
    solution: [
      { text: 'Area of an ellipse with semi-axes $a = A$ and $b = v_{\\text{max}}$ is $\\text{Area} = \\pi a b$:' },
      { text: 'Compute area:', tex: `\\text{Area} = \\pi \\cdot ${A} \\cdot ${Vmax} = ${areaCoef}\\pi` },
    ],
    hints: [
      'Use the ellipse area formula $\\text{Area} = \\pi a b$.',
      `Semi-axes are $a = ${A}$ and $b = ${Vmax}$.`,
    ],
    inputHint: 'Enter an exact expression with \\pi like 12\\pi.',
  }
}

export const template: SkillTemplate = {
  skillId: 'oscillator_phase',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
