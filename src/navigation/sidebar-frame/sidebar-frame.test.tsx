import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'
import { renderWithTheme } from '../../test-util/theme-render'

import { SidebarFrame } from './sidebar-frame'
import { useSidebarFrame } from './sidebar-frame-context'

const originalMatchMedia = window.matchMedia

test.each(['SidebarHeader', 'SidebarBody', 'SidebarFooter', 'Main'] as const)(
  'preserves %s child ownership and reactive updates',
  (part) => {
    const [value, setValue] = createSignal('Before')
    let reads = 0
    let mounts = 0
    let cleanups = 0
    const Child = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span data-testid="persistent-child">{value()}</span>
    }
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        {createComponent(SidebarFrame[part], {
          get children() {
            reads += 1
            return <Child />
          },
        })}
      </SidebarFrame>
    ))
    const child = screen.getByTestId('persistent-child')
    setValue('After')
    expect(screen.getByTestId('persistent-child')).toBe(child)
    expect(child.textContent).toBe('After')
    expect([reads, mounts, cleanups]).toEqual([1, 1, 0])
    screen.unmount()
    expect(cleanups).toBe(1)
  },
)

function createMatchMediaMock(matches = false) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

function FrameContent() {
  const context = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader>Header</SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody>Navigation</SidebarFrame.SidebarBody>
        <SidebarFrame.SidebarFooter>Footer</SidebarFrame.SidebarFooter>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main>
        <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        <span data-testid="scroll-state">{context.scrolled() ? 'on' : 'off'}</span>
      </SidebarFrame.Main>
    </>
  )
}

beforeEach(() => {
  window.matchMedia = createMatchMediaMock(false)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('SidebarFrame', () => {
  test('renders compound regions in the desktop layout', () => {
    const screen = renderWithTheme(() => (
      <SidebarFrame isMobile={false}>
        <FrameContent />
      </SidebarFrame>
    ))

    expect(screen.getByText('Header')).toBeTruthy()
    expect(screen.getByText('Navigation')).toBeTruthy()
    expect(screen.getByText('Footer')).toBeTruthy()
    expect(screen.container.querySelector('[data-slot="sidebar-frame"]')?.className).toContain(
      'flex',
    )
    const sidebarClass = screen.container.querySelector(
      '[data-slot="sidebar-frame-sidebar"]',
    )?.className
    expect(sidebarClass).toContain('w-64')
    expect(sidebarClass).toContain('min-size-0')
    expect(screen.container.querySelector('[data-slot="sidebar-frame-main"]')?.className).toContain(
      'flex-1',
    )
  })

  test('preserves the main subtree when switching between desktop and mobile', () => {
    const [mobile, setMobile] = createSignal(false)
    let input: HTMLInputElement | undefined
    const screen = render(() => (
      <SidebarFrame isMobile={mobile()}>
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <input ref={(element) => (input = element)} aria-label="Persistent input" />
        </SidebarFrame.Main>
      </SidebarFrame>
    ))
    const initialInput = screen.getByLabelText('Persistent input')

    setMobile(true)
    expect(screen.getByLabelText('Persistent input')).toBe(initialInput)
    setMobile(false)
    expect(screen.getByLabelText('Persistent input')).toBe(initialInput)
    expect(input).toBe(initialInput)
  })

  test('opens the mobile Sheet through the public context', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <FrameContent />
      </SidebarFrame>
    ))

    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()
    fireEvent.click(screen.getByText('Toggle'))

    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="sheet-content"]')?.getAttribute('aria-label'),
      ).toBe('Sidebar navigation')
      expect(document.body.textContent).toContain('Navigation')
    })
  })

  test('uses the custom Sidebar accessible name for the mobile Sheet', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar ariaLabel="Project navigation">Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() =>
      expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
        'Project navigation',
      ),
    )
  })

  test.each([
    [
      'native aria-label',
      { 'aria-label': 'Workspace navigation', ariaLabel: 'Project navigation' },
      'Workspace navigation',
    ],
    ['native title', { title: 'Billing navigation' }, 'Billing navigation'],
  ] as const)('prefers the Sidebar %s when naming the mobile Sheet', async (_case, props, name) => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar {...props}>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() =>
      expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(name),
    )
  })

  test('derives mobile mode from matchMedia when it is uncontrolled', async () => {
    window.matchMedia = createMatchMediaMock(true)
    const screen = render(() => (
      <SidebarFrame>
        <FrameContent />
      </SidebarFrame>
    ))

    await waitFor(() =>
      expect(screen.container.querySelector('[data-slot="sidebar-frame-sidebar"]')).toHaveProperty(
        'hidden',
        true,
      ),
    )
    fireEvent.click(screen.getByText('Toggle'))
    await waitFor(() => expect(document.body.textContent).toContain('Navigation'))
  })

  test('ignores matchMedia updates when isMobile is controlled', async () => {
    window.matchMedia = createMatchMediaMock(true)
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <FrameContent />
      </SidebarFrame>
    ))

    expect(screen.container.querySelector('[data-slot="sidebar-frame-sidebar"]')).toHaveProperty(
      'hidden',
      false,
    )
    expect(screen.getByText('Navigation')).toBeTruthy()
  })

  test('keeps the named Sheet behavior when mobile mode changes dynamically', async () => {
    const [mobile, setMobile] = createSignal(false)
    const screen = render(() => (
      <SidebarFrame isMobile={mobile()}>
        <SidebarFrame.Sidebar ariaLabel="Account navigation">Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    setMobile(true)
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() =>
      expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
        'Account navigation',
      ),
    )

    setMobile(false)
    await finishExitMotion()
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
  })

  test('toggles desktop visibility and updates scroll state', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false} scrollThreshold={10}>
        <FrameContent />
      </SidebarFrame>
    ))
    const sidebar = screen.container.querySelector(
      '[data-slot="sidebar-frame-sidebar"]',
    ) as HTMLDivElement
    const main = screen.container.querySelector(
      '[data-slot="sidebar-frame-main"]',
    ) as HTMLDivElement

    fireEvent.click(screen.getByText('Toggle'))
    expect(sidebar.getAttribute('data-closed')).toBe('')
    expect(sidebar.getAttribute('aria-hidden')).toBe('true')

    main.scrollTop = 20
    fireEvent.scroll(main)
    expect(screen.getByTestId('scroll-state').textContent).toBe('on')
  })

  test('applies side and visual variants to the merged root', () => {
    const screen = renderWithTheme(() => (
      <SidebarFrame isMobile={false} side="right" variant="inset">
        <FrameContent />
      </SidebarFrame>
    ))
    const root = screen.container.querySelector('[data-slot="sidebar-frame"]')

    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('p-2')
    expect(screen.container.querySelector('[data-slot="sidebar-frame-main"]')?.className).toContain(
      'rounded-xl',
    )
  })

  test('forwards region attributes, classes, styles, refs, and events', () => {
    const onScroll = vi.fn()
    let mainRef: HTMLDivElement | undefined
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar data-testid="sidebar" class="custom-sidebar" />
        <SidebarFrame.Main
          ref={(element) => (mainRef = element)}
          data-testid="main"
          class="custom-main"
          style={{ color: 'red' }}
          onScroll={onScroll}
        />
      </SidebarFrame>
    ))

    fireEvent.scroll(screen.getByTestId('main'))
    expect(screen.getByTestId('sidebar').className).toContain('custom-sidebar')
    expect(screen.getByTestId('main').className).toContain('custom-main')
    expect(screen.getByTestId('main').style.color).toBe('red')
    expect(mainRef).toBe(screen.getByTestId('main'))
    expect(onScroll).toHaveBeenCalledOnce()
  })
})

