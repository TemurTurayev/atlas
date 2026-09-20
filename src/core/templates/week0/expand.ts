import { coefPrefix, linear, paren } from '../../math/latex'
import { polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Раскрытие скобок (expanding) — умножить каждое слагаемое в скобке.',
  'Формулы сокращённого умножения: $(a+b)^2=a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, $(a-b)(a+b)=a^2-b^2$.',
  'Для произведения многочленов умножь каждое слагаемое одного на каждое слагаемое другого и приведи подобные.',
  'Типичные ошибки: забыть удвоенное произведение $2ab$; не умножить минус перед скобкой на все слагаемые.',
].join('\n')

const HINTS = [
  'Умножь каждое слагаемое в скобке по отдельности.',
  'Для квадрата суммы/разности используй формулу $(a\\pm b)^2=a^2\\pm2ab+b^2$.',
]
const INPUT_HINT = 'Раскрой скобки и приведи подобные слагаемые'

function build(statement: string, poly: Poly, solution: readonly SolutionStep[], variable = 'x'): Problem {
  return {
    statement: { en: `Expand: $${statement}$`, ru: `Раскрой скобки: $${statement}$` },
    answer: { kind: 'expression', value: polyToLatex(poly, variable), variables: [variable], form: 'expanded' },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.intExcept(-9, 9, [0, 1, -1])
  const b = rng.intExcept(-9, 9, [0])
  const poly: Poly = [a * b, a]
  const statement = `${coefPrefix(a)}\\left(${linear(1, b)}\\right)`
  return build(statement, poly, [
    { ru: `Умножим $${a}$ на каждое слагаемое в скобке:`, tex: `${a}\\cdot x ${b >= 0 ? '+' : '-'} ${a}\\cdot ${Math.abs(b)}` },
    { ru: 'Итог:', tex: polyToLatex(poly) },
  ])
}

function squareBranch(rng: Rng): Problem {
  const p = rng.int(2, 5)
  const q = rng.intExcept(-9, 9, [0])
  const lin: Poly = [q, p]
  const poly = polyMul(lin, lin)
  const statement = `\\left(${linear(p, q)}\\right)^{2}`
  const mid = 2 * p * q
  return build(statement, poly, [
    { ru: 'Формула квадрата суммы/разности:', tex: '(u+v)^2=u^2+2uv+v^2' },
    {
      ru: `Здесь $u=${p}x$, $v=${paren(q)}$:`,
      tex: `(${p}x)^{2} ${mid >= 0 ? '+' : '-'} 2\\cdot ${p}x\\cdot ${paren(q)} + ${paren(q)}^{2}`,
    },
    { ru: 'Итог:', tex: polyToLatex(poly) },
  ])
}

function diffSquaresBranch(rng: Rng): Problem {
  const b = rng.int(2, 9)
  const poly: Poly = [-(b * b), 0, 1]
  const statement = `\\left(${linear(1, -b)}\\right)\\left(${linear(1, b)}\\right)`
  return build(statement, poly, [
    { ru: 'Разность квадратов:', tex: 'a^2-b^2=(a-b)(a+b)' },
    { ru: 'Итог:', tex: polyToLatex(poly) },
  ])
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? squareBranch(rng) : diffSquaresBranch(rng)
}

function cubicBranch(rng: Rng): Problem {
  const d = rng.intExcept(-6, 6, [0])
  const p = rng.pick([1, 2, 3])
  const q = rng.intExcept(-6, 6, [0])
  const r = rng.intExcept(-6, 6, [0])
  const quad: Poly = [r, q, p]
  const poly = polyMul([d, 1], quad)
  const statement = `\\left(${linear(1, d)}\\right)\\left(${polyToLatex(quad)}\\right)`
  return build(statement, poly, [
    { ru: 'Умножим каждое слагаемое первой скобки на весь трёхчлен:' },
    {
      ru: 'Раскрываем:',
      tex: `x\\cdot\\left(${polyToLatex(quad)}\\right) ${d >= 0 ? '+' : '-'} ${Math.abs(d)}\\cdot\\left(${polyToLatex(quad)}\\right)`,
    },
    { ru: 'Приводим подобные слагаемые:', tex: polyToLatex(poly) },
  ])
}

function diffOfSquaresIdentityBranch(rng: Rng): Problem {
  const p = rng.int(1, 5)
  const q = rng.int(1, 5)
  const termA = `${coefPrefix(p)}a`
  const termB = `${coefPrefix(q)}b`
  const statement = `\\left(${termA}+${termB}\\right)^{2}-\\left(${termA}-${termB}\\right)^{2}`
  const coef = 4 * p * q
  const answer = `${coef}ab`
  return {
    statement: { en: `Expand and simplify: $${statement}$`, ru: `Раскрой скобки и упрости: $${statement}$` },
    answer: { kind: 'expression', value: answer, variables: ['a', 'b'], form: 'expanded' },
    solution: [
      { ru: 'Общая формула:', tex: '(u+v)^2-(u-v)^2=4uv' },
      { ru: `Здесь $u=${termA}$, $v=${termB}$, поэтому ответ:`, tex: answer },
    ],
    hints: ['Раскрой оба квадрата по формулам сокращённого умножения.', '$u^2$ и $v^2$ сократятся при вычитании — останется только $4uv$.'],
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? cubicBranch(rng) : diffOfSquaresIdentityBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'expand',
  theory,
  expectedSeconds: { 1: 40, 2: 80, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
