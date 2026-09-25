// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const dist = resolve(import.meta.dirname, '../../dist')
function namespace(name: string): string {
  const files: Record<string, string> = {
    ButtonT: 'element/button/button.types.d.mts',
    InputT: 'form/input/input.types.d.mts',
    SelectT: 'form/select/select.types.d.mts',
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
    const buttonStyle = readFileSync(
      resolve(dist, 'element/button/button.style-types.d.mts'),
      'utf8',
    )
    const inputStyle = readFileSync(resolve(dist, 'form/input/input.style-types.d.mts'), 'utf8')

    expect(button).toContain('type Slot<T = unknown> = ButtonStyleSlot<T>')
    expect(button).toContain('type Variant = ButtonStyleVariant')
    expect(buttonStyle).toMatch(
      /Visual size of the component\.[\s\S]*?@default 'md'[\s\S]*?size\?:/,
    )
    expect(buttonStyle).toContain(
      'Interactive button element, or the polymorphic element provided through `as`.',
    )
    expect(namespace('InputT')).toContain('type Slot<T = unknown> = InputStyleSlot<T>')
    expect(inputStyle).toContain('Native text input element.')
    expect(readFileSync(resolve(dist, 'form/shared/select/types.d.mts'), 'utf8')).toContain(
      'Custom item presentation.',
    )
    expect(namespace('SelectT')).toContain('type Slot<T = unknown> = SelectStyleSlot<T>')
  })

  test('retain curated Input ownership, owned prop documentation, and generic Select callbacks', () => {
    const input = namespace('InputT')
    expect(input).not.toContain('Omit<JSX.InputHTMLAttributes<HTMLInputElement>')
    expect(input).toContain("BaseProps<'input', Base<M>, Variant, Classes, Styles>")
    expect(input).toContain('The delay in milliseconds before automatically focusing the input.')
    expect(input).toContain('ref?: Ref<HTMLInputElement>')
    expect(input).toContain('onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>')
    expect(namespace('SelectT')).toContain(
      "onValueChange?: (value: NoInfer<NormalizedItem<TItem>['value'] | null>) => void",
    )
    expect(
      readFileSync(resolve(dist, 'form/base-select/base-select.types.d.mts'), 'utf8'),
    ).toContain('items?: readonly TItem[]')
  })

  test('expose complete Select-family Props and owned input refs', () => {
    const select = readFileSync(resolve(dist, 'form/select/select.types.d.mts'), 'utf8')
    const combobox = readFileSync(resolve(dist, 'form/combobox/combobox.types.d.mts'), 'utf8')
    const multiSelect = readFileSync(
      resolve(dist, 'form/multi-select/multi-select.types.d.mts'),
      'utf8',
    )

    expect(select).toContain(
      'type SelectProps<TItem extends string | SelectT.Item = string | SelectT.Item> = SelectT.Props<TItem>',
    )
    expect(combobox).toContain('inputRef?: Ref<HTMLInputElement>')
    expect(multiSelect).toContain('inputRef?: Ref<HTMLInputElement>')
    expect(multiSelect).toContain('tokenSeparators?: string[]')
  })
})
