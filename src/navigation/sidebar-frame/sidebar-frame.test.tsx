import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal, onCleanup } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'

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
  test('keeps one sidebar identity and preserves child state across mobile changes', async () => {
    const [mobile, setMobile] = createSignal(false)
    const ref = vi.fn()
    let mounts = 0
    let cleanups = 0
    const Child = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span data-testid="sidebar-child">Navigation</span>
    }
    const screen = render(() => (
      <SidebarFrame isMobile={mobile()} sidebarId="unique-sidebar">
        <SidebarFrame.Sidebar ref={ref}>
          <Child />
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))
    const child = screen.getByTestId('sidebar-child')
    const assertUnique = () => {
      expect(document.querySelectorAll('#unique-sidebar')).toHaveLength(1)
      expect(document.querySelectorAll('[data-slot="sidebar-frame-sidebar"]')).toHaveLength(1)
    }
    assertUnique()
    setMobile(true)
    await waitFor(() =>
      expect(
        screen.container
          .querySelector('[data-slot="sidebar-frame-trigger"]')
          ?.getAttribute('aria-expanded'),
      ).toBe('false'),
    )
    fireEvent.click(screen.container.querySelector('[data-slot="sidebar-frame-trigger"]')!)
    await waitFor(assertUnique)
    expect(document.querySelector('[data-testid="sidebar-child"]')).toBe(child)
    setMobile(false)
    await finishExitMotion()
    await waitFor(assertUnique)
    expect(document.querySelector('[data-testid="sidebar-child"]')).toBe(child)
    expect([mounts, cleanups]).toEqual([1, 0])
    expect(ref.mock.calls.every(([element]) => element?.id === 'unique-sidebar')).toBe(true)
  })

  test('renders compound regions in the desktop layout', () => {
    const screen = render(() => (
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
    expect(sidebarClass).toContain('w-(--mo-sidebar-width)')
    expect(
      screen.container
        .querySelector<HTMLElement>('[data-slot="sidebar-frame"]')
        ?.style.getPropertyValue('--mo-sidebar-width'),
    ).toBe('var(--sidebar-width, clamp(14rem, 25%, 20rem))')
    for (const element of screen.container.querySelectorAll<HTMLElement>('[data-slot]')) {
      expect(element.style.getPropertyValue('--sidebar-width')).toBe('')
      if (element.dataset.slot !== 'sidebar-frame') {
        expect(element.style.getPropertyValue('--mo-sidebar-width')).toBe('')
      }
    }
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
      expect(screen.container.querySelector('[data-slot="sidebar-frame-sidebar"]')).toBeNull(),
    )
    expect(document.body.querySelectorAll('[data-slot="sidebar-frame-sidebar"]')).toHaveLength(0)
    fireEvent.click(screen.getByText('Toggle'))
    await waitFor(() =>
      expect(document.body.querySelectorAll('[data-slot="sidebar-frame-sidebar"]')).toHaveLength(1),
    )
  })

  test('queries matchMedia with the configured breakpoint', async () => {
    const matchMedia = createMatchMediaMock(false)
    window.matchMedia = matchMedia
    render(() => (
      <SidebarFrame breakpoint={1024}>
        <FrameContent />
      </SidebarFrame>
    ))

    await waitFor(() => expect(matchMedia).toHaveBeenCalledWith('(max-width: 1024px)'))
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
    const screen = render(() => (
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
        <SidebarFrame.Sidebar data-testid="sidebar" class="custom-sidebar w-48" />
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
    expect(screen.getByTestId('sidebar').className).toContain('w-48')
    expect(screen.getByTestId('sidebar').className).not.toContain('w-(--mo-sidebar-width)')
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
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()
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
    expect(trigger.getAttribute('tabindex')).toBe('-1')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('SidebarFrame.Label', () => {
  test('renders default elements and attributes', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Menu>
          <SidebarFrame.Label>Section Title</SidebarFrame.Label>
        </SidebarFrame.Menu>
      </SidebarFrame>
    ))
    const menu = screen.container.querySelector('[data-slot="sidebar-frame-menu"]')
    expect(menu).not.toBeNull()
    const label = screen.container.querySelector('[data-slot="sidebar-frame-label"]')
    expect(label).not.toBeNull()
    expect(label?.tagName).toBe('DIV')
    expect(label?.textContent).toBe('Section Title')
  })

  test('Label as="h2" renders h2', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Menu>
          <SidebarFrame.Label as="h2">Section Heading</SidebarFrame.Label>
        </SidebarFrame.Menu>
      </SidebarFrame>
    ))
    const heading = screen.getByRole('heading', { level: 2, name: 'Section Heading' })
    expect(heading.tagName).toBe('H2')
    expect(heading.getAttribute('data-slot')).toBe('sidebar-frame-label')
  })
})

