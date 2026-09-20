/** Contents of every $…$ segment in a text. */
export function mathSegments(text: string): string[] {
  return [...text.matchAll(/\$([^$]+)\$/g)].map((m) => m[1])
}
