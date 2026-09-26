/** a + bi for display: "3 - 2i", "2i", "-i", "5". Parts may be numbers or LaTeX strings. */
export function formatComplex(re: number | string, im: number | string): string {
  const reStr = String(re).trim()
  const imStr = String(im).trim()

  const isReZero = reStr === '0' || re === 0
  const isImZero = imStr === '0' || im === 0

  if (isReZero && isImZero) return '0'
  if (isImZero) return reStr

  let imPart = ''
  if (imStr === '1' || im === 1) {
    imPart = 'i'
  } else if (imStr === '-1' || im === -1) {
    imPart = '-i'
  } else if (imStr.startsWith('-')) {
    const absIm = imStr.slice(1).trim()
    imPart = absIm === '1' ? '-i' : `-${absIm}i`
  } else {
    imPart = `${imStr}i`
  }

  if (isReZero) return imPart

  if (imPart.startsWith('-')) {
    return `${reStr} - ${imPart.slice(1)}`
  }
  return `${reStr} + ${imPart}`
}

/** 1st, 2nd, 3rd, 4th, 11th, 21st … */
export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  const mod10 = n % 10
  if (mod10 === 1) return `${n}st`
  if (mod10 === 2) return `${n}nd`
  if (mod10 === 3) return `${n}rd`
  return `${n}th`
}
