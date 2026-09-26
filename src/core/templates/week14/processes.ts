import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = `Thermodynamic processes govern how gas state variables change and determine work done $W$:
1. Isobaric ($p = \\text{const}$): $W = p \\Delta V = p (V_2 - V_1)$.
2. Isochoric ($V = \\text{const}$): $W = 0$.
3. Isothermal ($T = \\text{const}$): $W = n R T \\ln\\left(\\frac{V_2}{V_1}\\right) = p_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right)$.
4. Adiabatic ($Q = 0$): $p V^{\\gamma} = \\text{const}$ and $T V^{\\gamma - 1} = \\text{const}$, where $\\gamma = \\frac{5}{3}$ for a monatomic gas.
On a $p V$ diagram, work done equals the area under the process curve. For a closed cyclic process, net work $W_{\\text{net}}$ equals the enclosed area (positive for clockwise cycles).
Common mistakes: Forgetting that work in an isothermal expansion involves natural logarithm $\\ln\\left(\\frac{V_2}{V_1}\\right)$ or miscalculating adiabatic power ratios like $8^{5/3} = 32$.`

function tier1(rng: Rng): Problem {
  const shape = rng.pick(['isobaric_work', 'pv_diagram_rectangle_triangle', 'isochoric_work_zero'] as const)

  if (shape === 'isobaric_work') {
    const pPa = 100000 * rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const v1 = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const v2 = v1 + rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
    const W = pPa * (v2 - v1)

    return {
      statement: `An ideal gas expands isobarically at constant pressure $p = ${pPa}$ Pa from volume $V_1 = ${v1}$ m$^3$ to volume $V_2 = ${v2}$ m$^3$. Find the work done $W$ BY the gas in Joules.`,
      answer: { kind: 'number', value: String(W) },
      solution: [
        { text: 'Work in an isobaric process is $W = p (V_2 - V_1)$:' },
        { text: 'Compute work:', tex: `W = ${pPa} \\cdot (${v2} - ${v1}) = ${pPa} \\cdot ${v2 - v1} = ${W}` },
      ],
      hints: [
        'Use $W = p (V_2 - V_1)$.',
        `$W = ${pPa} \\cdot ${v2 - v1} = ${W}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'pv_diagram_rectangle_triangle') {
    const V1 = rng.pick([1, 2, 3, 4, 5])
    const p1 = 100000 * rng.int(1, 6)
    const p2 = 100000 * rng.int(7, 12)
    const dV = rng.int(1, 6)
    const V2 = V1 + dV
    const W = Math.round(0.5 * (p1 + p2) * dV)

    return {
      statement: `On a $pV$ diagram, a gas goes linearly from state $(V_1, p_1) = (${V1}\\text{ m}^3, ${p1}\\text{ Pa})$ to state $(V_2, p_2) = (${V2}\\text{ m}^3, ${p2}\\text{ Pa})$. Find the work done $W$ in Joules (the area under the linear path).`,
      answer: { kind: 'number', value: String(W) },
      solution: [
        { text: 'The area under a linear segment on a $pV$ diagram is a trapezoid: $W = \\frac{p_1 + p_2}{2} (V_2 - V_1)$:' },
        { text: 'Compute work:', tex: `W = \\frac{${p1} + ${p2}}{2} \\cdot ${dV} = ${W}` },
      ],
      hints: [
        'Use trapezoid area formula $W = \\frac{p_1 + p_2}{2} \\Delta V$.',
        `$W = \\frac{${p1 + p2}}{2} \\cdot ${dV} = ${W}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const p1 = 100000 * rng.int(1, 8)
  const p2 = 100000 * rng.int(9, 16)
  const V = rng.int(1, 15)

  return {
    statement: `An ideal gas in a rigid container of constant volume $V = ${V}$ m$^3$ is heated so pressure rises from $p_1 = ${p1}$ Pa to $p_2 = ${p2}$ Pa. Find the work done $W$ BY the gas in Joules.`,
    answer: { kind: 'number', value: '0' },
    solution: [
      { text: 'In an isochoric process (constant volume $\\Delta V = 0$), no expansion work is done:' },
      { text: 'Work done is:', tex: `W = 0` },
    ],
    hints: [
      'Since volume does not change ($\\Delta V = 0$), work is zero.',
      '$W = 0$ J.',
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier2(rng: Rng): Problem {
  const shape = rng.pick(['isothermal_work_ln', 'adiabatic_pv_gamma', 'pv_diagram_trapezoid'] as const)

  if (shape === 'isothermal_work_ln') {
    const p1 = 100000 * rng.int(1, 8)
    const V1 = rng.int(1, 6)
    const pV1 = p1 * V1
    const k = rng.pick([2, 3, 4, 5, 6, 8, 10])
    const V2 = V1 * k

    return {
      statement: `An ideal gas at pressure $p_1 = ${p1}$ Pa and volume $V_1 = ${V1}$ m$^3$ expands isothermally to volume $V_2 = ${V2}$ m$^3$. Find the exact work done $W$ in Joules in terms of $\\ln$.`,
      answer: { kind: 'number', value: `${pV1}\\ln(${k})` },
      solution: [
        { text: 'Work in an isothermal expansion is $W = p_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right)$:' },
        { text: 'Compute work:', tex: `W = ${p1} \\cdot ${V1} \\cdot \\ln\\left(\\frac{${V2}}{${V1}}\\right) = ${pV1}\\ln(${k})` },
      ],
      hints: [
        'Use $W = p_1 V_1 \\ln\\left(\\frac{V_2}{V_1}\\right)$.',
        `$W = ${pV1}\\ln(${k})$ J.`,
      ],
      inputHint: 'Enter an exact expression with \\ln like 500000\\ln(2).',
    }
  }

  if (shape === 'adiabatic_pv_gamma') {
    const p1 = 100000 * rng.int(1, 6)
    const r = rng.pick([8, 27]) // 8^(5/3) = 32, 27^(5/3) = 243; 8^(2/3) = 4, 27^(2/3) = 9
    const askPressure = rng.pick([true, false])

    if (askPressure) {
      const mult = r === 8 ? 32 : 243
      const p2 = p1 * mult

      return {
        statement: `A monatomic ideal gas ($\\gamma = \\frac{5}{3}$) at initial pressure $p_1 = ${p1}$ Pa is compressed adiabatically ($Q = 0$) such that its volume decreases by a factor of ${r} ($V_2 = \\frac{V_1}{${r}}$). Find the final pressure $p_2$ in Pascals.`,
        answer: { kind: 'number', value: String(p2) },
        solution: [
          { text: 'For an adiabatic process, $p_1 V_1^{\\gamma} = p_2 V_2^{\\gamma} \\implies p_2 = p_1 \\cdot \\left(\\frac{V_1}{V_2}\\right)^{\\gamma}$:' },
          { text: 'Substitute $\\gamma = \\frac{5}{3}$ and $\\frac{V_1}{V_2} = ${r}$:', tex: `p_2 = ${p1} \\cdot ${r}^{5/3} = ${p1} \\cdot ${mult} = ${p2}` },
        ],
        hints: [
          `Calculate $${r}^{5/3} = (${Math.round(Math.cbrt(r))}^3)^{5/3} = ${mult}$.`,
          `$p_2 = ${p1} \\cdot ${mult} = ${p2}$ Pa.`,
        ],
        inputHint: 'Enter an integer.',
      }
    }

    const t1C = rng.pick([27, 77, 127, 177, 227])
    const T1 = t1C + 273
    const tempMult = r === 8 ? 4 : 9
    const T2 = T1 * tempMult
    const t2C = T2 - 273

    return {
      statement: `A monatomic ideal gas ($\\gamma = \\frac{5}{3}$) at initial temperature $t_1 = ${t1C}^{\\circ}$C is compressed adiabatically ($Q = 0$) until its volume decreases by a factor of ${r} ($V_2 = \\frac{V_1}{${r}}$). Using $T = t + 273$, find final temperature $t_2$ in $^{\\circ}$C.`,
      answer: { kind: 'number', value: String(t2C) },
      solution: [
        { text: 'For an adiabatic process, $T_1 V_1^{\\gamma-1} = T_2 V_2^{\\gamma-1} \\implies T_2 = T_1 \\cdot \\left(\\frac{V_1}{V_2}\\right)^{2/3}$:' },
        { text: 'Substitute $\\frac{V_1}{V_2} = ${r}$ and $T_1 = ${T1}$ K:', tex: `T_2 = ${T1} \\cdot ${r}^{2/3} = ${T1} \\cdot ${tempMult} = ${T2} \\text{ K} \\implies t_2 = ${T2} - 273 = ${t2C}` },
      ],
      hints: [
        `$T_1 = ${T1}$ K and $${r}^{2/3} = ${tempMult}$.`,
        `$T_2 = ${T2}$ K $\\implies t_2 = ${t2C}^{\\circ}$C.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const p1 = 100000 * rng.int(1, 6)
  const p2 = 100000 * rng.int(7, 12)
  const V1 = rng.int(1, 5)
  const V2 = V1 + rng.int(2, 6)
  const dV = V2 - V1
  const W = Math.round(0.5 * (p1 + p2) * dV)

  return {
    statement: `A gas expands along a straight-line path on a $pV$ diagram from state $(V_1, p_1) = (${V1}\\text{ m}^3, ${p1}\\text{ Pa})$ to state $(V_2, p_2) = (${V2}\\text{ m}^3, ${p2}\\text{ Pa})$. Find the work done $W$ in Joules.`,
    answer: { kind: 'number', value: String(W) },
    solution: [
      { text: 'The work equals the trapezoidal area under the segment: $W = \\frac{p_1 + p_2}{2} (V_2 - V_1)$:' },
      { text: 'Compute work:', tex: `W = \\frac{${p1} + ${p2}}{2} \\cdot (${V2} - ${V1}) = ${W}` },
    ],
    hints: [
      'Use $W = \\frac{p_1 + p_2}{2} \\Delta V$.',
      `$W = \\frac{${p1 + p2}}{2} \\cdot ${dV} = ${W}$ J.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

function tier3(rng: Rng): Problem {
  const shape = rng.pick(['rectangular_cycle_work', 'triangular_cycle_work', 'adiabatic_work'] as const)

  if (shape === 'rectangular_cycle_work') {
    const p1 = 100000 * rng.int(1, 5)
    const p2 = 100000 * rng.int(6, 10)
    const V1 = rng.int(1, 4)
    const V2 = V1 + rng.int(2, 6)
    const dp = p2 - p1
    const dV = V2 - V1
    const Wnet = dp * dV

    return {
      statement: `A heat engine operates on a clockwise rectangular cycle on a $pV$ diagram bounded by pressures $p_1 = ${p1}$ Pa, $p_2 = ${p2}$ Pa and volumes $V_1 = ${V1}$ m$^3$, $V_2 = ${V2}$ m$^3$. Find the net work output $W_{\\text{net}}$ per cycle in Joules.`,
      answer: { kind: 'number', value: String(Wnet) },
      solution: [
        { text: 'Net work per cycle equals the enclosed rectangular area $W_{\\text{net}} = (p_2 - p_1)(V_2 - V_1)$:' },
        { text: 'Compute net work:', tex: `W_{\\text{net}} = (${p2} - ${p1}) \\cdot (${V2} - ${V1}) = ${dp} \\cdot ${dV} = ${Wnet}` },
      ],
      hints: [
        'Net work = area of rectangle $(p_2 - p_1)(V_2 - V_1)$.',
        `$W_{\\text{net}} = ${dp} \\cdot ${dV} = ${Wnet}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  if (shape === 'triangular_cycle_work') {
    const p1 = 100000 * rng.int(1, 5)
    const p2 = 100000 * rng.int(6, 11)
    const V1 = rng.int(1, 4)
    const V2 = V1 + 2 * rng.int(1, 5) // ensure even dV for clean integer area
    const dp = p2 - p1
    const dV = V2 - V1
    const Wnet = Math.round(0.5 * dp * dV)

    return {
      statement: `A gas undergoes a clockwise triangular cyclic process on a $pV$ diagram with vertices at $(V_1, p_1) = (${V1}\\text{ m}^3, ${p1}\\text{ Pa})$, $(V_2, p_1) = (${V2}\\text{ m}^3, ${p1}\\text{ Pa})$, and $(V_2, p_2) = (${V2}\\text{ m}^3, ${p2}\\text{ Pa})$. Find the net work output $W_{\\text{net}}$ per cycle in Joules.`,
      answer: { kind: 'number', value: String(Wnet) },
      solution: [
        { text: 'Net work per cycle equals the enclosed triangular area $W_{\\text{net}} = \\frac{1}{2} (p_2 - p_1)(V_2 - V_1)$:' },
        { text: 'Compute net work:', tex: `W_{\\text{net}} = \\frac{1}{2} \\cdot (${p2} - ${p1}) \\cdot (${V2} - ${V1}) = ${Wnet}` },
      ],
      hints: [
        'Net work = triangle area $\\frac{1}{2} \\Delta p \\Delta V$.',
        `$W_{\\text{net}} = \\frac{1}{2} \\cdot ${dp} \\cdot ${dV} = ${Wnet}$ J.`,
      ],
      inputHint: 'Enter an integer.',
    }
  }

  const p1V1 = 100000 * rng.int(4, 16)
  const p2V2 = 100000 * rng.int(1, 3)
  const W = Math.round(1.5 * (p1V1 - p2V2))

  return {
    statement: `In an adiabatic expansion of a monatomic gas ($\\gamma = \\frac{5}{3}$), initial $p_1 V_1 = ${p1V1}$ J and final $p_2 V_2 = ${p2V2}$ J. Find the work done $W = \\frac{p_1 V_1 - p_2 V_2}{\\gamma - 1}$ in Joules.`,
    answer: { kind: 'number', value: String(W) },
    solution: [
      { text: 'Work in an adiabatic process is $W = \\frac{p_1 V_1 - p_2 V_2}{\\gamma - 1} = \\frac{3}{2} (p_1 V_1 - p_2 V_2)$ for $\\gamma = \\frac{5}{3}$:' },
      { text: 'Compute work:', tex: `W = \\frac{3}{2} \\cdot (${p1V1} - ${p2V2}) = \\frac{3}{2} \\cdot ${p1V1 - p2V2} = ${W}` },
    ],
    hints: [
      'Use $W = \\frac{3}{2} (p_1 V_1 - p_2 V_2)$.',
      `$W = \\frac{3}{2} \\cdot ${p1V1 - p2V2} = ${W}$ J.`,
    ],
    inputHint: 'Enter an integer.',
  }
}

export const template: SkillTemplate = {
  skillId: 'processes',
  theory,
  expectedSeconds: { 1: 45, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
