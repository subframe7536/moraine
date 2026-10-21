import { renderToString } from 'solid-js/web'

import { ToggleButton } from './toggle-button'

export function renderToggleButtonFixture(): string {
  return renderToString(() => (
    <>
      <ToggleButton defaultPressed leading="icon-check">
        <span>Server content</span>
      </ToggleButton>
      <ToggleButton aria-label="Bookmark" leading="icon-check">
        {(state) => (
          <span>
            {state.pressed ? 'Saved' : 'Unsaved'} / {state.loading ? 'Pending' : 'Ready'}
          </span>
        )}
      </ToggleButton>
    </>
  ))
}
