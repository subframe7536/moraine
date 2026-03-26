import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { beforeEach, describe, expect, test, vi } from 'vitest'

let getMockPlacement: () => string = () => 'top'
let setMockPlacement: (value: string) => void = () => undefined

vi.mock('@kobalte/core/popper', async () => {
  const actual = await vi.importActual<typeof import('@kobalte/core/popper')>(
    '@kobalte/core/popper',
  )

  return {
    ...actual,
    usePopperContext: () => ({
      currentPlacement: () => getMockPlacement(),
      contentRef: () => undefined,
      setPositionerRef: () => undefined,
      setArrowRef: () => undefined,
    }),
  }
})

import { Tooltip } from './tooltip'
import type { TooltipProps } from './tooltip'

describe('Tooltip', () => {
  beforeEach(() => {
    const [placement, setPlacement] = createSignal('top')
    getMockPlacement = placement
    setMockPlacement = setPlacement
  })

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

  test('uses runtime placement to resolve side-aware animation classes', () => {
    const [version, setVersion] = createSignal(0)

    render(() => {
      version()

      return (
        <Tooltip open side="top" text="Tooltip content">
          <button type="button">Trigger</button>
        </Tooltip>
      )
    })

    const initialContent = document.body.querySelector('[data-slot="content"]')
    expect(initialContent?.className).toContain('data-expanded:animate-tooltip-in-from-bottom')
    expect(initialContent?.className).toContain('data-closed:animate-tooltip-out-to-bottom')
    expect(initialContent?.className).not.toContain('data-expanded:animate-tooltip-in-from-top')

    setMockPlacement('bottom')
    setVersion(1)

    const updatedContent = document.body.querySelector('[data-slot="content"]')
    expect(updatedContent?.className).toContain('data-expanded:animate-tooltip-in-from-top')
    expect(updatedContent?.className).toContain('data-closed:animate-tooltip-out-to-top')
    expect(updatedContent?.className).not.toContain('data-expanded:animate-tooltip-in-from-bottom')
  })
})
