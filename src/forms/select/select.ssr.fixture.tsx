import { renderToString } from 'solid-js/web'

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
      allowClear
      leadingIcon="icon-search"
      trailingIcon="icon-chevron-down"
      closeIcon="icon-close"
    />
  ))
}
