import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal, onCleanup } from 'solid-js'
import type { JSX } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-util/overlay-test'
import { Resizable } from '../resizable'

import { Sidebar } from './sidebar'

const originalMatchMedia = window.matchMedia

test.each(['Header', 'Content', 'Footer', 'Inset', 'Group', 'Menu'] as const)(
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
      <Sidebar isMobile={false}>
        {createComponent(Sidebar[part], {
          get children() {
            reads += 1
            return <Child />
          },
        })}
      </Sidebar>
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
  return (
    <>
      <Sidebar.Panel>
        <Sidebar.Header>Header</Sidebar.Header>
        <Sidebar.Content>Navigation</Sidebar.Content>
        <Sidebar.Footer>Footer</Sidebar.Footer>
      </Sidebar.Panel>
      <Sidebar.Inset>
        <Sidebar.Trigger>Toggle</Sidebar.Trigger>
      </Sidebar.Inset>
    </>
  )
}

beforeEach(() => {
  window.matchMedia = createMatchMediaMock(false)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('Sidebar', () => {
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
      <Sidebar isMobile={mobile()} panelId="unique-sidebar">
        <Sidebar.Panel ref={ref}>
          <Child />
        </Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))
    const child = screen.getByTestId('sidebar-child')
    const assertUnique = () => {
      expect(document.querySelectorAll('#unique-sidebar')).toHaveLength(1)
      expect(document.querySelectorAll('[data-slot="sidebar-panel"]')).toHaveLength(1)
    }
    assertUnique()
    setMobile(true)
    await waitFor(() =>
      expect(
        screen.container
          .querySelector('[data-slot="sidebar-trigger"]')
          ?.getAttribute('aria-expanded'),
      ).toBe('false'),
    )
    fireEvent.click(screen.container.querySelector('[data-slot="sidebar-trigger"]')!)
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
      <Sidebar isMobile={false}>
        <FrameContent />
      </Sidebar>
    ))

    expect(screen.getByText('Header')).toBeTruthy()
    expect(screen.getByText('Navigation')).toBeTruthy()
    expect(screen.getByText('Footer')).toBeTruthy()
    expect(screen.container.querySelector('[data-slot="sidebar"]')?.className).toContain('flex')
    const sidebarClass = screen.container.querySelector('[data-slot="sidebar-panel"]')?.className
    expect(sidebarClass).toContain('w-(--mo-sidebar-width)')
    expect(sidebarClass).toContain('bg-card')
    expect(sidebarClass).toContain('data-closed:ms-(--mo-sidebar-offset)')
    expect(
      screen.container
        .querySelector<HTMLElement>('[data-slot="sidebar"]')
        ?.style.getPropertyValue('--mo-sidebar-width'),
    ).toBe('var(--sidebar-width, clamp(14rem, 25%, 20rem))')
    for (const element of screen.container.querySelectorAll<HTMLElement>('[data-slot]')) {
      expect(element.style.getPropertyValue('--sidebar-width')).toBe('')
      if (element.dataset.slot !== 'sidebar') {
        expect(element.style.getPropertyValue('--mo-sidebar-width')).toBe('')
      }
    }
    expect(screen.container.querySelector('[data-slot="sidebar-inset"]')?.className).toContain(
      'flex-1',
    )
  })

  test('preserves the main subtree when switching between desktop and mobile', () => {
    const [mobile, setMobile] = createSignal(false)
    let input: HTMLInputElement | undefined
    const screen = render(() => (
      <Sidebar isMobile={mobile()}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <input ref={(element) => (input = element)} aria-label="Persistent input" />
        </Sidebar.Inset>
      </Sidebar>
    ))
    const initialInput = screen.getByLabelText('Persistent input')

    setMobile(true)
    expect(screen.getByLabelText('Persistent input')).toBe(initialInput)
    setMobile(false)
    expect(screen.getByLabelText('Persistent input')).toBe(initialInput)
    expect(input).toBe(initialInput)
  })

  test('opens the mobile Drawer through the public context', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <FrameContent />
      </Sidebar>
    ))

    expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()
    fireEvent.click(screen.getByText('Toggle'))

    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="drawer-content"]')?.getAttribute('aria-label'),
      ).toBe('Sidebar navigation')
      expect(document.body.textContent).toContain('Navigation')
    })
  })

  test('uses the custom Sidebar accessible name for the mobile Drawer', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel aria-label="Project navigation">Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
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
  ] as const)(
    'prefers the Sidebar %s when naming the mobile Drawer',
    async (_case, props, name) => {
      const screen = render(() => (
        <Sidebar isMobile>
          <Sidebar.Panel {...props}>Navigation</Sidebar.Panel>
          <Sidebar.Inset>
            <Sidebar.Trigger>Toggle</Sidebar.Trigger>
          </Sidebar.Inset>
        </Sidebar>
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
      await waitFor(() =>
        expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
          name,
        ),
      )
    },
  )

  test('derives mobile mode from matchMedia when it is uncontrolled', async () => {
    window.matchMedia = createMatchMediaMock(true)
    const screen = render(() => (
      <Sidebar>
        <FrameContent />
      </Sidebar>
    ))

    await waitFor(() =>
      expect(screen.container.querySelector('[data-slot="sidebar-panel"]')).toBeNull(),
    )
    expect(document.body.querySelectorAll('[data-slot="sidebar-panel"]')).toHaveLength(0)
    fireEvent.click(screen.getByText('Toggle'))
    await waitFor(() =>
      expect(document.body.querySelectorAll('[data-slot="sidebar-panel"]')).toHaveLength(1),
    )
  })

  test('queries matchMedia with the configured breakpoint', async () => {
    const matchMedia = createMatchMediaMock(false)
    window.matchMedia = matchMedia
    render(() => (
      <Sidebar breakpoint={1024}>
        <FrameContent />
      </Sidebar>
    ))

    await waitFor(() => expect(matchMedia).toHaveBeenCalledWith('(max-width: 1024px)'))
  })

  test('ignores matchMedia updates when isMobile is controlled', async () => {
    window.matchMedia = createMatchMediaMock(true)
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <FrameContent />
      </Sidebar>
    ))

    expect(screen.container.querySelector('[data-slot="sidebar-panel"]')).toHaveProperty(
      'hidden',
      false,
    )
    expect(screen.getByText('Navigation')).toBeTruthy()
  })

  test('keeps the named Drawer behavior when mobile mode changes dynamically', async () => {
    const [mobile, setMobile] = createSignal(false)
    const screen = render(() => (
      <Sidebar isMobile={mobile()}>
        <Sidebar.Panel aria-label="Account navigation">Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
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

  test('hides and inerts the desktop panel while collapsed', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <FrameContent />
      </Sidebar>
    ))
    const sidebar = screen.container.querySelector('[data-slot="sidebar-panel"]') as HTMLElement

    expect(sidebar.getAttribute('data-expanded')).toBe('')
    fireEvent.click(screen.getByText('Toggle'))
    expect(sidebar.getAttribute('data-closed')).toBe('')
    expect(sidebar.hasAttribute('data-expanded')).toBe(false)
    expect(sidebar.getAttribute('aria-hidden')).toBe('true')
    expect((sidebar as HTMLElement & { inert: boolean }).inert).toBe(true)
  })

  test('sets the panel width through the width prop', () => {
    const screen = render(() => (
      <Sidebar isMobile={false} width={288}>
        <FrameContent />
      </Sidebar>
    ))
    expect(
      screen.container
        .querySelector<HTMLElement>('[data-slot="sidebar"]')
        ?.style.getPropertyValue('--mo-sidebar-width'),
    ).toBe('288px')
  })

  test('offsets the collapsed floating panel by its outer gap', () => {
    const screen = render(() => (
      <Sidebar isMobile={false} variant="floating">
        <FrameContent />
      </Sidebar>
    ))
    expect(
      screen.container
        .querySelector<HTMLElement>('[data-slot="sidebar"]')
        ?.style.getPropertyValue('--mo-sidebar-offset'),
    ).toBe('calc(-1 * var(--mo-sidebar-width) - 0.5rem)')
    expect(screen.container.querySelector('[data-slot="sidebar-panel"]')?.className).toContain(
      'me-2',
    )
  })

  test('applies side and visual variants to the merged root', () => {
    const screen = render(() => (
      <Sidebar isMobile={false} side="right" variant="inset">
        <FrameContent />
      </Sidebar>
    ))
    const root = screen.container.querySelector('[data-slot="sidebar"]')

    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('p-2')
    expect(screen.container.querySelector('[data-slot="sidebar-inset"]')?.className).toContain(
      'rounded-xl',
    )
  })

  test('forwards region attributes, classes, styles, refs, and events', () => {
    const onScroll = vi.fn()
    let mainRef: HTMLElement | undefined
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel data-testid="sidebar" class="custom-sidebar w-48" />
        <Sidebar.Inset
          ref={(element) => (mainRef = element)}
          data-testid="main"
          class="custom-main"
          style={{ color: 'red' }}
          onScroll={onScroll}
        />
      </Sidebar>
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

describe('Sidebar.Trigger', () => {
  test('renders a default button with open/closed state attributes and aria-expanded', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.getAttribute('data-slot')).toBe('sidebar-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.getAttribute('data-open')).toBe('')
    expect(trigger.hasAttribute('data-closed')).toBe(false)
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false)
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()
  })

  test('reflects initial closed state when mobile', () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-open')).toBe(false)
  })

  test('toggles desktop visibility, aria-expanded, and state attributes on click', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    const sidebar = screen.container.querySelector('[data-slot="sidebar-panel"]') as HTMLDivElement

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

  test('opens mobile drawer on trigger click', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(document.body.querySelector('[data-slot="drawer-content"]')).toBeNull()

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="drawer-content"]')).not.toBeNull()
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })
  })

  test('composes consumer onClick and allows preventDefault to stop toggle', () => {
    const onClick = vi.fn((event: MouseEvent) => {
      event.preventDefault()
    })
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger onClick={onClick}>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
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
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger onClick={onClick}>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('does not toggle when disabled and exposes data-disabled', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger disabled>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByRole('button', { name: 'Toggle' })
    expect(trigger.hasAttribute('disabled')).toBe(true)
    expect(trigger.getAttribute('data-disabled')).toBe('')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  test('supports non-native root with Enter and Space keyboard activation', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger as="div">Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
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
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Sidebar</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger as="div" disabled>
            Toggle
          </Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    const trigger = screen.getByText('Toggle')
    expect(trigger.getAttribute('aria-disabled')).toBe('true')
    expect(trigger.getAttribute('data-disabled')).toBe('')
    expect(trigger.getAttribute('tabindex')).toBe('-1')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('Sidebar.GroupLabel', () => {
  test('renders default elements and attributes', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Section Title</Sidebar.GroupLabel>
        </Sidebar.Group>
      </Sidebar>
    ))
    const menu = screen.container.querySelector('[data-slot="sidebar-group"]')
    expect(menu).not.toBeNull()
    const label = screen.container.querySelector('[data-slot="sidebar-group-label"]')
    expect(label).not.toBeNull()
    expect(label?.tagName).toBe('DIV')
    expect(label?.textContent).toBe('Section Title')
  })

  test('GroupLabel as="h2" renders h2', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Group>
          <Sidebar.GroupLabel as="h2">Section Heading</Sidebar.GroupLabel>
        </Sidebar.Group>
      </Sidebar>
    ))
    const heading = screen.getByRole('heading', { level: 2, name: 'Section Heading' })
    expect(heading.tagName).toBe('H2')
    expect(heading.getAttribute('data-slot')).toBe('sidebar-group-label')
  })
})

