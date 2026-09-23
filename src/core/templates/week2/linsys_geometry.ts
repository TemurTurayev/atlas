import { coefPrefix, joinTerms, linear, paren } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'A system of two linear equations in $x$ and $y$ is really two lines in the plane; solving it means finding where those lines meet.',
  'The determinant $D=a_1b_2-a_2b_1$ of the coefficients decides the outcome: if $D\\neq0$ the lines point in different directions and cross at exactly one point.',
  'If $D=0$ the coefficient rows are proportional (the lines are parallel). Then check $D_x=c_1b_2-c_2b_1$ and $D_y=a_1c_2-a_2c_1$: both zero means the same line (infinitely many solutions), otherwise the lines are distinct (no solution).',
  'The same three outcomes, one point, none, or infinitely many, appear for three planes in three unknowns; only the picture changes, from crossing lines to intersecting planes.',
  'Common mistakes: assuming two equations must always cross exactly once; forgetting to check the constants once $D=0$, which is exactly what tells "no solution" apart from "infinitely many".',
].join('\n')

const HINTS_CLASSIFY = [
  'Compare the coefficients of $x$ and $y$ in the two equations: if their ratio is different, the lines already point in different directions and cross exactly once.',
  'If the ratios of the $x$ and $y$ coefficients match, the lines are parallel. Compare the constants the same way: the same ratio means the same line (infinitely many solutions), a different ratio means no solution.',
]
const HINTS_SOLVE = [
  'Eliminate one variable, or use $D=a_1b_2-a_2b_1$ together with $D_x$ and $D_y$ (replace one column with the constants) to find $x$ and $y$ directly.',
  'Once $D\\neq0$, the solution is simply $x=D_x/D$ and $y=D_y/D$.',
]
const HINTS_PARAM = [
  'Find the value of $k$ that makes the determinant of the coefficients zero: that is exactly when the system stops having one unique solution.',
  'At that value of $k$, the two degenerate outcomes are told apart only by the constants: check whether the right-hand sides are proportional the same way as the coefficient rows.',
]

const INPUT_HINT_VECTOR = 'One number per component, top to bottom'
const INPUT_HINT_NUMBER_K = 'A single number; write a fraction with /, e.g. -3/2'

/** Small nonzero coefficients: keeps every row visually simple and never all-zero. */
const COEF_POOL = [-3, -2, -1, 1, 2, 3]

function eqLatex(a: number, b: number, c: number): string {
  const termX = `${coefPrefix(a)}x`
  const termY = `${coefPrefix(b)}y`
  return `${joinTerms([termX, termY])} = ${c}`
}

function systemLatex(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): string {
  return `\\begin{cases} ${eqLatex(a1, b1, c1)} \\\\ ${eqLatex(a2, b2, c2)} \\end{cases}`
}

/** Picks (a2, b2) so the two coefficient rows are not proportional: det(a1,b1;a2,b2) != 0. */
function pickUniqueRow(rng: Rng, a1: number, b1: number): readonly [number, number] {
  for (let i = 0; i < 200; i += 1) {
    const a2 = rng.pick(COEF_POOL)
    const b2 = rng.pick(COEF_POOL)
    if (a1 * b2 - a2 * b1 !== 0) return [a2, b2]
  }
  throw new Error('linsys_geometry: could not find an independent second row')
}

type Case = 'one' | 'none' | 'infinite'

const OPTION_LABELS: Readonly<Record<Case, string>> = {
  one: 'Exactly one solution',
  none: 'No solution',
  infinite: 'Infinitely many solutions',
}

