import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { Sheet } from './sheet.tsx'

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
    ['left', 'left-0', 'animate-sheet-side-left'],
    ['right', 'right-0', 'animate-sheet-side-right'],
    ['top', 'top-0', 'animate-sheet-side-top'],
    ['bottom', 'bottom-0', 'animate-sheet-side-bottom'],
  ] as const)('applies side variant %s to content', (side, expectedClass, sideClass) => {
    render(() => (
      <Sheet open side={side} body="Sheet body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.getAttribute('data-side')).toBe(side)
    expect(content?.className).toContain(expectedClass)
    expect(content?.className).toContain('data-expanded:animate-sheet-in')
    expect(content?.className).toContain('data-closed:animate-sheet-out')
    expect(content?.className).toContain(sideClass)
  })

  test('applies inset + transition=false classes', () => {
    render(() => (
      <Sheet
        open
        side="right"
        inset
        transition={false}
        classes={{
          content: 'content-class',
        }}
        body="Body"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('sm:(m-4 border border-border rounded-2xl)')
    expect(content?.className).toContain(
      'transition-none data-expanded:animate-none data-closed:animate-none',
    )
    expect(content?.className).toContain('content-class')
  })

  test('renders default shell with title, description, actions, body, footer and close button', () => {
    render(() => (
      <Sheet
        open
        title="Panel"
        description="Panel description"
        action={<button type="button">Action</button>}
        body="Sheet body"
        footer="Sheet footer"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
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
    render(() => <Sheet open title="Sheet title" description="Sheet description" body="Body" />)

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
      <Sheet
        open
        title="Suppressed title"
        description="Suppressed description"
        header={<div>Custom header</div>}
        ariaLabel="Account panel"
        body="Body"
      />
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('aria-label')).toBe('Account panel')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expectAriaReferencesToResolve(content)
  })

  test('preserves numeric zero in every shell content slot', () => {
    render(() => <Sheet open title={0} description={0} action={0} body={0} footer={0} />)

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
        <Sheet open title={title} description={description} ariaLabel={ariaLabel} body="Body" />
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
      <Sheet open title="" description="" action="" body="" footer="" close={false} />
    ))
    expect(document.body.querySelector('[data-slot="title"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="description"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="actions"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="body"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="footer"]')).not.toBeNull()
    empty.unmount()

    render(() => (
      <Sheet
        open
        title={false}
        description={false}
        action={false}
        body={false}
        footer={false}
        close={false}
      />
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

    render(() =>
      createComponent(Sheet, {
        open: true,
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
          return (props: OverlayTriggerProps) => <button {...props}>Trigger</button>
        },
      }),
    )

    expect(reads).toEqual({
      action: 1,
      body: 1,
      children: 1,
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

    render(() => (
      <Sheet
        open
        side={side()}
        inset={inset()}
        transition={transition()}
        ariaLabel="Reactive sheet"
        body="Body"
      />
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('data-side')).toBe('left')
    expect(content.className).toContain('left-0')
    expect(content.className).toContain('rounded-none')
    expect(content.className).not.toContain('transition-none')

    setSide('right')
    setInset(true)
    setTransition(false)

    expect(document.body.querySelector('[data-slot="content"]')).toBe(content)
    expect(content.getAttribute('data-side')).toBe('right')
    expect(content.className).toContain('right-0')
    expect(content.className).not.toContain('left-0')
    expect(content.className).toContain('sm:(m-4 border border-border rounded-2xl)')
    expect(content.className).toContain(
      'transition-none data-expanded:animate-none data-closed:animate-none',
    )
  })

  test('releases content and scroll lock when unmounted during exit', async () => {
    const screen = render(() => <Sheet defaultOpen ariaLabel="Unmounting sheet" body="Body" />)

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
      <Sheet open body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
  })

  test('renders a span trigger root', () => {
    render(() => <Sheet body="Body">{(props) => <span {...props}>Open</span>}</Sheet>)

    expect(document.body.querySelector('[data-slot="trigger"]')?.tagName).toBe('SPAN')
  })

  test('supports custom close content', () => {
    render(() => (
      <Sheet open close={<span data-testid="custom-close">X</span>} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Sheet open close={false} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="close"]')).toBeNull()
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Sheet open title="Sheet title" body={<div data-testid="custom-body">Body Content</div>}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
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
      <Sheet onOpenChange={onOpenChange} title="Sheet" body="Body">
        {(props) => (
          <button {...props} type="button">
            Open sheet
          </button>
        )}
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
      <Sheet open title="Portal default" body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Sheet open overlay={false} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
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
        <Sheet defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
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
      <Sheet
        defaultOpen
        dismissible
        onClosePrevent={onClosePrevent}
        onOpenChange={onOpenChange}
        body="Body"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
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
    render(() => <Sheet open body="Body" />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain('Body')
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Sheet open body="Body" styles={{ content: { width: '200px' } }}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Sheet>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
