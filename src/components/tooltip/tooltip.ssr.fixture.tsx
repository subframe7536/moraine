import { renderToString } from 'solid-js/web'

import { Tooltip } from './tooltip'

export function renderTooltipFixture(): string {
  return renderToString(() => (
    <Tooltip openDelay={50}>
      <Tooltip.Trigger as="button" type="button">
        Trigger
      </Tooltip.Trigger>
      <Tooltip.Content kbds={['Ctrl', 'K']}>
        <span>Hydrated tooltip</span>
      </Tooltip.Content>
    </Tooltip>
  ))
}
