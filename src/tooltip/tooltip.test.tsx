import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Tooltip } from './tooltip'

describe('Tooltip', () => {
  test('renders text content when open is controlled', () => {
    render(() => (
      <Tooltip open text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(document.body.querySelector('[role=tooltip]')!.textContent).toContain('Tooltip content')
  })

  test('renders keyboard hints', () => {
    render(() => (
      <Tooltip open text="Save" kbds={['Ctrl', 'S']}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const kbds = document.body.querySelectorAll('[data-slot="kbd"]')
    expect(kbds.length).toBe(2)
    expect(kbds.item(0)?.textContent).toBe('Ctrl')
    expect(kbds.item(1)?.textContent).toBe('S')
  })

  test('maps classes.root to content slot', () => {
    render(() => (
      <Tooltip open text="Tooltip content" classes={{ root: 'root-override' }}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('root-override')
  })

  test('renders arrow when enabled', () => {
    render(() => (
      <Tooltip open text="With arrow" arrow>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(document.body.querySelector('[data-slot="arrow"]')).not.toBeNull()
  })

  test('does not render content when no text or kbds are provided', () => {
    const screen = render(() => (
      <Tooltip open>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