describe('SidebarFrame.Menu', () => {
  test('renders menu container without list role', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Menu>
          <span>Content</span>
        </SidebarFrame.Menu>
      </SidebarFrame>
    ))
    const menu = screen.container.querySelector('[data-slot="sidebar-frame-menu"]')
    expect(menu).not.toBeNull()
    expect(menu?.tagName).toBe('DIV')
    expect(menu?.getAttribute('role')).toBeNull()
  })
})

describe('SidebarFrame.Item', () => {
  test('Item with href renders an a', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item href="/docs">Overview</SidebarFrame.Item>
      </SidebarFrame>
    ))
    const link = screen.getByRole('link', { name: 'Overview' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/docs')
    expect(link.getAttribute('data-slot')).toBe('sidebar-frame-item')
  })

  test('Item with as overrides href', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item as="button" href="/docs">
          Overview
        </SidebarFrame.Item>
      </SidebarFrame>
    ))
    const button = screen.getByRole('button', { name: 'Overview' })
    expect(button.tagName).toBe('BUTTON')
    expect(screen.queryByRole('link')).toBeNull()
  })

  test('Item default renders button with type="button", fires onClick, respects disabled', () => {
    const handleClick = vi.fn()
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item onClick={handleClick}>Action</SidebarFrame.Item>
        <SidebarFrame.Item disabled onClick={handleClick}>
          Disabled Action
        </SidebarFrame.Item>
      </SidebarFrame>
    ))
    const button = screen.getByRole('button', { name: 'Action' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('type')).toBe('button')

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)

    const disabledBtn = screen.getByRole('button', { name: 'Disabled Action' })
    expect((disabledBtn as HTMLButtonElement).disabled).toBe(true)
    expect(disabledBtn.getAttribute('data-disabled')).toBe('')

    fireEvent.click(disabledBtn)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('Item disabled as a keeps tag a, removes href, sets aria-disabled="true", sets data-disabled, and prevents click', () => {
    const handleClick = vi.fn()
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item href="/docs" disabled onClick={handleClick}>
          Disabled Link
        </SidebarFrame.Item>
      </SidebarFrame>
    ))
    const anchor = screen.getByText('Disabled Link').closest('a')!
    expect(anchor).not.toBeNull()
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('href')).toBeNull()
    expect(anchor.getAttribute('aria-disabled')).toBe('true')
    expect(anchor.getAttribute('data-disabled')).toBe('')

    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    const defaultPrevented = !anchor.dispatchEvent(event)
    expect(defaultPrevented).toBe(true)
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('isActive sets data-active on both a and button', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item href="/docs" isActive>
          Link
        </SidebarFrame.Item>
        <SidebarFrame.Item isActive>Button</SidebarFrame.Item>
      </SidebarFrame>
    ))
    const link = screen.getByRole('link', { name: 'Link' })
    const button = screen.getByRole('button', { name: 'Button' })
    expect(link.getAttribute('data-active')).toBe('')
    expect(button.getAttribute('data-active')).toBe('')
  })

  test('isActive on a additionally sets aria-current="page"', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item href="/docs" isActive>
          Link
        </SidebarFrame.Item>
        <SidebarFrame.Item isActive>Button</SidebarFrame.Item>
      </SidebarFrame>
    ))
    const link = screen.getByRole('link', { name: 'Link' })
    const button = screen.getByRole('button', { name: 'Button' })
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(button.getAttribute('aria-current')).toBeNull()
    expect(button.getAttribute('aria-pressed')).toBeNull()
  })

  test('Item with leading and trailing renders icons with respective data slots', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item leading="i-lucide:house" trailing="i-lucide:chevron-right">
          Home
        </SidebarFrame.Item>
      </SidebarFrame>
    ))
    const leading = screen.container.querySelector('[data-slot="sidebar-frame-item-leading"]')
    const trailing = screen.container.querySelector('[data-slot="sidebar-frame-item-trailing"]')
    const label = screen.container.querySelector('[data-slot="sidebar-frame-item-label"]')
    expect(leading).not.toBeNull()
    expect(trailing).not.toBeNull()
    expect(label).not.toBeNull()
    expect(label?.textContent).toBe('Home')
  })

  test('Standalone Item with trailing icon renders without data-expanded and trailing icon does not rotate', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item trailing="i-lucide:chevron-right">Standalone</SidebarFrame.Item>
      </SidebarFrame>
    ))
    const button = screen.getByRole('button', { name: 'Standalone' })
    expect(button.hasAttribute('data-expanded')).toBe(false)
    const trailing = screen.container.querySelector('[data-slot="sidebar-frame-item-trailing"]')
    expect(trailing?.className).toContain('group-data-[expanded]:rotate-90')
  })

  test('Mobile frame sets data-mobile on Item', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={true}>
        <SidebarFrame.Item>Mobile Item</SidebarFrame.Item>
      </SidebarFrame>
    ))
    const button = screen.getByRole('button', { name: 'Mobile Item' })
    expect(button.getAttribute('data-mobile')).toBe('')
  })

  test('Item with actions renders wrapper with trigger and actions container', () => {
    const handleItemClick = vi.fn()
    const handleActionClick = vi.fn()

    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item
          onClick={handleItemClick}
          actions={
            <button type="button" onClick={handleActionClick} aria-label="More options">
              More
            </button>
          }
        >
          Project
        </SidebarFrame.Item>
      </SidebarFrame>
    ))

    const wrapper = screen.container.querySelector('[data-slot="sidebar-frame-item"]')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.tagName).toBe('DIV')

    const trigger = screen.container.querySelector('[data-slot="sidebar-frame-item-trigger"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.tagName).toBe('BUTTON')
    expect(trigger?.textContent).toBe('Project')

    const actionsContainer = screen.container.querySelector(
      '[data-slot="sidebar-frame-item-actions"]',
    )
    expect(actionsContainer).not.toBeNull()

    const actionButton = screen.getByRole('button', { name: 'More options' })
    expect(actionButton).not.toBeNull()

    fireEvent.click(actionButton)
    expect(handleActionClick).toHaveBeenCalledTimes(1)
    expect(handleItemClick).not.toHaveBeenCalled()

    fireEvent.click(trigger!)
    expect(handleItemClick).toHaveBeenCalledTimes(1)
  })

  test('Item with actions and href renders anchor trigger as sibling of actions', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Item href="/project/1" actions={<button type="button">Options</button>}>
          Project Link
        </SidebarFrame.Item>
      </SidebarFrame>
    ))

    const trigger = screen.getByRole('link', { name: 'Project Link' })
    expect(trigger.tagName).toBe('A')
    expect(trigger.getAttribute('href')).toBe('/project/1')

    const actionButton = screen.getByRole('button', { name: 'Options' })
    expect(actionButton.tagName).toBe('BUTTON')

    expect(trigger.contains(actionButton)).toBe(false)
  })
})

