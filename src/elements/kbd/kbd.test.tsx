import { render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'

import { Kbd } from './kbd'
import { KbdGroup } from './kbd-group'

describe('Kbd', () => {
  test('renders component defaults when provider is absent', () => {
    const view = render(() => <Kbd value="K" />)
    const root = view.container.querySelector('[data-slot="root"]')
    expect(root?.className).not.toBe('')
  })

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
      const view = render(() => (
        <MoraineProvider>
          <Kbd size={size} value={size} />
        </MoraineProvider>
      ))
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

  test('applies root slot overrides without leaking style props to the DOM', () => {
    const view = render(() => (
      <Kbd
        value="K"
        classes={{ root: 'slot-class' }}
        styles={{ root: { height: '18px', color: 'blue' } }}
        class="native-class"
        style={{ width: '20px', color: 'red' }}
      />
    ))
    const root = view.container.querySelector<HTMLElement>('[data-slot="root"]')!

    expect(root.className).toContain('slot-class')
    expect(root.className).toContain('native-class')
    expect(root.style.height).toBe('18px')
    expect(root.style.width).toBe('20px')
    expect(root.style.color).toBe('red')
    expect(root.hasAttribute('classes')).toBe(false)
    expect(root.hasAttribute('styles')).toBe(false)
  })

  test('replaces Design root styling without remounting the keycap', () => {
    const [design, setDesign] = createSignal(defineTheme({ kbd: { base: { root: 'p-2' } } }))
    const view = render(() => (
      <MoraineProvider theme={design()}>
        <Kbd value="K" />
      </MoraineProvider>
    ))
    const root = view.container.querySelector<HTMLElement>('[data-slot="root"]')!

    expect(root.className).toContain('p-2')

    setDesign(defineTheme({ kbd: { base: { root: 'p-4' } } }))

    expect(view.container.querySelector('[data-slot="root"]')).toBe(root)
    expect(root.className).toContain('p-4')
    expect(root.className).not.toContain('p-2')
  })
})

describe('KbdGroup', () => {
  test('renders the styled semantic kbd root when provider is absent', () => {
    const view = render(() => <KbdGroup items={['Ctrl', 'K']} />)
    const root = view.container.querySelector('[data-slot="root"]')

    expect(root?.tagName).toBe('KBD')
    expect(root?.className).not.toBe('')
    expect(view.container.querySelector('[data-slot="chord"]')).toBeNull()
  })

  test('renders default inline separators without separator semantics', () => {
    const view = render(() => <KbdGroup items={['Ctrl', 'Shift', 'P']} />)
    const items = view.container.querySelectorAll('[data-slot="item"]')
    const root = view.container.querySelector('[data-slot="root"]')

    expect([...items].map((item) => item.textContent)).toEqual(['Ctrl', '⇧', 'P'])
    expect(root?.textContent).toBe('Ctrl+⇧+P')
    expect(view.container.querySelector('[role="separator"]')).toBeNull()
    expect(view.container.querySelector('[aria-orientation]')).toBeNull()
    expect(view.container.querySelector('[data-slot="separator"]')).toBeNull()
  })

  test('renders item objects with accessible labels', () => {
    render(() => <KbdGroup items={[{ value: 'Cmd', label: 'Command key' }, 'K']} />)

    expect(screen.getByLabelText('Command key').textContent).toBe('Cmd')
  })

  test('renders nothing for empty items and no separator for a single item', () => {
    const empty = render(() => <KbdGroup items={[]} />)
    const single = render(() => <KbdGroup items={['K']} separator="/" />)

    expect(empty.container.querySelector('[data-slot="root"]')).toBeNull()
    expect(single.container.querySelectorAll('[data-slot="item"]')).toHaveLength(1)
    expect(single.container.querySelector('[data-slot="root"]')?.textContent).toBe('K')
  })

  test('supports custom string and JSX separators', () => {
    const stringSeparator = render(() => <KbdGroup items={['Ctrl', 'K']} separator="/" />)
    const jsxSeparator = render(() => (
      <KbdGroup
        items={['Ctrl', 'Shift', 'P']}
        separator={<span data-testid="custom-separator">·</span>}
      />
    ))

    expect(stringSeparator.container.querySelector('[data-slot="root"]')?.textContent).toBe(
      'Ctrl/K',
    )
    expect(jsxSeparator.getAllByTestId('custom-separator')).toHaveLength(2)
    expect(jsxSeparator.container.querySelector('[data-slot="root"]')?.textContent).toBe('Ctrl·⇧·P')
  })

  test('propagates size and variant to generated Kbd items', () => {
    const view = render(() => (
      <MoraineProvider>
        <KbdGroup items={['Ctrl', 'K']} size="sm" variant="outline" />
      </MoraineProvider>
    ))
    const items = view.container.querySelectorAll('[data-slot="item"]')

    for (const item of items) {
      expect(item.className).toContain('h-4.5')
      expect(item.className).toContain('border-b-2')
    }
  })

  test.each([
    ['sm', 'text-[10px]', 'h-4.5'],
    ['md', 'text-xs', 'h-5'],
    ['lg', 'text-sm', 'h-5.5'],
  ] as const)(
    'applies %s size to group root and propagates resolved size to child keycaps',
    (size, rootText, itemHeight) => {
      const view = render(() => (
        <MoraineProvider>
          <KbdGroup items={['Ctrl', 'K']} size={size} />
        </MoraineProvider>
      ))
      const root = view.container.querySelector('[data-slot="root"]')
      const items = view.container.querySelectorAll('[data-slot="item"]')

      expect(root?.className).toContain(rootText)
      for (const item of items) {
        expect(item.className).toContain(itemHeight)
      }
    },
  )

  test('applies root and item slot customizations', () => {
    const view = render(() => (
      <KbdGroup
        items={['Ctrl', 'K']}
        class="root-class"
        style={{ width: '200px' }}
        classes={{ item: 'item-class' }}
        styles={{ item: { height: '20px' } }}
      />
    ))
    const root = view.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const item = view.container.querySelector('[data-slot="item"]') as HTMLElement | null

    expect(root?.className).toContain('root-class')
    expect(root?.style.width).toBe('200px')
    expect(item?.className).toContain('item-class')
    expect(item?.style.height).toBe('20px')
  })

  test('reacts to item changes', () => {
    const [items, setItems] = createSignal(['Ctrl', 'K'])
    const view = render(() => <KbdGroup items={items()} />)

    expect(view.container.querySelector('[data-slot="root"]')?.textContent).toBe('Ctrl+K')
    setItems(['Shift', 'P'])
    expect(view.container.querySelector('[data-slot="root"]')?.textContent).toBe('⇧+P')
  })
})
