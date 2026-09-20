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

/** Russian plural: plural(2, 'навык', 'навыка', 'навыков') → 'навыка'. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
