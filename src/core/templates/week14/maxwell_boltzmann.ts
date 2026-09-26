import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `The Maxwell–Boltzmann distribution describes molecular speeds in a gas in thermal equilibrium.
The characteristic speeds are most probable speed $v_p = \\sqrt{\\frac{2kT}{m}}$, mean speed $\\bar{v} = \\sqrt{\\frac{8kT}{\\pi m}}$, and root-mean-square speed $v_{\\text{rms}} = \\sqrt{\\frac{3kT}{m}}$.
Speed ratios satisfy $v_{\\text{rms}} : \\bar{v} : v_p = \\sqrt{3} : \\sqrt{\\frac{8}{\\pi}} : \\sqrt{2}$, with $v_{\\text{rms}} > \\bar{v} > v_p$.
RMS speed scales with temperature $T$ and molar mass $M$ as $v_{\\text{rms}} \\propto \\sqrt{\\frac{T}{M}}$.
Average kinetic energy per molecule is $\\bar{E}_k = \\frac{3}{2} kT$, and per mole is $\\bar{E}_{k,\\text{mol}} = \\frac{3}{2} RT$.
The relative population of two energy levels separated by $\\Delta E$ is given by the Boltzmann factor $\\frac{N_2}{N_1} = e^{-\\Delta E / (kT)}$.
As temperature rises, the MB distribution peak shifts right to higher speeds, lowers in height, and broadens, while the total area remains 1.
Common mistakes: Confusing $v_p$ with $v_{\\text{rms}}$ or forgetting that speed scales with $\\sqrt{T}$, not $T$.`

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

