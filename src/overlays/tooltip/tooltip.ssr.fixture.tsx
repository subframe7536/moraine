import { renderToString } from 'solid-js/web'

import { Tooltip } from './tooltip.tsx'

export function renderTooltipFixture(): string {
  return renderToString(() => (
    <Tooltip openDelay={50} text={<span>Hydrated tooltip</span>} kbds={['Ctrl', 'K']}>
      {(props) => (
        <button {...props} type="button">
          Trigger
        </button>
      )}
    </Tooltip>
  ))
}
