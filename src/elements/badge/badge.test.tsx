import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Badge as ExportedBadge } from '../../index'

import { Badge } from './badge'

describe('Badge', () => {
  test('renders default badge semantics and label', () => {
    const screen = render(() => <Badge>New</Badge>)
    const badge = screen.container.querySelector('[data-slot="badge"]')
    const label = screen.container.querySelector('[data-slot="label"]')

    expect(badge?.tagName).toBe('SPAN')
    expect(badge?.getAttribute('data-variant')).toBe('default')
    expect(badge?.getAttribute('data-size')).toBe('md')
    expect(label?.textContent).toBe('New')
  })

  test('applies variant and size classes', () => {
    const solid = render(() => (
      <Badge variant="solid" size="lg">
        Solid
      </Badge>
    ))
    const outline = render(() => (
      <Badge variant="outline" size="sm">
        Outline
      </Badge>
    ))

    expect(solid.container.querySelector('[data-slot="badge"]')?.className).toContain('bg-primary')
    expect(outline.container.querySelector('[data-slot="badge"]')?.className).toContain(
      'ring-border',
    )
  })

  test('renders leading and trailing icon slots', () => {
    const screen = render(() => (
      <Badge leading="i-lucide-sparkles" trailing="i-lucide-arrow-right">
        Label
      </Badge>
    ))

    const leading = screen.container.querySelector('[data-slot="leading"]')
    const trailing = screen.container.querySelector('[data-slot="trailing"]')

    expect(leading?.className).toContain('i-lucide-sparkles')
    expect(trailing?.className).toContain('i-lucide-arrow-right')
  })

  test('renders clickable trailing button and calls onTrailingClick', async () => {
    const onTrailingClick = vi.fn()
    const screen = render(() => (
      <Badge trailing="i-lucide-x" onTrailingClick={onTrailingClick}>
        Removable
      </Badge>
    ))

    const trailingButton = screen.container.querySelector('[data-slot="trailing"]')
    expect(trailingButton?.tagName).toBe('BUTTON')

    await fireEvent.click(trailingButton!)
    expect(onTrailingClick).toHaveBeenCalledTimes(1)
  })

  test('supports slot and attribute overrides used by select tags', () => {
    const screen = render(() => (
      <Badge
        data-slot="tag"
        trailing="i-lucide-x"
        onTrailingClick={() => undefined}
        classes={{
          base: 'base-override',
          label: 'label-override',
          trailing: 'trailing-override',
        }}
      >
        Tag
      </Badge>
    ))

    const tag = screen.container.querySelector('[data-slot="tag"]')
    const label = screen.container.querySelector('[data-slot="label"]')
    const remove = screen.container.querySelector('[data-slot="trailing"]')

    expect(tag?.className).toContain('base-override')
    expect(label?.className).toContain('label-override')
    expect(remove?.className).toContain('trailing-override')
  })

  test('exports badge from root index', () => {
    expect(ExportedBadge).toBe(Badge)
  })
})
