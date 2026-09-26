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

const WEEK_TITLE: Readonly<Record<number, string>> = {
  0: 'Foundations (school algebra)',
  1: 'Week 1 — sets and functions',
  2: 'Week 2 — vectors',
  3: 'Week 3 — matrices',
  4: 'Week 4 — eigenvalues',
  5: 'Week 5 — derivatives and integrals',
  6: 'Week 6 — multivariable functions',
  7: 'Week 7 — differential equations',
  9: 'Week 9 — probability and statistics',
  10: 'Week 10 — inferential statistics',
  12: 'Week 12 — coordinates and complex numbers',
  13: 'Week 13 — mechanics',
  14: 'Week 14 — thermodynamics',
}

/** weekTitle(2) → 'Week 2 — vectors'. */
export const weekTitle = (week: number): string => WEEK_TITLE[week] ?? `Week ${week}`

/** countOf(3, 'skill') → '3 skills'. */
export const countOf = (n: number, one: string, many = `${one}s`): string => `${n} ${plural(n, one, many)}`
