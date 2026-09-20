import { linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'Инъективная функция (injective, one-to-one): разным $x$ соответствуют разные $y$, то есть из $f(x_1) = f(x_2)$ следует $x_1 = x_2$.',
  'Графический тест: любая горизонтальная прямая пересекает график не более одного раза.',
  'Чётные степени и модуль ($x^2$, $|x|$) не инъективны на $\\mathbb{R}$ — например $f(-2) = f(2)$.',
  'Строго монотонные функции (линейные с $a \\ne 0$, нечётные степени вроде $x^3$) инъективны на $\\mathbb{R}$.',
  'Биекция (bijection) — это инъекция и сюръекция одновременно; функция должна быть определена на всём $\\mathbb{R}$.',
  'Типичная ошибка: путать «каждому $x$ — одно значение $y$» (это просто функция) с «каждому $y$ — не более одного $x$» (это инъективность).',
].join('\n')

const HINTS = ['Проверь, симметричен ли график относительно вертикальной прямой — тогда есть повторяющиеся значения.', 'Строго возрастающая или строго убывающая функция на $\\mathbb{R}$ всегда инъективна.']

const cubeLabel = (a: number, c: number): string => `${a === 1 ? '' : a === -1 ? '-' : a}x^{3}${c === 0 ? '' : c > 0 ? `+${c}` : c}`
const quadLabel = (h: number, k: number): string => `\\left(${linear(1, -h)}\\right)^{2}${k === 0 ? '' : k > 0 ? `+${k}` : k}`
const absLabel = (h: number, k: number): string => `\\left|${linear(1, -h)}\\right|${k === 0 ? '' : k > 0 ? `+${k}` : k}`
const quarticLabel = (h: number, k: number): string => `\\left(${linear(1, -h)}\\right)^{4}${k === 0 ? '' : k > 0 ? `+${k}` : k}`

function injectiveCandidate(rng: Rng): { readonly label: string; readonly explanation: string } {
  if (rng.chance(0.5)) {
    const a = rng.pick([-3, -2, -1, 1, 2, 3])
    const b = rng.int(-5, 5)
    return { label: `$${linear(a, b)}$`, explanation: `линейная функция $${linear(a, b)}$ строго монотонна (коэффициент $${a} \\ne 0$)` }
  }
  const a = rng.pick([-2, -1, 1, 2])
  const c = rng.int(-5, 5)
  return { label: `$${cubeLabel(a, c)}$`, explanation: `нечётная степень $${cubeLabel(a, c)}$ строго монотонна на всей числовой прямой` }
}

function nonInjectiveCandidates(rng: Rng, count: number): readonly { readonly label: string; readonly explanation: string }[] {
  const shifts = rng.shuffle([-4, -3, -2, -1, 0, 1, 2, 3, 4]).slice(0, count)
  const kinds: readonly ((h: number, k: number) => string)[] = [quadLabel, absLabel, quarticLabel]
  return shifts.map((h, i) => {
    const k = rng.int(-4, 4)
    const kind = kinds[i % kinds.length]
    const label = kind(h, k)
    return { label: `$${label}$`, explanation: `$${label}$ принимает одинаковые значения слева и справа от $x = ${h}$` }
  })
}

function buildChoice(rng: Rng, en: string, ru: string, distractorCount: number, correct: { readonly label: string; readonly explanation: string }): Problem {
  const wrong = nonInjectiveCandidates(rng, distractorCount)
  const options: readonly ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: correct.label },
    ...wrong.map((w, i) => ({ id: `wrong-${i}`, label: w.label })),
  ])
  return {
    statement: { en, ru },
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { ru: `Верный ответ: ${correct.explanation}.` },
      { ru: `Остальные варианты не инъективны: ${wrong.map((w) => w.explanation).join('; ')}.` },
    ],
    hints: HINTS,
  }
}

function tier1(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const en = 'Which of the following functions is injective (one-to-one) on $\\mathbb{R}$?'
  const ru = 'Какая из следующих функций инъективна (взаимно однозначна) на $\\mathbb{R}$?'
  return buildChoice(rng, en, ru, 3, correct)
}

function tier2(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const formula = correct.label.replace(/\$/g, '')
  const en = `Is $f(x) = ${formula}$ injective on $\\mathbb{R}$? Choose the option below that matches this function.`
  const ru = `Инъективна ли функция $f(x) = ${formula}$ на $\\mathbb{R}$? Выбери вариант, который ей соответствует.`
  return buildChoice(rng, en, ru, 3, correct)
}

function tier3(rng: Rng): Problem {
  const correct = injectiveCandidate(rng)
  const reciprocalShift = rng.int(-4, 4)
  const question = 'Which of the following functions is a bijection $\\mathbb{R} \\to \\mathbb{R}$?'
  const questionRu = 'Какая из следующих функций является биекцией $\\mathbb{R} \\to \\mathbb{R}$?'
  const wrong = nonInjectiveCandidates(rng, 2)
  const reciprocal = {
    label: `$\\dfrac{1}{${linear(1, -reciprocalShift)}}$`,
    explanation: `$\\dfrac{1}{${linear(1, -reciprocalShift)}}$ не определена при $x = ${reciprocalShift}$, значит это не функция на всём $\\mathbb{R}$`,
  }
  const options: readonly ChoiceOption[] = rng.shuffle([
    { id: 'correct', label: correct.label },
    { id: 'wrong-0', label: wrong[0].label },
    { id: 'wrong-1', label: wrong[1].label },
    { id: 'wrong-2', label: reciprocal.label },
  ])
  return {
    statement: { en: question, ru: questionRu },
    answer: { kind: 'choice', options, correctId: 'correct' },
    solution: [
      { ru: `Верный ответ: ${correct.explanation}, а на всём $\\mathbb{R}$ такая функция ещё и сюръективна.` },
      { ru: `Остальные не подходят: ${wrong.map((w) => w.explanation).join('; ')}; ${reciprocal.explanation}.` },
    ],
    hints: [...HINTS, 'Проверь, что функция вообще определена для каждого $x \\in \\mathbb{R}$ — иначе это не функция $\\mathbb{R} \\to \\mathbb{R}$.'],
  }
}

export const template: SkillTemplate = {
  skillId: 'injective',
  theory,
  expectedSeconds: { 1: 40, 2: 70, 3: 100 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
