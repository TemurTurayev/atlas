import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'SI prefixes: kilo- $=10^{3}$, centi- $=10^{-2}$, milli- $=10^{-3}$, micro- $=10^{-6}$.',
  'Unit conversion is multiplication by a conversion factor, for example $1$ km/h $=\\dfrac{5}{18}$ m/s, $1$ g/cm$^3=1000$ kg/m$^3$.',
  'Converting from a larger unit to a smaller one increases the number; converting from a smaller unit to a larger one decreases it.',
  'Drug dose by body weight: dose (mg) $=$ dose per kg (mg/kg) $\\times$ weight (kg).',
  'Common mistake: confusing multiplication with division when converting between units of different scale.',
].join('\n')

const HINTS_KMH = ['$1$ km/h $=\\dfrac{1000\\text{ m}}{3600\\text{ s}}=\\dfrac{5}{18}$ m/s.', 'Multiply the speed in km/h by $\\frac{5}{18}$.']
const HINTS_SMALL = ['Determine the ratio between the units (a power of ten).', 'Multiply or divide by that factor to see which way to shift the decimal point.']
const HINTS_MED = ['Find the conversion factor between the units.', 'Multiply the original value by that factor.']

function build(statement: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement,
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: 'Enter a number (no need to write the unit)',
  }
}

function tier1(rng: Rng): Problem {
  const k = rng.int(5, 40)
  const kmh = 18 * k
  const value = rat(5 * k, 1)
  return build(
    `Convert $${kmh}$ km/h to m/s.`,
    ratToLatex(value),
    [
      { text: 'Conversion factor:', tex: `1 \\text{ km/h} = \\frac{5}{18} \\text{ m/s}` },
      { text: 'Multiply by the speed:', tex: `${kmh} \\cdot \\frac{5}{18} = ${ratToLatex(value)}` },
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
    value === '' ? '0' : value,
    [
      { text: 'One milliliter contains $1000$ microliters:', tex: '1 \\text{ mL} = 1000 \\text{ \u00b5L}' },
      { text: 'Divide by 1000:', tex: `${amountUl} \\div 1000 = ${value}` },
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
    String(value),
    [
      { text: 'One gram contains $1000$ milligrams:', tex: '1 \\text{ g} = 1000 \\text{ mg}' },
      { text: 'Multiply by 1000:', tex: `${grams} \\cdot 1000 = ${value}` },
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
    String(value),
    [
      { text: 'Conversion factor:', tex: '1 \\text{ g/cm}^3 = 1000 \\text{ kg/m}^3' },
      { text: 'Multiply by 1000:', tex: `${d} \\cdot 1000 = ${value}` },
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
    String(value),
    [
      { text: 'Total dose equals the dose per kg multiplied by the weight:', tex: `${dose} \\cdot ${weight} = ${value}` },
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
