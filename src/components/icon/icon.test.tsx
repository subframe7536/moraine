import { render } from '@solidjs/testing-library'
import { createSignal, onCleanup } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Icon } from './icon'
import type { IconProps } from './icon.types'

describe('Icon', () => {
  test('renders a css icon class for string names', () => {
    const screen = render(() => <Icon name="i-lucide-search" />)
    const icon = screen.container.querySelector('.i-lucide-search')

    expect(icon).not.toBeNull()
    expect(icon?.className).toContain('i-lucide-search')
  })

  test('renders no data-slot unless the caller passes one', () => {
    const plain = render(() => <Icon name="i-lucide-search" />)
    expect(plain.container.firstElementChild?.hasAttribute('data-slot')).toBe(false)

    const slotted = render(() => <Icon name="i-lucide-search" data-slot="button-leading" />)
    expect(slotted.container.firstElementChild?.getAttribute('data-slot')).toBe('button-leading')
  })

  test('opts out of forced colors and follows the parent color in forced colors mode', () => {
    const screen = render(() => <Icon name="i-lucide-search" />)
    const icon = screen.container.querySelector('.i-lucide-search')

    expect(icon?.classList).toContain('icon-mask')
  })

  test('keeps default forced colors behavior for element and component icons', () => {
    const Glyph = (props: Omit<IconProps, 'name'>) => (
      <svg data-testid="glyph" class={props.class as string} />
    )
    const screen = render(() => (
      <>
        <Icon name={<span>X</span>} data-testid="element" />
        <Icon name={Glyph} />
      </>
    ))

    expect(screen.getByTestId('element').classList).not.toContain('icon-mask')
    expect(screen.getByTestId('glyph').getAttribute('class') ?? '').not.toContain('icon-mask')
  })

  test('inherits font size', () => {
    const screen = render(() => (
      <div style={{ 'font-size': '18px' }}>
        <Icon name="i-lucide-search" />
      </div>
    ))
    const icon = screen.container.querySelector<HTMLElement>('.i-lucide-search')

    expect(icon).not.toBeNull()
    expect(icon?.style.fontSize).toBe('')
    expect(getComputedStyle(icon!).fontSize).toBe('18px')
  })

  test('renders element icons inside an attribute-owning wrapper', () => {
    const screen = render(() => <Icon name={<span data-testid="custom-icon">X</span>} />)

    expect(screen.getByTestId('custom-icon').textContent).toBe('X')
    expect(screen.getByTestId('custom-icon').parentElement).toBe(screen.container.firstElementChild)
  })

  test('preserves a zero-argument component and its cleanup while its JSX updates', () => {
    const [label, setLabel] = createSignal('Before')
    let mounts = 0
    let cleanups = 0
    const Glyph = () => {
      mounts += 1
      onCleanup(() => {
        cleanups += 1
      })
      return <span>{label()}</span>
    }
    const screen = render(() => <Icon name={Glyph} />)
    const glyph = screen.getByText('Before')
    setLabel('After')
    expect(screen.getByText('After')).toBe(glyph)
    expect([mounts, cleanups]).toEqual([1, 0])
    screen.unmount()
    expect(cleanups).toBe(1)
  })

  test('mounts attributes and slots on the outer host span for component icons', () => {
    const [label, setLabel] = createSignal('Before')
    const [size, setSize] = createSignal('18px')
    const Glyph = (props: Record<string, unknown>) => (
      <svg data-testid="glyph" data-prop-count={Object.keys(props).length} />
    )
    const screen = render(() => (
      <Icon
        name={Glyph}
        aria-label={label()}
        style={{ 'font-size': size() }}
        class="glyph"
        title="Status"
      />
    ))
    const host = screen.getByRole('img', { name: 'Before' })
    const glyph = screen.getByTestId('glyph')

    expect(host.tagName).toBe('SPAN')
    expect(glyph.parentElement).toBe(host)
    // The component is rendered without props, so nothing is mounted twice.
    expect(glyph.getAttribute('data-prop-count')).toBe('0')
    expect(glyph.hasAttribute('class')).toBe(false)
    expect(host.getAttribute('class')).toContain('glyph')
    expect(host.getAttribute('title')).toBe('Status')
    expect(host.style.fontSize).toBe('18px')
    setSize('24px')
    expect(host.style.fontSize).toBe('24px')
    setLabel('After')
    expect(screen.getByRole('img', { name: 'After' })).toBe(host)
    expect(screen.getByTestId('glyph')).toBe(glyph)
  })

  test('keeps data-slot and class for a zero-argument component that ignores props', () => {
    const screen = render(() => (
      <Icon name={() => <svg data-testid="glyph" />} data-slot="custom-leading" class="custom" />
    ))
    const host = screen.getByTestId('glyph').parentElement!

    expect(host.getAttribute('data-slot')).toBe('custom-leading')
    expect(host.className).toContain('custom')
  })

  test('sizes graphic sources as a 1.2em host and leaves mask sizing to the icon class', () => {
    const screen = render(() => (
      <>
        <Icon name="i-lucide-search" data-testid="mask" />
        <Icon name={<svg data-testid="element" />} />
        <Icon name={() => <svg data-testid="component" />} class="size-6" />
      </>
    ))
    const mask = screen.getByTestId('mask')
    const elementHost = screen.getByTestId('element').parentElement!
    const componentHost = screen.getByTestId('component').parentElement!

    expect(mask.className).toBe('block icon-mask i-lucide-search')
    expect(elementHost.className).toContain('size-[1.2em]')
    expect(elementHost.className).toContain('*:size-full')
    expect(elementHost.classList).not.toContain('icon-mask')
    // The host takes the caller size; the graphic fills it through `*:size-full`.
    expect(componentHost.className).toContain('size-6')
    expect(componentHost.className).not.toContain('size-[1.2em]')
    expect(componentHost.className).toContain('*:size-full')
  })

  test('switches the host classes when name changes between a string and a graphic', () => {
    const [name, setName] = createSignal<IconProps['name']>('i-lucide-search')
    const screen = render(() => <Icon name={name()} data-testid="icon" />)
    const host = screen.getByTestId('icon')

    expect(host.classList).toContain('icon-mask')
    setName(<svg />)
    expect(screen.getByTestId('icon')).toBe(host)
    expect(host.classList).not.toContain('icon-mask')
    expect(host.classList).not.toContain('i-lucide-search')
    expect(host.className).toContain('size-[1.2em]')
  })

  test('passes through HTML attributes to the span element', () => {
    const screen = render(() => (
      <Icon name="i-lucide-search" id="my-icon" data-testid="icon-el" title="Search icon" />
    ))
    const icon = screen.container.querySelector<HTMLElement>('.i-lucide-search')

    expect(icon).not.toBeNull()
    expect(icon?.id).toBe('my-icon')
    expect(icon?.getAttribute('data-testid')).toBe('icon-el')
    expect(icon?.title).toBe('Search icon')
  })

  test('hides decorative string and raw JSX icons from the accessibility tree', () => {
    const screen1 = render(() => <Icon name="i-lucide-search" />)
    const icon1 = screen1.container.querySelector('.i-lucide-search')
    expect(icon1?.getAttribute('aria-hidden')).toBe('true')

    const screen2 = render(() => (
      <Icon
        name={
          <svg aria-label="Raw search glyph">
            <title>Raw search glyph</title>
          </svg>
        }
      />
    ))
    const icon2 = screen2.container.firstElementChild
    expect(icon2?.getAttribute('aria-hidden')).toBe('true')
    expect(screen2.queryByRole('img', { name: 'Raw search glyph' })).toBeNull()
  })

  test('exposes labelled string and raw JSX icons as images', () => {
    const stringScreen = render(() => <Icon name="i-lucide-search" aria-label="Search" />)
    const stringIcon = stringScreen.getByRole('img', { name: 'Search' })
    expect(stringIcon.className).toContain('i-lucide-search')
    expect(stringIcon.hasAttribute('aria-hidden')).toBe(false)

    const rawScreen = render(() => (
      <Icon
        name={
          <svg data-testid="raw-svg">
            <title>Unrelated SVG title</title>
            <path d="M0 0h1" />
          </svg>
        }
        aria-label="Search"
      />
    ))
    const rawIcon = rawScreen.getByRole('img', { name: 'Search' })
    expect(rawIcon.tagName).toBe('SPAN')
    expect(rawScreen.getByTestId('raw-svg').parentElement).toBe(rawIcon)

    const labelledByScreen = render(() => (
      <>
        <span id="icon-label">Labelled search</span>
        <Icon name="i-lucide-search" aria-labelledby="icon-label" />
      </>
    ))
    expect(labelledByScreen.getByRole('img', { name: 'Labelled search' }).className).toContain(
      'i-lucide-search',
    )
  })

  test('keeps aria-hidden in sync with a reactive aria-label', () => {
    const [label, setLabel] = createSignal<string | undefined>()
    const screen = render(() => <Icon name="i-lucide-search" aria-label={label()} />)
    const icon = screen.container.querySelector('.i-lucide-search')!

    expect(icon.getAttribute('aria-hidden')).toBe('true')

    setLabel('Search')
    expect(icon.hasAttribute('aria-hidden')).toBe(false)

    setLabel(undefined)
    expect(icon.getAttribute('aria-hidden')).toBe('true')
  })

  test('allows an explicit aria-hidden override', () => {
    const screen = render(() => <Icon name="i-lucide-search" aria-hidden={false} />)
    const icon = screen.container.querySelector('.i-lucide-search')

    expect(icon?.getAttribute('aria-hidden')).toBe('false')
  })

  test('preserves caller-supplied roles and raw SVG labels when explicitly exposed', () => {
    const roleScreen = render(() => (
      <Icon name="i-lucide-search" aria-label="Search" role="status" />
    ))
    expect(roleScreen.getByRole('status').getAttribute('aria-label')).toBe('Search')

    const svgScreen = render(() => (
      <Icon
        name={
          <svg aria-label="Custom SVG label" role="img">
            <path d="M0 0h1" />
          </svg>
        }
        aria-hidden={false}
      />
    ))
    expect(svgScreen.getByRole('img', { name: 'Custom SVG label' })).not.toBeNull()
    expect(svgScreen.container.firstElementChild?.getAttribute('aria-hidden')).toBe('false')
  })

  test('applies slot overrides without leaking style props to the DOM', () => {
    const screen = render(() => (
      <Icon
        name="i-lucide-search"
        classes={{ root: 'slot-class' }}
        styles={{ root: { height: '18px', color: 'blue' } }}
        class="native-class"
        style={{ width: '20px', color: 'red' }}
      />
    ))
    const icon = screen.container.querySelector<HTMLElement>('.i-lucide-search')!

    expect(icon.className).toContain('slot-class')
    expect(icon.className).toContain('native-class')
    expect(icon.style.height).toBe('18px')
    expect(icon.style.width).toBe('20px')
    expect(icon.style.color).toBe('red')
    expect(icon.hasAttribute('classes')).toBe(false)
    expect(icon.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the icon', () => {
    const [design, setDesign] = createSignal(defineTheme({ icon: { base: { root: 'p-2' } } }))
    const screen = render(() => (
      <MoraineProvider theme={design()}>
        <Icon name="i-lucide-search" />
      </MoraineProvider>
    ))
    const icon = screen.container.querySelector<HTMLElement>('.i-lucide-search')!

    expect(icon.className).toContain('p-2')

    setDesign(defineTheme({ icon: { base: { root: 'p-4' } } }))

    expect(screen.container.querySelector('.i-lucide-search')).toBe(icon)
    expect(icon.className).toContain('p-4')
    expect(icon.className).not.toContain('p-2')
  })
})
