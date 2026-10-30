import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const DIST = resolve(__dirname, '../dist')
const IMPORT_PATTERN = /(?:import|export)\s*(?:[^'"]*?\bfrom\s*)?['"]([^'"]+)['"]/g

// Optional peers must only be reachable from their dedicated subpath entries.
const OPTIONAL_PEERS = ['@tanstack/solid-table', '@tanstack/virtual-core']

function collectBareImports(entry: string): Set<string> {
  const bare = new Set<string>()
  const seen = new Set<string>()
  const queue = [join(DIST, entry)]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) {
      continue
    }
    seen.add(file)
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT_PATTERN)) {
      if (specifier.startsWith('.')) {
        // Declarations import `./x.mjs`; the declaration for it is `./x.d.mts`.
        const target = file.endsWith('.d.mts') ? specifier.replace(/\.mjs$/, '.d.mts') : specifier
        queue.push(resolve(dirname(file), target))
      } else {
        bare.add(specifier)
      }
    }
  }
  return bare
}

describe.skipIf(!existsSync(join(DIST, 'index.mjs')))('package entry boundaries', () => {
  test.each(['index.mjs', 'index.jsx'])('%s does not import optional peers', (entry) => {
    const imports = collectBareImports(entry)
    for (const peer of OPTIONAL_PEERS) {
      expect([...imports].filter((name) => name.startsWith(peer))).toEqual([])
    }
  })

  test('data-table entry imports TanStack Table', () => {
    expect(collectBareImports('data-table.mjs')).toContain('@tanstack/solid-table')
  })

  // Consumers type-check against declarations, so they must keep the same boundaries.
  test.each([
    ['index.d.mts', OPTIONAL_PEERS],
    ['data-table.mjs', ['@tanstack/virtual-core']],
    ['data-table.d.mts', ['@tanstack/virtual-core']],
    ['virtualizer.d.mts', ['@tanstack/solid-table']],
  ])('%s does not reach %j', (entry, peers) => {
    const imports = collectBareImports(entry)
    for (const peer of peers) {
      expect([...imports].filter((name) => name.startsWith(peer))).toEqual([])
    }
  })
})
