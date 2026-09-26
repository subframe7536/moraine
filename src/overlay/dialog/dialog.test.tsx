import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../element/button'
import { CommandPalette } from '../../navigation/command-palette'
import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { renderWithTheme } from '../../test-util/theme-render'
import { defineTheme } from '../../theme'
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
      <Dialog open close={false}>
        <Dialog.Content title="Outer title">
          <Dialog.Body>
            <Show when={showSheet()}>
              <Sheet open close={false} side="left">
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
    expect(inner.className).toContain('left-0')

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

  test('renders default shell with title, description, body, footer and close button', () => {
    renderWithTheme(() => (
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

    expect(document.body.textContent).toContain('Confirm')
    expect(document.body.textContent).toContain('Please confirm')
    expect(document.body.textContent).toContain('Modal body')
    expect(document.body.textContent).toContain('Modal footer')
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()

    const content = document.body.querySelector('[data-slot="dialog-content"]')
    expect(content?.tagName).toBe('DIV')
    expect(content?.className).toContain('bg-popover')
    expect(content?.className).toContain('border-border')
    expect(content?.className).toContain('data-expanded:animate-mo-enter')
    expect(content?.className).toContain('motion-reduce:animate-none')
  })

  test('renders the dialog shell with native slot containers', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Composed">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')
    expect(content).not.toBeNull()
    expect(content?.querySelector('[data-slot="dialog-header"]')).not.toBeNull()
    expect(content?.querySelector('[data-slot="dialog-body"]')).not.toBeNull()
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
    renderWithTheme(() => (
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
    expect(trigger.className).toContain('border-border')
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

  test('uses ariaLabel for a custom header without dangling generated IDs', () => {
    render(() => (
      <Dialog
        open

        ariaLabel="Account settings"
      >
        <Dialog.Content title="Suppressed title" description="Suppressed description">
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
      <Dialog
        open

        ariaLabel="Root dialog label"
      >
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

  test('inherits non-modal trapFocus false behavior', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Dialog defaultOpen trapFocus={false}>
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
    expect(outside.getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.overflow).toBe('')
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
        <Dialog open ariaLabel={ariaLabel}>
          <Dialog.Content title={title} description={description}>
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

  test('distinguishes empty content from false presence', () => {
    const empty = render(() => (
      <Dialog open close={false}>
        <Dialog.Content title="" description="">
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))
    expect(document.body.querySelector('[data-slot="dialog-title"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-description"]')).not.toBeNull()
    empty.unmount()

    render(() => (
      <Dialog open close={false}>
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

  test('reads shorthand and composed children when content opens', () => {
    let childrenReads = 0
    render(() => (
      <Dialog open>
        {createComponent(Dialog.Content, {
          title: 'Title',
          description: 'Description',
          get children() {
            childrenReads += 1
            return (
              <>
                <Dialog.Body>Body</Dialog.Body>
                <Dialog.Footer>Footer</Dialog.Footer>
              </>
            )
          },
        })}
      </Dialog>
    ))
    expect(childrenReads).toBe(1)
    expect(document.body.querySelector('[data-slot="dialog-body"]')?.textContent).toBe('Body')
    expect(document.body.querySelector('[data-slot="dialog-footer"]')?.textContent).toBe('Footer')
  })

  test('composes explicit header, reactive ARIA IDs, action, and body presence', () => {
    const [showHeader, setShowHeader] = createSignal(true)
    const [showTitle, setShowTitle] = createSignal(true)
    const [showDescription, setShowDescription] = createSignal(true)
    const [showFooter, setShowFooter] = createSignal(true)
    const [titleId, setTitleId] = createSignal('custom-title')
    render(() => (
      <Dialog
        open
        classes={{ action: 'family-action', body: 'family-body' }}
        styles={{ action: { color: 'red' } }}

        close={false}
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
              <Dialog.Action data-testid="action">Help</Dialog.Action>
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
    const action = document.body.querySelector<HTMLElement>('[data-slot="dialog-action"]')!
    expect(action.className).toContain('family-action')
    expect(action.style.color).toBe('red')
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

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Dialog title">
          <Dialog.Body>
            <div data-testid="custom-body">Body Content</div>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-body"]')?.textContent).toContain(
      'Body Content',
    )
    expect(document.body.textContent).toContain('Dialog title')
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
        close={false}
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

  test('preserves Modal overlay behavior when an instance slot overrides the backdrop', () => {
    renderWithTheme(() => (
      <Dialog open>
        <Dialog.Content classes={{ overlay: 'bg-red-500 custom-dialog-overlay' }}>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const overlay = document.body.querySelector('[data-slot="dialog-overlay"]') as HTMLElement
    expect(overlay.className).toContain('fixed')
    expect(overlay.className).toContain('inset-0')
    expect(overlay.className).toContain('z-floating')
    expect(overlay.className).toContain('data-expanded:animate-mo-enter')
    expect(overlay.className).toContain('data-closed:animate-mo-exit')
    expect(overlay.className).toContain('motion-reduce:animate-none')
    expect(overlay.className).toContain('bg-red-500')
    expect(overlay.className).toContain('custom-dialog-overlay')
    expect(overlay.className).not.toContain('bg-black/10')
  })

  test('preserves Modal overlay behavior for provider slot overrides', () => {
    renderWithTheme(() => (
      <MoraineProvider
        theme={defineTheme({
          dialog: { base: { overlay: 'bg-blue-500 provider-dialog-overlay' } },
        })}
      >
        <Dialog open>
          <Dialog.Content>
            <Dialog.Body>Body</Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </MoraineProvider>
    ))

    const overlay = document.body.querySelector('[data-slot="dialog-overlay"]') as HTMLElement
    expect(overlay.className).toContain('fixed')
    expect(overlay.className).toContain('inset-0')
    expect(overlay.className).toContain('z-floating')
    expect(overlay.className).toContain('data-expanded:animate-mo-enter')
    expect(overlay.className).toContain('data-closed:animate-mo-exit')
    expect(overlay.className).toContain('motion-reduce:animate-none')
    expect(overlay.className).toContain('bg-blue-500')
    expect(overlay.className).toContain('provider-dialog-overlay')
    expect(overlay.className).not.toContain('bg-black/10')
  })

  test('keeps long dialog content scrolling inside the body', () => {
    renderWithTheme(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content title="Long content">
          <Dialog.Body>
            <div style={{ height: '2000px' }}>Long body</div>
          </Dialog.Body>
          <Dialog.Footer>Actions</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const overlays = document.body.querySelectorAll('[data-slot="dialog-overlay"]')
    const contents = document.body.querySelectorAll('[data-slot="dialog-content"]')
    const overlay = overlays[overlays.length - 1]
    const content = contents[contents.length - 1]

    expect(overlay).not.toBeNull()
    expect(overlay?.contains(content ?? null)).toBe(false)
    expect(overlay?.parentElement).toBe(content?.parentElement)
    expect(overlay?.parentElement?.parentElement).toBe(content?.parentElement?.parentElement)
    expect(content?.className).toContain('fixed')
    expect(content?.className).toContain('flex-col')
    expect(content?.className).toContain('max-h-[calc(100dvh-2rem)]')
    expect(content?.className).toContain('overflow-hidden')
    expect(content?.querySelector('[data-slot="dialog-body"]')?.className).toContain(
      'overflow-y-auto',
    )
    expect(content?.querySelector('[data-slot="dialog-header"]')?.className).toContain('shrink-0')
    expect(content?.querySelector('[data-slot="dialog-footer"]')?.className).toContain('shrink-0')
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('moves long dialog scrolling to the overlay when scrollable is true', () => {
    // Model the recipe's overflow utility in jsdom so scroll locking detects the overlay.
    renderWithTheme(() => (
      <Dialog open scrollable>
        <Dialog.Content title="Overlay scroll" styles={{ overlay: { 'overflow-y': 'auto' } }}>
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
    expect(overlay?.className).toContain('overflow-y-auto')
    expect(overlay?.className).toContain('p-4')
    expect(overlay?.style.overflowY).toBe('auto')
    expect(overlay?.style.getPropertyValue('overflow')).toBe('')
    expect(document.body.style.overflow).toBe('hidden')
    expect(content?.className).toContain('relative')
    expect(content?.className).not.toContain('fixed')
    expect(body?.hasAttribute('data-scroll')).toBe(false)
  })

  test('uses a full viewport flex panel for fullscreen dialogs', () => {
    renderWithTheme(() => (
      <Dialog open fullscreen>
        <Dialog.Content>
          <Dialog.Body>Fullscreen body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="dialog-content"]')

    expect(content?.className).toContain('inset-0')
    expect(content?.className).toContain('size-full')
    expect(content?.className).toContain('flex-col')
    expect(content?.className).toContain('overflow-hidden')
    expect(content?.querySelector('[data-slot="dialog-body"]')?.className).toContain(
      'overflow-y-auto',
    )
  })

  test('reacts to root fullscreen and scrollable changes', () => {
    const [scrollable, setScrollable] = createSignal(false)
    const [fullscreen, setFullscreen] = createSignal(false)
    const [overlayVisible, setOverlayVisible] = createSignal(true)
    renderWithTheme(() => (
      <Dialog open scrollable={scrollable()} fullscreen={fullscreen()} overlay={overlayVisible()}>
        <Dialog.Content title="Layout">Content</Dialog.Content>
      </Dialog>
    ))

    const overlay = () => document.body.querySelector('[data-slot="dialog-overlay"]')
    const content = () => document.body.querySelector('[data-slot="dialog-content"]')
    expect(overlay()?.contains(content())).toBe(false)
    expect(content()?.className).toContain('fixed')

    setScrollable(true)
    expect(overlay()?.contains(content())).toBe(true)
    expect(content()?.className).toContain('relative')

    setFullscreen(true)
    expect(overlay()?.contains(content())).toBe(false)
    expect(content()?.className).toContain('size-full')

    setOverlayVisible(false)
    expect(overlay()).toBeNull()
    expect(content()).not.toBeNull()
  })

  test('keeps shorthand JSX within one presence cycle across scroll layout changes', () => {
    const [scrollable, setScrollable] = createSignal(false)
    let titleReads = 0
    let descriptionReads = 0
    render(() => (
      <Dialog open scrollable={scrollable()}>
        {createComponent(Dialog.Content, {
          get title() {
            titleReads += 1
            return <span>Title</span>
          },
          get description() {
            descriptionReads += 1
            return <span>Description</span>
          },
          get children() {
            return <Dialog.Body>Body</Dialog.Body>
          },
        })}
      </Dialog>
    ))

    expect(titleReads).toBe(1)
    expect(descriptionReads).toBe(1)
    setScrollable(true)
    setScrollable(false)
    expect(titleReads).toBe(1)
    expect(descriptionReads).toBe(1)

    const content = document.body.querySelector('[data-slot="dialog-content"]')!
    expect(content.textContent).toContain('Body')
    expectAriaReferencesToResolve(content)
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
    expect(automatic.className).toContain('automatic-close')
    expect(automatic.className).toContain('absolute')
    expect(explicit.className).toContain('explicit-close')
    expect(explicit.className).not.toContain('automatic-close')
    expect(explicit.className).not.toContain('absolute')

    fireEvent.click(explicit)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Dialog open close={false}>
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

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
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
        <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
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

  test('allows close when dismissible=true', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Dialog defaultOpen dismissible onClosePrevent={onClosePrevent} onOpenChange={onOpenChange}>
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

  test('applies styles override to content', () => {
    render(() => (
      <Dialog open>
        <Dialog.Trigger as="button" type="button">
          Trigger
        </Dialog.Trigger>
        <Dialog.Content styles={{ content: { width: '200px' } }}>
          <Dialog.Body>Body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const content = document.body.querySelector(
      '[data-slot="dialog-content"]',
    ) as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('forwards custom classes and styles to dialog slots', () => {
    renderWithTheme(() => (
      <Dialog
        open
        classes={{
          header: 'custom-header-class',
          title: 'custom-title-class',
          description: 'custom-desc-class',
          body: 'custom-body-class',
          footer: 'custom-footer-class',
        }}
        styles={{
          header: { 'padding-top': '20px' },
          title: { 'letter-spacing': '1px' },
          description: { 'line-height': '1.5' },
          body: { 'font-size': '15px' },
          footer: { 'margin-top': '10px' },
        }}
      >
        <Dialog.Content
          classes={{
            content: 'custom-content-class',
            contentClose: 'custom-close-class',
          }}
          styles={{
            content: { 'border-width': '3px' },
            contentClose: { opacity: '0.8' },
          }}
          title="Custom Title"
          description="Custom Description"
        >
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

  test('adjusts body padding when header or footer is absent', () => {
    const { unmount } = renderWithTheme(() => (
      <Dialog open close={false}>
        <Dialog.Content title={false} description={false}>
          <Dialog.Body>No header body</Dialog.Body>
        </Dialog.Content>
      </Dialog>
    ))

    const bodyNoHeader = document.body.querySelector('[data-slot="dialog-body"]') as HTMLElement
    expect(bodyNoHeader.hasAttribute('data-header')).toBe(false)
    expect(bodyNoHeader.className).toContain('pb-6')
    unmount()

    renderWithTheme(() => (
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
    expect(bodyWithBoth.className).toContain('pb-2')
  })

  test('keeps structured section padding symmetric around the corner close', () => {
    renderWithTheme(() => (
      <Dialog open>
        <Dialog.Content title="Title">
          <Dialog.Body>Body</Dialog.Body>
          <Dialog.Footer>Footer</Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    ))

    const header = document.body.querySelector('[data-slot="dialog-header"]') as HTMLElement
    const body = document.body.querySelector('[data-slot="dialog-body"]') as HTMLElement
    const footer = document.body.querySelector('[data-slot="dialog-footer"]') as HTMLElement

    expect(header.className).toContain('p-6')
    expect(body.className).toContain('px-6')
    expect(footer.className).toContain('p-6')
    expect(header.className).not.toContain('pe-12')
    expect(body.className).not.toContain('pe-14')
    expect(footer.className).not.toContain('pe-14')
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
})
