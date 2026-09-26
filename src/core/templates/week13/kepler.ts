import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `Newton’s law of universal gravitation gives force $F = G \\frac{m_1 m_2}{r^2}$ and surface gravity $g(r) = g_0 \\left(\\frac{R}{r}\\right)^2$.
Circular orbital speed at radius $r$ around mass $M$ is $v = \\sqrt{\\frac{GM}{r}}$, with orbital period $T = \\frac{2\\pi r}{v} = 2\\pi \\sqrt{\\frac{r^3}{GM}}$.
Kepler’s third law states $T^2 \\propto a^3$, so orbital periods and semi-major axes satisfy $\\left(\\frac{T_2}{T_1}\\right)^2 = \\left(\\frac{a_2}{a_1}\\right)^3$.
Escape velocity from radius $r$ is $v_{\\text{esc}} = \\sqrt{\\frac{2GM}{r}} = \\sqrt{2} v_{\\text{orbit}}$.
Kepler’s second law states that orbiting bodies sweep out equal areas in equal times, moving fastest at perihelion.
Common mistakes: Forgetting that gravitational force and acceleration follow an inverse-square law $\\frac{1}{r^2}$, not $\\frac{1}{r}$.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['gravity_force_ratio', 'surface_gravity_height_ratio', 'circular_orbital_speed_exact'] as const)

  if (shape === 'gravity_force_ratio') {
    const F1 = 4 * rng.int(2, 30)
    const distFactor = rng.pick([2, 3, 4, 5])
    const massFactor = rng.pick([1, 2, 3])
    const F2val = (F1 * massFactor) / (distFactor * distFactor)

    let ansVal: string
    if (Number.isInteger(F2val)) {
      ansVal = String(F2val)
    } else {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const num = F1 * massFactor
      const denom = distFactor * distFactor
      const d = gcd(num, denom)
      ansVal = `\\frac{${num / d}}{${denom / d}}`
    }

    const massText = massFactor === 1 ? '' : `, and one mass is ${massFactor === 2 ? 'doubled' : 'tripled'}`

    return {
      statement: `Two masses experience a gravitational force of $F_1 = ${F1}$ N at distance $r$. If the separation distance is increased to $r_2 = ${distFactor}r${massText}$, find the new gravitational force $F_2$ in Newtons.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: 'Gravitational force follows $F \\propto \\frac{m_1 m_2}{r^2}$:' },
        { text: 'Compute new force:', tex: `F_2 = \\frac{${F1} \\cdot ${massFactor}}{${distFactor}^2} = ${ansVal}` },
      ],
      hints: [
        `Distance factor ${distFactor} decreases force by ${distFactor * distFactor}${massFactor > 1 ? `, while mass factor ${massFactor} increases force by ${massFactor}` : ''}.`,
        `$F_2 = \\frac{${F1 * massFactor}}{${distFactor}^2} = ${ansVal}$ N.`,
      ],
      inputHint: 'Enter an integer or fraction.',
    }
  }

  if (shape === 'surface_gravity_height_ratio') {
    const k = rng.pick([1, 2, 3, 4, 9])
    const g0 = rng.pick([10, 20])
    const rFactor = 1 + k
    const denom = rFactor * rFactor

    let ansVal: string
    if (g0 % denom === 0) {
      ansVal = String(g0 / denom)
    } else {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const d = gcd(g0, denom)
      ansVal = `\\frac{${g0 / d}}{${denom / d}}`
    }

    return {
      statement: `At a planet's surface (radius $R$), acceleration due to gravity is $g_0 = ${g0}$ m/s$^2$. Find $g$ in m/s$^2$ at an altitude $h = ${k === 1 ? '' : k}R$ above the surface.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: 'Distance from center is $r = ${rFactor} R$:' },
        { text: 'Compute gravity:', tex: `g = g_0 \\cdot \\left(\\frac{R}{r}\\right)^2 = ${g0} \\cdot \\left(\\frac{1}{${rFactor}}\\right)^2 = ${ansVal}` },
      ],
      hints: [
        `Distance from planet center is $r = ${rFactor}R$.`,
        `$g = ${g0} \\cdot \\left(\\frac{1}{${rFactor}}\\right)^2 = ${ansVal}$ m/s$^2$.`,
      ],
      inputHint: 'Enter an exact integer or fraction.',
    }
  }

  const kMult = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15])
  const muExp = rng.pick([12, 14, 16])
  const rExp = muExp - 8
  const v = 10000 * kMult

  return {
    statement: `A satellite orbits in a circle of radius $r = 10^{${rExp}}$ m around a body with gravitational parameter $GM = ${kMult * kMult} \\times 10^{${muExp}}$ m$^3$/s$^2$. Find its orbital speed $v$ in m/s.`,
    answer: { kind: 'number', value: String(v) },
    solution: [
      { text: 'Circular orbital speed is $v = \\sqrt{\\frac{GM}{r}}$:' },
      { text: 'Compute speed:', tex: `v = \\sqrt{\\frac{${kMult * kMult} \\times 10^{${muExp}}}{10^{${rExp}}}} = \\sqrt{${kMult * kMult} \\times 10^{8}} = ${v}` },
    ],
    hints: [
      'Use $v = \\sqrt{\\frac{GM}{r}}$.',
      `$v = \\sqrt{${kMult * kMult} \\times 10^{8}} = ${v}$ m/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['keplers_third_law_ratio', 'orbital_period_from_mu_and_r', 'escape_velocity_vs_orbital_speed'] as const)

  if (shape === 'keplers_third_law_ratio') {
    const askForA = rng.pick([true, false])
    const sqrtA = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10])
    const a2 = sqrtA * sqrtA
    const T2 = sqrtA * sqrtA * sqrtA

    if (askForA) {
      return {
        statement: `Planet A orbits a star at semi-major axis $a_1 = 1$ AU with period $T_1 = 1$ year. Planet B orbits the same star with orbital period $T_2 = ${T2}$ years. Find the semi-major axis $a_2$ of Planet B in AU.`,
        answer: { kind: 'number', value: String(a2) },
        solution: [
          { text: 'By Kepler’s third law $\\left(\\frac{a_2}{a_1}\\right)^3 = \\left(\\frac{T_2}{T_1}\\right)^2 \\implies a_2 = T_2^{2/3}$:' },
          { text: 'Compute semi-major axis:', tex: `a_2 = (${T2})^{2/3} = (${sqrtA}^3)^{2/3} = ${sqrtA}^2 = ${a2}` },
        ],
        hints: [
          'Use Kepler’s third law $a_2 = T_2^{2/3}$.',
          `$a_2 = (${T2})^{2/3} = ${a2}$ AU.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `Planet A orbits a star at semi-major axis $a_1 = 1$ AU with period $T_1 = 1$ year. Planet B orbits the same star at semi-major axis $a_2 = ${a2}$ AU. Find the orbital period $T_2$ of Planet B in years.`,
      answer: { kind: 'number', value: String(T2) },
      solution: [
        { text: 'By Kepler’s third law $\\left(\\frac{T_2}{T_1}\\right)^2 = \\left(\\frac{a_2}{a_1}\\right)^3 \\implies T_2 = a_2^{3/2}$:' },
        { text: 'Compute period:', tex: `T_2 = ${a2}^{3/2} = (${sqrtA})^3 = ${T2}` },
      ],
      hints: [
        'Use Kepler’s third law $T_2 = a_2^{3/2}$.',
        `$T_2 = (${a2})^{3/2} = ${sqrtA}^3 = ${T2}$ years.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'orbital_period_from_mu_and_r') {
    const kFactor = rng.pick([200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500, 1800, 2000, 2400, 2500, 3000, 3600, 4000, 4500, 5000])
    const ansVal = `${2 * kFactor}\\pi`

    return {
      statement: `A spacecraft orbits in a circular orbit where $\\sqrt{\\frac{r^3}{GM}} = ${kFactor}$ seconds. Find its orbital period $T$ in seconds.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: 'Orbital period is given by $T = 2\\pi \\sqrt{\\frac{r^3}{GM}}$:' },
        { text: 'Compute period:', tex: `T = 2\\pi \\cdot ${kFactor} = ${ansVal}` },
      ],
      hints: [
        'Recall $T = 2\\pi \\sqrt{\\frac{r^3}{GM}}$.',
        `Multiply ${kFactor} by $2\\pi$ to get $T = ${ansVal}$ s.`,
      ],
      inputHint: 'Enter an exact expression with \\pi like 2000\\pi.',
    }
  }

  const vorbit = 100 * rng.int(2, 40)
  const askForEscape = rng.pick([true, false])

  if (askForEscape) {
    return {
      statement: `A satellite in a circular orbit around a planet has orbital speed $v_{\\text{orbit}} = ${vorbit}$ m/s. Find the minimum escape velocity $v_{\\text{esc}}$ from this orbital radius in m/s.`,
      answer: { kind: 'number', value: `${vorbit}\\sqrt{2}` },
      solution: [
        { text: 'Escape velocity is related to circular orbital speed by $v_{\\text{esc}} = \\sqrt{2} v_{\\text{orbit}}$:' },
        { text: 'Compute escape velocity:', tex: `v_{\\text{esc}} = ${vorbit}\\sqrt{2}` },
      ],
      hints: [
        'Recall $v_{\\text{esc}} = \\sqrt{2} v_{\\text{orbit}}$.',
        `Multiply $v_{\\text{orbit}} = ${vorbit}$ by $\\sqrt{2}$.`,
      ],
      inputHint: 'Enter an exact radical expression like 400\\sqrt{2}.',
    }
  }

  return {
    statement: `A satellite near a planet has minimum escape velocity $v_{\\text{esc}} = ${vorbit}\\sqrt{2}$ m/s from its radius. Find its circular orbital speed $v_{\\text{orbit}}$ in m/s.`,
    answer: { kind: 'number', value: String(vorbit) },
    solution: [
      { text: 'Circular orbital speed is related to escape velocity by $v_{\\text{orbit}} = \\frac{v_{\\text{esc}}}{\\sqrt{2}}$:' },
      { text: 'Compute orbital speed:', tex: `v_{\\text{orbit}} = \\frac{${vorbit}\\sqrt{2}}{\\sqrt{2}} = ${vorbit}` },
    ],
    hints: [
      'Recall $v_{\\text{orbit}} = \\frac{v_{\\text{esc}}}{\\sqrt{2}}$.',
      `Divide $v_{\\text{esc}} = ${vorbit}\\sqrt{2}$ by $\\sqrt{2}$ to get $v_{\\text{orbit}} = ${vorbit}$ m/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['kepler_second_law_perihelion_aphelion', 'semi_major_axis_and_period_elliptical', 'orbit_energy_choice'] as const)

  if (shape === 'kepler_second_law_perihelion_aphelion') {
    const rpFactor = rng.pick([1, 2, 3, 4, 5])
    const ratio = rng.pick([2, 3, 4, 5, 6, 8, 10])
    const raFactor = rpFactor * ratio
    const va = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15])
    const vp = va * ratio
    const askForVp = rng.pick([true, false])

    if (askForVp) {
      return {
        statement: `A comet in an elliptical orbit around the Sun has perihelion distance $r_p = ${rpFactor} \\times 10^{10}$ m and aphelion distance $r_a = ${raFactor} \\times 10^{10}$ m. If its speed at aphelion is $v_a = ${va}$ km/s, find its speed at perihelion $v_p$ in km/s.`,
        answer: { kind: 'number', value: String(vp) },
        solution: [
          { text: 'By conservation of angular momentum (Kepler’s second law), $r_p v_p = r_a v_a \\implies v_p = \\frac{r_a v_a}{r_p}$:' },
          { text: 'Compute perihelion speed:', tex: `v_p = \\frac{${raFactor} \\times 10^{10} \\cdot ${va}}{${rpFactor} \\times 10^{10}} = ${ratio} \\cdot ${va} = ${vp}` },
        ],
        hints: [
          'Use $r_p v_p = r_a v_a$.',
          `$v_p = \\frac{r_a}{r_p} v_a = ${ratio} \\cdot ${va} = ${vp}$ km/s.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `A comet in an elliptical orbit around the Sun has perihelion distance $r_p = ${rpFactor} \\times 10^{10}$ m and aphelion distance $r_a = ${raFactor} \\times 10^{10}$ m. If its speed at perihelion is $v_p = ${vp}$ km/s, find its speed at aphelion $v_a$ in km/s.`,
      answer: { kind: 'number', value: String(va) },
      solution: [
        { text: 'By conservation of angular momentum (Kepler’s second law), $r_p v_p = r_a v_a \\implies v_a = \\frac{r_p v_p}{r_a}$:' },
        { text: 'Compute aphelion speed:', tex: `v_a = \\frac{${rpFactor} \\times 10^{10} \\cdot ${vp}}{${raFactor} \\times 10^{10}} = \\frac{${vp}}{${ratio}} = ${va}` },
      ],
      hints: [
        'Use $r_p v_p = r_a v_a$.',
        `$v_a = \\frac{r_p}{r_a} v_p = \\frac{${vp}}{${ratio}} = ${va}$ km/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'semi_major_axis_and_period_elliptical') {
    const sqrtA = rng.pick([2, 3, 4, 5, 6, 7])
    const a = sqrtA * sqrtA
    const rp = rng.int(1, a - 1)
    const ra = 2 * a - rp
    const T = sqrtA * sqrtA * sqrtA

    return {
      statement: `An asteroid has perihelion distance $r_p = ${rp}$ AU and aphelion distance $r_a = ${ra}$ AU. Find its orbital period $T$ in years using Kepler’s third law ($T^2 = a^3$).`,
      answer: { kind: 'number', value: String(T) },
      solution: [
        { text: 'First calculate semi-major axis $a = \\frac{r_p + r_a}{2}$, then apply $T = a^{3/2}$:' },
        { text: 'Compute period:', tex: `a = \\frac{${rp} + ${ra}}{2} = ${a} \\text{ AU}, \\quad T = ${a}^{3/2} = ${T}` },
      ],
      hints: [
        'Find semi-major axis $a = \\frac{r_p + r_a}{2}$.',
        `$a = ${a}$ AU, so $T = (${a})^{3/2} = ${T}$ years.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const qKind = rng.pick(['elliptical', 'parabolic', 'hyperbolic'] as const)

  if (qKind === 'elliptical') {
    const allOpts: ChoiceOption[] = [
      { id: 'correct', label: 'Elliptical orbit: total mechanical energy is negative ($E < 0$)' },
      { id: 'opt2', label: 'Parabolic escape orbit: total mechanical energy is strictly positive ($E > 0$)' },
      { id: 'opt3', label: 'Hyperbolic unbound orbit: total mechanical energy is zero ($E = 0$)' },
      { id: 'opt4', label: 'Circular orbit: gravitational force is zero' },
    ]

    return {
      statement: 'Which statement correctly describes the total mechanical energy $E$ for a bound elliptical orbit in a central gravitational field?',
      answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
      solution: [
        { text: 'Bound orbits (ellipses/circles) have negative total energy ($E < 0$), where potential energy dominates kinetic energy.' },
      ],
      hints: [
        'Bound orbits have $E < 0$, parabolic escape orbits have $E = 0$, and hyperbolic orbits have $E > 0$.',
      ],
    }
  }

  if (qKind === 'parabolic') {
    const allOpts: ChoiceOption[] = [
      { id: 'zero', label: 'Parabolic escape orbit: total mechanical energy is zero ($E = 0$)' },
      { id: 'neg', label: 'Parabolic escape orbit: total mechanical energy is negative ($E < 0$)' },
      { id: 'pos', label: 'Parabolic escape orbit: total mechanical energy is strictly positive ($E > 0$)' },
      { id: 'inf', label: 'Parabolic escape orbit: kinetic energy is infinite' },
    ]

    return {
      statement: 'What is the total mechanical energy $E$ of a body on a parabolic escape trajectory around a mass $M$?',
      answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'zero' },
      solution: [
        { text: 'A parabolic escape orbit represents the threshold of escape where total energy is exactly zero ($E = 0$).' },
      ],
      hints: [
        'At infinite separation, both kinetic energy and potential energy approach zero.',
      ],
    }
  }

  const allOpts: ChoiceOption[] = [
    { id: 'pos', label: 'Hyperbolic unbound orbit: total mechanical energy is strictly positive ($E > 0$)' },
    { id: 'zero', label: 'Hyperbolic unbound orbit: total mechanical energy is zero ($E = 0$)' },
    { id: 'neg', label: 'Hyperbolic unbound orbit: total mechanical energy is negative ($E < 0$)' },
    { id: 'none', label: 'Hyperbolic unbound orbit: mechanical energy cannot be defined' },
  ]

  return {
    statement: 'Which condition holds for the total mechanical energy $E$ of an unbound object moving on a hyperbolic trajectory past a star?',
    answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'pos' },
    solution: [
      { text: 'Hyperbolic orbits are unbound with excess kinetic energy at infinity, giving positive total energy ($E > 0$).' },
    ],
    hints: [
      'Unbound orbits with non-zero asymptotic speed at infinity have $E > 0$.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'kepler',
  theory,
  expectedSeconds: { 1: 45, 2: 65, 3: 95 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
