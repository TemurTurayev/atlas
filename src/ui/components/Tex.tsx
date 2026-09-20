import katex from 'katex'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { splitMath } from '../format'

export function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const host = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const element = host.current
    if (element) katex.render(tex, element, { displayMode: display, throwOnError: false, strict: false })
  }, [tex, display])
  return <span ref={host} className={display ? 'block my-3 text-center' : ''} />
}

/** Renders text whose formulas are wrapped in $…$. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => splitMath(text), [text])
  return (
    <span className={className}>
      {parts.map((part, i) => (part.math ? <Tex key={i} tex={part.text} /> : <span key={i}>{part.text}</span>))}
    </span>
  )
}
