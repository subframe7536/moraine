import type { ComponentApi } from './api-doc/types.ts'

export function validateAnatomy(
  source: string,
  component: string,
  sourcePath: string,
  api?: ComponentApi,
): void {
  const match = source.match(/^## Anatomy\s*\n+```text\n([\s\S]*?)\n```/m)
  if (!match) {
    throw new Error(`${component} ${sourcePath}: Anatomy requires a text fence`)
  }
  const parts = new Set(api?.parts.map((part) => part.name) ?? [])
  const slots = new Set(api?.slots ?? [])
  const lines = match[1]!.split('\n')
  for (const [index, line] of lines.entries()) {
    const fail = (reason: string): never => {
      throw new Error(`${component} ${sourcePath} anatomy line ${index + 1}: ${reason}`)
    }
    const parsed = line.match(/^[│├└─\s]*([\w.]+) \[([^\]]+)\]$/)
    if (!parsed) {
      fail('invalid annotation grammar')
    }
    const [, name, raw] = parsed!
    const tokens = raw!.split(';').map((token) => token.trim())
    const kind = tokens[0]
    if (!['component', 'part', 'slot', 'internal'].includes(kind!)) {
      fail(`unknown annotation ${kind}`)
    }
    const rest = tokens.slice(1)
    if (rest.length !== new Set(rest).size) {
      fail('duplicate annotation')
    }
    const target = rest.filter((token) => token.startsWith('slot='))
    if (target.length > 1 || rest.filter((token) => token === 'no DOM').length > 1) {
      fail('duplicate slot or DOM annotation')
    }
    if (
      rest.some(
        (token) =>
          token !== 'no DOM' && !/^slot=[\w]+$/.test(token) && !/^<[a-z][^>]*>$/.test(token),
      )
    ) {
      fail('unknown annotation field')
    }
    if (index === 0) {
      if (
        kind !== 'component' ||
        (target[0] !== 'slot=root' && !rest.includes('no DOM')) ||
        (target.length && rest.includes('no DOM'))
      ) {
        fail('component root requires slot=root or no DOM')
      }
    } else if (kind === 'component') {
      fail('only the root may be annotated as component')
    }
    if (kind === 'part' && !parts.has(name!)) {
      fail(`unknown part ${name}`)
    }
    if (kind === 'slot' && !slots.has(name!)) {
      fail(`unknown slot ${name}`)
    }
    if (target[0] && target[0] !== 'slot=root' && !slots.has(target[0].slice(5))) {
      fail(`unknown slot ${target[0].slice(5)}`)
    }
  }
}
