import { renderToString } from '@solidjs/web'

import { AvatarGroup } from '../avatar-group/avatar-group'

import { Avatar } from './avatar'
export function AvatarHydrationFixture(props: { maxVisible?: number }) {
  return (
    <>
      <Avatar
        src="/avatar.png"
        alt="Ada Lovelace"
        icon="i-lucide-user"
        badge={<span>Online</span>}
      />
      <AvatarGroup
        maxVisible={props.maxVisible ?? 1}
        items={[{ alt: 'Grace Hopper', icon: 'i-lucide-user' }, { alt: 'Alan Turing' }]}
      />
    </>
  )
}

export function renderAvatarFixture(): string {
  return renderToString(() => <AvatarHydrationFixture />)
}
