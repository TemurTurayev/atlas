import { normalizeLatex } from './normalize'

const OPENERS = new Set(['(', '[', '{'])
const CLOSERS = new Set([')', ']', '}'])

/** Splits at separators that are not inside (), [] or {}. Empty parts are dropped. */
export function splitTopLevel(latex: string, separators: readonly string[] = [',', ';']): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of latex) {
    if (OPENERS.has(ch)) depth += 1
    else if (CLOSERS.has(ch)) depth -= 1
    if (depth === 0 && separators.includes(ch)) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current.trim())
  return parts.filter((p) => p !== '')
}

function wrapsWhole(s: string, open: string, close: string): boolean {
  if (!s.startsWith(open) || !s.endsWith(close)) return false
  let depth = 0
  for (let i = 0; i < s.length; i += 1) {
    if (s.startsWith(open, i)) {
      depth += 1
      i += open.length - 1
    } else if (s.startsWith(close, i)) {
      depth -= 1
      if (depth === 0 && i + close.length < s.length) return false
      i += close.length - 1
    }
  }
  return depth === 0
}

/** Removes outer "\{ … \}" (or "{ … }") when it wraps the whole string. */
export function stripSetBraces(latex: string): string {
  const s = latex.trim()
  if (wrapsWhole(s, '\\{', '\\}')) return s.slice(2, -2).trim()
  if (!s.startsWith('\\') && wrapsWhole(s, '{', '}')) return s.slice(1, -1).trim()
  return s
}

const EMPTY_SET_SPELLINGS: ReadonlySet<string> = new Set(['\\emptyset', '\\varnothing', '∅', '\\{\\}', '{}', 'none', 'нет', 'empty'])

export function isEmptySetLatex(latex: string): boolean {
  const s = normalizeLatex(latex)
    .replace(/\\(?:text|mathrm)\{([^}]*)\}/g, '$1')
    .replace(/\s+/g, '')
    .toLowerCase()
  return EMPTY_SET_SPELLINGS.has(s)
}

/** "x=2" → "2", "x_{1}=-3" → "-3". */
export function stripAssignment(item: string): string {
  const parts = splitTopLevel(item, ['='])
  return parts.length > 1 ? parts[parts.length - 1] : item
}

/** Expands every \pm / \mp into two alternatives: "1\pm\sqrt{2}" → ["1+\sqrt{2}", "1-\sqrt{2}"]. */
export function expandPlusMinus(item: string): string[] {
  const match = item.match(/\\pm|\\mp/)
  if (!match || match.index === undefined) return [item]
  const before = item.slice(0, match.index)
  const after = item.slice(match.index + match[0].length)
  const [first, second] = match[0] === '\\pm' ? ['+', '-'] : ['-', '+']
  return [...expandPlusMinus(`${before}${first}${after}`), ...expandPlusMinus(`${before}${second}${after}`)]
}

/** Normalise → strip set braces → split → drop "x=" → expand ±. */
export function splitAnswerList(latex: string): string[] {
  const inner = stripSetBraces(normalizeLatex(latex))
  return splitTopLevel(inner).map(stripAssignment).flatMap(expandPlusMinus)
}
