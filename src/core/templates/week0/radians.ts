import { rat } from '../../math/rational'
import type { Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Радиан (radian) — угол, которому соответствует дуга длиной, равной радиусу. Полный круг: $360^\\circ=2\\pi$ рад.',
  'Перевод градусов в радианы: $\\text{рад}=\\text{град}\\cdot\\frac{\\pi}{180}$. Обратный перевод: $\\text{град}=\\text{рад}\\cdot\\frac{180}{\\pi}$.',
  'Длина дуги (arc length): $s=r\\theta$. Площадь сектора (sector area): $S=\\frac{1}{2}r^2\\theta$, где $\\theta$ — в радианах.',
  'Пока не сказано округлить — оставляй $\\pi$ в точном виде, не заменяй на 3.14.',
  'Типичная ошибка: подставить угол в градусах в формулы $s=r\\theta$ или $S=\\frac{1}{2}r^2\\theta$ без перевода в радианы.',
].join('\n')

const NICE_DEGREES: readonly number[] = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]

function piFractionLatex(frac: Rational): string {
  const { n: p, d: q } = frac
  if (p === 0) return '0'
  if (q === 1) return p === 1 ? '\\pi' : `${p}\\pi`
  return p === 1 ? `\\frac{\\pi}{${q}}` : `\\frac{${p}\\pi}{${q}}`
}

const HINTS_DEG_TO_RAD = [
  'Используй формулу: рад $=$ град $\\cdot\\frac{\\pi}{180}$.',
  'Сократи дробь $\\frac{\\text{град}}{180}$ до несократимого вида, потом припиши $\\pi$.',
]
const HINTS_RAD_TO_DEG = [
  'Используй формулу: град $=$ рад $\\cdot\\frac{180}{\\pi}$.',
  'Раздели коэффициент при $\\pi$ на $\\pi$, затем умножь результат на 180.',
]

function tier1(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const value = piFractionLatex(theta)
  return {
    statement: `Convert $${deg}^\\circ$ to radians. Leave $\\pi$ exact.`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'Умножаем на $\\frac{\\pi}{180}$:', tex: `${deg}^\\circ = ${deg}\\cdot\\frac{\\pi}{180} = \\frac{${deg}\\pi}{180}` },
      { text: 'Сокращаем дробь:', tex: `\\frac{${deg}\\pi}{180} = ${value}` },
    ],
    hints: HINTS_DEG_TO_RAD,
    inputHint: 'Ответ с π, например 3\\pi/4',
  }
}

function tier2(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const rad = piFractionLatex(theta)
  return {
    statement: `Convert $${rad}$ radians to degrees.`,
    answer: { kind: 'number', value: String(deg) },
    solution: [{ text: 'Умножаем на $\\frac{180}{\\pi}$:', tex: `${rad}\\cdot\\frac{180}{\\pi} = ${deg}^\\circ` }],
    hints: HINTS_RAD_TO_DEG,
    inputHint: 'Ответ в градусах, например 150',
  }
}

function tier3(rng: Rng): Problem {
  const deg = rng.pick(NICE_DEGREES)
  const theta = rat(deg, 180)
  const thetaLatex = piFractionLatex(theta)
  const r = rng.int(2, 9)
  if (rng.chance(0.5)) {
    const arc = rat(r * theta.n, theta.d)
    const value = piFractionLatex(arc)
    return {
      statement: `A sector has radius $${r}$ and central angle $${thetaLatex}$ rad. Find the arc length. Leave $\\pi$ exact.`,
      answer: { kind: 'number', value },
      solution: [{ text: 'Длина дуги:', tex: `s = r\\theta = ${r}\\cdot ${thetaLatex} = ${value}` }],
      hints: ['Формула длины дуги: $s=r\\theta$, угол — в радианах.', 'Умножь радиус на угол, не переводя $\\pi$ в десятичную дробь.'],
      inputHint: 'Ответ с π, например 3\\pi',
    }
  }
  const area = rat(r * r * theta.n, 2 * theta.d)
  const value = piFractionLatex(area)
  return {
    statement: `A sector has radius $${r}$ and central angle $${thetaLatex}$ rad. Find the area of the sector. Leave $\\pi$ exact.`,
    answer: { kind: 'number', value },
    solution: [{ text: 'Площадь сектора:', tex: `S = \\frac{1}{2}r^2\\theta = \\frac{1}{2}\\cdot ${r}^2\\cdot ${thetaLatex} = ${value}` }],
    hints: ['Формула площади сектора: $S=\\frac{1}{2}r^2\\theta$, угол — в радианах.', 'Сначала возведи радиус в квадрат, потом умножь на угол и на $\\frac{1}{2}$.'],
    inputHint: 'Ответ с π, например 6\\pi',
  }
}

export const template: SkillTemplate = {
  skillId: 'radians',
  theory,
  expectedSeconds: { 1: 35, 2: 55, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
