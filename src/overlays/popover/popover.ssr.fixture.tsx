import { renderToString } from 'solid-js/web'

import { Popover } from './popover'

export function renderPopoverFixture(): string {
  return renderToString(() => (
    <Popover mode="hover" openDelay={50}>
      <Popover.Trigger as="button" type="button">
        Trigger
      </Popover.Trigger>
      <Popover.Content ariaLabel="Hydrated popover" content={<span>Hydrated content</span>} />
    </Popover>
  ))
}
