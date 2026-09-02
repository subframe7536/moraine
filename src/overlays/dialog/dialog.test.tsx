import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createComponent, createMemo, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index'
import { CommandPalette } from '../../navigation/command-palette/index'
import type { ComponentOrElement } from '../../shared/render-prop'
import { finishExitMotion } from '../../test-utils/overlay-test'
import type { OverlayTriggerProps } from '../base/trigger'
import { Modal } from '../modal/index'
import type { ModalT } from '../modal/modal'
import { ModalTriggerRenderer } from '../modal/modal-trigger'

import { Dialog } from './dialog'

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
      <ModalTriggerRenderer children={trigger()} />
      <Show when={content()}>
        <Modal.Content overlay={props.overlay} contentRender={content()} />
      </Show>
    </Modal>
  )
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
    expect(content?.tagName).toBe('DIV')
    expect(content?.className).toContain('bg-popover')
    expect(content?.className).toContain('surface-overlay')
    expect(content?.className).toContain('data-expanded:animate-popup-in')
    expect(content?.className).toContain('motion-reduce:animate-none')
  })

  test('renders the dialog shell with native slot containers', () => {
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
    expect(content).not.toBeNull()
    expect(content?.querySelector('[data-slot="header"]')).not.toBeNull()
    expect(content?.querySelector('[data-slot="body"]')).not.toBeNull()
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
    expect(trigger.className).toContain('border-border')
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

    fireEvent.click(document.body.querySelector('[data-testid="content-close"]')!)
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

    fireEvent.click(screen.getByText('Open modal'))

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

    fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

    const input = (await waitFor(() =>
      document.body.querySelector('[data-slot="input"]'),
    )) as HTMLInputElement
    fireEvent.input(input, { target: { value: 'Settings' } })

    expect(input.value).toBe('Settings')

    fireEvent.keyDown(input, { key: 'Escape' })

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

    fireEvent.click(document.body.querySelector('[data-slot="trigger"]') as HTMLElement)

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

  test('keeps long dialog content scrolling inside the body', () => {
    render(() => (
      <Dialog
        open
        title="Long content"
        body={<div style={{ height: '2000px' }}>Long body</div>}
        footer="Actions"
      >
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
    expect(content?.className).toContain('fixed')
    expect(content?.className).toContain('flex-col')
    expect(content?.className).toContain('max-h-[calc(100dvh-2rem)]')
    expect(content?.className).toContain('overflow-hidden')
    expect(content?.querySelector('[data-slot="body"]')?.className).toContain('overflow-y-auto')
    expect(content?.querySelector('[data-slot="header"]')?.className).toContain('shrink-0')
    expect(content?.querySelector('[data-slot="footer"]')?.className).toContain('shrink-0')
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('moves long dialog scrolling to the overlay when scrollable is true', () => {
    render(() => (
      <Dialog open scrollable title="Overlay scroll" body="Long body" footer="Actions" />
    ))

    const overlay = document.body.querySelector('[data-slot="overlay"]')
    const content = document.body.querySelector('[data-slot="content"]')
    const body = content?.querySelector('[data-slot="body"]')

    expect(overlay?.contains(content ?? null)).toBe(true)
    expect(overlay?.getAttribute('aria-hidden')).toBeNull()
    expect(overlay?.className).toContain('overflow-y-auto')
    expect(overlay?.className).toContain('p-4')
    expect(content?.className).toContain('relative')
    expect(content?.className).not.toContain('fixed')
    expect(body?.className).not.toContain('overflow-y-auto')
  })

  test('uses a full viewport flex panel for fullscreen dialogs', () => {
    render(() => <Dialog open fullscreen body="Fullscreen body" />)

    const content = document.body.querySelector('[data-slot="content"]')

    expect(content?.className).toContain('inset-0')
    expect(content?.className).toContain('size-full')
    expect(content?.className).toContain('flex-col')
    expect(content?.className).toContain('overflow-hidden')
    expect(content?.querySelector('[data-slot="body"]')?.className).toContain('overflow-y-auto')
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
    fireEvent.pointerDown(screen.getByTestId('outside'))

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
    fireEvent.pointerDown(screen.getByTestId('outside'))

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
    fireEvent.keyDown(content, { key: 'Escape' })

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

  test('forwards custom classes and styles to dialog slots', () => {
    render(() => (
      <Dialog
        open
        title="Custom Title"
        description="Custom Description"
        body="Custom Body"
        footer="Custom Footer"
        classes={{
          content: 'custom-content-class',
          header: 'custom-header-class',
          wrapper: 'custom-wrapper-class',
          title: 'custom-title-class',
          description: 'custom-desc-class',
          body: 'custom-body-class',
          footer: 'custom-footer-class',
          close: 'custom-close-class',
        }}
        styles={{
          content: { 'border-width': '3px' },
          header: { 'padding-top': '20px' },
          wrapper: { opacity: '0.9' },
          title: { 'letter-spacing': '1px' },
          description: { 'line-height': '1.5' },
          body: { 'font-size': '15px' },
          footer: { 'margin-top': '10px' },
          close: { opacity: '0.8' },
        }}
      />
    ))

    const header = document.body.querySelector('[data-slot="header"]') as HTMLElement
    const wrapper = document.body.querySelector('[data-slot="wrapper"]') as HTMLElement
    const title = document.body.querySelector('[data-slot="title"]') as HTMLElement
    const description = document.body.querySelector('[data-slot="description"]') as HTMLElement
    const body = document.body.querySelector('[data-slot="body"]') as HTMLElement
    const footer = document.body.querySelector('[data-slot="footer"]') as HTMLElement
    const close = document.body.querySelector('[data-slot="close"]') as HTMLElement

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement

    expect(content.className).toContain('custom-content-class')
    expect(header.className).toContain('custom-header-class')
    expect(wrapper.className).toContain('custom-wrapper-class')
    expect(title.className).toContain('custom-title-class')
    expect(description.className).toContain('custom-desc-class')
    expect(body.className).toContain('custom-body-class')
    expect(footer.className).toContain('custom-footer-class')
    expect(close.className).toContain('custom-close-class')

    expect(content.style.borderWidth).toBe('3px')
    expect(header.style.paddingTop).toBe('20px')
    expect(wrapper.style.opacity).toBe('0.9')
    expect(title.style.letterSpacing).toBe('1px')
    expect(description.style.lineHeight).toBe('1.5')
    expect(body.style.fontSize).toBe('15px')
    expect(footer.style.marginTop).toBe('10px')
    expect(close.style.opacity).toBe('0.8')
  })

  test('adjusts body padding when header or footer is absent', () => {
    const { unmount } = render(() => (
      <Dialog open title={false} description={false} close={false} body="No header body" />
    ))

    const bodyNoHeader = document.body.querySelector('[data-slot="body"]') as HTMLElement
    expect(bodyNoHeader.className).toContain('pt-6')
    expect(bodyNoHeader.className).toContain('pb-6')
    unmount()

    render(() => (
      <Dialog
        open
        title="Title"
        body="With header and footer"
        footer={<button type="button">Action</button>}
      />
    ))

    const bodyWithBoth = document.body.querySelector('[data-slot="body"]') as HTMLElement
    expect(bodyWithBoth.className).not.toContain('pt-6')
    expect(bodyWithBoth.className).toContain('pb-2')
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
    fireEvent.keyDown(innerContent, { key: 'Escape' })

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
    fireEvent.pointerDown(innerButton)

    expect(onOuterChange).not.toHaveBeenCalled()
    expect(onInnerChange).not.toHaveBeenCalled()
    expect(document.body.querySelectorAll('[data-slot="content"]').length).toBe(2)
  })
})
