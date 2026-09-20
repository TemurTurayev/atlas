import type { UserAnswer } from '../../core/checker/check'
import type { AnswerSpec } from '../../core/templates/types'
import { IntervalInput } from './IntervalInput'
import { MathInput } from './MathInput'
import { RichText } from './Tex'

interface Props {
  readonly spec: AnswerSpec
  readonly answer: UserAnswer
  readonly onChange: (answer: UserAnswer) => void
  readonly onSubmit: () => void
  readonly disabled: boolean
}

export const emptyAnswer = (spec: AnswerSpec): UserAnswer => {
  if (spec.kind === 'interval') return { kind: 'interval', parts: [{ lo: '0', hi: '1', loClosed: false, hiClosed: false }] }
  if (spec.kind === 'choice') return { kind: 'choice', id: '' }
  return { kind: 'latex', latex: '' }
}

export function AnswerInput({ spec, answer, onChange, onSubmit, disabled }: Props) {
  if (spec.kind === 'choice' && answer.kind === 'choice') {
    return (
      <div className="grid gap-2">
        {spec.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange({ kind: 'choice', id: option.id })}
            className={`text-left px-4 py-3 rounded-xl border ${answer.id === option.id ? 'border-accent bg-raised' : 'border-line bg-surface'} disabled:opacity-60`}
          >
            <RichText text={option.label} />
          </button>
        ))}
      </div>
    )
  }
  if (spec.kind === 'interval' && answer.kind === 'interval') {
    return <IntervalInput parts={answer.parts} onChange={(parts) => onChange({ kind: 'interval', parts })} disabled={disabled} />
  }
  return (
    <MathInput
      value={answer.kind === 'latex' ? answer.latex : ''}
      onChange={(latex) => onChange({ kind: 'latex', latex })}
      onEnter={onSubmit}
      disabled={disabled}
    />
  )
}
