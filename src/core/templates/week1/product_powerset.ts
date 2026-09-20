import { setLatex } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Булеан (power set) $P(A)$ — множество всех подмножеств $A$, включая $\\emptyset$ и само $A$.',
  'Если $|A| = n$, то $|P(A)| = 2^n$ — каждый элемент либо входит в подмножество, либо нет.',
  'Декартово произведение (Cartesian product) $A \\times B$ — все пары $(a, b)$, $a \\in A$, $b \\in B$; $|A \\times B| = |A| \\cdot |B|$.',
  'Элементы $P(A)$ — это множества, а не сами элементы $A$: например $\\{1\\} \\in P(\\{1,2\\})$, но $1 \\notin P(\\{1,2\\})$.',
  'Типичная ошибка: путать элемент $a \\in A$ с одноэлементным подмножеством $\\{a\\} \\in P(A)$.',
].join('\n')

function randomDistinctPair(rng: Rng, max: number): readonly [number, number] {
  const a = rng.int(1, max)
  const b = rng.intExcept(1, max, [a])
  return a < b ? [a, b] : [b, a]
}

function tier1(rng: Rng): Problem {
  const n = rng.int(2, 6)
  return {
    statement: {
      en: `Let $|A| = ${n}$. Find $|P(A)|$, the number of subsets of $A$.`,
      ru: `Пусть $|A| = ${n}$. Найди $|P(A)|$ — число подмножеств множества $A$.`,
    },
    answer: { kind: 'number', value: String(2 ** n) },
    solution: [
      { ru: `Каждый из $${n}$ элементов независимо либо входит в подмножество, либо нет: $2^{${n}}$ вариантов.` },
      { ru: 'Значит:', tex: `|P(A)| = 2^{${n}} = ${2 ** n}` },
    ],
    hints: ['Для каждого элемента есть 2 варианта: взять его или нет.', `Перемножь $${n}$ двоек: $2^{${n}}$.`],
    inputHint: 'Введи целое число',
  }
}

function tier2(rng: Rng): Problem {
  const [a, b] = randomDistinctPair(rng, 6)
  const setText = setLatex([a, b])
  const correctLabels: readonly ChoiceOption[] = [
    { id: 'empty', label: '$\\emptyset$' },
    { id: 'a', label: `$\\{${a}\\}$` },
    { id: 'b', label: `$\\{${b}\\}$` },
    { id: 'both', label: `$\\{${a}, ${b}\\}$` },
  ]
  const c = rng.intExcept(1, 9, [a, b])
  const wrongCandidates: readonly ChoiceOption[] = [
    { id: 'bare-a', label: `$${a}$` },
    { id: 'bare-b', label: `$${b}$` },
    { id: 'outside', label: `$\\{${a}, ${c}\\}$` },
    { id: 'pair', label: `$(${a}, ${b})$` },
  ]
  const wrong = rng.pick(wrongCandidates)
  const kept = rng.shuffle(correctLabels).slice(0, 3)
  const options = rng.shuffle([wrong, ...kept])
  return {
    statement: {
      en: `Let $A = ${setText}$. Which of the following is NOT an element of $P(A)$?`,
      ru: `Пусть $A = ${setText}$. Какой из вариантов НЕ является элементом $P(A)$?`,
    },
    answer: { kind: 'choice', options, correctId: wrong.id },
    solution: [
      { ru: 'Элементы $P(A)$ — все подмножества $A$:', tex: `P(A) = \\{\\emptyset, \\{${a}\\}, \\{${b}\\}, \\{${a}, ${b}\\}\\}` },
      { ru: 'Элементами булеана являются множества, а не отдельные числа или упорядоченные пары.' },
    ],
    hints: ['Выпиши все 4 подмножества $A$: пустое, два одноэлементных, само $A$.', 'Элемент булеана всегда записывается в фигурных скобках — это множество.'],
  }
}

function tier3(rng: Rng): Problem {
  const askPowerset = rng.chance(0.4)
  const [sizeA, sizeB] = askPowerset ? [rng.int(2, 3), rng.int(2, 3)] : [rng.int(2, 6), rng.int(2, 5)]
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  const setA = rng.shuffle(pool).slice(0, sizeA).sort((x, y) => x - y)
  const setB = rng.shuffle(pool.filter((n) => !setA.includes(n)))
    .slice(0, sizeB)
    .sort((x, y) => x - y)
  const product = setA.length * setB.length
  const target = askPowerset ? 'P(A \\times B)' : 'A \\times B'
  const answerValue = askPowerset ? 2 ** product : product
  const solution = askPowerset
    ? [
        { ru: `Сначала размер произведения: $|A \\times B| = ${setA.length} \\cdot ${setB.length} = ${product}$.` },
        { ru: 'Булеан множества из $n$ элементов имеет $2^n$ элементов:', tex: `|P(A \\times B)| = 2^{${product}} = ${answerValue}` },
      ]
    : [{ ru: `Каждый элемент $A$ образует пару с каждым элементом $B$:`, tex: `|A \\times B| = |A| \\cdot |B| = ${setA.length} \\cdot ${setB.length} = ${product}` }]
  return {
    statement: {
      en: `Let $A = ${setLatex(setA)}$ and $B = ${setLatex(setB)}$. Find $|${target}|$.`,
      ru: `Пусть $A = ${setLatex(setA)}$ и $B = ${setLatex(setB)}$. Найди $|${target}|$.`,
    },
    answer: { kind: 'number', value: String(answerValue) },
    solution,
    hints: askPowerset
      ? ['Сначала найди $|A \\times B|$ — это $|A| \\cdot |B|$.', 'Затем возведи 2 в степень, равную этому числу.']
      : ['Пар в декартовом произведении столько, сколько $|A| \\cdot |B|$.'],
    inputHint: 'Введи целое число',
  }
}

export const template: SkillTemplate = {
  skillId: 'product_powerset',
  theory,
  expectedSeconds: { 1: 35, 2: 70, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