describe('Sidebar.Group', () => {
  test('renders group container without list role', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Group>
          <span>Content</span>
        </Sidebar.Group>
      </Sidebar>
    ))
    const menu = screen.container.querySelector('[data-slot="sidebar-group"]')
    expect(menu).not.toBeNull()
    expect(menu?.tagName).toBe('DIV')
    expect(menu?.getAttribute('role')).toBeNull()
  })

  test('Group as="nav" renders nav element', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Group as="nav">
          <span>Content</span>
        </Sidebar.Group>
      </Sidebar>
    ))
    const menu = screen.container.querySelector('[data-slot="sidebar-group"]')
    expect(menu?.tagName).toBe('NAV')
  })

  test('renders polymorphic regions and submenu content', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Panel>
          <Sidebar.Header as="header" data-testid="header">
            Header
          </Sidebar.Header>
          <Sidebar.Content as="section" data-testid="body">
            Body
          </Sidebar.Content>
          <Sidebar.Footer as="footer" data-testid="footer">
            Footer
          </Sidebar.Footer>
          <Sidebar.MenuSub defaultOpen>
            <Sidebar.MenuSubTrigger>Sub</Sidebar.MenuSubTrigger>
            <Sidebar.MenuSubContent as="ol" data-testid="submenu-content">
              <li>Item</li>
            </Sidebar.MenuSubContent>
          </Sidebar.MenuSub>
        </Sidebar.Panel>
      </Sidebar>
    ))
    expect(screen.getByTestId('header').tagName).toBe('HEADER')
    expect(screen.getByTestId('body').tagName).toBe('SECTION')
    expect(screen.getByTestId('footer').tagName).toBe('FOOTER')
    expect(screen.getByTestId('submenu-content').tagName).toBe('OL')
  })
})

