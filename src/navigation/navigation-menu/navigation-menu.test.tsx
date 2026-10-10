import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { Show, createComponent, createContext, createSignal, onCleanup, useContext } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { NavigationMenu } from './navigation-menu'
import type { NavigationMenuProps, NavigationMenuT } from './navigation-menu.types'

function TestMenu(props: NavigationMenuProps) {
  return (
    <>
      <NavigationMenu {...props} aria-label="Main">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#overview" active>
                Overview
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#disabled" disabled>
                Unavailable link
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#pricing">Pricing</NavigationMenu.Link>
              <input aria-label="Search products" />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="unavailable" disabled>
            <NavigationMenu.Trigger>Unavailable</NavigationMenu.Trigger>
            <NavigationMenu.Content>Unavailable panel</NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item value="guides">
            <NavigationMenu.Trigger>Guides</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link href="#guide">Guide</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Link href="#docs">Docs</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
      <button>After navigation</button>
    </>
  )
}

function pointer(
  element: Element,
  type: string,
  init: { pointerType?: string; clientX?: number; clientY?: number } = {},
) {
  const event = new Event(type, { bubbles: type === 'pointermove' || type === 'pointerdown' })
  Object.assign(event, { pointerType: 'mouse', clientX: 0, clientY: 0 }, init)
  fireEvent(element, event)
}

