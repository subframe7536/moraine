import { A, Route, Router } from '@solidjs/router'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from './button'

function createDeferred() {
  let resolve: (() => void) | undefined
  const promise = new Promise<void>((r) => {
    resolve = r
  })

  return {
    promise,
    resolve: () => {
      resolve?.()
    },
  }
}

describe('Button', () => {
  test('defaults to native button semantics', () => {
    const screen = render(() => <Button>Button</Button>)
    const button = screen.getByRole('button', { name: 'Button' })

    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('data-slot')).toBe('root')
  })

  test('calls pointer handlers without replacing internal interaction behavior', async () => {
    const onPointerDown = vi.fn()
    const screen = render(() => (
      <Button data-slot="save" data-testid="save" onPointerDown={onPointerDown}>
        Save
      </Button>
    ))
    const button = screen.getByTestId('save')

    await fireEvent.pointerDown(button)

    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('data-slot')).toBe('save')
  })

  test('supports anchor rendering via as prop', () => {
    const screen = render(() => (
      <Button as="a" href="https://example.com">
        Docs
      </Button>
    ))

    const anchor = screen.getByRole('link', { name: 'Docs' })
    expect(anchor.hasAttribute('type')).toBe(false)
    expect(anchor.hasAttribute('role')).toBe(false)
  })

  test('supports tuple click handlers on polymorphic roots', async () => {
    const onClick = vi.fn((_data: string, _event: MouseEvent) => undefined)
    const screen = render(() => (
      <Button as="a" href="https://example.com" onClick={[onClick, 'payload']}>
        Docs
      </Button>
    ))

    await fireEvent.click(screen.getByRole('link', { name: 'Docs' }))

    expect(onClick).toHaveBeenCalledWith('payload', expect.any(MouseEvent))
  })

  test('supports as={A} from solid router', () => {
    const screen = render(() => (
      <Router url="/">
        <Route
          path="/"
          component={() => (
            <Button as={A} href="/docs">
              Docs
            </Button>
          )}
        />
      </Router>
    ))

    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link.getAttribute('href')).toBe('/docs')
    expect(link.hasAttribute('type')).toBe(false)
  })

  test('applies variant and size classes', () => {
    const screen = render(() => (
      <Button variant="destructive" size="sm">
        Delete
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button.className).toContain('bg-destructive')
    expect(button.className).toContain('h-7')
  })

  test('applies press interaction classes', () => {
    const screen = render(() => <Button>Press</Button>)
    const button = screen.getByRole('button', { name: 'Press' })

    expect(button.className).toContain('transition-all')
    expect(button.className).toContain('hover:bg-primary-hover')
    expect(button.className).toContain('active:bg-primary-active')
    expect(button.className).toContain('[&:active:not([aria-haspopup])]:translate-y-px')
  })

  test.each(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const)(
    'does not apply a built-in shadow to the %s variant',
    (variant) => {
      const screen = render(() => <Button variant={variant}>{variant}</Button>)
      const button = screen.getByRole('button', { name: variant })

      expect(
        button.className.split(' ').some((className) => /(?:^|:)shadow(?:-|$)/.test(className)),
      ).toBe(false)
    },
  )

  test('renders leading and trailing icon slots for xs size', () => {
    const screen = render(() => (
      <Button size="xs" leading="i-lucide-arrow-left" trailing="i-lucide-arrow-right">
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector('[data-slot="leading"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading).not.toBeNull()
    expect(trailing).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-arrow-left')
    expect(trailing?.className).toContain('i-lucide-arrow-right')
  })

  test('renders leading and trailing icon slots for xl size', () => {
    const screen = render(() => (
      <Button size="xl" leading="i-lucide-chevron-left" trailing="i-lucide-chevron-right">
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector('[data-slot="leading"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading).not.toBeNull()
    expect(trailing).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-chevron-left')
    expect(trailing?.className).toContain('i-lucide-chevron-right')
  })

  test('renders leading icon slot for icon-xl size', () => {
    const screen = render(() => (
      <Button size="icon-xl" leading="i-lucide-star" aria-label="Icon XL" />
    ))

    const button = screen.getByRole('button', { name: 'Icon XL' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-star')
  })

  test('renders leading and trailing content in normal state', () => {
    const screen = render(() => (
      <Button
        leading={<span data-testid="leading-icon">L</span>}
        trailing={<span data-testid="trailing-icon">T</span>}
      >
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'LLabelT' })
    expect(screen.queryByTestId('leading-icon')).not.toBeNull()
    expect(screen.queryByTestId('trailing-icon')).not.toBeNull()
    expect(button.textContent).toBe('LLabelT')
  })

  test('merges classes overrides into slots', () => {
    const screen = render(() => (
      <Button
        leading="i-lucide-menu"
        trailing="i-lucide-x"
        classes={{
          root: 'root-override',
          leading: 'leading-override',
          label: 'label-override',
          trailing: 'trailing-override',
        }}
      >
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector('[data-slot="leading"]')
    const label = button.querySelector('[data-slot="label"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('leading-override')
    expect(label?.className).toContain('label-override')
    expect(trailing?.className).toContain('trailing-override')
    expect(button.className).toContain('root-override')
  })

  test('merges styles overrides into slots', () => {
    const screen = render(() => (
      <Button
        leading="i-lucide-menu"
        trailing="i-lucide-x"
        styles={{
          root: { width: '200px' },
          leading: { width: '200px' },
          label: { width: '200px' },
          trailing: { width: '200px' },
        }}
      >
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Label' }) as HTMLElement
    const leading = button.querySelector('[data-slot="leading"]') as HTMLElement | null
    const label = button.querySelector('[data-slot="label"]') as HTMLElement | null
    const trailing = button.querySelector('[data-slot="trailing"]') as HTMLElement | null

    expect(leading?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
    expect(trailing?.style.width).toBe('200px')
    expect(button.style.width).toBe('200px')
  })

  test('applies loading slot class override while loading', () => {
    const screen = render(() => (
      <Button
        loading
        loadingIcon="i-lucide-loader-circle"
        classes={{ loading: 'loading-override', leading: 'leading-override' }}
      >
        Loading
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Loading' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading?.className).toContain('loading-override')
    expect(leading?.className).toContain('leading-override')
    expect(leading?.className).toContain('i-lucide-loader-circle')
  })

  test('renders built-in loading icon by default when loading', () => {
    const screen = render(() => <Button loading>Saving</Button>)

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('icon-loading')
    expect(leading?.className).toContain('effect-loading')
  })

  test('supports component children with loading state', () => {
    const screen = render(() => (
      <Button loading>
        {(props) => (
          <Show when={props.loading} fallback="Save">
            Saving
          </Show>
        )}
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button.textContent).toBe('Saving')
  })

  test('resolves getter-backed JSX children once', () => {
    let reads = 0
    const screen = render(() =>
      createComponent(Button, {
        get children() {
          reads += 1
          return <span>Resolved once</span>
        },
      }),
    )

    expect(reads).toBe(1)
    expect(screen.getByRole('button', { name: 'Resolved once' })).not.toBeNull()
  })

  test('resolves reactive JSX accessors without treating them as render components', async () => {
    const [visible, setVisible] = createSignal(true)
    const screen = render(() => (
      <Button>
        <Show when={visible()}>Reactive label</Show>
      </Button>
    ))

    expect(screen.getByRole('button', { name: 'Reactive label' })).not.toBeNull()

    setVisible(false)

    await waitFor(() => {
      expect(screen.getByRole('button').querySelector('[data-slot="label"]')).toBeNull()
    })
  })

  test('omits the label slot when component children resolve to a falsy value', () => {
    const screen = render(() => <Button>{() => false}</Button>)
    const button = screen.getByRole('button')

    expect(button.querySelector('[data-slot="label"]')).toBeNull()
  })

  test('renders loadingIcon when loading', () => {
    const screen = render(() => (
      <Button loading loadingIcon="i-lucide-loader-circle">
        Saving
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-loader-circle')
    expect(leading?.className).toContain('effect-loading')
  })

  test('uses loading icon in trailing slot when only trailing is provided', () => {
    const screen = render(() => (
      <Button loading trailing={<span data-testid="trailing-icon">T</span>}>
        Saving
      </Button>
    ))

    const button = screen.getByRole('button')
    const leadingSlot = button.querySelector('[data-slot="leading"]')
    const trailingSlot = button.querySelector('[data-slot="trailing"]')

    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('data-loading')).toBe(true)
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('trailing-icon')).toBeNull()
    expect(leadingSlot).toBeNull()
    expect(trailingSlot).not.toBeNull()
    expect(trailingSlot?.className).toContain('icon-loading')
    expect(trailingSlot?.className).toContain('effect-loading')
  })

  test('keeps trailing content when loading if leading and trailing are both provided', () => {
    const screen = render(() => (
      <Button
        loading
        leading={<span data-testid="leading-icon">L</span>}
        trailing={<span data-testid="trailing-icon">T</span>}
      >
        Saving
      </Button>
    ))

    const button = screen.getByRole('button')
    const leadingSlot = button.querySelector('[data-slot="leading"]')

    expect(screen.queryByTestId('leading-icon')).toBeNull()
    expect(screen.queryByTestId('trailing-icon')).not.toBeNull()
    expect(leadingSlot?.className).toContain('icon-loading')
    expect(leadingSlot?.className).toContain('effect-loading')
  })

  test('applies loading class override when trailing slot is replaced by loading icon', () => {
    const screen = render(() => (
      <Button
        loading
        trailing="i-lucide:timer"
        classes={{ loading: 'loading-override', trailing: 'trailing-override' }}
      >
        Saving
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(trailing).not.toBeNull()
    expect(trailing?.className).toContain('icon-loading')
    expect(trailing?.className).toContain('effect-loading')
    expect(trailing?.className).toContain('loading-override')
    expect(trailing?.className).toContain('trailing-override')
  })

  test('auto loading follows async onclick lifecycle', async () => {
    const deferred = createDeferred()
    const onclick = vi.fn(() => deferred.promise)
    const screen = render(() => (
      <Button loadingAuto onClick={onclick}>
        Submit
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Submit' })
    await fireEvent.click(button)

    expect(onclick).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(button.hasAttribute('data-loading')).toBe(true)
      expect(button.getAttribute('aria-busy')).toBe('true')
    })

    deferred.resolve()

    await waitFor(() => {
      expect(button.hasAttribute('data-loading')).toBe(false)
      expect(button.hasAttribute('aria-busy')).toBe(false)
    })
  })

  test('updates component children during auto loading lifecycle', async () => {
    const deferred = createDeferred()
    const onclick = vi.fn(() => deferred.promise)
    const children = vi.fn((props: { loading: boolean }) => (
      <Show when={props.loading} fallback="Submit">
        Submitting
      </Show>
    ))
    const screen = render(() => (
      <Button loadingAuto onClick={onclick}>
        {children}
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button.textContent).toBe('Submit')
    expect(children).toHaveBeenCalledTimes(1)

    await fireEvent.click(button)

    await waitFor(() => {
      expect(button.textContent).toBe('Submitting')
    })
    expect(children).toHaveBeenCalledTimes(1)

    deferred.resolve()

    await waitFor(() => {
      expect(button.textContent).toBe('Submit')
    })
    expect(children).toHaveBeenCalledTimes(1)
  })

  test('does not auto load for synchronous onclick handler', async () => {
    const onClick = vi.fn(() => 'ok')
    const screen = render(() => (
      <Button loadingAuto onClick={onClick}>
        Sync
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Sync' })
    await fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button.hasAttribute('data-loading')).toBe(false)
    expect(button.hasAttribute('aria-busy')).toBe(false)
  })

  test('does not invoke click handler when disabled and loading', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <Button disabled loading onClick={onClick}>
        Busy
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Busy' })
    await fireEvent.click(button)

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(onClick).not.toHaveBeenCalled()
  })

  describe('non-native button keyboard activation', () => {
    test('activates on Enter key for div with role=button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button.tagName).toBe('DIV')
      expect(button.getAttribute('role')).toBe('button')
      expect(button.getAttribute('tabIndex')).toBe('0')

      await fireEvent.keyDown(button, { key: 'Enter' })

      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('activates on Space key for div with role=button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      await fireEvent.keyDown(button, { key: ' ' })

      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('does not activate on other keys for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      await fireEvent.keyDown(button, { key: 'a' })
      await fireEvent.keyDown(button, { key: 'Escape' })
      await fireEvent.keyDown(button, { key: 'Tab' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks Enter key when disabled for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" disabled onClick={onclick}>
          Disabled
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button.getAttribute('aria-disabled')).toBe('true')

      await fireEvent.keyDown(button, { key: 'Enter' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks Space key when loading for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" loading onClick={onclick}>
          Loading
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Loading' })
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.getAttribute('aria-busy')).toBe('true')

      await fireEvent.keyDown(button, { key: ' ' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks click when disabled for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" disabled onClick={onclick}>
          Disabled
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Disabled' })

      await fireEvent.click(button)

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks click when loading for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" loading onClick={onclick}>
          Loading
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Loading' })

      await fireEvent.click(button)

      expect(onclick).not.toHaveBeenCalled()
    })

    test('prevents default pointer action when disabled for non-native button', async () => {
      const onpointerdown = vi.fn((e: PointerEvent) => {
        // The handler is called, but default should be prevented
        expect(e.defaultPrevented).toBe(true)
      })
      const screen = render(() => (
        <Button as="div" disabled onPointerDown={onpointerdown}>
          Disabled
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Disabled' })

      await fireEvent.pointerDown(button)

      expect(onpointerdown).toHaveBeenCalledTimes(1)
    })

    test('removes tabIndex when disabled for non-native button', () => {
      const screen = render(() => (
        <Button as="div" disabled>
          Disabled
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button.hasAttribute('tabIndex')).toBe(false)
    })

    test('removes tabIndex when loading for non-native button', () => {
      const screen = render(() => (
        <Button as="div" loading>
          Loading
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Loading' })
      expect(button.hasAttribute('tabIndex')).toBe(false)
    })

    test('calls custom onKeyDown handler before activation', async () => {
      const onkeydown = vi.fn()
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onKeyDown={onkeydown} onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      await fireEvent.keyDown(button, { key: 'Enter' })

      expect(onkeydown).toHaveBeenCalledTimes(1)
      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('prevents activation when custom onKeyDown calls preventDefault', async () => {
      const onkeydown = vi.fn((e: KeyboardEvent) => e.preventDefault())
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onKeyDown={onkeydown} onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      await fireEvent.keyDown(button, { key: 'Enter' })

      expect(onkeydown).toHaveBeenCalledTimes(1)
      expect(onclick).not.toHaveBeenCalled()
    })
  })

  describe('anchor rendering compatibility', () => {
    test('does not emit type attribute on anchor', () => {
      const screen = render(() => (
        <Button as="a" href="https://example.com">
          Link
        </Button>
      ))

      const anchor = screen.getByRole('link', { name: 'Link' })
      expect(anchor.hasAttribute('type')).toBe(false)
      expect(anchor.hasAttribute('role')).toBe(false)
      expect(anchor.hasAttribute('tabIndex')).toBe(false)
    })

    test('does not emit disabled attribute on anchor', () => {
      const screen = render(() => (
        <Button as="a" href="https://example.com" disabled>
          Disabled Link
        </Button>
      ))

      const anchor = screen.getByRole('link', { name: 'Disabled Link' })
      expect(anchor.hasAttribute('disabled')).toBe(false)
      expect(anchor.getAttribute('aria-disabled')).toBe('true')
    })

    test('anchor without href gets button role and keyboard activation', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="a" onClick={onclick}>
          Button-like anchor
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Button-like anchor' })
      expect(button.tagName).toBe('A')
      expect(button.getAttribute('role')).toBe('button')
      expect(button.getAttribute('tabIndex')).toBe('0')

      await fireEvent.keyDown(button, { key: 'Enter' })

      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('blocks anchor click when disabled', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="a" href="https://example.com" disabled onClick={onclick}>
          Disabled Link
        </Button>
      ))

      const anchor = screen.getByRole('link', { name: 'Disabled Link' })

      await fireEvent.click(anchor)

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks anchor click when loading', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="a" href="https://example.com" loading onClick={onclick}>
          Loading Link
        </Button>
      ))

      const anchor = screen.getByRole('link', { name: 'Loading Link' })

      await fireEvent.click(anchor)

      expect(onclick).not.toHaveBeenCalled()
    })
  })
})
