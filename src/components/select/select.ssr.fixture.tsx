import { renderToString } from 'solid-js/web'

import { Field } from '../field'

import { Select } from './select'

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
      clearable
      leading="icon-search"
      trailing="icon-chevron-down"
      clearIcon="icon-close"
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
      items={['Apple', { type: 'group', label: 'More', children: ['Banana'] }]}
      defaultValue="Banana"
    />
  ))
}

export function renderSelectFieldDefaultFixture(): string {
  return renderToString(() => (
    <Field name="role" label="Role">
      <Select
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]}
        defaultValue="apple"
      />
    </Field>
  ))
}
