import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { renderWithDesign } from '../../test-utils/design-render.tsx'

import { SidebarFrame, SidebarFrameSheetResizableRender } from './sidebar-frame'
import type { SidebarFrameProps } from './sidebar-frame'

const originalMatchMedia = window.matchMedia

test('preserves the main subtree when moving between desktop and mobile layouts', () => {
  const [mobile, setMobile] = createSignal(false)
  let mounts = 0
  const view = renderWithDesign(() => (
    <SidebarFrame
      isMobile={mobile()}
      sidebarBodyRender={() => 'Navigation'}
      mainRender={() => {
        mounts++
        return <input aria-label="Persistent input" />
      }}
    />
  ))
  const input = view.getByLabelText('Persistent input')
  setMobile(true)
  expect(view.getByLabelText('Persistent input')).toBe(input)
  setMobile(false)
  expect(view.getByLabelText('Persistent input')).toBe(input)
  expect(mounts).toBe(1)
})

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

beforeEach(() => {
  window.matchMedia = createMatchMediaMock(false)
})

test('official Design does not override the responsive media query', async () => {
  window.matchMedia = createMatchMediaMock(true)
  const view = renderWithDesign(() => (
    <SidebarFrame
      sidebarBodyRender={() => <a href="#main">Mobile navigation</a>}
      mainRender={(ctx) => <button onClick={ctx.toggle}>Open navigation</button>}
    />
  ))
  await waitFor(() => expect(view.container.querySelector('[data-slot="sidebar"]')).toBeNull())
  fireEvent.click(view.getByText('Open navigation'))
  await waitFor(() =>
    expect(document.querySelector('[data-slot="sidebar"]')?.getAttribute('aria-hidden')).toBe(
      'false',
    ),
  )
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function createBaseProps(): SidebarFrameProps {
  return {
    isMobile: false,
    sidebarBodyRender: () => <div>Sidebar body</div>,
    mainRender: () => <div>Main content</div>,
  }
}

describe('SidebarFrame', () => {
  test('initializes the desktop sidebar open before effects run', () => {
    let initialOpen: boolean | undefined

    render(() => (
      <SidebarFrame
        isMobile={false}
        sidebarBodyRender={(ctx) => {
          initialOpen ??= ctx.isOpen()
          return <div>Sidebar body</div>
        }}
        mainRender={() => <div>Main content</div>}
      />
    ))

    expect(initialOpen).toBe(true)
  })

  test('accepts static JSX for sidebar and main renderers', () => {
    const screen = render(() => (
      <SidebarFrame
        isMobile={false}
        sidebarBodyRender={<div data-testid="static-sidebar">Static sidebar</div>}
        mainRender={<div data-testid="static-main">Static main</div>}
      />
    ))

    expect(screen.getByTestId('static-sidebar').textContent).toBe('Static sidebar')
    expect(screen.getByTestId('static-main').textContent).toBe('Static main')
  })

  test('uses SheetOnly as default frame and does not render resizable on desktop', () => {
    const screen = renderWithDesign(() => <SidebarFrame {...createBaseProps()} />)

    expect(screen.container.querySelector('[data-slot="root"]')?.className).toContain('h-screen')
    expect(screen.container.querySelector('[data-slot="root"]')?.className).toContain('max-h-full')
    expect(screen.container.querySelector('[data-slot="layout"]')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="divider"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="sidebarWrapper"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="sidebar"]')?.className).toContain(
      'transition-[width,opacity,transform]',
    )
    expect(screen.container.querySelector('[data-slot="sidebar"]')?.className).not.toContain(
      'transition-mo-enter',
    )
    expect(screen.container.querySelector('[data-slot="sidebar"]')?.className).toContain('w-64')
    expect(screen.container.querySelector('[data-slot="main"]')?.className).toContain('flex-1')
  })

  test('toggles desktop sidebar width in the default frame', async () => {
    const screen = renderWithDesign(() => (
      <SidebarFrame
        {...createBaseProps()}
        mainRender={(ctx) => (
          <button type="button" onClick={ctx.toggle}>
            toggle desktop
          </button>
        )}
      />
    ))
    const sidebar = screen.container.querySelector('[data-slot="sidebar"]') as HTMLDivElement

    expect(sidebar.className).toContain('opacity-100')
    expect(sidebar.className).toContain('w-64')

    fireEvent.click(screen.getByText('toggle desktop'))

    expect(sidebar.className).toContain('opacity-0')
    expect(sidebar.className).toContain('w-0')
    expect(sidebar.getAttribute('aria-hidden')).toBe('true')
  })

  test('supports renderFrame override', () => {
    const screen = render(() => (
      <SidebarFrame
        {...createBaseProps()}
        frameRender={() => <div data-testid="custom-frame">custom</div>}
      />
    ))

    expect(screen.getByTestId('custom-frame').textContent).toBe('custom')
    expect(screen.container.querySelector('[data-slot="layout"]')).toBeNull()
  })

  test('renders resizable wrapper on desktop when using SheetResizable render', () => {
    const screen = render(() => (
      <SidebarFrame {...createBaseProps()} frameRender={SidebarFrameSheetResizableRender} />
    ))

    expect(screen.container.querySelector('[data-slot="divider"]')).not.toBeNull()
  })

  test('renders mobile sheet path for SheetResizable render', () => {
    const screen = render(() => (
      <SidebarFrame
        {...createBaseProps()}
        isMobile
        frameRender={SidebarFrameSheetResizableRender}
      />
    ))

    expect(screen.container.querySelector('[data-slot="main"]')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="divider"]')).toBeNull()
  })

  test('applies variant classes for default, floating and inset', () => {
    const defaultScreen = renderWithDesign(() => (
      <SidebarFrame {...createBaseProps()} variant="default" />
    ))
    const floatingScreen = renderWithDesign(() => (
      <SidebarFrame {...createBaseProps()} variant="floating" />
    ))
    const insetScreen = renderWithDesign(() => (
      <SidebarFrame {...createBaseProps()} variant="inset" />
    ))

    expect(defaultScreen.container.querySelector('[data-slot="sidebar"]')?.className).not.toContain(
      'rounded-lg',
    )
    expect(floatingScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain(
      'rounded-lg',
    )
    expect(floatingScreen.container.querySelector('[data-slot="layout"]')?.className).toContain(
      'p-2',
    )
    expect(insetScreen.container.querySelector('[data-slot="sidebar"]')?.className).not.toContain(
      'rounded-lg',
    )
    expect(insetScreen.container.querySelector('[data-slot="layout"]')?.className).toContain('p-2')
    expect(insetScreen.container.querySelector('[data-slot="main"]')?.className).toContain(
      'rounded-xl',
    )
  })

  test('handles right side layout order and inset direction', () => {
    const screen = renderWithDesign(() => (
      <SidebarFrame {...createBaseProps()} side="right" variant="inset" />
    ))

    expect(screen.container.querySelector('[data-slot="layout"]')?.className).toContain(
      'flex-row-reverse',
    )
    expect(screen.container.querySelector('[data-slot="layout"]')?.className).toContain('p-2')
  })

  test('applies default sidebar border by side direction', () => {
    const leftScreen = renderWithDesign(() => <SidebarFrame {...createBaseProps()} side="left" />)
    const rightScreen = renderWithDesign(() => <SidebarFrame {...createBaseProps()} side="right" />)

    expect(leftScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain(
      'border-r',
    )
    expect(rightScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain(
      'border-l',
    )
  })

  test('supports ctx.toggle to open mobile sheet', async () => {
    const screen = render(() => (
      <SidebarFrame
        isMobile
        sidebarBodyRender={() => <div>Mobile sidebar body</div>}
        mainRender={(ctx) => (
          <button type="button" onClick={ctx.toggle}>
            toggle
          </button>
        )}
      />
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    fireEvent.click(screen.getByText('toggle'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
      expect(document.body.textContent).toContain('Mobile sidebar body')
    })
  })

  test('updates scrolled state by scroll threshold', async () => {
    const screen = render(() => (
      <SidebarFrame
        {...createBaseProps()}
        scrollThreshold={10}
        mainRender={(ctx) => <div data-testid="scroll-state">{ctx.scrolled() ? 'on' : 'off'}</div>}
      />
    ))

    const main = screen.container.querySelector('[data-slot="main"]') as HTMLDivElement

    expect(screen.getByTestId('scroll-state').textContent).toBe('off')

    main.scrollTop = 20
    fireEvent.scroll(main)

    expect(screen.getByTestId('scroll-state').textContent).toBe('on')
  })

  test('prefers controlled isMobile over internal matchMedia', () => {
    const matchMedia = createMatchMediaMock(true)

    window.matchMedia = matchMedia

    const screen = render(() => <SidebarFrame {...createBaseProps()} isMobile={false} />)

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 768px)')
    expect(screen.container.querySelector('[data-slot="layout"]')).not.toBeNull()
  })
})
