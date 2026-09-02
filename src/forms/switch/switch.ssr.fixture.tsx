import { renderToString } from 'solid-js/web'

import { Switch } from './switch'

export function renderSwitchFixture(): string {
  return renderToString(() => (
    <Switch
      id="ssr-switch"
      defaultChecked
      label={0}
      description="Server description"
      checkedIcon={<span data-testid="checked-icon">Checked</span>}
    />
  ))
}
