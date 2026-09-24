import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Button } from './button'

export function renderButtonFixture(): string {
  return renderToString(() => (
    <Button leading="i-lucide-save" trailing="i-lucide-arrow-right">
      {(state) => (
        <Show when={state.loading} fallback="Save">
          Saving
        </Show>
      )}
    </Button>
  ))
}
