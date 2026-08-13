import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { SourceSlotAnalyzer } from './attributes.ts'

describe('SourceSlotAnalyzer', () => {
  test('collects attributes by runtime slot and merges local components', async () => {
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
import { Child } from './child.tsx'
export function Demo() {
  return <section data-slot={Math.random() ? 'root' : 'alternate'} data-active aria-label="Demo" style={{ '--demo-size': '1rem' }}><Child /></section>
}
`,
      'utf8',
    )

    const result = await new SourceSlotAnalyzer(projectRoot).enrichSlots('Demo', 'src/demo.tsx', [
      { name: 'root', description: 'Root wrapper.', runtimeSlots: ['root', 'alternate'] },
      { name: 'child', runtimeSlots: ['child'] },
      { name: 'virtual', runtimeSlots: [] },
    ])

    expect(result).toEqual([
      {
        name: 'root',
        description: 'Root wrapper.',
        cssVariables: [expect.objectContaining({ name: '--demo-size' })],
        dataAttributes: [expect.objectContaining({ name: 'data-active' })],
        ariaAttributes: [expect.objectContaining({ name: 'aria-label' })],
      },
      {
        name: 'child',
        cssVariables: [],
        dataAttributes: [expect.objectContaining({ name: 'data-state' })],
        ariaAttributes: [],
      },
      { name: 'virtual', cssVariables: [], dataAttributes: [], ariaAttributes: [] },
    ])

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('follows explicit extensions, barrels, aliases, render helpers, and slot overrides', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-barrel-'))
    const sourceDirectory = path.join(projectRoot, 'src')
    await mkdir(path.join(sourceDirectory, 'parts'), { recursive: true })
    await writeFile(
      path.join(sourceDirectory, 'parts/child.tsx'),
      `export const Child = () => <div data-slot="root" aria-live="polite" />`,
      'utf8',
    )
    await writeFile(
      path.join(sourceDirectory, 'parts/index.tsx'),
      `export { Child as Child } from './child.tsx'\nexport const unrelated = () => <div data-slot="ignored" data-noise="true" />`,
      'utf8',
    )
    await writeFile(
      path.join(sourceDirectory, 'demo.tsx'),
      `
import { Child as ImportedChild } from './parts/index.tsx'
const Alias = ImportedChild
function renderHelper() { return <span data-slot="helper" data-helper="yes" /> }
export const Demo = () => <section data-slot="root"><Alias slotName="child" />{renderHelper()}</section>
`,
      'utf8',
    )

    const result = await new SourceSlotAnalyzer(projectRoot).enrichSlots('Demo', 'src/demo.tsx', [
      { name: 'root', runtimeSlots: ['root'] },
      { name: 'child', runtimeSlots: ['child'] },
      { name: 'helper', runtimeSlots: ['helper'] },
    ])

    expect(result[0]?.dataAttributes).toEqual([])
    expect(result[1]?.ariaAttributes.map((attribute) => attribute.name)).toEqual(['aria-live'])
    expect(result[2]?.dataAttributes.map((attribute) => attribute.name)).toEqual(['data-helper'])
    await rm(projectRoot, { recursive: true, force: true })
  })

  test('follows namespace component members', async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), 'moraine-api-namespace-'))
    const sourceDirectory = path.join(projectRoot, 'src')
    await mkdir(sourceDirectory, { recursive: true })
    await writeFile(
      path.join(sourceDirectory, 'modal.tsx'),
      `
export function Modal(props) { return props.children }
function ModalContent() { return <div data-slot="content" role="dialog" aria-modal="true" /> }
Modal.Content = ModalContent
`,
      'utf8',
    )
    await writeFile(path.join(sourceDirectory, 'index.ts'), `export * from './modal.tsx'`, 'utf8')
    await writeFile(
      path.join(sourceDirectory, 'dialog.tsx'),
      `
import { Modal } from './index.ts'
export function Dialog() { return <Modal><Modal.Content /></Modal> }
`,
      'utf8',
    )

    const result = await new SourceSlotAnalyzer(projectRoot).enrichSlots(
      'Dialog',
      'src/dialog.tsx',
      [{ name: 'content', runtimeSlots: ['content'] }],
    )

    expect(result[0]?.ariaAttributes.map((attribute) => attribute.name)).toEqual([
      'aria-modal',
      'role',
    ])
    await rm(projectRoot, { recursive: true, force: true })
  })
})
