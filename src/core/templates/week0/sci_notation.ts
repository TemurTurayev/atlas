import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Научная запись числа (scientific notation): $a\\times10^{n}$, где $1\\le a<10$.',
  'Умножение: перемножь мантиссы, показатели степени сложи: $10^{m}\\cdot10^{n}=10^{m+n}$.',
  'Деление: раздели мантиссы, показатели степени вычти: $10^{m}\\div10^{n}=10^{m-n}$.',
  'Сложение и вычитание: сначала приведи числа к одному порядку (показателю степени), потом складывай мантиссы.',
  'Типичные ошибки: складывать показатели степени при сложении чисел; забыть перенести множитель $10$ при выравнивании порядков.',
].join('\n')

const HINTS_MUL = ['Перемножь мантиссы отдельно от степеней десяти.', 'Показатели степени при умножении складываются.']
const HINTS_DIV = ['Раздели мантиссы отдельно от степеней десяти.', 'Показатели степени при делении вычитаются.']
const HINTS_SUM = ['Приведи оба числа к одинаковому показателю степени 10.', 'После выравнивания порядков просто сложи мантиссы.']
const INPUT_HINT = 'Ответ — число, можно в виде a*10^n или обычной десятичной дробью'

function trimZeros(s: string): string {
  if (!s.includes('.')) return s
  const trimmed = s.replace(/0+$/, '').replace(/\.$/, '')
  return trimmed === '' || trimmed === '-' ? '0' : trimmed
}

function build(equation: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: { en: `Compute: $${equation}$. Give the answer in scientific notation.`, ru: `Вычисли: $${equation}$. Ответ дай в научной записи.` },
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const c1 = rng.int(1, 9)
  const e1 = rng.int(-3, 3)
  const c2 = rng.int(1, 9)
  const e2 = rng.int(-3, 3)
  const mantissa = c1 * c2
  const exponent = e1 + e2
  const equation = `\\left(${c1}\\times10^{${e1}}\\right)\\left(${c2}\\times10^{${e2}}\\right)`
  const value = `${mantissa}\\times10^{${exponent}}`
  return build(equation, value, [
    { ru: 'Перемножаем мантиссы:', tex: `${c1}\\cdot${c2} = ${mantissa}` },
    { ru: 'Складываем показатели степени:', tex: `10^{${e1}}\\cdot10^{${e2}} = 10^{${exponent}}` },
    { ru: 'Итог:', tex: `${mantissa}\\times10^{${exponent}}` },
  ], HINTS_MUL)
}

function tier2(rng: Rng): Problem {
  const c2 = rng.int(11, 49)
  const r = rng.int(2, 6)
  const c1 = c2 * r
  const e1 = rng.int(-3, 3)
  const e2 = rng.int(-3, 3)
  const c1Str = (c1 / 10).toFixed(1)
  const c2Str = (c2 / 10).toFixed(1)
  const exponent = e1 - e2
  const equation = `\\dfrac{${c1Str}\\times10^{${e1}}}{${c2Str}\\times10^{${e2}}}`
  const value = `${r}\\times10^{${exponent}}`
  return build(equation, value, [
    { ru: 'Делим мантиссы:', tex: `${c1Str} \\div ${c2Str} = ${r}` },
    { ru: 'Вычитаем показатели степени:', tex: `10^{${e1}}\\div10^{${e2}} = 10^{${exponent}}` },
    { ru: 'Итог:', tex: `${r}\\times10^{${exponent}}` },
  ], HINTS_DIV)
}

function tier3(rng: Rng): Problem {
  const e2 = rng.int(-7, -2)
  const e1 = e2 + 1
  const x = rng.int(11, 99)
  const c1Str = (x / 10).toFixed(1)
  const c2 = rng.int(1, 9)
  const sumMantissa = x + c2
  const scale = -e2
  const decimalValue = trimZeros((sumMantissa / 10 ** scale).toFixed(scale))
  const equation = `${c1Str}\\times10^{${e1}} + ${c2}\\times10^{${e2}}`
  return build(equation, decimalValue, [
    { ru: `Приводим первое слагаемое к порядку $10^{${e2}}$:`, tex: `${c1Str}\\times10^{${e1}} = ${x}\\times10^{${e2}}` },
    { ru: 'Складываем мантиссы одного порядка:', tex: `${x}\\times10^{${e2}} + ${c2}\\times10^{${e2}} = ${sumMantissa}\\times10^{${e2}}` },
    { ru: 'Переводим в десятичную запись:', tex: `${sumMantissa}\\times10^{${e2}} = ${decimalValue}` },
  ], HINTS_SUM)
}

export const template: SkillTemplate = {
  skillId: 'sci_notation',
  theory,
  expectedSeconds: { 1: 30, 2: 75, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
