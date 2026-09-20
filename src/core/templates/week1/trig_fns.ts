import { add, rat, sub, toNumber, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Единичная окружность (unit circle): для угла $\\theta$ точка на окружности — $(\\cos\\theta, \\sin\\theta)$; $\\tan\\theta=\\frac{\\sin\\theta}{\\cos\\theta}$.',
  'Точные значения (exact values) для опорных углов: $\\sin\\frac{\\pi}{6}=\\frac12$, $\\sin\\frac{\\pi}{4}=\\frac{\\sqrt2}{2}$, $\\sin\\frac{\\pi}{3}=\\frac{\\sqrt3}{2}$; аналогично для косинуса в обратном порядке.',
  'Формулы двойного угла (double-angle identities): $\\sin2\\alpha=2\\sin\\alpha\\cos\\alpha$; $\\cos2\\alpha=2\\cos^{2}\\alpha-1=1-2\\sin^{2}\\alpha$.',
  'Решая $\\sin x=k$ или $\\cos x=k$ на $[0,2\\pi)$, сначала найди опорный угол (reference angle), затем определи, в каких четвертях функция имеет нужный знак.',
  'Типичная ошибка: находить только один корень уравнения и забывать про второй, симметричный ему в соседней четверти.',
].join('\n')

interface AngleEntry {
  readonly num: number
  readonly den: number
  readonly sin: string
  readonly cos: string
  readonly tan: string | null
}

