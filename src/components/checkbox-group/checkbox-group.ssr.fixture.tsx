import { renderToString } from '@solidjs/web'

import { CheckboxGroup } from './checkbox-group'
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
