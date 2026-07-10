import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { extractSourceAttributeReference } from './attributes'

describe('extractSourceAttributeReference', () => {
  test('collects JSX attributes, slot metadata, CSS variables, and local component imports', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-attributes-'))
    const sourceDirectory = path.join(projectRoot, 'src')
    await mkdir(sourceDirectory, { recursive: true })
    await writeFile(
      path.join(sourceDirectory, 'child.tsx'),
      `export function Child() { return <div data-slot="child" data-state="open" /> }`,
      'utf8',
    )
    await writeFile(
      path.join(sourceDirectory, 'demo.tsx'),
      `
import { Child } from './child'
export function Demo() {
  return <section data-slot="root" aria-label={'Demo'} data-active style={{ '--demo-size': '1rem' }}><Child /></section>
}
`,
      'utf8',
    )

    const result = await extractSourceAttributeReference(projectRoot, 'src/demo.tsx')
    expect(result.aria.map((attribute) => attribute.name)).toEqual(['aria-label'])
    expect(result.data.map((attribute) => attribute.name)).toEqual([
      'data-active',
      'data-slot',
      'data-state',
    ])
    expect(result.slots).toEqual([
      {
        name: 'child',
        cssVariables: [],
        dataAttributes: [expect.objectContaining({ name: 'data-state' })],
        ariaAttributes: [],
      },
      {
        name: 'root',
        cssVariables: [expect.objectContaining({ name: '--demo-size' })],
        dataAttributes: [expect.objectContaining({ name: 'data-active' })],
        ariaAttributes: [expect.objectContaining({ name: 'aria-label' })],
      },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })
})
