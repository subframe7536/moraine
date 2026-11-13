import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { defineTheme } from '../../theme'
import { Button } from '../button'
import { CommandPalette } from '../command-palette'
import { Sheet } from '../sheet/sheet'

import { Dialog } from './dialog'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Dialog', () => {
  test('keeps nested Sheet configuration and ARIA registration isolated', () => {
    const [showSheet, setShowSheet] = createSignal(true)
    render(() => (
      <Dialog open closable={false}>
        <Dialog.Content title="Outer title">
          <Dialog.Body>
            <Show when={showSheet()}>
              <Sheet open closable={false} side="left">
                <Sheet.Content title="Inner title">
                  <Sheet.Body>Inner body</Sheet.Body>
                </Sheet.Content>
              </Sheet>
            </Show>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const outer = document.body.querySelector<HTMLElement>('[data-slot="dialog-content"]')!
    const inner = document.body.querySelector<HTMLElement>('[data-slot="sheet-content"]')!
    expect(outer.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="dialog-title"]')?.id,
    )
    expect(inner.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="sheet-title"]')?.id,
    )

    setShowSheet(false)
    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    expect(outer.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="dialog-title"]')?.id,
    )
  })

  test('releases body slot content when closed and recreates it when reopened', async () => {
    const [open, setOpen] = createSignal(false)
    let mounts = 0
    let cleanups = 0
    const Body = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span>Lifecycle body</span>
    }

    const screen = render(() => (
      <Dialog open={open()}>
        <Dialog.Content>
          <Dialog.Body>
            <Body />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(mounts).toBe(0)
    setOpen(true)
    await waitFor(() => {
      expect(mounts).toBe(1)
    })

    setOpen(false)
    await finishExitMotion()
    await waitFor(() => {
      expect(cleanups).toBe(1)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })

    setOpen(true)
    await waitFor(() => {
      expect(mounts).toBe(2)
    })
    screen.unmount()
  })

  test('unmounts content and overlay without waiting for an animation when transition is false', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Dialog open={open()} transition={false}>
        <Dialog.Content title="Instant">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.hasAttribute('data-transition')).toBe(false)
    expect(
      document.body.querySelector('[data-slot="dialog-overlay"]')?.hasAttribute('data-transition'),
    ).toBe(false)

    setOpen(false)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="dialog-overlay"]')).toBeNull()
    })
    screen.unmount()
  })

  test('keeps content mounted through the exit animation when transition is enabled', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Dialog open={open()}>
        <Dialog.Content title="Animated">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.hasAttribute('data-transition')).toBe(true)

    setOpen(false)
    await Promise.resolve()
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBe(content)

    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })
    screen.unmount()
  })

  test('renders a named dialog with title, description, body, footer and close button', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Confirm" description="Please confirm">
          <Dialog.Body>Modal body</Dialog.Body>
          <Dialog.Footer>Modal footer</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const dialog = screen.getByRole('dialog', { name: 'Confirm' })
    expect(dialog.getAttribute('aria-describedby')).toBe(screen.getByText('Please confirm').id)
    expect(dialog.querySelector('[data-slot="dialog-header"]')).not.toBeNull()
    expect(dialog.querySelector('[data-slot="dialog-body"]')?.textContent).toBe('Modal body')
    expect(dialog.querySelector('[data-slot="dialog-footer"]')?.textContent).toBe('Modal footer')
    expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull()
  })

  test('labels the automatic close button with the translations override', () => {
    render(() => (
      <Dialog open translations={{ close: 'Fermer' }}>
        <Dialog.Content title="Titre">
          <Dialog.Body>Corps</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(screen.getByRole('button', { name: 'Fermer' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="dialog-trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
    expect(trigger?.textContent).toBe('Trigger')
  })

  test('renders a polymorphic trigger root without nesting another button', () => {
    render(() => (
      <Dialog>
        <Dialog.Trigger as="a" href="/details">
          Open
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="dialog-trigger"]') as HTMLAnchorElement
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('/details')
    expect(trigger.querySelector('button')).toBeNull()
  })

  test('renders an existing polymorphic component as the trigger root', () => {
    render(() => (
      <Dialog>
        <Dialog.Trigger as={Button} variant="outline">
          Open dialog
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="dialog-trigger"]') as HTMLButtonElement
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.querySelector('button')).toBeNull()
  })

  test('inherits Modal trigger dialog semantics through exit presence', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Dialog open={open()}>
        <Dialog.Trigger as="a" href="/details">
          Open
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))
    const trigger = screen.getByRole('link', { name: 'Open' })

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()

    setOpen(false)
    await Promise.resolve()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).not.toBeNull()
    await finishExitMotion()
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    screen.unmount()
  })

  test('renders custom header slot and overrides default title/description section', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Default title" description="Default description">
          <Dialog.Header>
            <div data-testid="custom-header">Custom Header</div>
          </Dialog.Header>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-header"]')?.textContent).toContain(
      'Custom Header',
    )
    expect(document.body.textContent).not.toContain('Default title')
    expect(document.body.textContent).not.toContain('Default description')
  })

  test('only references mounted default title and description nodes', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content title="Dialog title" description="Dialog description">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expectAriaReferencesToResolve(content)
    expect(content.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="dialog-title"]')?.id,
    )
    expect(content.getAttribute('aria-describedby')).toBe(
      document.body.querySelector('[data-slot="dialog-description"]')?.id,
    )
  })

  test('uses aria-label for a custom header without dangling generated IDs', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content
          aria-label="Account settings"
          title="Suppressed title"
          description="Suppressed description"
        >
          <Dialog.Header>
            <div>Custom header</div>
          </Dialog.Header>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Account settings')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expectAriaReferencesToResolve(content)
  })

  test('preserves native ARIA naming attributes over generated Dialog relationships', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content
          aria-label="Native dialog label"
          aria-labelledby="custom-dialog-title"
          aria-describedby="custom-dialog-description"
          title="Generated title"
          description="Generated description"
        >
          <Dialog.Body>
            <>
              <h2 id="custom-dialog-title">Custom title</h2>
              <p id="custom-dialog-description">Custom description</p>
            </>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Native dialog label')
    expect(content.getAttribute('aria-labelledby')).toBe('custom-dialog-title')
    expect(content.getAttribute('aria-describedby')).toBe('custom-dialog-description')
    expectAriaReferencesToResolve(content)
  })

  test('inherits non-modal modal false behavior', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Dialog defaultOpen modal={false}>
          <Dialog.Content title="Dialog">
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))
    const outside = screen.getByTestId<HTMLButtonElement>('outside')
    outside.focus()
    await Promise.resolve()
    await Promise.resolve()

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
    expect(outside.getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(outside)
    screen.unmount()
  })

  test('preserves numeric zero title and description content', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content title={0} description={0}>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const title = document.body.querySelector('[data-slot="dialog-title"]')
    const description = document.body.querySelector('[data-slot="dialog-description"]')
    const content = document.body.querySelector('[data-slot="dialog-content"]')!

    expect(title?.textContent).toBe('0')
    expect(description?.textContent).toBe('0')
    expectAriaReferencesToResolve(content)
  })

  test.each([
    ['title only', 'Title', undefined, undefined, true, false],
    ['description only', undefined, 'Description', 'Description dialog', false, true],
    ['no title or description', undefined, undefined, 'Unnamed dialog', false, false],
  ] as const)(
    'keeps ARIA references valid for %s',
    (_case, title, description, ariaLabel, hasLabelledBy, hasDescribedBy) => {
      render(() => (
        <Dialog open>
          <Dialog.Content aria-label={ariaLabel} title={title} description={description}>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      ))

      const content = document.body.querySelector('[data-slot="dialog-content"]')!
      expect(Boolean(content.getAttribute('aria-labelledby'))).toBe(hasLabelledBy)
      expect(Boolean(content.getAttribute('aria-describedby'))).toBe(hasDescribedBy)
      expect(content.getAttribute('aria-label')).toBe(ariaLabel ?? null)
      expectAriaReferencesToResolve(content)
    },
  )

  test('treats empty content and false presence as absent content', () => {
    const empty = render(() => (
      <Dialog open closable={false}>
        <Dialog.Content title="" description="">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))
    expect(document.body.querySelector('[data-slot="dialog-title"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-description"]')).toBeNull()
    empty.unmount()

    render(() => (
      <Dialog open closable={false}>
        <Dialog.Content title={false} description={false}>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))
    expect(document.body.querySelector('[data-slot="dialog-header"]')).toBeNull()
    expect(
      document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('aria-labelledby'),
    ).toBeNull()
    expect(
      document.body.querySelector('[data-slot="dialog-content"]')?.getAttribute('aria-describedby'),
    ).toBeNull()
  })

  test('composes explicit header, reactive ARIA IDs, and body presence', () => {
    const [showHeader, setShowHeader] = createSignal(true)
    const [showTitle, setShowTitle] = createSignal(true)
    const [showDescription, setShowDescription] = createSignal(true)
    const [showFooter, setShowFooter] = createSignal(true)
    const [titleId, setTitleId] = createSignal('custom-title')
    render(() => (
      <Dialog
        open
        classes={{ header: 'family-header', body: 'family-body' }}
        styles={{ header: { color: 'red' } }}

        closable={false}
      >
        <Dialog.Content title="Fallback" description="Fallback description">
          <Show when={showHeader()}>
            <Dialog.Header>
              <Show when={showTitle()}>
                <Dialog.Title id={titleId()}>Actual title</Dialog.Title>
              </Show>
              <Show when={showDescription()}>
                <Dialog.Description id="custom-description">Actual description</Dialog.Description>
              </Show>
            </Dialog.Header>
          </Show>
          <Dialog.Body class="local-body">Body</Dialog.Body>
          <Show when={showFooter()}>
            <Dialog.Footer>Actions</Dialog.Footer>
          </Show>
        </Dialog.Content>
      </Dialog>
    ))
    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    const body = document.body.querySelector('[data-slot="dialog-body"]')!
    expect(content.textContent).not.toContain('Fallback')
    expect(content.querySelectorAll('[data-slot="dialog-title"]')).toHaveLength(1)
    expect(content.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Actual title')
    expect(content.querySelectorAll('[data-slot="dialog-description"]')).toHaveLength(1)
    expect(content.querySelector('[data-slot="dialog-description"]')?.textContent).toBe(
      'Actual description',
    )
    expect(content.getAttribute('aria-labelledby')).toBe('custom-title')
    expect(content.getAttribute('aria-describedby')).toBe('custom-description')
    expect(body.hasAttribute('data-header')).toBe(true)
    expect(body.hasAttribute('data-footer')).toBe(true)
    const header = document.body.querySelector<HTMLElement>('[data-slot="dialog-header"]')!
    expect(header.className).toContain('family-header')
    expect(header.style.color).toBe('red')
    expect(body.className).toContain('family-body')
    expect(body.className).toContain('local-body')
    setTitleId('renamed-title')
    expect(content.getAttribute('aria-labelledby')).toBe('renamed-title')
    setShowTitle(false)
    setShowDescription(false)
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    setShowHeader(false)
    expect(body.hasAttribute('data-header')).toBe(true)
    expect(content.textContent).toContain('Fallback')
    setShowFooter(false)
    expect(body.hasAttribute('data-footer')).toBe(false)
  })

  test('opens by trigger click and closes through close button', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <Dialog onOpenChange={onOpenChange}>
        <Dialog.Trigger as="button" type="button">
          Open modal
        </Dialog.Trigger>
        <Dialog.Content title="Settings">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()

    fireEvent.click(screen.getByText('Open modal'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector(
      '[data-slot="dialog-content-close"]',
    ) as HTMLElement
    fireEvent.click(closeButton)

    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })
  })

  test('keeps a CommandPalette input value until the Dialog exits', async () => {
    const [open, setOpen] = createSignal(false)
    const [searchTerm, setSearchTerm] = createSignal('')
    const onExitComplete = vi.fn()

    const screen = render(() => (
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => {
          setSearchTerm('')
          onExitComplete()
        }}
        closable={false}
      >
        <Dialog.Trigger as="button" type="button">
          Open palette
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>
            <CommandPalette
              groups={[{ id: 'commands', items: [{ value: 'settings', label: 'Settings' }] }]}
              searchTerm={searchTerm()}
              onSearchTermChange={setSearchTerm}
            />
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Open palette' }))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-palette-input"]')).not.toBeNull()
    })
    const input = document.body.querySelector(
      '[data-slot="command-palette-input"]',
    ) as HTMLInputElement
    fireEvent.input(input, { target: { value: 'Settings' } })

    expect(input.value).toBe('Settings')

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(input.value).toBe('Settings')
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })
    expect(onExitComplete).not.toHaveBeenCalled()

    await finishExitMotion()

    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })

    fireEvent.click(document.body.querySelector('[data-slot="dialog-trigger"]') as HTMLElement)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="command-palette-input"]')).not.toBeNull()
    })
    expect(
      (document.body.querySelector('[data-slot="command-palette-input"]') as HTMLInputElement)
        .value,
    ).toBe('')
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Portal default">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(screen.container.querySelector('[data-slot="dialog-content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Dialog open overlay={false}>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="dialog-overlay"]')).toBeNull()
  })

  test.each([
    [
      'an instance slot override',
      (children: () => JSX.Element) => (
        <Dialog open classes={{ overlay: 'user-overlay' }}>
          {children()}
        </Dialog>
      ),
      'user-overlay',
    ],
    [
      'a provider theme override',
      (children: () => JSX.Element) => (
        <MoraineProvider theme={defineTheme({ dialog: { base: { overlay: 'theme-overlay' } } })}>
          <Dialog open>{children()}</Dialog>
        </MoraineProvider>
      ),
      'theme-overlay',
    ],
  ] as const)(
    'applies %s to the backdrop and keeps it wrapping the content',
    (_name, host, sentinel) => {
      render(() =>
        host(() => (
          <Dialog.Content>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        )),
      )

      const overlay = document.body.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!
      expect(overlay.classList.contains(sentinel)).toBe(true)
      expect(overlay.contains(document.body.querySelector('[data-slot="dialog-content"]'))).toBe(
        true,
      )
    },
  )

  test('locks body scroll while a dialog with long content is open', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content title="Long content">
          <Dialog.Body>
            <div style={{ height: '2000px' }}>Long body</div>
          </Dialog.Body>
          <Dialog.Footer>Actions</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.style.overflow).toBe('hidden')
  })

  test('moves long dialog scrolling to the overlay when scrollable is true', () => {
    // Model the recipe's overflow utility in jsdom so scroll locking detects the overlay.
    render(() => (
      <Dialog open scrollable styles={{ overlay: { 'overflow-y': 'auto' } }}>
        <Dialog.Content title="Overlay scroll">
          <Dialog.Body>Long body</Dialog.Body>
          <Dialog.Footer>Actions</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const overlay = document.body.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')
    const content = document.body.querySelector('[data-slot="dialog-content"]')
    const body = content?.querySelector('[data-slot="dialog-body"]')

    expect(overlay?.contains(content ?? null)).toBe(true)
    expect(overlay?.getAttribute('aria-hidden')).toBeNull()
    expect(overlay?.style.overflowY).toBe('auto')
    expect(document.body.style.overflow).toBe('hidden')
    expect(body?.hasAttribute('data-scroll')).toBe(false)
  })

  test('reacts to root fullscreen and scrollable changes', () => {
    const [scrollable, setScrollable] = createSignal(false)
    const [fullscreen, setFullscreen] = createSignal(false)
    const [overlayVisible, setOverlayVisible] = createSignal(true)
    render(() => (
      <Dialog open scrollable={scrollable()} fullscreen={fullscreen()} overlay={overlayVisible()}>
        <Dialog.Content title="Layout">Content</Dialog.Content>
      </Dialog>
    ))

    const overlay = () => document.body.querySelector('[data-slot="dialog-overlay"]')
    const content = () => document.body.querySelector('[data-slot="dialog-content"]')
    const originalContent = content()
    expect(overlay()?.contains(content())).toBe(true)

    setScrollable(true)
    expect(content()).toBe(originalContent)
    expect(overlay()?.contains(content())).toBe(true)

    setFullscreen(true)
    expect(content()).toBe(originalContent)
    expect(overlay()?.contains(content())).toBe(true)

    setOverlayVisible(false)
    expect(overlay()).toBeNull()
    expect(content()).toBe(originalContent)
  })

  test('keeps content, focus, and uncontrolled input state across layout changes', async () => {
    const [scrollable, setScrollable] = createSignal(false)
    const [fullscreen, setFullscreen] = createSignal(false)
    const [overlay, setOverlay] = createSignal(true)
    const screen = render(() => (
      <Dialog open scrollable={scrollable()} fullscreen={fullscreen()} overlay={overlay()}>
        <Dialog.Content title="Stable content">
          <input data-testid="stable-input" value="initial" />
        </Dialog.Content>
      </Dialog>
    ))
    const content = document.body.querySelector('[data-slot="dialog-content"]')
    const input = document.body.querySelector<HTMLInputElement>('[data-testid="stable-input"]')!
    await Promise.resolve()
    input.focus()
    input.value = 'edited'

    setScrollable(true)
    setFullscreen(true)
    setOverlay(false)
    expect(document.body.querySelector('[data-slot="dialog-content"]')).toBe(content)
    expect(document.body.querySelector('[data-testid="stable-input"]')).toBe(input)
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('edited')
    screen.unmount()
  })

  test('keeps body scroll locked when scrolling moves to the overlay', () => {
    const [scrollable, setScrollable] = createSignal(false)
    const screen = render(() => (
      <Dialog open scrollable={scrollable()} styles={{ overlay: { 'overflow-y': 'auto' } }}>
        <Dialog.Content title="Scroll reference">Body</Dialog.Content>
      </Dialog>
    ))
    expect(document.body.style.overflow).toBe('hidden')
    setScrollable(true)
    expect(document.body.style.overflow).toBe('hidden')
    expect(
      document.body.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')?.style.overflowY,
    ).toBe('auto')
    screen.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  test('keeps shorthand JSX title and description mounted across scroll layout changes', () => {
    const [scrollable, setScrollable] = createSignal(false)
    render(() => (
      <Dialog open scrollable={scrollable()}>
        <Dialog.Content
          title={<span data-testid="shorthand-title">Title</span>}
          description={<span data-testid="shorthand-description">Description</span>}
        >
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))
    const title = document.body.querySelector('[data-testid="shorthand-title"]')
    const description = document.body.querySelector('[data-testid="shorthand-description"]')

    setScrollable(true)
    setScrollable(false)

    expect(document.body.querySelectorAll('[data-testid="shorthand-title"]')).toHaveLength(1)
    expect(document.body.querySelector('[data-testid="shorthand-title"]')).toBe(title)
    expect(document.body.querySelector('[data-testid="shorthand-description"]')).toBe(description)
    expectAriaReferencesToResolve(document.body.querySelector('[data-slot="dialog-content"]')!)
  })

  test('supports custom close content', () => {
    render(() => (
      <Dialog open closeIcon={<span data-testid="custom-close">X</span>}>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('keeps automatic Content close and explicit Close styling separate', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Dialog open onOpenChange={onOpenChange} classes={{ contentClose: 'automatic-close' }}>
        <Dialog.Content>
          <Dialog.Header>
            <div>Custom header</div>
          </Dialog.Header>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
        <Dialog.Close data-testid="explicit-dialog-close" class="explicit-close">
          Explicit close
        </Dialog.Close>
      </Dialog>
    ))

    const automatic = document.body.querySelector<HTMLElement>(
      '[data-slot="dialog-content-close"]',
    )!
    const explicit = screen.getByTestId('explicit-dialog-close')
    expect(automatic.classList.contains('automatic-close')).toBe(true)
    expect(explicit.classList.contains('explicit-close')).toBe(true)
    expect(explicit.classList.contains('automatic-close')).toBe(false)

    fireEvent.click(explicit)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('hides close button when closable=false', () => {
    render(() => (
      <Dialog open closable={false}>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
  })

  test('prevents close when closeOnEscape is false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Dialog defaultOpen closeOnEscape={false} onClosePrevent={onClosePrevent}>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })
  })

  test('emits onClosePrevent once for blocked outside pointer interaction', async () => {
    const onClosePrevent = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog defaultOpen closeOnOverlayClick={false} onClosePrevent={onClosePrevent}>
          <Dialog.Trigger as="button" type="button">
            Trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })
  })

  test('clears text selection when dismissed by outside pointer interaction', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog onOpenChange={onOpenChange} defaultOpen>
          <Dialog.Trigger as="button" type="button">
            Trigger
          </Dialog.Trigger>
          <Dialog.Content title="Dialog title">
            <Dialog.Body>Dialog body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    window.getSelection()?.selectAllChildren(content)

    expect(window.getSelection()?.toString()).toContain('Dialog title')

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
      expect(window.getSelection()?.toString()).toBe('')
    })
  })

  test('blocks outside pointer dismissal without blocking Escape', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog
          defaultOpen
          closeOnOverlayClick={false}
          onClosePrevent={onClosePrevent}
          onOpenChange={onOpenChange}
        >
          <Dialog.Trigger as="button" type="button">
            Trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="dialog-content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })
  })

  test('blocks Escape without blocking outside pointer dismissal', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog
          defaultOpen
          closeOnEscape={false}
          onClosePrevent={onClosePrevent}
          onOpenChange={onOpenChange}
        >
          <Dialog.Trigger as="button" type="button">
            Trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })
  })

  test('closes on Escape by default', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Dialog defaultOpen onClosePrevent={onClosePrevent} onOpenChange={onOpenChange}>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="dialog-content"]')).toBeNull()
    })
  })

  test('forwards custom classes and styles to dialog slots', () => {
    render(() => (
      <Dialog
        open
        classes={{
          content: 'custom-content-class',
          contentClose: 'custom-close-class',
          header: 'custom-header-class',
          title: 'custom-title-class',
          description: 'custom-desc-class',
          body: 'custom-body-class',
          footer: 'custom-footer-class',
        }}
        styles={{
          content: { 'border-width': '3px' },
          contentClose: { opacity: '0.8' },
          header: { 'padding-top': '20px' },
          title: { 'letter-spacing': '1px' },
          description: { 'line-height': '1.5' },
          body: { 'font-size': '15px' },
          footer: { 'margin-top': '10px' },
        }}
      >
        <Dialog.Content title="Custom Title" description="Custom Description">
          <Dialog.Body>Custom Body</Dialog.Body>
          <Dialog.Footer>Custom Footer</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const header = document.body.querySelector('[data-slot="dialog-header"]') as HTMLElement
    const title = document.body.querySelector('[data-slot="dialog-title"]') as HTMLElement
    const description = document.body.querySelector(
      '[data-slot="dialog-description"]',
    ) as HTMLElement
    const body = document.body.querySelector('[data-slot="dialog-body"]') as HTMLElement
    const footer = document.body.querySelector('[data-slot="dialog-footer"]') as HTMLElement
    const close = document.body.querySelector('[data-slot="dialog-content-close"]') as HTMLElement

    const content = document.body.querySelector('[data-slot="dialog-content"]') as HTMLElement

    expect(content.className).toContain('custom-content-class')
    expect(header.className).toContain('custom-header-class')
    expect(title.className).toContain('custom-title-class')
    expect(description.className).toContain('custom-desc-class')
    expect(body.className).toContain('custom-body-class')
    expect(footer.className).toContain('custom-footer-class')
    expect(close.className).toContain('custom-close-class')

    expect(content.style.borderWidth).toBe('3px')
    expect(header.style.paddingTop).toBe('20px')
    expect(title.style.letterSpacing).toBe('1px')
    expect(description.style.lineHeight).toBe('1.5')
    expect(body.style.fontSize).toBe('15px')
    expect(footer.style.marginTop).toBe('10px')
    expect(close.style.opacity).toBe('0.8')
  })

  test('marks the body with the header and footer that are present', () => {
    const { unmount } = render(() => (
      <Dialog open closable={false}>
        <Dialog.Content title={false} description={false}>
          <Dialog.Body>No header body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const bodyNoHeader = document.body.querySelector('[data-slot="dialog-body"]') as HTMLElement
    expect(bodyNoHeader.hasAttribute('data-header')).toBe(false)
    expect(bodyNoHeader.hasAttribute('data-footer')).toBe(false)
    unmount()

    render(() => (
      <Dialog open>
        <Dialog.Content title="Title">
          <Dialog.Body>With header and footer</Dialog.Body>
          <Dialog.Footer>
            <button type="button">Action</button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const bodyWithBoth = document.body.querySelector('[data-slot="dialog-body"]') as HTMLElement
    expect(bodyWithBoth.hasAttribute('data-header')).toBe(true)
    expect(bodyWithBoth.hasAttribute('data-footer')).toBe(true)
  })

  test('escape only closes the topmost overlay when dialogs are nested', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <Dialog defaultOpen onOpenChange={onOuterChange}>
          <Dialog.Trigger as="button" type="button">
            Outer trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>
              <div data-testid="outer-body">Outer body</div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
        <Dialog defaultOpen onOpenChange={onInnerChange}>
          <Dialog.Trigger as="button" type="button">
            Inner trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>
              <div data-testid="inner-body">Inner body</div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    const contents = document.body.querySelectorAll('[data-slot="dialog-content"]')
    expect(contents.length).toBe(2)

    const innerContent = contents[contents.length - 1] as HTMLElement
    innerContent.focus()
    fireEvent.keyDown(innerContent, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onInnerChange).toHaveBeenCalledWith(false)
      expect(onOuterChange).not.toHaveBeenCalled()
      expect(document.body.querySelectorAll('[data-slot="dialog-content"]').length).toBe(1)
    })
  })

  test('outer dialog ignores pointerdown that lands inside a nested dialog', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <Dialog defaultOpen onOpenChange={onOuterChange}>
          <Dialog.Trigger as="button" type="button">
            Outer trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>
              <div data-testid="outer-body">Outer body</div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
        <Dialog defaultOpen onOpenChange={onInnerChange}>
          <Dialog.Trigger as="button" type="button">
            Inner trigger
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Body>
              <button type="button" data-testid="inner-button">
                Inner button
              </button>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))

    const innerButton = document.body.querySelector('[data-testid="inner-button"]')!
    fireEvent.pointerDown(innerButton)

    expect(onOuterChange).not.toHaveBeenCalled()
    expect(onInnerChange).not.toHaveBeenCalled()
    expect(document.body.querySelectorAll('[data-slot="dialog-content"]').length).toBe(2)
  })

  test('preserves custom id on Dialog.Content and updates trigger aria-controls', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content id="custom-dialog-id">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    const trigger = document.body.querySelector('[data-slot="dialog-trigger"]')!
    expect(content.id).toBe('custom-dialog-id')
    expect(trigger.getAttribute('aria-controls')).toBe('custom-dialog-id')
  })

  test('preserves locale direction when dir is undefined and allows explicit dir override', () => {
    render(() => (
      <MoraineProvider dir="rtl">
        <Dialog open>
          <Dialog.Content dir={undefined} data-testid="default-dir">
            <Dialog.Body>Default RTL</Dialog.Body>
          </Dialog.Content>
        </Dialog>
        <Dialog open>
          <Dialog.Content dir="ltr" data-testid="explicit-dir">
            <Dialog.Body>Explicit LTR</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </MoraineProvider>
    ))

    const defaultDir = document.body.querySelector('[data-testid="default-dir"]')!
    const explicitDir = document.body.querySelector('[data-testid="explicit-dir"]')!
    expect(defaultDir.getAttribute('dir')).toBe('rtl')
    expect(explicitDir.getAttribute('dir')).toBe('ltr')
  })

  test('supports render function children receiving close action', () => {
    const onOpenChange = vi.fn()
    render(() => (
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <Dialog.Content>
          {({ close }) => (
            <button type="button" data-testid="render-close" onClick={close}>
              Close via render prop
            </button>
          )}
        </Dialog.Content>
      </Dialog>
    ))

    const closeButton = document.body.querySelector<HTMLButtonElement>(
      '[data-testid="render-close"]',
    )!
    expect(closeButton).not.toBeNull()
    fireEvent.click(closeButton)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('reacts to Show control flow and zero-argument accessors inside Dialog.Content', () => {
    const [visible, setVisible] = createSignal(true)
    const screen = render(() => (
      <Dialog defaultOpen>
        <Dialog.Content>
          <Show when={visible()} fallback={<span data-testid="fallback">Fallback</span>}>
            <span data-testid="visible">Visible</span>
          </Show>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="visible"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="fallback"]')).toBeNull()

    setVisible(false)

    expect(document.body.querySelector('[data-testid="visible"]')).toBeNull()
    expect(document.body.querySelector('[data-testid="fallback"]')).not.toBeNull()
    screen.unmount()
  })

  test('forwards ref to Dialog.Content DOM element', () => {
    let captured: HTMLDivElement | undefined
    render(() => (
      <Dialog open>
        <Dialog.Content ref={(el) => (captured = el)}>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(captured).toBeInstanceOf(HTMLElement)
    expect(captured?.getAttribute('data-slot')).toBe('dialog-content')
  })

  test('runs the consumer onKeyDown handler and honors its preventDefault', () => {
    const onKeyDown = vi.fn((event: KeyboardEvent) => {
      event.preventDefault()
    })
    render(() => (
      <Dialog open modal>
        <Dialog.Content onKeyDown={onKeyDown}>
          <input data-testid="input" />
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    const notCancelled = fireEvent.keyDown(content, { key: 'Tab' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(notCancelled).toBe(false)
  })

  test('supports polymorphic rendering via as prop on Content', () => {
    render(() => (
      <Dialog open>
        <Dialog.Content as="form" data-testid="form-dialog">
          <span>Form body</span>
        </Dialog.Content>
      </Dialog>
    ))
    const dialog = document.body.querySelector('[data-testid="form-dialog"]')
    expect(dialog).not.toBeNull()
    expect(dialog?.tagName).toBe('FORM')
    expect(dialog?.getAttribute('role')).toBe('dialog')
  })
})
