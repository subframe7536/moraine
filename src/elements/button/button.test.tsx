import { A, Route, Router } from '@solidjs/router'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
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

  test('keeps the structural root when an arbitrary component prop is passed', () => {
    const screen = render(() => <Button component="a">Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button.tagName).toBe('BUTTON')
    expect(screen.queryByRole('link', { name: 'Save' })).toBeNull()
  })

  test('calls pointer handlers without replacing internal interaction behavior', async () => {
    const onPointerDown = vi.fn()
    const screen = render(() => (
      <Button data-slot="save" data-testid="save" onPointerDown={onPointerDown}>
        Save
      </Button>
    ))
    const button = screen.getByTestId('save')

    fireEvent.pointerDown(button)

    expect(onPointerDown).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('data-slot')).toBe('save')
  })

  test('forwards pointer completion, cancellation, leave, and context-menu handlers', async () => {
    const handlers = {
      onContextMenu: vi.fn(),
      onPointerCancel: vi.fn(),
      onPointerLeave: vi.fn(),
      onPointerUp: vi.fn(),
    }
    const screen = render(() => <Button {...handlers}>Events</Button>)
    const button = screen.getByRole('button', { name: 'Events' })

    fireEvent.pointerUp(button)
    fireEvent.pointerCancel(button)
    fireEvent.pointerLeave(button)
    fireEvent.contextMenu(button)

    expect(handlers.onPointerUp).toHaveBeenCalledTimes(1)
    expect(handlers.onPointerCancel).toHaveBeenCalledTimes(1)
    expect(handlers.onPointerLeave).toHaveBeenCalledTimes(1)
    expect(handlers.onContextMenu).toHaveBeenCalledTimes(1)
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

    fireEvent.click(screen.getByRole('link', { name: 'Docs' }))

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

  test.each([
    ['sm', 'i-lucide-arrow-left', 'i-lucide-arrow-right'],
    ['lg', 'i-lucide-chevron-left', 'i-lucide-chevron-right'],
  ] as const)(
    'renders leading and trailing icon slots for %s size',
    (size, leadingIcon, trailingIcon) => {
      const screen = render(() => (
        <Button size={size} leading={leadingIcon} trailing={trailingIcon}>
          Label
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Label' })
      const leading = button.querySelector('[data-slot="leading"]')
      const trailing = button.querySelector('[data-slot="trailing"]')

      expect(leading).not.toBeNull()
      expect(trailing).not.toBeNull()
      expect(leading?.className).toContain(leadingIcon)
      expect(trailing?.className).toContain(trailingIcon)
    },
  )

  test.each([
    ['xs', 'text-xs', 'h-6'],
    ['xl', 'text-lg', 'h-11'],
    ['icon-xs', 'text-xs', 'size-6'],
    ['icon-xl', 'text-lg', 'size-11'],
  ] as const)('applies %s size classes', (size, textClass, dimensionClass) => {
    const screen = render(() => (
      <Button size={size} aria-label={`${size} button`}>
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: `${size} button` })

    expect(button.className).toContain(textClass)
    expect(button.className).toContain(dimensionClass)
  })

  test('renders leading icon slot for icon-lg size', () => {
    const screen = render(() => (
      <Button size="icon-lg" leading="i-lucide-star" aria-label="Icon LG" />
    ))

    const button = screen.getByRole('button', { name: 'Icon LG' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-star')
  })

  test('keeps icon-only buttons named by the caller and hides the glyph', () => {
    const screen = render(() => (
      <Button size="icon-md" leading="i-lucide-search" aria-label="Search" />
    ))
    const button = screen.getByRole('button', { name: 'Search' })

    expect(button.querySelector('[data-slot="label"]')).toBeNull()
    expect(button.querySelector('[data-slot="leading"]')?.getAttribute('aria-hidden')).toBe('true')
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

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector<HTMLElement>('[data-slot="leading"]')
    const label = button.querySelector<HTMLElement>('[data-slot="label"]')
    const trailing = button.querySelector<HTMLElement>('[data-slot="trailing"]')

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

  test('renders zero as label content', () => {
    const screen = render(() => <Button>{0}</Button>)
    const button = screen.getByRole('button', { name: '0' })

    expect(button.querySelector('[data-slot="label"]')?.textContent).toBe('0')
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
    fireEvent.click(button)

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

  test('suppresses repeated activation while an automatic action is pending', async () => {
    const deferred = createDeferred()
    const onClick = vi.fn(() => deferred.promise)
    const screen = render(() => (
      <Button loadingAuto onClick={onClick}>
        Submit once
      </Button>
    ))
    const button = screen.getByRole('button', { name: 'Submit once' })

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(button.hasAttribute('disabled')).toBe(true)

    deferred.resolve()
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
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

    fireEvent.click(button)

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
    fireEvent.click(button)

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
    fireEvent.click(button)

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

      fireEvent.keyDown(button, { key: 'Enter' })

      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('activates on Space keyup for div with role=button without scrolling', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      const keyDown = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      button.dispatchEvent(keyDown)

      expect(keyDown.defaultPrevented).toBe(true)
      expect(onclick).not.toHaveBeenCalled()

      fireEvent.keyUp(button, { key: ' ' })
      expect(onclick).toHaveBeenCalledTimes(1)
    })

    test('does not activate Space keyup without an eligible keydown', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))
      const button = screen.getByRole('button', { name: 'Click me' })

      fireEvent.keyUp(button, { key: ' ' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('preserves keyboard modifiers on the dispatched click', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))
      const button = screen.getByRole('button', { name: 'Click me' })

      fireEvent.keyDown(button, { key: 'Enter', shiftKey: true, metaKey: true })

      expect(onclick).toHaveBeenCalledTimes(1)
      expect(onclick.mock.calls[0]?.[0]).toMatchObject({ shiftKey: true, metaKey: true, detail: 0 })
    })

    test('ignores keyboard events bubbling from nested interactive content', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          <span data-testid="nested">Nested</span>
        </Button>
      ))

      fireEvent.keyDown(screen.getByTestId('nested'), { key: 'Enter' })
      fireEvent.keyDown(screen.getByTestId('nested'), { key: ' ' })
      fireEvent.keyUp(screen.getByTestId('nested'), { key: ' ' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('does not activate on other keys for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" onClick={onclick}>
          Click me
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Click me' })

      fireEvent.keyDown(button, { key: 'a' })
      fireEvent.keyDown(button, { key: 'Escape' })
      fireEvent.keyDown(button, { key: 'Tab' })

      expect(onclick).not.toHaveBeenCalled()
    })

    test('blocks keyboard and pointer interactions and removes tabIndex when disabled for non-native button', async () => {
      const onclick = vi.fn()
      const onpointerdown = vi.fn()
      const screen = render(() => (
        <Button as="div" disabled onClick={onclick} onPointerDown={onpointerdown}>
          Disabled
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Disabled' })
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.hasAttribute('tabIndex')).toBe(false)

      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.click(button)

      const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
      button.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(true)
      expect(onclick).not.toHaveBeenCalled()
      expect(onpointerdown).not.toHaveBeenCalled()
    })

    test('blocks keyboard and click interactions and removes tabIndex when loading for non-native button', async () => {
      const onclick = vi.fn()
      const screen = render(() => (
        <Button as="div" loading onClick={onclick}>
          Loading
        </Button>
      ))

      const button = screen.getByRole('button', { name: 'Loading' })
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.getAttribute('aria-busy')).toBe('true')
      expect(button.hasAttribute('tabIndex')).toBe(false)

      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.click(button)

      expect(onclick).not.toHaveBeenCalled()
    })

    test('suppresses native-root handlers after becoming disabled', () => {
      const onkeydown = vi.fn()
      const onpointerdown = vi.fn()
      const screen = render(() => (
        <Button disabled onKeyDown={onkeydown} onPointerDown={onpointerdown}>
          Disabled
        </Button>
      ))
      const button = screen.getByRole('button', { name: 'Disabled' })

      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

      expect(onkeydown).not.toHaveBeenCalled()
      expect(onpointerdown).not.toHaveBeenCalled()
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

      fireEvent.keyDown(button, { key: 'Enter' })

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

      fireEvent.keyDown(button, { key: 'Enter' })

      expect(onkeydown).toHaveBeenCalledTimes(1)
      expect(onclick).not.toHaveBeenCalled()
    })

    test('prevents Space activation when keydown or keyup is canceled', async () => {
      const onClickFromKeyDown = vi.fn()
      const keyDownScreen = render(() => (
        <Button
          as="div"
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          onClick={onClickFromKeyDown}
        >
          Keydown canceled
        </Button>
      ))
      const keyDownButton = keyDownScreen.getByRole('button', { name: 'Keydown canceled' })

      fireEvent.keyDown(keyDownButton, { key: ' ' })
      fireEvent.keyUp(keyDownButton, { key: ' ' })
      expect(onClickFromKeyDown).not.toHaveBeenCalled()

      const onClickFromKeyUp = vi.fn()
      const keyUpScreen = render(() => (
        <Button
          as="div"
          onKeyUp={(event: KeyboardEvent) => event.preventDefault()}
          onClick={onClickFromKeyUp}
        >
          Keyup canceled
        </Button>
      ))
      const keyUpButton = keyUpScreen.getByRole('button', { name: 'Keyup canceled' })

      fireEvent.keyDown(keyUpButton, { key: ' ' })
      fireEvent.keyUp(keyUpButton, { key: ' ' })
      expect(onClickFromKeyUp).not.toHaveBeenCalled()
    })

    test('calls the keyup handler before Space activation', async () => {
      const order: Array<string> = []
      const screen = render(() => (
        <Button as="div" onKeyUp={() => order.push('keyup')} onClick={() => order.push('click')}>
          Ordered
        </Button>
      ))
      const button = screen.getByRole('button', { name: 'Ordered' })

      fireEvent.keyDown(button, { key: ' ' })
      fireEvent.keyUp(button, { key: ' ' })

      expect(order).toEqual(['keyup', 'click'])
    })
  })

  test('applies non-native button semantics to a custom component without href', async () => {
    const CustomRoot = (props: JSX.HTMLAttributes<HTMLSpanElement>) => <span {...props} />
    const onclick = vi.fn()
    const screen = render(() => (
      <Button as={CustomRoot} onClick={onclick}>
        Custom
      </Button>
    ))
    const button = screen.getByRole('button', { name: 'Custom' })

    expect(button.tagName).toBe('SPAN')
    expect(button.getAttribute('tabindex')).toBe('0')
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onclick).toHaveBeenCalledTimes(1)
  })

  test('updates native and non-native semantics when the root tag changes', () => {
    const [tag, setTag] = createSignal<'button' | 'div'>('button')
    const screen = render(() => <Button as={tag()}>Reactive root</Button>)

    expect(screen.getByRole('button', { name: 'Reactive root' }).tagName).toBe('BUTTON')

    setTag('div')
    const root = screen.getByRole('button', { name: 'Reactive root' })
    expect(root.tagName).toBe('DIV')
    expect(root.getAttribute('tabindex')).toBe('0')
    expect(root.hasAttribute('disabled')).toBe(false)
  })

  test('preserves caller role and tab order on an enabled non-native root', () => {
    const screen = render(() => (
      <Button as="div" role="menuitem" tabIndex={-1}>
        Menu action
      </Button>
    ))
    const button = screen.getByRole('menuitem', { name: 'Menu action' })

    expect(button.getAttribute('tabindex')).toBe('-1')
  })

  test.each([undefined, ''] as const)(
    'keeps anchor href=%s link semantics without Space activation',
    async (href) => {
      const onClick = vi.fn()
      const screen = render(() => (
        <Button as="a" href={href} onClick={onClick}>
          Link semantics
        </Button>
      ))
      const root = screen.container.querySelector('[data-slot="root"]')!

      if (href === undefined) {
        expect(root.getAttribute('role')).toBe('button')
        return
      }

      expect(root.getAttribute('role')).toBeNull()
      const keyDown = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      root.dispatchEvent(keyDown)
      fireEvent.keyUp(root, { key: ' ' })

      expect(keyDown.defaultPrevented).toBe(false)
      expect(onClick).not.toHaveBeenCalled()
    },
  )

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

      fireEvent.keyDown(button, { key: 'Enter' })

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

      fireEvent.click(anchor)

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

      fireEvent.click(anchor)

      expect(onclick).not.toHaveBeenCalled()
    })
  })
})
