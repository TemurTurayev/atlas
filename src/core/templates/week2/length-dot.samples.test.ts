import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { exactClose } from '../../checker/compare'
import { dot, norm, normSquared } from '../../math/vector'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { buildDotVectors, buildOrthogonalCase } from './dot_product'
import { buildTier1Vector, buildTier2Vector } from './vec_length'

const SEEDS = 30

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

describe('vec_length', () => {
  it('tier 1: stated length equals the norm of the recovered 2D vector', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const a = buildTier1Vector(createRng(seed))
      const p = getTemplate('vec_length').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(exactClose(norm(a), numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 2: stated length equals the norm of the recovered 3D vector', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const a = buildTier2Vector(createRng(seed))
      const p = getTemplate('vec_length').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(exactClose(Math.sqrt(normSquared(a)), numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 3: stated unit vector equals a / |a| for the recovered vector', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      // Tier 3 builds its vector the same way tier 1 does (see vec_length.ts tier3()).
      const a = buildTier1Vector(createRng(seed))
      const p = getTemplate('vec_length').generate(createRng(seed), 3)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const length = norm(a)
      p.answer.components.forEach((component, i) => {
        expect(exactClose(numberValue(component), a[i] / length), `seed ${seed} component ${i}`).toBe(true)
      })
    }
  })
})

describe('dot_product', () => {
  it('tier 1: stated dot product equals a . b for the recovered 2D vectors', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b } = buildDotVectors(createRng(seed), 2)
      const p = getTemplate('dot_product').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(exactClose(dot(a, b), numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 2: stated dot product equals a . b for the recovered 3D vectors', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b } = buildDotVectors(createRng(seed), 3)
      const p = getTemplate('dot_product').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(exactClose(dot(a, b), numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 3: the recovered vectors are genuinely orthogonal, and the stated answer is the hidden component', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const rng = createRng(seed)
      const size = rng.pick([2, 3]) // mirrors tier3()'s own first draw before building the case
      const { a, b, x } = buildOrthogonalCase(rng, size)
      const p = getTemplate('dot_product').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(exactClose(dot(a, b), 0), `seed ${seed}: recovered vectors are not orthogonal`).toBe(true)
      expect(exactClose(x, numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })
})
