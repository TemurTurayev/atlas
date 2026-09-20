import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Приставки СИ (SI prefixes): кило- $=10^{3}$, санти- $=10^{-2}$, милли- $=10^{-3}$, микро- $=10^{-6}$.',
  'Перевод единиц — умножение на переводной коэффициент, например $1$ км/ч $=\\dfrac{5}{18}$ м/с, $1$ г/см$^3=1000$ кг/м$^3$.',
  'При переходе от крупной единицы к мелкой число увеличивается; от мелкой к крупной — уменьшается.',
  'Доза лекарства на массу тела: доза (мг) $=$ доза на кг (мг/кг) $\\times$ масса (кг).',
  'Типичная ошибка: перепутать умножение с делением при переходе между единицами разного масштаба.',
].join('\n')

const HINTS_KMH = ['$1$ км/ч $=\\dfrac{1000\\text{ м}}{3600\\text{ с}}=\\dfrac{5}{18}$ м/с.', 'Умножь скорость в км/ч на $\\frac{5}{18}$.']
const HINTS_SMALL = ['Определи, во сколько раз отличаются единицы (степень десяти).', 'Умножь или раздели на этот коэффициент — смотри, куда нужно двигать запятую.']
const HINTS_MED = ['Найди коэффициент перевода между единицами.', 'Умножь исходное значение на найденный коэффициент.']

function build(en: string, ru: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: { en, ru },
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: 'Введи число (единицу писать не нужно)',
  }
}

function tier1(rng: Rng): Problem {
  const k = rng.int(5, 40)
  const kmh = 18 * k
  const value = rat(5 * k, 1)
  return build(
    `Convert $${kmh}$ km/h to m/s.`,
    `Переведи $${kmh}$ км/ч в м/с.`,
    ratToLatex(value),
    [
      { ru: 'Коэффициент перевода:', tex: `1 \\text{ км/ч} = \\frac{5}{18} \\text{ м/с}` },
      { ru: 'Умножаем на скорость:', tex: `${kmh} \\cdot \\frac{5}{18} = ${ratToLatex(value)}` },
    ],
    HINTS_KMH,
  )
}

function microToMilli(rng: Rng): Problem {
  const j = rng.int(10, 99)
  const amountUl = j / 10
  const scale = 4
  const numerator = j
  const raw = (numerator / 10 ** scale).toFixed(scale)
  const value = raw.replace(/0+$/, '').replace(/\.$/, '')
  return build(
    `Convert $${amountUl}$ µL to mL.`,
    `Переведи $${amountUl}$ мкл в мл.`,
    value === '' ? '0' : value,
    [
      { ru: 'В одном миллилитре $1000$ микролитров:', tex: '1 \\text{ мл} = 1000 \\text{ мкл}' },
      { ru: 'Делим на 1000:', tex: `${amountUl} \\div 1000 = ${value}` },
    ],
    HINTS_SMALL,
  )
}

function gramsToMilligrams(rng: Rng): Problem {
  const j = rng.int(1, 99)
  const grams = j / 10
  const value = j * 100
  return build(
    `Convert $${grams}$ g to mg.`,
    `Переведи $${grams}$ г в мг.`,
    String(value),
    [
      { ru: 'В одном грамме $1000$ миллиграммов:', tex: '1 \\text{ г} = 1000 \\text{ мг}' },
      { ru: 'Умножаем на 1000:', tex: `${grams} \\cdot 1000 = ${value}` },
    ],
    HINTS_SMALL,
  )
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? microToMilli(rng) : gramsToMilligrams(rng)
}

function density(rng: Rng): Problem {
  const m = rng.int(50, 1500)
  const d = (m / 100).toFixed(2)
  const value = m * 10
  return build(
    `A substance has density $${d}$ g/cm³. Convert it to kg/m³.`,
    `Плотность вещества $${d}$ г/см³. Переведи в кг/м³.`,
    String(value),
    [
      { ru: 'Коэффициент перевода:', tex: '1 \\text{ г/см}^3 = 1000 \\text{ кг/м}^3' },
      { ru: 'Умножаем на 1000:', tex: `${d} \\cdot 1000 = ${value}` },
    ],
    HINTS_MED,
  )
}

function dosePerKg(rng: Rng): Problem {
  const dose = rng.int(1, 20)
  const weight = rng.int(5, 40)
  const value = dose * weight
  return build(
    `A drug is dosed at $${dose}$ mg/kg. Find the total dose for a child weighing $${weight}$ kg.`,
    `Лекарство дозируется как $${dose}$ мг/кг. Найди общую дозу для ребёнка массой $${weight}$ кг.`,
    String(value),
    [
      { ru: 'Общая доза равна дозе на кг, умноженной на массу:', tex: `${dose} \\cdot ${weight} = ${value}` },
    ],
    HINTS_MED,
  )
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? density(rng) : dosePerKg(rng)
}

export const template: SkillTemplate = {
  skillId: 'units',
  theory,
  expectedSeconds: { 1: 30, 2: 60, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
