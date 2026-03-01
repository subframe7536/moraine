import { A, Route, Router } from '@solidjs/router'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { FieldGroup } from '../field-group'

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
    expect(button.className).toContain('h-8')
  })

  test('inherits size from field-group when size is not provided', () => {
    const screen = render(() => (
      <FieldGroup size="xl">
        <Button>Group Button</Button>
      </FieldGroup>
    ))

    const button = screen.getByRole('button', { name: 'Group Button' })
    expect(button.className).toContain('h-11')
  })

  test('applies xs icon slot classes for leading and trailing', () => {
    const screen = render(() => (
      <Button size="xs" leading={<span>L</span>} trailing={<span>T</span>}>
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'LLabelT' })
    const leading = button.querySelector('[data-slot="leading"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('text-xs')
    expect(trailing?.className).toContain('text-xs')
  })

  test('applies xl icon slot classes for leading and trailing', () => {
    const screen = render(() => (
      <Button size="xl" leading={<span>L</span>} trailing={<span>T</span>}>
        Label
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'LLabelT' })
    const leading = button.querySelector('[data-slot="leading"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('text-base')
    expect(trailing?.className).toContain('text-base')
  })

  test('applies icon-xl icon slot class', () => {
    const screen = render(() => (
      <Button size="icon-xl" leading={<span>L</span>} aria-label="Icon XL" />
    ))

    const button = screen.getByRole('button', { name: 'Icon XL' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading?.className).toContain('text-lg')
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
        leading={<span>L</span>}
        trailing={<span>T</span>}
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

    const button = screen.getByRole('button', { name: 'LLabelT' })
    const leading = button.querySelector('[data-slot="leading"]')
    const label = button.querySelector('[data-slot="label"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('leading-override')
    expect(label?.className).toContain('label-override')
    expect(trailing?.className).toContain('trailing-override')
    expect(button.className).toContain('root-override')
  })

  test('applies loading slot class override while loading', () => {
    const screen = render(() => (
      <Button
        loading
        loadingIcon={<span data-testid="loading-icon">L</span>}
        classes={{ loading: 'loading-override', leading: 'leading-override' }}
      >
        Loading
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Loading' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading?.className).toContain('loading-override')
    expect(leading?.className).toContain('leading-override')
    expect(screen.queryByTestId('loading-icon')).not.toBeNull()
  })

  test('does not render built-in loading icon', () => {
    const screen = render(() => <Button loading>Saving</Button>)

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).toBeNull()
  })

  test('renders loadingIcon when loading', () => {
    const screen = render(() => (
      <Button loading loadingIcon={<span data-testid="loading-icon">L</span>}>
        Saving
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(screen.queryByTestId('loading-icon')).not.toBeNull()
    expect(leading?.className).toContain('flex items-center')
  })

  test('hides trailing content when loading', () => {
    const screen = render(() => (
      <Button loading trailing={<span data-testid="trailing-icon">T</span>}>
        Saving
      </Button>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const leadingSlot = button.querySelector('[data-slot="leading"]')

    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('data-loading')).toBe(true)
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(screen.queryByTestId('trailing-icon')).toBeNull()
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
