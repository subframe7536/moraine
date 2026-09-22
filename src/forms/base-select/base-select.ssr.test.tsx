import { fireEvent } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { BaseSelect } from './base-select.tsx'
test('hydrates the standard BaseSelect Control and Trigger anatomy', () => {
  const { container } = hydrateFixture(
    '/src/forms/base-select/base-select.ssr.fixture.tsx',
    'renderBaseSelectFixture',
    () => (
      <BaseSelect
        id="primitive"
        name="choice"
        items={[{ value: 1, label: 'One' }]}
        defaultValue={[1]}
      >
        <BaseSelect.Control>
          <BaseSelect.Trigger>
            {(state) => <Show when={state.value[0] === 1}>One</Show>}
          </BaseSelect.Trigger>
        </BaseSelect.Control>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Item value={1} label="One" />
          </BaseSelect.Listbox>
          <BaseSelect.Empty>Empty</BaseSelect.Empty>
        </BaseSelect.Content>
      </BaseSelect>
    ),
  )
  expect(container.querySelector('[data-slot="root"]')).toBeNull()
  const control = container.querySelector('[data-slot="control"]')!
  const trigger = container.querySelector('button')!
  expect(trigger.parentElement).toBe(control)
  expect(trigger.textContent).toBe('One')
  expect(trigger.type).toBe('button')
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  expect(document.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBe('true')
})

test('hydrates flattened Item fields and preserves its JSX label on updates', () => {
  const [disabled, setDisabled] = createSignal(false)
  let labelMounts = 0
  function Label() {
    labelMounts += 1
    return <span>One</span>
  }
  const { container } = hydrateFixture(
    '/src/forms/base-select/base-select.ssr.fixture.tsx',
    'renderFlatBaseSelectItemFixture',
    () => (
      <BaseSelect items={[{ value: 1, label: 'One', disabled: disabled() }]} defaultValue={[1]}>
        <BaseSelect.Listbox>
          <BaseSelect.Item value={1} label={<Label />} disabled={disabled()} />
        </BaseSelect.Listbox>
      </BaseSelect>
    ),
  )
  const option = container.querySelector('[role="option"]')!
  const label = option.querySelector('span')!
  expect(option.getAttribute('aria-selected')).toBe('true')
  expect(label.textContent).toBe('One')
  expect(labelMounts).toBe(1)
  setDisabled(true)
  expect(option.getAttribute('aria-disabled')).toBe('true')
  expect(option.querySelector('span')).toBe(label)
  expect(labelMounts).toBe(1)
})
