import { describe, expect, test } from 'vitest'

import { getJsDoc, parseTypeScript, walkAst } from './ast'

describe('API documentation AST helpers', () => {
  test('parses TypeScript declarations and traverses nested type nodes', async () => {
    const source = await parseTypeScript(
      'demo.d.ts',
      `
/** Demo props. */
interface DemoProps {
  /** Visible label. @default "Demo" */
  label?: string | undefined
}
`,
      'ts',
    )
    const nodeTypes: string[] = []
    walkAst(source.program, (node) => nodeTypes.push(node.type))

    expect(nodeTypes).toContain('TSInterfaceDeclaration')
    expect(nodeTypes).toContain('TSUnionType')
    const declaration = source.program.body.find((node) => node.type === 'TSInterfaceDeclaration')
    expect(declaration && getJsDoc(source, declaration)).toEqual({ description: 'Demo props.' })
  })
})
