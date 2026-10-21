import { renderToString } from 'solid-js/web'

import { Badge } from './badge'

export function renderBadgeFixture(): string {
  return renderToString(() => (
    <Badge leading="i-lucide-check" trailing="i-lucide-x">
      Server label
    </Badge>
  ))
}

export function renderButtonBadgeFixture(): string {
  return renderToString(() => (
    <Badge as="button" type="button" aria-pressed={false}>
      Slot
    </Badge>
  ))
}