describe('SidebarFrame.Trigger', () => {
  test('renders a default button with open/closed state attributes and aria-expanded', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.getAttribute('data-slot')).toBe('sidebar-frame-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-open')).toBe('')
    expect(trigger.hasAttribute('data-closed')).toBe(false)
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
  })

  test('reflects initial closed state when mobile', () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-open')).toBe(false)
  })

  test('toggles desktop visibility, aria-expanded, and state attributes on click', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    const sidebar = screen.container.querySelector(
      '[data-slot="sidebar-frame-sidebar"]',
    ) as HTMLDivElement

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(sidebar.hasAttribute('data-closed')).toBe(false)

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-open')).toBe(false)
    expect(sidebar.getAttribute('data-closed')).toBe('')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-open')).toBe('')
    expect(trigger.hasAttribute('data-closed')).toBe(false)
    expect(sidebar.hasAttribute('data-closed')).toBe(false)
  })

  test('opens mobile sheet on trigger click', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(document.body.querySelector('[data-slot="sheet-content"]')).toBeNull()

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="sheet-content"]')).not.toBeNull()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })
  })

  test('composes consumer onClick and allows preventDefault to stop toggle', () => {
    const onClick = vi.fn((event: MouseEvent) => {
      event.preventDefault()
    })
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger onClick={onClick}>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-open')).toBe('')
  })

  test('calls consumer onClick when default is not prevented', () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger onClick={onClick}>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('does not toggle when disabled and exposes data-disabled', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger disabled>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.hasAttribute('disabled')).toBe(true)
    expect(trigger.getAttribute('data-disabled')).toBe('')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  test('supports non-native root with Enter and Space keyboard activation', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger as="div">Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.getAttribute('tabindex')).toBe('0')
    expect(trigger.getAttribute('role')).toBe('button')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.keyUp(trigger, { key: ' ' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  test('non-native root disabled state prevents keyboard activation', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Sidebar</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger as="div" disabled>
            Toggle
          </SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    const trigger = screen.getByText('Toggle')
    expect(trigger.getAttribute('aria-disabled')).toBe('true')
    expect(trigger.getAttribute('data-disabled')).toBe('')
    expect(trigger.hasAttribute('tabindex')).toBe(false)

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})
