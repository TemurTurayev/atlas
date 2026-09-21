import { add, div, lcm, rat, ratToLatex, sub, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Fraction $\\frac{a}{b}$: $a$ is the numerator, $b$ is the denominator.',
  'Addition/subtraction: rewrite over a common denominator (the LCM of the denominators), then work with the numerators.',
  'Dividing by a fraction is the same as multiplying by its reciprocal: $\\dfrac{a}{b} \\div \\dfrac{c}{d} = \\dfrac{a}{b}\\cdot\\dfrac{d}{c}$.',
  'In a compound fraction, first simplify the numerator and the denominator separately, then divide them.',
  'Common mistakes: adding numerators and denominators directly without a common denominator; forgetting to flip the second fraction when dividing.',
].join('\n')

const HINTS_ADD = ['Find the common denominator (the LCM of the denominators).', 'Rewrite both fractions over the common denominator, add the numerators, and simplify the result.']
const HINTS_MIXED = ['First do the division — flip the second fraction and multiply.', 'Then rewrite both fractions over a common denominator and subtract.']
const HINTS_COMPOUND = ['First compute the sum in the numerator, rewriting it over a common denominator.', 'Divide the resulting fraction by the fraction in the denominator — multiply by its reciprocal.']
const INPUT_HINT = 'The answer is a fraction, e.g. 7/20, or a whole number'

function fracLatex(r: Rational): string {
  return r.n < 0 ? `-\\frac{${-r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`
}

function problem(equation: string, value: Rational, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: `Compute: $${equation}$`,
    answer: { kind: 'number', value: ratToLatex(value) },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const d = rng.intExcept(2, 9, [b])
  const a = rng.int(1, b - 1)
  const c = rng.int(1, d - 1)
  const fa = rat(a, b)
  const fc = rat(c, d)
  const value = add(fa, fc)
  const l = lcm(b, d)
  const na = a * (l / b)
  const nc = c * (l / d)
  const equation = `\\frac{${a}}{${b}} + \\frac{${c}}{${d}}`
  return problem(
    equation,
    value,
    [
      { text: `The common denominator is LCM$(${b},${d}) = ${l}$:`, tex: `\\frac{${a}}{${b}} = \\frac{${na}}{${l}}, \\quad \\frac{${c}}{${d}} = \\frac{${nc}}{${l}}` },
      { text: 'Add the numerators:', tex: `\\frac{${na}}{${l}} + \\frac{${nc}}{${l}} = \\frac{${na + nc}}{${l}}` },
      { text: 'Simplify if possible:', tex: `= ${ratToLatex(value)}` },
    ],
    HINTS_ADD,
  )
}

function tier2(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const a = rng.int(1, b - 1)
  const d = rng.int(2, 9)
  const c = rng.int(1, d - 1)
  const f = rng.int(2, 9)
  const e = rng.int(1, f - 1)
  const divPart = div(rat(c, d), rat(e, f))
  const value = sub(rat(a, b), divPart)
  const equation = `\\frac{${a}}{${b}} - \\frac{${c}}{${d}} \\div \\frac{${e}}{${f}}`
  return problem(
    equation,
    value,
    [
      { text: 'Dividing by a fraction is multiplying by its reciprocal:', tex: `\\frac{${c}}{${d}} \\div \\frac{${e}}{${f}} = \\frac{${c}}{${d}} \\cdot \\frac{${f}}{${e}} = ${fracLatex(divPart)}` },
      { text: 'Rewrite over a common denominator and subtract:', tex: `\\frac{${a}}{${b}} - ${fracLatex(divPart)} = ${ratToLatex(value)}` },
    ],
    HINTS_MIXED,
  )
}

function tier3(rng: Rng): Problem {
  const b = rng.int(2, 8)
  const a = rng.int(1, b - 1)
  const d = rng.intExcept(2, 8, [b])
  const c = rng.int(1, d - 1)
  const f = rng.int(2, 6)
  const e = rng.int(1, f - 1)
  const sum = add(rat(a, b), rat(c, d))
  const value = div(sum, rat(e, f))
  const equation = `\\dfrac{\\frac{${a}}{${b}} + \\frac{${c}}{${d}}}{\\frac{${e}}{${f}}}`
  return problem(
    equation,
    value,
    [
      { text: 'First add the fractions in the numerator:', tex: `\\frac{${a}}{${b}} + \\frac{${c}}{${d}} = ${fracLatex(sum)}` },
      { text: 'Dividing by a fraction is multiplying by its reciprocal:', tex: `${fracLatex(sum)} \\div \\frac{${e}}{${f}} = ${fracLatex(sum)} \\cdot \\frac{${f}}{${e}} = ${ratToLatex(value)}` },
    ],
    HINTS_COMPOUND,
  )
}

export const template: SkillTemplate = {
  skillId: 'fractions',
  theory,
  expectedSeconds: { 1: 40, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
