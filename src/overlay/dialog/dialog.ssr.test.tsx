import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Button } from '../../element/button/button'
import { Icon } from '../../element/icon/icon'
import { finishExitMotion } from '../../test-util/overlay-test'
import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { Dialog } from './dialog'
import { DialogContentProvider, createDialogContentRegistration } from './dialog-context'

test('hydrates a polymorphic Button trigger with nested JSX icons', () => {
  const { container } = hydrateFixture(
    '/src/overlay/dialog/dialog.ssr.fixture.tsx',
    'renderButtonTriggerFixture',
    () => (
      <Dialog>
        <Dialog.Trigger as={Button} leading="icon-search">
          <Icon name="icon-check" />
          Open
        </Dialog.Trigger>
        <Dialog.Content title="Title">Body</Dialog.Content>
      </Dialog>
    ),
  )
  expect(container.querySelectorAll('button')).toHaveLength(1)
  expect(container.querySelector('button [data-slot="button-label"]')?.textContent).toBe('Open')
  expect(container.querySelector('button [data-slot="button-leading"]')).toBeTruthy()
})

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Dialog SSR Hydration', () => {
  test('hydrates composed part IDs without replacing nodes', () => {
    const { container } = hydrateFixture(
      '/src/overlay/dialog/dialog.ssr.fixture.tsx',
      'renderPartsFixture',
      () => {
        const registration = createDialogContentRegistration()
        return (
          <Dialog>
            <DialogContentProvider
              value={{
                ...registration,
                variants: { fullscreen: false, scrollable: false },
                overlayScroll: () => false,
                hasHeader: registration.hasExplicitHeader,
              }}
            >
              <Dialog.Header>
                <Dialog.Title id="server-dialog-title">Real title</Dialog.Title>
                <Dialog.Description>Details</Dialog.Description>
                <Dialog.Action>Help</Dialog.Action>
              </Dialog.Header>
              <Dialog.Body>Body</Dialog.Body>
              <Dialog.Footer>Actions</Dialog.Footer>
            </DialogContentProvider>
          </Dialog>
        )
      },
    )
    expect(container.querySelector('#server-dialog-title')).not.toBeNull()
    expect(container.querySelector('[data-slot="dialog-description"]')?.id).toBeTruthy()
  })

  test('server renders composable parts with stable IDs', () => {
    const html = renderSsrFixture(
      '/src/overlay/dialog/dialog.ssr.fixture.tsx',
      'renderPartsFixture',
    )
    expect(html).toContain('dialog-title')
    expect(html).toContain('server-dialog-title')
    expect(html).toContain('data-slot="dialog-body"')
    expect(html).toContain('data-slot="dialog-footer"')
  })
  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const { container } = hydrateFixture(
      '/src/overlay/dialog/dialog.ssr.fixture.tsx',
      'renderDialogFixture',
      () => (
        <>
          <Dialog>
            <Dialog.Trigger as="button" type="button">
              Open custom dialog
            </Dialog.Trigger>
            <Dialog.Content
              title="Server title"
              description="Server description"
              closeIcon={<span data-testid="server-close-icon">Close</span>}
              ariaLabel="Server dialog"
            >
              <Dialog.Header>
                <div data-testid="server-header">Server header</div>
              </Dialog.Header>
              <Dialog.Body>
                <div data-testid="server-body">Server body</div>
              </Dialog.Body>
              <Dialog.Footer>
                <div data-testid="server-footer">Server footer</div>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
          <Dialog>
            <Dialog.Trigger as="button" type="button">
              Open default dialog
            </Dialog.Trigger>
            <Dialog.Content
              title="Default title"
              description="Default description"
              closeIcon={<span data-testid="default-close-icon">Close</span>}
            >
              <Dialog.Body>
                <div data-testid="default-body">Default body</div>
              </Dialog.Body>
              <Dialog.Footer>
                <div data-testid="default-footer">Default footer</div>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </>
      ),
    )

    const serverTriggers = container.querySelectorAll<HTMLButtonElement>(
      '[data-slot="dialog-trigger"]',
    )
    const customTrigger = serverTriggers[0]!
    const defaultTrigger = serverTriggers[1]!

    expect(customTrigger).not.toBeNull()
    expect(defaultTrigger).not.toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()

    fireEvent.click(customTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })
    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Server dialog')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expect(document.body.querySelector('[data-testid="server-header"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-footer"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="server-close-icon"]')).not.toBeNull()

    fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
      expect(document.activeElement).toBe(customTrigger)
    })

    fireEvent.click(defaultTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })
    const defaultContent = document.body.querySelector('[data-slot="dialog-content"]')!
    expectAriaReferencesToResolve(defaultContent)
    expect(document.body.querySelector('[data-testid="default-close-icon"]')).not.toBeNull()

    fireEvent.click(document.body.querySelector('[data-slot="dialog-content-close"]')!)
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })
  })
})