describe('Sidebar.Menu', () => {
  test('renders a list of menu items inside a group', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Group>
          <Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton href="/home">Home</Sidebar.MenuButton>
            </Sidebar.MenuItem>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton href="/inbox">Inbox</Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar>
    ))
    const menu = screen.getByRole('list')
    expect(menu.tagName).toBe('UL')
    expect(menu.getAttribute('data-slot')).toBe('sidebar-menu')
    expect(menu.parentElement?.getAttribute('data-slot')).toBe('sidebar-group')
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]?.getAttribute('data-slot')).toBe('sidebar-menu-item')
    expect(items[0]?.querySelector('[data-slot="sidebar-menu-button"]')?.textContent).toBe('Home')
  })

  test('forwards as, attributes, classes, and styles', () => {
    const screen = render(() => (
      <Sidebar classes={{ menu: 'theme-menu' }}>
        <Sidebar.Menu
          as="ol"
          aria-label="Projects"
          class="custom-menu"
          style={{ color: 'red' }}
          data-testid="menu"
        />
      </Sidebar>
    ))
    const menu = screen.getByTestId('menu')
    expect(menu.tagName).toBe('OL')
    expect(menu.getAttribute('aria-label')).toBe('Projects')
    expect(menu.getAttribute('data-slot')).toBe('sidebar-menu')
    expect(menu.className).toContain('theme-menu')
    expect(menu.className).toContain('custom-menu')
    expect(menu.style.color).toBe('red')
  })
})

