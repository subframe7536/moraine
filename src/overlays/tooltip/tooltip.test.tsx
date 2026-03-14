import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Tooltip } from './tooltip'
import type { TooltipProps } from './tooltip'

describe('Tooltip', () => {
  test('renders text content when open is controlled', () => {
    render(() => (
      <Tooltip open text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(document.body.querySelector('[role=tooltip]')!.textContent).toContain('Tooltip content')
  })

  test('keeps trigger wrapper out of tab order', () => {
    render(() => (
      <Tooltip text="Tooltip content">
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
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
    expect(document.body.querySelectorAll('[data-slot="kbds"]').length).toBe(1)
  })

  test('applies classes.content to content slot', () => {
    render(() => (
      <Tooltip open text="Tooltip content" classes={{ content: 'content-override' }}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]')
    expect(content?.className).toContain('content-override')
  })

  test('renders tooltip container when no text or kbds are provided', () => {
    render(() => (
      <Tooltip open>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[role=tooltip]')

    expect(content).not.toBeNull()
    expect(content?.textContent).toBe('')
  })

  test('does not render content when disabled', () => {
    const screen = render(() => (
      <Tooltip open text="Tooltip content" disabled>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  test('requires children in type contract', () => {
    // @ts-expect-error children is required
    const props: TooltipProps = { open: true, text: 'Tooltip content' }
    expect(props).toBeDefined()
  })

  test('applies styles override to content', () => {
    render(() => (
      <Tooltip open text="Styled" styles={{ content: { width: '200px' } } as any}>
        <button type="button">Trigger</button>
      </Tooltip>
    ))

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement | null
    expect(content?.style.width).toBe('200px')
  })
})