const ANGLES: readonly AngleEntry[] = [
  { num: 0, den: 1, sin: '0', cos: '1', tan: '0' },
  { num: 1, den: 6, sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}' },
  { num: 1, den: 4, sin: '\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '1' },
  { num: 1, den: 3, sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '\\sqrt{3}' },
  { num: 1, den: 2, sin: '1', cos: '0', tan: null },
  { num: 2, den: 3, sin: '\\frac{\\sqrt{3}}{2}', cos: '-\\frac{1}{2}', tan: '-\\sqrt{3}' },
  { num: 3, den: 4, sin: '\\frac{\\sqrt{2}}{2}', cos: '-\\frac{\\sqrt{2}}{2}', tan: '-1' },
  { num: 5, den: 6, sin: '\\frac{1}{2}', cos: '-\\frac{\\sqrt{3}}{2}', tan: '-\\frac{\\sqrt{3}}{3}' },
  { num: 1, den: 1, sin: '0', cos: '-1', tan: '0' },
  { num: 7, den: 6, sin: '-\\frac{1}{2}', cos: '-\\frac{\\sqrt{3}}{2}', tan: '\\frac{\\sqrt{3}}{3}' },
  { num: 5, den: 4, sin: '-\\frac{\\sqrt{2}}{2}', cos: '-\\frac{\\sqrt{2}}{2}', tan: '1' },
  { num: 4, den: 3, sin: '-\\frac{\\sqrt{3}}{2}', cos: '-\\frac{1}{2}', tan: '\\sqrt{3}' },
  { num: 3, den: 2, sin: '-1', cos: '0', tan: null },
  { num: 5, den: 3, sin: '-\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}', tan: '-\\sqrt{3}' },
  { num: 7, den: 4, sin: '-\\frac{\\sqrt{2}}{2}', cos: '\\frac{\\sqrt{2}}{2}', tan: '-1' },
  { num: 11, den: 6, sin: '-\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}', tan: '-\\frac{\\sqrt{3}}{3}' },
]

function piLatex(f: Rational): string {
  if (f.n === 0) return '0'
  if (f.d === 1) return f.n === 1 ? '\\pi' : `${f.n}\\pi`
  return f.n === 1 ? `\\frac{\\pi}{${f.d}}` : `\\frac{${f.n}\\pi}{${f.d}}`
}

const findAngle = (frac: Rational): AngleEntry => {
  const found = ANGLES.find((a) => a.num === frac.n && a.den === frac.d)
  if (!found) throw new Error(`No table entry for ${frac.n}/${frac.d}`)
  return found
}

type Fn = 'sin' | 'cos' | 'tan'

function tier1(rng: Rng): Problem {
  const fn = rng.pick<Fn>(['sin', 'cos', 'tan'])
  const candidates = fn === 'tan' ? ANGLES.filter((a) => a.tan !== null) : ANGLES
  const entry = rng.pick(candidates)
  const angleLatex = piLatex(rat(entry.num, entry.den))
  const value = entry[fn] as string
  const expr = `\\${fn}\\left(${angleLatex}\\right)`
  return {
    statement: { en: `Find the exact value of $${expr}$.`, ru: `Найди точное значение $${expr}$.` },
    answer: { kind: 'number', value },
    solution: [{ ru: 'Точное значение по таблице единичной окружности:', tex: `${expr} = ${value}` }],
    hints: [
      'Вспомни таблицу точных значений на единичной окружности для стандартных углов.',
      'Определи четверть угла — от неё зависит знак значения.',
    ],
    inputHint: 'Если ответ иррациональный, пиши через корень: sqrt(3)/2 (не десятичной дробью)',
  }
}

const REF_ALPHAS: readonly Rational[] = [rat(1, 6), rat(1, 4), rat(1, 3)]

const EXACT_VALUE: Readonly<Record<Fn, Readonly<Record<number, string>>>> = {
  sin: { 6: '\\frac{1}{2}', 4: '\\frac{\\sqrt{2}}{2}', 3: '\\frac{\\sqrt{3}}{2}' },
  cos: { 6: '\\frac{\\sqrt{3}}{2}', 4: '\\frac{\\sqrt{2}}{2}', 3: '\\frac{1}{2}' },
  tan: { 6: '\\frac{\\sqrt{3}}{3}', 4: '1', 3: '\\sqrt{3}' },
}

const QUADRANT_TEXT: Readonly<Record<Fn, Readonly<Record<'pos' | 'neg', string>>>> = {
  sin: { pos: 'синус положителен в I и II четвертях', neg: 'синус отрицателен в III и IV четвертях' },
  cos: { pos: 'косинус положителен в I и IV четвертях', neg: 'косинус отрицателен во II и III четвертях' },
  tan: { pos: 'тангенс положителен в I и III четвертях', neg: 'тангенс отрицателен во II и IV четвертях' },
}

function equationSolutions(fn: Fn, alpha: Rational, positive: boolean): readonly [Rational, Rational] {
  const one = rat(1, 1)
  const two = rat(2, 1)
  if (fn === 'sin') return positive ? [alpha, sub(one, alpha)] : [add(one, alpha), sub(two, alpha)]
  if (fn === 'cos') return positive ? [alpha, sub(two, alpha)] : [sub(one, alpha), add(one, alpha)]
  return positive ? [alpha, add(one, alpha)] : [sub(one, alpha), sub(two, alpha)]
}

function tier2(rng: Rng): Problem {
  const fn = rng.pick<Fn>(['sin', 'cos', 'tan'])
  const alpha = rng.pick(REF_ALPHAS)
  const positive = rng.chance(0.5)
  const kValue = EXACT_VALUE[fn][alpha.d]
  const kLatex = positive ? kValue : `-${kValue}`
  const [s1, s2] = equationSolutions(fn, alpha, positive)
  const sorted = toNumber(s1) <= toNumber(s2) ? [s1, s2] : [s2, s1]
  const values = sorted.map(piLatex)
  return {
    statement: {
      en: `Solve $\\${fn} x = ${kLatex}$ for $x \\in [0, 2\\pi)$.`,
      ru: `Реши уравнение $\\${fn} x = ${kLatex}$ для $x \\in [0, 2\\pi)$.`,
    },
    answer: { kind: 'numberSet', values },
    solution: [
      { ru: 'Опорный угол (reference angle) — угол первой четверти с тем же по модулю значением функции:', tex: `${piLatex(alpha)}` },
      { ru: `${QUADRANT_TEXT[fn][positive ? 'pos' : 'neg']}.` },
      { ru: 'Решения на $[0,2\\pi)$:', tex: `x = ${values[0]}, \\ x = ${values[1]}` },
    ],
    hints: [
      'Найди опорный угол — угол в первой четверти с тем же по модулю значением функции.',
      'Определи, в каких четвертях функция имеет нужный знак, и построй решения через опорный угол.',
    ],
    inputHint: 'Собери оба решения через запятую, например pi/6, 5pi/6',
  }
}

const DOUBLE_ALPHAS: readonly Rational[] = [rat(1, 6), rat(1, 4), rat(1, 3), rat(2, 3), rat(3, 4), rat(5, 6)]

function doubleSin(rng: Rng): Problem {
  const alpha = rng.pick(DOUBLE_ALPHAS)
  const a = piLatex(alpha)
  const doubled = findAngle(add(alpha, alpha))
  const doubledLatex = piLatex(rat(doubled.num, doubled.den))
  const expr = `2\\sin\\left(${a}\\right)\\cos\\left(${a}\\right)`
  return {
    statement: {
      en: `Simplify using a double-angle identity and give the exact value: $${expr}$.`,
      ru: `Упрости с помощью формулы двойного угла и найди точное значение: $${expr}$.`,
    },
    answer: { kind: 'number', value: doubled.sin },
    solution: [
      { ru: 'Применяем формулу синуса двойного угла:', tex: `${expr} = \\sin\\left(2\\cdot ${a}\\right) = \\sin\\left(${doubledLatex}\\right)` },
      { ru: 'Смотрим точное значение по таблице:', tex: `\\sin\\left(${doubledLatex}\\right) = ${doubled.sin}` },
    ],
    hints: [
      'Узнай формулу: $2\\sin\\alpha\\cos\\alpha=\\sin2\\alpha$.',
      'Сначала вычисли удвоенный угол, затем найди его точное значение по таблице.',
    ],
    inputHint: 'Если ответ иррациональный, пиши через корень, например sqrt(3)/2',
  }
}

function doubleCos(rng: Rng): Problem {
  const alpha = rng.pick(DOUBLE_ALPHAS)
  const a = piLatex(alpha)
  const doubled = findAngle(add(alpha, alpha))
  const doubledLatex = piLatex(rat(doubled.num, doubled.den))
  const entry = findAngle(alpha)
  const useCosForm = rng.chance(0.5)
  const expr = useCosForm ? `2\\cos^{2}\\left(${a}\\right) - 1` : `1 - 2\\sin^{2}\\left(${a}\\right)`
  const identityTex = useCosForm ? `2\\cos^{2}\\left(${a}\\right) - 1 = \\cos\\left(2\\cdot ${a}\\right)` : `1 - 2\\sin^{2}\\left(${a}\\right) = \\cos\\left(2\\cdot ${a}\\right)`
  return {
    statement: {
      en: `Simplify using a double-angle identity and give the exact value: $${expr}$.`,
      ru: `Упрости с помощью формулы двойного угла и найди точное значение: $${expr}$.`,
    },
    answer: { kind: 'number', value: doubled.cos },
    solution: [
      { ru: `Используем, что $\\cos\\left(${a}\\right)=${entry.cos}$, $\\sin\\left(${a}\\right)=${entry.sin}$, и формулу косинуса двойного угла:`, tex: identityTex },
      { ru: 'Смотрим точное значение по таблице:', tex: `\\cos\\left(${doubledLatex}\\right) = ${doubled.cos}` },
    ],
    hints: [
      'Узнай формулу: $\\cos2\\alpha=2\\cos^{2}\\alpha-1=1-2\\sin^{2}\\alpha$.',
      'Сначала вычисли удвоенный угол, затем найди его точное значение по таблице.',
    ],
    inputHint: 'Если ответ иррациональный, пиши через корень, например -1/2',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? doubleSin(rng) : doubleCos(rng)
}

export const template: SkillTemplate = {
  skillId: 'trig_fns',
  theory,
  expectedSeconds: { 1: 30, 2: 90, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
