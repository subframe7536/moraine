import { renderToString } from 'solid-js/web'

import { Popover } from './popover'

export function renderPopoverFixture(): string {
  return renderToString(() => (
    <Popover
      mode="hover"
      openDelay={50}
      ariaLabel="Hydrated popover"
      content={<span>Hydrated content</span>}
    >
      {(props) => (
        <button {...props} type="button">
          Trigger
        </button>
      )}
    </Popover>
  ))
}
