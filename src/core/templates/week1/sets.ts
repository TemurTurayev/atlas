import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Множество (set) — набор различных элементов; порядок не важен, повторы не считаются.',
  'Числовые множества вложены друг в друга: $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$.',
  '$\\mathbb{N} = \\{0, 1, 2, \\ldots\\}$ — натуральные, $\\mathbb{Z}$ — целые, $\\mathbb{Q}$ — дроби вида $\\frac{a}{b}$ с целыми $a, b$, $\\mathbb{R}$ — все действительные.',
  'Иррациональные числа ($\\sqrt{2}$, $\\pi$) лежат в $\\mathbb{R}$, но не в $\\mathbb{Q}$.',
  'Различай знаки: $\\in$ — «элемент принадлежит множеству», $\\subseteq$ — «одно множество лежит внутри другого».',
  'Типичная ошибка: писать $\\{2\\} \\in A$ вместо $\\{2\\} \\subseteq A$ — фигурные скобки делают из элемента множество.',
].join('\n')

const HINTS = [
  'Начни с самого узкого множества: натуральные → целые → рациональные → действительные.',
  'Проверь, можно ли число записать как дробь целых чисел. Если нет — оно только в $\\mathbb{R}$.',
]

const SET_OPTIONS: readonly ChoiceOption[] = [
  { id: 'N', label: '$\\mathbb{N}$ — натуральные' },
  { id: 'Z', label: '$\\mathbb{Z}$ — целые' },
  { id: 'Q', label: '$\\mathbb{Q}$ — рациональные' },
  { id: 'R', label: '$\\mathbb{R}$ — действительные' },
]

interface Sample {
  readonly latex: string
  readonly set: string
  readonly why: string
}

const SAMPLES: readonly Sample[] = [
  { latex: '7', set: 'N', why: 'целое и неотрицательное' },
  { latex: '\\sqrt{9}', set: 'N', why: '$\\sqrt{9}=3$ — натуральное' },
  { latex: '-4', set: 'Z', why: 'целое, но отрицательное' },
  { latex: '\\frac{-10}{5}', set: 'Z', why: '$\\frac{-10}{5}=-2$ — целое' },
  { latex: '\\frac{3}{4}', set: 'Q', why: 'дробь целых чисел, но не целое' },
  { latex: '0.25', set: 'Q', why: '$0.25=\\frac{1}{4}$ — дробь целых чисел' },
  { latex: '-\\frac{7}{3}', set: 'Q', why: 'дробь целых чисел' },
  { latex: '\\sqrt{2}', set: 'R', why: 'иррациональное: дробью целых не записать' },
  { latex: '\\pi', set: 'R', why: 'иррациональное' },
  { latex: '\\sqrt{7}', set: 'R', why: 'иррациональное' },
]

function tier1(rng: Rng): Problem {
  const sample = rng.pick(SAMPLES)
  return {
    statement: {
      en: `What is the smallest of the sets $\\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}$ that contains $${sample.latex}$?`,
      ru: `Какое из множеств $\\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}$ — самое узкое из тех, что содержат $${sample.latex}$?`,
    },
    answer: { kind: 'choice', options: SET_OPTIONS, correctId: sample.set },
    solution: [{ ru: `Число $${sample.latex}$ — ${sample.why}.` }],
    hints: HINTS,
  }
}

function tier2(rng: Rng): Problem {
  const elements = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3).sort((a, b) => a - b)
  const inside = rng.pick(elements)
  const outside = rng.intExcept(1, 9, elements)
  const set = setLatex(elements)
  const falseOptions: readonly ChoiceOption[] = [
    { id: 'wrong-member', label: `$${outside} \\in ${set}$` },
    { id: 'wrong-braces', label: `$\\{${inside}\\} \\in ${set}$` },
    { id: 'wrong-subset', label: `$\\{${outside}\\} \\subseteq ${set}$` },
  ]
  const wrong = rng.pick(falseOptions)
  const options = rng.shuffle([
    wrong,
    { id: 'member', label: `$${inside} \\in ${set}$` },
    { id: 'subset', label: `$\\{${inside}\\} \\subseteq ${set}$` },
    { id: 'empty', label: `$\\emptyset \\subseteq ${set}$` },
  ])
  return {
    statement: { en: `Let $A = ${set}$. Which statement is false?`, ru: `Пусть $A = ${set}$. Какое утверждение неверно?` },
    answer: { kind: 'choice', options, correctId: wrong.id },
    solution: [
      { ru: `Элементы $A$ — это ${elements.join(', ')}; значит $${inside} \\in A$, а $${outside} \\notin A$.` },
      { ru: 'Запись $\\{a\\}$ — это множество из одного элемента: оно может быть подмножеством ($\\subseteq$), но не элементом ($\\in$).' },
    ],
    hints: ['Выпиши элементы множества и проверь каждое утверждение по очереди.', 'Помни разницу: $2 \\in A$, но $\\{2\\} \\subseteq A$.'],
  }
}

function tier3(rng: Rng): Problem {
  const low = rng.int(-4, 0)
  const high = rng.int(low + 2, low + 5)
  const correct = Array.from({ length: high - low }, (_, i) => low + i)
  const options = rng.shuffle<ChoiceOption>([
    { id: 'correct', label: `$${setLatex(correct)}$` },
    { id: 'with-high', label: `$${setLatex([...correct, high])}$` },
    { id: 'without-low', label: `$${setLatex(correct.slice(1))}$` },
    { id: 'shifted', label: `$${setLatex(correct.map((n) => n + 1))}$` },
  ])
  const condition = `\\{n \\in \\mathbb{Z} : ${low} \\le n < ${high}\\}`
  return {
    statement: { en: `Which set is $${condition}$?`, ru: `Какому множеству равно $${condition}$?` },
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { ru: `Условие $${low} \\le n$ включает $${low}$, а условие $n < ${high}$ исключает $${high}$.` },
      { ru: 'Значит, множество равно:', tex: setLatex(correct) },
    ],
    hints: [
      'Строгий знак $<$ конец не включает, нестрогий $\\le$ — включает.',
      `Выпиши целые числа по порядку от $${low}$ и остановись, не дойдя до $${high}$.`,
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'sets',
  theory,
  expectedSeconds: { 1: 35, 2: 60, 3: 80 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
