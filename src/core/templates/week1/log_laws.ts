import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Свойства логарифмов (log laws): $\\log_b(xy)=\\log_b x+\\log_b y$; $\\log_b\\frac{x}{y}=\\log_b x-\\log_b y$; $\\log_b(x^{k})=k\\log_b x$.',
  'Логарифм $\\log_b N$ отвечает на вопрос: в какую степень нужно возвести основание $b$, чтобы получить $N$. Запись $\\log$ без индекса обычно означает основание $10$; $\\ln$ — натуральный логарифм, основание $e$.',
  'Смена основания (change of base): $\\log_b N=\\dfrac{\\ln N}{\\ln b}$.',
  'Логарифм определён только для положительных чисел под знаком — учитывай область допустимых значений (ОДЗ).',
  'Типичная ошибка: путать $\\log(x+y)$ с $\\log x+\\log y$ — складывать можно только сами логарифмы, а не их аргументы под знаком суммы.',
].join('\n')

type Base = 2 | 3 | 5 | 10 | 'e'

function logLatex(base: Base, argument: string): string {
  if (base === 'e') return `\\ln\\left(${argument}\\right)`
  if (base === 10) return `\\log\\left(${argument}\\right)`
  return `\\log_{${base}}\\left(${argument}\\right)`
}

const varPow = (v: string, e: number): string => (e === 1 ? v : `${v}^{${e}}`)

function tier1(rng: Rng): Problem {
  const b = rng.pick([2, 3, 5, 10] as const)
  const m = rng.int(2, 5)
  const N = b ** m
  const expr = logLatex(b, String(N))
  return {
    statement: { en: `Compute: $${expr}$`, ru: `Вычисли: $${expr}$` },
    answer: { kind: 'number', value: String(m) },
    solution: [
      { ru: 'Подбираем показатель степени:', tex: `${b}^{${m}} = ${N}` },
      { ru: 'Значит:', tex: `${expr} = ${m}` },
    ],
    hints: [
      'Логарифм $\\log_b N$ — это показатель степени, в которую нужно возвести $b$, чтобы получить $N$.',
      'Перебирай степени основания, пока не получишь число под логарифмом.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const base = rng.pick<Base>([2, 3, 'e'])
  const p = rng.int(2, 4)
  const q = rng.int(2, 4)
  const term1 = `${varPow('a', p)}${varPow('b', q)}`
  const term2 = 'ab'
  const resultTerm = `${varPow('a', p - 1)}${varPow('b', q - 1)}`
  const first = logLatex(base, term1)
  const second = logLatex(base, term2)
  const ratioExpr = logLatex(base, `\\frac{${term1}}{${term2}}`)
  const answerValue = logLatex(base, resultTerm)
  return {
    statement: {
      en: `Combine into a single logarithm and simplify: $${first} - ${second}$.`,
      ru: `Объедини в один логарифм и упрости: $${first} - ${second}$.`,
    },
    answer: { kind: 'expression', value: answerValue, variables: ['a', 'b'], domain: { a: [1.5, 4], b: [1.5, 4] } },
    solution: [
      { ru: 'Разность логарифмов одного основания — это логарифм частного:', tex: `${first} - ${second} = ${ratioExpr}` },
      { ru: 'Сокращаем дробь под знаком логарифма:', tex: `${ratioExpr} = ${answerValue}` },
    ],
    hints: [
      'Используй $\\log_b x-\\log_b y=\\log_b\\frac{x}{y}$.',
      `Сократи дробь $\\frac{${term1}}{${term2}}$, вычитая показатели степеней при $a$ и при $b$.`,
    ],
    inputHint: 'Ответ — логарифм в переменных a, b, например \\log_2(ab)',
  }
}

function tier3(rng: Rng): Problem {
  const base = rng.pick<Base>([2, 3, 'e'])
  const m = rng.int(1, 3)
  const n = rng.int(1, 3)
  const leftTerm = m === 1 ? logLatex(base, 'x') : `${m}${logLatex(base, 'x')}`
  const rightTerm = n === 1 ? logLatex(base, 'y') : `${n}${logLatex(base, 'y')}`
  const poweredTerm = `${varPow('x', m)}${varPow('y', n)}`
  const answerValue = logLatex(base, poweredTerm)
  return {
    statement: {
      en: `Write as a single logarithm: $${leftTerm} + ${rightTerm}$.`,
      ru: `Запиши как один логарифм: $${leftTerm} + ${rightTerm}$.`,
    },
    answer: { kind: 'expression', value: answerValue, variables: ['x', 'y'], domain: { x: [1.5, 4], y: [1.5, 4] } },
    solution: [
      { ru: 'Коэффициент перед логарифмом переносим в показатель степени под логарифмом:', tex: `${leftTerm} = ${logLatex(base, varPow('x', m))}, \\quad ${rightTerm} = ${logLatex(base, varPow('y', n))}` },
      { ru: 'Логарифмы одного основания складываются в логарифм произведения:', tex: `${logLatex(base, varPow('x', m))} + ${logLatex(base, varPow('y', n))} = ${answerValue}` },
    ],
    hints: [
      'Используй $k\\log_b x=\\log_b(x^{k})$, чтобы занести коэффициент под знак логарифма.',
      'Используй $\\log_b x+\\log_b y=\\log_b(xy)$, чтобы объединить в один логарифм.',
    ],
    inputHint: 'Ответ — логарифм в переменных x, y, например \\log_3(x^2y)',
  }
}

export const template: SkillTemplate = {
  skillId: 'log_laws',
  theory,
  expectedSeconds: { 1: 40, 2: 85, 3: 115 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