describe('Sidebar.MenuButton', () => {
  test('MenuItem with href renders an a', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton href="/docs">Overview</Sidebar.MenuButton>
      </Sidebar>
    ))
    const link = screen.getByRole('link', { name: 'Overview' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/docs')
    expect(link.getAttribute('data-slot')).toBe('sidebar-menu-button')
  })

  test('MenuItem with as overrides href', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton as="button" href="/docs">
          Overview
        </Sidebar.MenuButton>
      </Sidebar>
    ))
    const button = screen.getByRole('button', { name: 'Overview' })
    expect(button.tagName).toBe('BUTTON')
    expect(screen.queryByRole('link')).toBeNull()
  })

  test('MenuItem default renders button with type="button", fires onClick, respects disabled', () => {
    const handleClick = vi.fn()
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton onClick={handleClick}>Action</Sidebar.MenuButton>
        <Sidebar.MenuButton disabled onClick={handleClick}>
          Disabled Action
        </Sidebar.MenuButton>
      </Sidebar>
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

  test('MenuItem disabled as a keeps tag a, removes href, sets aria-disabled="true", sets data-disabled, and prevents click', () => {
    const handleClick = vi.fn()
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton href="/docs" disabled onClick={handleClick}>
          Disabled Link
        </Sidebar.MenuButton>
      </Sidebar>
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

  test('owns hover, active, and focus styles', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton isActive>Button</Sidebar.MenuButton>
      </Sidebar>
    ))
    const button = screen.getByRole('button', { name: 'Button' })
    expect(button.className).toContain('hover:bg-muted-hover')
    expect(button.className).not.toContain('hover:bg-accent-hover')
    expect(button.className).toContain('data-active:bg-accent')
    expect(button.className).toContain('focus-visible:ring-3')
  })

  test('isActive sets data-active on both a and button', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton href="/docs" isActive>
          Link
        </Sidebar.MenuButton>
        <Sidebar.MenuButton isActive>Button</Sidebar.MenuButton>
      </Sidebar>
    ))
    const link = screen.getByRole('link', { name: 'Link' })
    const button = screen.getByRole('button', { name: 'Button' })
    expect(link.getAttribute('data-active')).toBe('')
    expect(button.getAttribute('data-active')).toBe('')
  })

  test('isActive on a additionally sets aria-current="page"', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton href="/docs" isActive>
          Link
        </Sidebar.MenuButton>
        <Sidebar.MenuButton isActive>Button</Sidebar.MenuButton>
      </Sidebar>
    ))
    const link = screen.getByRole('link', { name: 'Link' })
    const button = screen.getByRole('button', { name: 'Button' })
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(button.getAttribute('aria-current')).toBeNull()
    expect(button.getAttribute('aria-pressed')).toBeNull()
  })

  test('MenuItem with leading and trailing renders icons with respective data slots', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton leading="i-lucide:house" trailing="i-lucide:chevron-right">
          Home
        </Sidebar.MenuButton>
      </Sidebar>
    ))
    const leading = screen.container.querySelector('[data-slot="sidebar-menu-button-leading"]')
    const trailing = screen.container.querySelector('[data-slot="sidebar-menu-button-trailing"]')
    const label = screen.container.querySelector('[data-slot="sidebar-menu-button-label"]')
    expect(leading).not.toBeNull()
    expect(trailing).not.toBeNull()
    expect(label).not.toBeNull()
    expect(label?.textContent).toBe('Home')
  })

  test('standalone trailing icon has no expanded parent to rotate it', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuButton trailing="i-lucide:chevron-right">Standalone</Sidebar.MenuButton>
      </Sidebar>
    ))
    const button = screen.getByRole('button', { name: 'Standalone' })
    expect(button.hasAttribute('data-expanded')).toBe(false)
    const trailing = screen.container.querySelector('[data-slot="sidebar-menu-button-trailing"]')
    expect(trailing?.parentElement).toBe(button)
    expect(trailing?.className).toContain('[[data-expanded]>&]:rotate-90')
  })

  test('Mobile sidebar sets data-mobile on MenuButton', () => {
    const screen = render(() => (
      <Sidebar isMobile={true}>
        <Sidebar.MenuButton>Mobile Item</Sidebar.MenuButton>
      </Sidebar>
    ))
    const button = screen.getByRole('button', { name: 'Mobile Item' })
    expect(button.getAttribute('data-mobile')).toBe('')
  })

  test('MenuItem wraps MenuButton and MenuAction as siblings', () => {
    const handleItemClick = vi.fn()
    const handleActionClick = vi.fn()

    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuItem class="group/menu-item">
          <Sidebar.MenuButton onClick={handleItemClick}>Project</Sidebar.MenuButton>
          <Sidebar.MenuAction>
            <button type="button" onClick={handleActionClick} aria-label="More options">
              More
            </button>
          </Sidebar.MenuAction>
        </Sidebar.MenuItem>
      </Sidebar>
    ))

    const item = screen.container.querySelector('[data-slot="sidebar-menu-item"]')!
    expect(item.tagName).toBe('LI')
    expect(item.classList).toContain('group/menu-item')
    expect(item.classList).toContain('relative')

    const button = screen.getByRole('button', { name: 'Project' })
    expect(button.getAttribute('data-slot')).toBe('sidebar-menu-button')
    expect(button.parentElement).toBe(item)
    expect(button.classList).not.toContain('pe-8')

    const action = screen.container.querySelector('[data-slot="sidebar-menu-action"]')!
    expect(action.parentElement).toBe(item)
    expect(action.classList).toContain('absolute')
    expect(action.classList).toContain('top-1')

    const actionButton = screen.getByRole('button', { name: 'More options' })
    expect(button.contains(actionButton)).toBe(false)

    fireEvent.click(actionButton)
    expect(handleActionClick).toHaveBeenCalledTimes(1)
    expect(handleItemClick).not.toHaveBeenCalled()

    fireEvent.click(button)
    expect(handleItemClick).toHaveBeenCalledTimes(1)
  })
})

