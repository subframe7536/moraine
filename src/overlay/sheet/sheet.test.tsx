import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'
import { renderWithTheme } from '../../test-util/theme-render'
import { defineTheme } from '../../theme'

import { Sheet } from './sheet'

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Sheet', () => {
  test.each([
    ['left', 'left-0', '-enter-translate-x-10'],
    ['right', 'right-0', 'enter-translate-x-10'],
    ['top', 'top-0', '-enter-translate-y-10'],
    ['bottom', 'bottom-0', 'enter-translate-y-10'],
  ] as const)('applies side variant %s to content', (side, expectedClass, sideClass) => {
    renderWithTheme(() => (
      <Sheet open side={side}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Sheet body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')

    expect(content?.hasAttribute('data-side')).toBe(false)
    expect(content?.className).toContain(expectedClass)
    expect(content?.className).toContain('data-transition:data-expanded:animate-mo-enter')
    expect(content?.className).toContain('data-transition:data-closed:animate-mo-exit')
    expect(content?.className).toContain(sideClass)
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
      <Sheet open={open()}>
        <Sheet.Content>
          <Sheet.Body>
            <Body />
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
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
      expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    })

    setOpen(true)
    await waitFor(() => {
      expect(mounts).toBe(2)
    })
    screen.unmount()
  })

  test('inherits Modal trigger dialog semantics through exit presence', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Sheet open={open()}>
        <Sheet.Trigger as="a" href="/details">
          Open
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
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

  test('applies inset without transition state', () => {
    renderWithTheme(() => (
      <Sheet open side="right" inset transition={false}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content
          classes={{
            content: 'content-class',
          }}
        >
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')

    expect(content?.className).toContain('sm:m-4 sm:border sm:border-border sm:rounded-2xl')
    expect(content?.hasAttribute('data-transition')).toBe(false)
    expect(content?.className).toContain('content-class')
  })

  test('reacts to root presentation and surface configuration', () => {
    const [side, setSide] = createSignal<'left' | 'right'>('left')
    const [inset, setInset] = createSignal(false)
    const [transition, setTransition] = createSignal(true)
    const [rootClass, setRootClass] = createSignal('first-root')
    render(() => (
      <Sheet
        open
        side={side()}
        inset={inset()}
        transition={transition()}
        classes={{ content: rootClass() }}
      >
        <Sheet.Content title="Panel">Body</Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector<HTMLElement>('[data-slot="sheet-content"]')!
    expect(content.className).toContain('left-0')
    expect(content.className).toContain('first-root')
    expect(content.hasAttribute('data-transition')).toBe(true)

    setSide('right')
    setInset(true)
    setTransition(false)
    setRootClass('second-root')
    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBe(content)
    expect(content.className).toContain('right-0')
    expect(content.className).toContain('sm:m-4')
    expect(content.className).toContain('second-root')
    expect(content.className).not.toContain('first-root')
    expect(content.hasAttribute('data-transition')).toBe(false)
  })

  test('renders default shell with title, description, body, footer and close button', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content title="Panel" description="Panel description">
          <Sheet.Body>Sheet body</Sheet.Body>
          <Sheet.Footer>Sheet footer</Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.textContent).toContain('Panel')
    expect(document.body.textContent).toContain('Panel description')
    expect(document.body.textContent).toContain('Sheet body')
    expect(document.body.textContent).toContain('Sheet footer')
    expect(document.body.querySelector('[data-slot="sheet-content-close"]')).not.toBeNull()
  })

  test('only references mounted default title and description nodes', () => {
    render(() => (
      <Sheet open>
        <Sheet.Content title="Sheet title" description="Sheet description">
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expectAriaReferencesToResolve(content)
    expect(content.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="sheet-title"]')?.id,
    )
    expect(content.getAttribute('aria-describedby')).toBe(
      document.body.querySelector('[data-slot="sheet-description"]')?.id,
    )
  })

  test('uses ariaLabel for a custom header without dangling generated IDs', () => {
    render(() => (
      <Sheet
        open

        ariaLabel="Account panel"
      >
        <Sheet.Content title="Suppressed title" description="Suppressed description">
          <Sheet.Header>
            <div>Custom header</div>
          </Sheet.Header>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Account panel')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expectAriaReferencesToResolve(content)
  })

  test('preserves native ARIA naming attributes over generated Sheet relationships', () => {
    render(() => (
      <Sheet
        open

        ariaLabel="Root sheet label"
      >
        <Sheet.Content
          aria-label="Native sheet label"
          aria-labelledby="custom-sheet-title"
          aria-describedby="custom-sheet-description"
          title="Generated title"
          description="Generated description"
        >
          <Sheet.Body>
            <>
              <h2 id="custom-sheet-title">Custom title</h2>
              <p id="custom-sheet-description">Custom description</p>
            </>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.getAttribute('aria-label')).toBe('Native sheet label')
    expect(content.getAttribute('aria-labelledby')).toBe('custom-sheet-title')
    expect(content.getAttribute('aria-describedby')).toBe('custom-sheet-description')
    expectAriaReferencesToResolve(content)
  })

  test('inherits non-modal trapFocus false behavior', async () => {
    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Sheet defaultOpen trapFocus={false}>
          <Sheet.Content title="Sheet">
            <Sheet.Body>Body</Sheet.Body>
          </Sheet.Content>
        </Sheet>
      </>
    ))
    const outside = screen.getByTestId<HTMLButtonElement>('outside')
    outside.focus()
    await Promise.resolve()
    await Promise.resolve()

    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(outside.getAttribute('aria-hidden')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(outside)
    screen.unmount()
  })

  test('preserves numeric zero in every shell content slot', () => {
    render(() => (
      <Sheet open>
        <Sheet.Content title={0} description={0}>
          <Sheet.Body>{0}</Sheet.Body>
          <Sheet.Footer>{0}</Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="sheet-title"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="sheet-description"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="sheet-body"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="sheet-footer"]')?.textContent).toBe('0')
    expectAriaReferencesToResolve(document.body.querySelector('[data-slot="sheet-content"]')!)
  })

  test.each([
    ['title only', 'Title', undefined, undefined, true, false],
    ['description only', undefined, 'Description', 'Description sheet', false, true],
    ['no title or description', undefined, undefined, 'Unnamed sheet', false, false],
  ] as const)(
    'keeps ARIA references valid for %s',
    (_case, title, description, ariaLabel, hasLabelledBy, hasDescribedBy) => {
      render(() => (
        <Sheet open ariaLabel={ariaLabel}>
          <Sheet.Content title={title} description={description}>
            <Sheet.Body>Body</Sheet.Body>
          </Sheet.Content>
        </Sheet>
      ))

      const content = document.body.querySelector('[data-slot="sheet-content"]')!
      expect(Boolean(content.getAttribute('aria-labelledby'))).toBe(hasLabelledBy)
      expect(Boolean(content.getAttribute('aria-describedby'))).toBe(hasDescribedBy)
      expect(content.getAttribute('aria-label')).toBe(ariaLabel ?? null)
      expectAriaReferencesToResolve(content)
    },
  )

  test('distinguishes empty shell content from false presence', () => {
    const empty = render(() => (
      <Sheet open close={false}>
        <Sheet.Content title="" description="">
          <Sheet.Body>{''}</Sheet.Body>
          <Sheet.Footer>{''}</Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    ))
    expect(document.body.querySelector('[data-slot="sheet-title"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-description"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-footer"]')).not.toBeNull()
    empty.unmount()

    render(() => (
      <Sheet open close={false}>
        <Sheet.Content title={false} description={false} />
      </Sheet>
    ))
    expect(document.body.querySelector('[data-slot="sheet-header"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-body"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-footer"]')).toBeNull()
  })

  test('reads shorthand and composed children when content opens', () => {
    let childrenReads = 0
    render(() => (
      <Sheet open>
        {createComponent(Sheet.Content, {
          title: 'Title',
          description: 'Description',
          get children() {
            childrenReads += 1
            return (
              <>
                <Sheet.Body>Body</Sheet.Body>
                <Sheet.Footer>Footer</Sheet.Footer>
              </>
            )
          },
        })}
      </Sheet>
    ))
    expect(childrenReads).toBe(1)
    expect(document.body.querySelector('[data-slot="sheet-body"]')?.textContent).toBe('Body')
    expect(document.body.querySelector('[data-slot="sheet-footer"]')?.textContent).toBe('Footer')
  })

  test('composes explicit header, reactive ARIA IDs, action, and body presence', () => {
    const [showHeader, setShowHeader] = createSignal(true)
    const [showTitle, setShowTitle] = createSignal(true)
    const [showDescription, setShowDescription] = createSignal(true)
    const [showFooter, setShowFooter] = createSignal(true)
    const [titleId, setTitleId] = createSignal('custom-title')
    render(() => (
      <Sheet
        open
        classes={{ action: 'family-action', body: 'family-body' }}
        styles={{ action: { color: 'red' } }}

        close={false}
      >
        <Sheet.Content title="Fallback" description="Fallback description">
          <Show when={showHeader()}>
            <Sheet.Header>
              <Show when={showTitle()}>
                <Sheet.Title id={titleId()}>Actual title</Sheet.Title>
              </Show>
              <Show when={showDescription()}>
                <Sheet.Description id="custom-description">Actual description</Sheet.Description>
              </Show>
              <Sheet.Action data-testid="action">Help</Sheet.Action>
            </Sheet.Header>
          </Show>
          <Sheet.Body class="local-body">Body</Sheet.Body>
          <Show when={showFooter()}>
            <Sheet.Footer>Actions</Sheet.Footer>
          </Show>
        </Sheet.Content>
      </Sheet>
    ))
    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    const body = document.body.querySelector('[data-slot="sheet-body"]')!
    expect(content.textContent).not.toContain('Fallback')
    expect(content.getAttribute('aria-labelledby')).toBe('custom-title')
    expect(content.getAttribute('aria-describedby')).toBe('custom-description')
    expect(body.hasAttribute('data-header')).toBe(true)
    const action = document.body.querySelector<HTMLElement>('[data-slot="sheet-action"]')!
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
    expect(document.body.querySelector('[data-slot="sheet-footer"]')).toBeNull()
  })

  test('reacts to side, inset, and transition changes without remounting content', () => {
    const [side, setSide] = createSignal<'left' | 'right'>('left')
    const [inset, setInset] = createSignal(false)
    const [transition, setTransition] = createSignal(true)

    renderWithTheme(() => (
      <Sheet
        open
        side={side()}
        inset={inset()}
        transition={transition()}
        ariaLabel="Reactive sheet"
      >
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]')!
    expect(content.hasAttribute('data-side')).toBe(false)
    expect(content.className).toContain('left-0')
    expect(content.className).toContain('rounded-none')
    expect(content.hasAttribute('data-transition')).toBe(true)

    setSide('right')
    setInset(true)
    setTransition(false)

    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBe(content)
    expect(content.hasAttribute('data-side')).toBe(false)
    expect(content.className).toContain('right-0')
    expect(content.className).toContain('sm:m-4 sm:border sm:border-border sm:rounded-2xl')
    expect(content.hasAttribute('data-transition')).toBe(false)
  })

  test('releases content and scroll lock when unmounted during exit', async () => {
    const screen = render(() => (
      <Sheet defaultOpen ariaLabel="Unmounting sheet">
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })
    fireEvent.click(document.body.querySelector('[data-slot="sheet-content-close"]')!)
    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()

    screen.unmount()

    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const trigger = document.body.querySelector('[data-slot="sheet-trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders a span trigger root', () => {
    render(() => (
      <Sheet>
        <Sheet.Trigger as="span">Open</Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="sheet-trigger"]')?.tagName).toBe('SPAN')
  })

  test('supports custom close content', () => {
    render(() => (
      <Sheet open close={<span data-testid="custom-close">X</span>}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('keeps automatic Content close and explicit Close styling separate', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Sheet open onOpenChange={onOpenChange} classes={{ contentClose: 'automatic-close' }}>
        <Sheet.Content>
          <Sheet.Header>
            <div>Custom header</div>
          </Sheet.Header>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
        <Sheet.Close data-testid="explicit-sheet-close" class="explicit-close">
          Explicit close
        </Sheet.Close>
      </Sheet>
    ))

    const automatic = document.body.querySelector<HTMLElement>('[data-slot="sheet-content-close"]')!
    const explicit = screen.getByTestId('explicit-sheet-close')
    expect(automatic.className).toContain('automatic-close')
    expect(automatic.className).toContain('absolute')
    expect(explicit.className).toContain('explicit-close')
    expect(explicit.className).not.toContain('automatic-close')
    expect(explicit.className).not.toContain('absolute')

    fireEvent.click(explicit)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('keeps structured section padding symmetric around the corner close', () => {
    renderWithTheme(() => (
      <Sheet open>
        <Sheet.Content title="Title">
          <Sheet.Body>Body</Sheet.Body>
          <Sheet.Footer>Footer</Sheet.Footer>
        </Sheet.Content>
      </Sheet>
    ))

    const header = document.body.querySelector('[data-slot="sheet-header"]') as HTMLElement
    const body = document.body.querySelector('[data-slot="sheet-body"]') as HTMLElement
    const footer = document.body.querySelector('[data-slot="sheet-footer"]') as HTMLElement

    expect(header.className).toContain('p-4')
    expect(body.className).toContain('px-4')
    expect(footer.className).toContain('p-4')
    expect(header.className).not.toContain('pe-14')
    expect(body.className).not.toContain('pe-14')
    expect(footer.className).not.toContain('pe-14')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Sheet open close={false}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="sheet-content-close"]')).toBeNull()
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content title="Sheet title">
          <Sheet.Body>
            <div data-testid="custom-body">Body Content</div>
          </Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-body"]')?.textContent).toContain(
      'Body Content',
    )
    expect(document.body.textContent).toContain('Sheet title')
  })

  test('opens by trigger click and closes through close button', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <Sheet onOpenChange={onOpenChange}>
        <Sheet.Trigger as="button" type="button">
          Open sheet
        </Sheet.Trigger>
        <Sheet.Content title="Sheet">
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()

    fireEvent.click(screen.getByText('Open sheet'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector(
      '[data-slot="sheet-content-close"]',
    ) as HTMLElement
    fireEvent.click(closeButton)

    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    })
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content title="Portal default">
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(screen.container.querySelector('[data-slot="sheet-content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Sheet open overlay={false}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="sheet-overlay"]')).toBeNull()
  })

  test('preserves Modal overlay behavior when an instance slot overrides the backdrop', () => {
    renderWithTheme(() => (
      <Sheet open>
        <Sheet.Content classes={{ overlay: 'bg-red-500 custom-sheet-overlay' }}>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const overlay = document.body.querySelector('[data-slot="sheet-overlay"]') as HTMLElement
    expect(overlay.className).toContain('fixed')
    expect(overlay.className).toContain('inset-0')
    expect(overlay.className).toContain('z-floating')
    expect(overlay.className).toContain('data-expanded:animate-mo-enter')
    expect(overlay.className).toContain('data-closed:animate-mo-exit')
    expect(overlay.className).toContain('motion-reduce:animate-none')
    expect(overlay.className).toContain('bg-red-500')
    expect(overlay.className).toContain('custom-sheet-overlay')
    expect(overlay.className).not.toContain('bg-black/10')
  })

  test('preserves Modal overlay behavior for provider slot overrides', () => {
    renderWithTheme(() => (
      <MoraineProvider
        theme={defineTheme({
          sheet: { base: { overlay: 'bg-blue-500 provider-sheet-overlay' } },
        })}
      >
        <Sheet open>
          <Sheet.Content>
            <Sheet.Body>Body</Sheet.Body>
          </Sheet.Content>
        </Sheet>
      </MoraineProvider>
    ))

    const overlay = document.body.querySelector('[data-slot="sheet-overlay"]') as HTMLElement
    expect(overlay.className).toContain('fixed')
    expect(overlay.className).toContain('inset-0')
    expect(overlay.className).toContain('z-floating')
    expect(overlay.className).toContain('data-expanded:animate-mo-enter')
    expect(overlay.className).toContain('data-closed:animate-mo-exit')
    expect(overlay.className).toContain('motion-reduce:animate-none')
    expect(overlay.className).toContain('bg-blue-500')
    expect(overlay.className).toContain('provider-sheet-overlay')
    expect(overlay.className).not.toContain('bg-black/10')
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    })
  })

  test('emits onClosePrevent once for blocked outside pointer interaction', async () => {
    const onClosePrevent = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent}>
          <Sheet.Trigger as="button" type="button">
            Trigger
          </Sheet.Trigger>
          <Sheet.Content>
            <Sheet.Body>Body</Sheet.Body>
          </Sheet.Content>
        </Sheet>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
    })
  })

  test('allows close when dismissible=true', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Sheet defaultOpen dismissible onClosePrevent={onClosePrevent} onOpenChange={onOpenChange}>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    })
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => (
      <Sheet open>
        <Sheet.Content>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')?.textContent).toContain(
        'Body',
      )
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content styles={{ content: { width: '200px' } }}>
          <Sheet.Body>Body</Sheet.Body>
        </Sheet.Content>
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="sheet-content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
