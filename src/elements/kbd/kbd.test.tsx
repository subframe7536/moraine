import { render, screen } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Kbd } from './kbd'
import { KbdGroup } from './kbd-group'

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
      ['sm', 'h-4.5'],
      ['md', 'h-5'],
      ['lg', 'h-5.5'],
    ] as const

    for (const [size, expectedClass] of sizes) {
      const view = render(() => <Kbd size={size} value={size} />)
      expect(view.container.querySelector('[data-slot="root"]')?.className).toContain(expectedClass)
    }
  })

  test('supports a custom slot, class, and style overrides', () => {
    const view = render(() => (
      <Kbd value="K" slotName="shortcut" class="shortcut-class" style={{ width: '200px' }} />
    ))
    const root = view.container.querySelector('[data-slot="shortcut"]') as HTMLElement | null

    expect(root?.className).toContain('shortcut-class')
    expect(root?.style.width).toBe('200px')
  })
})

describe('KbdGroup', () => {
  test('accepts static JSX for divider renderers', () => {
    const view = render(() => (
      <KbdGroup items={['Ctrl', 'K']} dividerRender={<span data-testid="divider">and</span>} />
    ))

    expect(view.getByTestId('divider').textContent).toBe('and')
    expect(view.container.querySelector('[data-slot="root"]')?.hasAttribute('dividerrender')).toBe(
      false,
    )
  })

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
})
