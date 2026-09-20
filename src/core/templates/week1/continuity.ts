import { linear } from '../../math/latex'
import { polyAdd, polyEval, polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Функция непрерывна (continuous) в точке $x=c$, если $\\lim_{x\\to c}f(x)$ существует и равен $f(c)$ — график не разрывается.',
  'Для кусочной функции непрерывность в точке стыка означает, что обе формулы дают одно и то же значение в этой точке.',
  'Точки разрыва рациональной функции — это нули знаменателя. Если множитель, дающий ноль, сокращается с числителем — разрыв устранимый (removable), иначе — неустранимый (полюс).',
  'Устранимый разрыв (removable discontinuity) можно «убрать», доопределив функцию в этой точке значением предела.',
  'Типичная ошибка: подставлять точку стыка только в одну из формул кусочной функции и забывать приравнять её ко второй.',
].join('\n')

function tier1(rng: Rng): Problem {
  const c = rng.int(-4, 4)
  const m = rng.intExcept(-5, 5, [0])
  const k = rng.int(-8, 8)
  const rhsAtC = m * c + k
  const a = rhsAtC - c * c
  const rightLatex = linear(m, k)
  const statementCore = `f(x)=\\begin{cases}x^{2}+a, & x\\le ${c} \\\\ ${rightLatex}, & x> ${c}\\end{cases}`
  return {
    statement: {
      en: `The function $${statementCore}$ is continuous everywhere. Find $a$.`,
      ru: `Функция $${statementCore}$ непрерывна всюду. Найди $a$.`,
    },
    answer: { kind: 'number', value: String(a) },
    solution: [
      { ru: 'В точке стыка обе формулы должны давать одно и то же значение.' },
      { ru: `Правая часть в точке $x=${c}$ равна:`, tex: `${m}\\cdot ${c} + ${k} = ${rhsAtC}` },
      { ru: 'Приравниваем левую часть к этому числу и находим $a$:', tex: `${c}^{2}+a = ${rhsAtC} \\ \\Rightarrow\\ a = ${rhsAtC} - ${c * c} = ${a}` },
    ],
    hints: ['В точке стыка кусков значения обеих формул должны совпадать.', `Подставь $x=${c}$ в обе части и приравняй их.`],
  }
}

function tier2(rng: Rng): Problem {
  const c = rng.intExcept(-6, 6, [0])
  const r = rng.int(-4, 4)
  const numerator: Poly = polyAdd(polyMul([-r, 1], [-r, 1]), [1])
  const numLatex = polyToLatex(numerator)
  const denLatex = linear(1, -c)
  return {
    statement: {
      en: `For which $x$ is $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ discontinuous?`,
      ru: `При каком $x$ функция $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ разрывна?`,
    },
    answer: { kind: 'number', value: String(c) },
    solution: [
      { ru: 'Функция не определена там, где знаменатель равен нулю:', tex: `${denLatex} = 0 \\ \\Rightarrow\\ x = ${c}` },
      { ru: `Числитель в этой точке равен $${polyEval(numerator, c)}\\ne 0$ — множитель не сокращается, значит это неустранимый разрыв.` },
    ],
    hints: ['Область определения дроби исключает нули знаменателя.', 'Приравняй знаменатель к нулю и реши уравнение.'],
  }
}

function removableHole(rng: Rng): Problem {
  const p = rng.intExcept(-6, 6, [0])
  const q = rng.intExcept(-6, 6, [0, p])
  const numerator: Poly = polyMul([-p, 1], [-q, 1])
  const numLatex = polyToLatex(numerator)
  const denLatex = linear(1, -p)
  const value = p - q
  return {
    statement: {
      en: `The function $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ is undefined at $x=${p}$. What value should be assigned to $f(${p})$ to make $f$ continuous there?`,
      ru: `Функция $f(x)=\\dfrac{${numLatex}}{${denLatex}}$ не определена в точке $x=${p}$. Какое значение нужно присвоить $f(${p})$, чтобы функция стала непрерывной в этой точке?`,
    },
    answer: { kind: 'number', value: String(value) },
    solution: [
      {
        ru: 'Раскладываем числитель на множители — один из них совпадает со знаменателем:',
        tex: `\\frac{${numLatex}}{${denLatex}} = \\frac{\\left(x-${p}\\right)\\left(x-${q}\\right)}{x-${p}} = x-${q} \\quad (x\\ne ${p})`,
      },
      { ru: `Подставляем точку разрыва в сокращённое выражение:`, tex: `f(${p}) = ${p}-${q} = ${value}` },
    ],
    hints: [
      'Разложи числитель на множители — один из них должен совпасть со знаменателем.',
      'Сократи общий множитель и подставь точку разрыва в оставшееся выражение.',
    ],
  }
}

function twoConditions(rng: Rng): Problem {
  const p = rng.intExcept(-3, 2, [1])
  const q = rng.intExcept(p + 1, p + 5, [-1])
  const k = rng.pick([-3, -2, -1, 1, 2, 3])
  const D = p * q + 1
  const m = D * k
  const a = k * (q + 1)
  const b = k * (p - 1)
  const statementCore = `f(x)=\\begin{cases}ax-b, & x<${p} \\\\ ${m}, & ${p}\\le x<${q} \\\\ bx+a, & x\\ge ${q}\\end{cases}`
  return {
    statement: {
      en: `Suppose $f$ is continuous everywhere: $${statementCore}$. Find $a$.`,
      ru: `Пусть $f$ непрерывна всюду: $${statementCore}$. Найди $a$.`,
    },
    answer: { kind: 'number', value: String(a) },
    solution: [
      { ru: `Стыковка в точке $x=${p}$ даёт первое уравнение:`, tex: `a\\cdot ${p} - b = ${m}` },
      { ru: `Стыковка в точке $x=${q}$ даёт второе уравнение:`, tex: `b\\cdot ${q} + a = ${m}` },
      { ru: 'Решаем систему двух уравнений с двумя неизвестными:', tex: `a = ${a}, \\quad b = ${b}` },
    ],
    hints: [
      'Условие непрерывности в каждой точке стыка даёт одно уравнение относительно $a$ и $b$.',
      'Запиши оба уравнения и реши систему подстановкой или сложением.',
    ],
    inputHint: 'Введи значение a (не b)',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? removableHole(rng) : twoConditions(rng)
}

export const template: SkillTemplate = {
  skillId: 'continuity',
  theory,
  expectedSeconds: { 1: 75, 2: 60, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
