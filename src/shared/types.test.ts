import { describe, expect, test } from 'vitest'

import { getJsDoc, parseTypeScript, walkAst } from '../../docs/build/api-doc/ast.ts'

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
  })
})
