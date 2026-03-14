import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Collapsible } from './collapsible'

function renderCollapsible(props?: {
  open?: boolean
  defaultOpen?: boolean
  disabled?: boolean
  forceMount?: boolean
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
      forceMount={props?.forceMount}
      onOpenChange={props?.onOpenChange}
      classes={props?.classes}
      styles={props?.styles}
      trigger={({ open }) => <span data-testid="trigger-state">{open ? 'open' : 'closed'}</span>}
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
  })

  test('children render function receives open=true/false', async () => {
    const screen = renderCollapsible({ defaultOpen: false, forceMount: true })
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    expect(screen.getByTestId('trigger-state').textContent).toBe('closed')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(screen.getByTestId('trigger-state').textContent).toBe('open')
  })

  test('click trigger toggles uncontrolled state', async () => {
    const screen = renderCollapsible({ defaultOpen: false, forceMount: true })
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.hasAttribute('data-closed')).toBe(true)

    await fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-expanded')).toBe(true)

    await fireEvent.click(trigger)
    await Promise.resolve()
    expect(root?.hasAttribute('data-closed')).toBe(true)
  })

  test('disabled prevents toggling', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({
      defaultOpen: false,
      disabled: true,
      onOpenChange,
      forceMount: true,
    })
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement
    const root = screen.container.querySelector('[data-slot="root"]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('controlled open does not self-mutate and still calls onOpenChange', async () => {
    const onOpenChange = vi.fn()
    const screen = renderCollapsible({ open: true, onOpenChange })
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement
    const root = screen.container.querySelector('[data-slot="root"]')

    await fireEvent.click(trigger)
    await Promise.resolve()

    expect(root?.hasAttribute('data-expanded')).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('forceMount=true keeps content mounted while closed', () => {
    const screen = renderCollapsible({ defaultOpen: false, forceMount: true })
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.hasAttribute('data-closed')).toBe(true)
    expect(screen.queryByTestId('content')).not.toBeNull()
  })

  test('forceMount=false unmounts content when closed', () => {
    const screen = renderCollapsible({ defaultOpen: false, forceMount: false })

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
      <Collapsible id="collapsible-root" trigger={() => 'Trigger'}>
        content
      </Collapsible>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(root?.getAttribute('id')).toBe('collapsible-root')
    })
  })
})
