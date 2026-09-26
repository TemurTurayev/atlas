import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = `The first law of thermodynamics states $\\Delta U = Q - W$, where $\\Delta U$ is change in internal energy, $Q$ is heat added TO the system, and $W$ is work done BY the system.
Sensible heat transfer for a substance is $Q = m c \\Delta T$. The specific heat of water is $c_w = 4200$ J/(kg$\\cdot$K).
For water mixing at two temperatures, conservation of thermal energy gives $m_1 c (T_f - T_1) + m_2 c (T_f - T_2) = 0 \\implies T_f = \\frac{m_1 T_1 + m_2 T_2}{m_1 + m_2}$.
Latent heat during phase changes at constant temperature is $Q = m L$.
For a monatomic ideal gas, molar heat capacity at constant volume is $C_V = \\frac{3}{2} R$, at constant pressure is $C_p = \\frac{5}{2} R$, satisfying Mayer's relation $C_p - C_V = R$.
Internal energy change for a monatomic ideal gas depends only on temperature: $\\Delta U = n C_V \\Delta T = \\frac{3}{2} n R \\Delta T$.
Common mistakes: Mixing up the sign convention for work done BY the gas ($W > 0$ when expanding) vs ON the gas.`

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
  const shape = rng.pick(['first_law_delta_u', 'heat_capacity_water_heating', 'water_mixing_temperature'] as const)

  if (shape === 'first_law_delta_u') {
    const Q = 50 * rng.int(2, 40)
    const W = 50 * rng.int(1, 30)
    const askFor = rng.pick(['deltaU', 'Q', 'W'] as const)

    if (askFor === 'deltaU') {
      const deltaU = Q - W
      return {
        statement: `A gas absorbs $Q = ${Q}$ J of heat from its surroundings while doing $W = ${W}$ J of work on its environment. Find the change in internal energy $\\Delta U$ in Joules.`,
        answer: { kind: 'number', value: String(deltaU) },
        solution: [
          { text: 'Apply the First Law of Thermodynamics $\\Delta U = Q - W$:' },
          { text: 'Compute $\\Delta U$:', tex: `\\Delta U = ${Q} - ${W} = ${deltaU}` },
        ],
        hints: [
          'Use $\\Delta U = Q - W$.',
          `$\\Delta U = ${Q} - ${W} = ${deltaU}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    if (askFor === 'Q') {
      const deltaU = 50 * rng.int(1, 25)
      const Qval = deltaU + W
      return {
        statement: `A gas performs $W = ${W}$ J of work while its internal energy increases by $\\Delta U = ${deltaU}$ J. Find the heat $Q$ absorbed by the gas in Joules.`,
        answer: { kind: 'number', value: String(Qval) },
        solution: [
          { text: 'Rearrange the First Law $\\Delta U = Q - W \\implies Q = \\Delta U + W$:' },
          { text: 'Compute $Q$:', tex: `Q = ${deltaU} + ${W} = ${Qval}` },
        ],
        hints: [
          'Use $Q = \\Delta U + W$.',
          `$Q = ${deltaU} + ${W} = ${Qval}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    const deltaU = 50 * rng.int(1, 25)
    const Wval = Q - deltaU
    return {
      statement: `A gas absorbs $Q = ${Q}$ J of heat and its internal energy increases by $\\Delta U = ${deltaU}$ J. Find the work $W$ done by the gas in Joules.`,
      answer: { kind: 'number', value: String(Wval) },
      solution: [
        { text: 'Rearrange the First Law $\\Delta U = Q - W \\implies W = Q - \\Delta U$:' },
        { text: 'Compute $W$:', tex: `W = ${Q} - ${deltaU} = ${Wval}` },
      ],
      hints: [
        'Use $W = Q - \\Delta U$.',
        `$W = ${Q} - ${deltaU} = ${Wval}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'heat_capacity_water_heating') {
    const m = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const dt = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60])
    const c = 4200
    const Q = m * c * dt

    return {
      statement: `Find the heat $Q$ in Joules needed to raise the temperature of $m = ${m}$ kg of water by $\\Delta T = ${dt}^{\\circ}$C. Use specific heat of water $c = 4200$ J/(kg$\\cdot$K).`,
      answer: { kind: 'number', value: String(Q) },
      solution: [
        { text: 'Apply sensible heat formula $Q = m c \\Delta T$:' },
        { text: 'Compute heat $Q$:', tex: `Q = ${m} \\cdot 4200 \\cdot ${dt} = ${Q}` },
      ],
      hints: [
        'Use $Q = m c \\Delta T$ with $c = 4200$ J/(kg$\\cdot$K).',
        `$Q = ${m} \\cdot 4200 \\cdot ${dt} = ${Q}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const m1 = rng.pick([1, 2, 3, 4, 5, 6])
  const m2 = rng.pick([1, 2, 3, 4, 5, 6])
  const t1 = rng.pick([10, 15, 20, 25, 30])
  const t2 = rng.pick([50, 60, 70, 80, 90])
  const rawNum = m1 * t1 + m2 * t2
  const rawDen = m1 + m2
  const unreduced = `\\frac{${rawNum}}{${rawDen}}`
  const tfFrac = makeFrac(rawNum, rawDen)
  const stepTex = unreduced === tfFrac ? `t_f = \\frac{${m1} \\cdot ${t1} + ${m2} \\cdot ${t2}}{${m1} + ${m2}} = ${tfFrac}` : `t_f = \\frac{${m1} \\cdot ${t1} + ${m2} \\cdot ${t2}}{${m1} + ${m2}} = ${unreduced} = ${tfFrac}`

  return {
    statement: `Water of mass $m_1 = ${m1}$ kg at $t_1 = ${t1}^{\\circ}$C is mixed with water of mass $m_2 = ${m2}$ kg at $t_2 = ${t2}^{\\circ}$C. Assuming no heat loss, find the final equilibrium temperature $t_f$ in $^{\\circ}$C.`,
    answer: { kind: 'number', value: tfFrac },
    solution: [
      { text: 'Heat lost by hot water equals heat gained by cold water: $m_1 (t_f - t_1) + m_2 (t_f - t_2) = 0$:' },
      { text: 'Solve for final temperature $t_f = \\frac{m_1 t_1 + m_2 t_2}{m_1 + m_2}$:', tex: stepTex },
    ],
    hints: [
      'Use $t_f = \\frac{m_1 t_1 + m_2 t_2}{m_1 + m_2}$.',
      `$t_f = ${tfFrac}^{\\circ}$C.`,
    ],
    inputHint: 'Enter an exact integer or fraction.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['ideal_gas_qv_qp', 'latent_heat_phase_change', 'first_law_isothermal_isochoric'] as const)

  if (shape === 'ideal_gas_qv_qp') {
    const n = rng.int(1, 10)
    const dT = rng.pick([10, 20, 30, 40, 50, 60, 80, 100])
    const isConstantVolume = rng.pick([true, false])

    if (isConstantVolume) {
      // Q_V = (3/2) n R dT = (3/2) * n * 8.3 * dT
      const nRT = Math.round(n * 83 * dT) // * 10
      const QvFrac = makeFrac(3 * nRT, 20)

      return {
        statement: `An ideal monatomic gas of $n = ${n}$ mol is heated at constant volume ($V = \\text{const}$) by $\\Delta T = ${dT}$ K. Using $C_V = \\frac{3}{2} R$ and $R = 8.3$ J/(mol$\\cdot$K), find the heat added $Q_V$ in Joules.`,
        answer: { kind: 'number', value: QvFrac },
        solution: [
          { text: 'At constant volume, $Q_V = n C_V \\Delta T = \\frac{3}{2} n R \\Delta T$:' },
          { text: 'Compute $Q_V$:', tex: `Q_V = \\frac{3}{2} \\cdot ${n} \\cdot 8.3 \\cdot ${dT} = ${QvFrac}` },
        ],
        hints: [
          'Use $Q_V = \\frac{3}{2} n R \\Delta T$.',
          `$Q_V = \\frac{3}{2} \\cdot ${n} \\cdot 8.3 \\cdot ${dT} = ${QvFrac}$ J.`,
        ],
        inputHint: 'Enter an exact integer or fraction.',
      }
    }

    const nRT = Math.round(n * 83 * dT)
    const QpFrac = makeFrac(5 * nRT, 20)

    return {
      statement: `An ideal monatomic gas of $n = ${n}$ mol is heated at constant pressure ($p = \\text{const}$) by $\\Delta T = ${dT}$ K. Using $C_p = \\frac{5}{2} R$ and $R = 8.3$ J/(mol$\\cdot$K), find the heat added $Q_p$ in Joules.`,
      answer: { kind: 'number', value: QpFrac },
      solution: [
        { text: 'At constant pressure, $Q_p = n C_p \\Delta T = \\frac{5}{2} n R \\Delta T$:' },
        { text: 'Compute $Q_p$:', tex: `Q_p = \\frac{5}{2} \\cdot ${n} \\cdot 8.3 \\cdot ${dT} = ${QpFrac}` },
      ],
      hints: [
        'Use $Q_p = \\frac{5}{2} n R \\Delta T$.',
        `$Q_p = \\frac{5}{2} \\cdot ${n} \\cdot 8.3 \\cdot ${dT} = ${QpFrac}$ J.`,
      ],
      inputHint: 'Enter an exact integer or fraction.',
    }
  }

  if (shape === 'latent_heat_phase_change') {
    const isMelting = rng.pick([true, false])
    const m = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])

    if (isMelting) {
      const L = 330000 // J/kg
      const Q = m * L
      return {
        statement: `Find the heat $Q$ in Joules required to melt $m = ${m}$ kg of ice at $0^{\\circ}$C to water at $0^{\\circ}$C. Use latent heat of fusion $L = 330000$ J/kg.`,
        answer: { kind: 'number', value: String(Q) },
        solution: [
          { text: 'Apply phase change heat formula $Q = m L$:' },
          { text: 'Compute heat:', tex: `Q = ${m} \\cdot 330000 = ${Q}` },
        ],
        hints: [
          'Use $Q = m L$.',
          `$Q = ${m} \\cdot 330000 = ${Q}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    const L = 2260000 // J/kg
    const Q = m * L
    return {
      statement: `Find the heat $Q$ in Joules required to vaporize $m = ${m}$ kg of boiling water at $100^{\\circ}$C to steam at $100^{\\circ}$C. Use latent heat of vaporization $L = 2260000$ J/kg.`,
      answer: { kind: 'number', value: String(Q) },
      solution: [
        { text: 'Apply phase change heat formula $Q = m L$:' },
        { text: 'Compute heat:', tex: `Q = ${m} \\cdot 2260000 = ${Q}` },
      ],
      hints: [
        'Use $Q = m L$.',
        `$Q = ${m} \\cdot 2260000 = ${Q}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const isIsothermal = rng.pick([true, false])
  const val = 100 * rng.int(2, 30)

  if (isIsothermal) {
    return {
      statement: `An ideal gas undergoes an isothermal expansion at constant temperature ($T = \\text{const}$, so $\\Delta U = 0$) while doing $W = ${val}$ J of work. Find the heat $Q$ absorbed by the gas in Joules.`,
      answer: { kind: 'number', value: String(val) },
      solution: [
        { text: 'For an isothermal process, internal energy is constant ($\\Delta U = 0$):' },
        { text: 'From First Law $\\Delta U = Q - W = 0 \\implies Q = W$:', tex: `Q = ${val}` },
      ],
      hints: [
        'Isothermal means $\\Delta U = 0$, so $Q = W$.',
        `$Q = ${val}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  return {
    statement: `An ideal gas undergoes an isochoric process at constant volume ($V = \\text{const}$, so $W = 0$) while absorbing $Q = ${val}$ J of heat. Find the change in internal energy $\\Delta U$ in Joules.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: 'For an isochoric process, volume is constant so no work is done ($W = 0$):' },
      { text: 'From First Law $\\Delta U = Q - W = Q - 0$:', tex: `\\Delta U = ${val}` },
    ],
    hints: [
      'Isochoric means $W = 0$, so $\\Delta U = Q$.',
      `$\\Delta U = ${val}$ J.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['calorimeter_metal_water', 'isobaric_expansion_heat_and_work', 'first_law_sign_convention_choice'] as const)

  if (shape === 'calorimeter_metal_water') {
    // Realistic metal specific heats (J/kg K):
    // aluminium: 900, iron: 450, copper: 390, lead: 130, brass: 380, steel: 460, silver: 230, round: 400, 500, 800
    const metalPreset = rng.pick([
      { name: 'aluminium', cm: 900 },
      { name: 'iron', cm: 450 },
      { name: 'copper', cm: 390 },
      { name: 'brass', cm: 380 },
      { name: 'steel', cm: 460 },
      { name: 'silver', cm: 230 },
      { name: 'metal A', cm: 400 },
      { name: 'metal B', cm: 500 },
      { name: 'metal C', cm: 800 },
    ])
    const cm = metalPreset.cm

    // Build backwards: Q_w = mw * 4200 * (tf - tw) must be a multiple of D = mm * cm
    const mm = rng.pick([1, 2, 3, 4])
    const D = mm * cm

    // We want dTw = tf - tw and mw such that (mw * 4200 * dTw) % D === 0
    // Try picking mw, tw, tf, and if not multiple, adjust dTm = (mw * 4200 * dTw) / D
    const mw = rng.pick([1, 2, 3, 4])
    const tw = rng.pick([15, 20])
    const dtWOptions = [5, 10, 15, 20].filter((dtw) => (mw * 4200 * dtw) % D === 0)
    const dtW = dtWOptions.length > 0 ? rng.pick(dtWOptions) : 10
    const tf = tw + dtW
    const qw = mw * 4200 * dtW

    // dTm = qw / D
    const dTm = Math.round(qw / D)
    const tm = tf + dTm

    return {
      statement: `A piece of ${metalPreset.name} of mass $m_m = ${mm}$ kg at initial temperature $t_m = ${tm}^{\\circ}$C is dropped into $m_w = ${mw}$ kg of water at $t_w = ${tw}^{\\circ}$C. The final equilibrium temperature is $t_f = ${tf}^{\\circ}$C. Using water specific heat $c_w = 4200$ J/(kg$\\cdot$K) and ignoring heat loss to the vessel, find the specific heat capacity $c_m$ of the metal in J/(kg$\\cdot$K).`,
      answer: { kind: 'number', value: String(cm) },
      solution: [
        { text: 'Heat lost by metal equals heat gained by water: $m_m c_m (t_m - t_f) = m_w c_w (t_f - t_w)$:' },
        { text: 'Solve for $c_m = \\frac{m_w c_w (t_f - t_w)}{m_m (t_m - t_f)}$:', tex: `c_m = \\frac{${mw} \\cdot 4200 \\cdot (${tf} - ${tw})}{${mm} \\cdot (${tm} - ${tf})} = \\frac{${qw}}{${mm * (tm - tf)}} = ${cm}` },
      ],
      hints: [
        'Set heat lost $m_m c_m (t_m - t_f)$ equal to heat gained $m_w c_w (t_f - t_w)$.',
        `$c_m = \\frac{${qw}}{${mm * dTm}} = ${cm}$ J/(kg$\\cdot$K).`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'isobaric_expansion_heat_and_work') {
    const pPa = 100000 * rng.int(1, 8)
    const dV = rng.pick([0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1])
    const pdV = Math.round(pPa * dV)
    const askFor = rng.pick(['work', 'internal_energy', 'heat'] as const)

    if (askFor === 'work') {
      return {
        statement: `An ideal monatomic gas expands at constant pressure $p = ${pPa}$ Pa by $\\Delta V = ${dV.toFixed(2)}$ m$^3$. Find the work done $W$ BY the gas in Joules.`,
        answer: { kind: 'number', value: String(pdV) },
        solution: [
          { text: 'At constant pressure, work done BY gas is $W = p \\Delta V$:' },
          { text: 'Compute work:', tex: `W = ${pPa} \\cdot ${dV.toFixed(2)} = ${pdV}` },
        ],
        hints: [
          'Use $W = p \\Delta V$.',
          `$W = ${pPa} \\cdot ${dV.toFixed(2)} = ${pdV}$ J.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    if (askFor === 'internal_energy') {
      const dU = makeFrac(3 * pdV, 2)
      return {
        statement: `An ideal monatomic gas expands at constant pressure $p = ${pPa}$ Pa by $\\Delta V = ${dV.toFixed(2)}$ m$^3$. Find the change in internal energy $\\Delta U$ in Joules.`,
        answer: { kind: 'number', value: dU },
        solution: [
          { text: 'For a monatomic gas, $\\Delta U = \\frac{3}{2} p \\Delta V$:' },
          { text: 'Compute $\\Delta U$:', tex: `\\Delta U = \\frac{3}{2} \\cdot ${pPa} \\cdot ${dV.toFixed(2)} = ${dU}` },
        ],
        hints: [
          'Use $\\Delta U = \\frac{3}{2} p \\Delta V$.',
          `$\\Delta U = \\frac{3}{2} \\cdot ${pdV} = ${dU}$ J.`,
        ],
        inputHint: 'Enter an exact integer or fraction.',
      }
    }

    const Qval = makeFrac(5 * pdV, 2)
    return {
      statement: `An ideal monatomic gas expands at constant pressure $p = ${pPa}$ Pa by $\\Delta V = ${dV.toFixed(2)}$ m$^3$. Find the total heat $Q$ absorbed by the gas in Joules.`,
      answer: { kind: 'number', value: Qval },
      solution: [
        { text: 'Heat added at constant pressure for a monatomic gas is $Q = \\Delta U + W = \\frac{5}{2} p \\Delta V$:' },
        { text: 'Compute heat $Q$:', tex: `Q = \\frac{5}{2} \\cdot ${pPa} \\cdot ${dV.toFixed(2)} = ${Qval}` },
      ],
      hints: [
        'Use $Q = \\frac{5}{2} p \\Delta V$.',
        `$Q = \\frac{5}{2} \\cdot ${pdV} = ${Qval}$ J.`,
      ],
      inputHint: 'Enter an exact integer or fraction.',
    }
  }

  const choiceSet = rng.pick([
    {
      stmt: 'Which statement correctly reflects the sign conventions for the First Law of Thermodynamics $\\Delta U = Q - W$?',
      correct: 'Work $W > 0$ when gas expands against surroundings, and heat $Q > 0$ when absorbed by the gas',
      opt2: 'Work $W > 0$ when gas is compressed by surroundings, and $Q > 0$ when heat is released',
      opt3: 'Internal energy change $\\Delta U$ is always zero for any cyclic or non-cyclic process',
      opt4: 'Heat absorbed by an expanding gas is always equal to zero in an isobaric expansion',
    },
    {
      stmt: 'What is the change in internal energy $\\Delta U$ for any ideal gas undergoing a complete cyclic process?',
      correct: '$\\Delta U = 0$ because internal energy is a state function and the initial and final states are identical',
      opt2: '$\\Delta U > 0$ because work is always produced in a cycle',
      opt3: '$\\Delta U = Q + W$ because cyclic work adds directly to internal energy',
      opt4: '$\\Delta U$ depends on whether the cycle is rectangular or triangular',
    },
    {
      stmt: 'For an ideal gas, how does internal energy $U$ relate to temperature $T$?',
      correct: 'Internal energy depends solely on temperature $T$ and is independent of volume and pressure',
      opt2: 'Internal energy depends solely on volume $V$ and is independent of temperature',
      opt3: 'Internal energy is inversely proportional to temperature in Kelvin',
      opt4: 'Internal energy decreases whenever a gas expands isobarically',
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
      { text: `By standard thermodynamics, ${choiceSet.correct.toLowerCase()}.` },
    ],
    hints: [
      'Recall $W > 0$ for expansion (work done BY gas).',
      '$Q > 0$ for heat absorbed by the gas.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'first_law',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
