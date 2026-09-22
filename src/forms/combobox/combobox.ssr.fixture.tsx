import { renderToString } from 'solid-js/web'

import { Combobox } from './combobox.tsx'

export function renderComboboxFixture(): string {
  return renderToString(() => (
    <Combobox
      id="fruit"
      name="fruit"
      value="banana"
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]}
      allowClear
    />
  ))
}

export function renderReadOnlyComboboxFixture(): string {
  return renderToString(() => (
    <Combobox
      id="read-only-fruit"
      name="read-only-fruit"
      value="banana"
      readOnly
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]}
    />
  ))
}

export function renderStringItemsFixture(): string {
  return renderToString(() => (
    <Combobox
      id="string-fruit"
      name="string-fruit"
      items={['Apple', { type: 'group', label: 'More', items: ['Banana'] }]}
      defaultValue="Banana"
    />
  ))
}
