import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Button } from '../../elements/button/index'
import { hydrateFixture } from '../../test-utils/ssr-test'

import { Modal } from './modal'

describe('Modal SSR Hydration', () => {
  test('hydrates the polymorphic trigger and defers closed content', () => {
    let mounts = 0
    const Content = () => {
      mounts += 1
      return <span data-testid="hydrated-content">Content</span>
    }

    const { container } = hydrateFixture(
      '/src/overlays/modal/modal.ssr.fixture.tsx',
      'renderModalFixture',
      () => (
        <Modal>
          <Modal.Trigger as={Button} variant="outline">
            Open modal
          </Modal.Trigger>
          <Modal.Content>
            <Content />
          </Modal.Content>
        </Modal>
      ),
    )

    const trigger = container.querySelector('[data-slot="trigger"]')!

    expect(trigger).not.toBeNull()
    expect(mounts).toBe(0)
    fireEvent.click(trigger)
    expect(mounts).toBe(1)
    expect(document.body.querySelector('[data-testid="hydrated-content"]')).not.toBeNull()
  })
})
