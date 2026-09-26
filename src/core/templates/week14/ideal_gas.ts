import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `The ideal gas law relates pressure $p$, volume $V$, amount $n$, and absolute temperature $T$: $pV = nRT$.
Temperature MUST be converted from Celsius $t$ ($^{\\circ}$C) to Kelvin $T$ (K) using $T = t + 273$.
The combined gas law for a fixed mass of gas is $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$.
Special cases include isothermal ($T = \\text{const} \\implies p_1 V_1 = p_2 V_2$), isobaric ($p = \\text{const} \\implies \\frac{V_1}{T_1} = \\frac{V_2}{T_2}$), and isochoric ($V = \\text{const} \\implies \\frac{p_1}{T_1} = \\frac{p_2}{T_2}$).
Gas density is $\\rho = \\frac{m}{V} = \\frac{p M}{R T}$ where $M$ is molar mass.
Common mistakes: Forgetting to convert temperatures from Celsius to Kelvin ($T = t + 273$) before using gas laws.`

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
  const shape = rng.pick(['ideal_gas_p_v_n_t', 'isothermal_boyle', 'isobaric_charles'] as const)

  if (shape === 'ideal_gas_p_v_n_t') {
    const tC = rng.pick([27, 127, 227, 327])
    const TK = tC + 273
    const n = rng.int(1, 6)
    const target = rng.pick(['pressure', 'volume', 'moles'] as const)

    if (target === 'pressure') {
      const V = rng.pick([0.1, 0.2, 0.5, 1, 2, 5])
      const pPa = Math.round((n * 8.3 * TK) / V)
      return {
        statement: `An ideal gas of $n = ${n}$ mol occupies a volume $V = ${V}$ m$^3$ at temperature $t = ${tC}^{\\circ}$C. Using $R = 8.3$ J/(mol$\\cdot$K) and $T = t + 273$, find the pressure $p$ in Pascals.`,
        answer: { kind: 'number', value: String(pPa) },
        solution: [
          { text: 'Convert temperature to Kelvin: $T = t + 273$:' },
          { text: 'Apply ideal gas law $p = \\frac{nRT}{V}$:', tex: `T = ${tC} + 273 = ${TK} \\text{ K}, \\quad p = \\frac{${n} \\cdot 8.3 \\cdot ${TK}}{${V}} = ${pPa}` },
        ],
        hints: [
          `$T = ${tC} + 273 = ${TK}$ K.`,
          `$p = \\frac{${n} \\cdot 8.3 \\cdot ${TK}}{${V}} = ${pPa}$ Pa.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    if (target === 'volume') {
      const V0 = rng.pick([0.1, 0.2, 0.5, 1, 2, 5])
      const pPa = Math.round((n * 8.3 * TK) / V0)
      const ansFrac = makeFrac(Math.round(V0 * 10), 10)

      return {
        statement: `An ideal gas of $n = ${n}$ mol is at pressure $p = ${pPa}$ Pa and temperature $t = ${tC}^{\\circ}$C. Using $R = 8.3$ J/(mol$\\cdot$K) and $T = t + 273$, find its volume $V$ in m$^3$.`,
        answer: { kind: 'number', value: ansFrac },
        solution: [
          { text: 'Convert temperature to Kelvin: $T = t + 273$:' },
          { text: 'Apply ideal gas law $V = \\frac{nRT}{p}$:', tex: `T = ${tC} + 273 = ${TK} \\text{ K}, \\quad V = \\frac{${n} \\cdot 8.3 \\cdot ${TK}}{${pPa}} = ${ansFrac}` },
        ],
        hints: [
          `$T = ${tC} + 273 = ${TK}$ K.`,
          `$V = \\frac{${n} \\cdot 8.3 \\cdot ${TK}}{${pPa}} = ${ansFrac}$ m$^3$.`,
        ],
        inputHint: 'Enter an integer or fraction.',
      }
    }

    const V = rng.pick([0.1, 0.2, 0.5, 1, 2, 5])
    const pPa = Math.round((n * 8.3 * TK) / V)

    return {
      statement: `An ideal gas at pressure $p = ${pPa}$ Pa occupies volume $V = ${V}$ m$^3$ at temperature $t = ${tC}^{\\circ}$C. Using $R = 8.3$ J/(mol$\\cdot$K) and $T = t + 273$, find the amount of gas $n$ in moles.`,
      answer: { kind: 'number', value: String(n) },
      solution: [
        { text: 'Convert temperature to Kelvin: $T = t + 273$:' },
        { text: 'Apply ideal gas law $n = \\frac{pV}{RT}$:', tex: `T = ${tC} + 273 = ${TK} \\text{ K}, \\quad n = \\frac{${pPa} \\cdot ${V}}{8.3 \\cdot ${TK}} = ${n}` },
      ],
      hints: [
        `$T = ${tC} + 273 = ${TK}$ K.`,
        `$n = \\frac{${pPa} \\cdot ${V}}{8.3 \\cdot ${TK}} = ${n}$ mol.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'isothermal_boyle') {
    const pair = rng.pick([
      { V1: 2, mVol: 2, isExpand: true },
      { V1: 3, mVol: 3, isExpand: true },
      { V1: 4, mVol: 2, isExpand: true },
      { V1: 6, mVol: 3, isExpand: true },
      { V1: 6, mVol: 2, isExpand: false },
      { V1: 8, mVol: 4, isExpand: false },
      { V1: 9, mVol: 3, isExpand: false },
      { V1: 12, mVol: 3, isExpand: false },
      { V1: 12, mVol: 4, isExpand: false },
    ])
    const V1 = pair.V1
    const V2 = pair.isExpand ? V1 * pair.mVol : V1 / pair.mVol

    const p1Base = 100000 * rng.int(1, 6)
    const p1 = pair.isExpand ? p1Base * pair.mVol : p1Base
    const p2 = pair.isExpand ? p1Base : p1Base * pair.mVol

    return {
      statement: `An ideal gas undergoes an isothermal process ($T = \\text{const}$) changing volume from $V_1 = ${V1}$ m$^3$ at pressure $p_1 = ${p1}$ Pa to volume $V_2 = ${V2}$ m$^3$. Find the final pressure $p_2$ in Pascals.`,
      answer: { kind: 'number', value: String(p2) },
      solution: [
        { text: 'For an isothermal process, $p_1 V_1 = p_2 V_2 \\implies p_2 = \\frac{p_1 V_1}{V_2}$:' },
        { text: 'Compute final pressure:', tex: `p_2 = \\frac{${p1} \\cdot ${V1}}{${V2}} = ${p2}` },
      ],
      hints: [
        'Use Boyle’s law $p_1 V_1 = p_2 V_2$.',
        `$p_2 = \\frac{${p1} \\cdot ${V1}}{${V2}} = ${p2}$ Pa.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const pair = rng.pick([
    { t1C: 27, t2C: 327, T1: 300, T2: 600, num: 2, den: 1 },
    { t1C: 27, t2C: 127, T1: 300, T2: 400, num: 4, den: 3 },
    { t1C: 127, t2C: 327, T1: 400, T2: 600, num: 3, den: 2 },
    { t1C: -23, t2C: 227, T1: 250, T2: 500, num: 2, den: 1 },
    { t1C: 127, t2C: 227, T1: 400, T2: 500, num: 5, den: 4 },
    { t1C: 27, t2C: 627, T1: 300, T2: 900, num: 3, den: 1 },
  ])
  const kVol = rng.int(1, 6)
  const V1 = kVol * pair.den
  const V2 = kVol * pair.num

  return {
    statement: `An ideal gas at constant pressure ($p = \\text{const}$) is heated from $t_1 = ${pair.t1C}^{\\circ}$C to $t_2 = ${pair.t2C}^{\\circ}$C (using $T = t + 273$). If initial volume is $V_1 = ${V1}$ L, find final volume $V_2$ in Liters.`,
    answer: { kind: 'number', value: String(V2) },
    solution: [
      { text: 'Convert temperatures to Kelvin: $T_1 = t_1 + 273$ and $T_2 = t_2 + 273$:' },
      { text: 'Apply Charles’s law $\\frac{V_1}{T_1} = \\frac{V_2}{T_2} \\implies V_2 = V_1 \\cdot \\frac{T_2}{T_1}$:', tex: `T_1 = ${pair.T1} \\text{ K}, \\, T_2 = ${pair.T2} \\text{ K}, \\quad V_2 = ${V1} \\cdot \\frac{${pair.T2}}{${pair.T1}} = ${V2}` },
    ],
    hints: [
      `$T_1 = ${pair.T1}$ K and $T_2 = ${pair.T2}$ K.`,
      `$V_2 = ${V1} \\cdot \\frac{${pair.T2}}{${pair.T1}} = ${V2}$ L.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['combined_gas_law', 'isochoric_gay_lussac', 'moles_and_density'] as const)

  if (shape === 'combined_gas_law') {
    const pair = rng.pick([
      { t1C: 27, t2C: 327, T1: 300, T2: 600, tRatioNum: 2, tRatioDen: 1 },
      { t1C: 27, t2C: 127, T1: 300, T2: 400, tRatioNum: 4, tRatioDen: 3 },
      { t1C: 127, t2C: 327, T1: 400, T2: 600, tRatioNum: 3, tRatioDen: 2 },
      { t1C: -23, t2C: 227, T1: 250, T2: 500, tRatioNum: 2, tRatioDen: 1 },
      { t1C: 127, t2C: 227, T1: 400, T2: 500, tRatioNum: 5, tRatioDen: 4 },
    ])
    const pPair = rng.pick([
      { p1: 200000, p2: 300000, pRatioNum: 2, pRatioDen: 3 },
      { p1: 400000, p2: 200000, pRatioNum: 2, pRatioDen: 1 },
      { p1: 300000, p2: 300000, pRatioNum: 1, pRatioDen: 1 },
      { p1: 100000, p2: 200000, pRatioNum: 1, pRatioDen: 2 },
      { p1: 300000, p2: 400000, pRatioNum: 3, pRatioDen: 4 },
    ])

    // V2 = V1 * (p1/p2) * (T2/T1) = V1 * (pRatioNum / pRatioDen) * (tRatioNum / tRatioDen)
    const netNum = pPair.pRatioNum * pair.tRatioNum
    const netDen = pPair.pRatioDen * pair.tRatioDen
    const g = gcd(netNum, netDen)
    const simpleNum = netNum / g
    const simpleDen = netDen / g

    const kVol = rng.int(1, 5)
    const V1 = kVol * simpleDen
    const V2 = kVol * simpleNum

    return {
      statement: `A fixed mass of ideal gas changes state from $p_1 = ${pPair.p1}$ Pa, $V_1 = ${V1}$ L, $t_1 = ${pair.t1C}^{\\circ}$C to $p_2 = ${pPair.p2}$ Pa, $t_2 = ${pair.t2C}^{\\circ}$C (using $T = t + 273$). Find the final volume $V_2$ in Liters.`,
      answer: { kind: 'number', value: String(V2) },
      solution: [
        { text: 'Convert temperatures to Kelvin: $T_1 = t_1 + 273 = ${pair.T1}$ K, $T_2 = t_2 + 273 = ${pair.T2}$ K:' },
        { text: 'Apply combined gas law $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2} \\implies V_2 = \\frac{p_1 V_1 T_2}{p_2 T_1}$:', tex: `V_2 = \\frac{${pPair.p1} \\cdot ${V1} \\cdot ${pair.T2}}{${pPair.p2} \\cdot ${pair.T1}} = ${V2}` },
      ],
      hints: [
        `$T_1 = ${pair.T1}$ K and $T_2 = ${pair.T2}$ K.`,
        `$V_2 = \\frac{${pPair.p1} \\cdot ${V1} \\cdot ${pair.T2}}{${pPair.p2} \\cdot ${pair.T1}} = ${V2}$ L.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'isochoric_gay_lussac') {
    const pair = rng.pick([
      { t1C: 27, t2C: 327, T1: 300, T2: 600, num: 2, den: 1 },
      { t1C: 27, t2C: 127, T1: 300, T2: 400, num: 4, den: 3 },
      { t1C: 127, t2C: 327, T1: 400, T2: 600, num: 3, den: 2 },
      { t1C: -23, t2C: 227, T1: 250, T2: 500, num: 2, den: 1 },
      { t1C: 127, t2C: 227, T1: 400, T2: 500, num: 5, den: 4 },
      { t1C: 27, t2C: 627, T1: 300, T2: 900, num: 3, den: 1 },
    ])
    const kP = 100000 * rng.int(1, 4)
    const p1 = kP * pair.den
    const p2 = kP * pair.num
    const askTemp = rng.pick([true, false])

    if (askTemp) {
      return {
        statement: `A rigid vessel ($V = \\text{const}$) contains gas at $p_1 = ${p1}$ Pa and $t_1 = ${pair.t1C}^{\\circ}$C. Heated until pressure reaches $p_2 = ${p2}$ Pa, find final temperature $t_2$ in $^{\\circ}$C (using $T = t + 273$).`,
        answer: { kind: 'number', value: String(pair.t2C) },
        solution: [
          { text: 'Convert $t_1$ to Kelvin: $T_1 = ${pair.t1C} + 273 = ${pair.T1}$ K:' },
          { text: 'Gay-Lussac’s law $\\frac{p_1}{T_1} = \\frac{p_2}{T_2} \\implies T_2 = T_1 \\cdot \\frac{p_2}{p_1}$:', tex: `T_2 = ${pair.T1} \\cdot \\frac{${p2}}{${p1}} = ${pair.T2} \\text{ K} \\implies t_2 = ${pair.T2} - 273 = ${pair.t2C}` },
        ],
        hints: [
          'Use $\\frac{p_1}{T_1} = \\frac{p_2}{T_2}$ with $T_1 = ${pair.T1}$ K.',
          `$T_2 = ${pair.T2}$ K $\\implies t_2 = ${pair.t2C}^{\\circ}$C.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `A rigid vessel ($V = \\text{const}$) contains gas at $p_1 = ${p1}$ Pa and $t_1 = ${pair.t1C}^{\\circ}$C. Heated to $t_2 = ${pair.t2C}^{\\circ}$C (using $T = t + 273$), find final pressure $p_2$ in Pascals.`,
      answer: { kind: 'number', value: String(p2) },
      solution: [
        { text: 'Convert temperatures: $T_1 = ${pair.T1}$ K and $T_2 = ${pair.T2}$ K:' },
        { text: 'Apply Gay-Lussac’s law $p_2 = p_1 \\cdot \\frac{T_2}{T_1}$:', tex: `p_2 = ${p1} \\cdot \\frac{${pair.T2}}{${pair.T1}} = ${p2}` },
      ],
      hints: [
        `$T_1 = ${pair.T1}$ K and $T_2 = ${pair.T2}$ K.`,
        `$p_2 = ${p1} \\cdot \\frac{${pair.T2}}{${pair.T1}} = ${p2}$ Pa.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const gas = rng.pick([
    { name: 'hydrogen (M = 0.002 kg/mol)', M: 0.002 },
    { name: 'helium (M = 0.004 kg/mol)', M: 0.004 },
    { name: 'methane (M = 0.016 kg/mol)', M: 0.016 },
    { name: 'nitrogen (M = 0.028 kg/mol)', M: 0.028 },
    { name: 'oxygen (M = 0.032 kg/mol)', M: 0.032 },
    { name: 'carbon dioxide (M = 0.044 kg/mol)', M: 0.044 },
  ])
  const tC = rng.pick([27, 127])
  const TK = tC + 273
  const kMul = rng.pick([1, 2, 3, 5, 10])
  // p = kMul * (8.3 * TK) * 100
  const pPa = Math.round(kMul * 8.3 * TK * 100)
  // rho = p M / (R T) = kMul * 100 * M
  // 100 M is integer or multiple of 0.2 => fraction with denominator <= 5
  const rawRhoNum = Math.round(kMul * 100 * gas.M * 10)
  const rhoFrac = makeFrac(rawRhoNum, 10)

  return {
    statement: `Find the density $\\rho$ in kg/m$^3$ of ${gas.name} at pressure $p = ${pPa}$ Pa and temperature $t = ${tC}^{\\circ}$C using $R = 8.3$ J/(mol$\\cdot$K) and $T = t + 273$.`,
    answer: { kind: 'number', value: rhoFrac },
    solution: [
      { text: 'Convert temperature: $T = t + 273 = ${TK}$ K:' },
      { text: 'Apply density formula $\\rho = \\frac{p M}{R T}$:', tex: `\\rho = \\frac{${pPa} \\cdot ${gas.M}}{8.3 \\cdot ${TK}} = ${rhoFrac}` },
    ],
    hints: [
      `$T = ${TK}$ K.`,
      `$\\rho = \\frac{${pPa} \\cdot ${gas.M}}{8.3 \\cdot ${TK}} = ${rhoFrac}$ kg/m$^3$.`,
    ],
    inputHint: 'Enter an exact integer or fraction.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['connecting_two_vessels', 'gas_work_p_v_change_ideal', 'gas_law_choice'] as const)

  if (shape === 'connecting_two_vessels') {
    const pair = rng.pick([
      { V1: 2, V2: 3, k1: 1, k2: 6, kf: 4 },
      { V1: 1, V2: 3, k1: 2, k2: 6, kf: 5 },
      { V1: 3, V2: 2, k1: 1, k2: 6, kf: 3 },
      { V1: 2, V2: 2, k1: 1, k2: 5, kf: 3 },
      { V1: 1, V2: 4, k1: 1, k2: 6, kf: 5 },
      { V1: 4, V2: 1, k1: 2, k2: 7, kf: 3 },
      { V1: 3, V2: 3, k1: 2, k2: 8, kf: 5 },
      { V1: 2, V2: 4, k1: 3, k2: 9, kf: 7 },
      { V1: 1, V2: 2, k1: 2, k2: 5, kf: 4 },
      { V1: 5, V2: 1, k1: 1, k2: 7, kf: 2 },
      { V1: 3, V2: 1, k1: 2, k2: 10, kf: 4 },
      { V1: 1, V2: 5, k1: 3, k2: 9, kf: 8 },
      { V1: 4, V2: 2, k1: 1, k2: 7, kf: 3 },
      { V1: 2, V2: 5, k1: 2, k2: 9, kf: 7 },
      { V1: 5, V2: 2, k1: 1, k2: 8, kf: 3 },
      { V1: 3, V2: 4, k1: 1, k2: 8, kf: 5 },
      { V1: 4, V2: 3, k1: 2, k2: 9, kf: 5 },
      { V1: 2, V2: 6, k1: 1, k2: 9, kf: 7 },
      { V1: 6, V2: 2, k1: 2, k2: 10, kf: 4 },
      { V1: 1, V2: 6, k1: 2, k2: 9, kf: 8 },
    ])
    const pMult = rng.pick([50, 100, 150, 200, 300])
    const V1 = pair.V1
    const V2 = pair.V2
    const p1kPa = (pMult * pair.k1) / 2
    const p2kPa = (pMult * pair.k2) / 2
    const pfkPa = (pMult * pair.kf) / 2
    const S = V1 + V2

    return {
      statement: `Two vessels of volumes $V_1 = ${V1}$ L and $V_2 = ${V2}$ L contain the same ideal gas at pressures $p_1 = ${p1kPa}$ kPa and $p_2 = ${p2kPa}$ kPa at equal temperature $T$. They are connected by a thin tube. Find the final equilibrium pressure $p_f$ in kPa.`,
      answer: { kind: 'number', value: String(pfkPa) },
      solution: [
        { text: 'Total moles $n_{\\text{tot}} = n_1 + n_2 = \\frac{p_1 V_1 + p_2 V_2}{RT}$:' },
        { text: 'Final pressure $p_f = \\frac{n_{\\text{tot}} RT}{V_1 + V_2} = \\frac{p_1 V_1 + p_2 V_2}{V_1 + V_2}$:', tex: `p_f = \\frac{${p1kPa} \\cdot ${V1} + ${p2kPa} \\cdot ${V2}}{${V1} + ${V2}} = ${pfkPa}` },
      ],
      hints: [
        'Total $pV$ is conserved at constant temperature: $p_f (V_1 + V_2) = p_1 V_1 + p_2 V_2$.',
        `$p_f = \\frac{${p1kPa * V1 + p2kPa * V2}}{${S}} = ${pfkPa}$ kPa.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'gas_work_p_v_change_ideal') {
    const pair = rng.pick([
      { t1C: 27, T1: 300, vRatioNum: 2, vRatioDen: 1, T2: 600, t2C: 327 },
      { t1C: 27, T1: 300, vRatioNum: 3, vRatioDen: 2, T2: 450, t2C: 177 },
      { t1C: 127, T1: 400, vRatioNum: 3, vRatioDen: 2, T2: 600, t2C: 327 },
      { t1C: 127, T1: 400, vRatioNum: 5, vRatioDen: 4, T2: 500, t2C: 227 },
      { t1C: 227, T1: 500, vRatioNum: 8, vRatioDen: 5, T2: 800, t2C: 527 },
      { t1C: 27, T1: 300, vRatioNum: 3, vRatioDen: 1, T2: 900, t2C: 627 },
      { t1C: -23, T1: 250, vRatioNum: 2, vRatioDen: 1, T2: 500, t2C: 227 },
      { t1C: -23, T1: 250, vRatioNum: 3, vRatioDen: 1, T2: 750, t2C: 477 },
      { t1C: 77, T1: 350, vRatioNum: 2, vRatioDen: 1, T2: 700, t2C: 427 },
      { t1C: 177, T1: 450, vRatioNum: 2, vRatioDen: 1, T2: 900, t2C: 627 },
      { t1C: 27, T1: 300, vRatioNum: 5, vRatioDen: 2, T2: 750, t2C: 477 },
      { t1C: 127, T1: 400, vRatioNum: 2, vRatioDen: 1, T2: 800, t2C: 527 },
    ])
    const kV = rng.int(1, 4)
    const V1 = kV * pair.vRatioDen
    const V2 = kV * pair.vRatioNum

    return {
      statement: `An ideal gas at constant pressure in a cylinder with a movable piston expands from $V_1 = ${V1}$ L at $t_1 = ${pair.t1C}^{\\circ}$C to $V_2 = ${V2}$ L. Using $T = t + 273$, find the final temperature $t_2$ in $^{\\circ}$C.`,
      answer: { kind: 'number', value: String(pair.t2C) },
      solution: [
        { text: 'At constant pressure, $\\frac{V_1}{T_1} = \\frac{V_2}{T_2} \\implies T_2 = T_1 \\cdot \\frac{V_2}{V_1}$:' },
        { text: 'Compute final Kelvin and Celsius temperatures:', tex: `T_1 = ${pair.t1C} + 273 = ${pair.T1} \\text{ K}, \\quad T_2 = ${pair.T1} \\cdot \\frac{${V2}}{${V1}} = ${pair.T2} \\text{ K} \\implies t_2 = ${pair.T2} - 273 = ${pair.t2C}` },
      ],
      hints: [
        `$T_1 = ${pair.T1}$ K.`,
        `$T_2 = ${pair.T2}$ K $\\implies t_2 = ${pair.t2C}^{\\circ}$C.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const choiceSet = rng.pick([
    {
      stmt: 'Which statement correctly describes ideal gas behavior according to Gay-Lussac’s law ($V = \\text{const}$)?',
      correct: 'Doubling absolute temperature at constant volume doubles the gas pressure',
      opt2: 'Doubling Celsius temperature at constant volume doubles the gas pressure',
      opt3: 'Increasing temperature at constant volume decreases gas pressure proportionally',
      opt4: 'Gas pressure remains constant regardless of temperature changes at fixed volume',
    },
    {
      stmt: 'Which statement correctly describes ideal gas behavior according to Boyle’s law ($T = \\text{const}$)?',
      correct: 'Halving the volume of a gas at constant temperature doubles its pressure',
      opt2: 'Halving the volume of a gas at constant temperature halves its pressure',
      opt3: 'Halving the volume of a gas at constant temperature quadruples its temperature',
      opt4: 'Volume compression at constant temperature causes pressure to drop to zero',
    },
    {
      stmt: 'Which statement correctly describes ideal gas behavior according to Charles’s law ($p = \\text{const}$)?',
      correct: 'Heating a gas at constant pressure increases its volume proportionally to absolute temperature',
      opt2: 'Heating a gas at constant pressure decreases its volume proportionally to Celsius temperature',
      opt3: 'Heating a gas at constant pressure keeps volume strictly constant while density increases',
      opt4: 'Cooling a gas at constant pressure increases its volume without limit',
    },
    {
      stmt: 'Which statement correctly describes how gas density $\\rho$ depends on pressure $p$ and temperature $T$?',
      correct: 'Gas density is directly proportional to pressure and inversely proportional to absolute temperature',
      opt2: 'Gas density is directly proportional to temperature and inversely proportional to pressure',
      opt3: 'Gas density depends only on molar mass and is independent of pressure and temperature',
      opt4: 'Increasing pressure at constant temperature decreases gas density proportionally',
    },
    {
      stmt: 'What happens to the pressure of an ideal gas if its volume is halved and its absolute temperature is doubled?',
      correct: 'The pressure increases by a factor of 4',
      opt2: 'The pressure remains completely unchanged',
      opt3: 'The pressure doubles',
      opt4: 'The pressure is reduced to one fourth of its initial value',
    },
    {
      stmt: 'Under which conditions does a real gas behave most like an ideal gas?',
      correct: 'Low pressure and high temperature',
      opt2: 'High pressure and low temperature',
      opt3: 'High pressure and high temperature',
      opt4: 'Low pressure and low temperature near absolute zero',
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
      { text: `By the ideal gas law $pV = nRT$, ${choiceSet.correct.toLowerCase()}.` },
    ],
    hints: [
      'Analyze the ideal gas law $pV = nRT$ for constant parameters.',
      'Check whether relationships hold for absolute temperature in Kelvin.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'ideal_gas',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
