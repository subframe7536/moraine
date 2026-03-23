import { A, Route, Router } from '@solidjs/router'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
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

  test('does not render built-in loading icon', () => {
    const screen = render(() => <Button loading>Saving</Button>)

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).toBeNull()
  })

  test('supports function children with loading state', () => {
    const screen = render(() => (
      <Button loading>{({ loading }) => (loading ? 'Saving' : 'Save')}</Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button.textContent).toBe('Saving')
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
    expect(leading?.className).toContain('animate-loading')
  })

  test('keeps trailing content visible when loading', () => {
    const screen = render(() => (
      <Button loading trailing={<span data-testid="trailing-icon">T</span>}>
        Saving
      </Button>
    ))

    const button = screen.getByRole('button')
    const leadingSlot = button.querySelector('[data-slot="leading"]')

    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('data-loading')).toBe(true)
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('trailing-icon')).not.toBeNull()
    expect(leadingSlot).toBeNull()
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

  test('updates function children during auto loading lifecycle', async () => {
    const deferred = createDeferred()
    const onclick = vi.fn(() => deferred.promise)
    const screen = render(() => (
      <Button loadingAuto onClick={onclick}>
        {({ loading }) => (loading ? 'Submitting' : 'Submit')}
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button.textContent).toBe('Submit')

    await fireEvent.click(button)

    await waitFor(() => {
      expect(button.textContent).toBe('Submitting')
    })

    deferred.resolve()

    await waitFor(() => {
      expect(button.textContent).toBe('Submit')
    })
  })

  test('does not auto load for synchronous onclick handler', async () => {
    const onclick = vi.fn(() => 'ok')
    const screen = render(() => (
      <Button loadingAuto onclick={onclick}>
        Sync
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Sync' })
    await fireEvent.click(button)

    expect(onclick).toHaveBeenCalledTimes(1)
    expect(button.hasAttribute('data-loading')).toBe(false)
    expect(button.hasAttribute('aria-busy')).toBe(false)
  })

  test('does not invoke click handler when disabled and loading', async () => {
    const onclick = vi.fn()
    const screen = render(() => (
      <Button disabled loading onclick={onclick}>
        Busy
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Busy' })
    await fireEvent.click(button)

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(onclick).not.toHaveBeenCalled()
  })
})
