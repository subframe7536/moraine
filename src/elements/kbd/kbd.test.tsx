import { render, screen } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Kbd } from './kbd'
import type { KbdProps, KbdT } from './kbd'
import { KbdGroup } from './kbd-group'
import type { KbdGroupProps } from './kbd-group'

describe('Kbd', () => {
  test('renders a keycap in the root slot', () => {
    const view = render(() => <Kbd value="K" />)
    const root = view.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('KBD')
    expect(root?.textContent).toBe('K')
  })

  test.each([
    ['meta', '⌘', 'Meta'],
    ['COMMAND', '⌘', 'Command'],
    ['ctrl', 'Ctrl', 'Control'],
    ['control', '⌃', 'Control'],
    ['alt', 'Alt', 'Alt'],
    ['option', '⌥', 'Option'],
    ['shift', '⇧', 'Shift'],
    ['enter', '↵', 'Enter'],
    ['delete', '⌦', 'Delete'],
    ['backspace', '⌫', 'Backspace'],
    ['escape', 'Esc', 'Escape'],
    ['tab', '⇥', 'Tab'],
    ['capslock', '⇪', 'Caps Lock'],
    ['arrowup', '↑', 'Arrow Up'],
    ['arrowright', '→', 'Arrow Right'],
    ['arrowdown', '↓', 'Arrow Down'],
    ['arrowleft', '←', 'Arrow Left'],
    ['pageup', '⇞', 'Page Up'],
    ['pagedown', '⇟', 'Page Down'],
    ['home', '↖', 'Home'],
    ['end', '↘', 'End'],
    ['win', '⊞', 'Windows'],
  ])('resolves the %s alias', (value, text, label) => {
    render(() => <Kbd value={value} />)

    expect(screen.getByLabelText(label).textContent).toBe(text)
  })

  test('preserves unknown values and lets an explicit label override an alias label', () => {
    const view = render(() => (
      <div>
        <Kbd value="F13" />
        <Kbd value="meta" label="Primary modifier" />
      </div>
    ))

    expect(view.container.querySelector('[data-slot="root"]')?.textContent).toBe('F13')
    expect(screen.getByLabelText('Primary modifier').textContent).toBe('⌘')
  })

  test('renders the raw key when symbol aliases are disabled', () => {
    const view = render(() => <Kbd value="meta" symbol={false} />)
    const root = view.container.querySelector('[data-slot="root"]')

    expect(root?.textContent).toBe('meta')
    expect(root?.getAttribute('aria-label')).toBeNull()
  })

  test('does not render an empty value', () => {
    const view = render(() => <Kbd value="" />)

    expect(view.container.querySelector('[data-slot="root"]')).toBeNull()
  })

  test('applies size classes on keycaps', () => {
    const sizes = [
      ['xs', 'h-3'],
      ['sm', 'h-4'],
      ['md', 'h-4.5'],
      ['lg', 'h-5'],
      ['xl', 'h-5.5'],
    ] as const

    for (const [size, expectedClass] of sizes) {
      const view = render(() => <Kbd size={size} value={size} />)
      expect(view.container.querySelector('[data-slot="root"]')?.className).toContain(expectedClass)
    }
  })

  test('supports a custom slot, class, style, and root slot overrides', () => {
    const view = render(() => (
      <Kbd
        value="K"
        slotName="shortcut"
        class="shortcut-class"
        style={{ width: '200px' }}
        classes={{ root: 'root-class' }}
        styles={{ root: { height: '20px' } }}
      />
    ))
    const root = view.container.querySelector('[data-slot="shortcut"]') as HTMLElement | null

    expect(root?.className).toContain('shortcut-class')
    expect(root?.className).toContain('root-class')
    expect(root?.style.width).toBe('200px')
    expect(root?.style.height).toBe('20px')
  })

  test('rejects invalid props in the type contract', () => {
    const aliasKey: KbdT.Key = 'meta'
    const rawKey: KbdT.Key = 'F13'
    const dynamicValue: string = 'MediaPlayPause'
    const dynamicKey: KbdT.Key = dynamicValue
    // @ts-expect-error value is required
    const missingValueProps: KbdProps = {}
    // @ts-expect-error size must be a declared Kbd size
    const invalidSizeProps: KbdProps = { size: 'invalid', value: 'K' }
    // @ts-expect-error key values must be strings
    const invalidValueProps: KbdProps = { value: 13 }

    expect(aliasKey).toBe('meta')
    expect(rawKey).toBe('F13')
    expect(dynamicKey).toBe('MediaPlayPause')
    expect(missingValueProps).toBeDefined()
    expect(invalidSizeProps).toBeDefined()
    expect(invalidValueProps).toBeDefined()
  })
})

