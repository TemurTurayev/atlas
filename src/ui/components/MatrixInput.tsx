import { MathInput } from './MathInput'

interface Props {
  readonly rows: readonly (readonly string[])[]
  readonly onChange: (rows: readonly (readonly string[])[]) => void
  readonly onSubmit: () => void
  readonly disabled: boolean
}

const bracket = 'w-2 border-y-2 border-line'

/** A grid of fields, one per entry, between two brackets. */
export function MatrixInput({ rows, onChange, onSubmit, disabled }: Props) {
  const set = (i: number, j: number, latex: string) =>
    onChange(rows.map((row, ri) => (ri === i ? row.map((c, cj) => (cj === j ? latex : c)) : row)))

  return (
    <div className="math-grid flex items-stretch gap-2">
      <span className={`${bracket} border-l-2 rounded-l`} />
      <div className="flex-1 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            {row.map((value, j) => (
              <div key={j} className="flex-1">
                <MathInput
                  value={value}
                  autoFocus={i === 0 && j === 0}
                  onChange={(latex) => set(i, j, latex)}
                  onEnter={onSubmit}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <span className={`${bracket} border-r-2 rounded-r`} />
    </div>
  )
}
