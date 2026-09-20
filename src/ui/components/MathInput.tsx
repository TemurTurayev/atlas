import { MathfieldElement } from 'mathlive'
import { useEffect, useRef } from 'react'

interface Props {
  readonly value: string
  readonly onChange: (latex: string) => void
  readonly onEnter: () => void
  readonly disabled?: boolean
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
    mf.focus()
    return () => {
      mf.removeEventListener('input', onInput)
      mf.removeEventListener('keydown', onKeyDown)
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
