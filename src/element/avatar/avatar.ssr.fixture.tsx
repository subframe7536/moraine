import { renderToString } from 'solid-js/web'

import { AvatarGroup } from './avatar-group.tsx'
import { Avatar } from './avatar.tsx'

export function AvatarHydrationFixture(props: { max?: number }) {
  return (
    <>
      <Avatar
        src="/avatar.png"
        alt="Ada Lovelace"
        fallback={<span>AL</span>}
        badge={<span>Online</span>}
      />
      <AvatarGroup
        max={props.max ?? 1}
        items={[{ alt: 'Grace Hopper', fallback: <span>GH</span> }, { alt: 'Alan Turing' }]}
      />
    </>
  )
}

export function renderAvatarFixture(): string {
  return renderToString(() => <AvatarHydrationFixture />)
}
