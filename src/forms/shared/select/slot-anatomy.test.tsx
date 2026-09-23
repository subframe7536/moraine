import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Combobox } from '../../combobox/combobox.tsx'
import { MultiSelect } from '../../multi-select/multi-select.tsx'
import { Select } from '../../select/select.tsx'

const items = [{ value: 'one', label: 'One', description: 'First option', icon: 'icon-check' }]

describe('Select-family slot anatomy', () => {
  test.each([
    ['select', () => <Select items={items} defaultValue="one" defaultOpen />],
    ['combobox', () => <Combobox items={items} defaultValue="one" defaultOpen />],
    ['multi-select', () => <MultiSelect items={items} defaultValue={['one']} defaultOpen />],
  ] as const)('%s keeps local style slots and owns its default row DOM', (owner, component) => {
    const screen = render(component)
    const item = document.body.querySelector(`[data-slot="${owner}-item"]`)!
    const leading = item.querySelector(`[data-slot="${owner}-item-leading"]`)
    const wrapper = item.querySelector(`[data-slot="${owner}-item-wrapper"]`)
    const label = wrapper?.querySelector(`[data-slot="${owner}-item-label"]`)
    const description = wrapper?.querySelector(`[data-slot="${owner}-item-description"]`)
    const indicator = item.querySelector(`[data-slot="${owner}-item-indicator"]`)

    expect(leading).not.toBeNull()
    expect(wrapper).not.toBeNull()
    expect(label?.textContent).toBe('One')
    expect(description?.textContent).toBe('First option')
    expect(indicator).not.toBeNull()
    expect(document.body.querySelector('[data-slot^="base-select-"]')).toBeNull()
    screen.unmount()
  })
})