describe('Sidebar.MenuSub', () => {
  test('MenuSub with MenuSubTrigger renders a button trigger and collapsible content', async () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuItem>
          <Sidebar.MenuSub>
            <Sidebar.MenuSubTrigger>Submenu</Sidebar.MenuSubTrigger>
            <Sidebar.MenuSubContent>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>Sub Item</Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.MenuSubContent>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
      </Sidebar>
    ))
    const sub = screen.container.querySelector('[data-slot="sidebar-menu-sub"]')
    expect(sub).not.toBeNull()
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('data-slot')).toBe('sidebar-menu-sub-trigger')
    expect(screen.container.querySelector('[data-slot="sidebar-menu-sub-content"]')).toBeNull()

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(
        screen.container.querySelector('[data-slot="sidebar-menu-sub-content"]'),
      ).not.toBeNull()
    })
  })

  test('MenuSub defaults to closed and hides content until the trigger is clicked', async () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuItem>
          <Sidebar.MenuSub>
            <Sidebar.MenuSubTrigger>Submenu</Sidebar.MenuSubTrigger>
            <Sidebar.MenuSubContent>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>Sub Item</Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.MenuSubContent>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
      </Sidebar>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
    })
    expect(screen.getByRole('button', { name: 'Sub Item' })).not.toBeNull()
  })

  test('MenuSub with disabled marks the trigger disabled and prevents toggling', () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuItem>
          <Sidebar.MenuSub disabled>
            <Sidebar.MenuSubTrigger>Submenu</Sidebar.MenuSubTrigger>
            <Sidebar.MenuSubContent>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>Sub Item</Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.MenuSubContent>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
      </Sidebar>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect((trigger as HTMLButtonElement).disabled).toBe(true)
    expect(trigger.getAttribute('data-disabled')).toBe('')

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('renders the trigger as a menu button and the content as a nested list', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <Sidebar>
        <Sidebar.Menu>
          <Sidebar.MenuItem data-testid="parent-item">
            <Sidebar.MenuSub defaultOpen>
              <Sidebar.MenuSubTrigger leading="i-lucide:folder" onClick={onClick}>
                Projects
              </Sidebar.MenuSubTrigger>
              <Sidebar.MenuSubContent>
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton href="/alpha">Alpha</Sidebar.MenuButton>
                </Sidebar.MenuItem>
              </Sidebar.MenuSubContent>
            </Sidebar.MenuSub>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar>
    ))
    const parent = screen.getByTestId('parent-item')
    const sub = parent.querySelector('[data-slot="sidebar-menu-sub"]')
    expect(sub?.parentElement).toBe(parent)

    const trigger = screen.getByRole('button', { name: 'Projects' })
    expect(trigger.getAttribute('data-slot')).toBe('sidebar-menu-sub-trigger')
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(trigger.className).toContain('hover:bg-muted-hover')
    expect(trigger.querySelector('[data-slot="sidebar-menu-button-leading"]')).not.toBeNull()
    expect(trigger.querySelector('[data-slot="sidebar-menu-button-trailing"]')).not.toBeNull()

    const content = screen.container.querySelector('[data-slot="sidebar-menu-sub-content"]')
    expect(content?.tagName).toBe('UL')
    expect(content?.querySelector('li [data-slot="sidebar-menu-button"]')?.textContent).toBe(
      'Alpha',
    )

    fireEvent.click(trigger)
    expect(onClick).toHaveBeenCalledOnce()
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'))
  })

  test('MenuSubTrigger accepts a custom trailing icon and Sidebar classes', () => {
    const screen = render(() => (
      <Sidebar classes={{ menuSubTrigger: 'theme-sub-trigger' }}>
        <Sidebar.MenuItem>
          <Sidebar.MenuSub>
            <Sidebar.MenuSubTrigger trailing="i-lucide:chevron-down" class="custom-trigger">
              Submenu
            </Sidebar.MenuSubTrigger>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
      </Sidebar>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    expect(trigger.className).toContain('theme-sub-trigger')
    expect(trigger.className).toContain('custom-trigger')
    expect(
      trigger.querySelector('[data-slot="sidebar-menu-button-trailing"]')?.className,
    ).toContain('i-lucide:chevron-down')
  })

  test('chevron rotation is driven by trigger expanded state', async () => {
    const screen = render(() => (
      <Sidebar>
        <Sidebar.MenuItem>
          <Sidebar.MenuSub>
            <Sidebar.MenuSubTrigger>Submenu</Sidebar.MenuSubTrigger>
            <Sidebar.MenuSubContent>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>Sub Item</Sidebar.MenuButton>
              </Sidebar.MenuItem>
            </Sidebar.MenuSubContent>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
      </Sidebar>
    ))
    const trigger = screen.getByRole('button', { name: 'Submenu' })
    const trailing = trigger.querySelector('[data-slot="sidebar-menu-button-trailing"]')
    expect(trailing?.parentElement).toBe(trigger)
    expect(trailing?.className).toContain('[[data-expanded]>&]:rotate-90')
    expect(trigger.hasAttribute('data-expanded')).toBe(false)

    fireEvent.click(trigger)
    await waitFor(() => {
      expect(trigger.getAttribute('data-expanded')).toBe('')
    })
  })
})

