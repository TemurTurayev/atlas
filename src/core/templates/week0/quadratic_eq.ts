import { linear, paren } from '../../math/latex'
import { polyFromRoots, polyMul, polyToLatex, type Poly } from '../../math/poly'
import { gcd, rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Квадратное уравнение (quadratic equation): $ax^2 + bx + c = 0$.',
  'Дискриминант (discriminant): $D = b^2 - 4ac$.',
  '$D > 0$ — два корня $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$; $D = 0$ — один двойной корень $x = -\\frac{b}{2a}$; $D < 0$ — действительных корней нет.',
  'Если $c = 0$, вынеси $x$ за скобки. Уравнение $x^4 + px^2 + q = 0$ решай заменой $z = x^2$.',
  'Типичные ошибки: потерять минус в $-b$; делить на $2a$ только $\\sqrt{D}$.',
].join('\n')

const HINTS = ['Вычисли дискриминант $D = b^2 - 4ac$.', 'Подставь в формулу $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.']
const INPUT_HINT = 'Корни через запятую: 2, -3. Если корней нет — напиши none'

const coprimeTo = (rng: Rng, a: number): number =>
  rng.intExcept(-9, 9, Array.from({ length: 19 }, (_, i) => i - 9).filter((n) => gcd(n, a) !== 1))

/** Discriminant walk-through for integer a, b, c whose discriminant is a perfect square or negative. */
export function quadraticSteps(a: number, b: number, c: number): SolutionStep[] {
  const d = b * b - 4 * a * c
  const dStep: SolutionStep = { ru: 'Дискриминант:', tex: `D = ${paren(b)}^2 - 4 \\cdot ${paren(a)} \\cdot ${paren(c)} = ${d}` }
  if (d < 0) return [dStep, { ru: '$D < 0$, поэтому действительных корней нет.', tex: '\\emptyset' }]
  if (d === 0) {
    return [dStep, { ru: '$D = 0$ — один двойной корень:', tex: `x = \\frac{${-b}}{${2 * a}} = ${ratToLatex(rat(-b, 2 * a))}` }]
  }
  const s = Math.round(Math.sqrt(d))
  return [
    dStep,
    { ru: 'Два корня:', tex: `x_{1,2} = \\frac{${-b} \\pm ${s}}{${2 * a}}` },
    { ru: 'Итого:', tex: `x_1 = ${ratToLatex(rat(-b + s, 2 * a))}, \\quad x_2 = ${ratToLatex(rat(-b - s, 2 * a))}` },
  ]
}

function build(
  poly: Poly,
  values: readonly string[],
  solution: readonly SolutionStep[],
  alternative?: Problem['alternative'],
): Problem {
  const f = polyToLatex(poly)
  return {
    statement: { en: `Determine the real zeros of $f(x) = ${f}$.`, ru: `Найди действительные нули функции $f(x) = ${f}$.` },
    answer: { kind: 'numberSet', values },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
    ...(alternative ? { alternative } : {}),
  }
}

/** Vieta's formulas: for x² + bx + c the roots sum to −b and multiply to c. */
function vietaAlternative(poly: Poly, r1: number, r2: number): Problem['alternative'] {
  return {
    title: 'Другой способ — теорема Виета (подбор корней)',
    steps: [
      { ru: 'Для приведённого $x^2+bx+c$ сумма корней равна $-b$, а произведение равно $c$.' },
      { ru: `Ищем два числа с суммой $${r1 + r2}$ и произведением $${r1 * r2}$:`, tex: `x_1 = ${r1}, \\quad x_2 = ${r2}` },
      { ru: 'Проверка — раскроем скобки:', tex: `\\left(${linear(1, -r1)}\\right)\\left(${linear(1, -r2)}\\right) = ${polyToLatex(poly)}` },
    ],
  }
}

function tier1(rng: Rng): Problem {
  const r1 = rng.int(-7, 7)
  const r2 = rng.intExcept(-7, 7, [r1])
  const poly = polyFromRoots(1, [r1, r2])
  return build(poly, [String(r1), String(r2)], quadraticSteps(1, poly[1], poly[0]), vietaAlternative(poly, r1, r2))
}

function tier2(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.6) {
    const a = rng.int(2, 5)
    const r1 = rng.int(-5, 5)
    const m = coprimeTo(rng, a)
    const poly = polyMul([-r1, 1], [-m, a])
    return build(poly, [String(r1), ratToLatex(rat(m, a))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  if (roll < 0.8) {
    const k = rng.int(1, 3)
    const m = coprimeTo(rng, k)
    const poly = polyMul([-m, k], [-m, k])
    return build(poly, [ratToLatex(rat(m, k))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  const a = rng.int(1, 4)
  const b = rng.int(-6, 6)
  const c = Math.floor((b * b) / (4 * a)) + rng.int(1, 5)
  return build([c, b, a], [], quadraticSteps(a, b, c))
}

function biquadratic(rng: Rng): Problem {
  const [p, q] = rng.shuffle([1, 2, 3, 4]).slice(0, 2)
  const poly = [p * p * q * q, 0, -(p * p + q * q), 0, 1]
  return build(poly, [String(p), String(-p), String(q), String(-q)], [
    { ru: 'Замена $z = x^2$:', tex: `${polyToLatex([p * p * q * q, -(p * p + q * q), 1], 'z')} = 0` },
    { ru: 'Корни по $z$ (оба положительны):', tex: `z_1 = ${p * p}, \\quad z_2 = ${q * q}` },
    { ru: 'Обратная замена $x = \\pm\\sqrt{z}$:', tex: `x = \\pm ${p}, \\quad x = \\pm ${q}` },
  ])
}

function biquadraticOneBranch(rng: Rng): Problem {
  const p = rng.int(1, 4)
  const q = rng.int(1, 3)
  const poly = [-p * p * q * q, 0, q * q - p * p, 0, 1]
  return build(poly, [String(p), String(-p)], [
    { ru: 'Замена $z = x^2$:', tex: `${polyToLatex([-p * p * q * q, q * q - p * p, 1], 'z')} = 0` },
    { ru: 'Корни по $z$:', tex: `z_1 = ${p * p}, \\quad z_2 = ${-q * q}` },
    { ru: '$z_2 < 0$ не даёт действительных $x$; из $z_1$:', tex: `x = \\pm ${p}` },
  ])
}

function cubicWithZero(rng: Rng): Problem {
  const a = rng.pick([1, 2, -1])
  const r1 = rng.intExcept(-5, 5, [0])
  const r2 = rng.intExcept(-5, 5, [0, r1])
  const quad = polyFromRoots(a, [r1, r2])
  return build(polyMul(quad, [0, 1]), ['0', String(r1), String(r2)], [
    { ru: 'Вынесем $x$ за скобки:', tex: `x\\left(${polyToLatex(quad)}\\right) = 0` },
    { ru: 'Один корень $x = 0$; остальные — из квадратного уравнения:', tex: `${polyToLatex(quad)} = 0` },
    ...quadraticSteps(quad[2], quad[1], quad[0]),
  ])
}

function tier3(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.35) return biquadratic(rng)
  if (roll < 0.55) return biquadraticOneBranch(rng)
  return cubicWithZero(rng)
}

export const template: SkillTemplate = {
  skillId: 'quadratic_eq',
  theory,
  expectedSeconds: { 1: 60, 2: 120, 3: 200 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
