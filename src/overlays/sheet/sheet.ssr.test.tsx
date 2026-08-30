import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Sheet } from './sheet.tsx'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Sheet SSR Hydration', () => {
  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const { container } = hydrateFixture(
      '/src/overlays/sheet/sheet.ssr.fixture.tsx',
      'renderSheetFixture',
      () => (
        <>
          <Sheet
            side="left"
            inset
            transition={false}
            title="Server title"
            description="Server description"
            header={<div data-testid="server-header">Server header</div>}
            action={<div data-testid="server-action">Server action</div>}
            body={<div data-testid="server-body">Server body</div>}
            footer={<div data-testid="server-footer">Server footer</div>}
            close={<span data-testid="server-close-icon">Close</span>}
            ariaLabel="Server sheet"
          >
            {(props) => (
              <button {...props} type="button">
                Open custom sheet
              </button>
            )}
          </Sheet>
          <Sheet
            side="right"
            title="Default title"
            description="Default description"
            action={<div data-testid="default-action">Default action</div>}
            body={<div data-testid="default-body">Default body</div>}
            footer={<div data-testid="default-footer">Default footer</div>}
            close={<span data-testid="default-close-icon">Close</span>}
          >
            {(props) => (
              <button {...props} type="button">
                Open default sheet
              </button>
            )}
          </Sheet>
        </>
      ),
    )

    const serverTriggers = container.querySelectorAll<HTMLButtonElement>('[data-slot="trigger"]')
    const customTrigger = serverTriggers[0]!
    const defaultTrigger = serverTriggers[1]!

    expect(customTrigger).not.toBeNull()
    expect(defaultTrigger).not.toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    fireEvent.click(customTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('data-side')).toBe('left')
    expect(content.getAttribute('aria-label')).toBe('Server sheet')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expect(document.body.querySelector('[data-testid="server-header"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-action"]')).toBeNull()
    expect(document.body.querySelector('[data-testid="server-body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-footer"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-close-icon"]')).toBeNull()

    fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(customTrigger)
    })

    fireEvent.click(defaultTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
    const defaultContent = document.body.querySelector('[data-slot="content"]')!
    expectAriaReferencesToResolve(defaultContent)
    expect(document.body.querySelector('[data-testid="default-action"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="default-close-icon"]')).not.toBeNull()

    fireEvent.click(document.body.querySelector('[data-slot="close"]')!)
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })
  })
})
