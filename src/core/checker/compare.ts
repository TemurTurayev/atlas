/** Exact answers: floating-point noise only. */
export const exactClose = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

/** Decimal answers: about 3 significant figures (0.2 % relative). */
export const approxClose = (a: number, b: number): boolean => Math.abs(a - b) <= 2e-3 * Math.max(Math.abs(b), 1e-3)

/** Sampled expression values. */
export const sampleClose = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b))

/** Equality that also treats equal infinities as equal. */
export const sameEndpoint = (a: number, b: number): boolean => a === b || (Number.isFinite(a) && Number.isFinite(b) && exactClose(a, b))

export const hasDecimal = (latex: string): boolean => /\.\d/.test(latex)
