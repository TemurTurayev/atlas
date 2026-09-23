export type CheckResult =
  | { readonly status: 'correct'; readonly note?: string }
  | { readonly status: 'incorrect'; readonly diagnosis?: string }
  | { readonly status: 'malformed'; readonly message: string }

export const correct = (note?: string): CheckResult => (note ? { status: 'correct', note } : { status: 'correct' })
export const incorrect = (diagnosis?: string): CheckResult => (diagnosis ? { status: 'incorrect', diagnosis } : { status: 'incorrect' })
export const malformed = (message: string): CheckResult => ({ status: 'malformed', message })

export const MSG = {
  empty: 'Type an answer',
  unparsable: 'Could not read that formula — check the brackets and fractions',
  oneNumber: 'One number, please. Use a dot for decimals: 2.5',
  noVariables: 'This answer is a number, with no variables',
  wrongInput: 'This answer is entered a different way',
  sign: 'Looks like a sign slipped',
  reciprocal: 'Looks like the fraction is upside down',
  approximate: 'Correct (approximately)',
  notFactored: 'Right value, but write it as a product of factors',
  notFullyFactored: 'Right value, but it can be factored further',
  notExpanded: 'Right value, but the brackets need expanding',
  everyComponent: 'Fill in every component',
  opposite: 'This is the opposite vector — check the signs',
  wrongLength: 'Right direction, but the length is off',
} as const
