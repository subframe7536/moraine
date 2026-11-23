import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import { Button } from '../button'

import { BaseDialog } from './base-dialog'
describe('BaseDialog SSR Hydration', () => {
  test('hydrates the polymorphic trigger and defers closed content', () => {
    let mounts = 0
    const Content = () => {
      mounts += 1
      return <span data-testid="hydrated-content">Content</span>
    }

    const { container } = hydrateFixture(
      '/src/components/base-dialog/base-dialog.ssr.fixture.tsx',
      'renderModalFixture',
      () => (
        <BaseDialog>
          <BaseDialog.Trigger as={Button} variant="outline">
            Open modal
          </BaseDialog.Trigger>
          <BaseDialog.Portal>
            <BaseDialog.Content>
              <Content />
            </BaseDialog.Content>
          </BaseDialog.Portal>
        </BaseDialog>
      ),
    )

    const trigger = container.querySelector('[data-slot="base-dialog-trigger"]')!

    expect(trigger).not.toBeNull()
    expect(mounts).toBe(0)
    fireEvent.click(trigger)
    expect(mounts).toBe(1)
    expect(document.body.querySelector('[data-testid="hydrated-content"]')).not.toBeNull()
  })
})