function makeFrac(num: number, den: number): string {
  if (den === 0) return '0'
  if (num % den === 0) return String(num / den)
  const g = gcd(num, den)
  const n = num / g
  const d = den / g
  if (d < 0) return `\\frac{${-n}}{${-d}}`
  return `\\frac{${n}}{${d}}`
}

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['rms_speed_temperature_scaling', 'rms_speed_molar_mass_ratio', 'mean_kinetic_energy_molecule'] as const)

  if (shape === 'rms_speed_temperature_scaling') {
    const k = rng.pick([4, 9, 16, 25])
    const r = Math.round(Math.sqrt(k))
    const v1 = 100 * rng.int(1, 10)
    const v2 = v1 * r
    const t1C = rng.pick([27, 77, 127, 227])
    const T1 = t1C + 273
    const T2 = T1 * k

    return {
      statement: `An ideal gas has root-mean-square speed $v_{\\text{rms},1} = ${v1}$ m/s at temperature $T_1 = ${T1}$ K. If absolute temperature is increased to $T_2 = ${T2}$ K (a factor of ${k}), find the new RMS speed $v_{\\text{rms},2}$ in m/s.`,
      answer: { kind: 'number', value: String(v2) },
      solution: [
        { text: 'RMS speed scales as $v_{\\text{rms}} \\propto \\sqrt{T}$:' },
        { text: 'Compute new speed:', tex: `v_{\\text{rms},2} = v_{\\text{rms},1} \\cdot \\sqrt{\\frac{T_2}{T_1}} = ${v1} \\cdot \\sqrt{${k}} = ${v1} \\cdot ${r} = ${v2}` },
      ],
      hints: [
        `$v_{\\text{rms}}$ increases by a factor of $\\sqrt{${k}} = ${r}$.`,
        `$v_{\\text{rms},2} = ${v1} \\cdot ${r} = ${v2}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'rms_speed_molar_mass_ratio') {
    const pair = rng.pick([
      { name1: 'hydrogen (M = 2 g/mol)', name2: 'oxygen (M = 32 g/mol)', ratio: 16, sqrtRatio: 4 },
      { name1: 'helium (M = 4 g/mol)', name2: 'oxygen (M = 36 g/mol)', ratio: 9, sqrtRatio: 3 },
      { name1: 'hydrogen (M = 2 g/mol)', name2: 'heavy gas (M = 50 g/mol)', ratio: 25, sqrtRatio: 5 },
      { name1: 'helium (M = 4 g/mol)', name2: 'methane (M = 16 g/mol)', ratio: 4, sqrtRatio: 2 },
      { name1: 'hydrogen (M = 2 g/mol)', name2: 'helium (M = 8 g/mol)', ratio: 4, sqrtRatio: 2 },
      { name1: 'hydrogen (M = 2 g/mol)', name2: 'krypton (M = 98 g/mol)', ratio: 49, sqrtRatio: 7 },
      { name1: 'helium (M = 4 g/mol)', name2: 'xenon (M = 100 g/mol)', ratio: 25, sqrtRatio: 5 },
      { name1: 'methane (M = 16 g/mol)', name2: 'sulfur dioxide (M = 64 g/mol)', ratio: 4, sqrtRatio: 2 },
    ])
    const v2 = 50 * rng.int(2, 16)
    const v1 = v2 * pair.sqrtRatio

    return {
      statement: `At the same temperature, ${pair.name2} has RMS speed $v_2 = ${v2}$ m/s. Find the RMS speed $v_1$ in m/s of ${pair.name1}.`,
      answer: { kind: 'number', value: String(v1) },
      solution: [
        { text: 'RMS speed scales inversely with square root of molar mass: $v \\propto \\frac{1}{\\sqrt{M}}$:' },
        { text: 'Compute speed ratio and value:', tex: `\\frac{v_1}{v_2} = \\sqrt{\\frac{M_2}{M_1}} = \\sqrt{${pair.ratio}} = ${pair.sqrtRatio} \\implies v_1 = ${v2} \\cdot ${pair.sqrtRatio} = ${v1}` },
      ],
      hints: [
        `$\\frac{v_1}{v_2} = \\sqrt{\\frac{M_2}{M_1}} = ${pair.sqrtRatio}$.`,
        `$v_1 = ${v2} \\cdot ${pair.sqrtRatio} = ${v1}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const tC = rng.pick([27, 77, 127, 177, 227, 277, 327, 377, 427, 527])
  const TK = tC + 273
  const EkValInt = (3 * 83 * TK) / 20 // 12.45 * TK

  let valStr: string
  if (Number.isInteger(EkValInt)) {
    valStr = String(EkValInt)
  } else {
    valStr = makeFrac(3 * 83 * TK, 20)
  }

  return {
    statement: `Find the mean translational kinetic energy per mole $\\bar{E}_{k,\\text{mol}}$ in Joules for an ideal gas at temperature $t = ${tC}^{\\circ}$C using $R = 8.3$ J/(mol$\\cdot$K) and $T = t + 273$.`,
    answer: { kind: 'number', value: valStr },
    solution: [
      { text: 'Convert temperature to Kelvin: $T = t + 273 = ${TK}$ K:' },
      { text: 'Apply mean kinetic energy formula $\\bar{E}_{k,\\text{mol}} = \\frac{3}{2} RT$:', tex: `\\bar{E}_{k,\\text{mol}} = \\frac{3}{2} \\cdot 8.3 \\cdot ${TK} = ${valStr}` },
    ],
    hints: [
      `$T = ${TK}$ K.`,
      `$\\bar{E}_{k,\\text{mol}} = \\frac{3}{2} \\cdot 8.3 \\cdot ${TK} = ${valStr}$ J.`,
    ],
    inputHint: 'Enter an exact integer or fraction.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['speed_ratios_vp_vbar_vrms', 'boltzmann_factor_ratio', 'exact_vrms_value'] as const)

  if (shape === 'speed_ratios_vp_vbar_vrms') {
    const vp = 10 * rng.pick([16, 20, 24, 28, 30, 32, 36, 40, 44, 48, 50, 52, 56, 60, 64, 70, 72, 80, 84, 90, 96, 100, 120, 140, 150, 160, 180, 200])
    const askSquared = rng.pick([true, false])

    if (askSquared) {
      const vrmsSq = (vp * vp * 3) / 2
      return {
        statement: `For a gas with most probable speed $v_p = ${vp}$ m/s, find the square of its root-mean-square speed $v_{\\text{rms}}^2$ in m$^2$/s$^2$.`,
        answer: { kind: 'number', value: String(vrmsSq) },
        solution: [
          { text: 'Recall $v_p = \\sqrt{\\frac{2kT}{m}}$ and $v_{\\text{rms}} = \\sqrt{\\frac{3kT}{m}} \\implies \\frac{v_{\\text{rms}}^2}{v_p^2} = \\frac{3}{2}$:' },
          { text: 'Compute $v_{\\text{rms}}^2$:', tex: `v_{\\text{rms}}^2 = \\frac{3}{2} v_p^2 = \\frac{3}{2} \\cdot ${vp * vp} = ${vrmsSq}` },
        ],
        hints: [
          'Use $\\frac{v_{\\text{rms}}^2}{v_p^2} = \\frac{3}{2}$.',
          `$v_{\\text{rms}}^2 = \\frac{3}{2} \\cdot ${vp * vp} = ${vrmsSq}$ m$^2$/s$^2$.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    // Simplified radical: vp * sqrt(6)/2 = (vp / 2) * sqrt(6)
    const coef = vp / 2
    const ansVal = `${coef}\\sqrt{6}`

    return {
      statement: `A gas has most probable speed $v_p = ${vp}$ m/s. Find its root-mean-square speed $v_{\\text{rms}}$ in exact simplified radical form in m/s.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: 'Use $v_{\\text{rms}} = v_p \\cdot \\sqrt{\\frac{3}{2}} = v_p \\cdot \\frac{\\sqrt{6}}{2}$:' },
        { text: 'Compute $v_{\\text{rms}}$:', tex: `v_{\\text{rms}} = \\frac{${vp}\\sqrt{6}}{2} = ${ansVal}` },
      ],
      hints: [
        'Recall $v_{\\text{rms}} = v_p \\sqrt{\\frac{3}{2}} = \\frac{v_p \\sqrt{6}}{2}$.',
        `$v_{\\text{rms}} = ${ansVal}$ m/s.`,
      ],
      inputHint: 'Enter an exact radical expression like 100\\sqrt{6}.',
    }
  }

  if (shape === 'boltzmann_factor_ratio') {
    const deltaECoef = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20])
    const askUpperLower = rng.pick([true, false])

    if (askUpperLower) {
      const ansVal = `e^{-${deltaECoef}}`
      return {
        statement: `Two quantum state energy levels of a molecule differ by $\\Delta E = ${deltaECoef} kT$. Find the exact ratio of populations $\\frac{N_2}{N_1}$ (upper to lower state) according to the Boltzmann distribution.`,
        answer: { kind: 'number', value: ansVal },
        solution: [
          { text: 'The Boltzmann ratio is given by $\\frac{N_2}{N_1} = e^{-\\Delta E / (kT)}$:' },
          { text: 'Substitute $\\Delta E = ${deltaECoef} kT$:', tex: `\\frac{N_2}{N_1} = e^{-\\frac{${deltaECoef} kT}{kT}} = e^{-${deltaECoef}}` },
        ],
        hints: [
          'Use the Boltzmann factor $\\frac{N_2}{N_1} = e^{-\\Delta E / (kT)}$.',
          `$\\frac{N_2}{N_1} = e^{-${deltaECoef}}$.`,
        ],
        inputHint: 'Enter an exact exponential expression like e^{-2}.',
      }
    }

    const ansVal = `e^{${deltaECoef}}`
    return {
      statement: `Two quantum state energy levels of a molecule differ by $\\Delta E = ${deltaECoef} kT$. Find the exact ratio of populations $\\frac{N_1}{N_2}$ (lower to upper state) according to the Boltzmann distribution.`,
      answer: { kind: 'number', value: ansVal },
      solution: [
        { text: 'The ratio of lower to upper state population is $\\frac{N_1}{N_2} = e^{\\Delta E / (kT)}$:' },
        { text: 'Substitute $\\Delta E = ${deltaECoef} kT$:', tex: `\\frac{N_1}{N_2} = e^{\\frac{${deltaECoef} kT}{kT}} = e^{${deltaECoef}}` },
      ],
      hints: [
        'Use $\\frac{N_1}{N_2} = e^{\\Delta E / (kT)}$.',
        `$\\frac{N_1}{N_2} = e^{${deltaECoef}}$.`,
      ],
      inputHint: 'Enter an exact exponential expression like e^{2}.',
    }
  }

  const vrmsVal = 10 * rng.pick([15, 18, 20, 24, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100, 120, 140, 150, 160, 180, 200, 220, 250, 300, 350, 400, 450, 500])
  const vrmsSq = vrmsVal * vrmsVal

  return {
    statement: `In a gas at thermal equilibrium, $\\frac{3kT}{m} = ${vrmsSq}$ m$^2$/s$^2$. Find the root-mean-square speed $v_{\\text{rms}}$ of the gas molecules in m/s.`,
    answer: { kind: 'number', value: String(vrmsVal) },
    solution: [
      { text: 'Root-mean-square speed is $v_{\\text{rms}} = \\sqrt{\\frac{3kT}{m}}$:' },
      { text: 'Compute $v_{\\text{rms}}$:', tex: `v_{\\text{rms}} = \\sqrt{${vrmsSq}} = ${vrmsVal}` },
    ],
    hints: [
      'Take the square root of $\\frac{3kT}{m}$.',
      `$v_{\\text{rms}} = \\sqrt{${vrmsSq}} = ${vrmsVal}$ m/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['distribution_curve_shape_choice', 'two_state_energy_population', 'vrms_and_pressure_relation', 'rms_speed_two_gases_temperatures'] as const)

  if (shape === 'distribution_curve_shape_choice') {
    const choiceSet = rng.pick([
      {
        stmt: 'Which statement correctly describes how the Maxwell–Boltzmann speed distribution curve changes as temperature increases?',
        correct: 'The peak shifts to higher speed, its height decreases, and the total area under the curve remains 1',
        opt2: 'The peak shifts to higher speed, its height increases, and the total area under the curve increases',
        opt3: 'The peak shifts to lower speed, its height decreases, and the total area remains constant',
        opt4: 'The curve shape remains identical, but shifts uniformly to the right without changing peak height',
      },
      {
        stmt: 'How do the three characteristic speeds of the Maxwell–Boltzmann distribution compare for any gas in thermal equilibrium?',
        correct: 'Root-mean-square speed is highest, followed by mean speed, and most probable speed is lowest ($v_{\\text{rms}} > \\bar{v} > v_p$)',
        opt2: 'Most probable speed is highest, followed by mean speed, and root-mean-square speed is lowest ($v_p > \\bar{v} > v_{\\text{rms}}$)',
        opt3: 'All three characteristic speeds are strictly equal for any ideal gas ($v_{\\text{rms}} = \\bar{v} = v_p$)',
        opt4: 'Mean speed is highest, root-mean-square speed is lowest, and most probable speed is in between',
      },
      {
        stmt: 'What happens to the Maxwell–Boltzmann speed distribution when comparing a heavy gas (large $M$) to a light gas (small $M$) at the same temperature?',
        correct: 'The heavy gas distribution has a higher, narrower peak shifted to lower speeds',
        opt2: 'The heavy gas distribution has a lower, broader peak shifted to higher speeds',
        opt3: 'Both gases have identical speed distribution curves regardless of molar mass',
        opt4: 'The light gas distribution has a higher peak at lower speeds than the heavy gas',
      },
      {
        stmt: 'How does the most probable speed $v_p$ of ideal gas molecules scale with absolute temperature $T$?',
        correct: 'Proportional to the square root of temperature ($v_p \\propto \\sqrt{T}$)',
        opt2: 'Directly proportional to temperature ($v_p \\propto T$)',
        opt3: 'Proportional to the square of temperature ($v_p \\propto T^2$)',
        opt4: 'Independent of temperature',
      },
      {
        stmt: 'What is the physical meaning of the area under the Maxwell–Boltzmann speed distribution curve $f(v)$ integrated from $v = 0$ to $\\infty$?',
        correct: 'It equals 1, representing total probability of a molecule having any speed',
        opt2: 'It equals the total internal energy of the gas',
        opt3: 'It equals the root-mean-square speed of the gas',
        opt4: 'It equals the total pressure exerted by the gas',
      },
    ])

    const allOpts: ChoiceOption[] = [
      { id: 'correct', label: choiceSet.correct },
      { id: 'opt2', label: choiceSet.opt2 },
      { id: 'opt3', label: choiceSet.opt3 },
      { id: 'opt4', label: choiceSet.opt4 },
    ]

    return {
      statement: choiceSet.stmt,
      answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
      solution: [
        { text: `By kinetic theory, ${choiceSet.correct.toLowerCase()}.` },
      ],
      hints: [
        'Higher temperature or lower molar mass shifts average speeds higher.',
        'Total probability area under the distribution curve is always normalized to 1.',
      ],
    }
  }

  if (shape === 'two_state_energy_population') {
    const c = rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20])
    const askForN = rng.pick([true, false])

    if (askForN) {
      return {
        statement: `A two-level system has an energy gap $\\Delta E = ${c} kT$. Find the fraction of molecules in the upper state $\\frac{N_2}{N_1 + N_2}$ if degeneracy is 1, in terms of $e$.`,
        answer: { kind: 'number', value: `\\frac{1}{1+e^{${c}}}` },
        solution: [
          { text: `Population ratio $\\frac{N_2}{N_1} = e^{-${c}} = \\frac{1}{e^{${c}}}$:` },
          { text: `Upper state fraction is $\\frac{N_2}{N_1 + N_2} = \\frac{e^{-${c}}}{1 + e^{-${c}}} = \\frac{1}{1 + e^{${c}}}$:`, tex: `\\text{Fraction} = \\frac{1}{1 + e^{${c}}}` },
        ],
        hints: [
          `Divide numerator and denominator by $e^{-${c}}$.`,
          `$\\text{Fraction} = \\frac{1}{1 + e^{${c}}}$.`,
        ],
        inputHint: 'Enter an exact expression with e.',
      }
    }

    return {
      statement: `The population ratio between two states is $\\frac{N_2}{N_1} = e^{-${c}}$. Find the energy difference $\\Delta E$ in units of $kT$.`,
      answer: { kind: 'number', value: String(c) },
      solution: [
        { text: 'The Boltzmann distribution gives $\\frac{N_2}{N_1} = e^{-\\Delta E / (kT)}$:' },
        { text: `Equating exponents gives $\\Delta E = ${c} kT$:`, tex: `\\Delta E = ${c} \\text{ in units of } kT` },
      ],
      hints: [
        `Compare $e^{-${c}}$ with $e^{-\\Delta E / (kT)}$.`,
        `$\\Delta E = ${c} kT$.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'vrms_and_pressure_relation') {
    const rho = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const vrms = 10 * rng.pick([15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 120, 150, 180, 200, 250, 300])
    const pPa = Math.round((rho * vrms * vrms) / 3)

    return {
      statement: `A gas with density $\\rho = ${rho}$ kg/m$^3$ exerts pressure $p = ${pPa}$ Pa. Find the root-mean-square speed $v_{\\text{rms}}$ of its molecules in m/s using $p = \\frac{1}{3} \\rho v_{\\text{rms}}^2$.`,
      answer: { kind: 'number', value: String(vrms) },
      solution: [
        { text: 'Rearrange kinetic theory pressure formula $p = \\frac{1}{3} \\rho v_{\\text{rms}}^2 \\implies v_{\\text{rms}} = \\sqrt{\\frac{3p}{\\rho}}$:' },
        { text: 'Compute $v_{\\text{rms}}$:', tex: `v_{\\text{rms}} = \\sqrt{\\frac{3 \\cdot ${pPa}}{${rho}}} = \\sqrt{${vrms * vrms}} = ${vrms}` },
      ],
      hints: [
        'Use $v_{\\text{rms}} = \\sqrt{\\frac{3p}{\\rho}}$.',
        `$v_{\\text{rms}} = \\sqrt{${vrms * vrms}} = ${vrms}$ m/s.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const pair = rng.pick([
    { name1: 'hydrogen ($M_1 = 2$ g/mol)', name2: 'oxygen ($M_2 = 32$ g/mol)', ratioT: 2, netRatioSq: 16, netRatio: 4, T1: 300, T2: 600 },
    { name1: 'helium ($M_1 = 4$ g/mol)', name2: 'methane ($M_2 = 16$ g/mol)', ratioT: 9, netRatioSq: 36, netRatio: 6, T1: 200, T2: 1800 },
    { name1: 'hydrogen ($M_1 = 2$ g/mol)', name2: 'helium ($M_2 = 4$ g/mol)', ratioT: 2, netRatioSq: 4, netRatio: 2, T1: 300, T2: 600 },
    { name1: 'helium ($M_1 = 4$ g/mol)', name2: 'oxygen ($M_2 = 32$ g/mol)', ratioT: 2, netRatioSq: 16, netRatio: 4, T1: 400, T2: 800 },
    { name1: 'hydrogen ($M_1 = 2$ g/mol)', name2: 'nitrogen ($M_2 = 28$ g/mol)', ratioT: 7, netRatioSq: 98, netRatio: 7, T1: 300, T2: 2100 },
    { name1: 'methane ($M_1 = 16$ g/mol)', name2: 'sulfur dioxide ($M_2 = 64$ g/mol)', ratioT: 4, netRatioSq: 16, netRatio: 4, T1: 300, T2: 1200 },
  ])
  const v2 = 50 * rng.int(2, 10)
  const v1 = v2 * pair.netRatio

  return {
    statement: `Gas A (${pair.name1}) at $T_1 = ${pair.T1}$ K has RMS speed $v_1$. Gas B (${pair.name2}) at $T_2 = ${pair.T2}$ K has RMS speed $v_2 = ${v2}$ m/s. Find the RMS speed $v_1$ in m/s of Gas A.`,
    answer: { kind: 'number', value: String(v1) },
    solution: [
      { text: 'RMS speed scales as $v_{\\text{rms}} \\propto \\sqrt{\\frac{T}{M}} \\implies \\frac{v_1}{v_2} = \\sqrt{\\frac{T_1 M_2}{T_2 M_1}}$:' },
      { text: 'Compute speed ratio:', tex: `\\frac{v_1}{v_2} = \\sqrt{${pair.netRatioSq}} = ${pair.netRatio} \\implies v_1 = ${v2} \\cdot ${pair.netRatio} = ${v1}` },
    ],
    hints: [
      `$\\frac{v_1}{v_2} = \\sqrt{\\frac{${pair.T1} \\cdot M_2}{${pair.T2} \\cdot M_1}} = ${pair.netRatio}$.`,
      `$v_1 = ${v2} \\cdot ${pair.netRatio} = ${v1}$ m/s.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

export const template: SkillTemplate = {
  skillId: 'maxwell_boltzmann',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
