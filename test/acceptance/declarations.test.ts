// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const dist = resolve(import.meta.dirname, '../../dist')
function namespace(name: string): string {
  const files: Record<string, string> = {
    ButtonT: 'elements/button/button.types.d.mts',
    InputT: 'forms/input/input.types.d.mts',
    SelectT: 'forms/select/select.types.d.mts',
  }
  const declarations = readFileSync(resolve(dist, files[name]), 'utf8')
  const start = declarations.indexOf(`declare namespace ${name} {`)
  expect(start).toBeGreaterThan(-1)
  const end = declarations.indexOf('\n}', start)
  return declarations.slice(start, end)
}

describe('published declarations', () => {
  test('retain documented Variants, official defaults and slots', () => {
    const button = namespace('ButtonT')
    expect(button).toMatch(/Visual size of the component\.[\s\S]*?@default 'md'[\s\S]*?size\?:/)
    expect(button).toContain(
      'Interactive button element, or the polymorphic element provided through `as`.',
    )
    expect(namespace('InputT')).toContain('Native text input element.')
    expect(readFileSync(resolve(dist, 'forms/select/shared/types.d.mts'), 'utf8')).toContain(
      'Custom item presentation.',
    )
    expect(namespace('SelectT')).toMatch(/interface Slot<T = unknown>/)
  })

  test('retain native Input inheritance, owned prop documentation, and generic Select callbacks', () => {
    const input = namespace('InputT')
    expect(input).toContain('Omit<JSX.InputHTMLAttributes<HTMLInputElement>')
    expect(input).toContain('The delay in milliseconds before automatically focusing the input.')
    expect(input).toContain('ref?: Ref<HTMLInputElement>')
    expect(input).toContain('onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>')
    expect(namespace('SelectT')).toContain(
      "onChange?: (value: NoInfer<TItem['value'] | null>) => void",
    )
    expect(readFileSync(resolve(dist, 'forms/select/base-select.types.d.mts'), 'utf8')).toContain(
      'items?: readonly TItem[]',
    )
  })
})
