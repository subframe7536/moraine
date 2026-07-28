// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENTAL — Tests for BadgeExperimental using splitProps + rest forwarding.
// Verifies: business props work, rest attrs land on DOM, no prop leakage.
// ═══════════════════════════════════════════════════════════════════════════════

import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { BadgeExperimental } from './badge-experimental'

describe('BadgeExperimental', () => {
  // ── Business props (parity with existing Badge) ─────────────────────────

  test('renders default badge semantics and label', () => {
    const screen = render(() => <BadgeExperimental>New</BadgeExperimental>)
    const badge = screen.container.querySelector('[data-slot="root"]')
    const label = screen.container.querySelector('[data-slot="label"]')

    expect(badge?.tagName).toBe('SPAN')
    expect(badge?.getAttribute('data-variant')).toBe('default')
    expect(badge?.getAttribute('data-size')).toBe('md')
    expect(label?.textContent).toBe('New')
  })

  test('supports hiding decorative badges from the accessibility tree', () => {
    const screen = render(() => <BadgeExperimental aria-hidden>2</BadgeExperimental>)
    const badge = screen.container.querySelector('[data-slot="root"]')

    expect(badge?.getAttribute('aria-hidden')).toBe('true')
  })

  test('applies variant and size classes', () => {
    const solid = render(() => (
      <BadgeExperimental variant="solid" size="lg">
        Solid
      </BadgeExperimental>
    ))
    const outline = render(() => (
      <BadgeExperimental variant="outline" size="sm">
        Outline
      </BadgeExperimental>
    ))

    expect(solid.container.querySelector('[data-slot="root"]')?.className).toContain('bg-primary')
    expect(outline.container.querySelector('[data-slot="root"]')?.className).toContain(
      'surface-border',
    )
  })

  test('renders leading and trailing icon slots', () => {
    const screen = render(() => (
      <BadgeExperimental leading="i-lucide-sparkles" trailing="i-lucide-arrow-right">
        Label
      </BadgeExperimental>
    ))

    const leading = screen.container.querySelector('[data-slot="leading"]')
    const trailing = screen.container.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('i-lucide-sparkles')
    expect(trailing?.className).toContain('i-lucide-arrow-right')
  })

  test('renders clickable trailing button and calls onTrailingClick', async () => {
    const onTrailingClick = vi.fn()
    const screen = render(() => (
      <BadgeExperimental trailing="i-lucide-x" onTrailingClick={onTrailingClick}>
        Removable
      </BadgeExperimental>
    ))

    const trailingButton = screen.container.querySelector('[data-slot="trailing"]')
    expect(trailingButton?.tagName).toBe('BUTTON')

    await fireEvent.click(trailingButton!)
    expect(onTrailingClick).toHaveBeenCalledTimes(1)
  })

  test('supports slot and attribute overrides used by select tags', () => {
    const screen = render(() => (
      <BadgeExperimental
        slotName="tag"
        trailing="i-lucide-x"
        onTrailingClick={() => undefined}
        classes={{
          root: 'root-override',
          label: 'label-override',
          trailing: 'trailing-override',
        }}
      >
        Tag
      </BadgeExperimental>
    ))

    const tag = screen.container.querySelector('[data-slot="tag"]')
    const label = screen.container.querySelector('[data-slot="label"]')
    const remove = screen.container.querySelector('[data-slot="trailing"]')

    expect(tag?.className).toContain('root-override')
    expect(label?.className).toContain('label-override')
    expect(remove?.className).toContain('trailing-override')
  })

  test('supports style overrides', () => {
    const screen = render(() => (
      <BadgeExperimental
        slotName="tag"
        trailing="i-lucide-x"
        onTrailingClick={() => undefined}
        styles={{
          root: { width: '200px' },
          label: { width: '200px' },
          trailing: { width: '200px' },
        }}
      >
        Tag
      </BadgeExperimental>
    ))

    const tag = screen.container.querySelector('[data-slot="tag"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null
    const remove = screen.container.querySelector('[data-slot="trailing"]') as HTMLElement | null

    expect(tag?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
    expect(remove?.style.width).toBe('200px')
  })

  // ── NEW: rest forwarding — HTML attributes land on root element ──────────

  test('forwards id via rest onto root span', () => {
    const screen = render(() => <BadgeExperimental id="badge-42">Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('id')).toBe('badge-42')
  })

  test('forwards data-* attributes via rest onto root span', () => {
    const screen = render(() => (
      <BadgeExperimental data-testid="my-badge" data-tracking="abc123">
        Test
      </BadgeExperimental>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('data-testid')).toBe('my-badge')
    expect(root?.getAttribute('data-tracking')).toBe('abc123')
  })

  test('forwards aria-* attributes via rest onto root span', () => {
    const screen = render(() => (
      <BadgeExperimental aria-label="Status badge" aria-live="polite">
        Test
      </BadgeExperimental>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('aria-label')).toBe('Status badge')
    expect(root?.getAttribute('aria-live')).toBe('polite')
  })

  test('forwards onClick handler via rest onto root span', async () => {
    const onClick = vi.fn()
    const screen = render(() => <BadgeExperimental onClick={onClick}>Clickable</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')!

    await fireEvent.click(root)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('forwards onKeyDown handler via rest onto root span', async () => {
    const onKeyDown = vi.fn()
    const screen = render(() => <BadgeExperimental onKeyDown={onKeyDown}>Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')!

    await fireEvent.keyDown(root, { key: 'Enter' })
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  test('forwards tabIndex via rest onto root span', () => {
    const screen = render(() => <BadgeExperimental tabIndex={0}>Focusable</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('tabindex')).toBe('0')
  })

  test('forwards hidden via rest onto root span', () => {
    const screen = render(() => <BadgeExperimental hidden>Hidden</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('hidden')).toBe(true)
  })

  test('forwards role via rest onto root span', () => {
    const screen = render(() => <BadgeExperimental role="status">Status</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('role')).toBe('status')
  })

  test('forwards ref via rest onto root span', () => {
    let refEl: HTMLElement | null = null
    const screen = render(() => (
      <BadgeExperimental
        ref={(el) => {
          refEl = el
        }}
      >
        Ref
      </BadgeExperimental>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(refEl).toBe(root)
  })

  test('forwards title via rest onto root span (separate from business title prop)', () => {
    // `title` is in both business Base props AND splitProps — it's split into local.
    // The business `title` already works (tested via aria-hidden/title in parity tests).
    // This verifies title reaches the DOM.
    const screen = render(() => <BadgeExperimental title="Hover text">Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('title')).toBe('Hover text')
  })

  // ── No leakage: business props do NOT appear as DOM attributes ───────────

  test('does not leak variant onto DOM', () => {
    const screen = render(() => <BadgeExperimental variant="solid">Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('variant')).toBe(false)
  })

  test('does not leak size onto DOM', () => {
    const screen = render(() => <BadgeExperimental size="lg">Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('size')).toBe(false)
  })

  test('does not leak leading onto DOM', () => {
    const screen = render(() => <BadgeExperimental leading="i-lucide-home">Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('leading')).toBe(false)
  })

  test('does not leak classes onto DOM', () => {
    const screen = render(() => (
      <BadgeExperimental classes={{ root: 'foo' }}>Test</BadgeExperimental>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('classes')).toBe(false)
  })

  test('does not leak children onto DOM', () => {
    const screen = render(() => <BadgeExperimental>Test</BadgeExperimental>)
    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.hasAttribute('children')).toBe(false)
  })

  // ── Combined: business props + rest attrs together ──────────────────────

  test('combines business props with rest HTML attrs on root', async () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <BadgeExperimental
        variant="outline"
        size="sm"
        leading="i-lucide-info"
        id="combo-badge"
        data-testid="combo"
        aria-label="Info"
        tabIndex={0}
        onClick={onClick}
      >
        Combined
      </BadgeExperimental>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')!
    const label = screen.container.querySelector('[data-slot="label"]')!

    // Business props
    expect(root.getAttribute('data-variant')).toBe('outline')
    expect(root.getAttribute('data-size')).toBe('sm')
    expect(label.textContent).toBe('Combined')
    expect(screen.container.querySelector('[data-slot="leading"]')).toBeTruthy()

    // Rest HTML attrs
    expect(root.getAttribute('id')).toBe('combo-badge')
    expect(root.getAttribute('data-testid')).toBe('combo')
    expect(root.getAttribute('aria-label')).toBe('Info')
    expect(root.getAttribute('tabindex')).toBe('0')

    // Event handler via rest
    await fireEvent.click(root)
    expect(onClick).toHaveBeenCalledTimes(1)

    // No leakage
    expect(root.hasAttribute('variant')).toBe(false)
    expect(root.hasAttribute('leading')).toBe(false)
  })
})
