import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Collapsible } from './collapsible.tsx'
import type { CollapsibleProps } from './collapsible.tsx'

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
      triggerRender={(context) => (
        <button data-testid="trigger-control" {...context.triggerProps}>
          <span data-testid="trigger-state">{context.isOpen ? 'open' : 'closed'}</span>
        </button>
      )}
    >
      <span data-testid="content">Content</span>
    </Collapsible>
  ))
}

describe('Collapsible', () => {
  test('wraps static trigger content in the built-in trigger button', async () => {
    const screen = render(() => (
      <Collapsible defaultOpen={false} triggerRender={<span>Static trigger</span>}>
        <span>Content</span>
      </Collapsible>
    ))
    const trigger = screen.getByRole('button', { name: 'Static trigger' })
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(root?.hasAttribute('data-closed')).toBe(true)

    await fireEvent.click(trigger)

    expect(root?.hasAttribute('data-expanded')).toBe(true)
  })

  test('exposes only the component-based trigger render contract', () => {
    const triggerRender: CollapsibleProps['triggerRender'] = (props) => (
      <button {...props.triggerProps}>Trigger</button>
    )
    const validProps: CollapsibleProps = { triggerRender }
    // @ts-expect-error renderTrigger has been replaced by triggerRender
    const legacyProps: CollapsibleProps = { renderTrigger: 'Trigger' }

    expect(validProps.triggerRender).toBe(triggerRender)
    expect(legacyProps).toBeDefined()
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
      <Collapsible
        defaultOpen
        data-expanded="caller-expanded"
        data-closed="caller-closed"
        triggerRender={<button type="button">Trigger</button>}
      >
        <span>Content</span>
      </Collapsible>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('data-expanded')).toBe('caller-expanded')
    expect(root?.getAttribute('data-closed')).toBe('caller-closed')
  })

  test('children render function receives open=true/false', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')

    expect(screen.getByTestId('trigger-state').textContent).toBe('closed')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.getByTestId('trigger-state').textContent).toBe('open')
  })

  test('click trigger toggles uncontrolled state', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.hasAttribute('data-closed')).toBe(true)

    await fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-expanded')).toBe(true)

    await fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-closed')).toBe(true)
  })

  test('render trigger only toggles from the element using triggerProps', async () => {
    const screen = render(() => (
      <Collapsible
        defaultOpen={false}
        triggerRender={(context) => (
          <>
            <span data-testid="trigger-label">Quick panel</span>
            <button data-testid="trigger-control" {...context.triggerProps}>
              {context.isOpen ? 'open' : 'closed'}
            </button>
          </>
        )}
      >
        <span data-testid="content">Content</span>
      </Collapsible>
    ))

    const label = screen.getByTestId('trigger-label')
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    await fireEvent.click(label)
    await Promise.resolve()

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(trigger.textContent).toBe('closed')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(trigger.textContent).toBe('open')
  })

  test('render trigger exposes flattened control functions', async () => {
    const screen = render(() => (
      <Collapsible
        defaultOpen={false}
        triggerRender={(context) => (
          <button type="button" data-testid="trigger-control" onClick={context.toggle}>
            {context.isOpen ? 'open' : 'closed'}
          </button>
        )}
      >
        <span data-testid="content">Content</span>
      </Collapsible>
    ))

    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(trigger.textContent).toBe('closed')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(trigger.textContent).toBe('open')
  })

  test('plain trigger content makes the whole trigger button actionable', async () => {
    const screen = render(() => (
      <Collapsible
        defaultOpen={false}
        triggerRender={(context) => (
          <button {...context.triggerProps} data-testid="plain-trigger">
            Plain trigger
          </button>
        )}
      >
        <span data-testid="content">Content</span>
      </Collapsible>
    ))

    const plainTrigger = screen.getByTestId('plain-trigger')
    const trigger = screen.getByRole('button', { name: 'Plain trigger' })
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(root?.hasAttribute('data-closed')).toBe(true)

    await fireEvent.click(plainTrigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
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

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('controlled open does not self-mutate and still calls onOpenChange', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ open: true, onOpenChange })
    const trigger = screen.getByTestId('trigger-control')
    const root = screen.container.querySelector('[data-slot="root"]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('closed content is unmounted', () => {
    const screen = renderCollapsible({ defaultOpen: false })

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('omits aria-controls while closed and restores it while open', async () => {
    const screen = renderCollapsible({ defaultOpen: false })
    const trigger = screen.getByTestId('trigger-control')

    expect(trigger.hasAttribute('aria-controls')).toBe(false)

    await fireEvent.click(trigger)
    await Promise.resolve()

    const contentWrapper = screen.container.querySelector(
      '[data-slot="content-wrapper"]',
    ) as HTMLElement

    expect(trigger.getAttribute('aria-controls')).toBe(contentWrapper.id)

    await fireEvent.click(trigger)
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

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('transition=true keeps content mounted until close transition ends', async () => {
    const screen = renderCollapsible({ defaultOpen: true, transition: true })
    const trigger = screen.getByTestId('trigger-control')
    const contentWrapper = screen.container.querySelector(
      '[data-slot="content-wrapper"]',
    ) as HTMLElement

    expect(contentWrapper.className).toContain('transition-[height]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(contentWrapper.getAttribute('data-closed')).toBe('')
    expect(screen.queryByTestId('content')).not.toBeNull()

    await fireEvent.transitionEnd(contentWrapper, { propertyName: 'height' })
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

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement | null
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  test('forwards id to root', async () => {
    const screen = render(() => (
      <Collapsible
        id="collapsible-root"
        triggerRender={(context) => <button {...context.triggerProps}>Trigger</button>}
      >
        content
      </Collapsible>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('id')).toBe('collapsible-root')
    })
  })
})
