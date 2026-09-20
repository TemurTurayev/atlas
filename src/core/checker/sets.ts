import { approxClose, exactClose, hasDecimal } from './compare'
import { normalizeLatex } from './normalize'
import { correct, incorrect, malformed, MSG, type CheckResult } from './result'
import { isEmptySetLatex, splitAnswerList, splitTopLevel } from './split'
import { evaluateItem, mustEvaluate, uniqueValues } from './values'

type Tuple = readonly number[]

export function setDiagnosis(refCount: number, userCount: number, missing: number, extra: number): string | undefined {
  if (refCount === 0) return 'Здесь решений нет — ответ ∅'
  if (userCount === 0) return 'Решения есть'
  if (extra === 0) return `Найдено ${refCount - missing} из ${refCount}`
  if (missing === 0) return 'Есть лишние значения'
  return undefined
}

function userItems(input: string): string[] {
  return isEmptySetLatex(input) ? [] : splitAnswerList(input)
}

export function checkNumberSet(reference: readonly string[], latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const values: number[] = []
  for (const item of userItems(input)) {
    const v = evaluateItem(item)
    if (v === null) return malformed(`Не получилось вычислить «${item}»`)
    values.push(v)
  }
  const user = uniqueValues(values)
  const ref = uniqueValues(reference.map(mustEvaluate))
  const same = hasDecimal(input) ? approxClose : exactClose
  const missing = ref.filter((r) => !user.some((u) => same(u, r))).length
  const extra = user.filter((u) => !ref.some((r) => same(u, r))).length
  if (missing === 0 && extra === 0) return correct()
  return incorrect(setDiagnosis(ref.length, user.length, missing, extra))
}

function parseElement(item: string): Tuple | null {
  const s = item.trim()
  if (s.startsWith('(') && s.endsWith(')')) {
    const parts = splitTopLevel(s.slice(1, -1))
    if (parts.length > 1) {
      const values = parts.map(evaluateItem)
      return values.every((v): v is number => v !== null) ? values : null
    }
  }
  const v = evaluateItem(s)
  return v === null ? null : [v]
}

const sameTuple = (a: Tuple, b: Tuple): boolean => a.length === b.length && a.every((x, i) => exactClose(x, b[i]))

export function checkFiniteSet(reference: readonly string[], latex: string): CheckResult {
  const input = normalizeLatex(latex)
  if (input === '') return malformed(MSG.empty)
  const user: Tuple[] = []
  for (const item of userItems(input)) {
    const element = parseElement(item)
    if (!element) return malformed(`Не получилось разобрать элемент «${item}»`)
    if (!user.some((u) => sameTuple(u, element))) user.push(element)
  }
  const ref = reference.map((r) => {
    const element = parseElement(r)
    if (!element) throw new Error(`Invalid reference element: ${r}`)
    return element
  })
  const missing = ref.filter((r) => !user.some((u) => sameTuple(u, r))).length
  const extra = user.filter((u) => !ref.some((r) => sameTuple(u, r))).length
  if (missing === 0 && extra === 0) return correct()
  return incorrect(setDiagnosis(ref.length, user.length, missing, extra))
}
