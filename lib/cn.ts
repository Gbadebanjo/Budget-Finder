/**
 * Tiny classnames merger. Mirrors `clsx` API for the bits we need
 * without adding a dependency.
 */
type Val = string | number | false | null | undefined | Record<string, unknown> | Val[]

export function cn(...inputs: Val[]): string {
  const out: string[] = []
  const push = (v: Val) => {
    if (!v) return
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v))
      return
    }
    if (Array.isArray(v)) {
      for (const x of v) push(x)
      return
    }
    if (typeof v === 'object') {
      for (const k in v) if ((v as Record<string, unknown>)[k]) out.push(k)
    }
  }
  for (const i of inputs) push(i)
  return out.join(' ')
}
