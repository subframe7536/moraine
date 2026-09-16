import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { defaultTheme } from '../../theme/default-theme.ts'

import { MultiSelect } from './multi-select.tsx'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider theme={defaultTheme}>{ui()}</MoraineProvider>, options)

test('clear-all preserves selected items that are currently disabled', () => {
  const onChange = vi.fn()
  const screen = render(() => (
    <MultiSelect
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'locked', label: 'Locked', disabled: true },
      ]}
      defaultValue={['apple', 'locked']}
      allowClear
      onChange={onChange}
    />
  ))

  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

  expect(onChange).toHaveBeenCalledExactlyOnceWith(['locked'])
  expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
  expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Locked')
})
