import { MathfieldElement } from 'mathlive'
import { useEffect, useRef } from 'react'

interface Props {
  readonly value: string
  readonly onChange: (latex: string) => void
  readonly onEnter: () => void
  readonly disabled?: boolean
}

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
export function MathInput({ value, onChange, onEnter, disabled = false }: Props) {
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
    mf.focus()
    return () => {
      mf.removeEventListener('input', onInput)
      mf.removeEventListener('keydown', onKeyDown)
      mf.blur()
      releaseFocus(internals)
      mf.remove()
      field.current = null
    }
  }, [])

  useEffect(() => {
    const mf = field.current
    if (mf && mf.value !== value) mf.value = value
  }, [value])

  useEffect(() => {
    const mf = field.current
    if (mf) mf.readOnly = disabled
  }, [disabled])

  return <div ref={host} />
}
