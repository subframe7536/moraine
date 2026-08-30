import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Collapsible } from './collapsible.tsx'

function renderCollapsible(props?: {
  open?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  transition?: boolean
  onOpenChange?: (open: boolean) => void
  classes?: {
    root?: string
    trigger?: string
    content?: string
  }
  styles?: {
    root?: any
    trigger?: any
    content?: any
  }
}) {
  return render(() => (
    <Collapsible
      open={props?.open}
      defaultOpen={props?.defaultOpen}
      disabled={props?.disabled}
      transition={props?.transition}
      onOpenChange={props?.onOpenChange}
      classes={props?.classes}
      styles={props?.styles}
    >
      <Collapsible.Trigger data-testid="trigger-control">Toggle</Collapsible.Trigger>
      <Collapsible.Content>
        <span data-testid="content">Content</span>
      </Collapsible.Content>
    </Collapsible>
  ))
}

describe('Collapsible', () => {
  test('renders closed by default and toggles on trigger click', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false}>
        <Collapsible.Trigger>Toggle Details</Collapsible.Trigger>
        <Collapsible.Content>
          <span data-testid="content">Expanded Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Toggle Details' })
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(screen.queryByTestId('content')).toBeNull()

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(screen.getByTestId('content')).not.toBeNull()
    const contentWrapper = screen.container.querySelector('[data-slot="content-wrapper"]')!
    expect(trigger.getAttribute('aria-controls')).toBe(contentWrapper.id)
    expect(contentWrapper.getAttribute('aria-labelledby')).toBe(trigger.id)

    fireEvent.click(trigger)
    expect(screen.queryByTestId('content')).toBeNull()
    expect(root?.hasAttribute('data-closed')).toBe(true)
  })

  test('renders open state with content', () => {
    const screen = renderCollapsible({ open: true })

    expect(screen.getByTestId('content')).not.toBeNull()
    expect(
      screen.container.querySelector('[data-slot="root"]')?.hasAttribute('data-expanded'),
    ).toBe(true)

    const trigger = screen.getByTestId('trigger-control')
    const contentWrapper = screen.container.querySelector('[data-slot="content-wrapper"]')

    expect(trigger?.getAttribute('aria-controls')).toBe(contentWrapper?.getAttribute('id'))
  })

  test('allows callers to override generated root state attributes', () => {
    const screen = render(() => (
      <Collapsible defaultOpen data-expanded="caller-expanded" data-closed="caller-closed">
        <Collapsible.Trigger>Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <span>Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('data-expanded')).toBe('caller-expanded')
    expect(root?.getAttribute('data-closed')).toBe('caller-closed')
  })

  test('click trigger toggles uncontrolled state', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.hasAttribute('data-closed')).toBe(true)

    fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-expanded')).toBe(true)

    fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-closed')).toBe(true)
  })

  test('controlled open does not self-mutate and calls onOpenChange', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ open: true, onOpenChange })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('publishes each uncontrolled state change exactly once in order', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ defaultOpen: false, onOpenChange })
    const trigger = screen.getByTestId('trigger-control')

    fireEvent.click(trigger)
    fireEvent.click(trigger)

    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })

  test('disabled prevents toggling', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({
      defaultOpen: false,
      disabled: true,
      onOpenChange,
    })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('reactive disabled state suppresses trigger', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Collapsible disabled={disabled()} onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Toggle' })

    setDisabled(true)
    expect(trigger.hasAttribute('disabled')).toBe(true)
    fireEvent.click(trigger)

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('honors a canceled trigger event before toggling', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <Collapsible onOpenChange={onOpenChange}>
        <Collapsible.Trigger>Prevented</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Prevented' })
    const root = screen.container.querySelector('[data-slot="root"]')!
    root.addEventListener('click', (event) => event.preventDefault(), { capture: true })
    const click = new MouseEvent('click', { bubbles: true, cancelable: true })

    trigger.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('cancels stale close completion when controlled state reopens', async () => {
    const [open, setOpen] = createSignal(true)
    const screen = render(() => (
      <Collapsible open={open()} transition>
        <Collapsible.Trigger>Toggle</Collapsible.Trigger>
        <Collapsible.Content>
          <span data-testid="content">Content</span>
        </Collapsible.Content>
      </Collapsible>
    ))
    const wrapper = screen.container.querySelector('[data-slot="content-wrapper"]')!

    setOpen(false)
    expect(wrapper.getAttribute('data-closed')).toBe('')
    setOpen(true)
    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })

    expect(screen.getByTestId('content')).not.toBeNull()
    expect(wrapper.getAttribute('data-expanded')).toBe('')
  })

  test('keeps nested collapsible ids and state independent', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Outer</Collapsible.Trigger>
        <Collapsible.Content>
          <Collapsible>
            <Collapsible.Trigger>Inner</Collapsible.Trigger>
            <Collapsible.Content>Inner content</Collapsible.Content>
          </Collapsible>
        </Collapsible.Content>
      </Collapsible>
    ))
    const outer = screen.getByRole('button', { name: 'Outer' })
    const inner = screen.getByRole('button', { name: 'Inner' })

    expect(outer.id).not.toBe(inner.id)
    expect(outer.getAttribute('aria-expanded')).toBe('true')
    expect(inner.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(inner)
    expect(outer.getAttribute('aria-expanded')).toBe('true')
    expect(inner.getAttribute('aria-expanded')).toBe('true')
  })

  test('closed content is unmounted', () => {
    const screen = renderCollapsible({ defaultOpen: false })

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('omits aria-controls while closed and restores it while open', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')

    expect(trigger.hasAttribute('aria-controls')).toBe(false)

    fireEvent.click(trigger)
    await Promise.resolve()

    const contentWrapper = screen.container.querySelector(
      '[data-slot="content-wrapper"]',
    ) as HTMLElement

    expect(trigger.getAttribute('aria-controls')).toBe(contentWrapper.id)

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.hasAttribute('aria-controls')).toBe(false)
  })

  test('transition defaults to false and closed content unmounts immediately', async () => {
    const screen = renderCollapsible({ defaultOpen: true })
    const trigger = screen.getByTestId('trigger-control')
    const contentWrapper = screen.container.querySelector(
      '[data-slot="content-wrapper"]',
    ) as HTMLElement

    expect(contentWrapper.className).not.toContain('transition-[height]')
    expect(contentWrapper.className).not.toContain('duration-200')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('transition=true keeps content mounted until close transition ends', async () => {
    const screen = renderCollapsible({ defaultOpen: true, transition: true })
    const trigger = screen.getByTestId('trigger-control')
    const contentWrapper = screen.container.querySelector(
      '[data-slot="content-wrapper"]',
    ) as HTMLElement

    expect(contentWrapper.className).toContain('data-expanded:animate-accordion-down')
    expect(contentWrapper.className).toContain('data-closed:animate-accordion-up')

    fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(contentWrapper.getAttribute('data-closed')).toBe('')
    expect(screen.queryByTestId('content')).not.toBeNull()

    fireEvent.animationEnd(contentWrapper, { animationName: 'accordion-up' })
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('applies classes.root/classes.trigger/classes.content overrides', () => {
    const screen = renderCollapsible({
      open: true,
      classes: {
        root: 'root-override',
        trigger: 'trigger-override',
        content: 'content-override',
      },
    })

    const root = screen.container.querySelector('[data-slot="root"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const content = screen.container.querySelector('[data-slot="content"]')

    expect(root?.className).toContain('root-override')
    expect(trigger?.className).toContain('trigger-override')
    expect(content?.className).toContain('content-override')
  })

  test('applies styles.root/styles.trigger/styles.content overrides', () => {
    const screen = renderCollapsible({
      open: true,
      styles: {
        root: { width: '200px' },
        trigger: { width: '200px' },
        content: { width: '200px' },
      },
    })

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const trigger = screen.container.querySelector<HTMLElement>('[data-slot="trigger"]')
    const content = screen.container.querySelector<HTMLElement>('[data-slot="content"]')

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  test('forwards id to root', async () => {
    const screen = render(() => (
      <Collapsible id="collapsible-root">
        <Collapsible.Trigger>Trigger</Collapsible.Trigger>
        <Collapsible.Content>content</Collapsible.Content>
      </Collapsible>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('id')).toBe('collapsible-root')
    })
  })

  test('polymorphic trigger supporting as="div" and keyboard Enter / Space activation', async () => {
    const screen = render(() => (
      <Collapsible>
        <Collapsible.Trigger as="div" class="custom-div-trigger">
          Custom Div Trigger
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div data-testid="keyboard-content">Keyboard Content</div>
        </Collapsible.Content>
      </Collapsible>
    ))

    const trigger = screen.getByRole('button', { name: 'Custom Div Trigger' })
    expect(trigger.tagName.toLowerCase()).toBe('div')
    expect(trigger.getAttribute('tabindex')).toBe('0')
    expect(trigger.className).toContain('custom-div-trigger')

    // Enter key activates
    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByTestId('keyboard-content')).not.toBeNull()

    // Space key activates on keyUp
    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.keyUp(trigger, { key: ' ' })
    expect(screen.queryByTestId('keyboard-content')).toBeNull()
  })

  test('unmountOnHide={false} keeps content mounted in DOM when closed', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} unmountOnHide={false}>
        <Collapsible.Trigger>Keep Mounted Trigger</Collapsible.Trigger>
        <Collapsible.Content>
          <div data-testid="unmount-false-content">Always Mounted</div>
        </Collapsible.Content>
      </Collapsible>
    ))

    const content = screen.getByTestId('unmount-false-content')
    const wrapper = screen.container.querySelector('[data-slot="content-wrapper"]')!

    expect(content).not.toBeNull()
    expect(wrapper.getAttribute('data-closed')).toBe('')

    const trigger = screen.getByRole('button', { name: 'Keep Mounted Trigger' })
    fireEvent.click(trigger)
    expect(wrapper.getAttribute('data-expanded')).toBe('')
    expect(screen.getByTestId('unmount-false-content')).not.toBeNull()
  })

  test('forceMount on Collapsible.Content keeps content mounted in DOM when closed', () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false}>
        <Collapsible.Trigger>Force Mount Trigger</Collapsible.Trigger>
        <Collapsible.Content forceMount>
          <div data-testid="force-mount-content">Force Mounted</div>
        </Collapsible.Content>
      </Collapsible>
    ))

    expect(screen.getByTestId('force-mount-content')).not.toBeNull()
  })

  test('polymorphic Collapsible.Content with as="section", custom wrapperClass and refs', () => {
    let contentRef: HTMLElement | undefined
    let wrapperRef: HTMLDivElement | undefined

    const screen = render(() => (
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Ref Trigger</Collapsible.Trigger>
        <Collapsible.Content
          as="section"
          class="custom-section-class"
          wrapperClass="custom-wrapper-class"
          wrapperRef={(el) => (wrapperRef = el)}
          ref={(el) => (contentRef = el)}
        >
          <p>Section Body</p>
        </Collapsible.Content>
      </Collapsible>
    ))

    const section = screen.container.querySelector('section[data-slot="content"]')!
    const wrapper = screen.container.querySelector('[data-slot="content-wrapper"]')!

    expect(section).not.toBeNull()
    expect(section.className).toContain('custom-section-class')
    expect(wrapper.className).toContain('custom-wrapper-class')
    expect(contentRef).toBe(section)
    expect(wrapperRef).toBe(wrapper)
  })

  test('evaluates Collapsible.Trigger and lazy Collapsible.Content children once', async () => {
    let triggerReads = 0
    let contentReads = 0

    const screen = render(() => (
      <Collapsible>
        {createComponent(Collapsible.Trigger, {
          get children() {
            triggerReads += 1
            return <span>Trigger Evaluation</span>
          },
        })}
        {createComponent(Collapsible.Content, {
          get children() {
            contentReads += 1
            return <span data-testid="lazy-composable-content">Content Evaluation</span>
          },
        })}
      </Collapsible>
    ))

    const trigger = screen.getByRole('button', { name: 'Trigger Evaluation' })
    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(0)

    fireEvent.click(trigger)
    expect(triggerReads).toBe(1)
    expect(contentReads).toBe(1)
    expect(screen.getByTestId('lazy-composable-content')).not.toBeNull()

    fireEvent.click(trigger)
    expect(screen.queryByTestId('lazy-composable-content')).toBeNull()
    fireEvent.click(trigger)
    expect(contentReads).toBe(2)
  })

  test('hydrates closed composable markup without content and supports open, close, and reopen', async () => {
    const markup = renderSsrFixture(
      '/src/elements/collapsible/collapsible.ssr.fixture.tsx',
      'renderCollapsibleFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    let contentMounts = 0
    const Content = () => {
      contentMounts += 1
      return <span data-testid="hydrated-content">Content</span>
    }
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <Collapsible>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <Content />
          </Collapsible.Content>
        </Collapsible>
      ),
      container,
    )
    const trigger = container.querySelector('[data-slot="trigger"]')!

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(contentMounts).toBe(0)
    expect(container.querySelector('[data-slot="content"]')).toBeNull()

    fireEvent.click(trigger)
    const contentWrapper = container.querySelector('[data-slot="content-wrapper"]')!
    expect(contentMounts).toBe(1)
    expect(trigger.getAttribute('aria-controls')).toBe(contentWrapper.id)
    expect(contentWrapper.getAttribute('aria-labelledby')).toBe(trigger.id)

    fireEvent.click(trigger)
    expect(container.querySelector('[data-slot="content"]')).toBeNull()
    fireEvent.click(trigger)
    expect(contentMounts).toBe(2)

    dispose()
    container.remove()
    restoreHydrationState()
  })
})
