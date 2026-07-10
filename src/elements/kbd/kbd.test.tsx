import { render, screen } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Kbd } from './kbd'
import type { KbdProps } from './kbd'
import { KbdGroup } from './kbd-group'
import type { KbdGroupProps } from './kbd-group'

describe('Kbd', () => {
  test('renders one keycap value', () => {
    const view = render(() => <Kbd value="K" />)
    const item = view.container.querySelector('[data-slot="kbd"]')

    expect(item?.tagName).toBe('KBD')
    expect(item?.textContent).toBe('K')
  })

  test('renders text before value with an accessible label', () => {
    const view = render(() => <Kbd value="Command" text="Cmd" label="Command" />)
    const item = screen.getByLabelText('Command')

    expect(item.textContent).toBe('Cmd')
    expect(view.container.querySelector('[data-slot="kbd"]')).toBe(item)
  })

  test('renders nothing without content', () => {
    const view = render(() => <Kbd />)

    expect(view.container.querySelector('[data-slot="kbd"]')).toBeNull()
  })

  test('applies size classes on kbd items: xs/sm/md/lg/xl', () => {
    const xs = render(() => <Kbd size="xs" value="X" />)
    const sm = render(() => <Kbd size="sm" value="S" />)
    const md = render(() => <Kbd size="md" value="M" />)
    const lg = render(() => <Kbd size="lg" value="L" />)
    const xl = render(() => <Kbd size="xl" value="XL" />)

    expect(xs.container.querySelector('[data-slot="kbd"]')?.className).toContain('h-3')
    expect(sm.container.querySelector('[data-slot="kbd"]')?.className).toContain('h-4')
    expect(md.container.querySelector('[data-slot="kbd"]')?.className).toContain('h-4.5')
    expect(lg.container.querySelector('[data-slot="kbd"]')?.className).toContain('h-5')
    expect(xl.container.querySelector('[data-slot="kbd"]')?.className).toContain('h-5.5')
  })

  test('rejects invalid props in type contract', () => {
    // @ts-expect-error size must be a declared Kbd size
    const invalidSizeProps: KbdProps = { size: 'invalid', value: 'K' }
    // @ts-expect-error Kbd renders a single key; use KbdGroup for sequences
    const sequenceProps: KbdProps = { value: ['Ctrl', 'K'] }

    expect(invalidSizeProps).toBeDefined()
    expect(sequenceProps).toBeDefined()
  })

  test('applies top-level class and style to keycap', () => {
    const view = render(() => <Kbd value="K" class="shortcut" style={{ width: '200px' }} />)
    const item = view.container.querySelector('[data-slot="kbd"]') as HTMLElement | null

    expect(item?.className).toContain('shortcut')
    expect(item?.style.width).toBe('200px')
  })
})

describe('KbdGroup', () => {
  test('renders simultaneous keys from value with dividers', () => {
    const view = render(() => <KbdGroup value={['Ctrl', 'Shift', 'P']} />)
    const root = view.container.querySelector('[data-slot="root"]')
    const chord = view.container.querySelector('[data-slot="chord"]')
    const items = view.container.querySelectorAll('[data-slot="kbd"]')
    const dividers = view.container.querySelectorAll('[data-slot="divider"]')

    expect(root?.tagName).toBe('SPAN')
    expect(chord?.tagName).toBe('SPAN')
    expect(items.length).toBe(3)
    expect(items.item(0)?.textContent).toBe('Ctrl')
    expect(items.item(1)?.textContent).toBe('Shift')
    expect(items.item(2)?.textContent).toBe('P')
    expect(dividers.length).toBe(2)
    expect(dividers.item(0)?.textContent).toBe('+')
  })

  test('renders accessible text items', () => {
    render(() => <KbdGroup value={[{ value: 'Cmd', label: 'Command' }, 'K']} />)

    expect(screen.getByLabelText('Command').textContent).toBe('Cmd')
  })

  test('renders ordered sequences with custom dividers', () => {
    const view = render(() => (
      <KbdGroup
        sequence={[
          [{ value: 'Ctrl', label: 'Control' }, 'K'],
          ['Ctrl', 'S'],
        ]}
        divider={(ctx) => <span data-index={ctx.index}>plus</span>}
        sequenceDivider={(ctx) => <span data-index={ctx.index}>then</span>}
      />
    ))

    expect(view.container.querySelectorAll('[data-slot="chord"]').length).toBe(2)
    expect(view.container.querySelector('[data-slot="divider"]')?.textContent).toBe('plus')
    expect(view.container.querySelector('[data-slot="sequence-divider"]')?.textContent).toBe('then')
  })

  test('rejects invalid group props in type contract', () => {
    // @ts-expect-error value requires at least one key
    const emptyValueProps: KbdGroupProps = { value: [] }
    // @ts-expect-error sequence requires at least one non-empty chord
    const emptySequenceProps: KbdGroupProps = { sequence: [] }
    // @ts-expect-error value and sequence are mutually exclusive
    const mixedProps: KbdGroupProps = { value: ['Ctrl'], sequence: [['Ctrl', 'S']] }
    // @ts-expect-error sequence must be an array of chords
    const flatSequenceProps: KbdGroupProps = { sequence: ['Ctrl', 'S'] }

    expect(emptyValueProps).toBeDefined()
    expect(emptySequenceProps).toBeDefined()
    expect(mixedProps).toBeDefined()
    expect(flatSequenceProps).toBeDefined()
  })

  test('applies group and item slot customizations', () => {
    const view = render(() => (
      <KbdGroup
        value={['Ctrl', 'K']}
        class="root-class"
        style={{ width: '200px' }}
        classes={{ chord: 'chord-class', item: 'item-class', divider: 'divider-class' }}
        styles={{ item: { height: '20px' }, divider: { width: '10px' } }}
      />
    ))
    const root = view.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const chord = view.container.querySelector('[data-slot="chord"]')
    const item = view.container.querySelector('[data-slot="kbd"]') as HTMLElement | null
    const divider = view.container.querySelector('[data-slot="divider"]') as HTMLElement | null

    expect(root?.className).toContain('root-class')
    expect(root?.style.width).toBe('200px')
    expect(chord?.className).toContain('chord-class')
    expect(item?.className).toContain('item-class')
    expect(item?.style.height).toBe('20px')
    expect(divider?.className).toContain('divider-class')
    expect(divider?.style.width).toBe('10px')
  })
})
