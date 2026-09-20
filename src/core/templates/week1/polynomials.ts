import { linear } from '../../math/latex'
import { polyFromRoots, polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Корень многочлена (root) — значение $x$, при котором $f(x) = 0$.',
  'Теорема о корне (factor theorem): если $f(r) = 0$, то $(x - r)$ делит $f(x)$ без остатка.',
  'Кратность корня (multiplicity) — сколько раз множитель $(x-r)$ входит в разложение; например в $x^2(x-3)$ корень $0$ имеет кратность 2.',
  'Множество корней перечисляет каждое значение один раз, даже если его кратность больше 1.',
  'Типичная ошибка: забыть корень $x=0$, когда из многочлена можно вынести $x$ за скобки.',
].join('\n')

const HINTS = ['Разложи многочлен на множители и приравняй каждый множитель к нулю.', 'Каждое различное значение корня пиши в ответе только один раз, даже при повторной кратности.']
const INPUT_HINT = 'Корни через запятую, например 0, 2'

const bracket = (r: number): string => `\\left(${linear(1, -r)}\\right)`

function build(poly: Poly, roots: readonly number[], solution: Problem['solution']): Problem {
  const f = polyToLatex(poly)
  return {
    statement: { en: `Find all real roots of $f(x) = ${f}$.`, ru: `Найди все действительные корни $f(x) = ${f}$.` },
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const degree = rng.pick([2, 3])
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, degree)
  const factored = roots.map(bracket).join('')
  return {
    statement: { en: `Find all real roots of $f(x) = ${factored}$.`, ru: `Найди все действительные корни $f(x) = ${factored}$.` },
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution: [
      { ru: 'Многочлен уже разложен на множители — каждый множитель приравниваем к нулю:', tex: `${factored} = 0` },
      { ru: 'Корни:', tex: roots.map((r) => `x = ${r}`).join(', \\quad ') },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, 3)
  const [given, ...rest] = roots
  const poly = polyFromRoots(1, roots)
  const quad = polyFromRoots(1, rest)
  return build(poly, roots, [
    { ru: `Известно, что $x = ${given}$ — корень, значит $f(x)$ делится на $${bracket(given)}$.` },
    { ru: 'Делим многочлен на этот множитель (столбиком или по схеме Горнера):', tex: `f(x) = ${bracket(given)}\\left(${polyToLatex(quad)}\\right)` },
    { ru: 'Оставшийся квадратный множитель раскладываем на корни:', tex: `${rest.map(bracket).join('')} = 0 \\;\\Rightarrow\\; x = ${rest[0]}, \\; x = ${rest[1]}` },
  ])
}

function multiplicityBranch(rng: Rng): Problem {
  const k = rng.int(2, 4)
  const r = rng.intExcept(-6, 6, [0])
  const power: Poly = Array.from({ length: k + 1 }, (_, i) => (i === k ? 1 : 0))
  const poly = polyMul(power, [-r, 1])
  return build(poly, [0, r], [
    { ru: `Вынесем общий множитель $x^{${k}}$:`, tex: `${polyToLatex(poly)} = x^{${k}}\\left(${linear(1, -r)}\\right)` },
    { ru: `Приравниваем каждый множитель к нулю: $x^{${k}} = 0$ даёт корень $0$ (кратности ${k}), а $${linear(1, -r)} = 0$ даёт корень $${r}$.` },
    { ru: 'Множество различных корней:', tex: `\\{0, ${r}\\}` },
  ])
}

function quarticBranch(rng: Rng): Problem {
  const roots = rng.shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]).slice(0, 4)
  const poly = polyFromRoots(1, roots)
  return build(poly, roots, [
    { ru: 'Раскладываем многочлен четвёртой степени на 4 линейных множителя:', tex: `${roots.map(bracket).join('')} = 0` },
    { ru: 'Корни:', tex: roots.map((r) => `x = ${r}`).join(', \\quad ') },
  ])
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? multiplicityBranch(rng) : quarticBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'polynomials',
  theory,
  expectedSeconds: { 1: 45, 2: 100, 3: 140 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
