import { MathfieldElement } from 'mathlive'
import { useEffect, useRef } from 'react'

interface Props {
  readonly value: string
  readonly onChange: (latex: string) => void
  readonly onEnter: () => void
  readonly disabled?: boolean
  /** Only one field on a screen should take the caret. */
  readonly autoFocus?: boolean
  /** The row of symbols under the field; off inside a vector or matrix, where it would repeat. */
  readonly symbols?: boolean
}

/**
 * Symbols an answer may need that a keyboard does not have. MathLive also accepts typed shortcuts
 * ("sqrt", "pi"), but nothing on screen says so, and a learner who cannot enter the answer they
 * worked out on paper will read it as the app being wrong.
 */
const SYMBOLS: readonly { readonly label: string; readonly latex: string; readonly title: string }[] = [
  { label: '√', latex: '\\sqrt{#?}', title: 'Square root — or type sqrt' },
  { label: 'ⁿ√', latex: '\\sqrt[#?]{#?}', title: 'Root of any degree' },
  { label: 'a/b', latex: '\\frac{#?}{#?}', title: 'Fraction — or press /' },
  { label: 'xⁿ', latex: '^{#?}', title: 'Power — or press ^' },
  { label: 'π', latex: '\\pi', title: 'Pi — or type pi' },
  { label: '∞', latex: '\\infty', title: 'Infinity — or type infty' },
  { label: '±', latex: '\\pm', title: 'Plus or minus' },
]

/** MathLive's own state, reached for one thing only — see `releaseFocus`. */
interface FieldInternals {
  blurred?: boolean
}

const internalsOf = (field: MathfieldElement): FieldInternals | undefined =>
  (field as unknown as { _mathfield?: FieldInternals })._mathfield

/**
 * MathLive keeps a global pointer to the focused field and blurs it when the next field takes the
 * focus. When a field leaves the document while still focused — the exam clock handing the paper in
 * while the learner is typing, for instance — the library has already dropped that field's host, and
 * the blur then throws from deep inside MathLive and takes the whole app down. Telling the field it
 * is no longer focused is enough: the library skips it, and the next field replaces the pointer.
 * The field drops its own internals on disconnect, so the handle is taken while it is still alive.
 */
function releaseFocus(internals: FieldInternals | undefined): void {
  if (internals) internals.blurred = true
}

/** MathLive field created imperatively — avoids custom-element JSX typings. */
export function MathInput({ value, onChange, onEnter, disabled = false, autoFocus = true, symbols = true }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const field = useRef<MathfieldElement | null>(null)
  const handlers = useRef({ onChange, onEnter })
  handlers.current = { onChange, onEnter }

  useEffect(() => {
    const container = host.current
    if (!container) return undefined
    const mf = new MathfieldElement()
    mf.smartMode = false
    mf.mathVirtualKeyboardPolicy = 'manual'
    const onInput = () => handlers.current.onChange(mf.value)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        handlers.current.onEnter()
      }
    }
    mf.addEventListener('input', onInput)
    mf.addEventListener('keydown', onKeyDown)
    container.appendChild(mf)
    field.current = mf
    const internals = internalsOf(mf)
    if (autoFocus) mf.focus()
    return () => {
      mf.removeEventListener('input', onInput)
      mf.removeEventListener('keydown', onKeyDown)
      mf.blur()
      releaseFocus(internals)
      mf.remove()
      field.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the field is created once; autoFocus only matters then
  }, [])

  useEffect(() => {
    const mf = field.current
    if (mf && mf.value !== value) mf.value = value
  }, [value])

  useEffect(() => {
    const mf = field.current
    if (mf) mf.readOnly = disabled
  }, [disabled])

  const insert = (latex: string) => {
    const mf = field.current
    if (!mf || disabled) return
    mf.executeCommand(['insert', latex, { focus: true, scrollIntoView: true, selectionMode: 'placeholder' }])
    handlers.current.onChange(mf.value)
  }

  return (
    <div className="space-y-2">
      <div ref={host} />
      {symbols && !disabled && (
        <div className="flex flex-wrap gap-1.5">
          {SYMBOLS.map((symbol) => (
            <button
              key={symbol.label}
              type="button"
              title={symbol.title}
              onClick={() => insert(symbol.latex)}
              className="min-w-9 px-2.5 py-1 rounded-lg border border-line bg-raised text-sm text-muted hover:border-accent hover:text-ink"
            >
              {symbol.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
