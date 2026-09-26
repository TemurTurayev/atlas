import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Rearranging a formula: isolate the required letter alone on one side of the equation.',
  'The steps are the same as for an equation: move terms across with a sign change, multiply or divide both sides.',
  'If the variable is in the denominator, first multiply both sides by that denominator.',
  'Common mistake: multiplying or dividing only part of an expression instead of both whole sides.',
].join('\n')

const HINTS = [
  'Identify which operation is "in the way" of the required variable, and apply the inverse operation to both sides.',
  'If the variable is in the denominator, first multiply both sides by the denominator to remove it from there.',
]
const INPUT_HINT = 'Enter an expression in terms of the known letters'

const VARIANTS1: readonly (readonly [string, string, string])[] = [
  ['v', 's', 't'],
  ['p', 'F', 'A'],
  ['d', 'm', 'V'],
  ['I', 'V', 'R'],
  ['C', 'Q', 'V'],
  ['c', 'n', 'V'],
  ['P', 'W', 't'],
  ['a', 'F', 'm'],
  ['P', 'E', 't'],
  ['k', 'F', 'x'],
  ['v', 'd', 't'],
  ['M', 'm', 'n'],
  ['w', 'W', 't'],
  ['S', 'A', 'b'],
  ['T', 'Q', 'C'],
  ['A', 'F', 'p'],
  ['V', 'm', 'd'],
  ['R', 'V', 'I'],
  ['t', 's', 'v'],
  ['m', 'F', 'a'],
  ['V', 'Q', 'C'],
  ['V', 'n', 'c'],
  ['W', 'E', 't'],
  ['y', 'x', 'a'],
  ['z', 'w', 'b'],
]

