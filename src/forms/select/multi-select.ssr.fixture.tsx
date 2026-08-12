import { renderToString } from 'solid-js/web'

import { MultiSelect } from './multi-select.tsx'

export function renderMultiSelectFixture(): string {
  return renderToString(() => (
    <MultiSelect
      id="fruits"
      name="fruits"
      search
      defaultValue={['apple']}
      options={[
        { value: 'apple', label: 'Apple', description: 'Crisp' },
        { value: 'banana', label: 'Banana', description: 'Sweet' },
      ]}
      leadingIcon="icon-search"
      trailingIcon="icon-chevron-down"
      closeIcon="icon-close"
    />
  ))
}
