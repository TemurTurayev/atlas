import { coefPrefix, linear, paren } from '../../math/latex'
import { polyToLatex } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate, SolutionStep } from '../types'

const theory = [
  'The average rate of change of $f$ between $x=a$ and $x=b$ is the slope of the secant line through the two points: $\\dfrac{f(b)-f(a)}{b-a}$.',
  'The derivative $f\'(a)$ is what that secant slope approaches as $b$ slides in towards $a$ — formally, $f\'(a) = \\displaystyle\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}$.',
  'To evaluate that limit, expand $f(a+h)-f(a)$, factor out an $h$, and cancel it — only then let $h\\to0$; substituting $h=0$ before cancelling gives $\\frac{0}{0}$.',
  '$f\'(a)$ is also the slope of the tangent line at $x=a$; once you know the slope and one point $(a,f(a))$, the line $y=mx+c$ is one substitution away.',
  'Common mistakes: plugging $h=0$ into the difference quotient before cancelling it out of the denominator; mixing up the secant slope (between two points) with the derivative (a single point).',
].join('\n')

const HINTS_SECANT = [
  'The slope of a secant line through two points on a graph is the change in the output divided by the change in the input, exactly like the slope of any line through two points.',
  'Compute $f$ at both $x$-values first, then divide the difference of the outputs by the difference of the inputs.',
]
const HINTS_DIFF_QUOTIENT = [
  'Write out $f(a+h)$ with the point substituted, then subtract $f(a)$ — every term without an $h$ will cancel.',
  'Factor $h$ out of what remains and cancel it; only after that should you let $h\\to0$ (the surviving $h$ terms vanish).',
]
const HINTS_TANGENT = [
  'The slope of the tangent line at a point is just the derivative there, found the same way as the limit of the difference quotient.',
  'Once you have the slope $m$ and a point on the curve $(a, f(a))$, substitute into $y=mx+c$ and solve for the intercept $c$.',
]
const HINTS_RECIPROCAL = [
  'Write $f(a+h)-f(a)$ as a difference of two fractions, then combine them over a common denominator before doing anything else.',
  'Once combined, the numerator has a common factor of $h$ that cancels with the $h$ in the denominator — only then let $h\\to0$.',
]

const INPUT_HINT_NUMBER = 'A single number; it may be negative'
const INPUT_HINT_TANGENT = 'Two numbers: the slope first, then the intercept'

/** p*x^2 + q*x + r, as ascending coefficients for polyToLatex. */
const quadLatex = (p: number, q: number, r: number): string => polyToLatex([r, q, p])
/** p*x^3 + q*x^2 + r*x + s, as ascending coefficients for polyToLatex. */
const cubicLatex = (p: number, q: number, r: number, s: number): string => polyToLatex([s, r, q, p])

