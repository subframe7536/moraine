import { describe, expect, test } from 'vitest'

import { preprocessGenericTypeAliases } from './transform-types.ts'

describe('preprocessGenericTypeAliases', () => {
  test('applies function defaults to referenced aliases without reprinting unrelated source', async () => {
    const source = `
type BaseProps<T> = { as?: T }
type DemoProps<T = 'button'> = { value?: T } & BaseProps<T>

/** Keeps this comment and formatting. */
declare function Demo<T = 'button'>(props: DemoProps<T>): JSX.Element
`

    const output = await preprocessGenericTypeAliases(source, 'demo.d.ts')
    expect(output).toContain(`type DemoProps = { value?: 'button' } & BaseProps<'button'>`)
    expect(output).toContain(`declare function Demo(props: DemoProps): JSX.Element`)
    expect(output).toContain('/** Keeps this comment and formatting. */')
  })

  test('returns source unchanged when no referenced generic defaults need preprocessing', async () => {
    const source = `type Value<T> = T\ndeclare function read(value: string): string\n`
    expect(await preprocessGenericTypeAliases(source, 'value.d.ts')).toBe(source)
  })
})
