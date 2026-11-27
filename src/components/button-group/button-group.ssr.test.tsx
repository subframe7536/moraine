import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import { Button } from '../button'

import { ButtonGroup } from './button-group'

describe('buttonGroup SSR Hydration', () => {
  it('hydrates grouped buttons and separator with live click handlers', () => {
    const onCopy = vi.fn<(...args: Array<any>) => void>()
    const { container } = hydrateFixture(
      '/src/components/button-group/button-group.ssr.fixture.tsx',
      'renderButtonGroupFixture',
      () => (
        <ButtonGroup variant="outline" size="sm" aria-label="Document actions">
          <Button onClick={onCopy}>Copy</Button>
          <ButtonGroup.Separator />
          <Button>Archive</Button>
        </ButtonGroup>
      ),
    )

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('[data-slot="button"]'),
    )
    expect(container.querySelector('[data-slot="button-group"]')).not.toBeNull()
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0]!)
    expect(onCopy).toHaveBeenCalledOnce()
  })
})
