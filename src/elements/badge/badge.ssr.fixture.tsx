import { renderToString } from 'solid-js/web'

import { Badge } from './badge.tsx'

export function renderBadgeFixture(): string {
  return renderToString(() => (
    <Badge leading="i-lucide-check" trailing="i-lucide-x">
      Server label
    </Badge>
  ))
}
