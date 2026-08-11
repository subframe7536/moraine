import { renderToString } from 'solid-js/web'

import { CheckboxGroup } from './checkbox-group.tsx'

export function renderCheckboxGroupFixture(): string {
  return renderToString(() => (
    <CheckboxGroup
      legend="Server options"
      items={[
        { value: 'same', label: 'First' },
        { value: 'same', label: 'Second' },
      ]}
      value={['same']}
    />
  ))
}
