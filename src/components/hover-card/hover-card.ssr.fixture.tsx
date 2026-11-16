import { renderToString } from 'solid-js/web'

import { HoverCard } from './hover-card'

export function renderHoverCardFixture(): string {
  return renderToString(() => (
    <HoverCard openDelay={50}>
      <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
      <HoverCard.Content>
        <span>Hydrated card</span>
      </HoverCard.Content>
    </HoverCard>
  ))
}

export function renderHoverCardForceMountFixture(): string {
  return renderToString(() => (
    <HoverCard forceMount openDelay={50}>
      <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
      <HoverCard.Content>
        <span>Mounted card</span>
      </HoverCard.Content>
    </HoverCard>
  ))
}