describe('Sidebar open state', () => {
  test('preserves desktop open state across mobile breakpoint changes', async () => {
    const [mobile, setMobile] = createSignal(false)
    const screen = render(() => (
      <Sidebar isMobile={mobile()}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(
      screen.container.querySelector('[data-slot="sidebar-panel"]')?.getAttribute('data-closed'),
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
        screen.container.querySelector('[data-slot="sidebar-panel"]')?.getAttribute('data-closed'),
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
      <Sidebar isMobile={false} open={open()} onOpenChange={onOpenChange}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(
      screen.container.querySelector('[data-slot="sidebar-panel"]')?.getAttribute('data-closed'),
    ).toBe('')
  })

  test('exposes root data attributes for side and variant', () => {
    const screen = render(() => (
      <Sidebar isMobile={false} side="right" variant="inset">
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))
    const root = screen.container.querySelector('[data-slot="sidebar"]')
    expect(root?.getAttribute('data-side')).toBe('right')
    expect(root?.getAttribute('data-variant')).toBe('inset')
    expect(root?.hasAttribute('data-mobile')).toBe(false)
  })
})

describe('Sidebar closeOnSelect', () => {
  test('closes the mobile drawer after activating an item with href', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel>
          <Sidebar.MenuButton href="/docs">Docs</Sidebar.MenuButton>
        </Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(document.body.querySelector('a[href="/docs"]')!)
    await finishExitMotion()
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
  })

  test('does not close the mobile drawer for items without href', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel>
          <Sidebar.MenuButton>Action</Sidebar.MenuButton>
        </Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(
      document.body.querySelector('[data-slot="sidebar-menu-button"]') as HTMLButtonElement,
    )
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  test('keeps the mobile drawer open when closeOnSelect is false', async () => {
    const screen = render(() => (
      <Sidebar isMobile>
        <Sidebar.Panel>
          <Sidebar.MenuButton href="/docs" closeOnSelect={false}>
            Docs
          </Sidebar.MenuButton>
        </Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
    await waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    fireEvent.click(document.body.querySelector('a[href="/docs"]')!)
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })
})

describe('Sidebar landmarks', () => {
  test('Panel defaults to aside and Inset defaults to main', () => {
    const screen = render(() => (
      <Sidebar isMobile={false}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>Content</Sidebar.Inset>
      </Sidebar>
    ))
    expect(screen.container.querySelector('[data-slot="sidebar-panel"]')?.tagName).toBe('ASIDE')
    expect(screen.container.querySelector('[data-slot="sidebar-inset"]')?.tagName).toBe('MAIN')
  })

  test('Trigger aria-controls matches the panel id', () => {
    const screen = render(() => (
      <Sidebar isMobile={false} panelId="app-sidebar">
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Inset>
          <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        </Sidebar.Inset>
      </Sidebar>
    ))
    expect(screen.getByRole('button', { name: 'Toggle' }).getAttribute('aria-controls')).toBe(
      'app-sidebar',
    )
    expect(screen.container.querySelector('#app-sidebar')).not.toBeNull()
  })
})

describe('Sidebar context validation', () => {
  test.each([
    ['Menu', () => <Sidebar.Group />],
    ['Label', () => <Sidebar.GroupLabel />],
    ['Item', () => <Sidebar.MenuButton />],
    [
      'Submenu',
      () => (
        <Sidebar.MenuSub>
          <Sidebar.MenuSubTrigger>Sub</Sidebar.MenuSubTrigger>
        </Sidebar.MenuSub>
      ),
    ],
  ])('%s throws when rendered outside Sidebar', (_name, component) => {
    expect(() => render(component)).toThrow(
      'useSidebarContext must be used within <SidebarProvider />',
    )
  })
})

function createRect(input: { top: number; right: number; bottom: number; left: number }): DOMRect {
  const { top, right, bottom, left } = input
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    top,
    right,
    bottom,
    left,
    toJSON: () => ({}),
  }
}

function setRect(element: Element, rect: DOMRect): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => rect,
  })
}

function railOf(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('[data-slot="sidebar-rail"]')!
}

function panelOf(container: HTMLElement): HTMLElement {
  return container.querySelector<HTMLElement>('[data-slot="sidebar-panel"]')!
}

function sidebarWidth(container: HTMLElement): string {
  return container
    .querySelector<HTMLElement>('[data-slot="sidebar"]')!
    .style.getPropertyValue('--mo-sidebar-width')
}

function dragRail(
  rail: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
): void {
  fireEvent.pointerDown(rail, { pointerId: 1, button: 0, clientX: from.x, clientY: from.y })
  fireEvent.pointerMove(window, {
    pointerId: 1,
    clientX: to.x,
    clientY: to.y,
  })
  fireEvent.pointerUp(window, {
    pointerId: 1,
    clientX: to.x,
    clientY: to.y,
  })
}

interface RailFrameProps {
  width?: number
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  onWidthChange?: (width: number) => void
  onWidthCommit?: (width: number) => void
  onOpenChange?: (open: boolean) => void
  side?: 'left' | 'right'
  railDisabled?: boolean
  rail?: boolean
}

function RailFrame(props: RailFrameProps): JSX.Element {
  return (
    <Sidebar
      isMobile={false}
      side={props.side}
      width={props.width}
      defaultWidth={props.defaultWidth}
      minWidth={props.minWidth}
      maxWidth={props.maxWidth}
      onWidthChange={props.onWidthChange}
      onWidthCommit={props.onWidthCommit}
      onOpenChange={props.onOpenChange}
    >
      <Sidebar.Panel>Navigation</Sidebar.Panel>
      <Show when={props.rail !== false}>
        <Sidebar.Rail disabled={props.railDisabled} />
      </Show>
      <Sidebar.Inset>
        <Sidebar.Trigger>Toggle</Sidebar.Trigger>
      </Sidebar.Inset>
    </Sidebar>
  )
}

// Panel left of the rail (side="left"): rail center >= panel center => grows right.
function mockRailRects(
  container: HTMLElement,
  options?: { side?: 'left' | 'right'; panelWidth?: number },
): void {
  const width = options?.panelWidth ?? 240
  if (options?.side === 'right') {
    setRect(railOf(container), createRect({ top: 0, right: 559, bottom: 600, left: 559 }))
    setRect(panelOf(container), createRect({ top: 0, right: 800, bottom: 600, left: 560 }))
    return
  }
  setRect(railOf(container), createRect({ top: 0, right: width, bottom: 600, left: width }))
  setRect(panelOf(container), createRect({ top: 0, right: width, bottom: 600, left: 0 }))
}

describe('Sidebar.Rail', () => {
  test('renders a separator with ARIA values and messages aria-label', () => {
    const screen = render(() => <RailFrame defaultWidth={240} />)
    const rail = railOf(screen.container)
    expect(rail.getAttribute('role')).toBe('separator')
    expect(rail.getAttribute('aria-orientation')).toBe('vertical')
    expect(rail.getAttribute('aria-valuemin')).toBe('0')
    expect(rail.getAttribute('aria-valuemax')).toBe('480')
    expect(rail.getAttribute('aria-valuenow')).toBe('240')
    expect(rail.getAttribute('aria-label')).toBe('Resize sidebar')
    expect(rail.getAttribute('aria-controls')).toBe(panelOf(screen.container).id)
    expect(rail.tabIndex).toBe(0)
  })

  test('omits aria-valuenow while open with no resolved width', () => {
    const screen = render(() => <RailFrame />)
    expect(railOf(screen.container).getAttribute('aria-valuenow')).toBeNull()
  })

  test('drag grows the width, emits live changes, and commits once on release', () => {
    const onWidthChange = vi.fn()
    const onWidthCommit = vi.fn()
    const screen = render(() => (
      <RailFrame defaultWidth={240} onWidthChange={onWidthChange} onWidthCommit={onWidthCommit} />
    ))
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    dragRail(rail, { x: 240, y: 10 }, { x: 280, y: 10 })

    expect(sidebarWidth(screen.container)).toBe('280px')
    expect(onWidthChange).toHaveBeenLastCalledWith(280)
    expect(onWidthCommit).toHaveBeenCalledTimes(1)
    expect(onWidthCommit).toHaveBeenLastCalledWith(280)
  })

  test('a user ref on Panel receives the element without breaking rail measurement', () => {
    let userPanel: HTMLElement | undefined
    const screen = render(() => (
      <Sidebar isMobile={false} side="right" defaultWidth={240}>
        <Sidebar.Panel
          ref={(element: HTMLElement) => {
            userPanel = element
          }}
        >
          Navigation
        </Sidebar.Panel>
        <Sidebar.Rail />
        <Sidebar.Inset>Content</Sidebar.Inset>
      </Sidebar>
    ))
    const panel = panelOf(screen.container)
    expect(userPanel).toBe(panel)
    mockRailRects(screen.container, { side: 'right' })
    const rail = railOf(screen.container)

    dragRail(rail, { x: 559, y: 10 }, { x: 519, y: 10 })

    expect(sidebarWidth(screen.container)).toBe('280px')
  })

  test('drag works when the rail sits left of the panel (side="right" geometry)', () => {
    const screen = render(() => <RailFrame side="right" defaultWidth={240} />)
    mockRailRects(screen.container, { side: 'right' })
    const rail = railOf(screen.container)

    // sign = -1: dragging left grows the panel
    dragRail(rail, { x: 559, y: 10 }, { x: 519, y: 10 })

    expect(sidebarWidth(screen.container)).toBe('280px')
  })

  test('dragging below half the minimum closes; dragging back reopens clamped', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => <RailFrame defaultWidth={240} onOpenChange={onOpenChange} />)
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    // candidate 240 - 200 = 40 < 112 (minWidth 224 / 2)
    dragRail(rail, { x: 240, y: 10 }, { x: 40, y: 10 })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(rail.hasAttribute('data-closed')).toBe(true)

    // startWidth 0 from closed; +200 opens and clamps up to minWidth 224
    dragRail(rail, { x: 40, y: 10 }, { x: 240, y: 10 })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(sidebarWidth(screen.container)).toBe('224px')
  })

  test('width clamps at minWidth and maxWidth during a drag', () => {
    const screen = render(() => <RailFrame defaultWidth={240} minWidth={200} maxWidth={300} />)
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    dragRail(rail, { x: 240, y: 10 }, { x: 600, y: 10 })
    expect(sidebarWidth(screen.container)).toBe('300px')

    dragRail(rail, { x: 600, y: 10 }, { x: 400, y: 10 })
    // candidate 300 - 200 = 100 == minWidth/2 boundary: stays open, clamps to min
    expect(sidebarWidth(screen.container)).toBe('200px')
  })

  test('a click without movement toggles; a click after a drag does nothing', () => {
    const onOpenChange = vi.fn()
    const screen = render(() => <RailFrame defaultWidth={240} onOpenChange={onOpenChange} />)
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    fireEvent.click(rail)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)

    fireEvent.click(rail)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    dragRail(rail, { x: 240, y: 10 }, { x: 260, y: 10 })
    fireEvent.click(rail)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })

  test('keyboard resizes, snaps, and toggles; closed rail only answers Enter', () => {
    const onWidthChange = vi.fn()
    const onWidthCommit = vi.fn()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <RailFrame
        defaultWidth={240}
        onWidthChange={onWidthChange}
        onWidthCommit={onWidthCommit}
        onOpenChange={onOpenChange}
      />
    ))
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    fireEvent.keyDown(rail, { key: 'ArrowRight' })
    expect(sidebarWidth(screen.container)).toBe('256px')
    expect(onWidthCommit).toHaveBeenLastCalledWith(256)

    fireEvent.keyDown(rail, { key: 'ArrowRight', shiftKey: true })
    expect(sidebarWidth(screen.container)).toBe('257px')

    fireEvent.keyDown(rail, { key: 'Home' })
    expect(sidebarWidth(screen.container)).toBe('224px')
    fireEvent.keyDown(rail, { key: 'End' })
    expect(sidebarWidth(screen.container)).toBe('480px')

    fireEvent.keyDown(rail, { key: 'Enter' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)

    const widthCalls = onWidthChange.mock.calls.length
    fireEvent.keyDown(rail, { key: 'ArrowRight' })
    fireEvent.keyDown(rail, { key: 'Home' })
    fireEvent.keyDown(rail, { key: 'End' })
    expect(onWidthChange.mock.calls.length).toBe(widthCalls)
    expect(onOpenChange).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(rail, { key: 'Enter' })
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
  })

  test('renders nothing on mobile', () => {
    const screen = render(() => (
      <Sidebar isMobile={true}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Rail />
        <Sidebar.Inset>Content</Sidebar.Inset>
      </Sidebar>
    ))
    expect(screen.container.querySelector('[data-slot="sidebar-rail"]')).toBeNull()
  })

  test('controlled width emits but follows the prop', () => {
    const onWidthChange = vi.fn()
    const screen = render(() => <RailFrame width={240} onWidthChange={onWidthChange} />)
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    dragRail(rail, { x: 240, y: 10 }, { x: 260, y: 10 })

    expect(onWidthChange).toHaveBeenLastCalledWith(260)
    expect(sidebarWidth(screen.container)).toBe('240px')
  })

  test('trigger close and reopen keeps the width', () => {
    const screen = render(() => <RailFrame defaultWidth={240} />)
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    dragRail(rail, { x: 240, y: 10 }, { x: 300, y: 10 })
    expect(sidebarWidth(screen.container)).toBe('300px')

    const trigger = screen.container.querySelector<HTMLElement>('[data-slot="sidebar-trigger"]')!
    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(sidebarWidth(screen.container)).toBe('300px')
  })

  test('cross-drags a nested resizable handle and the rail together', async () => {
    const screen = render(() => (
      <Sidebar isMobile={false} defaultWidth={240}>
        <Sidebar.Panel>Navigation</Sidebar.Panel>
        <Sidebar.Rail />
        <Sidebar.Inset>
          <Resizable orientation="vertical" defaultValue={{ top: 50, bottom: 50 }}>
            <Resizable.Panel id="top">Top</Resizable.Panel>
            <Resizable.Handle intersection />
            <Resizable.Panel id="bottom">Bottom</Resizable.Panel>
          </Resizable>
        </Sidebar.Inset>
      </Sidebar>
    ))
    mockRailRects(screen.container)
    const innerHandle = screen.container.querySelector<HTMLElement>(
      '[data-slot="resizable-handle"]',
    )!
    const topPanel = screen.container.querySelector<HTMLElement>('#top')!
    const bottomPanel = screen.container.querySelector<HTMLElement>('#bottom')!
    // inner vertical-layout handle: a horizontal line whose LEFT edge touches the rail
    setRect(innerHandle, createRect({ top: 80, right: 800, bottom: 81, left: 240 }))
    setRect(topPanel, createRect({ top: 0, right: 560, bottom: 80, left: 240 }))
    setRect(bottomPanel, createRect({ top: 81, right: 560, bottom: 600, left: 240 }))

    const { refreshSplitterIntersections } = await import('../shared/splitter/manager')
    refreshSplitterIntersections()
    await Promise.resolve()

    const crossTarget = innerHandle.querySelector<HTMLElement>('[data-splitter-start-target]')!
    expect(crossTarget).toBeTruthy()

    // +40px on x (wider sidebar) and +20px on y (taller top panel)
    fireEvent.pointerDown(crossTarget, { pointerId: 1, button: 0, clientX: 240, clientY: 81 })
    fireEvent.pointerMove(window, {
      pointerId: 1,
      clientX: 280,
      clientY: 101,
    })
    fireEvent.pointerUp(window, {
      pointerId: 1,
      clientX: 280,
      clientY: 101,
    })

    expect(sidebarWidth(screen.container)).toBe('280px')
    expect(Number.parseFloat(topPanel.style.flexBasis)).toBeGreaterThan(50)
  })

  test('disabled rail ignores pointer and keys', () => {
    const onWidthChange = vi.fn()
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <RailFrame
        defaultWidth={240}
        railDisabled
        onWidthChange={onWidthChange}
        onOpenChange={onOpenChange}
      />
    ))
    mockRailRects(screen.container)
    const rail = railOf(screen.container)

    expect(rail.getAttribute('aria-disabled')).toBe('true')
    expect(rail.tabIndex).toBe(-1)

    dragRail(rail, { x: 240, y: 10 }, { x: 280, y: 10 })
    fireEvent.keyDown(rail, { key: 'ArrowRight' })
    fireEvent.click(rail)

    expect(sidebarWidth(screen.container)).toBe('240px')
    expect(onWidthChange).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