describe('KbdGroup', () => {
  test('renders simultaneous items with dividers', () => {
    const view = render(() => <KbdGroup items={['Ctrl', 'Shift', 'P']} />)
    const items = view.container.querySelectorAll('[data-slot="item"]')
    const dividers = view.container.querySelectorAll('[data-slot="divider"]')

    expect(view.container.querySelector('[data-slot="root"]')?.tagName).toBe('SPAN')
    expect(view.container.querySelector('[data-slot="chord"]')?.tagName).toBe('SPAN')
    expect([...items].map((item) => item.textContent)).toEqual(['Ctrl', '⇧', 'P'])
    expect(dividers.length).toBe(2)
    expect(dividers.item(0)?.textContent).toBe('+')
  })

  test('renders item objects with accessible labels', () => {
    render(() => <KbdGroup items={[{ value: 'Cmd', label: 'Command key' }, 'K']} />)

    expect(screen.getByLabelText('Command key').textContent).toBe('Cmd')
  })

  test('renders a sequence with custom dividers and indexes', () => {
    const dividerRender = vi.fn((ctx: { index: number }) => <span>plus-{ctx.index}</span>)
    const sequenceDividerRender = vi.fn((ctx: { index: number }) => <span>then-{ctx.index}</span>)
    const view = render(() => (
      <KbdGroup
        sequence={[
          ['Ctrl', 'K'],
          ['Ctrl', 'S'],
        ]}
        dividerRender={dividerRender}
        sequenceDividerRender={sequenceDividerRender}
      />
    ))

    expect(view.container.querySelectorAll('[data-slot="chord"]')).toHaveLength(2)
    expect(view.container.querySelector('[data-slot="divider"]')?.textContent).toBe('plus-0')
    expect(view.container.querySelector('[data-slot="sequenceDivider"]')?.textContent).toBe(
      'then-0',
    )
    expect(dividerRender).toHaveBeenCalledTimes(2)
    expect(sequenceDividerRender).toHaveBeenCalledOnce()
  })

  test('prefers sequence when items and sequence are both provided', () => {
    const view = render(() => <KbdGroup items={['Ignored']} sequence={[['Ctrl', 'S']]} />)

    expect(view.container.textContent).not.toContain('Ignored')
    expect(view.container.querySelectorAll('[data-slot="item"]')).toHaveLength(2)
  })

  test('renders nothing for empty items and empty sequence groups', () => {
    const emptyItems = render(() => <KbdGroup items={[]} />)
    const emptySequence = render(() => <KbdGroup sequence={[[], []]} />)

    expect(emptyItems.container.querySelector('[data-slot="root"]')).toBeNull()
    expect(emptySequence.container.querySelector('[data-slot="root"]')).toBeNull()
  })

  test('applies group and item slot customizations', () => {
    const view = render(() => (
      <KbdGroup
        items={['Ctrl', 'K']}
        class="root-class"
        style={{ width: '200px' }}
        classes={{ chord: 'chord-class', item: 'item-class', divider: 'divider-class' }}
        styles={{ item: { height: '20px' }, divider: { width: '10px' } }}
      />
    ))
    const root = view.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const item = view.container.querySelector('[data-slot="item"]') as HTMLElement | null
    const divider = view.container.querySelector('[data-slot="divider"]') as HTMLElement | null

    expect(root?.className).toContain('root-class')
    expect(root?.style.width).toBe('200px')
    expect(view.container.querySelector('[data-slot="chord"]')?.className).toContain('chord-class')
    expect(item?.className).toContain('item-class')
    expect(item?.style.height).toBe('20px')
    expect(divider?.className).toContain('divider-class')
    expect(divider?.style.width).toBe('10px')
  })

  test('accepts items and sequence in the type contract', () => {
    const itemsProps: KbdGroupProps = { items: ['Ctrl', { value: 'K' }] }
    const sequenceProps: KbdGroupProps = {
      sequence: [
        ['Ctrl', 'K'],
        ['Ctrl', 'S'],
      ],
    }
    const combinedProps: KbdGroupProps = { items: ['Ignored'], sequence: [['Ctrl', 'S']] }
    // @ts-expect-error item objects require value
    const invalidItemProps: KbdGroupProps = { items: [{ label: 'Missing value' }] }
    // @ts-expect-error sequence must contain arrays of items
    const flatSequenceProps: KbdGroupProps = { sequence: ['Ctrl', 'S'] }

    expect(itemsProps).toBeDefined()
    expect(sequenceProps).toBeDefined()
    expect(combinedProps).toBeDefined()
    expect(invalidItemProps).toBeDefined()
    expect(flatSequenceProps).toBeDefined()
  })
})
