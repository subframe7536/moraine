import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Dialog } from './dialog.tsx'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Dialog SSR Hydration', () => {
  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const { container } = hydrateFixture(
      '/src/overlays/dialog/dialog.ssr.fixture.tsx',
      'renderDialogFixture',
      () => (
        <>
          <Dialog
            title="Server title"
            description="Server description"
            header={<div data-testid="server-header">Server header</div>}
            body={<div data-testid="server-body">Server body</div>}
            footer={<div data-testid="server-footer">Server footer</div>}
            closeIcon={<span data-testid="server-close-icon">Close</span>}
            ariaLabel="Server dialog"
          >
            {(props) => (
              <button {...props} type="button">
                Open custom dialog
              </button>
            )}
          </Dialog>
          <Dialog
            title="Default title"
            description="Default description"
            body={<div data-testid="default-body">Default body</div>}
            footer={<div data-testid="default-footer">Default footer</div>}
            closeIcon={<span data-testid="default-close-icon">Close</span>}
          >
            {(props) => (
              <button {...props} type="button">
                Open default dialog
              </button>
            )}
          </Dialog>
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
    expect(content.getAttribute('aria-label')).toBe('Server dialog')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expect(document.body.querySelector('[data-testid="server-header"]')).not.toBeNull()
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
    expect(document.body.querySelector('[data-testid="default-close-icon"]')).not.toBeNull()

    fireEvent.click(document.body.querySelector('[data-slot="close"]')!)
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })
  })
})
