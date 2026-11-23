import { describe, expect, test } from 'vitest'

import { getJsDoc, parseTypeScript } from './ast.ts'
describe('API documentation AST helpers', () => {
  test('associates JSDoc descriptions and defaults with declarations and properties', async () => {
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
    const declaration = source.program.body.find((node) => node.type === 'TSInterfaceDeclaration')
    expect(declaration && getJsDoc(source, declaration)).toEqual({ description: 'Demo props.' })
    const property = declaration?.body.body[0]
    expect(property && getJsDoc(source, property)).toEqual({
      description: 'Visible label.',
      defaultValue: '"Demo"',
    })
  })

  test('collects multi-line examples and keeps tags inside fences out of the description', async () => {
    const source = await parseTypeScript(
      'demo.d.ts',
      `
interface DemoProps {
  /**
   * Format with \`Intl.NumberFormat\`.
   *
   * Second paragraph.
   * @default 'a'
   * @example
   * \`\`\`tsx
   * <Demo format={{ '@sm': 1 }} />
   * \`\`\`
   * @example 3 // inline
   */
  format?: string
}
`,
      'ts',
    )
    const declaration = source.program.body.find((node) => node.type === 'TSInterfaceDeclaration')
    const property = declaration?.body.body[0]
    expect(property && getJsDoc(source, property)).toEqual({
      description: 'Format with `Intl.NumberFormat`.\n\nSecond paragraph.',
      defaultValue: "'a'",
      examples: ["<Demo format={{ '@sm': 1 }} />", '3 // inline'],
    })
  })
})
