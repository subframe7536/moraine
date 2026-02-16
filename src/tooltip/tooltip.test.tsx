import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Tooltip } from './tooltip'

describe('Tooltip', () => {
  test('renders text content when open is controlled', () => {
    const screen = render(() => (
      <Tooltip open portal={false} text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.getByRole('tooltip').textContent).toContain('Tooltip content')
  })

  test('renders keyboard hints', () => {
    const screen = render(() => (
      <Tooltip open portal={false} text="Save" kbds={['Ctrl', 'S']}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const kbds = screen.container.querySelectorAll('[data-slot="kbd"]')
    expect(kbds.length).toBe(2)
    expect(kbds.item(0)?.textContent).toBe('Ctrl')
    expect(kbds.item(1)?.textContent).toBe('S')
  })

  test('maps classes.root to content slot', () => {
    const screen = render(() => (
      <Tooltip open portal={false} text="Tooltip content" classes={{ root: 'root-override' }}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = screen.container.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('root-override')
  })

  test('renders arrow when enabled', () => {
    const screen = render(() => (
      <Tooltip open portal={false} text="With arrow" arrow>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.container.querySelector('[data-slot="arrow"]')).not.toBeNull()
  })

  test('uses portal by default', () => {
    const screen = render(() => (
      <Tooltip open text="Portal content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
  })

  test('does not render content when no text or kbds are provided', () => {
    const screen = render(() => (
      <Tooltip open portal={false}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
