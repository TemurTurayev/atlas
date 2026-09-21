import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Rectangle area: $S = ab$. Triangle area: $S = \\frac{1}{2}ah$.',
  'Circle area: $S = \\pi r^2$. Circumference: $C = 2\\pi r$.',
  'Cylinder volume: $V = \\pi r^2 h$. Sphere volume: $V = \\frac{4}{3}\\pi r^3$.',
  'Unless told to round, leave $\\pi$ exact — do not replace it with 3.14.',
  'Split a composite figure into simple parts and add (or subtract) their areas.',
  'Common mistakes: forgetting the factor $\\frac{1}{2}$ for a triangle; not squaring the radius.',
].join('\n')

const PLAIN_HINT = 'Enter a whole number'
const PI_HINT = 'If the answer contains π, leave it exact — do not convert it to 3.14'

function build(statement: string, value: string, solution: Problem['solution'], hints: readonly string[], inputHint: string): Problem {
  return { statement, answer: { kind: 'number', value }, solution, hints, inputHint }
}

function rectangleOrTriangle(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const a = rng.int(3, 12)
    const b = rng.int(3, 12)
    return build(
      `A rectangle has sides $${a}$ cm and $${b}$ cm. Find its area.`,
      String(a * b),
      [{ text: 'The area of a rectangle is the product of its sides:', tex: `S = ${a} \\cdot ${b} = ${a * b}` }],
      ['Rectangle area formula: $S = ab$.', `Substitute the numbers: $S = ${a}\\cdot${b}$.`],
      PLAIN_HINT,
    )
  }
  const baseHalf = rng.int(2, 8)
  const base = baseHalf * 2
  const height = rng.int(3, 12)
  const area = baseHalf * height
  return build(
    `A triangle has base $${base}$ cm and height $${height}$ cm. Find its area.`,
    String(area),
    [{ text: 'The area of a triangle is half the product of its base and height:', tex: `S = \\frac{1}{2}\\cdot ${base}\\cdot ${height} = ${area}` }],
    ['Triangle area formula: $S = \\frac{1}{2}ah$.', `Substitute the numbers: $S=\\frac{1}{2}\\cdot ${base}\\cdot ${height}$.`],
    PLAIN_HINT,
  )
}

function circle(rng: Rng): Problem {
  const r = rng.int(2, 9)
  if (rng.chance(0.5)) {
    const value = `${r * r}\\pi`
    return build(
      `A circle has radius $${r}$ cm. Find its area. Leave $\\pi$ exact.`,
      value,
      [{ text: 'Circle area:', tex: `S = \\pi r^2 = \\pi \\cdot ${r}^2 = ${value}` }],
      ['Circle area formula: $S = \\pi r^2$.', 'Square the radius and multiply by $\\pi$, without converting it to a decimal.'],
      PI_HINT,
    )
  }
  const value = `${2 * r}\\pi`
  return build(
    `A circle has radius $${r}$ cm. Find its circumference. Leave $\\pi$ exact.`,
    value,
    [{ text: 'Circumference:', tex: `C = 2\\pi r = 2\\pi\\cdot ${r} = ${value}` }],
    ['Circumference formula: $C = 2\\pi r$.', 'Multiply the radius by $2\\pi$, without converting $\\pi$ to a decimal.'],
    PI_HINT,
  )
}

function volume(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.4) {
    const r = rng.int(2, 6)
    const h = rng.int(3, 10)
    const value = `${r * r * h}\\pi`
    return build(
      `A cylinder has radius $${r}$ cm and height $${h}$ cm. Find its volume. Leave $\\pi$ exact.`,
      value,
      [{ text: 'Cylinder volume:', tex: `V = \\pi r^2 h = \\pi\\cdot ${r}^2\\cdot ${h} = ${value}` }],
      ['Cylinder volume formula: $V=\\pi r^2 h$.', 'First square the radius, then multiply by the height and by $\\pi$.'],
      PI_HINT,
    )
  }
  if (roll < 0.75) {
    const k = rng.int(1, 3)
    const r = 3 * k
    const value = `${36 * k * k * k}\\pi`
    return build(
      `A sphere has radius $${r}$ cm. Find its volume. Leave $\\pi$ exact.`,
      value,
      [{ text: 'Sphere volume:', tex: `V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\pi\\cdot ${r}^3 = ${value}` }],
      ['Sphere volume formula: $V=\\frac{4}{3}\\pi r^3$.', 'Cube the radius, then multiply by $\\frac{4}{3}$ and by $\\pi$.'],
      PI_HINT,
    )
  }
  const width = rng.int(2, 6) * 2
  const rectHeight = rng.int(3, 8)
  const triHeight = rng.int(2, 6)
  const area = width * rectHeight + (width * triHeight) / 2
  return build(
    `A figure is a rectangle $${width}$ cm wide and $${rectHeight}$ cm tall, topped by a triangle with the same base and height $${triHeight}$ cm. Find the total area.`,
    String(area),
    [
      { text: 'Area of the rectangular part:', tex: `S_1 = ${width}\\cdot ${rectHeight} = ${width * rectHeight}` },
      { text: 'Area of the triangular part:', tex: `S_2 = \\frac{1}{2}\\cdot ${width}\\cdot ${triHeight} = ${(width * triHeight) / 2}` },
      { text: 'Total area is the sum of the parts:', tex: `S = S_1 + S_2 = ${area}` },
    ],
    ['Split the figure into a rectangle and a triangle.', 'Find the area of each part separately, then add them.'],
    PLAIN_HINT,
  )
}

export const template: SkillTemplate = {
  skillId: 'geometry',
  theory,
  expectedSeconds: { 1: 45, 2: 80, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? rectangleOrTriangle(rng) : tier === 2 ? circle(rng) : volume(rng)),
}
