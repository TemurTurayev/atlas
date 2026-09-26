import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `The Second Law of Thermodynamics states that heat flows spontaneously from hotter to colder bodies, and total entropy of an isolated system (the universe) never decreases: $\\Delta S_{\\text{univ}} \\ge 0$.
The maximum theoretical efficiency for a heat engine operating between temperatures $T_h$ and $T_c$ (in Kelvin) is given by Carnot efficiency $\\eta_{\\text{Carnot}} = 1 - \\frac{T_c}{T_h} = \\frac{W}{Q_h}$.
Work produced is $W = \\eta Q_h$, and heat rejected to the cold reservoir is $Q_c = Q_h - W$.
The coefficient of performance (COP) for a Carnot refrigerator is $\\text{COP} = \\frac{T_c}{T_h - T_c} = \\frac{Q_c}{W}$.
Entropy change at constant temperature $T$ is $\\Delta S = \\frac{Q}{T}$.
When heating a mass $m$ with specific heat $c$ from $T_1$ to $T_2$, entropy change is $\\Delta S = m c \\ln\\left(\\frac{T_2}{T_1}\\right)$.
Common mistakes: Calculating Carnot efficiency using Celsius temperatures instead of Kelvin ($T = t + 273$) or claiming an engine efficiency higher than Carnot efficiency.`

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
  const shape = rng.pick(['carnot_efficiency_temperatures', 'heat_engine_work_heat', 'isothermal_entropy_change'] as const)

  if (shape === 'carnot_efficiency_temperatures') {
    const pair = rng.pick([
      { thC: 327, tcC: 27, Th: 600, Tc: 300, num: 1, den: 2 },
      { thC: 227, tcC: 27, Th: 500, Tc: 300, num: 2, den: 5 },
      { thC: 327, tcC: 127, Th: 600, Tc: 400, num: 1, den: 3 },
      { thC: 527, tcC: 127, Th: 800, Tc: 400, num: 1, den: 2 },
      { thC: 627, tcC: 127, Th: 900, Tc: 300, num: 2, den: 3 },
      { thC: 427, tcC: 77, Th: 700, Tc: 350, num: 1, den: 2 },
      { thC: 727, tcC: 227, Th: 1000, Tc: 500, num: 1, den: 2 },
      { thC: 477, tcC: 127, Th: 750, Tc: 400, num: 7, den: 15 },
    ])
    const etaFrac = makeFrac(pair.num, pair.den)

    return {
      statement: `A Carnot heat engine operates between a hot reservoir at $t_h = ${pair.thC}^{\\circ}$C and a cold reservoir at $t_c = ${pair.tcC}^{\\circ}$C. Using $T = t + 273$, find its theoretical efficiency $\\eta$ as an exact fraction.`,
      answer: { kind: 'number', value: etaFrac },
      solution: [
        { text: 'Convert temperatures to Kelvin: $T_h = ${pair.thC} + 273 = ${pair.Th}$ K, $T_c = ${pair.tcC} + 273 = ${pair.Tc}$ K:' },
        { text: 'Apply Carnot efficiency formula $\\eta = 1 - \\frac{T_c}{T_h}$:', tex: `\\eta = 1 - \\frac{${pair.Tc}}{${pair.Th}} = ${etaFrac}` },
      ],
      hints: [
        `$T_h = ${pair.Th}$ K and $T_c = ${pair.Tc}$ K.`,
        `$\\eta = 1 - \\frac{${pair.Tc}}{${pair.Th}} = ${etaFrac}$.`,
      ],
      inputHint: 'Enter an exact fraction like 1/2.',
    }
  }

  if (shape === 'heat_engine_work_heat') {
    const Qh = 100 * rng.int(1, 10)
    const num = rng.pick([1, 2, 3, 4])
    const den = rng.pick([5, 6, 8, 10])
    const g = gcd(num, den)
    const sNum = num / g
    const sDen = den / g
    const W = (Qh * sNum) / sDen
    const Qc = Qh - W
    const askForW = rng.pick([true, false])

    if (askForW) {
      return {
        statement: `A heat engine absorbs $Q_h = ${Qh}$ J of heat per cycle from a hot reservoir and has efficiency $\\eta = \\frac{${sNum}}{${sDen}}$. Find the work output $W$ per cycle in Joules.`,
        answer: { kind: 'number', value: String(W) },
        solution: [
          { text: 'Work output is $W = \\eta Q_h$:' },
          { text: 'Compute work:', tex: `W = \\frac{${sNum}}{${sDen}} \\cdot ${Qh} = ${W}` },
        ],
        hints: [
          'Use $W = \\eta Q_h$.',
          `$W = \\frac{${sNum}}{${sDen}} \\cdot ${Qh} = ${W}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `A heat engine absorbs $Q_h = ${Qh}$ J of heat per cycle from a hot reservoir and has efficiency $\\eta = \\frac{${sNum}}{${sDen}}$. Find the heat $Q_c$ rejected to the cold reservoir per cycle in Joules.`,
      answer: { kind: 'number', value: String(Qc) },
      solution: [
        { text: 'Heat rejected is $Q_c = Q_h - W = Q_h (1 - \\eta)$:' },
        { text: 'Compute $Q_c$:', tex: `Q_c = ${Qh} \\cdot \\left(1 - \\frac{${sNum}}{${sDen}}\\right) = ${Qh} \\cdot \\frac{${sDen - sNum}}{${sDen}} = ${Qc}` },
      ],
      hints: [
        'Use $Q_c = Q_h (1 - \\eta)$.',
        `$Q_c = ${Qh} \\cdot \\frac{${sDen - sNum}}{${sDen}} = ${Qc}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const Q = 100 * rng.int(2, 30)
  const tC = rng.pick([27, 77, 127, 177, 227, 277, 327])
  const TK = tC + 273
  const dsFrac = makeFrac(Q, TK)

  return {
    statement: `Find the entropy change $\\Delta S$ in J/K when $Q = ${Q}$ J of heat is added to a system isothermally at temperature $t = ${tC}^{\\circ}$C. Use $T = t + 273$.`,
    answer: { kind: 'number', value: dsFrac },
    solution: [
      { text: 'Convert temperature to Kelvin: $T = ${tC} + 273 = ${TK}$ K:' },
      { text: 'Apply isothermal entropy formula $\\Delta S = \\frac{Q}{T}$:', tex: `\\Delta S = \\frac{${Q}}{${TK}} = ${dsFrac}` },
    ],
    hints: [
      `$T = ${TK}$ K.`,
      `$\\Delta S = \\frac{${Q}}{${TK}} = ${dsFrac}$ J/K.`,
    ],
    inputHint: 'Enter an exact integer or fraction.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['refrigerator_cop', 'entropy_change_heating_ln', 'entropy_mixing_two_bodies'] as const)

  if (shape === 'refrigerator_cop') {
    const pair = rng.pick([
      { tcC: -23, thC: 27, Tc: 250, Th: 300 },
      { tcC: -73, thC: 27, Tc: 200, Th: 300 },
      { tcC: -33, thC: 27, Tc: 240, Th: 300 },
      { tcC: -23, thC: 77, Tc: 250, Th: 350 },
      { tcC: -3, thC: 27, Tc: 270, Th: 300 },
      { tcC: -23, thC: 127, Tc: 250, Th: 400 },
      { tcC: -73, thC: 127, Tc: 200, Th: 400 },
      { tcC: 27, thC: 127, Tc: 300, Th: 400 },
      { tcC: -73, thC: -23, Tc: 200, Th: 250 },
    ])
    const copFrac = makeFrac(pair.Tc, pair.Th - pair.Tc)

    return {
      statement: `A Carnot refrigerator operates between a cold compartment at $t_c = ${pair.tcC}^{\\circ}$C and a warm room at $t_h = ${pair.thC}^{\\circ}$C. Using $T = t + 273$, find its coefficient of performance $\\text{COP} = \\frac{T_c}{T_h - T_c}$ as an exact number.`,
      answer: { kind: 'number', value: copFrac },
      solution: [
        { text: 'Convert temperatures to Kelvin: $T_c = ${pair.tcC} + 273 = ${pair.Tc}$ K and $T_h = ${pair.thC} + 273 = ${pair.Th}$ K:' },
        { text: 'Apply refrigerator COP formula:', tex: `\\text{COP} = \\frac{${pair.Tc}}{${pair.Th} - ${pair.Tc}} = \\frac{${pair.Tc}}{${pair.Th - pair.Tc}} = ${copFrac}` },
      ],
      hints: [
        `$T_c = ${pair.Tc}$ K and $T_h = ${pair.Th}$ K.`,
        `$\\text{COP} = \\frac{${pair.Tc}}{${pair.Th - pair.Tc}} = ${copFrac}$.`,
      ],
      inputHint: 'Enter an exact integer or fraction.',
    }
  }

  if (shape === 'entropy_change_heating_ln') {
    const m = rng.pick([1, 2, 3, 4, 5])
    const c = rng.pick([100, 200, 390, 400, 450, 500, 900, 4200])
    const mc = m * c
    const k = rng.pick([2, 3, 4, 5, 8, 10])
    const T1 = rng.pick([250, 300, 400, 500])
    const T2 = T1 * k

    return {
      statement: `A substance of mass $m = ${m}$ kg and specific heat $c = ${c}$ J/(kg$\\cdot$K) is heated from temperature $T_1 = ${T1}$ K to $T_2 = ${T2}$ K. Find the exact entropy change $\\Delta S$ in J/K in terms of $\\ln$.`,
      answer: { kind: 'number', value: `${mc}\\ln(${k})` },
      solution: [
        { text: 'Entropy change during heating is $\\Delta S = m c \\ln\\left(\\frac{T_2}{T_1}\\right)$:' },
        { text: 'Compute $\\Delta S$:', tex: `\\Delta S = ${m} \\cdot ${c} \\cdot \\ln\\left(\\frac{${T2}}{${T1}}\\right) = ${mc}\\ln(${k})` },
      ],
      hints: [
        'Use $\\Delta S = m c \\ln\\left(\\frac{T_2}{T_1}\\right)$.',
        `$\\Delta S = ${mc}\\ln(${k})$ J/K.`,
      ],
      inputHint: 'Enter an exact expression with \\ln like 400\\ln(2).',
    }
  }

  const pair = rng.pick([
    { Th: 600, Tc: 300 },
    { Th: 500, Tc: 250 },
    { Th: 800, Tc: 400 },
    { Th: 600, Tc: 400 },
    { Th: 1000, Tc: 500 },
    { Th: 900, Tc: 300 },
  ])
  const Q = 300 * rng.int(1, 10)
  // deltaS = -Q/Th + Q/Tc = Q * (Th - Tc) / (Th * Tc)
  const num = Q * (pair.Th - pair.Tc)
  const den = pair.Th * pair.Tc
  const dsNetFrac = makeFrac(num, den)

  return {
    statement: `An amount of heat $Q = ${Q}$ J is transferred directly from a hot reservoir at $T_h = ${pair.Th}$ K to a cold reservoir at $T_c = ${pair.Tc}$ K. Find the net entropy change of the universe $\\Delta S_{\\text{univ}}$ in J/K.`,
    answer: { kind: 'number', value: dsNetFrac },
    solution: [
      { text: 'Net entropy change is $\\Delta S_{\\text{univ}} = -\\frac{Q}{T_h} + \\frac{Q}{T_c}$:' },
      { text: 'Compute net entropy:', tex: `\\Delta S_{\\text{univ}} = -\\frac{${Q}}{${pair.Th}} + \\frac{${Q}}{${pair.Tc}} = ${dsNetFrac}` },
    ],
    hints: [
      'Use $\\Delta S_{\\text{univ}} = -\\frac{Q}{T_h} + \\frac{Q}{T_c}$.',
      `$\\Delta S_{\\text{univ}} = ${dsNetFrac}$ J/K.`,
    ],
    inputHint: 'Enter an exact integer or fraction.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick([
    'heating_entropy_exact_ln',
    'melting_ice_phase_change_entropy',
    'carnot_engine_work_heat',
    'entropy_flow_two_reservoirs',
    'carnot_efficiency_improvement',
    'entropy_universe_or_claim_choice',
  ] as const)

  if (shape === 'heating_entropy_exact_ln') {
    const m = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const c = rng.pick([130, 230, 380, 390, 450, 900, 2100, 4200])
    const mc = m * c
    const k = rng.pick([2, 3, 4, 5, 6, 8, 10])
    const T1 = rng.pick([200, 250, 273, 300, 350, 400, 500])
    const T2 = T1 * k

    return {
      statement: `A substance of mass $m = ${m}$ kg and specific heat capacity $c = ${c}$ J/(kg$\\cdot$K) is heated from temperature $T_1 = ${T1}$ K to $T_2 = ${T2}$ K. Find the exact entropy change $\\Delta S$ in J/K in terms of $\\ln$.`,
      answer: { kind: 'number', value: `${mc}\\ln\\left(${k}\\right)` },
      solution: [
        { text: 'Apply exact heating entropy formula $\\Delta S = m c \\ln\\left(\\frac{T_2}{T_1}\\right)$:' },
        { text: 'Compute entropy change:', tex: `\\Delta S = ${m} \\cdot ${c} \\cdot \\ln\\left(\\frac{${T2}}{${T1}}\\right) = ${mc}\\ln\\left(${k}\\right)` },
      ],
      hints: [
        'Use $\\Delta S = m c \\ln(T_2 / T_1)$.',
        `$\\Delta S = ${mc}\\ln\\left(${k}\\right)$ J/K.`,
      ],
      inputHint: 'Enter an exact expression with \\ln like 8400\\ln(2).',
    }
  }

  if (shape === 'melting_ice_phase_change_entropy') {
    const k = rng.int(1, 12)
    const Q = 27300 * k
    const dsVal = 100 * k

    return {
      statement: `Find the entropy change $\\Delta S$ in J/K when $Q = ${Q}$ J of heat is added to melt ice isothermally at temperature $t = 0^{\\circ}$C ($T = 273$ K).`,
      answer: { kind: 'number', value: String(dsVal) },
      solution: [
        { text: 'For an isothermal phase change, $\\Delta S = \\frac{Q}{T}$ with $T = 0 + 273 = 273$ K:' },
        { text: 'Compute entropy change:', tex: `\\Delta S = \\frac{${Q}}{273} = ${dsVal}` },
      ],
      hints: [
        'Convert temperature to Kelvin: $T = 273$ K.',
        `$\\Delta S = \\frac{${Q}}{273} = ${dsVal}$ J/K.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'carnot_engine_work_heat') {
    const pair = rng.pick([
      { Th: 600, Tc: 300, num: 1, den: 2 },
      { Th: 500, Tc: 300, num: 2, den: 5 },
      { Th: 800, Tc: 400, num: 1, den: 2 },
      { Th: 600, Tc: 400, num: 1, den: 3 },
      { Th: 900, Tc: 300, num: 2, den: 3 },
      { Th: 1000, Tc: 500, num: 1, den: 2 },
      { Th: 750, Tc: 300, num: 3, den: 5 },
      { Th: 800, Tc: 600, num: 1, den: 4 },
      { Th: 1000, Tc: 400, num: 3, den: 5 },
      { Th: 1200, Tc: 400, num: 2, den: 3 },
    ])
    const kQ = rng.int(1, 10)
    const Qh = 600 * kQ
    const askForW = rng.pick([true, false])

    const W = (Qh * pair.num) / pair.den
    const Qc = Qh - W

    if (askForW) {
      return {
        statement: `A Carnot heat engine absorbs $Q_h = ${Qh}$ J per cycle from a hot reservoir at $T_h = ${pair.Th}$ K and rejects heat to a cold reservoir at $T_c = ${pair.Tc}$ K. Find the work output $W$ per cycle in Joules.`,
        answer: { kind: 'number', value: String(W) },
        solution: [
          { text: `Carnot efficiency is $\\eta = 1 - \\frac{T_c}{T_h} = \\frac{${pair.num}}{${pair.den}}$:` },
          { text: 'Compute work output $W = \\eta Q_h$:', tex: `W = \\frac{${pair.num}}{${pair.den}} \\cdot ${Qh} = ${W}` },
        ],
        hints: [
          `Efficiency $\\eta = 1 - \\frac{${pair.Tc}}{${pair.Th}} = \\frac{${pair.num}}{${pair.den}}$.`,
          `$W = ${W}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    return {
      statement: `A Carnot heat engine absorbs $Q_h = ${Qh}$ J per cycle from a hot reservoir at $T_h = ${pair.Th}$ K and rejects heat to a cold reservoir at $T_c = ${pair.Tc}$ K. Find the heat $Q_c$ rejected to the cold reservoir per cycle in Joules.`,
      answer: { kind: 'number', value: String(Qc) },
      solution: [
        { text: 'Heat rejected is $Q_c = Q_h \\cdot \\frac{T_c}{T_h}$:' },
        { text: 'Compute heat rejected:', tex: `Q_c = ${Qh} \\cdot \\frac{${pair.Tc}}{${pair.Th}} = ${Qc}` },
      ],
      hints: [
        `$Q_c = Q_h \\cdot \\frac{${pair.Tc}}{${pair.Th}}$.`,
        `$Q_c = ${Qc}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'entropy_flow_two_reservoirs') {
    const pair = rng.pick([
      { Th: 600, Tc: 300, qBase: 600 },
      { Th: 500, Tc: 250, qBase: 500 },
      { Th: 800, Tc: 400, qBase: 800 },
      { Th: 600, Tc: 400, qBase: 1200 },
      { Th: 1000, Tc: 500, qBase: 1000 },
      { Th: 900, Tc: 300, qBase: 900 },
      { Th: 750, Tc: 300, qBase: 500 },
      { Th: 600, Tc: 200, qBase: 300 },
      { Th: 900, Tc: 450, qBase: 900 },
      { Th: 1200, Tc: 400, qBase: 600 },
      { Th: 500, Tc: 300, qBase: 750 },
      { Th: 900, Tc: 600, qBase: 1800 },
    ])
    const Q = pair.qBase * rng.int(1, 6)
    const num = Q * (pair.Th - pair.Tc)
    const den = pair.Th * pair.Tc
    const dsNetFrac = makeFrac(num, den)

    return {
      statement: `An amount of heat $Q = ${Q}$ J is transferred directly from a hot reservoir at $T_h = ${pair.Th}$ K to a cold reservoir at $T_c = ${pair.Tc}$ K. Find the net entropy change of the universe $\\Delta S_{\\text{univ}}$ in J/K.`,
      answer: { kind: 'number', value: dsNetFrac },
      solution: [
        { text: 'Net entropy change is $\\Delta S_{\\text{univ}} = -\\frac{Q}{T_h} + \\frac{Q}{T_c}$:' },
        { text: 'Compute net entropy:', tex: `\\Delta S_{\\text{univ}} = -\\frac{${Q}}{${pair.Th}} + \\frac{${Q}}{${pair.Tc}} = ${dsNetFrac}` },
      ],
      hints: [
        'Use $\\Delta S_{\\text{univ}} = -\\frac{Q}{T_h} + \\frac{Q}{T_c}$.',
        `$\\Delta S_{\\text{univ}} = ${dsNetFrac}$ J/K.`,
      ],
      inputHint: 'Enter an exact integer or fraction.',
    }
  }

  if (shape === 'carnot_efficiency_improvement') {
    const setup = rng.pick([
      { Th: 600, Tc: 300, eta1Str: '\\frac{1}{2}', eta2Str: '\\frac{2}{3}', newTc: 200, dtcC: 100 },
      { Th: 600, Tc: 300, eta1Str: '\\frac{1}{2}', eta2Str: '\\frac{3}{4}', newTc: 150, dtcC: 150 },
      { Th: 800, Tc: 400, eta1Str: '\\frac{1}{2}', eta2Str: '\\frac{3}{4}', newTc: 200, dtcC: 200 },
      { Th: 900, Tc: 300, eta1Str: '\\frac{2}{3}', eta2Str: '\\frac{4}{5}', newTc: 180, dtcC: 120 },
      { Th: 500, Tc: 300, eta1Str: '\\frac{2}{5}', eta2Str: '\\frac{3}{5}', newTc: 200, dtcC: 100 },
      { Th: 1000, Tc: 500, eta1Str: '\\frac{1}{2}', eta2Str: '\\frac{7}{10}', newTc: 300, dtcC: 200 },
      { Th: 400, Tc: 200, eta1Str: '\\frac{1}{2}', eta2Str: '\\frac{3}{4}', newTc: 100, dtcC: 100 },
      { Th: 750, Tc: 300, eta1Str: '\\frac{3}{5}', eta2Str: '\\frac{4}{5}', newTc: 150, dtcC: 150 },
      { Th: 1200, Tc: 400, eta1Str: '\\frac{2}{3}', eta2Str: '\\frac{3}{4}', newTc: 300, dtcC: 100 },
      { Th: 800, Tc: 300, eta1Str: '\\frac{5}{8}', eta2Str: '\\frac{3}{4}', newTc: 200, dtcC: 100 },
    ])

    return {
      statement: `A Carnot engine operating between $T_h = ${setup.Th}$ K and $T_c = ${setup.Tc}$ K has efficiency $\\eta_1 = ${setup.eta1Str}$. To increase efficiency to $\\eta_2 = ${setup.eta2Str}$ by lowering $T_c$ alone, by how many Kelvin must $T_c$ be reduced?`,
      answer: { kind: 'number', value: String(setup.dtcC) },
      solution: [
        { text: `Target efficiency $\\eta_2 = 1 - \\frac{T_c^{\\text{new}}}{T_h} = ${setup.eta2Str} \\implies T_c^{\\text{new}} = ${setup.newTc}$ K:` },
        { text: 'Compute required temperature reduction:', tex: `\\Delta T_c = ${setup.Tc} - ${setup.newTc} = ${setup.dtcC}` },
      ],
      hints: [
        `Solve $1 - \\frac{T_c^{\\text{new}}}{${setup.Th}} = ${setup.eta2Str} \\implies T_c^{\\text{new}} = ${setup.newTc}$ K.`,
        `$\\Delta T_c = ${setup.Tc} - ${setup.newTc} = ${setup.dtcC}$ K.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const isClaimChoice = rng.pick([true, false])
  if (isClaimChoice) {
    const pair = rng.pick([
      { thC: 327, tcC: 27, Th: 600, Tc: 300, carnotEta: 50, claimedEta: 60 },
      { thC: 227, tcC: 27, Th: 500, Tc: 300, carnotEta: 40, claimedEta: 55 },
      { thC: 527, tcC: 127, Th: 800, Tc: 400, carnotEta: 50, claimedEta: 65 },
      { thC: 427, tcC: 77, Th: 700, Tc: 350, carnotEta: 50, claimedEta: 58 },
      { thC: 627, tcC: 127, Th: 900, Tc: 300, carnotEta: 67, claimedEta: 75 },
      { thC: 727, tcC: 227, Th: 1000, Tc: 500, carnotEta: 50, claimedEta: 62 },
    ])

    const allOpts: ChoiceOption[] = [
      { id: 'correct', label: `Impossible: claimed efficiency ($${pair.claimedEta}\\%$) exceeds maximum Carnot efficiency ($${pair.carnotEta}\\%$)` },
      { id: 'opt2', label: `Possible: any heat engine can achieve $${pair.claimedEta}\\%$ efficiency with suitable insulation` },
      { id: 'opt3', label: `Possible: efficiency depends only on work output, not on reservoir temperatures` },
      { id: 'opt4', label: `Impossible: Carnot efficiency is $${pair.carnotEta + 10}\\%$, so $${pair.claimedEta}\\%$ is too low` },
    ]

    return {
      statement: `An inventor claims a heat engine operating between $t_h = ${pair.thC}^{\\circ}$C ($T_h = ${pair.Th}$ K) and $t_c = ${pair.tcC}^{\\circ}$C ($T_c = ${pair.Tc}$ K) achieves an efficiency of $\\eta = ${pair.claimedEta}\\%$. Evaluate this claim.`,
      answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
      solution: [
        { text: `Carnot limit is $\\eta_{\\text{Carnot}} = 1 - \\frac{${pair.Tc}}{${pair.Th}} = ${pair.carnotEta}\\%$. The claim of $${pair.claimedEta}\\%$ exceeds the Second Law limit.` },
      ],
      hints: [
        `Calculate $\\eta_{\\text{Carnot}} = 1 - \\frac{${pair.Tc}}{${pair.Th}} = ${pair.carnotEta}\\%$.`,
        `No engine can exceed $${pair.carnotEta}\\%$ efficiency between these temperatures.`,
      ],
    }
  }

  const processDesc = rng.pick([
    'during spontaneous heat flow from a hot body to a cold body',
    'during free expansion of an ideal gas into a vacuum',
    'during turbulent mixing of two fluids at different temperatures',
    'during inelastic collision and friction dissipation',
    'during spontaneous chemical reaction at constant temperature',
  ])

  const allOpts: ChoiceOption[] = [
    { id: 'correct', label: 'The total entropy of the universe strictly increases ($\\Delta S_{\\text{univ}} > 0$)' },
    { id: 'opt2', label: 'The total entropy of the universe strictly decreases ($\\Delta S_{\\text{univ}} < 0$)' },
    { id: 'opt3', label: 'The total entropy of the universe remains strictly constant ($\\Delta S_{\\text{univ}} = 0$)' },
    { id: 'opt4', label: 'The entropy of system and surroundings both drop to zero' },
  ]

  return {
    statement: `According to the Second Law of Thermodynamics, what happens to the total entropy of the universe ${processDesc}?`,
    answer: { kind: 'choice', options: rng.shuffle(allOpts), correctId: 'correct' },
    solution: [
      { text: 'All real spontaneous processes are irreversible, generating entropy such that $\\Delta S_{\\text{univ}} > 0$.' },
    ],
    hints: [
      'Spontaneous processes are irreversible.',
      'Irreversible processes always increase total entropy of the universe.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'entropy_2nd_law',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
