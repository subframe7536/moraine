import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'
import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { Drawer } from './drawer'
import { createDrawerContentRegistration, DrawerContentProvider } from './drawer-context'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Drawer SSR Hydration', () => {
  test('hydrates composed part IDs without replacing nodes', () => {
    const { container } = hydrateFixture(
      '/src/components/drawer/drawer.ssr.fixture.tsx',
      'renderPartsFixture',
      () => {
        const registration = createDrawerContentRegistration()
        return (
          <Drawer>
            <DrawerContentProvider
              value={{
                ...registration,
                variants: { side: 'bottom' },
              }}
            >
              <Drawer.Header>
                <Drawer.Title id="server-drawer-title">Real title</Drawer.Title>
                <Drawer.Description>Details</Drawer.Description>
              </Drawer.Header>
              <Drawer.Body>Body</Drawer.Body>
              <Drawer.Footer>Actions</Drawer.Footer>
            </DrawerContentProvider>
          </Drawer>
        )
      },
    )
    expect(container.querySelector('#server-drawer-title')).not.toBeNull()
    expect(container.querySelector('[data-slot="drawer-description"]')?.id).toBeTruthy()
  })

  test('server renders composable parts with stable IDs', () => {
    const html = renderSsrFixture(
      '/src/components/drawer/drawer.ssr.fixture.tsx',
      'renderPartsFixture',
    )
    expect(html).toContain('drawer-title')
    expect(html).toContain('server-drawer-title')
    expect(html).toContain('data-slot="drawer-body"')
    expect(html).toContain('data-slot="drawer-footer"')
  })
  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const { container } = hydrateFixture(
      '/src/components/drawer/drawer.ssr.fixture.tsx',
      'renderDrawerFixture',
      () => (
        <>
          <Drawer
            side="top"
            closable

            closeIcon={<span data-testid="server-close-icon">Close</span>}
          >
            <Drawer.Trigger as="button" type="button">
              Open custom drawer
            </Drawer.Trigger>
            <Drawer.Content
              aria-label="Server drawer"
              title="Server title"
              description="Server description"
            >
              <Drawer.Header>
                <div data-testid="server-header">Server header</div>
              </Drawer.Header>
              <Drawer.Body>
                <div data-testid="server-body">Server body</div>
              </Drawer.Body>
              <Drawer.Footer>
                <div data-testid="server-footer">Server footer</div>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
          <Drawer closeIcon={<span data-testid="default-close-icon">Close</span>}>
            <Drawer.Trigger as="button" type="button">
              Open default drawer
            </Drawer.Trigger>
            <Drawer.Content title="Default title" description="Default description">
              <Drawer.Body>
                <div data-testid="default-body">Default body</div>
              </Drawer.Body>
              <Drawer.Footer>
                <div data-testid="default-footer">Default footer</div>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer>
        </>
      ),
    )

    const serverTriggers = container.querySelectorAll<HTMLButtonElement>(
      '[data-slot="drawer-trigger"]',
    )
    const customTrigger = serverTriggers[0]!
    const defaultTrigger = serverTriggers[1]!

    expect(customTrigger).not.toBeNull()
    expect(defaultTrigger).not.toBeNull()
    expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()

    fireEvent.click(customTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
    })
    const content = document.body.querySelector('[data-slot="drawer-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Server drawer')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expect(document.body.querySelector('[data-slot="drawer-handle"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-header"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-footer"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-close-icon"]')).not.toBeNull()

    fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()
      expect(document.activeElement).toBe(customTrigger)
    })

    fireEvent.click(defaultTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
    })
    const defaultContent = document.body.querySelector('[data-slot="drawer-content"]')!
    expectAriaReferencesToResolve(defaultContent)
    expect(document.body.querySelector('[data-slot="drawer-handle"]')).not.toBeNull()

    fireEvent.keyDown(defaultContent, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })
  })
})
