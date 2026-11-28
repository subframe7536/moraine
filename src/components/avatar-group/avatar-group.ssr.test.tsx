import { describe, expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { AvatarGroup } from './avatar-group'

describe('avatarGroup SSR Hydration', () => {
  it('hydrates visible avatars and overflow count without replacing nodes', () => {
    const { container } = hydrateFixture(
      '/src/components/avatar-group/avatar-group.ssr.fixture.tsx',
      'renderAvatarGroupFixture',
      () => (
        <AvatarGroup
          maxVisible={2}
          items={[
            { alt: 'Alex Rivera', text: 'AR' },
            { alt: 'Blake Chen', text: 'BC' },
            { alt: 'Casey Patel', text: 'CP' },
          ]}
        />
      ),
    )

    expect(container.querySelector('[data-slot="avatar-group"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-slot="avatar-group-item"]')).toHaveLength(2)
    expect(container.querySelector('[data-slot="avatar-group-count"]')?.textContent).toBe('+1')
  })
})
