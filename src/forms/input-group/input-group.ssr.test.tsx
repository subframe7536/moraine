import { fireEvent } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Icon } from '../../elements/icon/index.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'
import { Input } from '../input/input.tsx'
import { Textarea } from '../textarea/textarea.tsx'

import { InputGroup } from './input-group.tsx'

describe('InputGroup SSR hydration', () => {
  test('reuses group, control and part nodes through hydration and reactive replacement', () => {
    const [show, setShow] = createSignal(true)
    const [compact, setCompact] = createSignal(true)
    const [value, setValue] = createSignal('Server value')
    const { container } = hydrateFixture(
      '/src/forms/input-group/input-group.ssr.fixture.tsx',
      'renderInputGroupFixture',
      () => (
        <InputGroup size="lg" classes={{ leading: 'leading-class' }}>
          <Show when={show()}>
            <InputGroup.Leading compact={compact()}>
              <Icon name="icon-search" />
              <span>Prefix</span>
            </InputGroup.Leading>
          </Show>
          <Input id="group-input" value={value()} onValueChange={(next) => setValue(next ?? '')} />
          <InputGroup.Trailing>
            <button type="button">Action</button>
          </InputGroup.Trailing>
        </InputGroup>
      ),
    )
    const group = container.firstElementChild!
    const input = container.querySelector('input')!
    const leading = container.querySelector('[data-slot="input-group-leading"]')!
    expect(group.children[1]).toBe(input)
    expect(leading.hasAttribute('data-compact')).toBe(true)
    expect(
      group.querySelectorAll(
        '[data-slot="input-group-leading"], [data-slot="input-group-trailing"]',
      ),
    ).toHaveLength(2)
    setCompact(false)
    expect(leading.hasAttribute('data-compact')).toBe(false)
    expect(container.querySelector('[data-slot="input-group-leading"]')).toBe(leading)
    input.focus()
    fireEvent.input(input, { target: { value: 'Client edit' } })
    expect(input.value).toBe('Client edit')
    setShow(false)
    expect(
      group.querySelectorAll(
        '[data-slot="input-group-leading"], [data-slot="input-group-trailing"]',
      ),
    ).toHaveLength(1)
    setShow(true)
    expect(
      group.querySelectorAll(
        '[data-slot="input-group-leading"], [data-slot="input-group-trailing"]',
      ),
    ).toHaveLength(2)
    expect(container.querySelector('input')).toBe(input)
    expect(input.value).toBe('Client edit')
    expect(document.activeElement).toBe(input)
  })

  test('hydrates a textarea with vertical parts and reactive native boolean attributes', () => {
    const [readOnly, setReadOnly] = createSignal(false)
    const { container } = hydrateFixture(
      '/src/forms/input-group/input-group.ssr.fixture.tsx',
      'renderTextareaGroupFixture',
      () => (
        <InputGroup dir="rtl" orientation="vertical">
          <InputGroup.Leading>{0}</InputGroup.Leading>
          <Textarea
            id="group-textarea"
            defaultValue="Server value"
            autoResize
            rows={2}
            maxRows={4}
            readOnly={readOnly()}
            required
          />
          <InputGroup.Trailing>
            <span>Footer</span>
          </InputGroup.Trailing>
        </InputGroup>
      ),
    )
    const textarea = container.querySelector('textarea')!
    expect(textarea.value).toBe('Server value')
    expect(textarea.readOnly).toBe(false)
    expect(textarea.required).toBe(true)
    expect(
      container.querySelector('[data-slot="input-group-leading"][data-orientation="vertical"]')
        ?.textContent,
    ).toBe('0')
    setReadOnly(true)
    expect(textarea.readOnly).toBe(true)
    setReadOnly(false)
    expect(textarea.readOnly).toBe(false)
    fireEvent.input(textarea, { target: { value: 'Client edit' } })
    expect(textarea.value).toBe('Client edit')
  })
})
