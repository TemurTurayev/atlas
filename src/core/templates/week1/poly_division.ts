import { degree, polyAdd, polyMul, polyScale, polyToLatex, trim, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Деление многочленов столбиком (polynomial long division) — как деление чисел столбиком, только с одночленами.',
  'На каждом шаге: дели старший член остатка на старший член делителя, умножай результат на весь делитель и вычитай из остатка.',
  'Останавливаемся, когда степень остатка меньше степени делителя: $P(x) = D(x)\\cdot Q(x) + R(x)$, $\\deg R < \\deg D$.',
  'Если $R(x) = 0$ — деление нацело (exact division), $Q(x)$ и есть искомое частное.',
  'Если $R(x) \\ne 0$, дробь раскладывается как $\\frac{P(x)}{D(x)} = Q(x) + \\frac{R(x)}{D(x)}$, где $Q(x)$ — многочленная часть (polynomial part).',
  'Типичные ошибки: забыть знак при вычитании; пропустить одночлен с нулевым коэффициентом.',
].join('\n')

const HINTS = [
  'Раздели старший член делимого на старший член делителя — это первый член частного.',
  'Умножь этот член на весь делитель и вычти результат из делимого; повтори для нового остатка.',
  'Останови деление, как только степень остатка станет меньше степени делителя.',
]
const INPUT_HINT_EXACT = 'Введи частное как многочлен, например x+2 или x^2-3x+1'
const INPUT_HINT_PART = 'Введи только многочленную часть S(x), без остатка, например x+2'

interface DivisionResult {
  readonly quotient: Poly
  readonly remainder: Poly
  readonly steps: readonly SolutionStep[]
}

function monomial(coef: number, shift: number): Poly {
  const arr = new Array(shift + 1).fill(0)
  arr[shift] = coef
  return arr
}

const isZeroPoly = (p: Poly): boolean => p.length === 1 && p[0] === 0

/** Long division P(x) = D(x)*Q(x) + R(x), recording the walk-through as it goes. */
function longDivide(dividend: Poly, divisor: Poly): DivisionResult {
  const dvsr = trim(divisor)
  const divDeg = degree(dvsr)
  const lead = dvsr[divDeg]
  let rem = trim(dividend)
  const quotDeg = Math.max(degree(rem) - divDeg, 0)
  const quotient = new Array(quotDeg + 1).fill(0)
  const steps: SolutionStep[] = []
  while (degree(rem) >= divDeg && !isZeroPoly(rem)) {
    const remDeg = degree(rem)
    const shift = remDeg - divDeg
    const coef = rem[remDeg] / lead
    quotient[shift] = coef
    const term = monomial(coef, shift)
    const subtractPoly = polyMul(term, dvsr)
    const next = trim(polyAdd(rem, polyScale(subtractPoly, -1)))
    steps.push({
      ru: `Делим старшие члены: $${polyToLatex(monomial(rem[remDeg], remDeg))} \\div ${polyToLatex(monomial(lead, divDeg))} = ${polyToLatex(term)}$. Умножаем на делитель и вычитаем:`,
      tex: `${polyToLatex(rem)} - ${polyToLatex(term)}\\left(${polyToLatex(dvsr)}\\right) = ${polyToLatex(next)}`,
    })
    rem = next
  }
  return { quotient: trim(quotient), remainder: rem, steps }
}

function build(dividend: Poly, divisor: Poly): Problem {
  const result = longDivide(dividend, divisor)
  const p = polyToLatex(dividend)
  const d = polyToLatex(divisor)
  const quotientLatex = polyToLatex(result.quotient)
  const exact = isZeroPoly(result.remainder)
  const statement = exact
    ? {
        en: `Divide $${p}$ by $${d}$ and give the quotient.`,
        ru: `Раздели $${p}$ на $${d}$ и найди частное.`,
      }
    : {
        en: `Divide $${p}$ by $${d}$. Write $\\frac{${p}}{${d}} = S(x) + \\frac{R(x)}{${d}}$ and give the polynomial part $S(x)$.`,
        ru: `Раздели $${p}$ на $${d}$. Запиши $\\frac{${p}}{${d}} = S(x) + \\frac{R(x)}{${d}}$ и найди многочленную часть $S(x)$.`,
      }
  const finalStep: SolutionStep = exact
    ? { ru: 'Остаток равен нулю — деление выполняется нацело. Частное:', tex: `Q(x) = ${quotientLatex}` }
    : {
        ru: 'Степень остатка меньше степени делителя — дальше делить нельзя. Многочленная часть:',
        tex: `\\frac{${p}}{${d}} = \\underbrace{${quotientLatex}}_{S(x)} + \\frac{${polyToLatex(result.remainder)}}{${d}}`,
      }
  return {
    statement,
    answer: { kind: 'expression', value: quotientLatex, variables: ['x'] },
    solution: [{ ru: 'Делим столбиком, начиная со старших членов:' }, ...result.steps, finalStep],
    hints: HINTS,
    inputHint: exact ? INPUT_HINT_EXACT : INPUT_HINT_PART,
  }
}

/** Quadratic (deg 2) dividend, exact division by a monic linear divisor: linear quotient. */
function tier1(rng: Rng): Problem {
  const r = rng.intExcept(-6, 6, [0])
  const s = rng.intExcept(-6, 6, [0])
  const quotient: Poly = [s, 1]
  const divisor: Poly = [-r, 1]
  return build(polyMul(quotient, divisor), divisor)
}

/** Cubic (deg 3) dividend, exact division by a monic linear divisor: quadratic quotient. */
function tier2(rng: Rng): Problem {
  const r = rng.intExcept(-5, 5, [0])
  const p = rng.int(-5, 5)
  const q = rng.intExcept(-5, 5, [0])
  const quotient: Poly = [q, p, 1]
  const divisor: Poly = [-r, 1]
  return build(polyMul(quotient, divisor), divisor)
}

/** Cubic dividend divided by a monic quadratic divisor: linear quotient plus a nonzero constant remainder. */
function tier3(rng: Rng): Problem {
  const k = rng.int(1, 4)
  const b = rng.intExcept(-5, 5, [0])
  const c = rng.intExcept(-5, 5, [0])
  const quotient: Poly = [b, 1]
  const divisor: Poly = [k, 0, 1]
  const dividend = polyAdd(polyMul(quotient, divisor), [c])
  return build(dividend, divisor)
}

export const template: SkillTemplate = {
  skillId: 'poly_division',
  theory,
  expectedSeconds: { 1: 60, 2: 120, 3: 190 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