function tier1(rng: Rng): Problem {
  const p = rng.intExcept(-3, 3, [0])
  const q = rng.int(-4, 4)
  const r = rng.int(-5, 5)
  const x1 = rng.int(-4, 4)
  const x2 = rng.intExcept(-4, 4, [x1])
  const [xa, xb] = x1 < x2 ? [x1, x2] : [x2, x1]
  const f = (x: number): number => p * x * x + q * x + r
  const fa = f(xa)
  const fb = f(xb)
  const slope = p * (xa + xb) + q

  return {
    statement: `A function is defined by $f(x) = ${quadLatex(p, q, r)}$. Find the slope of the secant line through the points on its graph where $x=${xa}$ and $x=${xb}$ — that is, the average rate of change of $f$ on $[${xa}, ${xb}]$.`,
    answer: { kind: 'number', value: String(slope) },
    solution: [
      { text: 'Evaluate the function at both endpoints:', tex: `f(${xa}) = ${fa}, \\qquad f(${xb}) = ${fb}` },
      {
        text: 'The slope of the secant line is the change in output divided by the change in input:',
        tex: `\\frac{f(${xb})-f(${xa})}{${xb}-${xa}} = \\frac{${fb} - ${paren(fa)}}{${xb} - ${paren(xa)}} = ${slope}`,
      },
    ],
    hints: HINTS_SECANT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier2Quadratic(rng: Rng): Problem {
  const p = rng.intExcept(-3, 3, [0])
  const q = rng.int(-5, 5)
  const r = rng.int(-5, 5)
  const a = rng.int(-4, 4)
  const fLatex = quadLatex(p, q, r)
  const fprime = 2 * p * a + q
  const quotientLatex = polyToLatex([fprime, p], 'h')

  return {
    statement: `Let $f(x) = ${fLatex}$. Use the limit definition $f'(${a}) = \\displaystyle\\lim_{h\\to0}\\frac{f(${a}+h)-f(${a})}{h}$ to find $f'(${a})$.`,
    answer: { kind: 'number', value: String(fprime) },
    solution: [
      { text: 'Write the difference quotient with the point substituted:', tex: `\\frac{f(${a}+h)-f(${a})}{h}` },
      {
        text: `Expand $f(${a}+h)$ and subtract $f(${a})$ — every term without an $h$ cancels, leaving a common factor of $h$:`,
        tex: `f(${a}+h)-f(${a}) = h\\left(${quotientLatex}\\right)`,
      },
      { text: 'Divide by $h$ (cancel it, since $h\\neq0$):', tex: `\\frac{f(${a}+h)-f(${a})}{h} = ${quotientLatex}` },
      { text: `Now let $h\\to0$: every remaining term containing $h$ vanishes, leaving $f'(${a})$:`, tex: `f'(${a}) = ${fprime}` },
    ],
    hints: HINTS_DIFF_QUOTIENT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier2Cubic(rng: Rng): Problem {
  const p = rng.intExcept(-2, 2, [0])
  const q = rng.int(-4, 4)
  const r = rng.int(-4, 4)
  const s = rng.int(-4, 4)
  const a = rng.int(-3, 3)
  const fLatex = cubicLatex(p, q, r, s)
  const fprime = 3 * p * a * a + 2 * q * a + r
  const quotientLatex = polyToLatex([fprime, 3 * p * a + q, p], 'h')

  return {
    statement: `Let $f(x) = ${fLatex}$. Use the limit definition $f'(${a}) = \\displaystyle\\lim_{h\\to0}\\frac{f(${a}+h)-f(${a})}{h}$ to find $f'(${a})$.`,
    answer: { kind: 'number', value: String(fprime) },
    solution: [
      { text: 'Write the difference quotient with the point substituted:', tex: `\\frac{f(${a}+h)-f(${a})}{h}` },
      {
        text: `Expand $f(${a}+h)$ and subtract $f(${a})$ — every term without an $h$ cancels, leaving a common factor of $h$:`,
        tex: `f(${a}+h)-f(${a}) = h\\left(${quotientLatex}\\right)`,
      },
      { text: 'Divide by $h$ (cancel it, since $h\\neq0$):', tex: `\\frac{f(${a}+h)-f(${a})}{h} = ${quotientLatex}` },
      { text: `Now let $h\\to0$: every remaining term containing $h$ vanishes, leaving $f'(${a})$:`, tex: `f'(${a}) = ${fprime}` },
    ],
    hints: HINTS_DIFF_QUOTIENT,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? tier2Quadratic(rng) : tier2Cubic(rng)
}

function tier3Tangent(rng: Rng): Problem {
  const p = rng.intExcept(-3, 3, [0])
  const q = rng.int(-5, 5)
  const r = rng.int(-5, 5)
  const a = rng.int(-4, 4)
  const fLatex = quadLatex(p, q, r)
  const m = 2 * p * a + q
  const fa = p * a * a + q * a + r
  const c = r - p * a * a

  return {
    statement: `Let $f(x) = ${fLatex}$. Find the tangent line to the graph of $f$ at $x=${a}$, written as $y=mx+c$. Give your answer as $(m,c)$.`,
    answer: { kind: 'vector', components: [String(m), String(c)] },
    solution: [
      {
        text: `The slope of the tangent line at $x=${a}$ is the derivative there, $f'(x)=2px+q$ evaluated at the point:`,
        tex: `f'(${a}) = 2\\cdot${paren(p)}\\cdot${paren(a)} + ${paren(q)} = ${m}`,
      },
      { text: `Evaluate $f$ at the same point to get the $y$-coordinate of the tangent point:`, tex: `f(${a}) = ${fa}` },
      {
        text: `The line has this slope and passes through $(${a}, ${fa})$; substitute into $y=mx+c$ and solve for $c$:`,
        tex: `${fa} = ${m}\\cdot${paren(a)} + c \\quad\\Longrightarrow\\quad c = ${c}`,
      },
      { text: `So the tangent line is $y = ${linear(m, c)}$: $m=${m}$, $c=${c}$.` },
    ],
    hints: HINTS_TANGENT,
    inputHint: INPUT_HINT_TANGENT,
  }
}

function tier3Reciprocal(rng: Rng): Problem {
  const a = rng.pick([-3, -2, -1, 1, 2, 3])
  const val = rng.intExcept(-5, 5, [0])
  const c = -val * a * a
  const fLatex = c < 0 ? `-\\frac{${-c}}{x}` : `\\frac{${c}}{x}`
  const aStr = paren(a)
  const numeratorAfterExpand = `${coefPrefix(-c)}h`

  const steps: SolutionStep[] = [
    {
      text: 'Write the difference quotient with the point substituted:',
      tex: `\\frac{f(${a}+h)-f(${a})}{h} = \\frac{\\dfrac{${c}}{${a}+h}-\\dfrac{${c}}{${a}}}{h}`,
    },
    {
      text: `Combine the two fractions over the common denominator $${aStr}\\left(${a}+h\\right)$:`,
      tex: `\\frac{${c}}{${a}+h}-\\frac{${c}}{${a}} = \\frac{${c}\\cdot${aStr} - ${paren(c)}\\left(${a}+h\\right)}{${aStr}\\left(${a}+h\\right)}`,
    },
    {
      text: 'Expand the numerator — the constant terms cancel, leaving a single term in $h$:',
      tex: `${c}\\cdot${aStr} - ${paren(c)}\\left(${a}+h\\right) = ${numeratorAfterExpand}`,
    },
    {
      text: 'Divide by $h$ (cancel it, since $h\\neq0$):',
      tex: `\\frac{f(${a}+h)-f(${a})}{h} = \\frac{${coefPrefix(-c)}}{${aStr}\\left(${a}+h\\right)}`,
    },
    {
      text: 'Now let $h\\to0$:',
      tex: `f'(${a}) = \\frac{${coefPrefix(-c)}}{${aStr}\\cdot${aStr}} = \\frac{${-c}}{${a * a}} = ${val}`,
    },
  ]

  return {
    statement: `Let $f(x) = ${fLatex}$. Use the limit definition of the derivative to find $f'(${a})$.`,
    answer: { kind: 'number', value: String(val) },
    solution: steps,
    hints: HINTS_RECIPROCAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? tier3Tangent(rng) : tier3Reciprocal(rng)
}

export const template: SkillTemplate = {
  skillId: 'derivative_def',
  theory,
  expectedSeconds: { 1: 55, 2: 100, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
