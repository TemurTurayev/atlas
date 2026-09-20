import { paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Теорема Пифагора (Pythagorean theorem): в прямоугольном треугольнике $a^2+b^2=c^2$, где $c$ — гипотенуза (hypotenuse), $a$ и $b$ — катеты (legs).',
  'Чтобы найти катет, если известна гипотенуза: $b=\\sqrt{c^2-a^2}$.',
  'В пространстве диагональ прямоугольного параллелепипеда: $d=\\sqrt{p^2+q^2+r^2}$.',
  'Расстояние между точками (distance) на плоскости: $d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$.',
  'Корень оставляй в упрощённом виде: $\\sqrt{50}=5\\sqrt{2}$.',
  'Типичная ошибка: перепутать местами гипотенузу и катет при вычитании квадратов.',
].join('\n')

const HINTS = [
  'Вспомни теорему Пифагора: $a^2+b^2=c^2$.',
  'Определи, что дано — гипотенуза или катет — и подставь в нужную формулу.',
  'Если под корнем не полный квадрат, вынеси наибольший квадратный множитель: $\\sqrt{50}=\\sqrt{25\\cdot2}=5\\sqrt{2}$.',
]
const INPUT_HINT = 'Иррациональный ответ пиши через корень, например 5\\sqrt{2}'

const TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
  [12, 35, 37],
]

function simplifySqrt(n: number): { readonly coef: number; readonly radicand: number } {
  let coef = 1
  let radicand = n
  for (let k = Math.floor(Math.sqrt(radicand)); k >= 2; k -= 1) {
    if (radicand % (k * k) === 0) {
      coef = k
      radicand = radicand / (k * k)
      break
    }
  }
  return { coef, radicand }
}

function sqrtLatex(n: number): string {
  const { coef, radicand } = simplifySqrt(n)
  if (radicand === 1) return String(coef)
  return coef === 1 ? `\\sqrt{${radicand}}` : `${coef}\\sqrt{${radicand}}`
}

function build(en: string, ru: string, value: string, solution: Problem['solution']): Problem {
  return { statement: { en, ru }, answer: { kind: 'number', value }, solution, hints: HINTS, inputHint: INPUT_HINT }
}

function tier1(rng: Rng): Problem {
  const [leg1, leg2, hyp] = rng.pick(TRIPLES)
  const k = rng.int(1, 2)
  const a = leg1 * k
  const b = leg2 * k
  const c = hyp * k
  return build(
    `A right triangle has legs $${a}$ and $${b}$. Find the length of the hypotenuse.`,
    `В прямоугольном треугольнике катеты равны $${a}$ и $${b}$. Найди гипотенузу.`,
    String(c),
    [
      { ru: 'По теореме Пифагора:', tex: `c^2 = ${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${a * a + b * b}` },
      { ru: 'Извлекаем корень:', tex: `c = \\sqrt{${a * a + b * b}} = ${c}` },
    ],
  )
}

function tier2(rng: Rng): Problem {
  let c = 0
  let a = 0
  let diff = 0
  for (let i = 0; i < 200; i += 1) {
    c = rng.int(7, 16)
    a = rng.int(2, c - 2)
    diff = c * c - a * a
    if (!Number.isInteger(Math.sqrt(diff))) break
  }
  const value = sqrtLatex(diff)
  return build(
    `A right triangle has hypotenuse $${c}$ and one leg $${a}$. Find the length of the other leg.`,
    `В прямоугольном треугольнике гипотенуза равна $${c}$, один катет равен $${a}$. Найди длину другого катета.`,
    value,
    [
      { ru: 'По теореме Пифагора:', tex: `b^2 = c^2 - a^2 = ${c}^2 - ${a}^2 = ${c * c} - ${a * a} = ${diff}` },
      { ru: 'Извлекаем корень:', tex: `b = \\sqrt{${diff}} = ${value}` },
    ],
  )
}

function boxDiagonal(rng: Rng): Problem {
  const p = rng.int(2, 9)
  const q = rng.int(2, 9)
  const r = rng.int(2, 9)
  const sq = p * p + q * q + r * r
  const value = sqrtLatex(sq)
  return build(
    `A rectangular box has edge lengths $${p}$, $${q}$ and $${r}$. Find the length of its space diagonal.`,
    `Прямоугольный параллелепипед имеет рёбра $${p}$, $${q}$ и $${r}$. Найди длину его диагонали.`,
    value,
    [
      { ru: 'Диагональ параллелепипеда:', tex: `d^2 = ${p}^2+${q}^2+${r}^2 = ${sq}` },
      { ru: 'Извлекаем корень:', tex: `d = \\sqrt{${sq}} = ${value}` },
    ],
  )
}

function pointDistance(rng: Rng): Problem {
  let x1 = 0
  let y1 = 0
  let x2 = 0
  let y2 = 0
  let sq = 0
  for (let i = 0; i < 200; i += 1) {
    x1 = rng.int(-6, 6)
    y1 = rng.int(-6, 6)
    x2 = rng.int(-6, 6)
    y2 = rng.int(-6, 6)
    sq = (x2 - x1) ** 2 + (y2 - y1) ** 2
    if (sq > 0) break
  }
  const value = sqrtLatex(sq)
  return build(
    `Find the distance between the points $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    `Найди расстояние между точками $(${x1}, ${y1})$ и $(${x2}, ${y2})$.`,
    value,
    [
      { ru: 'Формула расстояния между точками:', tex: `d^2 = (${x2}-${paren(x1)})^2+(${y2}-${paren(y1)})^2 = ${sq}` },
      { ru: 'Извлекаем корень:', tex: `d = \\sqrt{${sq}} = ${value}` },
    ],
  )
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? boxDiagonal(rng) : pointDistance(rng)
}

export const template: SkillTemplate = {
  skillId: 'pythagoras',
  theory,
  expectedSeconds: { 1: 40, 2: 90, 3: 160 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