describe('SidebarFrame.Submenu', () => {
  test('Submenu with SubmenuTrigger renders a button trigger and collapsible content', async () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Submenu>
          <SidebarFrame.SubmenuTrigger>Submenu</SidebarFrame.SubmenuTrigger>
          <SidebarFrame.SubmenuContent>
            <SidebarFrame.Item>Sub Item</SidebarFrame.Item>
          </SidebarFrame.SubmenuContent>
        </SidebarFrame.Submenu>
      </SidebarFrame>
    ))
    const sub = screen.container.querySelector('[data-slot="sidebar-frame-submenu"]')
    expect(sub).not.toBeNull()
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('data-slot')).toBe('sidebar-frame-submenu-trigger')
    expect(screen.container.querySelector('[data-slot="sidebar-frame-submenu-content"]')).toBeNull()

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(
        screen.container.querySelector('[data-slot="sidebar-frame-submenu-content"]'),
      ).not.toBeNull()
    })
  })

  test('Submenu defaults to closed and hides content until the trigger is clicked', async () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Submenu>
          <SidebarFrame.SubmenuTrigger>Submenu</SidebarFrame.SubmenuTrigger>
          <SidebarFrame.SubmenuContent>
            <SidebarFrame.Item>Sub Item</SidebarFrame.Item>
          </SidebarFrame.SubmenuContent>
        </SidebarFrame.Submenu>
      </SidebarFrame>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })
    expect(screen.getByRole('button', { name: 'Sub Item' })).not.toBeNull()
  })

  test('Submenu with disabled marks the trigger disabled and prevents toggling', () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Submenu disabled>
          <SidebarFrame.SubmenuTrigger>Submenu</SidebarFrame.SubmenuTrigger>
          <SidebarFrame.SubmenuContent>
            <SidebarFrame.Item>Sub Item</SidebarFrame.Item>
          </SidebarFrame.SubmenuContent>
        </SidebarFrame.Submenu>
      </SidebarFrame>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect((trigger as HTMLButtonElement).disabled).toBe(true)
    expect(trigger.getAttribute('data-disabled')).toBe('')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('link and disclosure stay separate when composed as Item + icon SubmenuTrigger', async () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Submenu>
          <div class="flex gap-1 items-center">
            <SidebarFrame.Item href="/docs/installation" isActive class="flex-1">
              Installation
            </SidebarFrame.Item>
            <SidebarFrame.SubmenuTrigger aria-label="Toggle Installation submenu" />
          </div>
          <SidebarFrame.SubmenuContent>
            <SidebarFrame.Item href="/docs/unocss">UnoCSS</SidebarFrame.Item>
          </SidebarFrame.SubmenuContent>
        </SidebarFrame.Submenu>
      </SidebarFrame>
    ))
    const link = screen.getByRole('link', { name: 'Installation' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/docs/installation')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(link.hasAttribute('aria-expanded')).toBe(false)

    const chevron = screen.getByRole('button', { name: 'Toggle Installation submenu' })
    expect(chevron.getAttribute('aria-expanded')).toBe('false')
    expect(chevron.getAttribute('data-slot')).toBe('sidebar-frame-submenu-trigger')

    fireEvent.click(link)
    expect(chevron.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(chevron)
    await waitFor(() => {
      expect(chevron.getAttribute('aria-expanded')).toBe('true')
    })
    expect(screen.getByRole('link', { name: 'UnoCSS' })).not.toBeNull()
  })

  test('chevron rotation is driven by trigger expanded state', async () => {
    const screen = render(() => (
      <SidebarFrame>
        <SidebarFrame.Submenu>
          <SidebarFrame.SubmenuTrigger>Submenu</SidebarFrame.SubmenuTrigger>
          <SidebarFrame.SubmenuContent>
            <SidebarFrame.Item>Sub Item</SidebarFrame.Item>
          </SidebarFrame.SubmenuContent>
        </SidebarFrame.Submenu>
      </SidebarFrame>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger.className).toContain('group')
    expect(trigger.hasAttribute('data-expanded')).toBe(false)

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(trigger.getAttribute('data-expanded')).toBe('')
    })
    expect(trigger.className).toContain('group')
    const trailing = trigger.querySelector('[data-slot="sidebar-frame-item-trailing"]')
    expect(trailing?.className).toContain('group-data-[expanded]:rotate-90')
  })
})

