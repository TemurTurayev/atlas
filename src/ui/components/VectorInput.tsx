import { MathInput } from './MathInput'

interface Props {
  readonly components: readonly string[]
  readonly onChange: (components: readonly string[]) => void
  readonly onSubmit: () => void
  readonly disabled: boolean
}

const bracket = 'w-2 border-y-2 border-line'

/** A column vector: one field per component, between two brackets. */
export function VectorInput({ components, onChange, onSubmit, disabled }: Props) {
  return (
    <div className="flex items-stretch gap-2">
      <span className={`${bracket} border-l-2 rounded-l`} />
      <div className="flex-1 space-y-2">
        {components.map((value, i) => (
          <MathInput
            key={i}
            value={value}
            autoFocus={i === 0}
            onChange={(latex) => onChange(components.map((c, j) => (j === i ? latex : c)))}
            onEnter={onSubmit}
            disabled={disabled}
          />
        ))}
      </div>
      <span className={`${bracket} border-r-2 rounded-r`} />
    </div>
  )
}