function tier1(rng: Rng): Problem {
  const [lhs, num, den] = rng.pick(VARIANTS1)
  const phrasing = rng.int(1, 3)
  let statement: string
  if (phrasing === 1) {
    statement = `Given $${lhs} = \\dfrac{${num}}{${den}}$, solve for $${den}$.`
  } else if (phrasing === 2) {
    statement = `In the formula $${lhs} = \\dfrac{${num}}{${den}}$, solve for $${den}$.`
  } else {
    statement = `Rearrange $${lhs} = \\dfrac{${num}}{${den}}$ to make $${den}$ the subject.`
  }

  return {
    statement,
    answer: { kind: 'expression', value: `\\frac{${num}}{${lhs}}`, variables: [num, lhs] },
    solution: [
      { text: `Multiply both sides by $${den}$:`, tex: `${lhs}${den} = ${num}` },
      { text: `Divide both sides by $${lhs}$:`, tex: `${den} = \\frac{${num}}{${lhs}}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const branch = rng.int(1, 9)
  const phrasing = rng.int(1, 2)

  if (branch === 1) {
    const solveForB = rng.chance(0.5)
    const known = solveForB ? 'a' : 'b'
    const target = solveForB ? 'b' : 'a'
    const value = `\\frac{${known}f}{${known}-f}`
    const stmt = phrasing === 1
      ? `The thin-lens equation is $\\dfrac{1}{f} = \\dfrac{1}{a} + \\dfrac{1}{b}$. Solve for $${target}$ in terms of $${known}$ and $f$.`
      : `Given the thin-lens equation $\\dfrac{1}{f} = \\dfrac{1}{a} + \\dfrac{1}{b}$, rearrange to solve for $${target}$.`
    return {
      statement: stmt,
      answer: { kind: 'expression', value, variables: [known, 'f'], domain: { [known]: [2, 4], f: [0.3, 0.8] } },
      solution: [
        { text: `Move $\\frac{1}{${known}}$ to the other side:`, tex: `\\frac{1}{${target}} = \\frac{1}{f} - \\frac{1}{${known}}` },
        { text: 'Bring to a common denominator:', tex: `\\frac{1}{${target}} = \\frac{${known}-f}{f\\cdot ${known}}` },
        { text: 'Take the reciprocal of both sides:', tex: `${target} = \\frac{f\\cdot ${known}}{${known}-f} = \\frac{${known}f}{${known}-f}` },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 2) {
    const solveForR2 = rng.chance(0.5)
    const known = solveForR2 ? 'R_1' : 'R_2'
    const target = solveForR2 ? 'R_2' : 'R_1'
    const value = `\\frac{${known}R}{${known}-R}`
    const stmt = phrasing === 1
      ? `For resistors in parallel, $\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2}$. Solve for $${target}$ in terms of $${known}$ and $R$.`
      : `Given parallel resistance $\\dfrac{1}{R} = \\dfrac{1}{R_1} + \\dfrac{1}{R_2}$, solve for $${target}$.`
    return {
      statement: stmt,
      answer: { kind: 'expression', value, variables: [known, 'R'], domain: { [known]: [3, 8], R: [1, 2] } },
      solution: [
        { text: `Move $\\frac{1}{${known}}$ to the other side:`, tex: `\\frac{1}{${target}} = \\frac{1}{R} - \\frac{1}{${known}}` },
        { text: 'Bring to a common denominator:', tex: `\\frac{1}{${target}} = \\frac{${known}-R}{${known}R}` },
        { text: 'Take the reciprocal:', tex: `${target} = \\frac{${known}R}{${known}-R}` },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 3) {
    const solveForC2 = rng.chance(0.5)
    const known = solveForC2 ? 'C_1' : 'C_2'
    const target = solveForC2 ? 'C_2' : 'C_1'
    const value = `\\frac{${known}C}{${known}-C}`
    const stmt = phrasing === 1
      ? `For capacitors in series, $\\dfrac{1}{C} = \\dfrac{1}{C_1} + \\dfrac{1}{C_2}$. Solve for $${target}$ in terms of $${known}$ and $C$.`
      : `Given series capacitance $\\dfrac{1}{C} = \\dfrac{1}{C_1} + \\dfrac{1}{C_2}$, solve for $${target}$.`
    return {
      statement: stmt,
      answer: { kind: 'expression', value, variables: [known, 'C'], domain: { [known]: [3, 8], C: [1, 2] } },
      solution: [
        { text: `Move $\\frac{1}{${known}}$ to the other side:`, tex: `\\frac{1}{${target}} = \\frac{1}{C} - \\frac{1}{${known}}` },
        { text: 'Bring to a common denominator:', tex: `\\frac{1}{${target}} = \\frac{${known}-C}{${known}C}` },
        { text: 'Take the reciprocal:', tex: `${target} = \\frac{${known}C}{${known}-C}` },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 4) {
    const solveForM = rng.chance(0.5)
    if (solveForM) {
      return {
        statement: phrasing === 1 ? 'Kinetic energy is given by $E = \\dfrac{1}{2}mv^2$. Solve for $m$.' : 'From $E = \\dfrac{1}{2}mv^2$, express $m$ in terms of $E$ and $v$.',
        answer: { kind: 'expression', value: '\\frac{2E}{v^2}', variables: ['E', 'v'], domain: { E: [2, 10], v: [1, 4] } },
        solution: [
          { text: 'Multiply both sides by $2$:', tex: '2E = mv^2' },
          { text: 'Divide both sides by $v^2$:', tex: 'm = \\frac{2E}{v^2}' },
        ],
        hints: HINTS,
        inputHint: INPUT_HINT,
      }
    }
    return {
      statement: phrasing === 1 ? 'Kinetic energy is given by $E = \\dfrac{1}{2}mv^2$. Solve for $v^2$.' : 'From $E = \\dfrac{1}{2}mv^2$, express $v^2$ in terms of $E$ and $m$.',
      answer: { kind: 'expression', value: '\\frac{2E}{m}', variables: ['E', 'm'], domain: { E: [2, 10], m: [1, 4] } },
      solution: [
        { text: 'Multiply both sides by $2$:', tex: '2E = mv^2' },
        { text: 'Divide both sides by $m$:', tex: 'v^2 = \\frac{2E}{m}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 5) {
    const solveForM = rng.chance(0.5)
    if (solveForM) {
      return {
        statement: phrasing === 1 ? 'Body Mass Index is $B = \\dfrac{m}{h^2}$. Solve for $m$.' : 'From $B = \\dfrac{m}{h^2}$, express mass $m$ in terms of $B$ and $h$.',
        answer: { kind: 'expression', value: 'Bh^2', variables: ['B', 'h'], domain: { B: [15, 30], h: [1.2, 2.0] } },
        solution: [{ text: 'Multiply both sides by $h^2$:', tex: 'm = Bh^2' }],
        hints: HINTS,
        inputHint: INPUT_HINT,
      }
    }
    return {
      statement: phrasing === 1 ? 'Body Mass Index is $B = \\dfrac{m}{h^2}$. Solve for $h^2$.' : 'From $B = \\dfrac{m}{h^2}$, express $h^2$ in terms of $m$ and $B$.',
      answer: { kind: 'expression', value: '\\frac{m}{B}', variables: ['m', 'B'], domain: { m: [50, 90], B: [18, 25] } },
      solution: [
        { text: 'Multiply both sides by $h^2$:', tex: 'Bh^2 = m' },
        { text: 'Divide both sides by $B$:', tex: 'h^2 = \\frac{m}{B}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 6) {
    const solveForR = rng.chance(0.5)
    if (solveForR) {
      return {
        statement: phrasing === 1 ? 'Electric power in a circuit is $P = \\dfrac{V^2}{R}$. Solve for $R$.' : 'From $P = \\dfrac{V^2}{R}$, express resistance $R$ in terms of $P$ and $V$.',
        answer: { kind: 'expression', value: '\\frac{V^2}{P}', variables: ['V', 'P'], domain: { V: [2, 12], P: [1, 6] } },
        solution: [
          { text: 'Multiply both sides by $R$:', tex: 'PR = V^2' },
          { text: 'Divide both sides by $P$:', tex: 'R = \\frac{V^2}{P}' },
        ],
        hints: HINTS,
        inputHint: INPUT_HINT,
      }
    }
    return {
      statement: phrasing === 1 ? 'Electric power in a circuit is $P = \\dfrac{V^2}{R}$. Solve for $V^2$.' : 'From $P = \\dfrac{V^2}{R}$, express $V^2$ in terms of $P$ and $R$.',
      answer: { kind: 'expression', value: 'PR', variables: ['P', 'R'], domain: { P: [1, 6], R: [2, 10] } },
      solution: [{ text: 'Multiply both sides by $R$:', tex: 'V^2 = PR' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 7) {
    const solveForR = rng.chance(0.5)
    if (solveForR) {
      return {
        statement: phrasing === 1 ? 'Centripetal acceleration is $a = \\dfrac{v^2}{r}$. Solve for $r$.' : 'From $a = \\dfrac{v^2}{r}$, express radius $r$ in terms of $a$ and $v$.',
        answer: { kind: 'expression', value: '\\frac{v^2}{a}', variables: ['v', 'a'], domain: { v: [2, 10], a: [1, 5] } },
        solution: [
          { text: 'Multiply both sides by $r$:', tex: 'ar = v^2' },
          { text: 'Divide both sides by $a$:', tex: 'r = \\frac{v^2}{a}' },
        ],
        hints: HINTS,
        inputHint: INPUT_HINT,
      }
    }
    return {
      statement: phrasing === 1 ? 'Centripetal acceleration is $a = \\dfrac{v^2}{r}$. Solve for $v^2$.' : 'From $a = \\dfrac{v^2}{r}$, express $v^2$ in terms of $a$ and $r$.',
      answer: { kind: 'expression', value: 'ar', variables: ['a', 'r'], domain: { a: [1, 5], r: [2, 10] } },
      solution: [{ text: 'Multiply both sides by $r$:', tex: 'v^2 = ar' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  if (branch === 8) {
    const solveForK = rng.chance(0.5)
    if (solveForK) {
      return {
        statement: phrasing === 1 ? 'Potential energy of a spring is $U = \\dfrac{1}{2}kx^2$. Solve for $k$.' : 'From $U = \\dfrac{1}{2}kx^2$, express spring constant $k$ in terms of $U$ and $x$.',
        answer: { kind: 'expression', value: '\\frac{2U}{x^2}', variables: ['U', 'x'], domain: { U: [2, 10], x: [1, 4] } },
        solution: [
          { text: 'Multiply both sides by $2$:', tex: '2U = kx^2' },
          { text: 'Divide both sides by $x^2$:', tex: 'k = \\frac{2U}{x^2}' },
        ],
        hints: HINTS,
        inputHint: INPUT_HINT,
      }
    }
    return {
      statement: phrasing === 1 ? 'Potential energy of a spring is $U = \\dfrac{1}{2}kx^2$. Solve for $x^2$.' : 'From $U = \\dfrac{1}{2}kx^2$, express $x^2$ in terms of $U$ and $k$.',
      answer: { kind: 'expression', value: '\\frac{2U}{k}', variables: ['U', 'k'], domain: { U: [2, 10], k: [1, 5] } },
      solution: [
        { text: 'Multiply both sides by $2$:', tex: '2U = kx^2' },
        { text: 'Divide both sides by $k$:', tex: 'x^2 = \\frac{2U}{k}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }

  const solveForM = rng.chance(0.5)
  if (solveForM) {
    return {
      statement: phrasing === 1 ? 'Mass-energy equivalence is given by $E = mc^2$. Solve for $m$.' : 'From $E = mc^2$, express mass $m$ in terms of $E$ and $c$.',
      answer: { kind: 'expression', value: '\\frac{E}{c^2}', variables: ['E', 'c'], domain: { E: [5, 20], c: [2, 5] } },
      solution: [{ text: 'Divide both sides by $c^2$:', tex: 'm = \\frac{E}{c^2}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: phrasing === 1 ? 'Mass-energy equivalence is given by $E = mc^2$. Solve for $c^2$.' : 'From $E = mc^2$, express $c^2$ in terms of $E$ and $m$.',
    answer: { kind: 'expression', value: '\\frac{E}{m}', variables: ['E', 'm'], domain: { E: [5, 20], m: [1, 5] } },
    solution: [{ text: 'Divide both sides by $m$:', tex: 'c^2 = \\frac{E}{m}' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function celsiusBranch(rng: Rng): Problem {
  const solveForF = rng.chance(0.5)
  if (solveForF) {
    return {
      statement: 'The formula $C = \\dfrac{5(F-32)}{9}$ converts Fahrenheit to Celsius. Solve for $F$.',
      answer: { kind: 'expression', value: '\\frac{9C}{5}+32', variables: ['C'], domain: { C: [0, 40] } },
      solution: [
        { text: 'Multiply both sides by $9$:', tex: '9C = 5(F-32)' },
        { text: 'Divide both sides by $5$:', tex: '\\frac{9C}{5} = F-32' },
        { text: 'Add $32$ to both sides:', tex: 'F = \\frac{9C}{5}+32' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'The formula $F = \\dfrac{9C}{5} + 32$ converts Celsius to Fahrenheit. Solve for $C$.',
    answer: { kind: 'expression', value: '\\frac{5(F-32)}{9}', variables: ['F'], domain: { F: [32, 100] } },
    solution: [
      { text: 'Subtract $32$ from both sides:', tex: 'F - 32 = \\frac{9C}{5}' },
      { text: 'Multiply both sides by $\\frac{5}{9}$:', tex: 'C = \\frac{5(F-32)}{9}' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function interestBranch(rng: Rng): Problem {
  const target = rng.pick(['r', 't', 'P'] as const)
  if (target === 'r') {
    return {
      statement: 'Simple interest is $A = P(1+rt)$. Solve for $r$.',
      answer: { kind: 'expression', value: '\\frac{A-P}{Pt}', variables: ['A', 'P', 't'], domain: { A: [3, 6], P: [1.5, 2.5], t: [0.5, 2.5] } },
      solution: [
        { text: 'Expand the parentheses:', tex: 'A = P + Prt' },
        { text: 'Move $P$ to the other side:', tex: 'A - P = Prt' },
        { text: 'Divide both sides by $Pt$:', tex: 'r = \\frac{A-P}{Pt}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 't') {
    return {
      statement: 'Simple interest is $A = P(1+rt)$. Solve for $t$.',
      answer: { kind: 'expression', value: '\\frac{A-P}{Pr}', variables: ['A', 'P', 'r'], domain: { A: [3, 6], P: [1.5, 2.5], r: [0.05, 0.2] } },
      solution: [
        { text: 'Expand the parentheses:', tex: 'A = P + Prt' },
        { text: 'Move $P$ to the other side:', tex: 'A - P = Prt' },
        { text: 'Divide both sides by $Pr$:', tex: 't = \\frac{A-P}{Pr}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'Simple interest is $A = P(1+rt)$. Solve for $P$.',
    answer: { kind: 'expression', value: '\\frac{A}{1+rt}', variables: ['A', 'r', 't'], domain: { A: [3, 6], r: [0.05, 0.2], t: [0.5, 2.5] } },
    solution: [{ text: 'Divide both sides by $1+rt$:', tex: 'P = \\frac{A}{1+rt}' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function gasLawBranch(rng: Rng): Problem {
  const target = rng.pick(['T', 'P', 'V', 'n'] as const)
  if (target === 'T') {
    return {
      statement: 'The ideal gas law is $PV = nRT$. Solve for $T$.',
      answer: { kind: 'expression', value: '\\frac{PV}{nR}', variables: ['P', 'V', 'n', 'R'], domain: { P: [1, 5], V: [1, 5], n: [1, 3], R: [1, 3] } },
      solution: [{ text: 'Divide both sides by $nR$:', tex: 'T = \\frac{PV}{nR}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'P') {
    return {
      statement: 'The ideal gas law is $PV = nRT$. Solve for $P$.',
      answer: { kind: 'expression', value: '\\frac{nRT}{V}', variables: ['n', 'R', 'T', 'V'], domain: { n: [1, 3], R: [1, 3], T: [200, 400], V: [1, 5] } },
      solution: [{ text: 'Divide both sides by $V$:', tex: 'P = \\frac{nRT}{V}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'V') {
    return {
      statement: 'The ideal gas law is $PV = nRT$. Solve for $V$.',
      answer: { kind: 'expression', value: '\\frac{nRT}{P}', variables: ['n', 'R', 'T', 'P'], domain: { n: [1, 3], R: [1, 3], T: [200, 400], P: [1, 5] } },
      solution: [{ text: 'Divide both sides by $P$:', tex: 'V = \\frac{nRT}{P}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'The ideal gas law is $PV = nRT$. Solve for $n$.',
    answer: { kind: 'expression', value: '\\frac{PV}{RT}', variables: ['P', 'V', 'R', 'T'], domain: { P: [1, 5], V: [1, 5], R: [1, 3], T: [200, 400] } },
    solution: [{ text: 'Divide both sides by $RT$:', tex: 'n = \\frac{PV}{RT}' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function heatBranch(rng: Rng): Problem {
  const target = rng.pick(['m', 'c', 'T'] as const)
  if (target === 'm') {
    return {
      statement: 'Heat energy absorbed is $Q = m c T$. Solve for $m$.',
      answer: { kind: 'expression', value: '\\frac{Q}{c T}', variables: ['Q', 'c', 'T'], domain: { Q: [10, 50], c: [1, 5], T: [1, 5] } },
      solution: [{ text: 'Divide both sides by $c T$:', tex: 'm = \\frac{Q}{c T}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'c') {
    return {
      statement: 'Heat energy absorbed is $Q = m c T$. Solve for $c$.',
      answer: { kind: 'expression', value: '\\frac{Q}{m T}', variables: ['Q', 'm', 'T'], domain: { Q: [10, 50], m: [1, 5], T: [1, 5] } },
      solution: [{ text: 'Divide both sides by $m T$:', tex: 'c = \\frac{Q}{m T}' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'Heat energy absorbed is $Q = m c T$. Solve for $T$.',
    answer: { kind: 'expression', value: '\\frac{Q}{m c}', variables: ['Q', 'm', 'c'], domain: { Q: [10, 50], m: [1, 5], c: [1, 5] } },
    solution: [{ text: 'Divide both sides by $m c$:', tex: 'T = \\frac{Q}{m c}' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function kinematicsBranch(rng: Rng): Problem {
  const target = rng.pick(['a', 't', 'u'] as const)
  if (target === 'a') {
    return {
      statement: 'Final velocity is $v = u + at$. Solve for $a$.',
      answer: { kind: 'expression', value: '\\frac{v-u}{t}', variables: ['v', 'u', 't'], domain: { v: [10, 30], u: [1, 9], t: [1, 5] } },
      solution: [
        { text: 'Subtract $u$ from both sides:', tex: 'v - u = at' },
        { text: 'Divide both sides by $t$:', tex: 'a = \\frac{v-u}{t}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 't') {
    return {
      statement: 'Final velocity is $v = u + at$. Solve for $t$.',
      answer: { kind: 'expression', value: '\\frac{v-u}{a}', variables: ['v', 'u', 'a'], domain: { v: [10, 30], u: [1, 9], a: [1, 5] } },
      solution: [
        { text: 'Subtract $u$ from both sides:', tex: 'v - u = at' },
        { text: 'Divide both sides by $a$:', tex: 't = \\frac{v-u}{a}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'Final velocity is $v = u + at$. Solve for $u$.',
    answer: { kind: 'expression', value: 'v-at', variables: ['v', 'a', 't'], domain: { v: [20, 40], a: [1, 4], t: [1, 4] } },
    solution: [{ text: 'Subtract $at$ from both sides:', tex: 'u = v - at' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function linearEqBranch(rng: Rng): Problem {
  const target = rng.pick(['m', 'x', 'c'] as const)
  if (target === 'm') {
    return {
      statement: 'The equation of a line is $y = mx + c$. Solve for $m$.',
      answer: { kind: 'expression', value: '\\frac{y-c}{x}', variables: ['y', 'c', 'x'], domain: { y: [10, 30], c: [1, 5], x: [1, 5] } },
      solution: [
        { text: 'Subtract $c$ from both sides:', tex: 'y - c = mx' },
        { text: 'Divide both sides by $x$:', tex: 'm = \\frac{y-c}{x}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'x') {
    return {
      statement: 'The equation of a line is $y = mx + c$. Solve for $x$.',
      answer: { kind: 'expression', value: '\\frac{y-c}{m}', variables: ['y', 'c', 'm'], domain: { y: [10, 30], c: [1, 5], m: [1, 5] } },
      solution: [
        { text: 'Subtract $c$ from both sides:', tex: 'y - c = mx' },
        { text: 'Divide both sides by $m$:', tex: 'x = \\frac{y-c}{m}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'The equation of a line is $y = mx + c$. Solve for $c$.',
    answer: { kind: 'expression', value: 'y-mx', variables: ['y', 'm', 'x'], domain: { y: [20, 50], m: [2, 5], x: [2, 5] } },
    solution: [{ text: 'Subtract $mx$ from both sides:', tex: 'c = y - mx' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function gpSumBranch(rng: Rng): Problem {
  const solveForR = rng.chance(0.5)
  if (solveForR) {
    return {
      statement: 'The sum of an infinite geometric series is $S = \\dfrac{a}{1-r}$. Solve for $r$.',
      answer: { kind: 'expression', value: '1-\\frac{a}{S}', variables: ['a', 'S'], domain: { a: [1, 5], S: [6, 20] } },
      solution: [
        { text: 'Multiply both sides by $1-r$:', tex: 'S(1-r) = a' },
        { text: 'Divide both sides by $S$:', tex: '1-r = \\frac{a}{S}' },
        { text: 'Solve for $r$:', tex: 'r = 1 - \\frac{a}{S}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: 'The sum of an infinite geometric series is $S = \\dfrac{a}{1-r}$. Solve for $a$.',
    answer: { kind: 'expression', value: 'S(1-r)', variables: ['S', 'r'], domain: { S: [5, 20], r: [0.1, 0.5] } },
    solution: [{ text: 'Multiply both sides by $1-r$:', tex: 'a = S(1-r)' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function coulombBranch(rng: Rng): Problem {
  const target = rng.pick(['k', 'r^2', 'q_1'] as const)
  const phrasing = rng.chance(0.5)
  if (target === 'k') {
    return {
      statement: phrasing ? 'Coulomb\'s law is $F = \\dfrac{k q_1 q_2}{r^2}$. Solve for $k$.' : 'From Coulomb\'s law $F = \\dfrac{k q_1 q_2}{r^2}$, express $k$ in terms of $F$, $r$, $q_1$, and $q_2$.',
      answer: { kind: 'expression', value: '\\frac{Fr^2}{q_1 q_2}', variables: ['F', 'r', 'q_1', 'q_2'], domain: { F: [1, 5], r: [1, 5], q_1: [1, 3], q_2: [1, 3] } },
      solution: [
        { text: 'Multiply both sides by $r^2$:', tex: 'F r^2 = k q_1 q_2' },
        { text: 'Divide both sides by $q_1 q_2$:', tex: 'k = \\frac{Fr^2}{q_1 q_2}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'r^2') {
    return {
      statement: phrasing ? 'Coulomb\'s law is $F = \\dfrac{k q_1 q_2}{r^2}$. Solve for $r^2$.' : 'From Coulomb\'s law $F = \\dfrac{k q_1 q_2}{r^2}$, express $r^2$ in terms of $k$, $q_1$, $q_2$, and $F$.',
      answer: { kind: 'expression', value: '\\frac{k q_1 q_2}{F}', variables: ['k', 'q_1', 'q_2', 'F'], domain: { k: [1, 5], q_1: [1, 3], q_2: [1, 3], F: [1, 5] } },
      solution: [
        { text: 'Multiply both sides by $r^2$:', tex: 'F r^2 = k q_1 q_2' },
        { text: 'Divide both sides by $F$:', tex: 'r^2 = \\frac{k q_1 q_2}{F}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: phrasing ? 'Coulomb\'s law is $F = \\dfrac{k q_1 q_2}{r^2}$. Solve for $q_1$.' : 'From Coulomb\'s law $F = \\dfrac{k q_1 q_2}{r^2}$, express charge $q_1$ in terms of $F$, $r$, $k$, and $q_2$.',
    answer: { kind: 'expression', value: '\\frac{Fr^2}{k q_2}', variables: ['F', 'r', 'k', 'q_2'], domain: { F: [1, 5], r: [1, 5], k: [1, 3], q_2: [1, 3] } },
    solution: [
      { text: 'Multiply both sides by $r^2$:', tex: 'F r^2 = k q_1 q_2' },
      { text: 'Divide both sides by $k q_2$:', tex: 'q_1 = \\frac{Fr^2}{k q_2}' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function kinematics2Branch(rng: Rng): Problem {
  const target = rng.pick(['a', 's', 'u^2'] as const)
  const phrasing = rng.chance(0.5)
  if (target === 'a') {
    return {
      statement: phrasing ? 'The equation of motion is $v^2 = u^2 + 2as$. Solve for $a$.' : 'From $v^2 = u^2 + 2as$, express acceleration $a$ in terms of $v$, $u$, and $s$.',
      answer: { kind: 'expression', value: '\\frac{v^2-u^2}{2s}', variables: ['v', 'u', 's'], domain: { v: [10, 30], u: [1, 8], s: [1, 5] } },
      solution: [
        { text: 'Subtract $u^2$ from both sides:', tex: 'v^2 - u^2 = 2as' },
        { text: 'Divide both sides by $2s$:', tex: 'a = \\frac{v^2-u^2}{2s}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 's') {
    return {
      statement: phrasing ? 'The equation of motion is $v^2 = u^2 + 2as$. Solve for $s$.' : 'From $v^2 = u^2 + 2as$, express displacement $s$ in terms of $v$, $u$, and $a$.',
      answer: { kind: 'expression', value: '\\frac{v^2-u^2}{2a}', variables: ['v', 'u', 'a'], domain: { v: [10, 30], u: [1, 8], a: [1, 5] } },
      solution: [
        { text: 'Subtract $u^2$ from both sides:', tex: 'v^2 - u^2 = 2as' },
        { text: 'Divide both sides by $2a$:', tex: 's = \\frac{v^2-u^2}{2a}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: phrasing ? 'The equation of motion is $v^2 = u^2 + 2as$. Solve for $u^2$.' : 'From $v^2 = u^2 + 2as$, express $u^2$ in terms of $v$, $a$, and $s$.',
    answer: { kind: 'expression', value: 'v^2-2as', variables: ['v', 'a', 's'], domain: { v: [20, 40], a: [1, 4], s: [1, 5] } },
    solution: [{ text: 'Subtract $2as$ from both sides:', tex: 'u^2 = v^2 - 2as' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function standardLineBranch(rng: Rng): Problem {
  const target = rng.pick(['x', 'y', 'a'] as const)
  const phrasing = rng.chance(0.5)
  if (target === 'x') {
    return {
      statement: phrasing ? 'The equation of a line is $ax + by = c$. Solve for $x$.' : 'Rearrange $ax + by = c$ to solve for $x$ in terms of $a$, $b$, $c$, and $y$.',
      answer: { kind: 'expression', value: '\\frac{c-by}{a}', variables: ['c', 'b', 'y', 'a'], domain: { c: [10, 30], b: [1, 5], y: [1, 5], a: [1, 5] } },
      solution: [
        { text: 'Subtract $by$ from both sides:', tex: 'ax = c - by' },
        { text: 'Divide both sides by $a$:', tex: 'x = \\frac{c-by}{a}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  if (target === 'y') {
    return {
      statement: phrasing ? 'The equation of a line is $ax + by = c$. Solve for $y$.' : 'Rearrange $ax + by = c$ to solve for $y$ in terms of $a$, $b$, $c$, and $x$.',
      answer: { kind: 'expression', value: '\\frac{c-ax}{b}', variables: ['c', 'a', 'x', 'b'], domain: { c: [10, 30], a: [1, 5], x: [1, 5], b: [1, 5] } },
      solution: [
        { text: 'Subtract $ax$ from both sides:', tex: 'by = c - ax' },
        { text: 'Divide both sides by $b$:', tex: 'y = \\frac{c-ax}{b}' },
      ],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: phrasing ? 'The equation of a line is $ax + by = c$. Solve for $a$.' : 'Rearrange $ax + by = c$ to solve for $a$ in terms of $b$, $c$, $x$, and $y$.',
    answer: { kind: 'expression', value: '\\frac{c-by}{x}', variables: ['c', 'b', 'y', 'x'], domain: { c: [10, 30], b: [1, 5], y: [1, 5], x: [1, 5] } },
    solution: [
      { text: 'Subtract $by$ from both sides:', tex: 'ax = c - by' },
      { text: 'Divide both sides by $x$:', tex: 'a = \\frac{c-by}{x}' },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function pythagorasBranch(rng: Rng): Problem {
  const solveForA2 = rng.chance(0.5)
  const phrasing = rng.chance(0.5)
  if (solveForA2) {
    return {
      statement: phrasing ? 'In the Pythagorean theorem $c^2 = a^2 + b^2$, solve for $a^2$.' : 'From $c^2 = a^2 + b^2$, express $a^2$ in terms of $c$ and $b$.',
      answer: { kind: 'expression', value: 'c^2-b^2', variables: ['c', 'b'], domain: { c: [5, 15], b: [1, 4] } },
      solution: [{ text: 'Subtract $b^2$ from both sides:', tex: 'a^2 = c^2 - b^2' }],
      hints: HINTS,
      inputHint: INPUT_HINT,
    }
  }
  return {
    statement: phrasing ? 'In the Pythagorean theorem $c^2 = a^2 + b^2$, solve for $b^2$.' : 'From $c^2 = a^2 + b^2$, express $b^2$ in terms of $c$ and $a$.',
    answer: { kind: 'expression', value: 'c^2-a^2', variables: ['c', 'a'], domain: { c: [5, 15], a: [1, 4] } },
    solution: [{ text: 'Subtract $a^2$ from both sides:', tex: 'b^2 = c^2 - a^2' }],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const branch = rng.int(1, 11)
  if (branch === 1) return celsiusBranch(rng)
  if (branch === 2) return interestBranch(rng)
  if (branch === 3) return gasLawBranch(rng)
  if (branch === 4) return heatBranch(rng)
  if (branch === 5) return kinematicsBranch(rng)
  if (branch === 6) return linearEqBranch(rng)
  if (branch === 7) return gpSumBranch(rng)
  if (branch === 8) return coulombBranch(rng)
  if (branch === 9) return kinematics2Branch(rng)
  if (branch === 10) return standardLineBranch(rng)
  return pythagorasBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'rearrange',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
