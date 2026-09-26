import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'
import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'
import { createContentRegistration } from '../base/content-registration'

import { Sheet } from './sheet'
import { SheetContentProvider } from './sheet-context'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Sheet SSR Hydration', () => {
  test('hydrates composed part IDs without replacing nodes', () => {
    const { container } = hydrateFixture(
      '/src/overlay/sheet/sheet.ssr.fixture.tsx',
      'renderPartsFixture',
      () => {
        const registration = createContentRegistration()
        return (
          <Sheet>
            <SheetContentProvider
              value={{
                ...registration,
                variants: { inset: false, side: 'right' },
                hasHeader: registration.hasExplicitHeader,
              }}
            >
              <Sheet.Header>
                <Sheet.Title id="server-sheet-title">Real title</Sheet.Title>
                <Sheet.Description>Details</Sheet.Description>
                <Sheet.Action>Help</Sheet.Action>
              </Sheet.Header>
              <Sheet.Body>Body</Sheet.Body>
              <Sheet.Footer>Actions</Sheet.Footer>
            </SheetContentProvider>
          </Sheet>
        )
      },
    )
    expect(container.querySelector('#server-sheet-title')).not.toBeNull()
    expect(container.querySelector('[data-slot="sheet-description"]')?.id).toBeTruthy()
  })

  test('server renders composable parts with stable IDs', () => {
    const html = renderSsrFixture('/src/overlay/sheet/sheet.ssr.fixture.tsx', 'renderPartsFixture')
    expect(html).toContain('sheet-title')
    expect(html).toContain('server-sheet-title')
    expect(html).toContain('data-slot="sheet-body"')
    expect(html).toContain('data-slot="sheet-footer"')
  })
  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const { container } = hydrateFixture(
      '/src/overlay/sheet/sheet.ssr.fixture.tsx',
      'renderSheetFixture',
      () => (
        <>
          <Sheet
            side="left"
            inset
            transition={false}

            close={<span data-testid="server-close-icon">Close</span>}
            ariaLabel="Server sheet"
          >
            <Sheet.Trigger as="button" type="button">
              Open custom sheet
            </Sheet.Trigger>
            <Sheet.Content title="Server title" description="Server description">
              <Sheet.Header>
                <div data-testid="server-header">Server header</div>
              </Sheet.Header>
              <Sheet.Body>
                <div data-testid="server-body">Server body</div>
              </Sheet.Body>
              <Sheet.Footer>
                <div data-testid="server-footer">Server footer</div>
              </Sheet.Footer>
            </Sheet.Content>
          </Sheet>
          <Sheet
            side="right"

            close={<span data-testid="default-close-icon">Close</span>}
          >
            <Sheet.Trigger as="button" type="button">
              Open default sheet
            </Sheet.Trigger>
            <Sheet.Content title="Default title" description="Default description">
              <Sheet.Body>
                <div data-testid="default-body">Default body</div>
              </Sheet.Body>
              <Sheet.Footer>
                <div data-testid="default-footer">Default footer</div>
              </Sheet.Footer>
            </Sheet.Content>
          </Sheet>
        </>
      ),
    )

    const serverTriggers = container.querySelectorAll<HTMLButtonElement>(
      '[data-slot="sheet-trigger"]',
    )
    const customTrigger = serverTriggers[0]!
    const defaultTrigger = serverTriggers[1]!

    expect(customTrigger).not.toBeNull()
    expect(defaultTrigger).not.toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()

    fireEvent.click(customTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    })
    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.hasAttribute('data-side')).toBe(false)
    expect(content.hasAttribute('data-transition')).toBe(false)
    expect(content.getAttribute('aria-label')).toBe('Server sheet')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expect(document.body.querySelector('[data-testid="server-header"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-footer"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-close-icon"]')).not.toBeNull()

    fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
      expect(document.activeElement).toBe(customTrigger)
    })

    fireEvent.click(defaultTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    })
    const defaultContent = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(defaultContent.hasAttribute('data-transition')).toBe(true)
    expectAriaReferencesToResolve(defaultContent)
    expect(document.body.querySelector('[data-testid="default-close-icon"]')).not.toBeNull()

    fireEvent.click(document.body.querySelector('[data-slot="sheet-content-close"]')!)
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })
  })
})
