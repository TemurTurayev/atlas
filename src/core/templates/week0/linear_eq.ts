import { coefPrefix, joinTerms, linear } from '../../math/latex'
import { lcm, rat, ratToLatex, sub } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Линейное уравнение (linear equation) — уравнение вида $ax + b = c$. Цель — оставить $x$ одного.',
  '1. Раскрой скобки и приведи подобные слагаемые.',
  '2. Слагаемые с $x$ перенеси влево, числа — вправо; при переносе знак меняется.',
  '3. Раздели обе части на коэффициент при $x$.',
  'Типичные ошибки: не сменить знак при переносе; умножить минус перед скобкой только на первое слагаемое.',
].join('\n')

const HINTS = [
  'Сначала раскрой скобки и собери всё, что с $x$, в одной части.',
  'Числа перенеси в другую часть (со сменой знака), потом раздели на коэффициент при $x$.',
]

const INPUT_HINT = 'Введи число. Дробь набирается через /'

function problem(equation: string, x: number, solution: Problem['solution']): Problem {
  return {
    statement: `Solve for $x$: $${equation}$`,
    answer: { kind: 'number', value: String(x) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const a = rng.int(2, 9)
  const x = rng.int(-9, 9)
  const b = rng.intExcept(-15, 15, [0])
  const c = a * x + b
  return problem(`${linear(a, b)} = ${c}`, x, [
    { text: 'Перенесём свободный член вправо, сменив знак:', tex: `${a}x = ${c} ${b > 0 ? '-' : '+'} ${Math.abs(b)} = ${c - b}` },
    { text: `Разделим обе части на $${a}$:`, tex: `x = \\frac{${c - b}}{${a}} = ${x}` },
  ])
}

function tier2(rng: Rng): Problem {
  const a = rng.pick([2, 3, 4, 5, -2, -3])
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-9, 9, [0])
  const r = rng.intExcept(-5, 5, [0, a])
  const x = rng.int(-6, 6)
  const s = a * (x + p) + q - r * x
  const lhs = joinTerms([`${coefPrefix(a)}\\left(${linear(1, p)}\\right)`, String(q)])
  const rhs = linear(r, s)
  const k = a - r
  const constant = s - a * p - q
  return problem(`${lhs} = ${rhs}`, x, [
    { text: 'Раскроем скобки:', tex: `${linear(a, a * p + q)} = ${rhs}` },
    { text: 'Слагаемые с $x$ — влево, числа — вправо:', tex: `${linear(k, 0)} = ${constant}` },
    { text: 'Разделим на коэффициент при $x$:', tex: Math.abs(k) === 1 ? `x = ${x}` : `x = \\frac{${constant}}{${k}} = ${x}` },
  ])
}

function tier3(rng: Rng): Problem {
  const [m, n] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2)
  const x = rng.int(-8, 8)
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0])
  const k = sub(rat(x + p, m), rat(x - q, n))
  const multiple = lcm(m, n)
  const cm = multiple / m
  const cn = multiple / n
  const right = (k.n * multiple) / k.d
  const coefX = cm - cn
  const constant = cm * p + cn * q
  const equation = `\\frac{${linear(1, p)}}{${m}} - \\frac{${linear(1, -q)}}{${n}} = ${ratToLatex(k)}`
  return problem(equation, x, [
    {
      text: `Умножим обе части на общий знаменатель $${multiple}$:`,
      tex: `${coefPrefix(cm)}\\left(${linear(1, p)}\\right) - ${coefPrefix(cn)}\\left(${linear(1, -q)}\\right) = ${right}`,
    },
    { text: 'Раскроем скобки — минус перед второй скобкой меняет оба знака:', tex: `${linear(coefX, constant)} = ${right}` },
    { text: 'Перенесём число и разделим:', tex: `${linear(coefX, 0)} = ${right - constant} \\Rightarrow x = ${x}` },
  ])
}

export const template: SkillTemplate = {
  skillId: 'linear_eq',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 180 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
