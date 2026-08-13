import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createComponent, createMemo, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { CommandPalette } from '../../navigation/command-palette/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { Modal } from '../base/index.ts'
import type { ModalT } from '../base/modal.tsx'
import type { OverlayTriggerProps } from '../base/trigger.ts'

import { Dialog } from './dialog.tsx'

interface TestModalProps {
  defaultOpen?: boolean
  open?: boolean
  overlay?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: (props: OverlayTriggerProps) => JSX.Element
  content?: ComponentOrElement<ModalT.ContentContext>
}

function TestModal(props: TestModalProps): JSX.Element {
  const trigger = createMemo(() => props.trigger)
  const content = createMemo(() => props.content)

  return (
    <Modal open={props.open} defaultOpen={props.defaultOpen} onOpenChange={props.onOpenChange}>
      <Modal.Trigger children={trigger()} />
      <Show when={content()}>
        <Modal.Content overlay={props.overlay} contentRender={content()!} />
      </Show>
    </Modal>
  )
}

async function finishExitMotion(): Promise<void> {
  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]
  const overlays = Array.from(
    document.body.querySelectorAll('[data-slot="overlay"]'),
  ) as HTMLElement[]

  for (const content of contents) {
    await fireEvent.animationEnd(content)
    await fireEvent.transitionEnd(content)
  }

  for (const overlay of overlays) {
    await fireEvent.animationEnd(overlay)
    await fireEvent.transitionEnd(overlay)
  }
}

function expectAriaReferencesToResolve(content: Element): void {
  for (const attribute of ['aria-labelledby', 'aria-describedby']) {
    const value = content.getAttribute(attribute)

    for (const id of value?.split(/\s+/).filter(Boolean) ?? []) {
      expect(document.getElementById(id)).not.toBeNull()
    }
  }
}

