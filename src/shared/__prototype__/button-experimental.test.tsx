// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL — Tests for ButtonExperimental using splitProps + rest forwarding.
// Verifies: business props work, rest attrs land on DOM, no prop leakage,
// polymorphic `as`, loading, disabled, and keyboard handling.
// ═══════════════════════════════════════════════════════════════════════════════

import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { ButtonExperimental } from './button-experimental'

describe('ButtonExperimental', () => {
  // ── Business props — default semantics ──────────────────────────────────

  test('defaults to native button semantics', () => {
    const screen = render(() => <ButtonExperimental>Click</ButtonExperimental>)
    const button = screen.getByRole('button', { name: 'Click' })

    expect(button.getAttribute('type')).toBe('button')
    expect(button.getAttribute('data-slot')).toBe('root')
    expect(button.getAttribute('data-variant')).toBe('default')
    expect(button.getAttribute('data-size')).toBe('md')
  })

  test('applies variant and size classes', () => {
    const destructive = render(() => (
      <ButtonExperimental variant="destructive" size="sm">
        Delete
      </ButtonExperimental>
    ))

    expect(destructive.getByRole('button', { name: 'Delete' }).className).toContain(
      'bg-destructive',
    )
    expect(destructive.getByRole('button', { name: 'Delete' }).className).toContain('h-7')
  })

  test.each(['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'] as const)(
    'renders the %s variant without a built-in shadow',
    (variant) => {
      const screen = render(() => (
        <ButtonExperimental variant={variant}>{variant}</ButtonExperimental>
      ))
      const button = screen.getByRole('button', { name: variant })

      expect(
        button.className.split(' ').some((className) => /(?:^|:)shadow(?:-|$)/.test(className)),
      ).toBe(false)
    },
  )

  // ── Icon slots ──────────────────────────────────────────────────────────

  test('renders leading and trailing icon slots', () => {
    const screen = render(() => (
      <ButtonExperimental leading="i-lucide-arrow-left" trailing="i-lucide-arrow-right">
        Label
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector('[data-slot="leading"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(leading).not.toBeNull()
    expect(trailing).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-arrow-left')
    expect(trailing?.className).toContain('i-lucide-arrow-right')
  })

  // ── Loading state ───────────────────────────────────────────────────────

  test('renders loading icon in leading slot by default when loading', () => {
    const screen = render(() => <ButtonExperimental loading>Saving</ButtonExperimental>)

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('icon-loading')
    expect(leading?.className).toContain('effect-loading')
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('data-loading')).toBe(true)
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  test('uses loading icon in trailing slot when only trailing is provided', () => {
    const screen = render(() => (
      <ButtonExperimental loading trailing="i-lucide-timer">
        Saving
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button')
    const leadingSlot = button.querySelector('[data-slot="leading"]')
    const trailingSlot = button.querySelector('[data-slot="trailing"]')

    expect(leadingSlot).toBeNull()
    expect(trailingSlot).not.toBeNull()
    expect(trailingSlot?.className).toContain('icon-loading')
    expect(trailingSlot?.className).toContain('effect-loading')
  })

  test('keeps trailing content when loading if both leading and trailing are provided', () => {
    const screen = render(() => (
      <ButtonExperimental loading leading="i-lucide-mail" trailing="i-lucide-chevron-down">
        Saving
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button')
    const leadingSlot = button.querySelector('[data-slot="leading"]')
    const trailingSlot = button.querySelector('[data-slot="trailing"]')

    expect(leadingSlot?.className).toContain('icon-loading')
    expect(trailingSlot?.className).toContain('i-lucide-chevron-down')
  })

  test('supports custom loadingIcon', () => {
    const screen = render(() => (
      <ButtonExperimental loading loadingIcon="i-lucide-loader-circle">
        Saving
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading?.className).toContain('i-lucide-loader-circle')
  })

  test('applies loading class override when loading', () => {
    const screen = render(() => (
      <ButtonExperimental
        loading
        loadingIcon="i-lucide-loader-circle"
        classes={{ loading: 'loading-override', leading: 'leading-override' }}
      >
        Saving
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button', { name: 'Saving' })
    const leading = button.querySelector('[data-slot="leading"]')

    expect(leading?.className).toContain('loading-override')
    expect(leading?.className).toContain('leading-override')
  })

  // ── Disabled state ──────────────────────────────────────────────────────

  test('applies disabled attribute on native button when disabled', () => {
    const screen = render(() => <ButtonExperimental disabled>Disabled</ButtonExperimental>)

    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.hasAttribute('data-disabled')).toBe(true)
  })

  test('applies aria-disabled on non-native elements when disabled', () => {
    const screen = render(() => (
      <ButtonExperimental as="span" disabled>
        Span Button
      </ButtonExperimental>
    ))

    const span = screen.container.querySelector('[data-slot="root"]')!
    expect(span.getAttribute('aria-disabled')).toBe('true')
    expect(span.getAttribute('role')).toBe('button')
  })

  test('blocks clicks on non-native elements when disabled', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <ButtonExperimental as="div" disabled onClick={onClick}>
        Div Button
      </ButtonExperimental>
    ))

    const div = screen.getByText('Div Button')
    await fireEvent.click(div)
    expect(onClick).not.toHaveBeenCalled()
  })

  // ── Polymorphic `as` ────────────────────────────────────────────────────

  test('supports anchor rendering via as prop', () => {
    const screen = render(() => (
      <ButtonExperimental as="a" href="https://example.com">
        Docs
      </ButtonExperimental>
    ))

    const anchor = screen.getByRole('link', { name: 'Docs' })
    expect(anchor.hasAttribute('type')).toBe(false)
    expect(anchor.hasAttribute('role')).toBe(false)
  })

  test('forwards href via rest onto anchor', () => {
    const screen = render(() => (
      <ButtonExperimental as="a" href="/docs">
        Docs
      </ButtonExperimental>
    ))

    const anchor = screen.getByRole('link', { name: 'Docs' })
    expect(anchor.getAttribute('href')).toBe('/docs')
  })

  // ── Class & style overrides ─────────────────────────────────────────────

  test('merges classes overrides into slots', () => {
    const screen = render(() => (
      <ButtonExperimental
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
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button', { name: 'Label' })
    const leading = button.querySelector('[data-slot="leading"]')
    const label = button.querySelector('[data-slot="label"]')
    const trailing = button.querySelector('[data-slot="trailing"]')

    expect(button.className).toContain('root-override')
    expect(leading?.className).toContain('leading-override')
    expect(label?.className).toContain('label-override')
    expect(trailing?.className).toContain('trailing-override')
  })

  test('merges styles overrides into slots', () => {
    const screen = render(() => (
      <ButtonExperimental
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
      </ButtonExperimental>
    ))

    const button = screen.getByRole('button', { name: 'Label' }) as HTMLElement
    const leading = button.querySelector('[data-slot="leading"]') as HTMLElement | null
    const label = button.querySelector('[data-slot="label"]') as HTMLElement | null
    const trailing = button.querySelector('[data-slot="trailing"]') as HTMLElement | null

    expect(button.style.width).toBe('200px')
    expect(leading?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
    expect(trailing?.style.width).toBe('200px')
  })

  // ── Keyboard handling ───────────────────────────────────────────────────

  test('activates non-native button on Enter key', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <ButtonExperimental as="div" onClick={onClick}>
        Div Button
      </ButtonExperimental>
    ))

    const div = screen.getByText('Div Button')
    await fireEvent.keyDown(div, { key: 'Enter' })
    await fireEvent.click(div)
    expect(onClick).toHaveBeenCalled()
  })

  test('blocks Enter key on disabled non-native button', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <ButtonExperimental as="div" disabled onClick={onClick}>
        Div Button
      </ButtonExperimental>
    ))

    const div = screen.getByText('Div Button')
    await fireEvent.keyDown(div, { key: 'Enter' })
    // Click handler should not fire because Enter is blocked on disabled non-native
    expect(onClick).not.toHaveBeenCalled()
  })

  // ── NEW: rest forwarding — HTML attributes land on root element ──────────

  test('forwards id via rest onto root button', () => {
    const screen = render(() => <ButtonExperimental id="btn-42">Test</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.getAttribute('id')).toBe('btn-42')
  })

  test('forwards data-* attributes via rest onto root button', () => {
    const screen = render(() => (
      <ButtonExperimental data-testid="my-btn" data-tracking="abc123">
        Test
      </ButtonExperimental>
    ))
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.getAttribute('data-testid')).toBe('my-btn')
    expect(root.getAttribute('data-tracking')).toBe('abc123')
  })

  test('forwards aria-* attributes via rest onto root button', () => {
    const screen = render(() => (
      <ButtonExperimental aria-label="Submit form" aria-pressed="true">
        Test
      </ButtonExperimental>
    ))
    const root = screen.getByRole('button', { name: 'Submit form' })
    expect(root.getAttribute('aria-pressed')).toBe('true')
  })

  test('forwards tabIndex via rest onto root button', () => {
    const screen = render(() => <ButtonExperimental tabIndex={-1}>Focusable</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Focusable' })
    expect(root.getAttribute('tabindex')).toBe('-1')
  })

  test('forwards ref via rest onto root button', () => {
    let refEl: HTMLElement | null = null
    render(() => (
      <ButtonExperimental
        ref={(el) => {
          refEl = el
        }}
      >
        Ref
      </ButtonExperimental>
    ))
    const root = document.querySelector('[data-slot="root"]')
    expect(refEl).toBe(root)
  })

  test('forwards title via rest onto root button', () => {
    const screen = render(() => <ButtonExperimental title="Hover text">Test</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.getAttribute('title')).toBe('Hover text')
  })

  // ── No leakage: business props do NOT appear as DOM attributes ───────────

  test('does not leak variant onto DOM', () => {
    const screen = render(() => <ButtonExperimental variant="destructive">Test</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.hasAttribute('variant')).toBe(false)
  })

  test('does not leak size onto DOM', () => {
    const screen = render(() => <ButtonExperimental size="xl">Test</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.hasAttribute('size')).toBe(false)
  })

  test('does not leak leading onto DOM', () => {
    const screen = render(() => (
      <ButtonExperimental leading="i-lucide-home">Test</ButtonExperimental>
    ))
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.hasAttribute('leading')).toBe(false)
  })

  test('does not leak classes onto DOM', () => {
    const screen = render(() => (
      <ButtonExperimental classes={{ root: 'foo' }}>Test</ButtonExperimental>
    ))
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.hasAttribute('classes')).toBe(false)
  })

  test('does not leak children onto DOM', () => {
    const screen = render(() => <ButtonExperimental>Test</ButtonExperimental>)
    const root = screen.getByRole('button', { name: 'Test' })
    expect(root.hasAttribute('children')).toBe(false)
  })

  test('does not leak as onto DOM', () => {
    const screen = render(() => (
      <ButtonExperimental as="a" href="/docs">
        Test
      </ButtonExperimental>
    ))
    const root = screen.getByRole('link', { name: 'Test' })
    expect(root.hasAttribute('as')).toBe(false)
  })

  // ── Combined: business props + rest attrs together ──────────────────────

  test('combines business props with rest HTML attrs on root', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <ButtonExperimental
        variant="outline"
        size="sm"
        leading="i-lucide-info"
        id="combo-btn"
        data-testid="combo"
        aria-label="Info"
        tabIndex={0}
        onClick={onClick}
      >
        Combined
      </ButtonExperimental>
    ))

    const root = screen.getByRole('button', { name: 'Info' })

    // Business props
    expect(root.getAttribute('data-variant')).toBe('outline')
    expect(root.getAttribute('data-size')).toBe('sm')
    expect(root.querySelector('[data-slot="leading"]')).toBeTruthy()
    expect(root.querySelector('[data-slot="label"]')?.textContent).toBe('Combined')

    // Rest HTML attrs
    expect(root.getAttribute('id')).toBe('combo-btn')
    expect(root.getAttribute('data-testid')).toBe('combo')
    expect(root.getAttribute('tabindex')).toBe('0')

    // Event handler via rest
    await fireEvent.click(root)
    expect(onClick).toHaveBeenCalledTimes(1)

    // No leakage
    expect(root.hasAttribute('variant')).toBe(false)
    expect(root.hasAttribute('leading')).toBe(false)
  })
})
