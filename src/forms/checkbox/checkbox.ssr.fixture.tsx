import { renderToString } from 'solid-js/web'

import { Checkbox } from './checkbox.tsx'

export function renderCheckboxFixture(): string {
  return renderToString(() => (
    <Checkbox
      checked="indeterminate"
      label="Server label"
      description="Server description"
      checkedIcon={<span data-testid="checked-icon">Checked</span>}
      indeterminateIcon={<span data-testid="mixed-icon">Mixed</span>}
    />
  ))
}
