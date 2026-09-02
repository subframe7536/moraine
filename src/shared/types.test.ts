import { describe, expect, test } from 'vitest'

import { getJsDoc, parseTypeScript, walkAst } from '../../docs/build/api-doc/ast'

import type { SlotClassValue, SlotStyleValue } from './types'

interface TestSlot<T = unknown> {
  root?: T
}

type TestClasses = TestSlot<SlotClassValue>
type TestStyles = TestSlot<SlotStyleValue>

const overrides: TestClasses = { root: 'custom' }
const styles: TestStyles = { root: { color: 'red' } }

let mutableOverrides: TestClasses = {}
mutableOverrides.root = 'custom'
let mutableStyles: TestStyles = {}
mutableStyles.root = { color: 'red' }

describe('slot override docs', () => {
  test('keeps slot jsdoc on class override properties', async () => {
    const source = await parseTypeScript(
      'slot-docs.ts',
      `
type SlotClassValue = string

interface Slot<T = unknown> {
  /** Root element. */
  root?: T
}

type Classes = Slot<SlotClassValue>
const overrides: Classes = { root: 'custom' }
`,
      'ts',
    )
    let documentation = ''
    walkAst(source.program, (node) => {
      if (node.type === 'TSPropertySignature') {
        documentation = getJsDoc(source, node).description ?? documentation
      }
    })

    expect(documentation).toBe('Root element.')
    expect(overrides.root).toBe('custom')
    expect(styles.root?.color).toBe('red')
    expect(mutableOverrides.root).toBe('custom')
    expect(mutableStyles.root?.color).toBe('red')
  })
})
