import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { SidebarFrame, SidebarFrameSheetResizableRender } from './sidebar-frame'
import type { SidebarFrameProps } from './sidebar-frame'

const originalMatchMedia = window.matchMedia

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
  window.matchMedia = createMatchMediaMock(false) as unknown as typeof window.matchMedia
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function createBaseProps(): SidebarFrameProps {
  return {
    isMobile: false,
    renderSidebarBody: () => <div>Sidebar body</div>,
    renderMain: () => <div>Main content</div>,
  }
}

describe('SidebarFrame', () => {
  test('uses SheetOnly as default frame and does not render resizable on desktop', () => {
    const screen = render(() => <SidebarFrame {...createBaseProps()} />)

    expect(screen.container.querySelector('[data-slot="layout"]')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="divider"]')).toBeNull()
  })

  test('supports renderFrame override', () => {
    const screen = render(() => (
      <SidebarFrame
        {...createBaseProps()}
        renderFrame={() => <div data-testid="custom-frame">custom</div>}
      />
    ))

    expect(screen.getByTestId('custom-frame').textContent).toBe('custom')
    expect(screen.container.querySelector('[data-slot="layout"]')).toBeNull()
  })

  test('renders resizable wrapper on desktop when using SheetResizable render', () => {
    const screen = render(() => (
      <SidebarFrame {...createBaseProps()} renderFrame={SidebarFrameSheetResizableRender} />
    ))

    expect(screen.container.querySelector('[data-slot="divider"]')).not.toBeNull()
  })

  test('renders mobile sheet path for SheetResizable render', () => {
    const screen = render(() => (
      <SidebarFrame
        {...createBaseProps()}
        isMobile
        renderFrame={SidebarFrameSheetResizableRender}
      />
    ))

    expect(screen.container.querySelector('[data-slot="main"]')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="divider"]')).toBeNull()
  })

  test('applies variant classes for default, floating and inset', () => {
    const defaultScreen = render(() => <SidebarFrame {...createBaseProps()} variant="default" />)
    const floatingScreen = render(() => <SidebarFrame {...createBaseProps()} variant="floating" />)
    const insetScreen = render(() => <SidebarFrame {...createBaseProps()} variant="inset" />)

    expect(defaultScreen.container.querySelector('[data-slot="sidebar"]')?.className).not.toContain(
      'rounded-2xl',
    )
    expect(floatingScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain(
      'rounded-2xl',
    )
    expect(floatingScreen.container.querySelector('[data-slot="layout"]')?.className).toContain(
      'p-2',
    )
    expect(insetScreen.container.querySelector('[data-slot="sidebar"]')?.className).not.toContain(
      'rounded-2xl',
    )
    expect(insetScreen.container.querySelector('[data-slot="layout"]')?.className).toContain('p-2')
    expect(insetScreen.container.querySelector('[data-slot="main"]')?.className).toContain(
      'rounded-2xl',
    )
  })

  test('handles right side layout order and inset direction', () => {
    const screen = render(() => (
      <SidebarFrame {...createBaseProps()} side="right" variant="inset" />
    ))

    expect(screen.container.querySelector('[data-slot="layout"]')?.className).toContain(
      'flex-row-reverse',
    )
    expect(screen.container.querySelector('[data-slot="layout"]')?.className).toContain('p-2')
  })

  test('applies default sidebar border by side direction', () => {
    const leftScreen = render(() => <SidebarFrame {...createBaseProps()} side="left" />)
    const rightScreen = render(() => <SidebarFrame {...createBaseProps()} side="right" />)

    expect(leftScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain('b-r')
    expect(rightScreen.container.querySelector('[data-slot="sidebar"]')?.className).toContain('b-l')
  })

  test('supports ctx.toggle to open mobile sheet', async () => {
    const screen = render(() => (
      <SidebarFrame
        isMobile
        renderSidebarBody={() => <div>Mobile sidebar body</div>}
        renderMain={(ctx) => (
          <button type="button" onClick={ctx.toggle}>
            toggle
          </button>
        )}
      />
    ))

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()

    await fireEvent.click(screen.getByText('toggle'))

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
        renderMain={(ctx) => <div data-testid="scroll-state">{ctx.scrolled() ? 'on' : 'off'}</div>}
      />
    ))

    const main = screen.container.querySelector('[data-slot="main"]') as HTMLDivElement

    expect(screen.getByTestId('scroll-state').textContent).toBe('off')

    main.scrollTop = 20
    await fireEvent.scroll(main)

    expect(screen.getByTestId('scroll-state').textContent).toBe('on')
  })

  test('prefers controlled isMobile over internal matchMedia', () => {
    const matchMedia = createMatchMediaMock(true)

    window.matchMedia = matchMedia as unknown as typeof window.matchMedia

    const screen = render(() => <SidebarFrame {...createBaseProps()} isMobile={false} />)

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 768px)')
    expect(screen.container.querySelector('[data-slot="layout"]')).not.toBeNull()
  })
})
