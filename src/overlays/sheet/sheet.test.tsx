import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'
import { renderWithDesign } from '../../test-utils/design-render.tsx'
import { finishExitMotion } from '../../test-utils/overlay-test'

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
    renderWithDesign(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content side={side} body="Sheet body" />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.getAttribute('data-side')).toBe(side)
    expect(content?.className).toContain(expectedClass)
    expect(content?.className).toContain('data-expanded:animate-mo-enter')
    expect(content?.className).toContain('data-closed:animate-mo-exit')
    expect(content?.className).toContain(sideClass)
  })

  test('applies inset + transition=false classes', () => {
    renderWithDesign(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content
          side="right"
          inset
          transition={false}
          classes={{
            content: 'content-class',
          }}
          body="Body"
        />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('sm:m-4 sm:border sm:border-border sm:rounded-2xl')
    expect(content?.getAttribute('data-transition')).toBe('false')
    expect(content?.className).toContain('content-class')
  })

  test('renders default shell with title, description, actions, body, footer and close button', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content
          title="Panel"
          description="Panel description"
          action={<button type="button">Action</button>}
          body="Sheet body"
          footer="Sheet footer"
        />
      </Sheet>
    ))

    expect(document.body.textContent).toContain('Panel')
    expect(document.body.textContent).toContain('Panel description')
    expect(document.body.textContent).toContain('Action')
    expect(document.body.textContent).toContain('Sheet body')
    expect(document.body.textContent).toContain('Sheet footer')
    expect(document.body.querySelector('[data-slot="close"]')).not.toBeNull()
  })

  test('only references mounted default title and description nodes', () => {
    render(() => (
      <Sheet open>
        <Sheet.Content title="Sheet title" description="Sheet description" body="Body" />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expectAriaReferencesToResolve(content)
    expect(content.getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="title"]')?.id,
    )
    expect(content.getAttribute('aria-describedby')).toBe(
      document.body.querySelector('[data-slot="description"]')?.id,
    )
  })

  test('uses ariaLabel for a custom header without dangling generated IDs', () => {
    render(() => (
      <Sheet open>
        <Sheet.Content
          title="Suppressed title"
          description="Suppressed description"
          header={<div>Custom header</div>}
          ariaLabel="Account panel"
          body="Body"
        />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('aria-label')).toBe('Account panel')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expectAriaReferencesToResolve(content)
  })

  test('preserves numeric zero in every shell content slot', () => {
    render(() => (
      <Sheet open>
        <Sheet.Content title={0} description={0} action={0} body={0} footer={0} />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="title"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="description"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="actions"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="body"]')?.textContent).toBe('0')
    expect(document.body.querySelector('[data-slot="footer"]')?.textContent).toBe('0')
    expectAriaReferencesToResolve(document.body.querySelector('[data-slot="content"]')!)
  })

  test.each([
    ['title only', 'Title', undefined, undefined, true, false],
    ['description only', undefined, 'Description', 'Description sheet', false, true],
    ['no title or description', undefined, undefined, 'Unnamed sheet', false, false],
  ] as const)(
    'keeps ARIA references valid for %s',
    (_case, title, description, ariaLabel, hasLabelledBy, hasDescribedBy) => {
      render(() => (
        <Sheet open>
          <Sheet.Content
            title={title}
            description={description}
            ariaLabel={ariaLabel}
            body="Body"
          />
        </Sheet>
      ))

      const content = document.body.querySelector('[data-slot="content"]')!
      expect(Boolean(content.getAttribute('aria-labelledby'))).toBe(hasLabelledBy)
      expect(Boolean(content.getAttribute('aria-describedby'))).toBe(hasDescribedBy)
      expect(content.getAttribute('aria-label')).toBe(ariaLabel ?? null)
      expectAriaReferencesToResolve(content)
    },
  )

  test('distinguishes empty shell content from false presence', () => {
    const empty = render(() => (
      <Sheet open>
        <Sheet.Content title="" description="" action="" body="" footer="" close={false} />
      </Sheet>
    ))
    expect(document.body.querySelector('[data-slot="title"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="description"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="actions"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="footer"]')).not.toBeNull()
    empty.unmount()

    render(() => (
      <Sheet open>
        <Sheet.Content
          title={false}
          description={false}
          action={false}
          body={false}
          footer={false}
          close={false}
        />
      </Sheet>
    ))
    expect(document.body.querySelector('[data-slot="header"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="body"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="footer"]')).toBeNull()
  })

  test('evaluates every getter-backed shell JSX prop once', () => {
    const reads = {
      action: 0,
      body: 0,
      children: 0,
      close: 0,
      description: 0,
      footer: 0,
      header: 0,
      title: 0,
    }

    render(() => (
      <Sheet open>
        {createComponent(Sheet.Content, {
          ariaLabel: 'Getter sheet',
          get title() {
            reads.title += 1
            return 'Title'
          },
          get description() {
            reads.description += 1
            return 'Description'
          },
          get header() {
            reads.header += 1
            return undefined
          },
          get action() {
            reads.action += 1
            return <div>Action</div>
          },
          get body() {
            reads.body += 1
            return <div>Body</div>
          },
          get footer() {
            reads.footer += 1
            return <div>Footer</div>
          },
          get close() {
            reads.close += 1
            return <span>Close icon</span>
          },
          get children() {
            reads.children += 1
            return <span>Fallback children</span>
          },
        })}
      </Sheet>
    ))

    expect(reads).toEqual({
      action: 1,
      body: 1,
      children: 0,
      close: 1,
      description: 1,
      footer: 1,
      header: 1,
      title: 1,
    })
  })

  test('reacts to side, inset, and transition changes without remounting content', () => {
    const [side, setSide] = createSignal<'left' | 'right'>('left')
    const [inset, setInset] = createSignal(false)
    const [transition, setTransition] = createSignal(true)

    renderWithDesign(() => (
      <Sheet open>
        <Sheet.Content
          side={side()}
          inset={inset()}
          transition={transition()}
          ariaLabel="Reactive sheet"
          body="Body"
        />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('data-side')).toBe('left')
    expect(content.className).toContain('left-0')
    expect(content.className).toContain('rounded-none')
    expect(content.hasAttribute('data-transition')).toBe(false)

    setSide('right')
    setInset(true)
    setTransition(false)

    expect(document.body.querySelector('[data-slot="content"]')).toBe(content)
    expect(content.getAttribute('data-side')).toBe('right')
    expect(content.className).toContain('right-0')
    expect(content.className).not.toContain('left-0')
    expect(content.className).toContain('sm:m-4 sm:border sm:border-border sm:rounded-2xl')
    expect(content?.getAttribute('data-transition')).toBe('false')
  })

  test('releases content and scroll lock when unmounted during exit', async () => {
    const screen = render(() => (
      <Sheet defaultOpen>
        <Sheet.Content ariaLabel="Unmounting sheet" body="Body" />
      </Sheet>
    ))

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })
    fireEvent.click(document.body.querySelector('[data-slot="close"]')!)
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    screen.unmount()

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content body="Body" />
      </Sheet>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders a span trigger root', () => {
    render(() => (
      <Sheet>
        <Sheet.Trigger as="span">Open</Sheet.Trigger>
        <Sheet.Content body="Body" />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="trigger"]')?.tagName).toBe('SPAN')
  })

  test('supports custom close content', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content close={<span data-testid="custom-close">X</span>} body="Body" />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content close={false} body="Body" />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="close"]')).toBeNull()
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content
          title="Sheet title"
          body={<div data-testid="custom-body">Body Content</div>}
        />
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
        <Sheet.Content title="Sheet" body="Body" />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    fireEvent.click(screen.getByText('Open sheet'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector('[data-slot="close"]') as HTMLElement
    fireEvent.click(closeButton)

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content title="Portal default" body="Body" />
      </Sheet>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content overlay={false} body="Body" />
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('preserves Modal overlay behavior when an instance slot overrides the backdrop', () => {
    renderWithDesign(() => (
      <Sheet open>
        <Sheet.Content body="Body" classes={{ overlay: 'bg-red-500 custom-sheet-overlay' }} />
      </Sheet>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
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
    renderWithDesign(() => (
      <MoraineProvider
        design={createDesign({
          sheet: { base: { overlay: 'bg-blue-500 provider-sheet-overlay' } },
        })}
      >
        <Sheet open>
          <Sheet.Content body="Body" />
        </Sheet>
      </MoraineProvider>
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
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
        <Sheet.Content body="Body" />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
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
          <Sheet.Content body="Body" />
        </Sheet>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
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
        <Sheet.Content body="Body" />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    fireEvent.keyDown(content, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => (
      <Sheet open>
        <Sheet.Content body="Body" />
      </Sheet>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain('Body')
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Sheet open>
        <Sheet.Trigger as="button" type="button">
          Trigger
        </Sheet.Trigger>
        <Sheet.Content body="Body" styles={{ content: { width: '200px' } }} />
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