describe('Modal', () => {
  test('evaluates getter-backed trigger and content props once', () => {
    let triggerReads = 0
    let contentReads = 0

    render(() =>
      createComponent(TestModal, {
        open: true,
        get trigger() {
          triggerReads += 1
          return (props: OverlayTriggerProps) => (
            <button {...props} type="button">
              Open modal
            </button>
          )
        },
        get content() {
          contentReads += 1
          return () => <span>Cached content</span>
        },
      }),
    )

    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(1)
    expect(document.body.textContent).toContain('Cached content')
  })

  test('renders default shell with title, description, body, footer and close button', () => {
    render(() => (
      <Dialog
        open
        title="Confirm"
        description="Please confirm"
        body="Modal body"
        footer="Modal footer"
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.textContent).toContain('Confirm')
    expect(document.body.textContent).toContain('Please confirm')
    expect(document.body.textContent).toContain('Modal body')
    expect(document.body.textContent).toContain('Modal footer')
    expect(document.body.querySelector('[data-slot="close"]')).not.toBeNull()

    const content = document.body.querySelector('[data-slot="content"]')
    const card = content?.querySelector('[data-slot="root"]')

    expect(card?.className).toContain('bg-background')
    expect(card?.className).toContain('surface-overlay')
    expect(content?.className).toContain('data-expanded:animate-popup-in')
  })

  test('composes dialog content with a card shell', () => {
    render(() => (
      <Dialog open title="Composed" body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    const card = content?.querySelector('[data-slot="root"]')

    expect(content).not.toBeNull()
    expect(card).not.toBeNull()
  })

  test('renders the trigger content as a native button root', () => {
    render(() => (
      <Dialog open body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.getAttribute('type')).toBe('button')
    expect(trigger?.textContent).toBe('Trigger')
  })

  test('renders a polymorphic trigger root without nesting another button', () => {
    render(() => (
      <Dialog body="Body">
        {(props) => (
          <a {...props} href="/details">
            Open
          </a>
        )}
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLAnchorElement
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('/details')
    expect(trigger.querySelector('button')).toBeNull()
  })

  test('renders an existing polymorphic component as the trigger root', () => {
    render(() => (
      <Dialog body="Body">
        {(props) => (
          <Button {...props} variant="outline">
            Open dialog
          </Button>
        )}
      </Dialog>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLButtonElement
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.className).toContain('surface-border')
    expect(trigger.querySelector('button')).toBeNull()
  })

  test('renders function content and closes through modal content context', async () => {
    const onOpenChange = vi.fn()

    render(() => (
      <TestModal
        defaultOpen
        onOpenChange={onOpenChange}
        trigger={(props) => (
          <button {...props} type="button">
            Open modal
          </button>
        )}
        content={({ close }) => (
          <button type="button" data-testid="content-close" onClick={close}>
            Close from content
          </button>
        )}
      />
    ))

    expect(document.body.querySelector('[data-testid="content-close"]')).not.toBeNull()

    await fireEvent.click(document.body.querySelector('[data-testid="content-close"]')!)
    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('renders custom header slot and overrides default title/description section', () => {
    render(() => (
      <Dialog
        open
        title="Default title"
        description="Default description"
        header={<div data-testid="custom-header">Custom Header</div>}
      >
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-header"]')?.textContent).toContain(
      'Custom Header',
    )
    expect(document.body.textContent).not.toContain('Default title')
    expect(document.body.textContent).not.toContain('Default description')
  })

  test('only references mounted default title and description nodes', () => {
    render(() => <Dialog open title="Dialog title" description="Dialog description" body="Body" />)

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
      <Dialog
        open
        title="Suppressed title"
        description="Suppressed description"
        header={<div>Custom header</div>}
        ariaLabel="Account settings"
        body="Body"
      />
    ))

    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.getAttribute('aria-label')).toBe('Account settings')
    expect(content.getAttribute('aria-labelledby')).toBeNull()
    expect(content.getAttribute('aria-describedby')).toBeNull()
    expectAriaReferencesToResolve(content)
  })

  test('preserves numeric zero title and description content', () => {
    render(() => <Dialog open title={0} description={0} body="Body" />)

    const title = document.body.querySelector('[data-slot="title"]')
    const description = document.body.querySelector('[data-slot="description"]')
    const content = document.body.querySelector('[data-slot="content"]')!

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
        <Dialog open title={title} description={description} ariaLabel={ariaLabel} body="Body" />
      ))

      const content = document.body.querySelector('[data-slot="content"]')!
      expect(Boolean(content.getAttribute('aria-labelledby'))).toBe(hasLabelledBy)
      expect(Boolean(content.getAttribute('aria-describedby'))).toBe(hasDescribedBy)
      expect(content.getAttribute('aria-label')).toBe(ariaLabel ?? null)
      expectAriaReferencesToResolve(content)
    },
  )

  test('distinguishes empty content from false presence', () => {
    const empty = render(() => <Dialog open title="" description="" close={false} body="Body" />)
    expect(document.body.querySelector('[data-slot="title"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="description"]')).not.toBeNull()
    empty.unmount()

    render(() => <Dialog open title={false} description={false} close={false} body="Body" />)
    expect(document.body.querySelector('[data-slot="header"]')).toBeNull()
    expect(
      document.body.querySelector('[data-slot="content"]')?.getAttribute('aria-labelledby'),
    ).toBeNull()
    expect(
      document.body.querySelector('[data-slot="content"]')?.getAttribute('aria-describedby'),
    ).toBeNull()
  })

  test('evaluates every getter-backed shell JSX prop once', () => {
    const reads = {
      body: 0,
      children: 0,
      closeIcon: 0,
      description: 0,
      footer: 0,
      header: 0,
      title: 0,
    }

    render(() =>
      createComponent(Dialog, {
        open: true,
        ariaLabel: 'Getter dialog',
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
        get body() {
          reads.body += 1
          return <div>Body</div>
        },
        get footer() {
          reads.footer += 1
          return <div>Footer</div>
        },
        get closeIcon() {
          reads.closeIcon += 1
          return <span>Close icon</span>
        },
        get children() {
          reads.children += 1
          return (props: OverlayTriggerProps) => <button {...props}>Trigger</button>
        },
      }),
    )

    expect(reads).toEqual({
      body: 1,
      children: 1,
      closeIcon: 1,
      description: 1,
      footer: 1,
      header: 1,
      title: 1,
    })
  })

  test('hydrates the closed shell, opens custom content, closes, and restores focus', async () => {
    const markup = renderSsrFixture(
      '/src/overlays/dialog/dialog.ssr.fixture.tsx',
      'renderDialogFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverTriggers = container.querySelectorAll<HTMLButtonElement>('[data-slot="trigger"]')
    const customTrigger = serverTriggers[0]!
    const defaultTrigger = serverTriggers[1]!
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
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
      container,
    )

    expect(container.querySelectorAll('[data-slot="trigger"]')[0]).toBe(customTrigger)
    expect(container.querySelectorAll('[data-slot="trigger"]')[1]).toBe(defaultTrigger)
    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    await fireEvent.click(customTrigger)
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

    await fireEvent.keyDown(content, { key: 'Escape' })
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(customTrigger)
    })

    await fireEvent.click(defaultTrigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
    const defaultContent = document.body.querySelector('[data-slot="content"]')!
    expectAriaReferencesToResolve(defaultContent)
    expect(document.body.querySelector('[data-testid="default-close-icon"]')).not.toBeNull()

    await fireEvent.click(document.body.querySelector('[data-slot="close"]')!)
    await finishExitMotion()
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.activeElement).toBe(defaultTrigger)
    })

    dispose()
    container.remove()
    restoreHydrationState()
  })

  test('renders body content and keeps shell sections', () => {
    render(() => (
      <Dialog open title="Dialog title" body={<div data-testid="custom-body">Body Content</div>}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
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
      <Dialog onOpenChange={onOpenChange} title="Settings" body="Body">
        {(props) => (
          <button {...props} type="button">
            Open modal
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    await fireEvent.click(screen.getByText('Open modal'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const closeButton = document.body.querySelector('[data-slot="close"]') as HTMLElement
    await fireEvent.click(closeButton)

    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps a CommandPalette input value until the Dialog exits', async () => {
    const [open, setOpen] = createSignal(false)
    const [searchTerm, setSearchTerm] = createSignal('')
    const onExitComplete = vi.fn()

    render(() => (
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => {
          setSearchTerm('')
          onExitComplete()
        }}
        close={false}
        body={
          <CommandPalette
            groups={[{ id: 'commands', items: [{ value: 'settings', label: 'Settings' }] }]}
            searchTerm={searchTerm()}
            onSearchTermChange={setSearchTerm}
          />
        }
      >
        {(props) => (
          <button {...props} type="button">
            Open palette
          </button>
        )}
      </Dialog>
    ))

    await fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

    const input = (await waitFor(() =>
      document.body.querySelector('[data-slot="input"]'),
    )) as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Settings' } })

    expect(input.value).toBe('Settings')

    await fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(input.value).toBe('Settings')
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
    expect(onExitComplete).not.toHaveBeenCalled()

    await finishExitMotion()

    await waitFor(() => {
      expect(onExitComplete).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })

    await fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="input"]')).not.toBeNull()
    })
    expect((document.body.querySelector('[data-slot="input"]') as HTMLInputElement).value).toBe('')
  })

  test('renders into portal by default', () => {
    const screen = render(() => (
      <Dialog open title="Portal default" body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('supports overlay=false', () => {
    render(() => (
      <Dialog open overlay={false} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
  })

  test('supports scrollable overlay mode', () => {
    render(() => (
      <Dialog open scrollable body="Scrollable body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    const overlays = document.body.querySelectorAll('[data-slot="overlay"]')
    const contents = document.body.querySelectorAll('[data-slot="content"]')
    const overlay = overlays[overlays.length - 1]
    const content = contents[contents.length - 1]

    expect(overlay).not.toBeNull()
    expect(overlay?.contains(content ?? null)).toBe(false)
    expect(overlay?.parentElement).toBe(content?.parentElement)
    expect(overlay?.parentElement?.parentElement).toBe(content?.parentElement?.parentElement)
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('supports custom close content', () => {
    render(() => (
      <Dialog open closeIcon={<span data-testid="custom-close">X</span>} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.querySelector('[data-testid="custom-close"]')?.textContent).toBe('X')
  })

  test('hides close button when close=false', () => {
    render(() => (
      <Dialog open close={false} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    expect(document.body.querySelector('[data-slot="close"]')).toBeNull()
  })

  test('prevents close when dismissible=false and emits onClosePrevent', async () => {
    const onClosePrevent = vi.fn()

    render(() => (
      <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

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
        <Dialog defaultOpen dismissible={false} onClosePrevent={onClosePrevent} body="Body">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Dialog>
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))
    await fireEvent.pointerDown(screen.getByTestId('outside'))

    await waitFor(() => {
      expect(onClosePrevent).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('clears text selection when dismissed by outside pointer interaction', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <>
        <button type="button" data-testid="outside">
          Outside target
        </button>
        <Dialog onOpenChange={onOpenChange} defaultOpen title="Dialog title" body="Dialog body">
          {(props) => (
            <button {...props} type="button">
              Trigger
            </button>
          )}
        </Dialog>
      </>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    window.getSelection()?.selectAllChildren(content)

    expect(window.getSelection()?.toString()).toContain('Dialog title')

    await new Promise((resolve) => setTimeout(resolve, 0))
    await fireEvent.pointerDown(screen.getByTestId('outside'))

    await finishExitMotion()

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      expect(window.getSelection()?.toString()).toBe('')
    })
  })

  test('allows close when dismissible=true', async () => {
    const onClosePrevent = vi.fn()
    const onOpenChange = vi.fn()

    render(() => (
      <Dialog
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
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    content.focus()
    await fireEvent.keyDown(content, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onClosePrevent).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('applies styles override to content', () => {
    render(() => (
      <Dialog open body="Body" styles={{ content: { width: '200px' } }}>
        {(props) => (
          <button {...props} type="button">
            Trigger
          </button>
        )}
      </Dialog>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })

  test('escape only closes the topmost overlay when modals are nested', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onOuterChange}
          trigger={(props) => (
            <button {...props} type="button">
              Outer trigger
            </button>
          )}
          content={<div data-testid="outer-body">Outer body</div>}
        />
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onInnerChange}
          trigger={(props) => (
            <button {...props} type="button">
              Inner trigger
            </button>
          )}
          content={<div data-testid="inner-body">Inner body</div>}
        />
      </>
    ))

    const contents = document.body.querySelectorAll('[data-slot="content"]')
    expect(contents.length).toBe(2)

    const innerContent = contents[contents.length - 1] as HTMLElement
    innerContent.focus()
    await fireEvent.keyDown(innerContent, { key: 'Escape' })

    await finishExitMotion()

    await waitFor(() => {
      expect(onInnerChange).toHaveBeenCalledWith(false)
      expect(onOuterChange).not.toHaveBeenCalled()
      expect(document.body.querySelectorAll('[data-slot="content"]').length).toBe(1)
    })
  })

  test('outer modal ignores pointerdown that lands inside a nested modal', async () => {
    const onOuterChange = vi.fn()
    const onInnerChange = vi.fn()

    render(() => (
      <>
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onOuterChange}
          trigger={(props) => (
            <button {...props} type="button">
              Outer trigger
            </button>
          )}
          content={<div data-testid="outer-body">Outer body</div>}
        />
        <TestModal
          defaultOpen
          overlay
          onOpenChange={onInnerChange}
          trigger={(props) => (
            <button {...props} type="button">
              Inner trigger
            </button>
          )}
          content={
            <button type="button" data-testid="inner-button">
              Inner button
            </button>
          }
        />
      </>
    ))

    await new Promise((resolve) => setTimeout(resolve, 0))

    const innerButton = document.body.querySelector('[data-testid="inner-button"]')!
    await fireEvent.pointerDown(innerButton)

    expect(onOuterChange).not.toHaveBeenCalled()
    expect(onInnerChange).not.toHaveBeenCalled()
    expect(document.body.querySelectorAll('[data-slot="content"]').length).toBe(2)
  })
})