/** Classifies a 2x2 system via the same D, Dx, Dy numerators used to solve it (Cramer's rule). */
function classify(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): { readonly correct: Case; readonly steps: readonly SolutionStep[] } {
  const D = a1 * b2 - a2 * b1
  const step1: SolutionStep = {
    text: 'Compute the determinant of the coefficients, the same test you would use to solve the system:',
    tex: `D = a_1b_2 - a_2b_1 = ${paren(a1)}\\cdot${paren(b2)} - ${paren(a2)}\\cdot${paren(b1)} = ${D}`,
  }
  if (D !== 0) {
    return {
      correct: 'one',
      steps: [
        step1,
        { text: 'Since $D \\neq 0$, the coefficient rows are not proportional: the two lines point in different directions, so they cross at exactly one point.' },
      ],
    }
  }
  const Dx = c1 * b2 - c2 * b1
  const Dy = a1 * c2 - a2 * c1
  const step2: SolutionStep = {
    text: 'Since $D = 0$, the coefficient rows are proportional: the lines are parallel or identical. Check the right-hand sides the same way:',
    tex: `D_x = c_1b_2 - c_2b_1 = ${paren(c1)}\\cdot${paren(b2)} - ${paren(c2)}\\cdot${paren(b1)} = ${Dx}, \\quad D_y = a_1c_2 - a_2c_1 = ${paren(a1)}\\cdot${paren(c2)} - ${paren(a2)}\\cdot${paren(c1)} = ${Dy}`,
  }
  if (Dx === 0 && Dy === 0) {
    return {
      correct: 'infinite',
      steps: [
        step1,
        step2,
        {
          text: '$D_x = D_y = 0$ as well, so the right-hand sides are proportional by that same factor: the second equation is just a multiple of the first, describing the very same line. Every point on it is a solution.',
        },
      ],
    }
  }
  return {
    correct: 'none',
    steps: [
      step1,
      step2,
      { text: '$D_x$ and $D_y$ are not both zero, so the right-hand sides break that proportion: the lines are parallel but distinct, so the system has no solution.' },
    ],
  }
}

function tier1(rng: Rng): Problem {
  const a1 = rng.pick(COEF_POOL)
  const b1 = rng.pick(COEF_POOL)
  const c1 = rng.intExcept(-9, 9, [0])
  const kase = rng.pick(['unique', 'none', 'infinite'] as const)

  let a2: number
  let b2: number
  let c2: number
  if (kase === 'unique') {
    ;[a2, b2] = pickUniqueRow(rng, a1, b1)
    c2 = rng.int(-9, 9)
  } else {
    const t = rng.pick([-3, -2, -1, 2, 3])
    a2 = t * a1
    b2 = t * b1
    c2 = kase === 'infinite' ? t * c1 : t * c1 + rng.pick([1, -1, 2, -2, 3])
  }

  const { correct, steps } = classify(a1, b1, c1, a2, b2, c2)
  const options: readonly ChoiceOption[] = rng.shuffle((['one', 'none', 'infinite'] as const).map((id) => ({ id, label: OPTION_LABELS[id] })))
  return {
    statement: `How many solutions does the following system have? $${systemLatex(a1, b1, c1, a2, b2, c2)}$`,
    answer: { kind: 'choice', options, correctId: correct },
    solution: steps,
    hints: HINTS_CLASSIFY,
  }
}

