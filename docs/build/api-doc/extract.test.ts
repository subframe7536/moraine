import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { generateApiDoc, normalizePathForComparison, shouldIncludeInheritedGroup } from './extract'

async function createTempProject(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), 'moraine-api-doc-'))
}

async function writeSource(
  projectRoot: string,
  relativePath: string,
  content: string,
): Promise<void> {
  const filePath = path.join(projectRoot, relativePath)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
}

describe('generateApiDoc', () => {
  test('returns null when src is missing', async () => {
    const projectRoot = await createTempProject()

    expect(generateApiDoc(projectRoot)).toBeNull()

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('extracts component docs directly from source', async () => {
    const projectRoot = await createTempProject()
    await writeSource(
      projectRoot,
      'src/forms/demo/demo.tsx',
      `export namespace DemoT {
  export interface Slot {
    /** Root wrapper. */
    root: {}
    /** Item row. */
    item: {}
  }

  /** Items for demo. */
  export interface Item {
    /** Label text. */
    label?: string
  }

  export interface Base {
    /** Title text. */
    title: string
    /**
     * Mode value.
     * @default "a"
     */
    mode?: 'a' | 'b'
  }

  export type Props = BaseProps<Base, never, never, never, never>
}

export type DemoProps = DemoT.Props

/** Demo component. */
export function Demo(props: DemoProps): JSX.Element {
  return <div>{props.title}</div>
}
`,
    )

    const result = generateApiDoc(projectRoot)
    const demoDoc = result?.componentDocs.get('demo')

    expect(result?.indexDoc.components.map((component) => component.key)).toContain('demo')
    expect(demoDoc?.component.category).toBe('forms')
    expect(demoDoc?.component.sourcePath).toBe('src/forms/demo/demo.tsx')
    expect(demoDoc?.component.description).toBe('Demo component.')
    expect(demoDoc?.slots).toEqual([
      { name: 'root', description: 'Root wrapper.' },
      { name: 'item', description: 'Item row.' },
    ])
    expect(demoDoc?.item).toEqual({
      description: 'Items for demo.',
      props: [
        {
          name: 'label',
          required: false,
          type: 'string | undefined',
          description: 'Label text.',
        },
      ],
    })
    expect(demoDoc?.props.own.find((prop) => prop.name === 'title')).toEqual({
      name: 'title',
      required: true,
      type: 'string',
      description: 'Title text.',
    })
    expect(demoDoc?.props.own.find((prop) => prop.name === 'mode')?.defaultValue).toBe('a')

    await rm(projectRoot, { recursive: true, force: true })
  })

  test('normalizes paths case-insensitively on Windows only', () => {
    const posixPath = 'E:/project/moraine/src/index.ts'
    const mixedCasePath = 'e:/PROJECT/moraine/src/index.ts'

    if (process.platform === 'win32') {
      expect(normalizePathForComparison(posixPath)).toBe(normalizePathForComparison(mixedCasePath))
      return
    }

    expect(normalizePathForComparison(posixPath)).not.toBe(
      normalizePathForComparison(mixedCasePath),
    )
  })

  test('filters inherited solid-js group', () => {
    expect(shouldIncludeInheritedGroup('solid-js')).toBe(false)
    expect(shouldIncludeInheritedGroup('Moraine')).toBe(true)
  })
})
