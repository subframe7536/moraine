import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const DIST = resolve(__dirname, '../dist')
const IMPORT_PATTERN = /(?:import|export)\s*(?:[^'"]*?\bfrom\s*)?['"]([^'"]+)['"]/g

// Optional peers must only be reachable from their dedicated subpath entries.
const OPTIONAL_PEERS = ['@dnd-kit/solid', '@tanstack/solid-table', '@tanstack/virtual-core']

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

  test.each(['data-table.mjs', 'data-table.jsx'])('%s imports TanStack Table', (entry) => {
    expect(collectBareImports(entry)).toContain('@tanstack/solid-table')
  })

  test.each(['virtualizer.mjs', 'virtualizer.jsx'])('%s imports TanStack Virtual', (entry) => {
    expect(collectBareImports(entry)).toContain('@tanstack/virtual-core')
  })

  test.each(['dnd.mjs', 'dnd.jsx'])('%s imports dnd kit', (entry) => {
    expect(collectBareImports(entry)).toContain('@dnd-kit/solid')
  })

  // Consumers type-check against declarations, so they must keep the same boundaries.
  test.each([
    ['index.d.mts', OPTIONAL_PEERS],
    ['data-table.mjs', ['@dnd-kit/solid', '@tanstack/virtual-core']],
    ['data-table.jsx', ['@dnd-kit/solid', '@tanstack/virtual-core']],
    ['data-table.d.mts', ['@dnd-kit/solid', '@tanstack/virtual-core']],
    ['virtualizer.mjs', ['@dnd-kit/solid', '@tanstack/solid-table']],
    ['virtualizer.jsx', ['@dnd-kit/solid', '@tanstack/solid-table']],
    ['virtualizer.d.mts', ['@dnd-kit/solid', '@tanstack/solid-table']],
    ['dnd.mjs', ['@tanstack/solid-table', '@tanstack/virtual-core']],
    ['dnd.jsx', ['@tanstack/solid-table', '@tanstack/virtual-core']],
    ['dnd.d.mts', ['@tanstack/solid-table', '@tanstack/virtual-core']],
  ])('%s does not reach %j', (entry, peers) => {
    const imports = collectBareImports(entry)
    for (const peer of peers) {
      expect([...imports].filter((name) => name.startsWith(peer))).toEqual([])
    }
  })
})