function tier2(rng: Rng): Problem {
  const a1 = rng.pick(COEF_POOL)
  const b1 = rng.pick(COEF_POOL)
  const [a2, b2] = pickUniqueRow(rng, a1, b1)
  const x0 = rng.intExcept(-8, 8, [0])
  const y0 = rng.intExcept(-8, 8, [0])
  const c1 = a1 * x0 + b1 * y0
  const c2 = a2 * x0 + b2 * y0
  const D = a1 * b2 - a2 * b1
  const Dx = c1 * b2 - c2 * b1
  const Dy = a1 * c2 - a2 * c1

  return {
    statement: `These two lines meet at exactly one point. Find it: $${systemLatex(a1, b1, c1, a2, b2, c2)}$`,
    answer: { kind: 'vector', components: [String(x0), String(y0)] },
    solution: [
      { text: 'Compute the determinant of the coefficients:', tex: `D = ${paren(a1)}\\cdot${paren(b2)} - ${paren(a2)}\\cdot${paren(b1)} = ${D}` },
      { text: 'Replace the $x$-column with the constants to get $D_x$:', tex: `D_x = ${paren(c1)}\\cdot${paren(b2)} - ${paren(c2)}\\cdot${paren(b1)} = ${Dx}` },
      { text: 'Replace the $y$-column with the constants to get $D_y$:', tex: `D_y = ${paren(a1)}\\cdot${paren(c2)} - ${paren(a2)}\\cdot${paren(c1)} = ${Dy}` },
      { text: 'Since $D \\neq 0$, the unique solution is $x = D_x/D$ and $y = D_y/D$:', tex: `x = \\dfrac{${Dx}}{${D}} = ${x0}, \\quad y = \\dfrac{${Dy}}{${D}} = ${y0}` },
    ],
    hints: HINTS_SOLVE,
    inputHint: INPUT_HINT_VECTOR,
  }
}

function tier3(rng: Rng): Problem {
  const a1 = rng.pick([1, 2, 3])
  const b1 = rng.intExcept(-4, 4, [0])
  const c1Prime = rng.intExcept(-4, 4, [0])
  const c1 = a1 * c1Prime
  const a2 = rng.intExcept(-5, 5, [0])
  const kase = rng.pick(['none', 'infinite'] as const)
  const c2 = kase === 'infinite' ? a2 * c1Prime : a2 * c1Prime + rng.pick([1, -1, 2, -2, 3])

  const k0 = rat(a2 * b1, a1)
  const k0Latex = ratToLatex(k0)
  const Dy = a1 * c2 - a2 * c1
  const eq2 = `${joinTerms([`${coefPrefix(a2)}x`, 'ky'])} = ${c2}`
  const outcome = kase === 'infinite' ? 'infinitely many solutions' : 'no solution'

  const finalStep: SolutionStep =
    kase === 'infinite'
      ? {
          text: `$D_y = 0$: the right-hand sides are proportional by the same factor as the coefficient rows, so at $k=${k0Latex}$ the second equation describes the very same line as the first, giving infinitely many solutions.`,
        }
      : {
          text: `$D_y \\neq 0$: the right-hand sides are not proportional the same way as the coefficient rows, so at $k=${k0Latex}$ the two equations describe parallel but distinct lines, giving no solution.`,
        }

  return {
    statement: `For which value of $k$ does the following system have ${outcome}? $\\begin{cases} ${eqLatex(a1, b1, c1)} \\\\ ${eq2} \\end{cases}$`,
    answer: { kind: 'number', value: k0Latex },
    solution: [
      {
        text: 'Write the determinant of the coefficients as a function of $k$ (the parameter sits in the $y$-column):',
        tex: `D(k) = ${paren(a1)}\\cdot k - ${paren(a2)}\\cdot${paren(b1)} = ${linear(a1, -(a2 * b1), 'k')}`,
      },
      {
        text: 'The system stops having a unique solution exactly when $D(k) = 0$. Solve for $k$:',
        tex: `${a1}k = ${a2 * b1} \\quad\\Rightarrow\\quad k = ${k0Latex}`,
      },
      {
        text: 'To tell the two degenerate outcomes apart, check $D_y = a_1c_2 - a_2c_1$: it does not involve $k$ at all, since $k$ only ever sits in the $y$-column:',
        tex: `D_y = ${paren(a1)}\\cdot${paren(c2)} - ${paren(a2)}\\cdot${paren(c1)} = ${Dy}`,
      },
      finalStep,
    ],
    hints: HINTS_PARAM,
    inputHint: INPUT_HINT_NUMBER_K,
  }
}

export const template: SkillTemplate = {
  skillId: 'linsys_geometry',
  theory,
  expectedSeconds: { 1: 40, 2: 90, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