const page = within(document.body)
let exitDuration = 0
let switchDuration = 0
beforeEach(() => {
  exitDuration = 0
  switchDuration = 0
  // JSDOM does not resolve stylesheet animations; model the exits that control presence.
  const computed = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = computed(element)
    if (!element.closest('[data-slot="navigation-menu-positioner"]')) {
      return style
    }
    const isPanel = element.matches('[data-slot="navigation-menu-positioner"] > div')
    const outgoing = element.matches('[data-expanded] > [data-closed]')
    return Object.defineProperties(style, {
      animationName: {
        value: isPanel
          ? element.hasAttribute('data-expanded')
            ? 'mo-enter'
            : 'mo-exit'
          : outgoing
            ? 'mo-exit'
            : 'none',
      },
      animationDuration: { value: `${isPanel ? exitDuration : switchDuration}ms` },
      animationDelay: { value: '0ms' },
    })
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('NavigationMenu', () => {
  test.each([undefined, 'start', 'end'] as const)(
    'centers the panel by default and respects %s alignment',
    async (align) => {
      render(() => <TestMenu align={align} />)
      fireEvent.click(page.getByRole('button', { name: 'Products' }))
      await page.findByRole('link', { name: 'Overview' })
      const panel = document.querySelector('[data-slot="navigation-menu-positioner"] > div')!
      await waitFor(() => expect(panel.getAttribute('data-align')).toBe(align ?? 'center'))
    },
  )

  test.each(['window', 'container'] as const)(
    'follows %s scrolling immediately and restores movement on the next trigger',
    async (target) => {
      let scroller!: HTMLDivElement
      const screen = render(() => (
        <div ref={(element) => (scroller = element)} style={{ overflow: 'auto' }}>
          <TestMenu />
        </div>
      ))
      fireEvent.click(page.getByRole('button', { name: 'Products' }))
      await page.findByRole('link', { name: 'Overview' })
      const positioner = document.querySelector<HTMLElement>(
        '[data-slot="navigation-menu-positioner"]',
      )!
      fireEvent.scroll(page.getByRole('link', { name: 'Overview' }).parentElement!)
      expect(positioner.style.transitionProperty).toBe('')
      fireEvent.scroll(target === 'window' ? window : scroller)
      expect(positioner.style.transitionProperty).toBe('none')
      fireEvent.click(page.getByRole('button', { name: 'Guides' }))
      await page.findByRole('link', { name: 'Guide' })
      expect(positioner.style.transitionProperty).toBe('')
      screen.unmount()
      positioner.style.transitionProperty = 'transform'
      fireEvent.scroll(window)
      expect(positioner.style.transitionProperty).toBe('transform')
    },
  )

  test('opens native navigation panels lazily and exposes accessible state', async () => {
    const _screen = render(() => <TestMenu />)
    expect(page.getByRole('navigation', { name: 'Main' })).toBeDefined()
    expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull()
    const products = page.getByRole('button', { name: 'Products' })
    fireEvent.click(products)
    const overview = await page.findByRole('link', { name: 'Overview' })
    const content = overview.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    expect(content.style.getPropertyValue('--mo-anim-ease')).toBe('ease')
    expect(products.getAttribute('aria-expanded')).toBe('true')
    expect(products.getAttribute('aria-haspopup')).toBe('false')
    expect(products.getAttribute('aria-controls')).toBe(content.id)
    expect(content.getAttribute('aria-labelledby')).toBe(products.id)
    expect(overview.getAttribute('aria-current')).toBe('page')
    expect(page.getByRole('link', { name: 'Unavailable link' }).getAttribute('href')).toBeNull()
    expect(page.getByRole('button', { name: 'Unavailable' }).hasAttribute('disabled')).toBe(true)
    expect(_screen.container.contains(content)).toBe(false)
    fireEvent.click(products)
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
  })

  test('delays the first hover, cancels abandoned opens, and switches an open surface immediately', async () => {
    vi.useFakeTimers()
    const changes = vi.fn()
    render(() => <TestMenu openDelay={80} onValueChange={changes} />)
    const products = page.getByRole('button', { name: 'Products' })
    const guides = page.getByRole('button', { name: 'Guides' })
    pointer(products, 'pointerenter')
    await vi.advanceTimersByTimeAsync(79)
    expect(products.getAttribute('aria-expanded')).toBe('false')
    pointer(products, 'pointerleave')
    await vi.advanceTimersByTimeAsync(100)
    expect(changes).not.toHaveBeenCalled()
    pointer(products, 'pointerenter')
    await vi.advanceTimersByTimeAsync(80)
    expect(products.getAttribute('aria-expanded')).toBe('true')
    const panel = document.querySelector('[data-slot="navigation-menu-positioner"] > div')
    pointer(guides, 'pointerenter')
    expect(guides.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBe(panel)
    expect(changes.mock.calls).toEqual([['products'], ['guides']])
  })

  test('protects movement across the trigger-to-panel gap and closes after leaving the panel', async () => {
    vi.useFakeTimers()
    render(() => <TestMenu />)
    const trigger = page.getByRole('button', { name: 'Products' })
    fireEvent.click(trigger)
    await vi.advanceTimersByTimeAsync(20)
    const panel = document.querySelector<HTMLElement>(
      '[data-slot="navigation-menu-positioner"] > div',
    )!
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 10, 100, 30))
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 48, 200, 160))
    pointer(trigger, 'pointerleave', { clientX: 60, clientY: 40 })
    pointer(document.body, 'pointermove', { clientX: 65, clientY: 44 })
    await vi.advanceTimersByTimeAsync(100)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const positioner = panel.parentElement!
    pointer(positioner, 'pointerenter')
    await vi.advanceTimersByTimeAsync(400)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    pointer(positioner, 'pointerleave', { clientX: 300, clientY: 210 })
    pointer(document.body, 'pointermove', { clientX: 400, clientY: 300 })
    await vi.advanceTimersByTimeAsync(50)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('ignores touch hover and cancels pending timers on unmount', async () => {
    vi.useFakeTimers()
    const changes = vi.fn()
    const _screen = render(() => <TestMenu onValueChange={changes} />)
    const trigger = page.getByRole('button', { name: 'Products' })
    pointer(trigger, 'pointerenter', { pointerType: 'touch' })
    await vi.advanceTimersByTimeAsync(100)
    expect(changes).not.toHaveBeenCalled()
    fireEvent.click(trigger)
    await vi.advanceTimersByTimeAsync(0)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    pointer(page.getByRole('button', { name: 'Guides' }), 'pointerleave')
    _screen.unmount()
    await vi.runAllTimersAsync()
    expect(changes.mock.calls).toEqual([['products']])
  })

  test('dismisses on an outside pointer press without redirecting focus', async () => {
    render(() => <TestMenu />)
    const trigger = page.getByRole('button', { name: 'Products' })
    trigger.focus()
    fireEvent.click(trigger)
    await page.findByRole('link', { name: 'Overview' })
    const outside = page.getByRole('button', { name: 'After navigation' })
    fireEvent.pointerDown(outside, { pointerType: 'mouse', button: 0 })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    outside.focus()
    expect(document.activeElement).toBe(outside)
  })

  test('requests controlled changes without changing the supplied value', async () => {
    const [value, setValue] = createSignal<string | null>(null)
    const changes = vi.fn()
    render(() => <TestMenu value={value()} onValueChange={changes} />)
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    expect(changes).toHaveBeenCalledWith('products')
    expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull()
    setValue('products')
    await page.findByRole('link', { name: 'Overview' })
    fireEvent.click(page.getByRole('button', { name: 'Guides' }))
    expect(changes).toHaveBeenLastCalledWith('guides')
    expect(page.getByRole('button', { name: 'Products' }).getAttribute('aria-expanded')).toBe(
      'true',
    )
    setValue('guides')
    await page.findByRole('link', { name: 'Guide' })
    setValue('missing')
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
    expect(changes.mock.calls).toEqual([['products'], ['guides']])
    setValue(null)
  })

  test.each([
    ['horizontal', 'ltr', 'ArrowRight', 'ArrowDown'],
    ['horizontal', 'rtl', 'ArrowLeft', 'ArrowDown'],
    ['vertical', 'ltr', 'ArrowDown', 'ArrowRight'],
    ['vertical', 'rtl', 'ArrowDown', 'ArrowLeft'],
  ] as const)(
    'navigates %s %s without wrapping or activating on focus',
    async (orientation, dir, nextKey, openKey) => {
      render(() => <TestMenu orientation={orientation} dir={dir} />)
      const products = page.getByRole('button', { name: 'Products' })
      const guides = page.getByRole('button', { name: 'Guides' })
      const docs = page.getByRole('link', { name: 'Docs' })
      products.focus()
      fireEvent.keyDown(products, { key: nextKey })
      expect(document.activeElement).toBe(guides)
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull()
      fireEvent.keyDown(guides, { key: 'End' })
      expect(document.activeElement).toBe(docs)
      fireEvent.keyDown(docs, { key: nextKey })
      expect(document.activeElement).toBe(docs)
      fireEvent.keyDown(docs, { key: 'Home' })
      expect(document.activeElement).toBe(products)
      fireEvent.keyDown(products, { key: openKey })
      const overview = await page.findByRole('link', { name: 'Overview' })
      await waitFor(() => expect(document.activeElement).toBe(overview))
      expect(overview.closest('[dir]')?.getAttribute('dir')).toBe(dir)
      expect(
        overview.closest('[data-slot="navigation-menu-content"]')?.getAttribute('data-orientation'),
      ).toBe(orientation)
      fireEvent.keyDown(overview, { key: dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight' })
      expect(document.activeElement).toBe(page.getByRole('link', { name: 'Pricing' }))
      fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
      expect(document.activeElement).toBe(products)
      expect(products.getAttribute('aria-expanded')).toBe('false')
    },
  )

  test('flips horizontal list arrows from the provider without a dir attribute', () => {
    const previousDirection = document.documentElement.getAttribute('dir')
    document.documentElement.removeAttribute('dir')
    try {
      render(() => (
        <MoraineProvider dir="rtl">
          <TestMenu />
        </MoraineProvider>
      ))
      const products = page.getByRole('button', { name: 'Products' })
      const guides = page.getByRole('button', { name: 'Guides' })
      products.focus()
      fireEvent.keyDown(products, { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(guides)
      expect(products.closest('[dir]')).toBeNull()
    } finally {
      if (previousDirection === null) {
        document.documentElement.removeAttribute('dir')
      } else {
        document.documentElement.setAttribute('dir', previousDirection)
      }
    }
  })

  test('preserves logical Tab order across the portal and leaves input editing keys alone', async () => {
    const _screen = render(() => <TestMenu />)
    const products = page.getByRole('button', { name: 'Products' })
    const guides = page.getByRole('button', { name: 'Guides' })
    fireEvent.click(products)
    const overview = await page.findByRole('link', { name: 'Overview' })
    products.focus()
    fireEvent.keyDown(products, { key: 'Tab' })
    const guard = _screen.container.querySelector<HTMLElement>(
      '[data-moraine-navigation-menu-focus-guard]',
    )!
    guard.focus()
    await waitFor(() => expect(document.activeElement).toBe(overview))
    const activate = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    })
    fireEvent(overview, activate)
    expect(activate.defaultPrevented).toBe(false)
    fireEvent.keyDown(overview, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(products)
    const input = page.getByRole('textbox', { name: 'Search products' })
    input.focus()
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    fireEvent(input, arrow)
    expect(arrow.defaultPrevented).toBe(false)
    fireEvent.keyDown(input, { key: 'Tab' })
    expect(document.activeElement).toBe(guides)
    expect(products.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(guides, { key: 'Tab', shiftKey: true })
    guard.focus()
    expect(document.activeElement).toBe(input)
    page.getByRole('button', { name: 'After navigation' }).focus()
    expect(products.getAttribute('aria-expanded')).toBe('false')
  })

  test('reveals panel links when keyboard navigation moves beyond the scrollport', async () => {
    render(() => <TestMenu />)
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    const overview = await page.findByRole('link', { name: 'Overview' })
    const pricing = page.getByRole('link', { name: 'Pricing' })
    const content = overview.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    vi.spyOn(content, 'clientHeight', 'get').mockReturnValue(100)
    vi.spyOn(content, 'scrollHeight', 'get').mockReturnValue(240)
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 240, 100))
    vi.spyOn(overview, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -content.scrollTop, 240, 20),
    )
    vi.spyOn(pricing, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, 180 - content.scrollTop, 240, 20),
    )
    overview.focus()
    fireEvent.keyDown(overview, { key: 'End' })
    expect(document.activeElement).toBe(pricing)
    expect(pricing.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      content.getBoundingClientRect().bottom,
    )
    fireEvent.keyDown(pricing, { key: 'Home' })
    expect(document.activeElement).toBe(overview)
    expect(overview.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      content.getBoundingClientRect().top,
    )
  })

  test('retains outgoing content across switches and reuses it on a quick return', async () => {
    switchDuration = 500
    exitDuration = 350
    render(() => <TestMenu />)
    const products = page.getByRole('button', { name: 'Products' })
    const guides = page.getByRole('button', { name: 'Guides' })
    fireEvent.click(products)
    const overview = await page.findByRole('link', { name: 'Overview' })
    const content = overview.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    const panel = content.parentElement!
    fireEvent.click(guides)
    const guide = await page.findByRole('link', { name: 'Guide' })
    const guideContent = guide.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    await Promise.resolve()
    expect(content.isConnected).toBe(true)
    expect(content.getAttribute('aria-hidden')).toBe('true')
    expect((content as HTMLElement & { inert?: boolean }).inert).toBe(true)
    expect(guideContent.parentElement).toBe(panel)
    fireEvent.click(products)
    expect(await page.findByRole('link', { name: 'Overview' })).toBe(overview)
    await Promise.resolve()
    fireEvent.animationEnd(content)
    expect(content.isConnected).toBe(true)
    fireEvent.animationEnd(guide)
    expect(guideContent.isConnected).toBe(true)
    fireEvent.animationEnd(guideContent)
    expect(guideContent.isConnected).toBe(false)
    fireEvent.click(guides)
    const nextGuide = await page.findByRole('link', { name: 'Guide' })
    expect(nextGuide).not.toBe(guide)
    fireEvent.click(guides)
    await Promise.resolve()
    expect(content.isConnected).toBe(false)
    const closingContent = nextGuide.closest('[data-slot="navigation-menu-content"]')!
    expect(closingContent.parentElement).toBe(panel)
    expect(closingContent.isConnected).toBe(true)
    fireEvent.animationEnd(panel)
    expect(closingContent.isConnected).toBe(false)
  })

  test('replaces unanimated content immediately and retains it through the shared panel exit', async () => {
    exitDuration = 350
    render(() => <TestMenu />)
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    const overview = await page.findByRole('link', { name: 'Overview' })
    const content = overview.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    const panel = document.querySelector('[data-slot="navigation-menu-positioner"] > div')!
    const portal = panel.parentElement!.parentElement
    expect(content.parentElement).toBe(panel)
    fireEvent.click(page.getByRole('button', { name: 'Guides' }))
    const guide = await page.findByRole('link', { name: 'Guide' })
    expect(guide.closest('[data-slot="navigation-menu-content"]')?.parentElement).toBe(panel)
    expect(panel.parentElement!.parentElement).toBe(portal)
    expect(content.isConnected).toBe(false)
    const guideContent = guide.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    fireEvent.click(page.getByRole('button', { name: 'Guides' }))
    await Promise.resolve()
    expect(guideContent.isConnected).toBe(true)
    expect((guideContent as HTMLElement & { inert?: boolean }).inert).toBe(true)
    expect(guideContent.getAttribute('aria-hidden')).toBe('true')
    expect(guideContent.hasAttribute('data-expanded')).toBe(true)
    expect(guideContent.hasAttribute('data-closed')).toBe(false)
    expect(page.queryByRole('link', { name: 'Guide' })).toBeNull()
    fireEvent.click(page.getByRole('button', { name: 'Guides' }))
    expect(await page.findByRole('link', { name: 'Guide' })).toBe(guide)
    expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBe(panel)
    expect(panel.parentElement!.parentElement).toBe(portal)
    expect((guideContent as HTMLElement & { inert?: boolean }).inert).not.toBe(true)
    fireEvent.click(page.getByRole('button', { name: 'Guides' }))
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    expect(await page.findByRole('link', { name: 'Overview' })).not.toBe(overview)
    expect(guideContent.isConnected).toBe(false)
    expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBe(panel)
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
  })

  test('retains the original content context and reactive JSX while releasing its owner on close', async () => {
    switchDuration = 500
    let mounts = 0
    let cleanups = 0
    const LabelContext = createContext<() => string>()
    const [label, setLabel] = createSignal('Owned content')
    const Body = () => {
      const contextualLabel = useContext(LabelContext)!
      mounts += 1
      onCleanup(() => (cleanups += 1))
      return <NavigationMenu.Link href="#owned">{contextualLabel()}</NavigationMenu.Link>
    }
    render(() => (
      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Owned</NavigationMenu.Trigger>
            <LabelContext.Provider value={label}>
              {createComponent(NavigationMenu.Content, {
                get children() {
                  return <Body />
                },
              })}
            </LabelContext.Provider>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Other</NavigationMenu.Trigger>
            <NavigationMenu.Content>Other content</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    ))
    expect(mounts).toBe(0)
    fireEvent.click(page.getByRole('button', { name: 'Owned' }))
    const link = await page.findByRole('link', { name: 'Owned content' })
    fireEvent.click(page.getByRole('button', { name: 'Other' }))
    await page.findByText('Other content')
    setLabel('Updated content')
    expect(link.textContent).toBe('Updated content')
    expect(link.isConnected).toBe(true)
    expect(cleanups).toBe(0)
    fireEvent.click(page.getByRole('button', { name: 'Owned' }))
    expect(await page.findByRole('link', { name: 'Updated content' })).toBe(link)
    expect(mounts).toBe(1)
    fireEvent.click(page.getByRole('button', { name: 'Owned' }))
    await waitFor(() => expect(cleanups).toBe(1))
    fireEvent.click(page.getByRole('button', { name: 'Owned' }))
    expect(await page.findByRole('link', { name: 'Updated content' })).not.toBe(link)
    expect(mounts).toBe(2)
  })

  test('releases removed outgoing content without closing the active panel', async () => {
    switchDuration = 500
    const [visible, setVisible] = createSignal(true)
    const cleanup = vi.fn()
    function OutgoingLink() {
      onCleanup(cleanup)
      return <NavigationMenu.Link href="#outgoing">Outgoing link</NavigationMenu.Link>
    }
    render(() => (
      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Outgoing</NavigationMenu.Trigger>
            <Show when={visible()}>
              <NavigationMenu.Content>
                <OutgoingLink />
              </NavigationMenu.Content>
            </Show>
          </NavigationMenu.Item>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Current</NavigationMenu.Trigger>
            <NavigationMenu.Content>Current content</NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    ))
    fireEvent.click(page.getByRole('button', { name: 'Outgoing' }))
    const outgoing = await page.findByRole('link', { name: 'Outgoing link' })
    fireEvent.click(page.getByRole('button', { name: 'Current' }))
    await page.findByText('Current content')
    expect(outgoing.isConnected).toBe(true)
    setVisible(false)
    await waitFor(() => expect(outgoing.isConnected).toBe(false))
    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(page.getByRole('button', { name: 'Current' }).getAttribute('aria-expanded')).toBe('true')
    expect(page.getByText('Current content').isConnected).toBe(true)
  })

  test('closes disabled or removed parts and supports reactivation', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const [visible, setVisible] = createSignal(true)
    const [hasContent, setHasContent] = createSignal(true)
    const changes = vi.fn()
    render(() => (
      <NavigationMenu onValueChange={changes}>
        <NavigationMenu.List>
          <Show when={visible()}>
            <NavigationMenu.Item value="dynamic">
              <NavigationMenu.Trigger disabled={disabled()}>Dynamic</NavigationMenu.Trigger>
              <Show when={hasContent()}>
                <NavigationMenu.Content>
                  <NavigationMenu.Link href="#dynamic">Dynamic link</NavigationMenu.Link>
                </NavigationMenu.Content>
              </Show>
            </NavigationMenu.Item>
          </Show>
        </NavigationMenu.List>
      </NavigationMenu>
    ))
    const trigger = page.getByRole('button', { name: 'Dynamic' })
    fireEvent.click(trigger)
    await page.findByRole('link', { name: 'Dynamic link' })
    setDisabled(true)
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
    expect(changes).toHaveBeenLastCalledWith(null)
    setDisabled(false)
    expect((trigger as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(trigger)
    await page.findByRole('link', { name: 'Dynamic link' })
    setHasContent(false)
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
    setHasContent(true)
    fireEvent.click(trigger)
    await page.findByRole('link', { name: 'Dynamic link' })
    setVisible(false)
    await waitFor(() =>
      expect(document.querySelector('[data-slot="navigation-menu-positioner"] > div')).toBeNull(),
    )
    expect(changes.mock.calls).toEqual([
      ['dynamic'],
      [null],
      ['dynamic'],
      [null],
      ['dynamic'],
      [null],
    ])
  })

  test('forwards custom link props and refs, respects cancelled handlers, and optionally closes on click', async () => {
    const [href, setHref] = createSignal('#first')
    const CustomLink = (props: NavigationMenuT.LinkRenderProps) => (
      <a {...props} data-router="custom" />
    )
    let forwarded: HTMLAnchorElement | undefined
    render(() => (
      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Links</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link
                linkRender={CustomLink}
                href={href()}
                target="_blank"
                rel="noreferrer"
                ref={(element) => (forwarded = element)}
                closeOnClick
                onClick={(event) => event.preventDefault()}
              >
                Cancelled
              </NavigationMenu.Link>
              <NavigationMenu.Link href="#kept">Keep open</NavigationMenu.Link>
              <NavigationMenu.Link href="#close" closeOnClick>
                Close
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
      </NavigationMenu>
    ))
    const trigger = page.getByRole('button', { name: 'Links' })
    fireEvent.click(trigger)
    const cancelled = await page.findByRole('link', { name: 'Cancelled' })
    expect(cancelled).toBe(forwarded)
    expect(cancelled.getAttribute('data-router')).toBe('custom')
    expect(cancelled.getAttribute('target')).toBe('_blank')
    setHref('#second')
    expect(cancelled.getAttribute('href')).toBe('#second')
    fireEvent.click(cancelled)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(page.getByRole('link', { name: 'Keep open' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(page.getByRole('link', { name: 'Close' }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  test('updates the shared surface dimensions when its active content resizes and disconnects observers', async () => {
    const observations: Array<{
      callback: ResizeObserverCallback
      disconnect: ReturnType<typeof vi.fn>
    }> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
        constructor(callback: ResizeObserverCallback) {
          observations.push({ callback, disconnect: this.disconnect })
        }
      },
    )
    const _screen = render(() => <TestMenu />)
    fireEvent.click(page.getByRole('button', { name: 'Products' }))
    await page.findByRole('link', { name: 'Overview' })
    const content = document.querySelector<HTMLElement>('[data-slot="navigation-menu-content"]')!
    const panel = document.querySelector<HTMLElement>(
      '[data-slot="navigation-menu-positioner"] > div',
    )!
    const width = vi.spyOn(content, 'offsetWidth', 'get').mockReturnValue(240)
    vi.spyOn(content, 'offsetHeight', 'get').mockReturnValue(180)
    for (const observer of observations) {
      observer.callback([], {} as ResizeObserver)
    }
    expect(panel.style.width).toBe('240px')
    expect(panel.style.height).toBe('180px')
    width.mockReturnValue(320)
    for (const observer of observations) {
      observer.callback([], {} as ResizeObserver)
    }
    expect(panel.style.width).toBe('320px')
    _screen.unmount()
    expect(observations.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true)
  })

  test('inherits family theme overrides while keeping part overrides local', async () => {
    const [styles, setStyles] = createSignal<NavigationMenuT.Styles>({})
    const theme = defineTheme({
      navigationMenu: {
        base: {
          trigger: 'custom-trigger',
          content: 'custom-content',
          link: 'custom-link',
          '--mo-anim-ease': 'ease-in-out',
        },
      },
    })
    render(() => (
      <MoraineProvider theme={theme}>
        <TestMenu classes={{ content: 'family-content' }} styles={styles()} />
      </MoraineProvider>
    ))
    const trigger = page.getByRole('button', { name: 'Products' })
    expect(trigger.classList.contains('custom-trigger')).toBe(true)
    fireEvent.click(trigger)
    const link = await page.findByRole('link', { name: 'Overview' })
    expect(link.classList.contains('custom-link')).toBe(true)
    expect(
      link.closest('[data-slot="navigation-menu-content"]')?.classList.contains('family-content'),
    ).toBe(true)
    expect(
      document
        .querySelector('[data-slot="navigation-menu-content"]')
        ?.classList.contains('custom-content'),
    ).toBe(true)
    const content = link.closest<HTMLElement>('[data-slot="navigation-menu-content"]')!
    expect(content.style.getPropertyValue('--mo-anim-ease')).toBe('ease-in-out')
    setStyles({ content: { '--mo-anim-ease': 'linear' } })
    expect(content.style.getPropertyValue('--mo-anim-ease')).toBe('linear')
    setStyles({})
    expect(content.style.getPropertyValue('--mo-anim-ease')).toBe('ease-in-out')
  })
})
