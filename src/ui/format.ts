export interface TextPart {
  readonly math: boolean
  readonly text: string
}

/** Splits "Solve $x+1$ now" into prose and math parts. */
export function splitMath(text: string): TextPart[] {
  return text
    .split(/(\$[^$]+\$)/g)
    .filter((chunk) => chunk !== '')
    .map((chunk) =>
      chunk.startsWith('$') && chunk.endsWith('$') && chunk.length > 2
        ? { math: true, text: chunk.slice(1, -1) }
        : { math: false, text: chunk },
    )
}

export const formatPercent = (value: number): string => `${Math.round(value * 100)}%`

/** plural(2, 'skill') → 'skills'; pass `many` for irregulars. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many
}

/** countOf(3, 'skill') → '3 skills'. */
export const countOf = (n: number, one: string, many = `${one}s`): string => `${n} ${plural(n, one, many)}`
