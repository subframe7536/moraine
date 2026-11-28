import { renderToString } from '@solidjs/web'

import { MultiSelect } from './multi-select'
export function renderMultiSelectFixture(): string {
  return renderToString(() => (
    <MultiSelect
      id="fruits"
      name="fruits"
      searchable
      defaultValue={['apple']}
      items={[
        { value: 'apple', label: 'Apple', description: 'Crisp' },
        { value: 'banana', label: 'Banana', description: 'Sweet' },
      ]}
      leading="icon-search"
      trailing="icon-chevron-down"
      clearIcon="icon-close"
    />
  ))
}
