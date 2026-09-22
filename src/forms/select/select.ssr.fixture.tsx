import { renderToString } from 'solid-js/web'

import { Select } from './select.tsx'

export function renderSelectFixture(): string {
  return renderToString(() => (
    <Select
      id="fruit"
      name="fruit"
      value="banana"
      items={[
        { value: 'apple', label: 'Apple', description: 'Crisp' },
        { value: 'banana', label: 'Banana', description: 'Sweet' },
      ]}
      allowClear
      leadingIcon="icon-search"
      trailingIcon="icon-chevron-down"
      closeIcon="icon-close"
    />
  ))
}

export function renderSelectItemRenderFixture(): string {
  return renderToString(() => (
    <Select
      id="custom-render"
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]}
      defaultOpen
      itemRender={(state) => <span data-testid="custom-item">{state.item.label}</span>}
    />
  ))
}

export function renderStringItemsFixture(): string {
  return renderToString(() => (
    <Select
      id="string-fruit"
      name="string-fruit"
      items={['Apple', { type: 'group', label: 'More', items: ['Banana'] }]}
      defaultValue="Banana"
    />
  ))
}
