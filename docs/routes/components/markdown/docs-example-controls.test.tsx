import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createStore } from 'solid-js/store'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  DocsExampleControls,
  getDocsExampleControlDefaults,
  normalizeDocsExampleControls,
} from './docs-example-controls.tsx'
import type { DocsExampleControl } from './docs-example-controls.tsx'

const CONTROLS = [
  { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Save' },
  { kind: 'input', prop: 'count', label: 'Count', defaultValue: 2, inputType: 'number' },
  {
    kind: 'select',
    prop: 'variant',
    label: 'Variant',
    defaultValue: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Secondary', value: 'secondary' },
    ],
  },
  { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
] as const satisfies readonly DocsExampleControl[]

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('normalizeDocsExampleControls', () => {
  test('keeps valid primitive controls and their authored order', () => {
    const controls = normalizeDocsExampleControls(CONTROLS)

    expect(controls).toEqual(CONTROLS)
    expect(getDocsExampleControlDefaults(controls)).toEqual({
      label: 'Save',
      count: 2,
      variant: 'default',
      disabled: false,
    })
  })

  test('deterministically drops malformed controls and duplicate props', () => {
    const controls = normalizeDocsExampleControls([
      { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Save' },
      { kind: 'switch', prop: 'label', label: 'Duplicate', defaultValue: false },
      { kind: 'input', prop: 'type', label: 'Type', defaultValue: 'text', inputType: 'email' },
      {
        kind: 'select',
        prop: 'variant',
        label: 'Variant',
        defaultValue: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Again', value: 'default' },
        ],
      },
      { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
    ])

    expect(controls).toEqual([
      { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Save', inputType: undefined },
      { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
    ])
  })

  test('rejects a configuration above the five-control ceiling with a diagnostic', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const controls = normalizeDocsExampleControls([
      { kind: 'switch', prop: 'one', label: 'One', defaultValue: false },
      { kind: 'switch', prop: 'two', label: 'Two', defaultValue: false },
      { kind: 'switch', prop: 'three', label: 'Three', defaultValue: false },
      { kind: 'switch', prop: 'four', label: 'Four', defaultValue: false },
      { kind: 'switch', prop: 'five', label: 'Five', defaultValue: false },
      { kind: 'switch', prop: 'six', label: 'Six', defaultValue: false },
    ])

    expect(controls).toEqual([])
    expect(warn).toHaveBeenCalledWith(
      '[docs-example-controls] A playground accepts at most five controls.',
    )
  })
})

describe('DocsExampleControls', () => {
  test('updates primitive values and never sends NaN for an empty number input', async () => {
    const changes = vi.fn()

    function Fixture() {
      const [values, setValues] = createStore(getDocsExampleControlDefaults(CONTROLS))

      return (
        <DocsExampleControls
          controls={CONTROLS}
          values={values}
          onChange={(prop, value) => {
            changes(prop, value)
            setValues(prop, value)
          }}
          onReset={() => setValues(getDocsExampleControlDefaults(CONTROLS))}
        />
      )
    }

    render(() => <Fixture />)

    const label = screen.getByLabelText('Label') as HTMLInputElement
    const count = screen.getByLabelText('Count') as HTMLInputElement
    const disabled = screen.getByRole('switch', { name: 'Disabled' })

    await fireEvent.input(label, { target: { value: 'Publish' } })
    await fireEvent.input(count, { target: { value: '' } })
    await fireEvent.click(disabled)
    await fireEvent.keyDown(disabled, { key: ' ' })

    expect(changes).toHaveBeenCalledWith('label', 'Publish')
    expect(changes).not.toHaveBeenCalledWith('count', expect.any(Number))
    expect(changes).toHaveBeenCalledWith('disabled', true)
    expect(changes).toHaveBeenCalledWith('disabled', false)
    expect(count.value).toBe('')
    expect(screen.getByRole('button', { name: 'Reset' })).not.toBeNull()
  })
})
