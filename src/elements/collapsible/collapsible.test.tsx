import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Collapsible } from './collapsible'

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
      renderTrigger={(context) => (
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
  test('renders open state with content', () => {
    const screen = renderCollapsible({ open: true })

    expect(screen.getByTestId('content')).not.toBeNull()
    expect(
      screen.container.querySelector('[data-slot="root"]')?.hasAttribute('data-expanded'),
    ).toBe(true)

    const trigger = screen.getByTestId('trigger-control')
    const content = screen.container.querySelector('[data-slot="content"]')

    expect(trigger?.getAttribute('aria-controls')).toBe(content?.getAttribute('id'))
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
        renderTrigger={(context) => (
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
        renderTrigger={(context) => (
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
        renderTrigger={<span data-testid="plain-trigger">Plain trigger</span>}
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

    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement

    expect(trigger.getAttribute('aria-controls')).toBe(content.id)

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.hasAttribute('aria-controls')).toBe(false)
  })

  test('transition defaults to false and closed content unmounts immediately', async () => {
    const screen = renderCollapsible({ defaultOpen: true })
    const trigger = screen.getByTestId('trigger-control')
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement

    expect(content.className).not.toContain('transition-[height]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.queryByTestId('content')).toBeNull()
  })

  test('transition=true keeps content mounted until close transition ends', async () => {
    const screen = renderCollapsible({ defaultOpen: true, transition: true })
    const trigger = screen.getByTestId('trigger-control')
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement

    expect(content.className).toContain('transition-[height]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(content.getAttribute('data-closed')).toBe('')
    expect(screen.queryByTestId('content')).not.toBeNull()

    await fireEvent.transitionEnd(content, { propertyName: 'height' })
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
      <Collapsible id="collapsible-root" renderTrigger="Trigger">
        content
      </Collapsible>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('id')).toBe('collapsible-root')
    })
  })
})