describe('SidebarFrame open state', () => {
  test('preserves desktop open state across mobile breakpoint changes', async () => {
    const [mobile, setMobile] = createSignal(false)
    const screen = render(() => (
      <SidebarFrame isMobile={mobile()}>
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(
      screen.container
        .querySelector('[data-slot="sidebar-frame-sidebar"]')
        ?.getAttribute('data-closed'),
    ).toBe('')

    setMobile(true)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-expanded')).toBe(
        'false',
      ),
    )

    setMobile(false)
    await finishExitMotion()
    await waitFor(() => {
      expect(
        screen.container
          .querySelector('[data-slot="sidebar-frame-sidebar"]')
          ?.getAttribute('data-closed'),
      ).toBe('')
      expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-expanded')).toBe(
        'false',
      )
    })
  })

  test('supports controlled desktop open state', () => {
    const [open, setOpen] = createSignal(true)
    const onOpenChange = vi.fn((next: boolean) => setOpen(next))
    const screen = render(() => (
      <SidebarFrame isMobile={false} open={open()} onOpenChange={onOpenChange}>
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(
      screen.container
        .querySelector('[data-slot="sidebar-frame-sidebar"]')
        ?.getAttribute('data-closed'),
    ).toBe('')
  })

  test('exposes root data attributes for side and variant', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false} side="right" variant="inset">
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))
    const root = screen.container.querySelector('[data-slot="sidebar-frame"]')
    expect(root?.getAttribute('data-side')).toBe('right')
    expect(root?.getAttribute('data-variant')).toBe('inset')
    expect(root?.hasAttribute('data-mobile')).toBe(false)
  })
})

