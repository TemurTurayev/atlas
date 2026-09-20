import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Площадь прямоугольника (rectangle area): $S = ab$. Площадь треугольника (triangle area): $S = \\frac{1}{2}ah$.',
  'Площадь круга (circle area): $S = \\pi r^2$. Длина окружности (circumference): $C = 2\\pi r$.',
  'Объём цилиндра (cylinder volume): $V = \\pi r^2 h$. Объём шара (sphere volume): $V = \\frac{4}{3}\\pi r^3$.',
  'Пока не сказано округлить — оставляй $\\pi$ точным, не заменяй на 3.14.',
  'Составную фигуру (composite figure) разбей на простые части и сложи (или вычти) их площади.',
  'Типичные ошибки: забыть множитель $\\frac{1}{2}$ у треугольника; не возвести радиус в квадрат.',
].join('\n')

const PLAIN_HINT = 'Введи целое число'
const PI_HINT = 'Если в ответе есть π, оставь его точным — не переводи в 3.14'

function build(en: string, ru: string, value: string, solution: Problem['solution'], hints: readonly string[], inputHint: string): Problem {
  return { statement: { en, ru }, answer: { kind: 'number', value }, solution, hints, inputHint }
}

function rectangleOrTriangle(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const a = rng.int(3, 12)
    const b = rng.int(3, 12)
    return build(
      `A rectangle has sides $${a}$ cm and $${b}$ cm. Find its area.`,
      `Стороны прямоугольника — $${a}$ см и $${b}$ см. Найди его площадь.`,
      String(a * b),
      [{ ru: 'Площадь прямоугольника — произведение сторон:', tex: `S = ${a} \\cdot ${b} = ${a * b}` }],
      ['Формула площади прямоугольника: $S = ab$.', `Подставь числа: $S = ${a}\\cdot${b}$.`],
      PLAIN_HINT,
    )
  }
  const baseHalf = rng.int(2, 8)
  const base = baseHalf * 2
  const height = rng.int(3, 12)
  const area = baseHalf * height
  return build(
    `A triangle has base $${base}$ cm and height $${height}$ cm. Find its area.`,
    `Основание треугольника — $${base}$ см, высота — $${height}$ см. Найди его площадь.`,
    String(area),
    [{ ru: 'Площадь треугольника — половина произведения основания на высоту:', tex: `S = \\frac{1}{2}\\cdot ${base}\\cdot ${height} = ${area}` }],
    ['Формула площади треугольника: $S = \\frac{1}{2}ah$.', `Подставь числа: $S=\\frac{1}{2}\\cdot ${base}\\cdot ${height}$.`],
    PLAIN_HINT,
  )
}

function circle(rng: Rng): Problem {
  const r = rng.int(2, 9)
  if (rng.chance(0.5)) {
    const value = `${r * r}\\pi`
    return build(
      `A circle has radius $${r}$ cm. Find its area. Leave $\\pi$ exact.`,
      `Радиус круга — $${r}$ см. Найди его площадь. Оставь $\\pi$ в точном виде.`,
      value,
      [{ ru: 'Площадь круга:', tex: `S = \\pi r^2 = \\pi \\cdot ${r}^2 = ${value}` }],
      ['Формула площади круга: $S = \\pi r^2$.', 'Возведи радиус в квадрат и умножь на $\\pi$, не переводя его в десятичную дробь.'],
      PI_HINT,
    )
  }
  const value = `${2 * r}\\pi`
  return build(
    `A circle has radius $${r}$ cm. Find its circumference. Leave $\\pi$ exact.`,
    `Радиус круга — $${r}$ см. Найди длину окружности. Оставь $\\pi$ в точном виде.`,
    value,
    [{ ru: 'Длина окружности:', tex: `C = 2\\pi r = 2\\pi\\cdot ${r} = ${value}` }],
    ['Формула длины окружности: $C = 2\\pi r$.', 'Умножь радиус на $2\\pi$, не переводя $\\pi$ в десятичную дробь.'],
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
      `Радиус цилиндра — $${r}$ см, высота — $${h}$ см. Найди его объём. Оставь $\\pi$ в точном виде.`,
      value,
      [{ ru: 'Объём цилиндра:', tex: `V = \\pi r^2 h = \\pi\\cdot ${r}^2\\cdot ${h} = ${value}` }],
      ['Формула объёма цилиндра: $V=\\pi r^2 h$.', 'Сначала возведи радиус в квадрат, потом умножь на высоту и на $\\pi$.'],
      PI_HINT,
    )
  }
  if (roll < 0.75) {
    const k = rng.int(1, 3)
    const r = 3 * k
    const value = `${36 * k * k * k}\\pi`
    return build(
      `A sphere has radius $${r}$ cm. Find its volume. Leave $\\pi$ exact.`,
      `Радиус шара — $${r}$ см. Найди его объём. Оставь $\\pi$ в точном виде.`,
      value,
      [{ ru: 'Объём шара:', tex: `V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\pi\\cdot ${r}^3 = ${value}` }],
      ['Формула объёма шара: $V=\\frac{4}{3}\\pi r^3$.', 'Возведи радиус в куб, умножь на $\\frac{4}{3}$ и на $\\pi$.'],
      PI_HINT,
    )
  }
  const width = rng.int(2, 6) * 2
  const rectHeight = rng.int(3, 8)
  const triHeight = rng.int(2, 6)
  const area = width * rectHeight + (width * triHeight) / 2
  return build(
    `A figure is a rectangle $${width}$ cm wide and $${rectHeight}$ cm tall, topped by a triangle with the same base and height $${triHeight}$ cm. Find the total area.`,
    `Фигура состоит из прямоугольника шириной $${width}$ см и высотой $${rectHeight}$ см, сверху — треугольник с тем же основанием и высотой $${triHeight}$ см. Найди общую площадь.`,
    String(area),
    [
      { ru: 'Площадь прямоугольной части:', tex: `S_1 = ${width}\\cdot ${rectHeight} = ${width * rectHeight}` },
      { ru: 'Площадь треугольной части:', tex: `S_2 = \\frac{1}{2}\\cdot ${width}\\cdot ${triHeight} = ${(width * triHeight) / 2}` },
      { ru: 'Общая площадь — сумма частей:', tex: `S = S_1 + S_2 = ${area}` },
    ],
    ['Раздели фигуру на прямоугольник и треугольник.', 'Найди площадь каждой части отдельно, потом сложи.'],
    PLAIN_HINT,
  )
}

export const template: SkillTemplate = {
  skillId: 'geometry',
  theory,
  expectedSeconds: { 1: 45, 2: 80, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? rectangleOrTriangle(rng) : tier === 2 ? circle(rng) : volume(rng)),
}
