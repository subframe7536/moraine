import { render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Separator as ExportedSeparator } from '../../index.ts'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Separator } from './separator.tsx'

describe('Separator', () => {
  test('renders default root semantics and horizontal orientation', () => {
    const screen = render(() => <Separator />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const borders = screen.container.querySelectorAll('[data-slot="border"]')

    expect(root?.tagName).toBe('DIV')
    expect(root?.getAttribute('data-orientation')).toBe('horizontal')
    expect(root?.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.className).toContain('flex-row')
    expect(root?.className).toContain('text-border')
    expect(borders.length).toBe(1)
    expect(borders[0]?.className).toContain('b-t')
  })

  test('updates orientation semantics and classes reactively', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => <Separator orientation={orientation()} />)
    const root = screen.getByRole('separator')
    const border = screen.container.querySelector('[data-slot="border"]')

    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('flex-row')
    expect(border?.className).toContain('b-t')

    setOrientation('vertical')

    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('flex-col')
    expect(border?.className).toContain('border-s')
  })

  test('lets caller attributes override generated separator semantics', () => {
    const screen = render(() => (
      <Separator
        decorative
        orientation="horizontal"
        role="presentation"
        aria-hidden={false}
        aria-orientation="vertical"
        data-orientation="custom"
      />
    ))
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('presentation')
    expect(root?.getAttribute('aria-hidden')).toBe('false')
    expect(root?.getAttribute('aria-orientation')).toBe('vertical')
    expect(root?.getAttribute('data-orientation')).toBe('custom')
  })

  test('remains passive and non-tabbable while forwarding caller pointer events', () => {
    const onPointerDown = vi.fn()
    const screen = render(() => <Separator onPointerDown={onPointerDown} />)
    const root = screen.getByRole('separator')
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    root.dispatchEvent(event)

    expect(root.hasAttribute('tabindex')).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })

  test('applies type variants', () => {
    const solid = render(() => <Separator type="solid" />)
    const dashed = render(() => <Separator type="dashed" />)
    const dotted = render(() => <Separator type="dotted" />)

    expect(solid.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-solid',
    )
    expect(dashed.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-dashed',
    )
    expect(dotted.container.querySelector('[data-slot="border"]')?.className).toContain(
      'border-dotted',
    )
  })

  test('applies size variants', () => {
    const xs = render(() => <Separator size="xs" />)
    const sm = render(() => <Separator size="sm" />)
    const md = render(() => <Separator size="md" />)
    const lg = render(() => <Separator size="lg" />)
    const xl = render(() => <Separator size="xl" />)

    expect(xs.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(sm.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(md.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(lg.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(xl.container.querySelector('[data-slot="border"]')?.className).toContain('b-t')
    expect(xs.container.querySelector('[data-slot="border"]')?.className).toContain('b-1')
    expect(sm.container.querySelector('[data-slot="border"]')?.className).toContain('b-2')
    expect(md.container.querySelector('[data-slot="border"]')?.className).toContain('b-3')
    expect(lg.container.querySelector('[data-slot="border"]')?.className).toContain('b-4')
    expect(xl.container.querySelector('[data-slot="border"]')?.className).toContain('b-5')
  })

  test('uses root color inheritance for border color', () => {
    const screen = render(() => <Separator classes={{ root: 'text-primary' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const border = screen.container.querySelector('[data-slot="border"]')

    expect(root?.className).toContain('text-primary')
    expect(border?.className).toContain('border-current')
    expect(border?.className).not.toContain('border-primary')
  })

  test('renders middle content through children', () => {
    const withText = render(() => <Separator>+1</Separator>)
    expect(withText.container.querySelector('[data-slot="content"]')?.textContent).toBe('+1')

    const withIconLikeNode = render(() => (
      <Separator>
        <span data-testid="icon-content">I</span>
      </Separator>
    ))
    expect(withIconLikeNode.getByTestId('icon-content').textContent).toBe('I')

    const withAvatarLikeNode = render(() => (
      <Separator>
        <span data-testid="avatar-content">A</span>
      </Separator>
    ))
    expect(withAvatarLikeNode.getByTestId('avatar-content').textContent).toBe('A')
  })

  test('renders numeric zero and single-evaluates reactive inputs', () => {
    const reads = { children: 0, orientation: 0 }
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() =>
      createComponent(Separator, {
        get children() {
          reads.children += 1
          return 0
        },
        get orientation() {
          reads.orientation += 1
          return orientation()
        },
      }),
    )

    expect(screen.container.querySelector('[data-slot="content"]')?.textContent).toBe('0')
    expect(screen.container.querySelectorAll('[data-slot="border"]')).toHaveLength(2)
    expect(reads).toEqual({ children: 1, orientation: 1 })

    setOrientation('vertical')
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')
    expect(reads).toEqual({ children: 1, orientation: 2 })
  })

  test('reactively adds and removes optional content without replacing the root', () => {
    const [content, setContent] = createSignal<false | string>(false)
    const screen = render(() => <Separator>{content()}</Separator>)
    const root = screen.getByRole('separator')

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="border"]')).toHaveLength(1)

    setContent('Label')
    expect(screen.container.querySelector('[data-slot="content"]')?.textContent).toBe('Label')
    expect(screen.container.querySelectorAll('[data-slot="border"]')).toHaveLength(2)

    setContent('')
    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="border"]')).toHaveLength(1)
    expect(screen.getByRole('separator')).toBe(root)
  })

  test.each([false, null, undefined, ''])('omits optional content for %s', (content) => {
    const screen = render(() => <Separator>{content}</Separator>)

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="border"]')).toHaveLength(1)
  })

  test('hydrates zero content without replacing or reordering separator slots', () => {
    const markup = renderSsrFixture(
      '/src/elements/separator/separator.ssr.fixture.tsx',
      'renderSeparatorFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(() => <Separator orientation={orientation()}>{0}</Separator>, container)
    const root = container.querySelector('[data-slot="root"]')!

    expect(root).toBe(serverRoot)
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'border',
      'content',
      'border',
    ])
    expect(container.querySelector('[data-slot="content"]')?.textContent).toBe('0')

    setOrientation('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'border',
      'content',
      'border',
    ])

    dispose()
    container.remove()
    restoreHydrationState()
  })

  test('decorative mode uses presentational semantics', () => {
    const screen = render(() => <Separator decorative orientation="vertical" />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('role')).toBe('separator')
    expect(root?.getAttribute('aria-hidden')).toBe('true')
  })

  test('applies classes overrides for all slots', () => {
    const withChildren = render(() => (
      <Separator
        classes={{
          root: 'root-override',
          border: 'border-override',
          content: 'content-override',
        }}
      >
        <span data-testid="middle-content">L</span>
      </Separator>
    ))

    const root = withChildren.container.querySelector('[data-slot="root"]')
    const borders = withChildren.container.querySelectorAll('[data-slot="border"]')
    const content = withChildren.container.querySelector('[data-slot="content"]')

    expect(root?.className).toContain('root-override')
    expect(borders.length).toBe(2)
    expect(borders[0]?.className).toContain('border-override')
    expect(borders[1]?.className).toContain('border-override')
    expect(content?.className).toContain('content-override')
    expect(withChildren.getByTestId('middle-content').textContent).toBe('L')
  })

  test('applies styles overrides for all slots', () => {
    const withChildren = render(() => (
      <Separator
        styles={{
          root: { width: '200px' },
          border: { width: '200px' },
          content: { width: '200px' },
        }}
      >
        <span data-testid="middle-content">L</span>
      </Separator>
    ))

    const root = withChildren.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const borders = withChildren.container.querySelectorAll('[data-slot="border"]')
    const content = withChildren.container.querySelector(
      '[data-slot="content"]',
    ) as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect((borders[0] as HTMLElement | null)?.style.width).toBe('200px')
    expect((borders[1] as HTMLElement | null)?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  test('exports separator from root index', () => {
    expect(ExportedSeparator).toBe(Separator)
  })
})
