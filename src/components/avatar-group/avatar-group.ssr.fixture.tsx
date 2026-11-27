import { renderToString } from '@solidjs/web'

import { AvatarGroup } from './avatar-group'

export function renderAvatarGroupFixture(): string {
  return renderToString(() => (
    <AvatarGroup
      maxVisible={2}
      items={[
        { alt: 'Alex Rivera', text: 'AR' },
        { alt: 'Blake Chen', text: 'BC' },
        { alt: 'Casey Patel', text: 'CP' },
      ]}
    />
  ))
}