describe('SidebarFrame closeOnSelect', () => {
  test('closes the mobile sheet after activating an item with href', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>
          <SidebarFrame.Item href="/docs">Docs</SidebarFrame.Item>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(document.body.querySelector('a[href="/docs"]')!)
    await finishExitMotion()
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
  })

  test('does not close the mobile sheet for items without href', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>
          <SidebarFrame.Item>Action</SidebarFrame.Item>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(
      document.body.querySelector('[data-slot="sidebar-frame-item"]') as HTMLButtonElement,
    )
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  test('keeps the mobile sheet open when closeOnSelect is false', async () => {
    const screen = render(() => (
      <SidebarFrame isMobile>
        <SidebarFrame.Sidebar>
          <SidebarFrame.Item href="/docs" closeOnSelect={false}>
            Docs
          </SidebarFrame.Item>
        </SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(document.body.querySelector('a[href="/docs"]')!)
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })
})

describe('SidebarFrame landmarks', () => {
  test('Sidebar defaults to aside and Main defaults to div', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false}>
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>Content</SidebarFrame.Main>
      </SidebarFrame>
    ))
    expect(screen.container.querySelector('[data-slot="sidebar-frame-sidebar"]')?.tagName).toBe(
      'ASIDE',
    )
    expect(screen.container.querySelector('[data-slot="sidebar-frame-main"]')?.tagName).toBe('DIV')
  })

  test('Trigger aria-controls matches the sidebar id', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false} sidebarId="app-sidebar">
        <SidebarFrame.Sidebar>Navigation</SidebarFrame.Sidebar>
        <SidebarFrame.Main>
          <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        </SidebarFrame.Main>
      </SidebarFrame>
    ))
    expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-controls')).toBe(
      'app-sidebar',
    )
    expect(screen.container.querySelector('#app-sidebar')).not.toBeNull()
  })
})

describe('SidebarFrame context validation', () => {
  test.each([
    ['Menu', () => <SidebarFrame.Menu />],
    ['Label', () => <SidebarFrame.Label />],
    ['Item', () => <SidebarFrame.Item />],
    [
      'Submenu',
      () => (
        <SidebarFrame.Submenu>
          <SidebarFrame.SubmenuTrigger>Sub</SidebarFrame.SubmenuTrigger>
        </SidebarFrame.Submenu>
      ),
    ],
  ])('%s throws when rendered outside SidebarFrame', (_name, component) => {
    expect(() => render(component)).toThrow(
      'useSidebarFrameContext must be used within <SidebarFrameProvider />',
    )
  })
})
