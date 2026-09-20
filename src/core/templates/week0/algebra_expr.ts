import { coefPrefix, joinTerms } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Алгебраическое выражение (algebraic expression) — запись с переменными, числами и действиями.',
  'Подобные слагаемые (like terms) — одна и та же переменная в одной степени; их коэффициенты складываются.',
  'Раскрытие скобок (expanding): $a(b+c) = ab + ac$ — знак перед скобкой умножается на каждое слагаемое.',
  'Подстановка (substitution) — заменить буквы числами и вычислить по порядку действий.',
  'Типичные ошибки: сложить коэффициенты разных переменных; не умножить второе слагаемое в скобке.',
].join('\n')

const HINTS = [
  'Сгруппируй слагаемые с одинаковой переменной.',
  'Раскрой скобки: умножь число перед скобкой на каждое слагаемое внутри.',
]
const INPUT_HINT = 'Введи выражение через + и -, например 3x+7y'

function tier1(rng: Rng): Problem {
  const cx1 = rng.intExcept(-9, 9, [0])
  const cx2 = rng.intExcept(-9, 9, [0, -cx1])
  const cy1 = rng.intExcept(-9, 9, [0])
  const cy2 = rng.intExcept(-9, 9, [0, -cy1])
  const X = cx1 + cx2
  const Y = cy1 + cy2
  const statement = joinTerms([`${coefPrefix(cx1)}x`, `${coefPrefix(cy1)}y`, `${coefPrefix(cx2)}x`, `${coefPrefix(cy2)}y`])
  const answer = joinTerms([`${coefPrefix(X)}x`, `${coefPrefix(Y)}y`])
  return {
    statement: {
      en: `Simplify by collecting like terms: $${statement}$`,
      ru: `Упрости, приведя подобные слагаемые: $${statement}$`,
    },
    answer: { kind: 'expression', value: answer, variables: ['x', 'y'], form: 'expanded' },
    solution: [
      { ru: `Слагаемые с $x$: $${cx1}x ${cx2 >= 0 ? '+' : '-'} ${Math.abs(cx2)}x = ${X}x$` },
      { ru: `Слагаемые с $y$: $${cy1}y ${cy2 >= 0 ? '+' : '-'} ${Math.abs(cy2)}y = ${Y}y$` },
      { ru: 'Итог:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const p = rng.int(2, 6)
  const q = rng.int(2, 6)
  const a = rng.pick([1, 2, 3])
  const c = rng.pick([1, 2, 3])
  const wantMinus = rng.chance(0.5)
  const sign = wantMinus && p * a !== q * c ? -1 : 1
  const b = rng.intExcept(-9, 9, [0])
  const d = rng.intExcept(-9, 9, [0])
  const X = p * a + sign * q * c
  const K = p * b + sign * q * d
  const term1 = `${coefPrefix(p)}\\left(${joinTerms([`${coefPrefix(a)}x`, String(b)])}\\right)`
  const term2raw = `${coefPrefix(q)}\\left(${joinTerms([`${coefPrefix(c)}x`, String(d)])}\\right)`
  const term2 = sign === 1 ? term2raw : `-${term2raw}`
  const statement = joinTerms([term1, term2])
  const answer = joinTerms([`${coefPrefix(X)}x`, String(K)])
  return {
    statement: {
      en: `Expand and collect like terms: $${statement}$`,
      ru: `Раскрой скобки и приведи подобные слагаемые: $${statement}$`,
    },
    answer: { kind: 'expression', value: answer, variables: ['x'], form: 'expanded' },
    solution: [
      { ru: 'Раскроем первую скобку:', tex: `${p}\\left(${joinTerms([`${coefPrefix(a)}x`, String(b)])}\\right) = ${joinTerms([`${coefPrefix(p * a)}x`, String(p * b)])}` },
      {
        ru: sign === 1 ? 'Раскроем вторую скобку:' : 'Раскроем вторую скобку (не забудем сменить оба знака внутри):',
        tex: `${sign === 1 ? '' : '-'}${q}\\left(${joinTerms([`${coefPrefix(c)}x`, String(d)])}\\right) = ${joinTerms([`${coefPrefix(sign * q * c)}x`, String(sign * q * d)])}`,
      },
      { ru: 'Сложим подобные слагаемые:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function decimalString(tenths: number): string {
  return tenths % 10 === 0 ? String(tenths / 10) : (tenths / 10).toFixed(1)
}

function bmiProblem(rng: Rng): Problem {
  const h = rng.int(150, 195)
  const w = rng.int(45, 100)
  const hm = h / 100
  const bmi = Math.round((w / (hm * hm)) * 10) / 10
  const bmiStr = bmi.toFixed(1)
  return {
    statement: {
      en: `A patient weighs $${w}$ kg and is $${h}$ cm tall. Compute the BMI (body mass index) $= \\dfrac{\\text{weight, kg}}{\\text{height, m}^{2}}$, rounded to $1$ decimal place.`,
      ru: `Пациент весит $${w}$ кг при росте $${h}$ см. Вычисли индекс массы тела (BMI) $= \\dfrac{\\text{вес, кг}}{\\text{рост, м}^{2}}$, округли до $1$ знака после запятой.`,
    },
    answer: { kind: 'number', value: bmiStr },
    solution: [
      { ru: `Переведём рост в метры: $${h}$ см $= ${hm}$ м.` },
      { ru: 'Подставим в формулу и вычислим:', tex: `BMI = \\frac{${w}}{${hm}^{2}} \\approx ${bmiStr}` },
    ],
    hints: ['Переведи рост из сантиметров в метры перед возведением в квадрат.', 'BMI = вес (кг) / рост² (в метрах).'],
    inputHint: 'Введи число с точкой, например 22.5',
  }
}

function kinematicsProblem(rng: Rng): Problem {
  const v0Tenths = rng.int(10, 80)
  const t = rng.int(2, 6)
  const a = rng.int(1, 6)
  const v0Str = decimalString(v0Tenths)
  const term1Tenths = v0Tenths * t
  const term2Tenths = 5 * a * t * t
  const sStr = decimalString(term1Tenths + term2Tenths)
  return {
    statement: {
      en: `A body moves with initial velocity $v_0 = ${v0Str}$ m/s and constant acceleration $a = ${a}$ m/s$^{2}$. Find the distance $s = v_0 t + \\dfrac{a t^{2}}{2}$ after $t = ${t}$ s.`,
      ru: `Тело движется с начальной скоростью $v_0 = ${v0Str}$ м/с и постоянным ускорением $a = ${a}$ м/с$^{2}$. Найди путь $s = v_0 t + \\dfrac{a t^{2}}{2}$ через $t = ${t}$ с.`,
    },
    answer: { kind: 'number', value: sStr },
    solution: [
      { ru: 'Подставим значения в формулу:', tex: `s = ${v0Str}\\cdot ${t} + \\frac{${a}\\cdot ${t}^{2}}{2}` },
      { ru: 'Вычислим каждое слагаемое и сложим:', tex: `s = ${decimalString(term1Tenths)} + ${decimalString(term2Tenths)} = ${sStr}` },
    ],
    hints: ['Подставь числа вместо $v_0$, $a$, $t$ по очереди.', 'Не забудь разделить $at^2$ на $2$.'],
    inputHint: 'Введи число (можно с точкой)',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? bmiProblem(rng) : kinematicsProblem(rng)
}

export const template: SkillTemplate = {
  skillId: 'algebra_expr',
  theory,
  expectedSeconds: { 1: 40, 2: 85, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
