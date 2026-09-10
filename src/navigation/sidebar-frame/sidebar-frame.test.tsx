import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { renderWithTheme } from '../../test-utils/theme-render'

import { SidebarFrame } from './sidebar-frame'
import { useSidebarFrame } from './sidebar-frame-context'

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
        <button type="button" onClick={context.toggle}>
          Toggle
        </button>
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
    expect(screen.container.querySelector('[data-slot="root"]')?.className).toContain('flex')
    expect(screen.container.querySelector('[data-slot="sidebar"]')?.className).toContain('w-64')
    expect(screen.container.querySelector('[data-slot="main"]')?.className).toContain('flex-1')
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

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    fireEvent.click(screen.getByText('Toggle'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
      expect(document.body.textContent).toContain('Navigation')
    })
  })

  test('derives mobile mode from matchMedia when it is uncontrolled', async () => {
    window.matchMedia = createMatchMediaMock(true)
    const screen = render(() => (
      <SidebarFrame>
        <FrameContent />
      </SidebarFrame>
    ))

    await waitFor(() =>
      expect(screen.container.querySelector('[data-slot="sidebar"]')).toHaveProperty(
        'hidden',
        true,
      ),
    )
    fireEvent.click(screen.getByText('Toggle'))
    await waitFor(() => expect(document.body.textContent).toContain('Navigation'))
  })

  test('toggles desktop visibility and updates scroll state', () => {
    const screen = render(() => (
      <SidebarFrame isMobile={false} scrollThreshold={10}>
        <FrameContent />
      </SidebarFrame>
    ))
    const sidebar = screen.container.querySelector('[data-slot="sidebar"]') as HTMLDivElement
    const main = screen.container.querySelector('[data-slot="main"]') as HTMLDivElement

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
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('p-2')
    expect(screen.container.querySelector('[data-slot="main"]')?.className).toContain('rounded-xl')
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
