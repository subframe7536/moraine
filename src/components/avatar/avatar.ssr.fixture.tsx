import { renderToString } from 'solid-js/web'

import { AvatarGroup } from '../avatar-group/avatar-group'

import { Avatar } from './avatar'

export function AvatarHydrationFixture(props: { max?: number }) {
  return (
    <>
      <Avatar
        src="/avatar.png"
        alt="Ada Lovelace"
        icon={<span>AL</span>}
        badge={<span>Online</span>}
      />
      <AvatarGroup
        max={props.max ?? 1}
        items={[{ alt: 'Grace Hopper', icon: <span>GH</span> }, { alt: 'Alan Turing' }]}
      />
    </>
  )
}

export function renderAvatarFixture(): string {
  return renderToString(() => <AvatarHydrationFixture />)
}
